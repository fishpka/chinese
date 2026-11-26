const searchCharacterMap = {
  慮: '虑', 獨: '独', 曖: '暧', 無: '无', 懷: '怀', 舊: '旧', 關: '关',
  係: '系', 複: '复', 雜: '杂', 藥: '药', 救: '救', 險: '险', 惡: '恶',
  詞: '词', 語: '语', 節: '节', 氣: '气', 憶: '忆', 戀: '恋', 寫: '写',
  說: '说', 離: '离', 疏: '疏', 鬱: '郁', 煩: '烦', 憂: '忧',
};

export function normalizeSearchText(value) {
  return value
    .toLocaleLowerCase()
    .replace(/./gu, (character) => searchCharacterMap[character] || character)
    .replace(/[^\p{Script=Han}\p{Letter}\p{Number}]+/gu, '');
}

function includesCharactersInOrder(haystack, needle) {
  let position = 0;

  for (const character of needle) {
    position = haystack.indexOf(character, position);
    if (position === -1) return false;
    position += character.length;
  }

  return true;
}

export function matchesQuery(entry, query) {
  if (!query.trim()) return true;

  const needle = normalizeSearchText(query);
  const haystack = normalizeSearchText(entry.searchableText);
  return haystack.includes(needle) || includesCharactersInOrder(haystack, needle);
}

export function scoreAutocompleteMatch(entry, query) {
  const needle = normalizeSearchText(query);
  if (!needle) return 0;

  const term = normalizeSearchText(entry.editable.term || entry.term);
  const emotions = normalizeSearchText(entry.editable.emotions.join(''));
  const category = normalizeSearchText(entry.category);
  const searchableText = normalizeSearchText(entry.searchableText);

  if (term === needle) return 120;
  if (term.startsWith(needle)) return 100 - term.length;
  if (term.includes(needle)) return 86 - term.indexOf(needle);
  if (emotions.includes(needle)) return 78;
  if (category.includes(needle)) return 70;
  if (includesCharactersInOrder(term, needle)) return 62 - Math.max(0, term.length - needle.length);
  if (searchableText.includes(needle)) return 42;
  if (includesCharactersInOrder(searchableText, needle)) return 24;
  return 0;
}

