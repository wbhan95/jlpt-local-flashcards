/** @type {Promise<{ grammar: GrammarItem[], vocabulary: VocabItem[] }> | null} */
let cache = null;

/**
 * @typedef {{ id: string, pattern: string, summary: string, explanation: string, examples: { japanese: string, translation: string }[], similar?: string[] }} GrammarItem
 * @typedef {{ id: string, word: string, reading: string, meaning: string, example?: { japanese: string, translation: string } }} VocabItem
 */

export async function loadAllData() {
  if (cache) return cache;

  cache = Promise.all([
    fetch('data/n2_grammar.json').then((r) => {
      if (!r.ok) throw new Error('Failed to load n2_grammar.json');
      return r.json();
    }),
    fetch('data/n2_vocabulary.json').then((r) => {
      if (!r.ok) throw new Error('Failed to load n2_vocabulary.json');
      return r.json();
    }),
  ]).then(([grammar, vocabulary]) => ({ grammar, vocabulary }));

  return cache;
}

export async function loadGrammar() {
  const { grammar } = await loadAllData();
  return grammar;
}

export async function loadVocabulary() {
  const { vocabulary } = await loadAllData();
  return vocabulary;
}
