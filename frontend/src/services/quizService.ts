import api from './api';

export interface QuizQuestion {
  id: number;
  mcq_id: number;
  question_order: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  user_answer?: string;
  is_correct?: boolean;
}

export interface Quiz {
  id: number;
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
}

export interface QuizDetail extends Quiz {
  questions: QuizQuestion[];
}

export interface CreateQuizRequest {
  title: string;
  slide_id?: number;
  num_questions: number;
  time_limit?: number;
}

export interface SubmitAnswerRequest {
  question_id: number;
  answer: string;
}

export interface CompleteQuizRequest {
  time_taken: number;
}

export interface CompleteQuizResponse {
  score: number;
  correct_answers: number;
  total_questions: number;
  time_taken: number;
}

export const quizService = {
  async createQuiz(request: CreateQuizRequest): Promise<Quiz> {
    const response = await api.post<Quiz>('/quizzes/create', request);
    return response.data;
  },

  async startQuiz(quizId: number): Promise<Quiz> {
    const response = await api.post<Quiz>(`/quizzes/${quizId}/start`);
    return response.data;
  },

  async getQuiz(quizId: number): Promise<QuizDetail> {
    const response = await api.get<QuizDetail>(`/quizzes/${quizId}`);
    return response.data;
  },

  async submitAnswer(quizId: number, request: SubmitAnswerRequest): Promise<{ is_correct: boolean }> {
    const response = await api.post<{ is_correct: boolean }>(`/quizzes/${quizId}/submit-answer`, request);
    return response.data;
  },

  async completeQuiz(quizId: number, request: CompleteQuizRequest): Promise<CompleteQuizResponse> {
    const response = await api.post<CompleteQuizResponse>(`/quizzes/${quizId}/complete`, request);
    return response.data;
  },

  async getAllQuizzes(): Promise<Quiz[]> {
    const response = await api.get<Quiz[]>('/quizzes/');
    return response.data;
  },

  async deleteQuiz(quizId: number): Promise<void> {
    await api.delete(`/quizzes/${quizId}`);
  },
};
