/**
 * Miroir de backend/src/utils/youtube.ts. Dupliqué volontairement : les deux
 * projets sont des dépôts séparés, et cette fonction sert ici uniquement à
 * donner un retour immédiat pendant la saisie. Le back reste l'autorité.
 */

const ID = /^[A-Za-z0-9_-]{11}$/;

const PATTERNS: RegExp[] = [
  /[?&]v=([A-Za-z0-9_-]{11})/,
  /youtu\.be\/([A-Za-z0-9_-]{11})/,
  /\/embed\/([A-Za-z0-9_-]{11})/,
  /\/shorts\/([A-Za-z0-9_-]{11})/,
  /\/live\/([A-Za-z0-9_-]{11})/,
];

export function parseYouTubeId(input: string): string | null {
  const raw = (input ?? '').trim();
  if (!raw) return null;
  if (ID.test(raw)) return raw;
  for (const pattern of PATTERNS) {
    const match = raw.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Domaine sans cookie : YouTube ne dépose pas de traceur tant que le visiteur
 * n'a pas lancé la lecture.
 */
export function embedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

export function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function thumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
