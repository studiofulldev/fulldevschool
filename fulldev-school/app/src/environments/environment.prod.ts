// Production: inject credentials via public/runtime-config.js at deploy time
// See public/runtime-config.example.js for the expected shape
export const environment = {
  production: true,
  supabase: {
    url: '',
    publishableKey: ''
  }
};
