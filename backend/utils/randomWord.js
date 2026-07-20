const words = require('../data/words.json');

/**
 * Returns a random { word, imposterWord, ... } pair from the given category and optional difficulty.
 * Falls back to all words in the category or "food" if pool is empty or invalid.
 */
function getRandomWordPair(category = 'food', difficulty = 'all') {
    let pool = words[category] || words['food'] || [];
    
    if (difficulty && difficulty !== 'all') {
        const filtered = pool.filter(item => item.difficulty === difficulty);
        if (filtered.length > 0) {
            pool = filtered;
        }
    }

    if (!pool || pool.length === 0) {
        pool = words['food'];
    }

    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
}

module.exports = getRandomWordPair;

