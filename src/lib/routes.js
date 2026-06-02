export const siteBase = '/chinese';

export function slugify(value) {
  return encodeURIComponent(String(value).trim());
}

export function unslugify(value) {
  try {
    return decodeURIComponent(value || '');
  } catch {
    return value || '';
  }
}

export function wordPath(term) {
  return `${siteBase}/word/${slugify(term)}/`;
}

export function emotionPath(category) {
  return `${siteBase}/emotion/${slugify(category)}/`;
}

export function homePath() {
  return `${siteBase}/`;
}

