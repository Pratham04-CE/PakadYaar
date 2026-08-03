const words = require('../data/words.json');

/**
 * Returns a random { word, imposterWord, ... } pair from the given category and optional difficulty.
 * Excludes word IDs in `excludeIds` to prevent repeating words across rounds in a room.
 */
function getRandomWordPair(category = 'food', difficulty = 'all', excludeIds = []) {
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

    // Filter out already used words in the current room session
    const excludeSet = new Set(excludeIds || []);
    let availablePool = pool.filter(item => !excludeSet.has(item.id));
    
    // If all words in the pool have been used, reset and pick from full pool
    if (availablePool.length === 0) {
        availablePool = pool;
    }

    const index = Math.floor(Math.random() * availablePool.length);
    return availablePool[index];
}

module.exports = getRandomWordPair;

