import axios from 'axios';
import { SenderProfile, GenerateRequest, GeneratedEmail, ParseResponse } from '../types';

const api = axios.create({ baseURL: '/api' });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export const profilesAPI = {
  list: () => api.get<SenderProfile[]>('/profiles').then((r) => r.data),
  create: (data: Omit<SenderProfile, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<SenderProfile>('/profiles', data).then((r) => r.data),
  update: (id: string, data: Partial<Omit<SenderProfile, 'id' | 'createdAt' | 'updatedAt'>>) =>
    api.put<SenderProfile>(`/profiles/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/profiles/${id}`),
};

export const parseAPI = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ParseResponse>('/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

export const generateAPI = {
  generate: (req: GenerateRequest) =>
    api.post<{ emails: GeneratedEmail[] }>('/generate', req).then((r) => r.data),
  translate: (subject: string, body: string, targetLanguage: string) =>
    api.post<{ subject: string; body: string }>('/generate/translate', {
      subject, body, targetLanguage,
    }).then((r) => r.data),
};
