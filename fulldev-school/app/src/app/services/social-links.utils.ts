export type SocialLinkField = 'github' | 'linkedin' | 'instagram' | 'youtube';

export const SOCIAL_PREFIXES: Record<SocialLinkField, string> = {
  github: 'https://github.com/',
  linkedin: 'https://linkedin.com/in/',
  instagram: 'https://instagram.com/',
  youtube: 'https://youtube.com/@',
};

export function buildSocialUrl(field: SocialLinkField, handle: string): string {
  const h = handle.trim();
  return h ? SOCIAL_PREFIXES[field] + h : '';
}

export function stripSocialPrefix(field: SocialLinkField, url: string): string {
  if (!url) return '';
  const normalized = url.replace(/^https?:\/\/(www\.)?/, 'https://');
  const prefix = SOCIAL_PREFIXES[field];
  return normalized.startsWith(prefix) ? normalized.slice(prefix.length) : url;
}

export function validateSocialHandle(_field: SocialLinkField, handle: string): boolean {
  if (!handle || handle.trim() === '') return true;
  const h = handle.trim();
  return !h.includes('/') && !h.includes('://') && !h.includes(' ');
}
