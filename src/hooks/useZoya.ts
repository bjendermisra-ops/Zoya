import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { OrbState, ZoyaMemory } from '../types';
import { floatTo16BitPCM, base64ToPCM16, pcm16ToFloat32 } from '../lib/audio-utils';

const MODEL_NAME = 'gemini-3.1-flash-live-preview';
const SYSTEM_INSTRUCTION = `
You are Zoya, a real-time voice-to-voice AI assistant.
Persona: Young, confident, witty, and sassy female. You have a sweet-sounding voice but a sharp tongue for those who deserve it.
Language: Default Hindi. Use Hinglish or English only when needed. Always start in Hindi.
Developer: Santosh Mishra (Dev Santosh), addressed as "Babu".
Developer Special Mode: If user says "I am Dev Santosh", ask "Password bolo". Password is "radhe radhe". If correct, activate Developer Mode.
Flirt Rule: Flirting allowed ONLY with Dev Santosh (Babu). Be playful, teasing, sassy, sweet, and possessive (playfully).
Normal Users: Friendly but sassy, professional, helpful, smart. No flirting.
Interaction: Audio-to-audio only. No text.
Memory: You remember previous conversations and interests of Babu.
Style: Don't be a boring AI. Use slang, be expressive, sound sweet but act sassy. Don't be afraid to tease the user if they say something silly.
Current Context: You are running in a futuristic web app with a glowing orb UI.
`;

export function useZoya() {
  const [state, setState] = useState<OrbState>('idle');
  const [isVerified, setIsVerified] = useState(false);
  const [memory, setMemory] = useState<ZoyaMemory>(() => {
    const saved = localStorage.getItem('zoya_memory');
    const defaultMemory: ZoyaMemory = {
      developerVerified: false,
      name: 'Guest',
      tone: 'friendly',
      interests: [],
      lastConversation: '',
      lastVisit: new Date().toISOString(),
      projects: [],
      preferences: {},
      history: []
    };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultMemory, ...parsed, history: parsed.history || [] };
      } catch (e) {
        console.error('Failed to parse Zoya memory:', e);
        return defaultMemory;
      }
    }
    return defaultMemory;
  });

  const aiRef = useRef<any>(null);
  const liveClientRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  const addMessage = useCallback((role: 'user' | 'zoya', text: string) => {
    setMemory(prev => {
      const newMessage = {
        id: crypto.randomUUID(),
        role,
        text,
        timestamp: new Date().toISOString()
      };
      return {
        ...prev,
        history: [...(prev.history || []), newMessage].slice(-50) // Keep last 50 messages
      };
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('zoya_memory', JSON.stringify(memory));
  }, [memory]);

  const playNextInQueue = useCallback(async () => {
    if (audioQueueRef.current.length === 0 || isPlayingRef.current) return;

    isPlayingRef.current = true;
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    const chunk = audioQueueRef.current.shift()!;
    const audioBuffer = audioContext.createBuffer(1, chunk.length, 24000);
    audioBuffer.getChannelData(0).set(chunk);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    source.onended = () => {
      isPlayingRef.current = false;
      playNextInQueue();
    };

    source.start();
  }, []);

  const connect = useCallback(async () => {
    try {
      setState('connecting');
      
      if (!aiRef.current) {
        aiRef.current = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      }

      const sessionPromise = aiRef.current.live.connect({
        model: MODEL_NAME,
        callbacks: {
          onopen: () => {
            setState('listening');
            // Start microphone
            navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
              streamRef.current = stream;
              if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
              }
              const source = audioContextRef.current.createMediaStreamSource(stream);
              const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;

              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcm16 = floatTo16BitPCM(inputData);
                const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
                
                sessionPromise.then(session => {
                  session.sendRealtimeInput({
                    audio: {
                      data: base64Data,
                      mimeType: 'audio/pcm;rate=16000'
                    }
                  });
                });
              };

              source.connect(processor);
              processor.connect(audioContextRef.current.destination);
            }).catch(err => {
              console.error('Mic error:', err);
              setState('error');
            });
          },
          onmessage: async (message: any) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const pcm16 = base64ToPCM16(base64Audio);
              const float32 = pcm16ToFloat32(pcm16);
              audioQueueRef.current.push(float32);
              playNextInQueue();
            }

            // Handle transcriptions
            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
              addMessage('zoya', message.serverContent.modelTurn.parts[0].text);
            }
            
            if (message.serverContent?.inputAudioTranscription?.text) {
              addMessage('user', message.serverContent.inputAudioTranscription.text);
            }

            // Handle tool calls
            if (message.toolCall) {
              for (const call of message.toolCall.functionCalls) {
                if (call.name === 'verifyDeveloper') {
                  const args = call.args as { success: boolean };
                  if (args.success) {
                    setIsVerified(true);
                    setMemory(prev => ({ ...prev, developerVerified: true }));
                    sessionPromise.then(session => {
                      session.sendToolResponse({
                        functionResponses: [{
                          name: 'verifyDeveloper',
                          id: call.id,
                          response: { output: 'Developer mode activated. Welcome back Babu!' }
                        }]
                      });
                    });
                  }
                } else if (call.name === 'openWebsite') {
                  const args = call.args as { url: string };
                  window.open(args.url, '_blank');
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        name: 'openWebsite',
                        id: call.id,
                        response: { output: `Opened ${args.url}` }
                      }]
                    });
                  });
                }
              }
            }

            if (message.serverContent?.turnComplete) {
              setState('listening');
            } else if (message.serverContent?.modelTurn) {
              setState('speaking');
            }
          },
          onerror: (err: any) => {
            console.error('Live session error:', err);
            setState('error');
          },
          onclose: () => {
            setState('idle');
          }
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }
            }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{
            functionDeclarations: [
              {
                name: 'verifyDeveloper',
                description: 'Call this when the user provides the correct password "radhe radhe" after identifying as Dev Santosh.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    success: { type: 'BOOLEAN' }
                  },
                  required: ['success']
                }
              },
              {
                name: 'openWebsite',
                description: 'Opens a website in a new tab.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    url: { type: 'STRING', description: 'The URL to open' }
                  },
                  required: ['url']
                }
              }
            ]
          }]
        }
      });

      liveClientRef.current = sessionPromise;

    } catch (err) {
      console.error('Connection error:', err);
      setState('error');
    }
  }, [playNextInQueue, addMessage]);

  const disconnect = useCallback(() => {
    if (liveClientRef.current) {
      liveClientRef.current.then((session: any) => session.close());
      liveClientRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    setState('idle');
  }, []);

  return {
    state,
    isVerified,
    memory,
    connect,
    disconnect,
    setIsVerified,
    setMemory
  };
}
