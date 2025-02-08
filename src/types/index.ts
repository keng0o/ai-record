export interface Message {
  role: "user" | "ai";
  content: string;
  date: string;
}

export interface Session {
  id: string;
  createdAt: Date;
  message: Message[];
}
