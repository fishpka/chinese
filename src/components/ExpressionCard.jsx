import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { trackEvent } from '../lib/analytics/umami.js';
import { emotionPath, wordPath } from '../lib/routes.js';

const categoryNames = {
  zh: { 成語: '成語', 典故: '典故', 文化詞彙: '文化詞彙' },
  en: { 成語: 'Idiom', 典故: 'Allusion', 文化詞彙: 'Cultural term' },
  fr: { 成語: 'Expression', 典故: 'Allusion', 文化詞彙: 'Terme culturel' },
};

export default function ExpressionCard({ entry, locale, messages, index, reduceMotion }) {
  const selected = entry.content[locale];
  const example = selected.example || entry.content.zh.example;

  return (
    <motion.article
      layout
      className="expression-card group border border-line bg-paper p-6 transition-colors hover:border-ink/40 dark:border-line-dark dark:bg-panel dark:hover:border-moon/35 sm:p-8"
      initial={reduceMotion ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
      transition={{ duration: reduceMotion ? 0 : 0.38, delay: reduceMotion ? 0 : index * 0.035, ease: [0.16, 1, 0.3, 1] }}
    >
      <ReadCard
        entry={entry}
        example={example}
        locale={locale}
        messages={messages}
        reduceMotion={reduceMotion}
      />
    </motion.article>
  );
}

function ReadCard({ entry, example, locale, messages, reduceMotion }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
    >
      <div>
        <div className="flex items-baseline gap-3">
          <h3 className="text-3xl font-medium tracking-tight sm:text-4xl">
            <a
              className="transition-colors hover:text-accent dark:hover:text-accent-soft"
              href={wordPath(entry.editable.term)}
              onClick={() => trackEvent('word_card_title_click', {
                term: entry.editable.term,
                category: entry.category,
              })}
            >
              {entry.editable.term}
            </a>
          </h3>
          <span className="text-xs tracking-[0.18em] text-muted dark:text-muted-dark">
            {categoryNames[locale][entry.category]}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {entry.editable.emotions.map((emotion) => (
          <a
            key={emotion}
            className="emotion-tag bg-canvas px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink dark:bg-night dark:text-muted-dark dark:hover:text-moon"
            href={emotionPath(emotion)}
            onClick={() => trackEvent('emotion_tag_click', {
              emotion,
              source: 'word_card',
              term: entry.editable.term,
            })}
          >
            {emotion}
          </a>
        ))}
      </div>

      <a
        className="mt-5 inline-flex items-center gap-2 text-xs tracking-[0.12em] text-accent transition-colors hover:text-ink dark:text-accent-soft dark:hover:text-moon"
        href={wordPath(entry.editable.term)}
        onClick={() => trackEvent('word_card_open_click', {
          term: entry.editable.term,
          category: entry.category,
        })}
      >
        {messages.openWordPage}
        <ExternalLink size={13} />
      </a>

      <dl className="mt-7 space-y-5 text-sm">
        <Detail label={messages.english} text={entry.editable.english || messages.fallback} />
        <Detail label={messages.french} text={entry.editable.french || messages.fallback} />
        <Detail label={messages.scenario} text={entry.editable.scenario || messages.fallback} />
        {example && <Detail label={messages.example} text={example} emphasized />}
      </dl>
    </motion.div>
  );
}

function Detail({ label, text, emphasized = false }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[5.5rem_1fr]">
      <dt className="text-xs tracking-[0.14em] text-muted dark:text-muted-dark">{label}</dt>
      <dd className={`${emphasized ? 'text-ink dark:text-moon' : 'text-muted dark:text-muted-dark'} leading-7`}>
        {text}
      </dd>
    </div>
  );
}
