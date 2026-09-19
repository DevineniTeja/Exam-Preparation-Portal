import api from './api';

export interface Slide {
  id: number;
  title: string;
  file_name: string;
  file_type: string;
  num_pages: number;
  created_at: string;
}

export interface UploadResponse {
  id: number;
  title: string;
  file_name: string;
  file_type: string;
  num_pages: number;
  num_chunks: number;
  created_at: string;
  message: string;
}

export const slidesService = {
  async uploadDocument(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadResponse>('/slides/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  async getSlides(): Promise<Slide[]> {
    const response = await api.get<Slide[]>('/slides/');
    return response.data;
  },

  async getSlide(slideId: number) {
    const response = await api.get(`/slides/${slideId}`);
    return response.data;
  },

  async deleteSlide(slideId: number): Promise<void> {
    await api.delete(`/slides/${slideId}`);
  },
};
