import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import sound from '../utils/sound';

export default function VotingPage() {
  const { room, myId, timer, voteData, castVote } = useGame();

  if (!room) return null;

  const remaining = timer?.remaining ?? 0;
  const total = timer?.total ?? room?.config?.votingTime ?? 60;
  const progress = remaining / total;
  const isUrgent = remaining <= 15;

  const myVoteTargetId = voteData[myId];
  const hasVoted = !!myVoteTargetId;

  const totalVotes = Object.keys(voteData).length;
  const expectedVotes = room.players.length;

  const formatTime = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const voteCounts = {};
  room.players.forEach(p => { voteCounts[p.id] = 0; });
  Object.values(voteData).forEach(id => { if (voteCounts[id] !== undefined) voteCounts[id]++; });

  function handleVote(targetId) {
    if (hasVoted || targetId === myId) return;
    sound.cardSelect();
    castVote(targetId);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
      style={{ paddingTop: '64px', paddingBottom: '24px' }}
    >
      <div className="max-w-2xl mx-auto px-3 sm:px-4">

        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-rose-500/20 border border-rose-500/30 rounded-full px-4 py-1 text-rose-300 text-xs mb-2">
            <span className="live-dot" style={{ background: '#f43f5e' }} />
            Voting Phase
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Who is the Imposter? 🕵️</h1>
        </div>

        {/* Timer + vote progress */}
        <div className="glass p-4 mb-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/50">Time left</span>
            <span className={`text-2xl font-black tabular-nums ${isUrgent ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
              {formatTime(remaining)}
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
            <motion.div
              className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-rose-500' : 'bg-accent-500'}`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/30">
            <span>{totalVotes}/{expectedVotes} votes cast</span>
            <span>{hasVoted ? '✅ Voted' : '⏳ Cast your vote'}</span>
          </div>
        </div>

        {/* My vote confirmation */}
        {hasVoted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass border border-green-500/30 bg-green-500/10 p-3 text-center mb-4 rounded-xl"
          >
            <p className="text-green-400 font-semibold text-sm">
              ✅ You voted for{' '}
              <span className="text-white">{room.players.find(p => p.id === myVoteTargetId)?.name || 'Unknown'}</span>
            </p>
          </motion.div>
        )}

        {/* Player vote grid */}
        <div className="space-y-2.5">
          <AnimatePresence>
            {room.players.map((player, i) => {
              const isSelf = player.id === myId;
              const isVotedByMe = myVoteTargetId === player.id;
              const voteCount = voteCounts[player.id] || 0;

              return (
                <motion.button
                  key={player.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={!hasVoted && !isSelf ? { scale: 0.98 } : {}}
                  onClick={() => handleVote(player.id)}
                  disabled={hasVoted || isSelf}
                  style={{ touchAction: 'manipulation', width: '100%', textAlign: 'left' }}
                  className={`
                    relative p-3.5 rounded-2xl border-2 transition-all duration-200
                    ${isVotedByMe
                      ? 'border-rose-500 bg-rose-500/15 glow-rose'
                      : isSelf
                        ? 'border-white/10 bg-white/3 opacity-50 cursor-not-allowed'
                        : hasVoted
                          ? 'border-white/10 bg-white/3 cursor-default'
                          : 'border-white/10 bg-white/5 hover:border-rose-500/40 hover:bg-rose-500/8 cursor-pointer active:bg-rose-500/15'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-md"
                      style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
                    >
                      {player.avatar?.initial || player.name[0]}
                    </div>

                    {/* Name + info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="font-bold text-white text-base truncate max-w-[140px]">{player.name}</span>
                        {isSelf && <span className="badge bg-primary-500/20 text-primary-400">You</span>}
                        {player.isHost && <span className="text-xs text-accent-400">👑</span>}
                      </div>
                      <div className="text-xs text-white/40">{player.score || 0} pts</div>
                    </div>

                    {/* Vote count + indicator */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      {voteCount > 0 ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-rose-400 font-black text-2xl leading-none"
                        >
                          {voteCount}
                        </motion.div>
                      ) : (
                        <div className="w-6" />
                      )}
                      {isVotedByMe && (
                        <div className="text-rose-300 text-[10px] mt-0.5">Your vote</div>
                      )}
                      {!hasVoted && !isSelf && (
                        <div className="text-white/20 text-xs">Tap</div>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Waiting message */}
        {hasVoted && totalVotes < expectedVotes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-5 text-center text-white/30 text-sm animate-pulse"
          >
            Waiting for {expectedVotes - totalVotes} more vote{expectedVotes - totalVotes !== 1 ? 's' : ''}…
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}