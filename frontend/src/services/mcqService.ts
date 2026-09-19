import api from './api';

export interface MCQ {
  id: number;
  slide_id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: string;
  explanation: string;
  difficulty: string;
}

export interface GenerateMCQRequest {
  slide_id: number;
  num_questions: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GenerateMCQResponse {
  message: string;
  num_generated: number;
  mcqs: MCQ[];
}

export const mcqService = {
  async generateMCQs(request: GenerateMCQRequest): Promise<GenerateMCQResponse> {
    const response = await api.post<GenerateMCQResponse>('/mcqs/generate', request);
    return response.data;
  },

  async getSlideMCQs(slideId: number): Promise<MCQ[]> {
    const response = await api.get<MCQ[]>(`/mcqs/slide/${slideId}`);
    return response.data;
  },

  async getMCQ(mcqId: number): Promise<MCQ> {
    const response = await api.get<MCQ>(`/mcqs/${mcqId}`);
    return response.data;
  },

  async deleteMCQ(mcqId: number): Promise<void> {
    await api.delete(`/mcqs/${mcqId}`);
  },

  async getAllUserMCQs(): Promise<MCQ[]> {
    const response = await api.get<MCQ[]>('/mcqs/');
    return response.data;
  },
};
