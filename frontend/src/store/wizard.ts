import { create } from 'zustand';
import { EmailStyle, GeneratedEmail } from '../types';

interface WizardState {
  currentStep: 1 | 2 | 3;
  // Step 1
  candidateText: string;
  jobTitle: string;
  // Step 2
  selectedProfileId: string;
  selectedStyle: EmailStyle;
  targetLanguage: string;
  emailCount: 1 | 2 | 3;
  // Step 3
  generatedEmails: GeneratedEmail[];
  isGenerating: boolean;
  generateError: string | null;

  // Actions
  setCandidateText: (text: string) => void;
  setJobTitle: (title: string) => void;
  setProfileId: (id: string) => void;
  setStyle: (style: EmailStyle) => void;
  setLanguage: (lang: string) => void;
  setEmailCount: (count: 1 | 2 | 3) => void;
  setGenerating: (v: boolean) => void;
  setGenerateError: (err: string | null) => void;
  setEmails: (emails: GeneratedEmail[]) => void;
  updateEmail: (id: string, subject: string, body: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: 1 | 2 | 3) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>((set) => ({
  currentStep: 1,
  candidateText: '',
  jobTitle: '',
  selectedProfileId: '',
  selectedStyle: 'WARM',
  targetLanguage: 'Chinese',
  emailCount: 1,
  generatedEmails: [],
  isGenerating: false,
  generateError: null,

  setCandidateText: (text) => set({ candidateText: text }),
  setJobTitle: (title) => set({ jobTitle: title }),
  setProfileId: (id) => set({ selectedProfileId: id }),
  setStyle: (style) => set({ selectedStyle: style }),
  setLanguage: (lang) => set({ targetLanguage: lang }),
  setEmailCount: (count) => set({ emailCount: count }),
  setGenerating: (v) => set({ isGenerating: v }),
  setGenerateError: (err) => set({ generateError: err }),
  setEmails: (emails) => set({ generatedEmails: emails }),
  updateEmail: (id, subject, body) =>
    set((state) => ({
      generatedEmails: state.generatedEmails.map((e) =>
        e.id === id ? { ...e, subject, body } : e
      ),
    })),
  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(3, state.currentStep + 1) as 1 | 2 | 3,
    })),
  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(1, state.currentStep - 1) as 1 | 2 | 3,
    })),
  goToStep: (step) => set({ currentStep: step }),
  reset: () =>
    set({
      currentStep: 1,
      candidateText: '',
      jobTitle: '',
      selectedProfileId: '',
      selectedStyle: 'WARM',
      targetLanguage: 'Chinese',
      emailCount: 1,
      generatedEmails: [],
      isGenerating: false,
      generateError: null,
    }),
}));
