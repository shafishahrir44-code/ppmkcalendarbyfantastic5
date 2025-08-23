import React, { useState } from 'react';
import { X, Mail, Lock, UserPlus, LogIn, User, Shield, Key } from 'lucide-react';
import { authService } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (userData: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin
}) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin'>('user');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const ADMIN_CODE = 'PPMK1234';

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setSelectedRole('user');
    setAdminCode('');
    setError('');
    setSuccess('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isLoginMode) {
        // Login validation
        if (!email.trim() || !password.trim()) {
          setError('Please enter both email and password');
          return;
        }

        console.log('Attempting login...');
        const result = await authService.signIn(email, password);
        onLogin(result);
        handleClose();
      } else {
        // Registration validation
        if (!username.trim() || !email.trim() || !password.trim()) {
          setError('Please fill in all required fields');
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters long');
          return;
        }

        // Admin code validation
        if (selectedRole === 'admin') {
          if (!adminCode.trim()) {
            setError('Administrator code is required for admin registration');
            return;
          }
          
          if (adminCode.trim() !== ADMIN_CODE) {
            setError('Invalid administrator code');
            return;
          }
        }

        console.log('Attempting registration...');
        const result = await authService.signUp({
          email: email,
          password: password,
          username: username,
          role: selectedRole
        });
        
        console.log('Registration successful - immediate access granted');
        
        // Show success message briefly then log in
        setSuccess('Account created successfully! Logging you in...');
        
        // Auto-login after successful registration
        setTimeout(() => {
          onLogin(result);
          handleClose();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-stone-900/95 to-amber-900/80 border-2 border-amber-700/50 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col academic-shadow backdrop-blur-md">
        {/* Fixed Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-stone-900/95 via-amber-900/30 to-stone-800/95 text-amber-100 p-6 rounded-t-xl border-b-2 border-amber-700/40">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 to-stone-900/20 rounded-t-xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center shadow-lg border-2 border-amber-500/30 overflow-hidden">
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
                      calendarIcon.innerHTML = '<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>';
                      parent.appendChild(calendarIcon);
                    }
                  }}
                />
              </div>
              <h2 className="text-2xl font-bold font-['Playfair_Display'] drop-shadow-lg">
                {isLoginMode ? 'Login' : 'Register'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-3 hover:bg-stone-700/40 rounded-lg transition-all duration-300 backdrop-blur-sm border border-stone-600/30 academic-shadow"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isLoginMode ? (
                // Login form
                <>
                  <div>
                    <label className="block text-amber-200 text-sm font-bold mb-2 font-['Source_Serif_Pro']">
                      <Mail size={16} className="inline mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-stone-800/60 border-2 border-stone-700/50 rounded-lg px-4 py-3 text-amber-100 placeholder-amber-300/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm academic-shadow"
                      placeholder="Enter your email..."
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-amber-200 text-sm font-bold mb-2 font-['Source_Serif_Pro']">
                      <Lock size={16} className="inline mr-2" />
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-stone-800/60 border-2 border-stone-700/50 rounded-lg px-4 py-3 text-amber-100 placeholder-amber-300/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm academic-shadow"
                      placeholder="Enter your password..."
                      required
                      disabled={isLoading}
                    />
                  </div>
                </>
              ) : (
                // Registration form
                <>
                  <div>
                    <label className="block text-amber-200 text-sm font-bold mb-2 font-['Source_Serif_Pro']">
                      <User size={16} className="inline mr-2" />
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-stone-800/60 border-2 border-stone-700/50 rounded-lg px-4 py-3 text-amber-100 placeholder-amber-300/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm academic-shadow"
                      placeholder="Choose a username..."
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-amber-200 text-sm font-bold mb-2 font-['Source_Serif_Pro']">
                      <Mail size={16} className="inline mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-stone-800/60 border-2 border-stone-700/50 rounded-lg px-4 py-3 text-amber-100 placeholder-amber-300/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm academic-shadow"
                      placeholder="Enter your email..."
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-amber-200 text-sm font-bold mb-2 font-['Source_Serif_Pro']">
                      <Lock size={16} className="inline mr-2" />
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-stone-800/60 border-2 border-stone-700/50 rounded-lg px-4 py-3 text-amber-100 placeholder-amber-300/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm academic-shadow"
                      placeholder="Enter your password..."
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-amber-200 text-sm font-bold mb-3 font-['Source_Serif_Pro']">
                      Account Type
                    </label>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('user')}
                        disabled={isLoading}
                        className={`w-full p-4 rounded-lg border-2 transition-all duration-300 backdrop-blur-sm academic-shadow ${
                          selectedRole === 'user'
                            ? 'bg-amber-700/40 border-amber-500 text-amber-100'
                            : 'bg-stone-800/40 border-stone-700/50 text-amber-200 hover:border-amber-600/50 hover:bg-stone-700/50'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <User size={20} />
                          <span className="font-bold font-['Source_Serif_Pro']">User</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole('admin')}
                        disabled={isLoading}
                        className={`w-full p-4 rounded-lg border-2 transition-all duration-300 backdrop-blur-sm academic-shadow ${
                          selectedRole === 'admin'
                            ? 'bg-amber-700/40 border-amber-500 text-amber-100'
                            : 'bg-stone-800/40 border-stone-700/50 text-amber-200 hover:border-amber-600/50 hover:bg-stone-700/50'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <Shield size={20} />
                          <span className="font-bold font-['Source_Serif_Pro']">Administrator</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {selectedRole === 'admin' && (
                    <div className="bg-gradient-to-br from-amber-900/30 to-stone-800/40 rounded-lg border border-amber-700/30 backdrop-blur-sm academic-shadow p-4">
                      <label className="block text-amber-200 text-sm font-bold mb-2 font-['Source_Serif_Pro']">
                        <Key size={16} className="inline mr-2" />
                        Administrator Code
                      </label>
                      <input
                        type="password"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        className="w-full bg-stone-800/60 border-2 border-amber-600/50 rounded-lg px-4 py-3 text-amber-100 placeholder-amber-300/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm academic-shadow"
                        placeholder="Enter administrator code..."
                        required
                        disabled={isLoading}
                      />
                      <p className="text-amber-300/80 text-sm mt-2 font-['Crimson_Text'] italic">
                        Contact the organization to obtain the administrator verification code
                      </p>
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-700/50 rounded-lg p-4 backdrop-blur-sm academic-shadow">
                  <p className="text-red-200 font-['Crimson_Text']">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-700/50 rounded-lg p-4 backdrop-blur-sm academic-shadow">
                  <p className="text-green-200 font-['Crimson_Text']">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-amber-700/80 to-amber-800/80 text-amber-100 font-semibold py-4 px-6 rounded-lg hover:from-amber-600/90 hover:to-amber-700/90 transition-all duration-300 academic-shadow font-['Source_Serif_Pro'] backdrop-blur-sm border border-amber-600/50 flex items-center justify-center gap-3 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-amber-200 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isLoginMode ? <LogIn size={20} /> : <UserPlus size={20} />}
                    {isLoginMode ? 'Login' : 'Create Account'}
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t-2 border-amber-700/30">
              <p className="text-amber-300/80 text-center font-['Crimson_Text']">
                {isLoginMode ? "Don't have an account?" : "Already have an account?"}
              </p>
              <button
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setError('');
                  setSuccess('');
                  setAdminCode('');
                }}
                disabled={isLoading}
                className={`w-full mt-3 text-amber-200 hover:text-amber-100 font-bold transition-colors font-['Source_Serif_Pro'] ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoginMode ? 'Register here' : 'Login here'}
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          .academic-shadow {
            box-shadow: 
              0 4px 6px -1px rgba(0, 0, 0, 0.3),
              0 2px 4px -1px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }
        `}</style>
      </div>
    </div>
  );
};
