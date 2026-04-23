import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const FUNCTIONS_DIR = '/home/deno/functions';

serve(async (req: Request) => {
  const url = new URL(req.url);
  // Path: /sync-pr-data or /sync-pr-data/...
  const functionName = url.pathname.split('/')[1];
  if (!functionName) {
    return new Response('Not found', { status: 404 });
  }
  try {
    const mod = await import(`${FUNCTIONS_DIR}/${functionName}/index.ts`);
    return mod.default(req);
  } catch {
    return new Response(`Function "${functionName}" not found`, { status: 404 });
  }
});
