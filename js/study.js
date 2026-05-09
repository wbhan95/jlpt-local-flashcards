import { loadGrammar, loadVocabulary } from './data.js';
import { addCompleted, getCompletedIds } from './storage.js';

const params = new URLSearchParams(location.search);
const set = params.get('set');
const startId = params.get('id');

if (set !== 'grammar' && set !== 'vocabulary') {
  location.href = 'index.html';
}

const backLink = document.getElementById('back-link');
if (backLink) backLink.href = `${set}.html`;

const titleEl = document.getElementById('study-title');
const shellEl = document.getElementById('study-shell');
const progressEl = document.getElementById('progress-label');

if (titleEl) titleEl.textContent = set === 'grammar' ? 'Grammar' : 'Vocabulary';

async function init() {
  const itemsRaw = set === 'grammar' ? await loadGrammar() : await loadVocabulary();
  const grammarById =
    set === 'grammar' ? new Map(itemsRaw.map((it) => [it.id, it])) : null;
  const completed = getCompletedIds(set);
  /** @type {typeof itemsRaw} */
  let queue = itemsRaw.filter((it) => !completed.has(it.id));
  let index = startId ? queue.findIndex((it) => it.id === startId) : 0;
  if (index < 0) index = 0;

  function updateProgress() {
    if (progressEl) {
      const n = queue.length;
      progressEl.textContent =
        n === 0 ? 'All caught up' : `${n} card${n === 1 ? '' : 's'} left`;
    }
  }

  function renderDone() {
    shellEl.innerHTML = `
      <div class="empty-state">
        <p>No cards left to study.</p>
        <p>You've marked everything in this set—or add more rows in JSON.</p>
        <a class="btn primary" href="${set}.html">Back to list</a>
      </div>`;
    updateProgress();
  }

  /** @type {HTMLElement | null} */
  let cardEl = null;

  function attachFlipHandlers(root) {
    const inner = root.querySelector('.flashcard-inner');
    const fc = root;
    root.addEventListener(
      'click',
      () => {
        fc.classList.toggle('flipped');
      },
      { passive: true },
    );
    inner.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        fc.classList.toggle('flipped');
      }
    });
    inner.tabIndex = 0;
    inner.setAttribute('role', 'button');
    inner.setAttribute('aria-label', 'Flip card');
  }

  function grammarSimilarHtml(item) {
    if (!grammarById || !item.similar?.length) return '';
    const lis = item.similar
      .map((sid) => {
        const o = grammarById.get(sid);
        const pattern = o?.pattern ?? sid;
        const sub = o?.summary ? ` — ${o.summary}` : '';
        return `<li><span class="jp-line">${escapeHtml(pattern)}</span>${escapeHtml(sub)}</li>`;
      })
      .join('');
    return `
            <div class="card-section">
              <h3>Similar / easily confused</h3>
              <ul class="similar-list">${lis}</ul>
            </div>`;
  }

  function renderCard() {
    if (queue.length === 0) {
      renderDone();
      return;
    }

    if (index >= queue.length) index = queue.length - 1;

    const item = queue[index];
    shellEl.innerHTML = '';

    const flipRoot = document.createElement('div');
    flipRoot.className = 'flashcard';
    flipRoot.id = 'active-flashcard';

    if (set === 'grammar') {
      flipRoot.innerHTML = `
        <div class="flashcard-inner" tabindex="0">
          <div class="flashcard-face front">
            <div class="card-front-main">${escapeHtml(item.pattern)}</div>
            <div class="card-front-sub">${escapeHtml(item.summary)}</div>
            <div class="flip-hint">Tap to flip</div>
          </div>
          <div class="flashcard-face back">
            <div class="card-section">
              <h3>Explanation</h3>
              <p>${escapeHtml(item.explanation)}</p>
            </div>
            <div class="card-section">
              <h3>Examples</h3>
              ${item.examples.map((ex) => `<p class="jp-line">${escapeHtml(ex.japanese)}</p><p>${escapeHtml(ex.translation)}</p>`).join('')}
            </div>
            ${grammarSimilarHtml(item)}
            <div class="flip-hint">Tap to flip back</div>
          </div>
        </div>`;
    } else {
      const ex = item.example;
      const exBlock = ex
        ? `<div class="card-section"><h3>Example</h3><p class="jp-line">${escapeHtml(ex.japanese)}</p><p>${escapeHtml(ex.translation)}</p></div>`
        : '';
      flipRoot.innerHTML = `
        <div class="flashcard-inner" tabindex="0">
          <div class="flashcard-face front">
            <div class="card-front-main">${escapeHtml(item.word)}</div>
            <div class="card-front-sub">${escapeHtml(item.reading)}</div>
            <div class="flip-hint">Tap to flip</div>
          </div>
          <div class="flashcard-face back">
            <div class="card-section">
              <h3>Meaning</h3>
              <p>${escapeHtml(item.meaning)}</p>
            </div>
            ${exBlock}
            <div class="flip-hint">Tap to flip back</div>
          </div>
        </div>`;
    }

    shellEl.appendChild(flipRoot);
    cardEl = flipRoot;
    attachFlipHandlers(flipRoot);

    const actions = document.createElement('div');
    actions.className = 'study-actions';
    actions.innerHTML = `
      <button type="button" class="btn success" id="btn-learned">I know this</button>
      <button type="button" class="btn ghost" id="btn-skip">Skip for now</button>
    `;
    shellEl.appendChild(actions);

    document.getElementById('btn-learned').addEventListener('click', () => {
      addCompleted(set, item.id);
      queue.splice(index, 1);
      if (index >= queue.length && queue.length > 0) index = queue.length - 1;
      const fc = document.getElementById('active-flashcard');
      if (fc) fc.classList.remove('flipped');
      updateProgress();
      renderCard();
    });

    document.getElementById('btn-skip').addEventListener('click', () => {
      if (queue.length <= 1) return;
      index = (index + 1) % queue.length;
      const fc = document.getElementById('active-flashcard');
      if (fc) fc.classList.remove('flipped');
      renderCard();
    });

    updateProgress();
  }

  renderCard();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

init().catch((err) => {
  console.error(err);
  shellEl.innerHTML =
    '<p class="empty-state">Could not load data. Serve this folder over HTTP (e.g. <code>python3 -m http.server</code>).</p>';
});
