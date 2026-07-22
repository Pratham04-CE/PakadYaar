import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const features = [
  { icon: '🕵️', title: 'Social Deduction', desc: 'Identify the hidden imposter through clever conversation' },
  { icon: '⚡', title: 'Real-time Play',    desc: 'Live gameplay with instant sync across all devices' },
  { icon: '🎭', title: '10 Categories',     desc: 'Food, Animals, Movies, Sports, Tech and more' },
  { icon: '⏱️', title: 'Timed Rounds',     desc: 'Discussion and voting timers keep the game thrilling' },
];

const steps = [
  { num: '01', title: 'Join a Room',   desc: 'Create or join a room with a 6-character code.' },
  { num: '02', title: 'Get Your Word', desc: 'Everyone gets a secret word. Imposters get a different one.' },
  { num: '03', title: 'Discuss',       desc: 'Describe your word without saying it. Spot inconsistencies.' },
  { num: '04', title: 'Vote',          desc: 'Vote for who you think the imposter is before time runs out.' },
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
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center pb-16">
        {/* Logo / Title */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-3 mb-3">
            <img
              src="/logo.png"
              alt="PakadYaar Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl shadow-2xl shadow-primary-500/30 animate-float border border-white/10"
            />
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight">
            <span className="text-gradient">Pakad</span>
            <span className="text-white">Yaar</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-white/60 max-w-xs sm:max-w-md mx-auto leading-relaxed">
            Can you catch the imposter before it's too late?
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row gap-3 mt-2 w-full max-w-xs sm:max-w-none sm:w-auto"
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
          className="absolute bottom-8 flex flex-col items-center gap-1 text-white/30"
        >
          <span className="text-xs">How to play</span>
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>↓</motion.div>
        </motion.div>
      </section>

      {/* HOW TO PLAY */}
      <section className="relative px-4 py-16 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">How to Play</h2>
          <p className="text-white/50 text-sm">Four simple steps to an epic game</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass p-4 relative overflow-hidden group hover:border-primary-600/40 transition-all duration-300"
            >
              <span className="absolute -top-2 -right-2 text-5xl font-black text-white/5 group-hover:text-white/10 transition-all">
                {step.num}
              </span>
              <div className="relative">
                <div className="text-lg font-black text-primary-400 mb-2">{step.num}</div>
                <h3 className="font-bold text-white text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative px-4 py-12 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Features</h2>
          <p className="text-white/50 text-sm">Everything you need for the perfect game night</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass p-4 flex items-start gap-3 hover:border-accent-500/30 transition-all duration-300"
            >
              <span className="text-2xl flex-shrink-0">{f.icon}</span>
              <div>
                <h3 className="font-semibold text-white mb-0.5 text-sm">{f.title}</h3>
                <p className="text-xs text-white/50">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative px-4 py-16 text-center max-w-sm mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-strong p-7 glow-purple"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Ready to Play?</h2>
          <p className="text-white/50 mb-6 text-sm">Gather your friends and start a game now!</p>
          <button
            onClick={() => navigate('/lobby')}
            className="btn-primary text-base px-8 py-4 w-full"
            style={{ touchAction: 'manipulation' }}
          >
            🎮 Start Playing
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-white/20 text-xs border-t border-white/5">
        PakadYaar — Social Deduction Party Game &nbsp;|&nbsp; Made with ❤️
      </footer>
    </motion.div>
  );
}

function GameModeButton({ icon, label, sublabel, onClick, primary }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{ touchAction: 'manipulation' }}
      className={`
        flex flex-col items-center gap-1 px-8 py-4 rounded-2xl font-semibold w-full
        transition-all duration-200 border
        ${primary
          ? 'bg-primary-600 hover:bg-primary-500 border-primary-500 text-white glow-purple'
          : 'glass border-white/10 hover:border-white/30 text-white'
        }
      `}
    >
      <span className="text-2xl sm:text-3xl">{icon}</span>
      <span className="text-base font-bold">{label}</span>
      <span className={`text-xs ${primary ? 'text-primary-200' : 'text-white/40'}`}>{sublabel}</span>
    </motion.button>
  );
}
