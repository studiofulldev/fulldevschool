export type SocialField = 'github' | 'linkedin' | 'instagram' | 'youtube';

export const SOCIAL_PREFIXES: Record<SocialField, string> = {
  github: 'https://github.com/',
  linkedin: 'https://linkedin.com/in/',
  instagram: 'https://instagram.com/',
  youtube: 'https://youtube.com/@',
};

export function validateSocialHandle(field: SocialField | string, handle: string): boolean {
  const trimmed = (handle ?? '').trim();
  if (!trimmed) return true;
  return /^[^\s/]+$/.test(trimmed);
}

export function buildSocialUrl(field: SocialField | string, handle: string): string {
  const trimmed = (handle ?? '').trim();
  if (!trimmed) return '';
  const prefix = SOCIAL_PREFIXES[field as SocialField];
  if (!prefix) return '';
  return `${prefix}${trimmed}`;
}

export function stripSocialPrefix(field: SocialField | string, url: string): string {
  const trimmed = (url ?? '').trim();
  if (!trimmed) return '';
  const prefix = SOCIAL_PREFIXES[field as SocialField];
  if (!prefix) return trimmed;
  const withWww = prefix.replace('://', '://www.');
  if (trimmed.startsWith(withWww)) return trimmed.slice(withWww.length);
  if (trimmed.startsWith(prefix)) return trimmed.slice(prefix.length);
  return trimmed;
}

export function validateLinkedInUrl(url: string): boolean {
  return validateSocialUrl(url, ['linkedin.com', 'www.linkedin.com']);
}

export function validateInstagramUrl(url: string): boolean {
  return validateSocialUrl(url, ['instagram.com', 'www.instagram.com']);
}

export function validateYouTubeUrl(url: string): boolean {
  return validateSocialUrl(url, ['youtube.com', 'www.youtube.com', 'youtu.be']);
}

function validateSocialUrl(url: string, hosts: string[]): boolean {
  if (!url?.trim()) return true;
  try {
    const u = new URL(url.trim());
    return u.protocol === 'https:' && hosts.includes(u.hostname);
  } catch {
    return false;
  }
}
