import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to error tracking service (e.g., Sentry) in production
    // if (import.meta.env.PROD) {
    //   // Send to error tracking service
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen layered-gradient flex items-center justify-center px-4">
          <div className="max-w-md w-full glass rounded-[32px] p-8 border border-gray-300 shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full border border-gray-300 flex items-center justify-center bg-gray-100">
                <AlertCircle className="w-8 h-8 text-gray-600" />
              </div>
            </div>

            <h1 className="text-2xl font-semibold text-gray-900 text-center mb-4">
              Something went off-track
            </h1>

            <p className="text-gray-600 text-center mb-6">
              An unexpected error surfaced. Your progress remains intact.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 border border-gray-300 rounded-2xl bg-gray-50">
                <p className="text-gray-700 text-sm font-mono mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer mb-2">Stack trace</summary>
                    <pre className="overflow-auto max-h-40 text-gray-600">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-gray-900 text-white font-semibold py-3 px-4 rounded-2xl uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Retry
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-2xl uppercase tracking-[0.3em] hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors"
              >
                <Home className="w-5 h-5" />
                Home
              </button>
            </div>

            <p className="text-gray-500 text-xs text-center mt-6">
              If this continues, reach out to support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

