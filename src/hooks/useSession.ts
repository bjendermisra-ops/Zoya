import { useState, useEffect, useRef } from 'react';
import { LiveSession } from '../services/LiveSession';

export function useSession() {
  const [state, setState] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [messages, setMessages] = useState<string[]>([]);
  const sessionRef = useRef<LiveSession | null>(null);

  useEffect(() => {
    const session = new LiveSession();
    session.onStateChange = setState;
    session.onMessage = (msg) => {
      setMessages(prev => [...prev, msg].slice(-5));
    };
    sessionRef.current = session;

    return () => {
      session.disconnect();
    };
  }, []);

  const connect = async () => {
    await sessionRef.current?.connect();
  };

  const disconnect = () => {
    sessionRef.current?.disconnect();
  };

  return {
    state,
    messages,
    connect,
    disconnect,
    session: sessionRef.current
  };
}
