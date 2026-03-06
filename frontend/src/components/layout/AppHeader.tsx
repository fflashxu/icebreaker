import { Mail, Settings, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useWizardStore } from '../../store/wizard';
import { useAuthStore } from '../../store/auth';

export function AppHeader() {
  const reset = useWizardStore((s) => s.reset);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <button
          onClick={reset}
          className="flex items-center gap-2 font-semibold text-gray-900 hover:text-sky-600 transition-colors"
        >
          <Mail className="w-5 h-5 text-sky-600" />
          <span>EmailGen</span>
        </button>

        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="text-sm text-gray-600 hidden sm:block">{user.name}</span>
              {user.isAdmin && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-medium">
                  Admin
                </span>
              )}
            </>
          )}
          <Link
            to="/settings"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
