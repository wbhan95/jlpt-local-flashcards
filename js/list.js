import { loadGrammar, loadVocabulary } from './data.js';
import { getCompletedIds } from './storage.js';

const set = document.body.dataset.set;
if (set !== 'grammar' && set !== 'vocabulary') {
  throw new Error('list.js requires body[data-set="grammar|vocabulary"]');
}

async function render() {
  const listEl = document.getElementById('entry-list');
  const totalEl = document.getElementById('total-count');
  const leftEl = document.getElementById('left-count');
  if (!listEl || !totalEl || !leftEl) return;

  const items = set === 'grammar' ? await loadGrammar() : await loadVocabulary();
  const completed = getCompletedIds(set);
  const left = items.filter((it) => !completed.has(it.id)).length;

  totalEl.textContent = String(items.length);
  leftEl.textContent = String(left);

  listEl.innerHTML = '';

  for (const item of items) {
    const done = completed.has(item.id);
    const a = document.createElement('a');
    a.className = 'list-item' + (done ? ' done' : '');
    a.href = `study.html?set=${encodeURIComponent(set)}&id=${encodeURIComponent(item.id)}`;

    if (set === 'grammar') {
      const jp = document.createElement('span');
      jp.className = 'jp';
      jp.textContent = item.pattern;

      const sub = document.createElement('span');
      sub.className = 'sub';
      sub.textContent = done ? 'Learned · ' + item.summary : item.summary;

      a.append(jp, sub);
    } else {
      const jp = document.createElement('span');
      jp.className = 'jp';
      jp.textContent = item.word;

      const sub = document.createElement('span');
      sub.className = 'sub';
      sub.textContent =
        `${item.reading} · ${done ? 'Learned · ' : ''}${item.meaning}`;

      a.append(jp, sub);
    }

    listEl.appendChild(a);
  }
}

render().catch((err) => {
  console.error(err);
  const el = document.getElementById('entry-list');
  if (el)
    el.innerHTML =
      '<p class="empty-state">Could not load data. Open this site via a local server (fetch() needs HTTP), e.g. <code>python3 -m http.server</code> in this folder.</p>';
});
