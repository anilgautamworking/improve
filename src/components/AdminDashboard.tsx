import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { AdminStats } from './AdminStats';
import { AdminExamManagement } from './AdminExamManagement';
import { AdminCategoryManagement } from './AdminCategoryManagement';
import { AdminQuestionLibrary } from './AdminQuestionLibrary';
import { LogOut } from 'lucide-react';

type AdminTab = 'stats' | 'exams' | 'categories' | 'library';

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = api.getUserFromToken();
    setUser(userData);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-medium text-black">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-black bg-gray-50 rounded hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex overflow-x-auto space-x-4">
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-3 px-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'text-black'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`py-3 px-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'exams'
                  ? 'text-black'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Exams
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-3 px-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'categories'
                  ? 'text-black'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`py-3 px-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'library'
                  ? 'text-black'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Question Library
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'stats' && <AdminStats />}
        {activeTab === 'exams' && <AdminExamManagement />}
        {activeTab === 'categories' && <AdminCategoryManagement />}
        {activeTab === 'library' && <AdminQuestionLibrary />}
      </main>
    </div>
  );
}


