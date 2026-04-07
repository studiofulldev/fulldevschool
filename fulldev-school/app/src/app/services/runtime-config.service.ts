import { Injectable } from '@angular/core';

export interface AzureSpeechRuntimeConfig {
  key: string;
  region: string;
  voice?: string;
}

export interface SupabaseRuntimeConfig {
  url: string;
  anonKey: string;
}

declare global {
  interface Window {
    __FULLDEV_SCHOOL_CONFIG__?: {
      azureSpeech?: AzureSpeechRuntimeConfig;
      supabase?: SupabaseRuntimeConfig;
    };
  }
}

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  get azureSpeech(): AzureSpeechRuntimeConfig | null {
    const globalConfig = window.__FULLDEV_SCHOOL_CONFIG__?.azureSpeech;
    if (globalConfig?.key && globalConfig.region) {
      return globalConfig;
    }

    const key = localStorage.getItem('fds.azure.key');
    const region = localStorage.getItem('fds.azure.region');
    const voice = localStorage.getItem('fds.azure.voice') ?? 'pt-BR-FranciscaNeural';

    if (!key || !region) {
      return null;
    }

    return { key, region, voice };
  }

  get supabase(): SupabaseRuntimeConfig | null {
    const globalConfig = window.__FULLDEV_SCHOOL_CONFIG__?.supabase;
    if (globalConfig?.url && globalConfig.anonKey) {
      return globalConfig;
    }

    const url = localStorage.getItem('fds.supabase.url');
    const anonKey = localStorage.getItem('fds.supabase.anonKey');

    if (!url || !anonKey) {
      return null;
    }

    return { url, anonKey };
  }
}
