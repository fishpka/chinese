import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const categoryLabels = {
  zh: { 成語: '成語', 典故: '典故', 文化詞彙: '文化詞彙' },
  en: { 成語: 'Idiom', 典故: 'Allusion', 文化詞彙: 'Cultural term' },
  fr: { 成語: 'Expression', 典故: 'Allusion', 文化詞彙: 'Terme culturel' },
};

export default function DailyWord({ entry, locale, messages, onExplore }) {
  const reduceMotion = useReducedMotion();

  if (!entry) return null;

  const selected = entry.content[locale] || entry.content.zh;
  const example = selected.example || entry.content.zh.example;

  return (
    <section className="mx-auto max-w-7xl px-5 pt-5 sm:px-8 lg:px-12">
      <motion.div
        className="border border-line bg-paper px-5 py-4 dark:border-line-dark dark:bg-panel sm:px-6"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="label">{messages.dailyWordLabel}</p>
              <span className="text-xs tracking-[0.18em] text-muted dark:text-muted-dark">
                {messages.dailyWordHint}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">
                {entry.editable.term}
              </h2>
              <span className="text-sm text-muted dark:text-muted-dark">
                {categoryLabels[locale][entry.category]}
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted dark:text-muted-dark">
              {selected.description}
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 self-start border border-line px-4 py-2 text-sm tracking-[0.08em] text-ink transition-colors hover:border-ink dark:border-line-dark dark:text-moon dark:hover:border-moon"
            onClick={() => onExplore(entry.term)}
          >
            {messages.dailyWordAction}
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {entry.editable.emotions.slice(0, 4).map((emotion) => (
            <span key={emotion} className="emotion-tag bg-canvas px-3 py-1.5 text-xs text-muted dark:bg-night dark:text-muted-dark">
              {emotion}
            </span>
          ))}
        </div>

        <div className="mt-4 grid gap-4 border-t border-line pt-4 dark:border-line-dark sm:grid-cols-2">
          <p className="text-sm leading-7 text-muted dark:text-muted-dark">
            <span className="label mr-3">{messages.english}</span>
            {entry.editable.english || messages.fallback}
          </p>
          <p className="text-sm leading-7 text-muted dark:text-muted-dark">
            <span className="label mr-3">{messages.french}</span>
            {entry.editable.french || messages.fallback}
          </p>
          {example && (
            <p className="sm:col-span-2 text-sm leading-7 text-muted dark:text-muted-dark">
              <span className="label mr-3">{messages.example}</span>
              {example}
            </p>
          )}
        </div>
      </motion.div>
    </section>
  );
}
