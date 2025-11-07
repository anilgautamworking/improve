import { useEffect, useState } from 'react';
import { api } from './lib/api';
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
    const isAuth = api.isAuthenticated();
    setScreen(isAuth ? 'feed' : 'auth');
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

  if (screen === 'feed' && user) {
    return <InfiniteQuizFeed userId={user.id} />;
  }

  return null;
}

export default App;
