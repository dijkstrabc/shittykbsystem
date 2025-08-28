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
  relatedQuestions?: KnowledgePoint[];
  suggestions?: string[];
}

export interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}