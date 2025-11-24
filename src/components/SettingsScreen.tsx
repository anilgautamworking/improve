import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { X, LogOut } from 'lucide-react';

interface SettingsScreenProps {
  userId: string;
  onClose: () => void;
  allowScrollWithoutAnswer: boolean;
  onToggleScroll: (value: boolean) => void;
  statementQuestionsOnly: boolean;
  onToggleStatementOnly: (value: boolean) => void;
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
  onDifficultyChange: (value: 'all' | 'easy' | 'medium' | 'hard') => void;
}

export function SettingsScreen({ onClose, allowScrollWithoutAnswer, onToggleScroll, statementQuestionsOnly, onToggleStatementOnly, difficulty, onDifficultyChange }: SettingsScreenProps) {
  const [stats, setStats] = useState({
    totalAnswered: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await api.getStats();
      setStats(stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-medium text-black">Settings</h1>
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-gray-50"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-base font-medium text-black mb-4">Statistics</h2>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-10 h-10 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Answered</p>
                    <p className="text-2xl font-medium text-black">{stats.totalAnswered}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded p-4">
                      <p className="text-sm text-gray-600 mb-1">Correct</p>
                      <p className="text-xl font-medium text-black">{stats.correctAnswers}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {stats.totalAnswered > 0 ? Math.round((stats.correctAnswers / stats.totalAnswered) * 100) : 0}% accuracy
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded p-4">
                      <p className="text-sm text-gray-600 mb-1">Incorrect</p>
                      <p className="text-xl font-medium text-black">{stats.wrongAnswers}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {stats.totalAnswered > 0 ? Math.round((stats.wrongAnswers / stats.totalAnswered) * 100) : 0}% of attempts
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg p-6">
              <h2 className="text-base font-medium text-black mb-4">Preferences</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium text-black">Allow Scroll Without Answer</p>
                    <p className="text-sm text-gray-600 mt-1">Swipe freely even if the current card is unanswered</p>
                  </div>
                  <button
                    onClick={() => onToggleScroll(!allowScrollWithoutAnswer)}
                    className={`relative w-16 h-8 rounded-full transition-colors ${
                      allowScrollWithoutAnswer ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                        allowScrollWithoutAnswer ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-base font-medium text-black">Statement Questions Only</p>
                    <p className="text-sm text-gray-600 mt-1">Focus exclusively on statement-based prompts</p>
                  </div>
                  <button
                    onClick={() => onToggleStatementOnly(!statementQuestionsOnly)}
                    className={`relative w-16 h-8 rounded-full transition-colors ${
                      statementQuestionsOnly ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                        statementQuestionsOnly ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="pt-4">
                  <p className="text-base font-medium text-black mb-3">Difficulty Level</p>
                  <div className="grid grid-cols-4 gap-2">
                    {(['all', 'easy', 'medium', 'hard'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => onDifficultyChange(level)}
                        className={`py-2 rounded text-sm font-medium ${
                          difficulty === level
                            ? 'bg-black text-white'
                            : 'bg-gray-50 text-black hover:bg-gray-100'
                        }`}
                      >
                        {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={handleLogout}
              className="w-full bg-black text-white py-3 rounded text-base font-medium hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-50 text-black py-3 rounded text-base font-medium hover:bg-gray-100"
            >
              Close Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
