import { describe, it, expect } from 'vitest';
import {
  validateSocialHandle,
  buildSocialUrl,
  stripSocialPrefix,
  validateLinkedInUrl,
  validateInstagramUrl,
  validateYouTubeUrl,
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

  it('retorna a string como veio quando não tem o prefixo esperado', () => {
    expect(stripSocialPrefix('github', 'https://notgithub.com/johndoe')).toBe('https://notgithub.com/johndoe');
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

describe('validateLinkedInUrl', () => {
  it('aceita URL válida do LinkedIn', () => {
    expect(validateLinkedInUrl('https://linkedin.com/in/johndoe')).toBe(true);
  });

  it('aceita URL com www', () => {
    expect(validateLinkedInUrl('https://www.linkedin.com/in/johndoe')).toBe(true);
  });

  it('aceita string vazia (campo opcional)', () => {
    expect(validateLinkedInUrl('')).toBe(true);
  });

  it('aceita string só de espaços como vazia', () => {
    expect(validateLinkedInUrl('   ')).toBe(true);
  });

  it('rejeita http:// (não https)', () => {
    expect(validateLinkedInUrl('http://linkedin.com/in/johndoe')).toBe(false);
  });

  it('rejeita subdomínio falso — bypass attempt', () => {
    expect(validateLinkedInUrl('https://linkedin.com.evil.com/in/foo')).toBe(false);
  });

  it('rejeita domínio diferente', () => {
    expect(validateLinkedInUrl('https://notlinkedin.com/in/foo')).toBe(false);
  });
});

describe('validateInstagramUrl', () => {
  it('aceita URL válida do Instagram', () => {
    expect(validateInstagramUrl('https://instagram.com/johndoe')).toBe(true);
  });

  it('aceita URL com www', () => {
    expect(validateInstagramUrl('https://www.instagram.com/johndoe')).toBe(true);
  });

  it('rejeita subdomínio falso — bypass attempt', () => {
    expect(validateInstagramUrl('https://instagram.com.evil.com/johndoe')).toBe(false);
  });

  it('rejeita domínio diferente', () => {
    expect(validateInstagramUrl('https://notinstagram.com/johndoe')).toBe(false);
  });
});

describe('validateYouTubeUrl', () => {
  it('aceita URL youtube.com', () => {
    expect(validateYouTubeUrl('https://youtube.com/@johndoe')).toBe(true);
  });

  it('aceita URL youtu.be', () => {
    expect(validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('aceita URL www.youtube.com', () => {
    expect(validateYouTubeUrl('https://www.youtube.com/@johndoe')).toBe(true);
  });

  it('rejeita subdomínio falso — bypass attempt', () => {
    expect(validateYouTubeUrl('https://youtube.com.evil.com/@johndoe')).toBe(false);
  });

  it('rejeita domínio diferente', () => {
    expect(validateYouTubeUrl('https://notyoutube.com/@johndoe')).toBe(false);
  });
});
