export const siteBase = '/chinese';
export const localeQueryValues = {
  zh: 'zh-Hant',
  en: 'en',
  fr: 'fr',
};

const localeAliases = {
  zh: 'zh',
  'zh-hant': 'zh',
  'zh-hant-tw': 'zh',
  'zh-tw': 'zh',
  en: 'en',
  fr: 'fr',
};

export function slugify(value) {
  return encodeURIComponent(String(value).trim());
}

export function localeFromQuery(value) {
  return localeAliases[String(value || '').trim().toLowerCase()] || 'zh';
}

export function localeQueryValue(locale) {
  return localeQueryValues[locale] || localeQueryValues.zh;
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
