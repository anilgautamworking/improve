import { useEffect, useState } from 'react';
import { api, refreshToken } from './lib/api';
import { AuthForm } from './components/AuthForm';
import { InfiniteQuizFeed } from './components/InfiniteQuizFeed';
import { ExamSelectionScreen } from './components/ExamSelectionScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';

type Screen = 'auth' | 'exam-selection' | 'feed' | 'admin';

function App() {
  const [screen, setScreen] = useState<Screen>('auth');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = () => {
    // Refresh token from localStorage in case it was updated
    refreshToken();
    
    const isAuth = api.isAuthenticated();
    if (!isAuth) {
      // Token expired or doesn't exist, clear any stale data
      api.logout();
      setScreen('auth');
      setUser(null);
    } else {
      // User is authenticated, extract user info from token
      const userFromToken = api.getUserFromToken();
      if (userFromToken && userFromToken.id) {
        setUser(userFromToken);
        // Check if user is admin
        if (userFromToken.role === 'admin') {
          setScreen('admin');
        } else if (!userFromToken.exam_id) {
          // Regular user without exam selection
          setScreen('exam-selection');
        } else {
          setScreen('feed');
        }
      } else {
        // Token exists but can't extract user info, show auth
        api.logout();
        setScreen('auth');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    // Check if user is admin
    if (userData.role === 'admin') {
      setScreen('admin');
    } else if (!userData.exam_id) {
      // Regular user without exam selection
      setScreen('exam-selection');
    } else {
      setScreen('feed');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setScreen('auth');
  };

  const handleExamSelect = async (examId: string) => {
    // Update user state with exam_id
    // Note: In a real app, you might want to update the user's exam_id via API
    // For now, we'll just update the local state and refresh token
    const updatedUser = { ...user, exam_id: examId };
    setUser(updatedUser);
    setScreen('feed');
    
    // Refresh token to get updated user data
    refreshToken();
  };

  const handleExamSkip = () => {
    // Allow user to proceed without selecting exam
    setScreen('feed');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading</p>
        </div>
      </div>
    );
  }

  if (screen === 'auth') {
    return <AuthForm onSuccess={handleAuthSuccess} />;
  }

  if (screen === 'admin') {
    // Verify user is still admin
    const userData = user || api.getUserFromToken();
    if (userData?.role === 'admin') {
      return <AdminDashboard onLogout={handleLogout} />;
    }
    // If not admin, redirect to auth
    return <AuthForm onSuccess={handleAuthSuccess} />;
  }

  if (screen === 'exam-selection') {
    return (
      <ExamSelectionScreen
        onSelect={handleExamSelect}
        onSkip={handleExamSkip}
      />
    );
  }

  if (screen === 'feed') {
    // If user is available, use it; otherwise try to get from token
    const userData = user || api.getUserFromToken();
    const userId = userData?.id;
    const examId = userData?.exam_id;
    
    if (userId) {
      return <InfiniteQuizFeed userId={userId} examId={examId} />;
    }
    // Fallback: show auth if we can't get userId
    return <AuthForm onSuccess={handleAuthSuccess} />;
  }

  return null;
}

function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default AppWithErrorBoundary;
