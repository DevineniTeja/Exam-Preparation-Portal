// User types
export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  is_admin: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Slide types
export enum FileType {
  PDF = 'pdf',
  PPTX = 'pptx',
  DOCX = 'docx',
  IMAGE = 'image',
}

export interface Slide {
  id: number;
  user_id: number;
  title: string;
  filename: string;
  file_path: string;
  file_type: FileType;
  file_size: number;
  summary?: string;
  key_points?: string;
  total_pages: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

// MCQ types
export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface MCQOptions {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface MCQ {
  id: number;
  slide_id?: number;
  question: string;
  options: MCQOptions;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  difficulty: DifficultyLevel;
  topic?: string;
  created_at: string;
}

// Quiz types
export interface Quiz {
  id: number;
  user_id: number;
  title: string;
  slide_id?: number;
  total_questions: number;
  time_limit?: number;
  is_completed: boolean;
  score?: number;
  time_taken?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  mcq_id: number;
  question_order: number;
  user_answer?: 'A' | 'B' | 'C' | 'D';
  is_correct?: boolean;
  time_spent?: number;
  mcq?: MCQ;
}

// Conversation types
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface Message {
  id: number;
  conversation_id: number;
  role: MessageRole;
  content: string;
  sources?: number[];
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  slide_id?: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

// Progress types
export interface Progress {
  id: number;
  user_id: number;
  slide_id?: number;
  topic?: string;
  activity_type: 'quiz' | 'study' | 'mcq_practice' | 'conversation';
  score?: number;
  time_spent?: number;
  date: string;
  metadata?: Record<string, any>;
}

// Research types
export interface Research {
  id: number;
  user_id: number;
  url: string;
  title?: string;
  content?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
}

// Analytics types
export interface DashboardStats {
  total_slides: number;
  total_quizzes: number;
  total_mcqs: number;
  average_score: number;
  total_study_time: number;
}

export interface ProgressData {
  date: string;
  score: number;
}

export interface WeakArea {
  topic: string;
  average_score: number;
  attempts: number;
}
