import axios from 'axios';
import { SenderProfile, GenerateRequest, GeneratedEmail, ParseResponse } from '../types';

const api = axios.create({ baseURL: '/api' });

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('email-gen-auth');
    if (raw) {
      const state = JSON.parse(raw);
      const token = state?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('email-gen-auth');
      window.location.href = '/login';
    }
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

export const authAPI = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: any }>('/auth/login', { email, password }).then((r) => r.data),
  register: (name: string, email: string, password: string, token: string) =>
    api.post<{ token: string; user: any }>(`/auth/register?token=${encodeURIComponent(token)}`, { name, email, password }).then((r) => r.data),
  me: () => api.get<any>('/auth/me').then((r) => r.data),
  updateDashscopeKey: (dashscopeKey: string) =>
    api.put<any>('/auth/dashscope-key', { dashscopeKey }).then((r) => r.data),
  createInviteToken: () => api.post<any>('/auth/invite-tokens').then((r) => r.data),
  listInviteTokens: () => api.get<any[]>('/auth/invite-tokens').then((r) => r.data),
};
