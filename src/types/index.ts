export interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  messages: Message[];
  startAt: string;
  endAt?: string;
}

export interface ChatItem {
  id: string;
  title: string;
}

export interface PixelmatchConfig {
  threshold: number;
  includeAA: boolean;
  alpha: number;
  diffColor: [number, number, number];
}

export interface CaptureConfig {
  THRESHOLD: number;
  MIN_DIFF_PERCENTAGE: number;
}

export interface ChatSessionManager {
  sessions: Map<string, any>;
  getOrCreateSession: (chatId: string, generativeModel: any) => any;
}
