export interface User {
  displayName: string;
  email: string;
  photoURL: string;
}

export interface Session {
  id: string;
  threads: {
    main: Thread[];
  };
}

export interface Thread {
  content: [{ text: string }];
  role: "user" | "model" | "system";
  metadata: { preamble: boolean };
}

export interface Record {
  date: string;
  reply: string;
}
