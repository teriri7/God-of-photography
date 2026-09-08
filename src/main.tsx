import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PinkLayer Studio caught an error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 rounded-3xl border border-pink-300 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500 text-white flex items-center justify-center text-xl font-bold shadow-md">
              !
            </div>
            <h2 className="text-base font-bold text-slate-800">程序遇到一点小状况</h2>
            <p className="text-xs text-slate-500 font-mono bg-white/60 p-2.5 rounded-xl text-left overflow-x-auto">
              {this.state.error?.message || '未知运行错误'}
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs font-bold transition-all"
              >
                直接刷新
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 text-white text-xs font-bold shadow-sm"
              >
                重置缓存并刷新
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

