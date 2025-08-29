export interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

export interface KnowledgePoint {
  id: string;
  categoryId: string;
  standardQuestion: string;
  similarQuestions: string[];
  answer: string; // HTML content
  relatedQuestionIds: string[];
  createdAt: string; // ISO string
  status: 'published' | 'draft' | 'archived';
  createdBy: string;
}

export interface ColdStartItem {
  id: string;
  sourceFileName: string;
  generatedQuestion: string;
  generatedAnswer: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  senderAvatar?: string;
  relatedQuestions?: KnowledgePoint[];
  suggestions?: string[];
}

export interface ChatSession {
  id: string;
  userId: string; // For display purposes
  startTime: string; // ISO string for sorting/display
  messages: ChatMessage[];
  robotId: string | null;
  organizationId?: string; // For future filtering
}

export interface UnansweredQuestion {
  id:string;
  userId: string;
  question: string;
  sessionId: string;
  timestamp: string; // ISO string
  robotId: string | null;
  organizationId?: string; // For future filtering
}

export interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface LlmConfig {
  apiUrl: string;
  apiKey: string;
  modelName: string;
  contextLength: number;
  streamMode: boolean;
  thinking: boolean;
}

export interface Robot {
  id: string;
  name: string;
  avatar: string; // URL to an image
  welcomeMessage: string;
  apiIdentifier: string; // The unique key for HTTP requests
  silenceThresholdDays: number; // For silent question management
}

export interface EntityMember {
  id: string;
  value: string;
}

export interface Entity {
  id: string;
  name: string;
  description: string;
  type: 'enum' | 'regex';
  members: EntityMember[];
  regex: string | null;
}

export interface Intent {
  id: string;
  name: string;
  description: string;
  utterances: string[];
}
