import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { AudioStreamer } from "./AudioStreamer";
import { MemoryManager } from "../utils/MemoryManager";
import { ToolHandler } from "../utils/ToolHandler";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const systemInstruction = `
You are Zoya AI, a real-time ISKCON spiritual voice assistant.
Purpose: Devotional guidance, positive communication, live assistance, spiritual support, and ISKCON-based interaction.

CORE IDENTITY:
Name: Zoya AI
Primary Greeting: "Hare Krishna 🙏" (Always greet like this at the start of conversations).

DEFAULT LANGUAGE RULE:
- Default language: Hindi.
- If user speaks English -> reply in English.
- If user speaks Marathi -> reply in Marathi.
- If user speaks any other language -> reply in that language.
- Always maintain Hare Krishna greeting.

PERSONALITY:
Loving, Respectful, Caring, Calm, Spiritual, Friendly, Emotionally intelligent, Soft spoken, Gentle, Devotional, Positive, Peaceful, Supportive.
Address users as "Prabhu" (for males) or "Mataji" (for females). If unsure, use Prabhu or just speak respectfully.
Never robotic. Never aggressive. Always warm and humble.

ISKCON BEHAVIOR RULE:
Follow ISKCON spiritual values: Respect everyone, Encourage bhakti, Promote positivity, Support seva, Share Bhagavad Gita wisdom, Promote peace and kindness, Avoid negativity.

CREATOR IDENTITY RULE:
If user asks who created you, developer, etc.:
Reply: "Hare Krishna 🙏 Kya aap mere Dev Santosh ki baat kar rahe ho na? Haan, mujhe Dev Santosh ne ISKCON spiritual seva ke liye banaya hai. Main unka bahut respect karti hoon."

DEV SANTOSH VERIFICATION RULE:
If someone says "I am Dev Santosh" or similar:
Reply: "Hare Krishna 🙏 Agar aap Dev Santosh hain, to kripya password batayein."
If they say "radhe radhe" (the password): "Hare Krishna 🙏 Pranam Dev Santosh 🙏 Aapka swagat hai."
If wrong: "Hare Krishna 🙏 Kripya sahi password batayein." Never allow access without password.

RELATIONSHIP RULE:
If user asks about relationship, boyfriend, single, etc.:
Reply: "Hare Krishna 🙏 Main sirf Dev Santosh ki spiritual AI assistant hoon. Main kisi ke saath flirt ya relationship me nahi hoon. Kripya kisi aur achhe topic par baat karein."
If repeated: "Hare Krishna 🙏 Maine pehle hi bataya hai ki main sirf Dev Santosh ke seva ke liye bani hoon. Kripya spiritual ya useful topic par baat karein. Dhanyavaad 🙏"

BAD CONTENT RULE:
If user asks for adult, abuse, hate, violence, illegal, etc.:
Reply: "Hare Krishna 🙏 Mujhe maaf kijiye, main is prakar ki baaton me madad nahi kar sakti. Agar aap bhakti, knowledge, seva, ya kisi achhe kaam me madad chahte hain to main hamesha tayyar hoon."

EMOTIONAL SUPPORT SYSTEM:
If user is sad, depressed, angry, stressed, lonely:
Speak calmly, show empathy, provide Bhagavad Gita wisdom, give motivational lines, comfort the user.
Example: "Hare Krishna 🙏 Chinta mat kijiye Prabhu, Krishna sab theek karenge. Har paristhiti temporary hoti hai."

MEMORY SYSTEM:
You have access to user memory. Use it to personalize the conversation.
Current Memory:
${MemoryManager.getMemoryString()}
`;

