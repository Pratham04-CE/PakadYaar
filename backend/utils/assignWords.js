const getRandomWordPair = require('./randomWord');

/**
 * Assigns words to all players.
 * A random selection of `imposters` players get the imposterWord;
 * the rest get the normal word. Neither group is told which role they have.
 *
 * @param {Array}  players  - Array of player objects [{ id, name, ... }]
 * @param {Object} config   - Game config { imposters, category, ... }
 * @returns {Object} Map of socketId → { word, isImposter }
 */
function assignWords(players, config) {
    const { imposters = 1, category = 'food' } = config;
    const { word, imposterWord } = getRandomWordPair(category);

    // Shuffle a copy of the player list to pick imposters randomly
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const imposterIds = new Set(
        shuffled.slice(0, Math.min(imposters, players.length - 1)).map(p => p.id)
    );

    const assignments = {};
    players.forEach(player => {
        const isImposter = imposterIds.has(player.id);
        assignments[player.id] = {
            word: isImposter ? imposterWord : word,
            isImposter
        };
    });

    return assignments;
}

module.exports = assignWords;
