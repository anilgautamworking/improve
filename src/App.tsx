import { useEffect, useState } from 'react';
import { api, refreshToken } from './lib/api';
import { AuthForm } from './components/AuthForm';
import { InfiniteQuizFeed } from './components/InfiniteQuizFeed';

type Screen = 'auth' | 'feed';

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
        setScreen('feed');
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
    setScreen('feed');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (screen === 'auth') {
    return <AuthForm onSuccess={handleAuthSuccess} />;
  }

  if (screen === 'feed') {
    // If user is available, use it; otherwise try to get from token
    const userId = user?.id || api.getUserFromToken()?.id;
    if (userId) {
      return <InfiniteQuizFeed userId={userId} />;
    }
    // Fallback: show auth if we can't get userId
    return <AuthForm onSuccess={handleAuthSuccess} />;
  }

  return null;
}

export default App;
