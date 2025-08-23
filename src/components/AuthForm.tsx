import React, { useState, useEffect } from 'react';
import { Calendar, User, Lock, Mail, UserPlus, LogIn, AlertCircle, CheckCircle, Loader2, Info } from 'lucide-react';
import { authService } from '../services/authService';
import { User as UserType } from '../types/User';

interface AuthFormProps {
  onLogin: (userData: { user: UserType; session: any }) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    adminCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [info, setInfo] = useState('');

  // Store session in localStorage when login is successful
  useEffect(() => {
    const storeSession = (userData: { user: UserType; session: any }) => {
      localStorage.setItem('ppmk_session', JSON.stringify(userData.session));
    };

    // Override the onLogin to store session
    const originalOnLogin = onLogin;
    const wrappedOnLogin = (userData: { user: UserType; session: any }) => {
      storeSession(userData);
      originalOnLogin(userData);
    };

    // Replace the onLogin function
    onLogin = wrappedOnLogin;
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
    if (info) setInfo('');
  };

  const validateForm = () => {
    const { email, password, username, adminCode } = formData;
    
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (!isLogin) {
      if (!username.trim()) {
        setError('Username is required');
        return false;
      }
      
      if (username.length < 3) {
        setError('Username must be at least 3 characters long');
        return false;
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError('Username can only contain letters, numbers, and underscores');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    setInfo('');

    try {
      if (isLogin) {
        console.log('AuthForm: Attempting login...');
        const result = await authService.signIn(formData.email, formData.password);
        console.log('AuthForm: Login successful');
        
        // Store session and call onLogin
        localStorage.setItem('ppmk_session', JSON.stringify(result.session));
        onLogin(result);
      } else {
        console.log('AuthForm: Attempting registration...');
        
        // Determine role based on admin code
        const role = formData.adminCode.trim() === 'PPMK1234' ? 'admin' : 'user';
        
        const result = await authService.signUp({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          role
        });
        
        console.log('AuthForm: Registration successful - immediate access granted');
        setSuccess('Account created successfully! Logging you in...');
        
        // Store session and auto-login after successful registration
        localStorage.setItem('ppmk_session', JSON.stringify(result.session));
        
        setTimeout(() => {
          onLogin(result);
        }, 1000);
      }
    } catch (error: any) {
      console.error('AuthForm: Authentication error:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setInfo('');
    setFormData({
      email: '',
      password: '',
      username: '',
      adminCode: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-900/20 to-stone-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-stone-900/95 to-amber-900/20 backdrop-blur-md rounded-xl shadow-2xl border-2 border-amber-700/30 overflow-hidden academic-shadow">
          {/* Header */}
          <div className="bg-gradient-to-r from-stone-900/95 via-amber-900/30 to-stone-800/95 p-8 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 to-stone-900/20"></div>
            <div className="relative flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center shadow-lg border-2 border-amber-500/30 overflow-hidden">
                <img 
                  src="https://cdn.chatandbuild.com/users/688cacb89963427649f657c2/gambar-ppmk-1755929666927-797825132.jpg"
                  alt="PPMK Logo"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    // Fallback to calendar icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const calendarIcon = document.createElement('div');
                      calendarIcon.innerHTML = '<svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>';
                      parent.appendChild(calendarIcon);
                    }
                  }}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-amber-100 font-['Playfair_Display'] drop-shadow-lg">
                  PPMK Calendar
                </h1>
                <p className="text-amber-200/80 font-['Source_Serif_Pro'] mt-2">
                  {isLogin ? 'Welcome back' : 'Join our community'}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-amber-200 font-['Source_Serif_Pro']">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-stone-800/50 to-amber-900/20 border border-amber-700/30 rounded-lg text-amber-100 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 font-['Crimson_Text'] academic-shadow"
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Username Field (Registration only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-semibold text-amber-200 font-['Source_Serif_Pro']">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-5 h-5" />
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-stone-800/50 to-amber-900/20 border border-amber-700/30 rounded-lg text-amber-100 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 font-['Crimson_Text'] academic-shadow"
                      placeholder="Choose a username"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-amber-200 font-['Source_Serif_Pro']">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-5 h-5" />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-stone-800/50 to-amber-900/20 border border-amber-700/30 rounded-lg text-amber-100 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 font-['Crimson_Text'] academic-shadow"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Admin Code Field (Registration only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <label htmlFor="adminCode" className="block text-sm font-semibold text-amber-200 font-['Source_Serif_Pro']">
                    Admin Code <span className="text-amber-400/60">(optional)</span>
                  </label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-5 h-5" />
                    <input
                      type="text"
                      id="adminCode"
                      name="adminCode"
                      value={formData.adminCode}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-stone-800/50 to-amber-900/20 border border-amber-700/30 rounded-lg text-amber-100 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 font-['Crimson_Text'] academic-shadow"
                      placeholder="Enter admin code for admin access"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-amber-300/60 font-['Crimson_Text']">
                    Leave empty for regular user account
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-700/50 rounded-lg p-4 flex items-start space-x-3 academic-shadow">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-200 text-sm font-['Crimson_Text']">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-gradient-to-r from-green-900/30 to-green-800/20 border border-green-700/50 rounded-lg p-4 flex items-start space-x-3 academic-shadow">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-green-200 text-sm font-['Crimson_Text']">{success}</p>
                </div>
              )}

              {/* Info Message */}
              {info && (
                <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 border border-blue-700/50 rounded-lg p-4 flex items-start space-x-3 academic-shadow">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-blue-200 text-sm font-['Crimson_Text']">{info}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:from-amber-800 disabled:to-amber-900 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 font-['Source_Serif_Pro'] academic-shadow disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                  </>
                ) : (
                  <>
                    {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  </>
                )}
              </button>

              {/* Toggle Mode */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  disabled={loading}
                  className="text-amber-300 hover:text-amber-200 font-semibold font-['Crimson_Text'] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
