export interface UserMemory {
  userName?: string;
  mood?: string;
  lastConversation?: string;
  preferences?: string[];
  topics?: string[];
  language?: string;
}

export class MemoryManager {
  private static STORAGE_KEY = 'zoya_ai_memory';

  static getMemory(): UserMemory {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  static updateMemory(updates: Partial<UserMemory>) {
    const current = this.getMemory();
    const updated = { ...current, ...updates };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  static getMemoryString(): string {
    const mem = this.getMemory();
    if (Object.keys(mem).length === 0) return "No previous memory.";
    return JSON.stringify(mem);
  }
}
