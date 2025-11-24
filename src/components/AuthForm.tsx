import { useState } from 'react';
import { api } from '../lib/api';
import { ExamSelector } from './ExamSelector';

interface AuthFormProps {
  onSuccess: (user: any) => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [examId, setExamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = isLogin 
        ? await api.login(email, password)
        : await api.signup(email, password, examId || undefined);
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-black mb-2">
            Civil Services Daily
          </h1>
          <p className="text-gray-600 text-sm">
            Practice questions for your exam
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 space-y-6">
          <div className="text-center text-lg font-medium text-black">
            {isLogin ? 'Sign In' : 'Create Account'}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 text-black rounded px-3 py-2 text-base focus:outline-none focus:bg-gray-100"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 text-black rounded px-3 py-2 text-base focus:outline-none focus:bg-gray-100"
                placeholder="minimum 6 characters"
                required
                minLength={6}
              />
            </div>

            {!isLogin && (
              <ExamSelector
                selectedExamId={examId}
                onSelect={setExamId}
                required={false}
              />
            )}

            {error && (
              <div className="p-3 text-red-700 text-sm bg-red-50 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
            >
              {loading ? 'Please wait' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full bg-gray-50 py-3 text-black rounded text-sm hover:bg-gray-100"
          >
            {isLogin ? 'Need an account? Create one' : 'Already registered? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
