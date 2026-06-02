import { ArrowLeft } from 'lucide-react';
import { emotionPath, homePath, wordPath } from '../lib/routes.js';

function uniqueByTerm(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const term = entry.editable.term;
    if (seen.has(term)) return false;
    seen.add(term);
    return true;
  });
}

export default function EmotionPage({ category, entries, messages }) {
  const categoryEntries = uniqueByTerm(entries.filter((entry) => (
    entry.category === category || entry.editable.emotions.includes(category)
  )));
  const nearbyCategories = [...new Set(categoryEntries.flatMap((entry) => [entry.category, ...entry.editable.emotions]))]
    .filter((emotion) => emotion !== category)
    .slice(0, 12);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      <a className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink dark:text-muted-dark dark:hover:text-moon" href={homePath()}>
        <ArrowLeft size={16} />
        {messages.backToArchive}
      </a>

      <section className="mt-8 border-y border-line py-8 dark:border-line-dark">
        <p className="label">{messages.emotionPageLabel}</p>
        <h1 className="mt-4 text-5xl font-medium tracking-tight sm:text-6xl">{category}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted dark:text-muted-dark">
          {messages.emotionPageBody(categoryEntries.length)}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {nearbyCategories.map((emotion) => (
            <a
              key={emotion}
              className="emotion-tag bg-paper px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink dark:bg-panel dark:text-muted-dark dark:hover:text-moon"
              href={emotionPath(emotion)}
            >
              {emotion}
            </a>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categoryEntries.map((entry) => (
          <a
            key={entry.id}
            className="border border-line bg-paper p-5 transition-colors hover:border-accent dark:border-line-dark dark:bg-panel dark:hover:border-accent-soft"
            href={wordPath(entry.editable.term)}
          >
            <span className="block text-xl font-medium text-ink dark:text-moon">{entry.editable.term}</span>
            <span className="mt-3 block text-sm leading-7 text-muted dark:text-muted-dark">
              {entry.editable.scenario}
            </span>
            <span className="mt-4 flex flex-wrap gap-2">
              {entry.editable.emotions.slice(0, 3).map((emotion) => (
                <span key={emotion} className="emotion-tag bg-canvas px-3 py-1.5 text-xs text-muted dark:bg-night dark:text-muted-dark">
                  {emotion}
                </span>
              ))}
            </span>
          </a>
        ))}
      </section>
    </main>
  );
}

