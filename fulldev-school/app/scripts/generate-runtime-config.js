#!/usr/bin/env node
// Gera public/runtime-config.js a partir de variáveis de ambiente.
// Executado pelo Vercel antes do build Angular (ver vercel.json buildCommand).
//
// Variáveis obrigatórias no painel do Vercel:
//   SUPABASE_URL             — Project URL (Settings → API → Project URL)
//   SUPABASE_PUBLISHABLE_KEY — anon/public key (Settings → API → Project API Keys)
//
// Variáveis opcionais:
//   POSTHOG_API_KEY          — Project API Key do PostHog (começa com phc_)
//                              Sem ela o tracking é silenciosamente desativado.

const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const posthogApiKey = process.env.POSTHOG_API_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[generate-runtime-config] ERRO: variáveis de ambiente SUPABASE_URL e ' +
    'SUPABASE_PUBLISHABLE_KEY são obrigatórias.'
  );
  process.exit(1);
}

if (!posthogApiKey) {
  console.warn(
    '[generate-runtime-config] AVISO: POSTHOG_API_KEY não definida — ' +
    'tracking de eventos desativado neste deploy.'
  );
}

const content = `window.__FULLDEV_SCHOOL_CONFIG__ = {
  supabase: {
    url: '${supabaseUrl}',
    publishableKey: '${supabaseKey}'
  },
  posthog: {
    apiKey: '${posthogApiKey}'
  }
};
`;

const outputPath = path.join(__dirname, '..', 'public', 'runtime-config.js');
fs.writeFileSync(outputPath, content, 'utf8');
console.log('[generate-runtime-config] public/runtime-config.js gerado com sucesso.');
