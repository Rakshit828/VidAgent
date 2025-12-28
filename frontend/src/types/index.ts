export interface User {
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  is_verified: boolean;
  role: string;
  created_at: string;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
}


export interface LoginData {
  tokens: Tokens
  user: User
}


export interface Chat {
  uuid: string;
  title: string;
  youtube_video_url: string;
  created_at: string;
}

export interface QA {
  query: string;
  answer: string;
  created_at?: string;
}

export interface ChatData {
  selected_chat_id: string;
  youtube_video_url: string;
  questions_answers: QA[];
}

export interface ApiResponse<T = Chat | ChatData | QA | Chat[] | LoginData | User | Tokens> {
  status: string;
  message: string;
  status_code: number;
  data: T;
}


export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
