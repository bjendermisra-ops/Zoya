import { motion, AnimatePresence } from 'motion/react';
import { OrbState } from '../types';

interface OrbProps {
  state: OrbState;
  isVerified: boolean;
}

export function Orb({ state, isVerified }: OrbProps) {
  const getOrbColor = () => {
    if (state === 'error') return 'from-red-500 to-red-800 shadow-red-500/50';
    if (isVerified) return 'from-pink-500 via-purple-500 to-blue-500 shadow-purple-500/50';
    return 'from-purple-600 to-blue-600 shadow-blue-500/50';
  };

  const getAnimationProps = () => {
    switch (state) {
      case 'listening':
        return {
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
          transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
        };
      case 'speaking':
        return {
          scale: [1, 1.2, 0.9, 1.1, 1],
          transition: { duration: 0.8, repeat: Infinity, ease: "linear" }
        };
      case 'thinking':
        return {
          rotate: [0, 360],
          transition: { duration: 2, repeat: Infinity, ease: "linear" }
        };
      case 'connecting':
        return {
          scale: [0.8, 1, 0.8],
          opacity: [0.5, 1, 0.5],
          transition: { duration: 1, repeat: Infinity }
        };
      default:
        return { scale: 1, opacity: 0.8 };
    }
  };

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer Glows */}
      <AnimatePresence>
        {(state === 'speaking' || state === 'listening') && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.2 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`absolute inset-0 rounded-full bg-gradient-to-r ${getOrbColor()} blur-3xl`}
          />
        )}
      </AnimatePresence>

      {/* Main Orb */}
      <motion.div
        animate={getAnimationProps()}
        className={`relative w-48 h-48 rounded-full bg-gradient-to-br ${getOrbColor()} shadow-[0_0_60px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden border border-white/10`}
      >
        {/* Internal Particles/Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
        
        {/* Waveform Simulation */}
        {state === 'speaking' && (
          <div className="flex items-end gap-1 h-12">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [10, 40, 10] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                className="w-1 bg-white/40 rounded-full"
              />
            ))}
          </div>
        )}

        {/* Idle Pulse */}
        {state === 'idle' && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-white/20 text-xs font-mono tracking-widest uppercase"
          >
            Zoya
          </motion.div>
        )}
      </motion.div>

      {/* Decorative Rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute w-72 h-72 border border-white/5 rounded-full"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute w-80 h-80 border border-white/5 rounded-full border-dashed"
      />
    </div>
  );
}
