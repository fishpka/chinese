import { ArrowLeft, BookOpen, Network, Tags } from 'lucide-react';
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

function getRelatedEntries(entry, entries) {
  const termCharacters = new Set([...entry.editable.term]);
  return uniqueByTerm(entries)
    .filter((candidate) => candidate.id !== entry.id)
    .map((candidate) => {
      const sharedEmotion = candidate.editable.emotions.filter((emotion) => entry.editable.emotions.includes(emotion)).length;
      const sharedCharacters = [...candidate.editable.term].filter((character) => termCharacters.has(character)).length;
      const sameCategory = candidate.category === entry.category ? 2 : 0;
      return { candidate, score: sharedEmotion * 4 + sharedCharacters + sameCategory };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ candidate }) => candidate);
}

function getSameEmotionEntries(entry, entries) {
  const primaryEmotion = entry.editable.emotions[0];
  if (!primaryEmotion) return [];
  return uniqueByTerm(entries)
    .filter((candidate) => candidate.id !== entry.id && candidate.editable.emotions.includes(primaryEmotion))
    .slice(0, 8);
}

function getRecommendedEntries(entry, entries) {
  const uniqueEntries = uniqueByTerm(entries).filter((candidate) => candidate.id !== entry.id);
  const currentIndex = uniqueEntries.findIndex((candidate) => candidate.term === entry.term);
  return [...uniqueEntries.slice(currentIndex + 1), ...uniqueEntries.slice(0, currentIndex + 1)].slice(0, 6);
}

export default function WordPage({ entry, entries, locale, messages }) {
  const selected = entry.content[locale] || entry.content.zh;
  const example = selected.example || entry.content.zh.example;
  const relatedEntries = getRelatedEntries(entry, entries);
  const sameEmotionEntries = getSameEmotionEntries(entry, entries);
  const recommendedEntries = getRecommendedEntries(entry, entries);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      <a className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink dark:text-muted-dark dark:hover:text-moon" href={homePath()}>
        <ArrowLeft size={16} />
        {messages.backToArchive}
      </a>

      <section className="mt-8 border-y border-line py-8 dark:border-line-dark lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
        <div>
          <p className="label">{messages.wordPageLabel}</p>
          <h1 className="mt-4 text-5xl font-medium tracking-tight sm:text-6xl">{entry.editable.term}</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            {[entry.category, ...entry.editable.emotions].map((emotion) => (
              <a
                key={emotion}
                className="emotion-tag bg-paper px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink dark:bg-panel dark:text-muted-dark dark:hover:text-moon"
                href={emotionPath(emotion)}
              >
                {emotion}
              </a>
            ))}
          </div>
        </div>
        <div className="mt-8 space-y-6 text-sm leading-7 lg:mt-0">
          <Detail label={messages.description} text={selected.description} />
          <Detail label={messages.english} text={entry.editable.english} />
          <Detail label={messages.french} text={entry.editable.french} />
          <Detail label={messages.scenario} text={entry.editable.scenario} />
          {example && <Detail label={messages.example} text={example} emphasized />}
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <LinkSection icon={<Network size={17} />} title={messages.relatedWords} entries={relatedEntries} messages={messages} />
        <LinkSection icon={<Tags size={17} />} title={messages.sameEmotionWords} entries={sameEmotionEntries} messages={messages} />
        <LinkSection icon={<BookOpen size={17} />} title={messages.recommendedReading} entries={recommendedEntries} messages={messages} />
      </div>
    </main>
  );
}

function Detail({ label, text, emphasized = false }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[6rem_1fr]">
      <dt className="label">{label}</dt>
      <dd className={emphasized ? 'text-ink dark:text-moon' : 'text-muted dark:text-muted-dark'}>{text}</dd>
    </div>
  );
}

function LinkSection({ icon, title, entries, messages }) {
  return (
    <section className="border border-line bg-paper p-5 dark:border-line-dark dark:bg-panel">
      <h2 className="flex items-center gap-2 text-base font-medium">
        {icon}
        {title}
      </h2>
      <div className="mt-5 grid gap-2">
        {entries.length ? entries.map((entry) => (
          <a
            key={entry.id}
            className="group border border-line bg-canvas px-4 py-3 transition-colors hover:border-accent dark:border-line-dark dark:bg-night dark:hover:border-accent-soft"
            href={wordPath(entry.editable.term)}
          >
            <span className="block text-sm font-medium text-ink dark:text-moon">{entry.editable.term}</span>
            <span className="mt-1 block text-xs text-muted dark:text-muted-dark">{entry.editable.emotions.join('、')}</span>
          </a>
        )) : (
          <p className="text-sm leading-7 text-muted dark:text-muted-dark">{messages.noRelatedWords}</p>
        )}
      </div>
    </section>
  );
}

