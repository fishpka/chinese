import { emotionPath } from '../lib/routes.js';

const headings = {
  zh: '依成語、文化與情緒分類探索',
  en: 'Explore idioms, culture and emotions',
  fr: 'Explorer les expressions, la culture et les émotions',
};

export default function CategoryLinks({ entries, locale }) {
  const categories = [...new Set(entries.flatMap((entry) => [entry.category, ...entry.editable.emotions]))];
  if (!categories.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 lg:px-12" aria-labelledby="categories-heading">
      <h2 id="categories-heading" className="text-xl font-medium">{headings[locale] || headings.zh}</h2>
      <nav className="mt-5 flex flex-wrap gap-3" aria-labelledby="categories-heading">
        {categories.map((category) => (
          <a
            key={category}
            href={emotionPath(category)}
            className="border border-line bg-paper px-4 py-2 text-sm transition-colors hover:border-accent dark:border-line-dark dark:bg-panel dark:hover:border-accent-soft"
          >
            {category}
          </a>
        ))}
      </nav>
    </section>
  );
}
