import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthCallbackProps {
  onVerificationComplete: () => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onVerificationComplete }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Processing auth callback...');
        
        // Get the current URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const type = urlParams.get('type');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        // Handle errors from the URL
        if (error) {
          console.error('AuthCallback: URL contains error:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed');
          return;
        }

        // Handle email verification
        if (type === 'signup' || (accessToken && refreshToken)) {
          console.log('AuthCallback: Processing email verification...');
          
          // Set the session from URL parameters
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken!,
            refresh_token: refreshToken!
          });

          if (sessionError) {
            console.error('AuthCallback: Session error:', sessionError);
            setStatus('error');
            setMessage('Failed to verify email. Please try again.');
            return;
          }

          if (data.user) {
            console.log('AuthCallback: Email verified successfully for user:', data.user.id);
            
            // Update user profile to mark email as verified
            const { error: updateError } = await supabase
              .from('users')
              .update({ email_verified: true })
              .eq('id', data.user.id);

            if (updateError) {
              console.error('AuthCallback: Failed to update user profile:', updateError);
            }

            setStatus('success');
            setMessage('Email verified successfully! You can now sign in to your account.');
            
            // Clear the URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Auto-redirect after a delay
            setTimeout(() => {
              onVerificationComplete();
            }, 3000);
          } else {
            setStatus('error');
            setMessage('Email verification failed. Please try again.');
          }
        } else {
          console.log('AuthCallback: No valid auth parameters found');
          setStatus('error');
          setMessage('Invalid verification link. Please try again.');
        }
      } catch (error: any) {
        console.error('AuthCallback: Unexpected error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during verification.');
      }
    };

    handleAuthCallback();
  }, [onVerificationComplete]);

  const handleContinue = () => {
    onVerificationComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-900/20 to-stone-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-stone-900/95 to-amber-900/20 backdrop-blur-md rounded-xl shadow-2xl border-2 border-amber-700/30 overflow-hidden academic-shadow">
          {/* Header */}
          <div className="bg-gradient-to-r from-stone-900/95 via-amber-900/30 to-stone-800/95 p-8 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 to-stone-900/20"></div>
            <div className="relative flex flex-col items-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-2 ${
                status === 'loading' 
                  ? 'bg-gradient-to-br from-amber-600 to-amber-800 border-amber-500/30' 
                  : status === 'success'
                  ? 'bg-gradient-to-br from-green-600 to-green-800 border-green-500/30'
                  : 'bg-gradient-to-br from-red-600 to-red-800 border-red-500/30'
              }`}>
                {status === 'loading' && <Loader2 className="w-8 h-8 text-white animate-spin" />}
                {status === 'success' && <CheckCircle className="w-8 h-8 text-white" />}
                {status === 'error' && <AlertCircle className="w-8 h-8 text-white" />}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-amber-100 font-['Playfair_Display'] drop-shadow-lg">
                  {status === 'loading' && 'Verifying Email'}
                  {status === 'success' && 'Email Verified'}
                  {status === 'error' && 'Verification Failed'}
                </h1>
                <p className="text-amber-200/80 font-['Source_Serif_Pro'] mt-2">
                  PPMK Calendar
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 text-center space-y-6">
            <div className={`rounded-lg border backdrop-blur-sm academic-shadow p-6 ${
              status === 'loading'
                ? 'bg-gradient-to-br from-amber-900/30 to-stone-800/40 border-amber-700/30'
                : status === 'success'
                ? 'bg-gradient-to-br from-green-900/30 to-stone-800/40 border-green-700/30'
                : 'bg-gradient-to-br from-red-900/30 to-stone-800/40 border-red-700/30'
            }`}>
              <div className="flex items-start space-x-3">
                <Mail className={`w-6 h-6 flex-shrink-0 mt-1 ${
                  status === 'loading' ? 'text-amber-400' :
                  status === 'success' ? 'text-green-400' : 'text-red-400'
                }`} />
                <div className="text-left">
                  <p className={`font-['Crimson_Text'] ${
                    status === 'loading' ? 'text-amber-200/80' :
                    status === 'success' ? 'text-green-200/80' : 'text-red-200/80'
                  }`}>
                    {status === 'loading' && 'Please wait while we verify your email address...'}
                    {message}
                  </p>
                  
                  {status === 'success' && (
                    <p className="text-green-300/60 text-sm mt-2 font-['Crimson_Text']">
                      You will be redirected to the sign-in page automatically.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {status !== 'loading' && (
              <button
                onClick={handleContinue}
                className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all duration-300 font-['Source_Serif_Pro'] academic-shadow ${
                  status === 'success'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                    : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white'
                }`}
              >
                <span>Continue to Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
