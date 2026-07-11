import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';

export default function VotingPage() {
  const { room, myId, timer, voteData, castVote } = useGame();

  if (!room) return null;

  const remaining = timer?.remaining ?? 0;
  const total = timer?.total ?? room?.config?.votingTime ?? 60;
  const progress = remaining / total;
  const isUrgent = remaining <= 10;

  const myVoteTargetId = voteData[myId];
  const hasVoted = !!myVoteTargetId;

  const totalVotes = Object.keys(voteData).length;
  const expectedVotes = room.players.length;

  const formatTime = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Count how many votes each player has (anonymous display)
  const voteCounts = {};
  room.players.forEach(p => { voteCounts[p.id] = 0; });
  Object.values(voteData).forEach(id => { if (voteCounts[id] !== undefined) voteCounts[id]++; });

  function handleVote(targetId) {
    if (hasVoted || targetId === myId) return;
    castVote(targetId);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen px-4 py-8"
    >
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 bg-rose-500/20 border border-rose-500/30 rounded-full px-4 py-1.5 text-rose-300 text-sm mb-3">
            <span className="live-dot" style={{ background: '#f43f5e' }} />
            Voting Phase — Round {room.currentRound}
          </div>
          <h1 className="text-3xl font-bold text-white">Who is the Imposter?</h1>
          <p className="text-white/40 mt-2 text-sm">
            Vote for who you think is the imposter. Each player gets one vote.
          </p>
        </motion.div>

        {/* Timer bar */}
        <motion.div className="glass p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/50">Time to vote</span>
            <span className={`text-2xl font-black tabular-nums ${isUrgent ? 'text-rose-400' : 'text-white'}`}>
              {formatTime(remaining)}
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-rose-500' : 'bg-accent-500'}`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/30">
            <span>{totalVotes}/{expectedVotes} votes cast</span>
            <span>{hasVoted ? '✅ You voted' : '⏳ Waiting for your vote'}</span>
          </div>
        </motion.div>

        {/* Vote status */}
        {hasVoted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass border-green-500/30 bg-green-500/10 p-4 text-center mb-5 rounded-xl"
          >
            <p className="text-green-400 font-semibold">
              ✅ You voted for{' '}
              <span className="text-white">
                {room.players.find(p => p.id === myVoteTargetId)?.name || 'Unknown'}
              </span>
            </p>
          </motion.div>
        )}

        {/* Player grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {room.players.map((player, i) => {
              const isSelf = player.id === myId;
              const isVotedByMe = myVoteTargetId === player.id;
              const voteCount = voteCounts[player.id] || 0;

              return (
                <motion.button
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={!hasVoted && !isSelf ? { scale: 1.02 } : {}}
                  whileTap={!hasVoted && !isSelf ? { scale: 0.98 } : {}}
                  onClick={() => handleVote(player.id)}
                  disabled={hasVoted || isSelf}
                  className={`
                    relative text-left p-5 rounded-2xl border-2 transition-all duration-200
                    ${isVotedByMe
                      ? 'border-rose-500 bg-rose-500/20 glow-rose'
                      : isSelf
                        ? 'border-white/10 bg-white/3 opacity-50 cursor-not-allowed'
                        : hasVoted
                          ? 'border-white/10 bg-white/3 cursor-default'
                          : 'border-white/10 bg-white/5 hover:border-rose-500/50 hover:bg-rose-500/10 cursor-pointer'
                    }
                  `}
                  id={`vote-player-${player.id}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
                    >
                      {player.avatar?.initial || player.name[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-white text-lg">{player.name}</span>
                        {isSelf && <span className="text-xs text-primary-400 bg-primary-500/20 px-2 py-0.5 rounded-full">You</span>}
                        {player.isHost && <span className="text-xs text-accent-400">👑</span>}
                      </div>
                      <div className="text-sm text-white/40">{player.score || 0} pts</div>
                    </div>

                    {/* Vote count */}
                    <div className="text-right">
                      {voteCount > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-rose-400 font-black text-2xl"
                        >
                          {voteCount}
                        </motion.div>
                      )}
                      {isVotedByMe && (
                        <div className="text-rose-300 text-xs mt-1">Your vote</div>
                      )}
                    </div>
                  </div>

                  {/* Imposter suspicion badge */}
                  {!isSelf && !hasVoted && (
                    <div className="absolute top-3 right-3 text-xs text-rose-400/60">
                      Tap to vote →
                    </div>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Waiting for results */}
        {hasVoted && totalVotes < expectedVotes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center text-white/30 text-sm animate-pulse"
          >
            Waiting for {expectedVotes - totalVotes} more vote{expectedVotes - totalVotes !== 1 ? 's' : ''}…
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
