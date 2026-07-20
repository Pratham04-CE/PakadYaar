const getRandomWordPair = require('./randomWord');

/**
 * Assigns words to all players.
 * A random selection of `imposters` players get the imposterWord;
 * the rest get the normal word.
 *
 * @param {Array}  players  - Array of player objects [{ id, name, ... }]
 * @param {Object} config   - Game config { imposters, category, difficulty, language }
 * @returns {Object} Map of socketId → { word, meaning, translations, hints, isImposter, ... }
 */
function assignWords(players, config = {}) {
    const { imposters = 1, category = 'food', difficulty = 'all', language = 'en' } = config;
    const pair = getRandomWordPair(category, difficulty);

    // pair contains { id, category, difficulty, word, imposterWord }
    const normalWordObj = typeof pair.word === 'object' ? pair.word : { text: pair.word };
    const imposterWordObj = typeof pair.imposterWord === 'object' ? pair.imposterWord : { text: pair.imposterWord };

    // Shuffle a copy of the player list to pick imposters randomly
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const imposterIds = new Set(
        shuffled.slice(0, Math.min(imposters, players.length - 1)).map(p => p.id)
    );

    const assignments = {};
    players.forEach(player => {
        const isImposter = imposterIds.has(player.id);
        const selectedObj = isImposter ? imposterWordObj : normalWordObj;

        // Determine word display string (use translation if available and requested, otherwise main text)
        const wordText = selectedObj.text;
        const meaningText = selectedObj.meaning?.[language] || selectedObj.meaning?.en || '';
        const translationText = selectedObj.translations?.[language] || '';

        assignments[player.id] = {
            id: pair.id,
            category: pair.category || category,
            difficulty: pair.difficulty || difficulty,
            word: wordText,
            meaningText,
            meanings: selectedObj.meaning || {},
            translationText,
            translations: selectedObj.translations || {},
            hints: selectedObj.hints || [],
            tags: selectedObj.tags || [],
            isImposter,
            pairWordText: normalWordObj.text,
            pairImposterText: imposterWordObj.text
        };
    });

    return assignments;
}

module.exports = assignWords;

