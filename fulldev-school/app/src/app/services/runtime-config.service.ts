import { Injectable } from '@angular/core';

export interface AzureSpeechRuntimeConfig {
  key: string;
  region: string;
  voice?: string;
}

declare global {
  interface Window {
    __FULLDEV_SCHOOL_CONFIG__?: {
      azureSpeech?: AzureSpeechRuntimeConfig;
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
}
