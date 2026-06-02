import sourceUrl from './Chinese-teaching.txt?url';

const containsHan = (value) => /\p{Script=Han}/u.test(value);
const frenchSignals = /\b(?:le|la|les|des|une?|du|dans|cette?|est|sont|décrit|désigne|signifie|par exemple|ainsi|avec|pour|qui|l['’]|d['’])\b/giu;
const englishSignals = /\b(?:the|an?|is|are|this|that|it|describes?|refers?|means?|for example|with|from|which|and|to)\b/giu;

function scoreMatches(value, expression) {
  return [...value.matchAll(expression)].length;
}

function detectLanguage(line) {
  const frenchScore = scoreMatches(line, frenchSignals) + (/[àâçéèêëîïôùûüœæ]/iu.test(line) ? 3 : 0);
  const englishScore = scoreMatches(line, englishSignals);
  if (containsHan(line)) {
    const latinLength = [...line.matchAll(/\p{Script=Latin}/gu)].length;
    const hanLength = [...line.matchAll(/\p{Script=Han}/gu)].length;
    const hasSubstantialTranslation = latinLength >= Math.max(18, hanLength * 2);

    if (!hasSubstantialTranslation || (!englishScore && !frenchScore)) return 'zh';
  }

  return frenchScore > englishScore ? 'fr' : 'en';
}

function cleanLines(block) {
  return block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !/^https?:\/\//i.test(line));
}

function findTerm(lines) {
  for (const line of lines) {
    const heading = line.match(/^[《「]?([\p{Script=Han}]{1,12})[》」]?(?=\s|[A-Za-z（(“"])/u);
    if (heading) return heading[1];
  }

  for (const line of lines.filter(containsHan)) {
    const definition = line.match(/^[《「]?([\p{Script=Han}]{1,10})[》」]?(?=形容|指|是|原|意指|（|\(|「|，|为)/u);
    if (definition) return definition[1];
  }

  const fallback = lines.find(containsHan)?.match(/[\p{Script=Han}]{1,12}/u);
  return fallback?.[0] || '';
}

function splitExample(text, language) {
  const markers = {
    zh: /(?:例如|例句)\s*[:：]?/u,
    en: /For example\s*:\s*/iu,
    fr: /Par exemple\s*:\s*/iu,
  };
  const marker = markers[language];
  const parts = text.split(marker);

  if (parts.length < 2) return { description: text, example: '' };
  return {
    description: parts[0].trim(),
    example: parts.slice(1).join(' ').trim(),
  };
}

function fillLocalizedFallbacks(localized) {
  const descriptionFallback = localized.en.description || localized.zh.description || localized.fr.description;
  const exampleFallback = localized.en.example || localized.zh.example || localized.fr.example;

  return Object.fromEntries(
    Object.entries(localized).map(([language, value]) => [
      language,
      {
        description: value.description || descriptionFallback,
        example: value.example || exampleFallback,
      },
    ]),
  );
}

function getCategory(term, searchableText) {
  if (/[诗詞歌赋]|诗|poem|poète|唐朝|朝代|典故|myth|histoire/iu.test(searchableText)) return '典故';
  if (term.length === 4) return '成語';
  return '文化詞彙';
}

function inferEmotions(searchableText, category) {
  const emotionSignals = {
    焦慮: /焦[虑慮]|anxious|anxiety|inqui[eé]t|angoiss/iu,
    孤獨: /孤独|孤獨|寂寞|alone|solitude|seul/iu,
    懷念: /思念|怀念|懷念|nostalgi|longing|yearning|souvenir/iu,
    無奈: /无奈|無奈|helpless|impuissance|rien y faire/iu,
    喜悅: /开心|開心|喜悦|喜悅|joy|joyeux|joie/iu,
  };
  const detected = Object.entries(emotionSignals)
    .filter(([, pattern]) => pattern.test(searchableText))
    .map(([emotion]) => emotion);

  return detected.length ? detected : [category];
}

function parseEntry(block, index) {
  const lines = cleanLines(block);
  if (!lines.some(containsHan)) return null;

  const sections = { zh: [], en: [], fr: [] };
  lines.forEach((line) => sections[detectLanguage(line)].push(line));

  const localized = fillLocalizedFallbacks(Object.fromEntries(
    Object.entries(sections).map(([language, languageLines]) => [
      language,
      splitExample(languageLines.join(' '), language),
    ]),
  ));
  const term = findTerm(lines);
  if (!term) return null;

  const searchableText = lines.join(' ');
  const category = getCategory(term, searchableText);

  return {
    id: `teaching-${index}-${term}`,
    term,
    category,
    content: localized,
    editable: {
      term,
      english: localized.en.description,
      french: localized.fr.description,
      emotions: inferEmotions(searchableText, category),
      scenario: localized.zh.description,
    },
    baseSearchableText: searchableText,
    searchableText,
  };
}

export async function loadTeachingDatabase() {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Unable to load Chinese-teaching.txt: ${response.status}`);
  }

  const sourceText = await response.text();
  const entries = sourceText
    .split(/\r?\n\s*_{8,}\s*\r?\n/g)
    .map(parseEntry)
    .filter(Boolean);

  return {
    source: 'Chinese-teaching.txt',
    total: entries.length,
    entries,
  };
}
