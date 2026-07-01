export const containsHan = (value) => /\p{Script=Han}/u.test(value);

const genericStarts = /^(這|这|此|今天|老師|老师|親愛|亲爱|通常|常用|用來|用来|比喻|原意|引申|字面|它$|此外|以下|最近|昨天|然而|在一|過完|过完|當我|当我|看見|看见|我是|我們|我们|小的|小時|小时|你喜|有些|滿$|满$)/u;
const termMarkerPattern = /^(?<term>[\p{Script=Han}]{2,12}?)(?:的意思是|意思是|的意思|的由來|的由来|字面意思是|原意是|原本是|指的是|指|形容|是一?[個个]成[語语]|是一个成语|是一个|是一個|是一种|是一種|是一座|是一位|是|具有|表示|常常|座落於|座落于|這個成[語语]|这个成[語语]|常用來|常用来|通常用來|通常用来|多用來|多用来|用來|用来|比喻|意指|位于|位於|又名|又叫作|又稱為|又称为|習俗|习俗)/u;
const meaningTermPattern = /^(?<term>[\p{Script=Han}]{2,12}?)(?:的意思是|意思是|的意思|字面意思是)/u;
const relationTermPattern = /^(?<term>[\p{Script=Han}]{3,12}?)(?:為|为|以|在|被|對|对)/u;
const singleCharacterTermPattern = /^(?<term>[愛爱龍龙])(?:的意思是|意思是|的意思|指的是|指|形容|是|為|为|以|在|被|具有|表示|常用來|常用来|通常用來|通常用来|用來|用来|比喻|意指)/u;
const leadingTitlePattern = /^[《「“"«]?([\p{Script=Han}]{2,12})[》」”"»]?(?=\s|[A-Za-z（(“"])/u;
const explicitQuotedPattern = /(?:idiom|expression|term|expression idiomatique|成[語语]|詞|词|稱為|称为|called|named)[^《「“"«]{0,60}[《「“"«]([^》」”"»]+)[》」”"»]/iu;
const quotedPattern = /[《「“"«]([^》」”"»]+)[》」”"»]/gu;

export function cleanLines(block) {
  return block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !/^https?:\/\//i.test(line));
}

function normalizeTermCandidate(value, { preferLastSegment = false } = {}) {
  const candidate = String(value || '')
    .replace(/\([^)]*\)/g, '')
    .replace(/（[^）]*）/g, '')
    .trim();

  if (!candidate) return '';
  if (/^[\p{Script=Han}]$/u.test(candidate) && !genericStarts.test(candidate)) return candidate;

  const segments = candidate
    .split(/[，,。.!！？?；;：:\s]+/u)
    .map((segment) => segment.match(/[\p{Script=Han}]{2,12}/u)?.[0] || '')
    .filter(Boolean);

  const term = (preferLastSegment ? segments.at(-1) : segments[0])
    || candidate.match(/[\p{Script=Han}]{2,12}/u)?.[0]
    || '';
  if (!term || genericStarts.test(term)) return '';
  return term;
}

function findStandaloneTerm(lines) {
  for (const line of lines) {
    const standalone = line.match(/^[《「“"«]?([\p{Script=Han}]{2,12})[》」”"»]?[。！？!~～\s]*$/u);
    const standaloneTerm = normalizeTermCandidate(standalone?.[1]);
    if (standaloneTerm) return standaloneTerm;
  }

  return '';
}

function findExplicitQuotedTerm(lines) {
  for (const line of lines) {
    const explicit = line.match(explicitQuotedPattern);
    const explicitTerm = normalizeTermCandidate(explicit?.[1], { preferLastSegment: true });
    if (explicitTerm) return explicitTerm;
  }

  for (const line of lines) {
    const firstQuoted = [...line.matchAll(quotedPattern)]
      .map((match) => normalizeTermCandidate(match[1], { preferLastSegment: true }))
      .find(Boolean);
    if (firstQuoted) return firstQuoted;
  }

  return '';
}

function findLeadingTerm(lines) {
  for (const line of lines.filter(containsHan)) {
    const marker = line.match(meaningTermPattern) || line.match(singleCharacterTermPattern) || line.match(termMarkerPattern);
    const relation = marker ? null : line.match(relationTermPattern);
    const markerTerm = normalizeTermCandidate(marker?.groups?.term);
    const relationTerm = normalizeTermCandidate(relation?.groups?.term);
    if (markerTerm) return markerTerm;
    if (relationTerm && !/[而不無无未]$/u.test(relationTerm)) return relationTerm;
  }

  for (const line of lines) {
    const title = line.match(leadingTitlePattern);
    const titleTerm = normalizeTermCandidate(title?.[1]);
    if (titleTerm) return titleTerm;
  }

  return '';
}

export function findTerm(lines) {
  const term = findStandaloneTerm(lines) || findExplicitQuotedTerm(lines) || findLeadingTerm(lines);
  if (term) return term;

  for (const line of lines.filter(containsHan)) {
    const fallback = normalizeTermCandidate(line);
    if (fallback) return fallback;
  }

  return '';
}

export function getCategory(term, searchableText) {
  if (/[诗詞歌赋]|诗|poem|poète|唐朝|朝代|典故|myth|histoire/iu.test(searchableText)) return '典故';
  if (term.length === 4) return '成語';
  return '文化詞彙';
}

export function inferEmotions(searchableText, category) {
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
