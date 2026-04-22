import { describe, it, expect } from 'vitest';
import {
  validateSocialHandle,
  buildSocialUrl,
  stripSocialPrefix,
  SOCIAL_PREFIXES,
} from './social-links.utils';

describe('validateSocialHandle', () => {
  describe('happy path — handles válidos', () => {
    it('aceita handle simples', () => {
      expect(validateSocialHandle('github', 'johndoe')).toBe(true);
    });

    it('aceita handle com hífen e underscore', () => {
      expect(validateSocialHandle('instagram', 'john_doe-99')).toBe(true);
    });

    it('aceita string vazia (campo opcional)', () => {
      expect(validateSocialHandle('github', '')).toBe(true);
    });

    it('aceita string só de espaços como vazia', () => {
      expect(validateSocialHandle('github', '   ')).toBe(true);
    });
  });

  describe('edge cases — handles inválidos', () => {
    it('rejeita handle com barra (URL colada)', () => {
      expect(validateSocialHandle('github', 'johndoe/repo')).toBe(false);
    });

    it('rejeita handle com protocolo https://', () => {
      expect(validateSocialHandle('github', 'https://github.com/johndoe')).toBe(false);
    });

    it('rejeita handle com protocolo http://', () => {
      expect(validateSocialHandle('linkedin', 'http://linkedin.com/in/johndoe')).toBe(false);
    });

    it('rejeita handle com espaço interno', () => {
      expect(validateSocialHandle('instagram', 'john doe')).toBe(false);
    });
  });
});

describe('buildSocialUrl', () => {
  it('constrói URL completa para GitHub', () => {
    expect(buildSocialUrl('github', 'johndoe')).toBe('https://github.com/johndoe');
  });

  it('constrói URL completa para LinkedIn', () => {
    expect(buildSocialUrl('linkedin', 'johndoe')).toBe('https://linkedin.com/in/johndoe');
  });

  it('constrói URL completa para Instagram', () => {
    expect(buildSocialUrl('instagram', 'johndoe')).toBe('https://instagram.com/johndoe');
  });

  it('constrói URL completa para YouTube com @', () => {
    expect(buildSocialUrl('youtube', 'johndoe')).toBe('https://youtube.com/@johndoe');
  });

  it('retorna string vazia para handle vazio', () => {
    expect(buildSocialUrl('github', '')).toBe('');
    expect(buildSocialUrl('github', '   ')).toBe('');
  });
});

describe('stripSocialPrefix', () => {
  it('extrai handle de URL GitHub', () => {
    expect(stripSocialPrefix('github', 'https://github.com/johndoe')).toBe('johndoe');
  });

  it('extrai handle de URL LinkedIn', () => {
    expect(stripSocialPrefix('linkedin', 'https://linkedin.com/in/johndoe')).toBe('johndoe');
  });

  it('extrai handle de URL YouTube com @', () => {
    expect(stripSocialPrefix('youtube', 'https://youtube.com/@johndoe')).toBe('johndoe');
  });

  it('normaliza URL com www antes de extrair', () => {
    expect(stripSocialPrefix('instagram', 'https://www.instagram.com/johndoe')).toBe('johndoe');
  });

  it('retorna string vazia para valor vazio', () => {
    expect(stripSocialPrefix('github', '')).toBe('');
  });

  it('buildSocialUrl e stripSocialPrefix são inversos', () => {
    const fields = Object.keys(SOCIAL_PREFIXES) as (keyof typeof SOCIAL_PREFIXES)[];
    for (const field of fields) {
      const handle = 'testuser';
      const url = buildSocialUrl(field, handle);
      expect(stripSocialPrefix(field, url)).toBe(handle);
    }
  });
});
