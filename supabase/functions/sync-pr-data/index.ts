import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GitHubPr {
  number: number;
  title: string;
  body: string | null;
  state: string;
  merged_at: string | null;
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

      const updates = buildUpdates(ghData);
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
    if (!ghData) {
      return new Response(JSON.stringify({ error: 'private_or_not_found' }), {
        status: 404,
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
        ...buildUpdates(ghData),
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

    // +5 MP for first PR submission (idempotent via unique constraint)
    try {
      await supabase.rpc('credit_mentor_points', {
        p_user_id: user.id,
        p_points: 5,
        p_reason: 'pr_submitted',
        p_reference_id: submission.id as string,
      });
    } catch { /* non-critical — ignore MP credit errors */ }

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
): Promise<GitHubPr | null> {
  const pat = Deno.env.get('GITHUB_PAT');
  const headers: Record<string, string> = {
    'User-Agent': 'fulldev-school',
    'Accept': 'application/vnd.github.v3+json',
  };
  if (pat) headers['Authorization'] = `Bearer ${pat}`;

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    { headers },
  );
  if (!res.ok) return null;
  return res.json();
}

function buildUpdates(gh: GitHubPr) {
  const state = gh.merged_at ? 'merged' : gh.state;
  return {
    pr_title: gh.title,
    pr_body: gh.body ?? '',
    pr_state: state,
    repo_language: gh.head.repo?.language ?? null,
    github_synced_at: new Date().toISOString(),
  };
}
