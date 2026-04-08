export interface Message {
  id: string;
  role: 'user' | 'zoya';
  text: string;
  timestamp: string;
}

export interface ZoyaMemory {
  developerVerified: boolean;
  name: string;
  tone: string;
  interests: string[];
  lastConversation: string;
  lastVisit: string;
  projects: string[];
  preferences: Record<string, any>;
  history: Message[];
}

export type OrbState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface AudioConfig {
  sampleRate: number;
  bufferSize: number;
}
