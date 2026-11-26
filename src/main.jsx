import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';
import { loadTeachingDatabase } from './data/teachingDatabase.js';
import { ensureUmamiScript } from './lib/analytics/umami.js';

// Leave the fully styled prerender visible while the teaching data loads.
ensureUmamiScript();
if (document.documentElement.dataset.pageType !== 'excluded') {
  loadTeachingDatabase().then((initialDatabase) => {
    createRoot(document.getElementById('root')).render(
      <StrictMode><App initialDatabase={initialDatabase} /></StrictMode>,
    );
  }).catch(() => {
    // A failed request must not replace readable static teaching content.
    if (!document.getElementById('root').hasChildNodes()) {
      createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
    }
  });
}
