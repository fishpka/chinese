const TIME_ZONE = 'Asia/Taipei';

export function getTaipeiDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}

function hashString(value) {
  let hash = 2166136261;

  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return hash >>> 0;
}

export function selectDailyEntry(entries, date = new Date()) {
  if (!entries.length) return null;

  const seed = `${getTaipeiDateKey(date)}:${entries.length}`;
  const index = hashString(seed) % entries.length;
  return entries[index];
}

export function getMillisecondsUntilNextTaipeiMidnight(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const nextMidnightTaipei = Date.UTC(Number(fields.year), Number(fields.month) - 1, Number(fields.day) + 1) - 8 * 60 * 60 * 1000;
  return Math.max(1000, nextMidnightTaipei - date.getTime());
}

export function selectDailyEntries(entries, count = 5, date = new Date(), salt = '') {
  if (!entries.length) return [];

  const dateKey = getTaipeiDateKey(date);
  return entries
    .map((entry, index) => ({
      entry,
      score: hashString(`${dateKey}:${salt}:${entries.length}:${index}:${entry.id || entry.term}`),
    }))
    .sort((left, right) => left.score - right.score)
    .slice(0, count)
    .map(({ entry }) => entry);
}
