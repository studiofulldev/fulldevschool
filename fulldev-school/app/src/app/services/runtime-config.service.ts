import { Injectable } from '@angular/core';

export interface AzureSpeechRuntimeConfig {
  key: string;
  region: string;
  voice?: string;
}

export interface SupabaseRuntimeConfig {
  url: string;
  anonKey: string;
  publishableKey?: string;
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
  constructor() {
    // Freeze the global config object to prevent third-party scripts from
    // overwriting credentials after they have been read.
    const config = window.__FULLDEV_SCHOOL_CONFIG__;
    if (config && !Object.isFrozen(config)) {
      Object.freeze(config);
      if (config.azureSpeech) Object.freeze(config.azureSpeech);
      if (config.supabase) Object.freeze(config.supabase);
    }
  }

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
    const globalKey = globalConfig?.publishableKey || globalConfig?.anonKey;
    if (globalConfig?.url && globalKey) {
      return { url: globalConfig.url, anonKey: globalKey, publishableKey: globalConfig.publishableKey };
    }

    const url = localStorage.getItem('fds.supabase.url');
    const anonKey = localStorage.getItem('fds.supabase.publishableKey') || localStorage.getItem('fds.supabase.anonKey');

    if (!url || !anonKey) {
      return null;
    }

    return { url, anonKey };
  }
}
