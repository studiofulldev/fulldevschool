import { describe, it, expect } from 'vitest';
import { validateSocialUrl } from './social-links.utils';

describe('validateSocialUrl', () => {
  describe('happy path — URLs válidas', () => {
    it('aceita URL do GitHub válida', () => {
      expect(validateSocialUrl('github', 'https://github.com/johndoe')).toBe(true);
    });

    it('aceita URL do LinkedIn válida', () => {
      expect(validateSocialUrl('linkedin', 'https://www.linkedin.com/in/johndoe')).toBe(true);
    });

    it('aceita URL do Instagram válida', () => {
      expect(validateSocialUrl('instagram', 'https://instagram.com/johndoe')).toBe(true);
    });

    it('aceita URL do YouTube válida', () => {
      expect(validateSocialUrl('youtube', 'https://youtube.com/@johndoe')).toBe(true);
    });

    it('aceita string vazia (campo opcional)', () => {
      expect(validateSocialUrl('github', '')).toBe(true);
    });

    it('aceita URL com trailing slash', () => {
      expect(validateSocialUrl('instagram', 'https://www.instagram.com/johndoe/')).toBe(true);
    });
  });

  describe('edge cases — URLs inválidas', () => {
    it('rejeita URL do LinkedIn no campo do GitHub', () => {
      expect(validateSocialUrl('github', 'https://linkedin.com/in/foo')).toBe(false);
    });

    it('rejeita URL do GitHub no campo do LinkedIn', () => {
      expect(validateSocialUrl('linkedin', 'https://github.com/foo')).toBe(false);
    });

    it('rejeita URL sem protocolo https', () => {
      expect(validateSocialUrl('github', 'github.com/foo')).toBe(false);
    });

    it('rejeita URL com apenas o domínio sem path de usuário', () => {
      expect(validateSocialUrl('github', 'https://github.com')).toBe(false);
    });

    it('rejeita shortlink do YouTube (youtu.be)', () => {
      expect(validateSocialUrl('youtube', 'https://youtu.be/abc123')).toBe(false);
    });
  });
});
