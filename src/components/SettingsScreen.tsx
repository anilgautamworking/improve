import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { X, TrendingUp, CheckCircle, XCircle, Settings as SettingsIcon, LogOut, FileText } from 'lucide-react';

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

export function SettingsScreen({ userId, onClose, allowScrollWithoutAnswer, onToggleScroll, statementQuestionsOnly, onToggleStatementOnly, difficulty, onDifficultyChange }: SettingsScreenProps) {
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
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-white">Settings</h1>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-500" />
                Your Statistics
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Questions Answered</p>
                      <p className="text-3xl font-bold text-white mt-1">{stats.totalAnswered}</p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-blue-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-900/20 border border-green-700 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <p className="text-gray-400 text-sm">Correct</p>
                      </div>
                      <p className="text-2xl font-bold text-green-500">{stats.correctAnswers}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.totalAnswered > 0 ? Math.round((stats.correctAnswers / stats.totalAnswered) * 100) : 0}% accuracy
                      </p>
                    </div>

                    <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <p className="text-gray-400 text-sm">Wrong</p>
                      </div>
                      <p className="text-2xl font-bold text-red-500">{stats.wrongAnswers}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.totalAnswered > 0 ? Math.round((stats.wrongAnswers / stats.totalAnswered) * 100) : 0}% incorrect
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-6">Preferences</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Allow Scroll Without Answer</p>
                    <p className="text-gray-400 text-sm mt-1">Skip questions by scrolling without answering</p>
                  </div>
                  <button
                    onClick={() => onToggleScroll(!allowScrollWithoutAnswer)}
                    className={`relative w-16 h-8 rounded-full transition-colors ${
                      allowScrollWithoutAnswer ? 'bg-blue-500' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        allowScrollWithoutAnswer ? 'translate-x-8' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-start gap-2">
                    <FileText className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Statement Questions Only</p>
                      <p className="text-gray-400 text-sm mt-1">Show only long statement-based questions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleStatementOnly(!statementQuestionsOnly)}
                    className={`relative w-16 h-8 rounded-full transition-colors ${
                      statementQuestionsOnly ? 'bg-purple-500' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        statementQuestionsOnly ? 'translate-x-8' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <div className="mb-3">
                    <p className="text-white font-medium mb-1">Difficulty Level</p>
                    <p className="text-gray-400 text-sm">Select question difficulty</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(['all', 'easy', 'medium', 'hard'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => onDifficultyChange(level)}
                        className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                          difficulty === level
                            ? level === 'easy' ? 'bg-green-600 text-white'
                            : level === 'medium' ? 'bg-yellow-600 text-white'
                            : level === 'hard' ? 'bg-red-600 text-white'
                            : 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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

          <div className="mt-8 space-y-4">
            <button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity"
            >
              Close Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
