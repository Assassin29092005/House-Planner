import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
          <div className="bg-[#1e293b] border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">💥</div>
            <h1 className="text-xl font-black text-white mb-2">Something went wrong</h1>
            <p className="text-slate-400 text-sm mb-2">
              The app encountered an unexpected error.
            </p>
            <p className="text-red-400/70 text-xs font-mono bg-[#0f172a] rounded-lg p-3 mb-6 break-all">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-6 py-2.5 bg-[#0f172a] border border-[#334155] text-slate-300 hover:text-white font-bold rounded-xl text-sm transition-colors"
              >
                Go to Dashboard
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
