import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { MicButton } from './components/MicButton';
import { VoiceVisualizer } from './components/VoiceVisualizer';
import { useSession } from './hooks/useSession';
import { MemoryManager } from './utils/MemoryManager';

export default function App() {
  const { state, messages, connect, disconnect, session } = useSession();

  useEffect(() => {
    // Initialize memory if empty
    const mem = MemoryManager.getMemory();
    if (!mem.lastConversation) {
      MemoryManager.updateMemory({ lastConversation: new Date().toISOString() });
    }
  }, []);

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center font-sans relative overflow-hidden">
      {/* Background Mandala Pattern (Subtle) */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23d97706\" fill-opacity=\"1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
        }}
      />

      <Header />

      <main className="flex-1 w-full max-w-md flex flex-col items-center justify-center p-6 z-10">
        
        <div className="relative w-full aspect-square max-w-[300px] flex items-center justify-center mb-12">
          <VoiceVisualizer session={session} state={state} />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <MicButton state={state} onConnect={connect} onDisconnect={disconnect} />
          </div>
        </div>

        <div className="text-center space-y-2 mb-8 h-16">
          <p className="text-orange-800 font-medium text-lg">
            {state === 'idle' && 'Tap to start speaking'}
            {state === 'connecting' && 'Connecting to Zoya...'}
            {state === 'listening' && 'Listening...'}
            {state === 'speaking' && 'Zoya is speaking...'}
          </p>
          {messages.length > 0 && (
            <p className="text-sm text-orange-600 animate-pulse">
              {messages[messages.length - 1]}
            </p>
          )}
        </div>

      </main>

      <footer className="w-full p-6 text-center z-10 bg-gradient-to-t from-orange-100 to-transparent">
        <p className="text-orange-700 font-serif italic text-lg">
          "Hare Krishna Hare Krishna, Krishna Krishna Hare Hare<br/>
          Hare Rama Hare Rama, Rama Rama Hare Hare"
        </p>
      </footer>
    </div>
  );
}
