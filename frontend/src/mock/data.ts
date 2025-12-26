export interface MockChat {
  id: string;
  title: string;
  timestamp: Date;
}

export interface MockMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const MOCK_CHATS: MockChat[] = [
  { id: '1', title: 'Understanding Quantum Physics', timestamp: new Date() },
  { id: '2', title: 'React Hooks Explanation', timestamp: new Date() },
  { id: '3', title: 'Cooking Pasta 101', timestamp: new Date() },
  { id: '4', title: 'Advanced Typescript Tutorial', timestamp: new Date() },
  { id: '5', title: 'History of Rome', timestamp: new Date() },
];

export const MOCK_MESSAGES: MockMessage[] = [
  {
    id: 'm1',
    role: 'user',
    content: 'Can you explain the main concept of this video?',
    timestamp: '10:30 AM'
  },
  {
    id: 'm2',
    role: 'assistant',
    content: 'Certainly! This video discusses the fundamental principles of quantum superposition and entanglement, illustrating them with the famous Schrödinger\'s cat thought experiment.',
    timestamp: '10:31 AM'
  },
  {
    id: 'm3',
    role: 'user',
    content: 'What is entanglement exactly?',
    timestamp: '10:32 AM'
  },
  {
    id: 'm4',
    role: 'assistant',
    content: 'Quantum entanglement is a phenomenon where two particles become linked, such that the state of one instantly influences the state of the other, regardless of the distance between them.',
    timestamp: '10:33 AM'
  }
];