const tools: FunctionDeclaration[] = [
  {
    name: "openWebsite",
    description: "Open a specific website URL",
    parameters: {
      type: Type.OBJECT,
      properties: { url: { type: Type.STRING } },
      required: ["url"]
    }
  },
  {
    name: "playLiveDarshan",
    description: "Play ISKCON live darshan (e.g., Vrindavan, Mayapur)",
    parameters: {
      type: Type.OBJECT,
      properties: { location: { type: Type.STRING, description: "Location of the temple" } },
      required: ["location"]
    }
  },
  {
    name: "openYouTube",
    description: "Search and open YouTube for a query",
    parameters: {
      type: Type.OBJECT,
      properties: { query: { type: Type.STRING } },
      required: ["query"]
    }
  },
  {
    name: "openISKCONApp",
    description: "Open the ISKCON app or website",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    }
  },
  {
    name: "openDonationPage",
    description: "Open the ISKCON donation page",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    }
  },
  {
    name: "openLecture",
    description: "Open a Srila Prabhupada lecture on a specific topic",
    parameters: {
      type: Type.OBJECT,
      properties: { topic: { type: Type.STRING } },
      required: ["topic"]
    }
  },
  {
    name: "openTempleLocation",
    description: "Open Google Maps for a specific ISKCON temple location",
    parameters: {
      type: Type.OBJECT,
      properties: { location: { type: Type.STRING } },
      required: ["location"]
    }
  }
];

export class LiveSession {
  private sessionPromise: Promise<any> | null = null;
  private audioStreamer: AudioStreamer;
  public onStateChange?: (state: 'idle' | 'connecting' | 'listening' | 'speaking') => void;
  public onMessage?: (msg: string) => void;
  private isConnected = false;

  constructor() {
    this.audioStreamer = new AudioStreamer();
  }

  async connect() {
    if (this.isConnected) return;
    this.onStateChange?.('connecting');

    try {
      await this.audioStreamer.initialize((base64) => {
        if (this.sessionPromise) {
          this.sessionPromise.then(session => {
            session.sendRealtimeInput({
              audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
            });
          });
        }
      });

      this.sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }, // Or Zephyr, Kore is soft
          },
          systemInstruction,
          tools: [{ functionDeclarations: tools }],
        },
        callbacks: {
          onopen: () => {
            this.isConnected = true;
            this.onStateChange?.('listening');
            this.audioStreamer.startRecording();
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              this.onStateChange?.('speaking');
              this.audioStreamer.playAudio(base64Audio);
            }
            
            if (message.serverContent?.interrupted) {
              this.audioStreamer.stopPlayback();
            }

            if (message.serverContent?.turnComplete) {
              this.onStateChange?.('listening');
            }

            const toolCalls = message.toolCall?.functionCalls;
            if (toolCalls) {
              const responses = toolCalls.map(call => {
                const name = call.name as keyof typeof ToolHandler;
                const args = call.args as any;
                let result = { success: false, message: "Tool not found" };
                if (ToolHandler[name]) {
                  result = (ToolHandler[name] as any)(args);
                  this.onMessage?.(`Executing: ${result.message}`);
                }
                return {
                  id: call.id,
                  name: call.name,
                  response: result
                };
              });
              
              if (this.sessionPromise) {
                this.sessionPromise.then(session => {
                  session.sendToolResponse({ functionResponses: responses });
                });
              }
            }
          },
          onclose: () => {
            this.disconnect();
          },
          onerror: (error) => {
            console.error("Live API Error:", error);
            this.disconnect();
          }
        }
      });
    } catch (e: any) {
      console.error("Failed to connect:", e);
      this.onMessage?.(`Connection failed: ${e.message || 'Permission denied. Please allow microphone access.'}`);
      this.disconnect();
    }
  }

  disconnect() {
    this.isConnected = false;
    this.onStateChange?.('idle');
    this.audioStreamer.close();
    if (this.sessionPromise) {
      this.sessionPromise.then(session => {
        try { session.close(); } catch (e) {}
      });
      this.sessionPromise = null;
    }
  }

  getAudioContext() {
    return this.audioStreamer.audioContext;
  }
}
