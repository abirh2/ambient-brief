import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Ambient Brief ErrorBoundary caught an exception:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#051424] text-[#d4e4fa]">
          <div className="glass-panel max-w-md w-full p-8 text-center flex flex-col items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Something unexpected happened</h2>
            <p className="text-sm text-slate-400">
              {import.meta.env.DEV && this.state.error
                ? this.state.error.message
                : 'The interface could not be rendered. Reload the page to try again.'}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Ambient View
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
