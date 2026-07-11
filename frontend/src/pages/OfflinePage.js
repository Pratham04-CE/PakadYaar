import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { id: 'food',       name: 'Food',             emoji: '🍕' },
  { id: 'animals',   name: 'Animals',           emoji: '🐶' },
  { id: 'movies',    name: 'Movies',            emoji: '🎬' },
  { id: 'sports',    name: 'Sports',            emoji: '⚽' },
  { id: 'countries', name: 'Countries',         emoji: '🌍' },
  { id: 'technology',name: 'Technology',        emoji: '📱' },
  { id: 'music',     name: 'Music',             emoji: '🎵' },
  { id: 'games',     name: 'Games',             emoji: '🎮' },
  { id: 'general',   name: 'General Knowledge', emoji: '📚' },
  { id: 'mixed',     name: 'Mixed',             emoji: '🎭' },
];

// Offline word pairs (same data, imported inline for offline use)
const WORDS = {
  food:       [{ word: 'Pizza', iw: 'Burger' }, { word: 'Sushi', iw: 'Ramen' }, { word: 'Ice Cream', iw: 'Gelato' }, { word: 'Coffee', iw: 'Tea' }, { word: 'Tacos', iw: 'Burrito' }],
  animals:    [{ word: 'Dog', iw: 'Cat' }, { word: 'Lion', iw: 'Tiger' }, { word: 'Eagle', iw: 'Hawk' }, { word: 'Penguin', iw: 'Seal' }, { word: 'Wolf', iw: 'Fox' }],
  movies:     [{ word: 'Avengers', iw: 'Justice League' }, { word: 'Star Wars', iw: 'Star Trek' }, { word: 'Harry Potter', iw: 'Lord of the Rings' }, { word: 'Inception', iw: 'Interstellar' }],
  sports:     [{ word: 'Football', iw: 'Rugby' }, { word: 'Basketball', iw: 'Volleyball' }, { word: 'Cricket', iw: 'Baseball' }, { word: 'Tennis', iw: 'Badminton' }],
  countries:  [{ word: 'India', iw: 'Pakistan' }, { word: 'France', iw: 'Germany' }, { word: 'Brazil', iw: 'Argentina' }, { word: 'Japan', iw: 'China' }],
  technology: [{ word: 'iPhone', iw: 'Android Phone' }, { word: 'Google', iw: 'Microsoft' }, { word: 'Netflix', iw: 'Hulu' }, { word: 'Bitcoin', iw: 'Ethereum' }],
  music:      [{ word: 'Guitar', iw: 'Bass Guitar' }, { word: 'Rock', iw: 'Metal' }, { word: 'Jazz', iw: 'Blues' }, { word: 'Piano', iw: 'Keyboard' }],
  games:      [{ word: 'Chess', iw: 'Checkers' }, { word: 'Minecraft', iw: 'Roblox' }, { word: 'Fortnite', iw: 'PUBG' }, { word: 'Mario', iw: 'Sonic' }],
  general:    [{ word: 'Sun', iw: 'Moon' }, { word: 'Mountain', iw: 'Hill' }, { word: 'School', iw: 'University' }, { word: 'Airplane', iw: 'Helicopter' }],
  mixed:      [{ word: 'Superhero', iw: 'Villain' }, { word: 'Day', iw: 'Night' }, { word: 'Summer', iw: 'Winter' }, { word: 'Vampire', iw: 'Werewolf' }],
};

const OFFLINE_PHASES = {
  SETUP:    'setup',
  REVEAL:   'reveal',       // Pass phone to each player
  GAME:     'game',         // Discussion
  VOTE:     'vote',
  RESULTS:  'results',
};

