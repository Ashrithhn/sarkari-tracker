import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Something went wrong
            </h2>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              An unexpected error occurred while rendering the page. Don't worry, your tracked applications and personal dates are safe.
            </p>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              
              <button
                onClick={this.handleHome}
                className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
