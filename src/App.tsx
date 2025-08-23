import React, { useState, useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { AuthCallback } from './components/AuthCallback';
import { Calendar } from './components/Calendar';
import { authService } from './services/authService';
import { User } from './types/User';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCallback, setShowCallback] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthParams = urlParams.get('access_token') || urlParams.get('type') === 'signup';
    
    if (hasAuthParams) {
      setShowCallback(true);
      setLoading(false);
      return;
    }

    const checkUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        // Silently handle auth check errors
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const handleLogin = (userData: { user: User; session: any }) => {
    setUser(userData.user);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      // Silently handle logout errors
    }
  };

  const handleVerificationComplete = () => {
    setShowCallback(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-900/20 to-stone-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="text-amber-200 font-['Crimson_Text']">Loading PPMK Calendar...</p>
        </div>
      </div>
    );
  }

  if (showCallback) {
    return <AuthCallback onVerificationComplete={handleVerificationComplete} />;
  }

  if (!user) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return <Calendar user={user} onLogout={handleLogout} />;
}

export default App;
