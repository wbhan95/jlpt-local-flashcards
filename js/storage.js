const STORAGE_KEYS = {
  grammar: 'jp-n2-completed-grammar',
  vocabulary: 'jp-n2-completed-vocabulary',
};

/** @param {'grammar' | 'vocabulary'} set */
export function getCompletedIds(set) {
  const raw = localStorage.getItem(STORAGE_KEYS[set]);
  if (!raw) return new Set();
  try {
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

/** @param {'grammar' | 'vocabulary'} set */
export function addCompleted(set, id) {
  const ids = getCompletedIds(set);
  ids.add(id);
  localStorage.setItem(STORAGE_KEYS[set], JSON.stringify([...ids]));
}

/** @param {'grammar' | 'vocabulary'} set */
export function clearCompleted(set) {
  localStorage.removeItem(STORAGE_KEYS[set]);
}
