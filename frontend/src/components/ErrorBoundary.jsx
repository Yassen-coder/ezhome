import { Component } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught:", error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-[60vh] flex items-center justify-center px-4 py-20"
          data-testid="error-boundary-fallback"
        >
          <div className="max-w-md w-full text-center border border-border bg-card p-8 sm:p-10">
            <AlertTriangle className="w-10 h-10 mx-auto text-destructive mb-5" strokeWidth={1.5} />
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              We hit an unexpected error. Try refreshing the page — your data is safe.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                data-testid="error-boundary-retry"
              >
                <RefreshCw className="w-4 h-4" /> Try again
              </button>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 border border-border text-sm font-medium hover:border-foreground transition-colors"
                data-testid="error-boundary-home"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