export default function OfflinePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(OFFLINE_PHASES.SETUP);

  // Setup state
  const [players, setPlayers] = useState([{ name: '' }, { name: '' }, { name: '' }]);
  const [config, setConfig] = useState({ imposters: 1, category: 'food', discussionTime: 120 });

  // Game state
  const [assignments, setAssignments] = useState([]); // [{ name, word }]
  const [revealIndex, setRevealIndex] = useState(0);
  const [wordVisible, setWordVisible] = useState(false);
  const [votes, setVotes] = useState({});
  const [results, setResults] = useState(null);
  const [timer, setTimer] = useState(null);

  // --- Setup ---
  function addPlayer() { setPlayers(p => [...p, { name: '' }]); }
  function removePlayer(i) { setPlayers(p => p.filter((_, j) => j !== i)); }
  function setPlayerName(i, name) { setPlayers(p => p.map((pl, j) => j === i ? { ...pl, name } : pl)); }

  function startGame() {
    const validPlayers = players.filter(p => p.name.trim());
    if (validPlayers.length < 3) return;

    const pool = WORDS[config.category] || WORDS.food;
    const pair = pool[Math.floor(Math.random() * pool.length)];
    const shuffled = [...validPlayers].sort(() => Math.random() - 0.5);
    const imposterCount = Math.min(config.imposters, validPlayers.length - 1);
    const imposterNames = new Set(shuffled.slice(0, imposterCount).map(p => p.name));

    const asgn = validPlayers.map(p => ({
      name: p.name,
      word: imposterNames.has(p.name) ? pair.iw : pair.word,
    }));

    setAssignments(asgn);
    setRevealIndex(0);
    setWordVisible(false);
    setVotes({});
    setResults(null);
    setPhase(OFFLINE_PHASES.REVEAL);
  }

  function revealWord() { setWordVisible(true); }

  function confirmAndNext() {
    if (revealIndex + 1 < assignments.length) {
      setRevealIndex(i => i + 1);
      setWordVisible(false);
    } else {
      // All players have seen their word
      setPhase(OFFLINE_PHASES.GAME);
      let t = config.discussionTime;
      setTimer(t);
      const iv = setInterval(() => {
        t--;
        setTimer(t);
        if (t <= 0) { clearInterval(iv); setPhase(OFFLINE_PHASES.VOTE); }
      }, 1000);
    }
  }

  function castVote(voterName, targetName) {
    const newVotes = { ...votes, [voterName]: targetName };
    setVotes(newVotes);
    if (Object.keys(newVotes).length >= assignments.length) {
      tallyOfflineVotes(newVotes);
    }
  }

  function tallyOfflineVotes(v) {
    const counts = {};
    assignments.forEach(a => { counts[a.name] = 0; });
    Object.values(v).forEach(name => { if (counts[name] !== undefined) counts[name]++; });
    const max = Math.max(...Object.values(counts));
    const top = Object.keys(counts).filter(n => counts[n] === max);
    const eliminated = top[0];
    const eliminatedAssign = assignments.find(a => a.name === eliminated);
    // Check if the imposter word pool has the eliminated word
    const pool = WORDS[config.category] || WORDS.food;
    const allImposterWords = pool.map(p => p.iw);
    const isImposter = allImposterWords.includes(eliminatedAssign?.word);

    setResults({ counts, eliminated, isImposter, assignments });
    setPhase(OFFLINE_PHASES.RESULTS);
  }

  const formatTime = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen px-4 py-8 flex flex-col items-center"
    >
      <div className="w-full max-w-lg">
        {/* Back */}
        <button onClick={() => navigate('/')} className="btn-ghost text-sm px-4 py-2 mb-8">
          ← Back to Home
        </button>

        {/* ─────────── SETUP ─────────── */}
        {phase === OFFLINE_PHASES.SETUP && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <span className="text-5xl">📱</span>
              <h1 className="text-3xl font-black text-white mt-3">Offline Mode</h1>
              <p className="text-white/40 mt-2 text-sm">One device, pass it around!</p>
            </div>

            {/* Players */}
            <div className="glass p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white">Players ({players.length})</h2>
                {players.length < 10 && (
                  <button onClick={addPlayer} className="text-accent-400 text-sm hover:text-accent-300">+ Add</button>
                )}
              </div>
              <div className="space-y-2">
                {players.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="input flex-1 py-2 text-sm"
                      placeholder={`Player ${i + 1}`}
                      value={p.name}
                      onChange={e => setPlayerName(i, e.target.value)}
                    />
                    {players.length > 3 && (
                      <button onClick={() => removePlayer(i)} className="text-rose-400 px-2">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Config */}
            <div className="glass p-6 mb-6">
              <h2 className="font-bold text-white mb-4">Settings</h2>
              <div className="mb-4">
                <label className="text-sm text-white/60 mb-2 block">Category</label>
                <select
                  className="input"
                  value={config.category}
                  onChange={e => setConfig(c => ({ ...c, category: e.target.value }))}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id} style={{ background: '#0a0a1f' }}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-white/60">Imposters</label>
                  <span className="text-accent-400 text-sm font-semibold">{config.imposters}</span>
                </div>
                <input type="range" min={1} max={3} value={config.imposters}
                  onChange={e => setConfig(c => ({ ...c, imposters: +e.target.value }))}
                  className="w-full accent-purple-500" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-white/60">Discussion Time</label>
                  <span className="text-accent-400 text-sm font-semibold">{config.discussionTime}s</span>
                </div>
                <input type="range" min={30} max={300} step={30} value={config.discussionTime}
                  onChange={e => setConfig(c => ({ ...c, discussionTime: +e.target.value }))}
                  className="w-full accent-purple-500" />
              </div>
            </div>

            <button
              onClick={startGame}
              disabled={players.filter(p => p.name.trim()).length < 3}
              className="btn-primary w-full py-4 text-lg"
            >
              🚀 Start Game
            </button>
          </motion.div>
        )}

        {/* ─────────── WORD REVEAL ─────────── */}
        {phase === OFFLINE_PHASES.REVEAL && assignments[revealIndex] && (
          <motion.div
            key={revealIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              Pass the phone to <span className="text-accent-400">{assignments[revealIndex].name}</span>
            </h2>
            <p className="text-white/40 text-sm mb-8">Make sure no one else can see the screen</p>

            <div className="glass-strong p-10 mb-6 cursor-pointer" onClick={!wordVisible ? revealWord : undefined}>
              {!wordVisible ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-5xl">🔒</div>
                  <p className="text-white font-semibold">Tap to see your word</p>
                </div>
              ) : (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="text-5xl font-black text-white">{assignments[revealIndex].word}</div>
                  <p className="text-white/40 text-xs uppercase tracking-widest">Your Secret Word</p>
                </motion.div>
              )}
            </div>

            {wordVisible && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={confirmAndNext}
                className="btn-primary w-full py-4"
              >
                {revealIndex + 1 < assignments.length
                  ? `✅ Done — Pass to ${assignments[revealIndex + 1].name}`
                  : '✅ Everyone has seen — Start Discussion!'
                }
              </motion.button>
            )}

            <div className="mt-4 text-white/30 text-sm">
              Player {revealIndex + 1} of {assignments.length}
            </div>
          </motion.div>
        )}

        {/* ─────────── DISCUSSION ─────────── */}
        {phase === OFFLINE_PHASES.GAME && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">💬 Discuss!</h2>
            <p className="text-white/50 mb-8 text-sm">Describe your word without saying it. Spot the imposter!</p>
            <div className="glass-strong p-10 glow-teal mb-6">
              <div className={`text-6xl font-black tabular-nums ${timer <= 15 ? 'text-rose-400' : 'text-white'}`}>
                {formatTime(timer)}
              </div>
              <p className="text-white/40 text-sm mt-2">Time remaining</p>
            </div>
            <p className="text-white/30 text-sm">Voting starts automatically when time runs out</p>
          </motion.div>
        )}

        {/* ─────────── VOTING ─────────── */}
        {phase === OFFLINE_PHASES.VOTE && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-3xl font-bold text-white text-center mb-2">🗳️ Vote!</h2>
            <p className="text-white/50 text-center text-sm mb-6">
              {Object.keys(votes).length} / {assignments.length} votes cast
            </p>

            {/* Who is currently voting */}
            {assignments.map(voter => {
              if (votes[voter.name]) return null;
              return (
                <div key={voter.name} className="glass p-4 mb-4">
                  <p className="text-white font-semibold mb-3">
                    <span className="text-accent-400">{voter.name}</span>, vote for the imposter:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {assignments
                      .filter(target => target.name !== voter.name)
                      .map(target => (
                        <button
                          key={target.name}
                          onClick={() => castVote(voter.name, target.name)}
                          className="glass p-3 text-center text-white font-semibold hover:border-rose-500/50 hover:bg-rose-500/10 transition-all"
                        >
                          {target.name}
                        </button>
                      ))
                    }
                  </div>
                </div>
              );
            })}

            {assignments.every(a => votes[a.name]) && (
              <p className="text-center text-accent-400 animate-pulse">Tallying votes…</p>
            )}
          </motion.div>
        )}

        {/* ─────────── RESULTS ─────────── */}
        {phase === OFFLINE_PHASES.RESULTS && results && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="text-7xl mb-4">{results.isImposter ? '🏆' : '😈'}</div>
            <h2 className={`text-4xl font-black mb-2 ${results.isImposter ? 'text-accent-300' : 'text-rose-300'}`}>
              {results.isImposter ? 'Players Win!' : 'Imposter Wins!'}
            </h2>
            <p className="text-white/60 mb-6">
              <span className="text-white font-semibold">{results.eliminated}</span> was{' '}
              {results.isImposter ? 'the imposter!' : 'innocent!'}
            </p>

            <div className="glass p-6 text-left mb-6">
              <h3 className="font-bold text-white mb-3">Word Reveal 🔓</h3>
              <div className="space-y-2">
                {results.assignments.map(a => {
                  const pool = WORDS[config.category] || WORDS.food;
                  const allImposterWords = pool.map(p => p.iw);
                  const isImp = allImposterWords.includes(a.word);
                  return (
                    <div key={a.name} className={`flex justify-between p-2.5 rounded-lg ${isImp ? 'bg-rose-500/20 border border-rose-500/30' : 'bg-white/3'}`}>
                      <span className="text-white font-semibold">{a.name} {isImp && '🎭'}</span>
                      <span className={isImp ? 'text-rose-300' : 'text-accent-300'}>{a.word}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={() => setPhase(OFFLINE_PHASES.SETUP)} className="btn-primary w-full py-4">
                🔄 Play Again
              </button>
              <button onClick={() => navigate('/')} className="btn-ghost w-full py-3 text-sm">
                🏠 Home
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
