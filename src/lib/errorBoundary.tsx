import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-900/20 to-stone-800 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-gradient-to-br from-stone-900/95 to-amber-900/20 backdrop-blur-md rounded-xl shadow-2xl border-2 border-red-700/30 overflow-hidden academic-shadow">
              <div className="bg-gradient-to-r from-stone-900/95 via-red-900/30 to-stone-800/95 p-8 text-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 to-stone-900/20"></div>
                <div className="relative flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center shadow-lg border-2 border-red-500/30">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-red-100 font-['Playfair_Display'] drop-shadow-lg">
                      Something went wrong
                    </h1>
                    <p className="text-red-200/80 font-['Source_Serif_Pro'] mt-2">
                      The application encountered an unexpected error
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 text-center space-y-6">
                <div className="bg-gradient-to-br from-red-900/30 to-stone-800/40 rounded-lg border border-red-700/30 backdrop-blur-sm academic-shadow p-6">
                  <p className="text-red-200/80 font-['Crimson_Text'] mb-4">
                    We apologize for the inconvenience. Please try refreshing the page.
                  </p>
                  {this.state.error && (
                    <details className="text-left">
                      <summary className="text-red-300 cursor-pointer font-semibold mb-2">
                        Technical Details
                      </summary>
                      <pre className="text-xs text-red-200/60 bg-stone-900/50 p-3 rounded overflow-auto">
                        {this.state.error.message}
                      </pre>
                    </details>
                  )}
                </div>

                <button
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 font-['Source_Serif_Pro'] academic-shadow"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Reload Application</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
