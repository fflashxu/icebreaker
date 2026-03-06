import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from './components/auth/RequireAuth';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';
import { useWizardStore } from './store/wizard';
import { AppHeader } from './components/layout/AppHeader';
import { StepIndicator } from './components/wizard/StepIndicator';
import { Step1Candidate } from './components/wizard/Step1Candidate';
import { Step2Settings } from './components/wizard/Step2Settings';
import { Step3Results } from './components/wizard/Step3Results';

function WizardApp() {
  const currentStep = useWizardStore((s) => s.currentStep);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        <div className="flex justify-center">
          <StepIndicator current={currentStep} />
        </div>

        <div>
          {currentStep === 1 && <Step1Candidate />}
          {currentStep === 2 && <Step2Settings />}
          {currentStep === 3 && <Step3Results />}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-gray-400 border-t border-gray-100">
        EmailGen — powered by Qwen AI
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <WizardApp />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
