// Local dev: set credentials via public/runtime-config.js (gitignored)
// or via localStorage keys fds.supabase.url + fds.supabase.publishableKey
export const environment = {
  production: false,
  supabase: {
    url: '',
    publishableKey: ''
  },
  posthog: {
    apiKey: '', // filled via runtime-config.js in dev/prod
    host: 'https://eu.i.posthog.com'
  }
};
