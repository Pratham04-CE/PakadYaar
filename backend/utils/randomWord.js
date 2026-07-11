const words = require('../data/words.json');

/**
 * Returns a random { word, imposterWord } pair from the given category.
 * Falls back to "food" if the category doesn't exist.
 */
function getRandomWordPair(category = 'food') {
    const pool = words[category] || words['food'];
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
}

module.exports = getRandomWordPair;
