// Social link domain validation for team profiles.

export type SocialPlatform = 'instagram' | 'telegram' | 'youtube' | 'x';

const DOMAINS: Record<SocialPlatform, string[]> = {
  instagram: ['instagram.com', 'www.instagram.com'],
  telegram: ['t.me', 'telegram.me', 'www.t.me'],
  youtube: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'],
  x: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'],
};

export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  telegram: 'Telegram',
  youtube: 'YouTube',
  x: 'X (Twitter)',
};

export const SOCIAL_PLACEHOLDERS: Record<SocialPlatform, string> = {
  instagram: 'https://instagram.com/username',
  telegram: 'https://t.me/username',
  youtube: 'https://youtube.com/@channel',
  x: 'https://x.com/username',
};

/**
 * Returns normalized URL (with https://) if valid for given platform, otherwise null.
 */
export function validateSocialUrl(platform: SocialPlatform, raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (!DOMAINS[platform].includes(host)) return null;
  return url.toString();
}
