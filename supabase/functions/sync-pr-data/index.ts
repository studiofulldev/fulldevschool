import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Batch sync TTL: don't re-sync a PR that was synced less than 10 minutes ago
// (user-triggered sync uses 5 min TTL; batch uses 10 min to reduce GitHub API load).
const BATCH_SYNC_TTL_MS = 10 * 60 * 1000;

interface GitHubPr {
  number: number;
  title: string;
  body: string | null;
  state: string;
  merged_at: string | null;
  user: { login: string };
  head: { repo: { language: string | null; name: string; owner: { login: string } } | null };
}

function parsePrUrl(url: string): { owner: string; repo: string; prNumber: number } | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'github.com') return null;
    const match = parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/);
    if (!match) return null;
    return { owner: match[1], repo: match[2], prNumber: parseInt(match[3], 10) };
  } catch {
    return null;
  }
}

// Generate a service_role JWT signed with JWT_SECRET so PostgREST accepts it.
// SUPABASE_SERVICE_ROLE_KEY is the Supabase-generated key (correct in Cloud, but
// mismatched in local Docker where it uses demo keys). Generating from JWT_SECRET
// works in both environments.
async function makeSvcJwt(): Promise<string> {
  const secret = Deno.env.get('JWT_SECRET')!;
  const b64url = (data: string | Uint8Array): string => {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: 'supabase',
    role: 'service_role',
    exp: Math.floor(Date.now() / 1000) + 3600,
  }));
  const sigInput = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(sigInput));
  return `${sigInput}.${b64url(new Uint8Array(sigBytes))}`;
}

