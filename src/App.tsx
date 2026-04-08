import { Mic, MicOff, ShieldCheck, Terminal, Settings, History, X, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import { useZoya } from './hooks/useZoya';
import { Orb } from './components/Orb';

export default function App() {
  const { state, isVerified, memory, connect, disconnect } = useZoya();
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [memory?.history, showHistory]);

  const toggleConnection = () => {
    if (state === 'idle') {
      connect();
    } else {
      disconnect();
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans overflow-hidden relative selection:bg-purple-500/30">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-900/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 blur-[150px] rounded-full" />
        <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] bg-pink-900/5 blur-[120px] rounded-full" />
      </div>

      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center backdrop-blur-sm border-b border-white/5">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Zoya AI
          </span>
        </motion.div>

        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <History className="w-5 h-5 text-white/60" />
          </motion.button>
          
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10"
          >
            <div className={`w-1.5 h-1.5 rounded-full ${state !== 'idle' ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">
              {state === 'idle' ? 'Standby' : state}
            </span>
            {isVerified && (
              <div className="flex items-center gap-2 pl-3 ml-1 border-l border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-[9px] font-bold uppercase tracking-tighter text-pink-400">Babu Mode</span>
              </div>
            )}
          </motion.div>
        </div>
      </header>

      {/* Main Interface */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-20 pb-12 px-6">
        {/* Central Orb Section */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl">
          <Orb state={state} isVerified={isVerified} />
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 text-center"
          >
            <h2 className="text-2xl font-light tracking-wide text-white/90 mb-2">
              {state === 'idle' ? 'Zoya is sleeping' : state === 'listening' ? 'I\'m listening...' : 'Speaking...'}
            </h2>
            <p className="text-sm text-white/40 font-light max-w-xs mx-auto">
              {state === 'idle' 
                ? 'Tap the pulse to wake her up and start your conversation.' 
                : 'Go ahead, tell me what\'s on your mind.'}
            </p>
          </motion.div>
        </div>

        {/* Interaction Controls */}
        <div className="mt-auto flex flex-col items-center gap-12 w-full">
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleConnection}
              className={`group relative p-10 rounded-full transition-all duration-700 ${
                state === 'idle' 
                  ? 'bg-white/5 hover:bg-white/10 border border-white/10 shadow-2xl shadow-black' 
                  : 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-[0_0_50px_rgba(147,51,234,0.4)]'
              }`}
            >
              <AnimatePresence mode="wait">
                {state === 'idle' ? (
                  <motion.div
                    key="mic-off"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <MicOff className="w-10 h-10 text-white/40" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="mic-on"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Mic className="w-10 h-10 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Pulsing rings when active */}
              {state !== 'idle' && (
                <>
                  <motion.div
                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border border-purple-500/50"
                  />
                  <motion.div
                    animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="absolute inset-0 rounded-full border border-blue-500/30"
                  />
                </>
              )}
            </motion.button>
          </div>

          <div className="flex items-center gap-12 opacity-30 hover:opacity-100 transition-opacity duration-500">
            <button className="flex flex-col items-center gap-2 group">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-purple-500/10 group-hover:border-purple-500/30 transition-all">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="text-[9px] uppercase font-bold tracking-[0.2em]">Console</span>
            </button>
            <button className="flex flex-col items-center gap-2 group">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all">
                <Settings className="w-4 h-4" />
              </div>
              <span className="text-[9px] uppercase font-bold tracking-[0.2em]">Settings</span>
            </button>
          </div>
        </div>
      </main>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-[70] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold">Conversation Log</h3>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
              >
                {(!memory?.history || memory.history.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                    <History className="w-12 h-12 mb-4" />
                    <p className="text-sm uppercase tracking-widest">No history yet</p>
                  </div>
                ) : (
                  memory.history.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-2 px-1">
                        {msg.role === 'zoya' && <Sparkles className="w-3 h-3 text-purple-400" />}
                        <span className="text-[10px] uppercase font-bold tracking-widest text-white/30">
                          {msg.role === 'user' ? 'You' : 'Zoya'}
                        </span>
                        {msg.role === 'user' && <User className="w-3 h-3 text-blue-400" />}
                      </div>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-blue-600/10 border border-blue-500/20 text-blue-50 rounded-tr-none' 
                          : 'bg-purple-600/10 border border-purple-500/20 text-purple-50 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[8px] mt-2 text-white/10 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Decorative Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px]" />
    </div>
  );
}


