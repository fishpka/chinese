import sourceUrl from './Chinese-teaching.txt?url';
import { parseTeachingSource } from './teachingParser.js';

export async function loadTeachingDatabase() {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Unable to load Chinese-teaching.txt: ${response.status}`);
  }

  const sourceText = await response.text();
  const entries = parseTeachingSource(sourceText);

  return {
    source: 'Chinese-teaching.txt',
    total: entries.length,
    entries,
  };
}
