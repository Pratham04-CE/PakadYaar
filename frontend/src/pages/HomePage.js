import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const features = [
  { icon: '🕵️', title: 'Social Deduction', desc: 'Identify the hidden imposter through clever conversation' },
  { icon: '⚡', title: 'Real-time Play', desc: 'Live gameplay with instant synchronization across all devices' },
  { icon: '🎭', title: '10 Categories', desc: 'Food, Animals, Movies, Sports, Tech and more word packs' },
  { icon: '⏱️', title: 'Timed Rounds', desc: 'Discussion and voting timers keep the game exciting' },
];

const steps = [
  { num: '01', title: 'Join a Room', desc: 'Create or join a private room with a 6-character code.' },
  { num: '02', title: 'Get Your Word', desc: 'Everyone receives a secret word. Imposters get a different one.' },
  { num: '03', title: 'Discuss', desc: 'Describe your word without saying it. Spot inconsistencies.' },
  { num: '04', title: 'Vote', desc: 'Vote for who you think the imposter is before time runs out.' },
];

export default function HomePage() {
  const navigate = useNavigate();


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen"
    >
      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Logo / Title */}
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-6xl animate-float">🎭</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight">
            <span className="text-gradient">Pakad</span>
            <span className="text-white">Yaar</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/60 max-w-md mx-auto leading-relaxed">
            Can you catch the imposter before it's too late?
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row gap-4 mt-4"
        >
          <GameModeButton
            icon="🌐"
            label="Play Online"
            sublabel="Multiplayer with friends"
            onClick={() => navigate('/lobby')}
            primary
          />
          <GameModeButton
            icon="📱"
            label="Play Offline"
            sublabel="Single device party mode"
            onClick={() => navigate('/offline')}
          />
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 flex flex-col items-center gap-2 text-white/30"
        >
          <span className="text-sm">How to play</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            ↓
          </motion.div>
        </motion.div>
      </section>

      {/* HOW TO PLAY */}
      <section className="relative px-4 py-24 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gradient mb-3">How to Play</h2>
          <p className="text-white/50">Four simple steps to an epic game</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass p-6 relative overflow-hidden group hover:border-primary-600/40 transition-all duration-300"
            >
              <span className="absolute -top-3 -right-3 text-7xl font-black text-white/5 group-hover:text-white/10 transition-all">
                {step.num}
              </span>
              <div className="relative">
                <div className="text-2xl font-black text-primary-400 mb-3">{step.num}</div>
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/50">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative px-4 py-16 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-white mb-3">Features</h2>
          <p className="text-white/50">Everything you need for the perfect game night</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass p-5 flex items-start gap-4 hover:border-accent-500/30 transition-all duration-300"
            >
              <span className="text-3xl">{f.icon}</span>
              <div>
                <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-white/50">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative px-4 py-24 text-center max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-strong p-10 glow-purple"
        >
          <h2 className="text-3xl font-bold text-white mb-3">Ready to Play?</h2>
          <p className="text-white/50 mb-8">Gather your friends and start a game right now!</p>
          <button onClick={() => navigate('/lobby')} className="btn-primary text-lg px-10 py-4 w-full">
              🎮 Start Playing
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-white/20 text-sm border-t border-white/5">
        PakadYaar — Social Deduction Party Game &nbsp;|&nbsp; Made with ❤️
      </footer>
    </motion.div>
  );
}

function GameModeButton({ icon, label, sublabel, onClick, primary }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 px-10 py-5 rounded-2xl font-semibold
        transition-all duration-200 min-w-[200px] border
        ${primary
          ? 'bg-primary-600 hover:bg-primary-500 border-primary-500 text-white glow-purple'
          : 'glass border-white/10 hover:border-white/30 text-white'
        }
      `}
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-lg font-bold">{label}</span>
      <span className={`text-xs ${primary ? 'text-primary-200' : 'text-white/40'}`}>{sublabel}</span>
    </motion.button>
  );
}
