import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import wordsData from '../data/words.json';

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

const DIFFICULTIES = [
  { id: 'all',    name: 'All Levels', emoji: '🎲' },
  { id: 'easy',   name: 'Easy',       emoji: '🟢' },
  { id: 'medium', name: 'Medium',     emoji: '🟡' },
  { id: 'hard',   name: 'Hard',       emoji: '🔴' },
];

const LANGUAGES = [
  { id: 'en', name: 'English', flag: '🇬🇧' },
  { id: 'hi', name: 'Hindi (हिंदी)', flag: '🇮🇳' },
  { id: 'gu', name: 'Gujarati (ગુજરાતી)', flag: '🇮🇳' },
];

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
  const [config, setConfig] = useState({
    imposters: 1,
    category: 'food',
    difficulty: 'all',
    language: 'en',
    discussionTime: 120
  });

  // Game state
  const [assignments, setAssignments] = useState([]);
  const [revealIndex, setRevealIndex] = useState(0);
  const [wordVisible, setWordVisible] = useState(false);
  const [revealedHintCount, setRevealedHintCount] = useState(0);
  const [votes, setVotes] = useState({});
  const [results, setResults] = useState(null);
  const [timer, setTimer] = useState(null);

  // Setup helpers
  function addPlayer() { setPlayers(p => [...p, { name: '' }]); }
  function removePlayer(i) { setPlayers(p => p.filter((_, j) => j !== i)); }
  function setPlayerName(i, name) { setPlayers(p => p.map((pl, j) => j === i ? { ...pl, name } : pl)); }

  function getRandomWordPair(cat, diff) {
    let pool = wordsData[cat] || wordsData.food || [];
    if (diff && diff !== 'all') {
      const filtered = pool.filter(item => item.difficulty === diff);
      if (filtered.length > 0) pool = filtered;
    }
    if (!pool || pool.length === 0) pool = wordsData.food;
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }

  function startGame() {
    const validPlayers = players.filter(p => p.name.trim());
    if (validPlayers.length < 3) return;

    const pair = getRandomWordPair(config.category, config.difficulty);
    const lang = config.language || 'en';

    const normalWordObj = typeof pair.word === 'object' ? pair.word : { text: pair.word };
    const imposterWordObj = typeof pair.imposterWord === 'object' ? pair.imposterWord : { text: pair.imposterWord };

    const shuffled = [...validPlayers].sort(() => Math.random() - 0.5);
    const imposterCount = Math.min(config.imposters, validPlayers.length - 1);
    const imposterNames = new Set(shuffled.slice(0, imposterCount).map(p => p.name));

    const asgn = validPlayers.map(p => {
      const isImposter = imposterNames.has(p.name);
      const selectedObj = isImposter ? imposterWordObj : normalWordObj;

      return {
        name: p.name,
        word: selectedObj.text,
        meaningText: selectedObj.meaning?.[lang] || selectedObj.meaning?.en || '',
        translationText: selectedObj.translations?.[lang] || '',
        hints: selectedObj.hints || [],
        difficulty: pair.difficulty || 'easy',
        isImposter
      };
    });

    setAssignments(asgn);
    setRevealIndex(0);
    setWordVisible(false);
    setRevealedHintCount(0);
    setVotes({});
    setResults(null);
    setPhase(OFFLINE_PHASES.REVEAL);
  }

  function revealWord() { setWordVisible(true); }

  function confirmAndNext() {
    if (revealIndex + 1 < assignments.length) {
      setRevealIndex(i => i + 1);
      setWordVisible(false);
      setRevealedHintCount(0);
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
    const isImposter = eliminatedAssign?.isImposter ?? false;

    setResults({ counts, eliminated, isImposter, assignments });
    setPhase(OFFLINE_PHASES.RESULTS);
  }

  const formatTime = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const currentAssignment = assignments[revealIndex];
  const hints = currentAssignment && Array.isArray(currentAssignment.hints) ? currentAssignment.hints : [];

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
            <div className="glass p-6 mb-6 space-y-4">
              <h2 className="font-bold text-white mb-2">Game Settings</h2>

              {/* Category */}
              <div>
                <label className="text-xs text-white/60 mb-1.5 block">Category</label>
                <select
                  className="input text-sm py-2"
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

              {/* Difficulty */}
              <div>
                <label className="text-xs text-white/60 mb-1.5 block">Difficulty</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setConfig(c => ({ ...c, difficulty: d.id }))}
                      className={`
                        p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border
                        ${config.difficulty === d.id ? 'bg-accent-600/30 border-accent-500/60 text-white' : 'border-white/10 text-white/40'}
                      `}
                    >
                      <span>{d.emoji}</span>
                      <span className="truncate">{d.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="text-xs text-white/60 mb-1.5 block">Language</label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setConfig(c => ({ ...c, language: lang.id }))}
                      className={`
                        p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border
                        ${config.language === lang.id ? 'bg-primary-600/30 border-primary-500/60 text-white' : 'border-white/10 text-white/40'}
                      `}
                    >
                      <span>{lang.flag}</span>
                      <span className="truncate">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Imposters slider */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-white/60">Imposters</label>
                  <span className="text-accent-400 text-xs font-semibold">{config.imposters}</span>
                </div>
                <input type="range" min={1} max={3} value={config.imposters}
                  onChange={e => setConfig(c => ({ ...c, imposters: +e.target.value }))}
                  className="w-full accent-purple-500" />
              </div>

              {/* Discussion Time */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-white/60">Discussion Time</label>
                  <span className="text-accent-400 text-xs font-semibold">{config.discussionTime}s</span>
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
        {phase === OFFLINE_PHASES.REVEAL && currentAssignment && (
          <motion.div
            key={revealIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              Pass the phone to <span className="text-accent-400">{currentAssignment.name}</span>
            </h2>
            <p className="text-white/40 text-sm mb-6">Make sure no one else can see the screen</p>

            <div className="glass-strong p-8 mb-6 cursor-pointer select-none" onClick={!wordVisible ? revealWord : undefined}>
              {!wordVisible ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="text-5xl">🔒</div>
                  <p className="text-white font-semibold">Tap to see your word</p>
                </div>
              ) : (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="text-5xl font-black text-white">{currentAssignment.word}</div>

                  {currentAssignment.translationText && currentAssignment.translationText !== currentAssignment.word && (
                    <div className="text-lg font-bold text-accent-300">
                      ({currentAssignment.translationText})
                    </div>
                  )}

                  <div className="h-px w-3/4 bg-white/10 my-1" />

                  {currentAssignment.meaningText && (
                    <p className="text-white/70 text-xs italic px-2">
                      "{currentAssignment.meaningText}"
                    </p>
                  )}

                  <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Your Secret Word</p>
                </motion.div>
              )}
            </div>

            {/* Clues Card */}
            {wordVisible && hints.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-4 mb-6 text-left rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span>💡</span> Clues & Hints ({revealedHintCount}/{hints.length})
                  </span>
                  {revealedHintCount < hints.length && (
                    <button
                      onClick={() => setRevealedHintCount(c => c + 1)}
                      className="text-xs text-primary-300 bg-primary-500/20 hover:bg-primary-500/30 px-3 py-1 rounded-full border border-primary-500/30 transition-all"
                    >
                      + Unlock Hint
                    </button>
                  )}
                </div>

                {revealedHintCount > 0 && (
                  <div className="space-y-2">
                    {hints.slice(0, revealedHintCount).map((hint, idx) => (
                      <div key={idx} className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 flex items-start gap-2">
                        <span className="font-bold text-amber-400">#{idx + 1}</span>
                        <span>{hint}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

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
                {results.assignments.map(a => (
                  <div key={a.name} className={`flex flex-col p-3 rounded-lg border gap-1 ${a.isImposter ? 'bg-rose-500/20 border-rose-500/30' : 'bg-white/3 border-white/5'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">{a.name} {a.isImposter && '🎭 (Imposter)'}</span>
                      <span className={`font-bold ${a.isImposter ? 'text-rose-300' : 'text-accent-300'}`}>
                        {a.word} {a.translationText && a.translationText !== a.word && `(${a.translationText})`}
                      </span>
                    </div>
                    {a.meaningText && (
                      <p className="text-xs text-white/60 italic bg-black/20 px-2 py-1 rounded">
                        "{a.meaningText}"
                      </p>
                    )}
                  </div>
                ))}
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
