import React from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  state: 'idle' | 'connecting' | 'listening' | 'speaking';
  onConnect: () => void;
  onDisconnect: () => void;
}

export function MicButton({ state, onConnect, onDisconnect }: Props) {
  const isConnected = state === 'listening' || state === 'speaking';
  
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={isConnected ? onDisconnect : onConnect}
      disabled={state === 'connecting'}
      className={`
        relative flex items-center justify-center w-20 h-20 rounded-full shadow-lg transition-colors
        ${state === 'connecting' ? 'bg-orange-300 cursor-not-allowed' : ''}
        ${state === 'idle' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
        ${isConnected ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
      `}
    >
      {state === 'connecting' && <Loader2 className="w-8 h-8 animate-spin text-white" />}
      {state === 'idle' && <Mic className="w-8 h-8" />}
      {isConnected && <Square className="w-8 h-8 fill-current" />}
      
      {/* Ripple effect when active */}
      {isConnected && (
        <span className="absolute inset-0 rounded-full border-4 border-orange-500 animate-ping opacity-20"></span>
      )}
    </motion.button>
  );
}
