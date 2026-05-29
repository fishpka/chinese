const TIME_ZONE = 'Asia/Taipei';

function getTaipeiDateKey(date = new Date()) {
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
