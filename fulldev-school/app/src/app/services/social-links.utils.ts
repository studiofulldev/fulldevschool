export type SocialLinkField = 'github' | 'linkedin' | 'instagram' | 'youtube';

const DOMAIN_RULES: Record<SocialLinkField, RegExp> = {
  github: /^https:\/\/(www\.)?github\.com\/.+/,
  linkedin: /^https:\/\/(www\.)?linkedin\.com\/.+/,
  instagram: /^https:\/\/(www\.)?instagram\.com\/.+/,
  youtube: /^https:\/\/(www\.)?youtube\.com\/.+/,
};

export function validateSocialUrl(field: SocialLinkField, url: string): boolean {
  if (!url || url.trim() === '') return true;
  return DOMAIN_RULES[field].test(url.trim());
}
