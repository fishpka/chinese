import { Search, X } from 'lucide-react';
import { wordPath } from '../lib/routes.js';

export default function SearchPanel({ locale, messages, query, resultCount, suggestions, popularWords, onQueryChange }) {
  return (
    <section className="search-panel border-y border-line py-7 dark:border-line-dark sm:py-9" aria-label="語感搜尋">
      <div className="grid items-start gap-7 lg:grid-cols-[15rem_1fr]">
        <div>
          <p className="label">{messages.searchLabel}</p>
          <p className="mt-4 text-sm leading-7 text-muted dark:text-muted-dark">
            {messages.searchBody}
          </p>
        </div>

        <div>
          <label className="sr-only" htmlFor="nuance-search">{messages.searchAria}</label>
          <div className="search-line group flex items-center gap-4 border-b border-ink pb-4 dark:border-moon">
            <Search className="shrink-0 text-muted dark:text-muted-dark" size={20} />
            <input
              id="nuance-search"
              className="w-full bg-transparent text-xl font-medium outline-none placeholder:text-faint dark:placeholder:text-faint-dark sm:text-2xl"
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={messages.placeholder}
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                className="shrink-0 text-muted transition-colors hover:text-ink dark:text-muted-dark dark:hover:text-moon"
                onClick={() => onQueryChange('')}
                aria-label={messages.clear}
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <span className="mr-2 text-xs tracking-[0.18em] text-muted dark:text-muted-dark">{messages.explore}</span>
            {suggestions.map((emotion) => (
              <button
                key={emotion.query}
                type="button"
                className={`emotion-chip border px-4 py-2 text-sm transition-all ${
                  query === emotion.query
                    ? 'border-ink bg-ink text-canvas dark:border-moon dark:bg-moon dark:text-night'
                    : 'border-line bg-paper text-muted hover:border-ink hover:text-ink dark:border-line-dark dark:bg-panel dark:text-muted-dark dark:hover:border-moon dark:hover:text-moon'
                }`}
                onClick={() => onQueryChange(emotion.query)}
              >
                {emotion[locale]}
              </button>
            ))}
            <span className="ml-auto pt-2 text-xs text-muted dark:text-muted-dark sm:pt-0">
              {resultCount === null ? messages.loading : `${resultCount} ${messages.matches}`}
            </span>
          </div>

          <div className="mt-7 border-t border-line pt-5 dark:border-line-dark">
            <p className="text-xs tracking-[0.18em] text-muted dark:text-muted-dark">{messages.popular}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-5">
              {popularWords.map((word, index) => (
                <a
                  key={word.query}
                  className={`group flex min-h-16 items-center gap-3 border px-3 py-2 text-left transition-all ${
                    query === word.query
                      ? 'border-ink bg-ink text-canvas dark:border-moon dark:bg-moon dark:text-night'
                      : 'border-line bg-paper text-ink hover:border-accent dark:border-line-dark dark:bg-panel dark:text-moon dark:hover:border-accent-soft'
                  }`}
                  href={wordPath(word.query)}
                >
                  <span className={`grid size-7 shrink-0 place-items-center border text-xs ${
                    query === word.query
                      ? 'border-canvas/50 text-canvas dark:border-night/50 dark:text-night'
                      : 'border-accent/35 text-accent dark:border-accent-soft/40 dark:text-accent-soft'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{word.zh}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