// Service client: uses anon key as apikey (Kong key-auth) but overrides Authorization
// with a correctly-signed service_role JWT. PostgREST sees service_role → bypasses RLS.
async function makeSvcClient(): Promise<SupabaseClient> {
  const token = await makeSvcJwt();
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: {
      fetch: (url, init = {}) => {
        const h = new Headers(init.headers);
        h.set('Authorization', `Bearer ${token}`);
        return fetch(url, { ...init, headers: h });
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Sync all open, active PRs that haven't been synced in the last BATCH_SYNC_TTL_MS.
async function batchSync(): Promise<void> {
  try {
    const supabase = await makeSvcClient();
    const cutoff = new Date(Date.now() - BATCH_SYNC_TTL_MS).toISOString();

    const { data: prs, error } = await supabase
      .from('pr_submissions')
      .select('id, github_pr_url, github_synced_at')
      .eq('is_active', true)
      .eq('pr_state', 'open')
      .or(`github_synced_at.is.null,github_synced_at.lt.${cutoff}`);

    if (error || !prs?.length) return;

    console.log(`[batchSync] syncing ${prs.length} open PRs`);

    for (const pr of prs) {
      const coords = parsePrUrl(pr.github_pr_url);
      if (!coords) continue;

      const ghData = await fetchGitHubPr(coords.owner, coords.repo, coords.prNumber);
      if (!ghData || ghData === 'rate_limited') continue;

      await supabase
        .from('pr_submissions')
        .update(buildUpdates(ghData.pr, ghData.reviewCount))
        .eq('id', pr.id);
    }

    console.log(`[batchSync] done`);
  } catch (err) {
    console.error('[batchSync] error:', err);
  }
}

// Run batch sync every 2 minutes.
Deno.cron('sync-open-prs', '*/2 * * * *', batchSync);

Deno.serve({ port: 9999, hostname: '0.0.0.0' }, async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

    // adminClient: service_role key → used ONLY for auth.getUser() (hits GoTrue, not PostgREST)
    // PostgREST is NOT involved here, so the JWT signature mismatch is irrelevant.
    const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await adminClient.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // userClient: anon key (passes Kong key-auth) + custom fetch that overrides Authorization
    // at the HTTP layer, AFTER Supabase's _getAuthHeaders() runs. This is necessary because
    // Supabase JS v2 overwrites Authorization in _getAuthHeaders() with the api key when no
    // session is in memory — global.headers.Authorization gets stomped. The custom fetch
    // runs last, so PostgREST receives the user's GoTrue-issued JWT (valid against local secret).
    const userToken = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        fetch: (url, init = {}) => {
          const h = new Headers(init.headers);
          h.set('Authorization', `Bearer ${userToken}`);
          return fetch(url, { ...init, headers: h });
        },
      },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json();
    const { prUrl, submissionId } = body as { prUrl?: string; submissionId?: string };

    // Resync existing submission
    if (submissionId) {
      const { data: existing } = await supabase
        .from('pr_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (!existing) {
        return new Response(JSON.stringify({ error: 'not_found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Respect 5-min sync TTL
      if (existing.github_synced_at) {
        const lastSync = new Date(existing.github_synced_at).getTime();
        if (Date.now() - lastSync < 5 * 60 * 1000) {
          return new Response(JSON.stringify(existing), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      const coords = parsePrUrl(existing.github_pr_url);
      if (!coords) {
        return new Response(JSON.stringify({ error: 'invalid_url' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const ghData = await fetchGitHubPr(coords.owner, coords.repo, coords.prNumber);
      if (!ghData) {
        return new Response(JSON.stringify(existing), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (ghData === 'rate_limited') {
        return new Response(JSON.stringify({ error: 'rate_limited' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const updates = buildUpdates(ghData.pr, ghData.reviewCount);
      const { data: updated } = await supabase
        .from('pr_submissions')
        .update(updates)
        .eq('id', submissionId)
        .select()
        .single();

      return new Response(JSON.stringify(updated), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // New submission
    if (!prUrl) {
      return new Response(JSON.stringify({ error: 'pr_url_required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const coords = parsePrUrl(prUrl);
    if (!coords) {
      return new Response(JSON.stringify({ error: 'invalid_url' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ghData = await fetchGitHubPr(coords.owner, coords.repo, coords.prNumber);
    if (ghData === 'rate_limited') {
      return new Response(JSON.stringify({ error: 'rate_limited' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!ghData) {
      return new Response(JSON.stringify({ error: 'private_or_not_found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enforce ownership: PR author must match the user's registered GitHub username.
    const { data: profile } = await supabase
      .from('profiles')
      .select('github_username')
      .eq('id', user.id)
      .single();

    const registeredUsername = profile?.github_username?.trim().toLowerCase();
    if (!registeredUsername) {
      return new Response(JSON.stringify({ error: 'github_username_not_set' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (ghData.pr.user.login.toLowerCase() !== registeredUsername) {
      return new Response(JSON.stringify({ error: 'not_your_pr' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: submission, error: insertError } = await supabase
      .from('pr_submissions')
      .insert({
        user_id: user.id,
        github_pr_url: prUrl,
        repo_owner: coords.owner,
        repo_name: coords.repo,
        pr_number: coords.prNumber,
        ...buildUpdates(ghData.pr, ghData.reviewCount),
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return new Response(JSON.stringify({ error: 'already_submitted' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw insertError;
    }

    // +5 MP for first PR submission (idempotent via unique constraint).
    // Fire-and-forget: don't block the response. Uses service client so the call
    // always reaches PostgREST regardless of user-JWT edge cases in local Docker.
    makeSvcClient()
      .then(svc => svc.rpc('credit_mentor_points', {
        p_user_id: user.id,
        p_points: 5,
        p_reason: 'pr_submitted',
        p_reference_id: submission.id as string,
      }))
      .then(({ error }) => { if (error) console.error('[sync-pr-data] credit_mentor_points error:', error); })
      .catch(err => console.error('[sync-pr-data] credit_mentor_points threw:', err));

    return new Response(JSON.stringify(submission), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('sync-pr-data error:', err);
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchGitHubPr(
  owner: string,
  repo: string,
  prNumber: number,
): Promise<{ pr: GitHubPr; reviewCount: number } | null | 'rate_limited'> {
  const pat = Deno.env.get('GITHUB_PAT');
  const headers: Record<string, string> = {
    'User-Agent': 'fulldev-school',
    'Accept': 'application/vnd.github.v3+json',
  };
  if (pat) headers['Authorization'] = `Bearer ${pat}`;

  const base = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;
  const signal = AbortSignal.timeout(12_000);
  const [prRes, reviewsRes] = await Promise.all([
    fetch(base, { headers, signal }),
    fetch(`${base}/reviews?per_page=100`, { headers, signal }),
  ]);

  if (prRes.status === 403) {
    const remaining = prRes.headers.get('X-RateLimit-Remaining');
    if (remaining === '0') return 'rate_limited';
    return null;
  }

  if (!prRes.ok) return null;
  const pr: GitHubPr = await prRes.json();
  const reviews: unknown[] = reviewsRes.ok ? await reviewsRes.json() : [];
  const reviewCount = Array.isArray(reviews) ? reviews.length : 0;

  return { pr, reviewCount };
}

function buildUpdates(gh: GitHubPr, reviewCount: number) {
  const state = gh.merged_at ? 'merged' : gh.state;
  return {
    pr_title: gh.title,
    pr_body: gh.body ?? '',
    pr_state: state,
    repo_language: gh.head.repo?.language ?? null,
    review_count: reviewCount,
    github_synced_at: new Date().toISOString(),
  };
}
