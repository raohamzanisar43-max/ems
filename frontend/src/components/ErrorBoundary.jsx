import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-ink text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose/15 text-rose flex items-center justify-center text-2xl mb-4 border border-rose/30">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-sm text-muted max-w-md mb-6">
            {this.state.error?.message || "An unexpected error occurred while loading this view."}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = "/";
            }}
            className="px-5 py-2.5 rounded-xl bg-signal text-white font-bold text-sm shadow-lg hover:bg-primary transition"
          >
            Reload Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
