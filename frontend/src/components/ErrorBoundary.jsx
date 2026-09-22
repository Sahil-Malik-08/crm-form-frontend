import { Component } from "react";

/**
 * ErrorBoundary — prevents an unexpected render error from unmounting the
 * entire React tree (which appears as a blank/white page). Instead it shows a
 * friendly fallback with a "Try again" button that resets the error state.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "grid",
            placeItems: "center",
            minHeight: "100vh",
            background: "var(--color-surface, #f8fafc)",
            color: "var(--color-text-primary, #0f172a)",
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                margin: "0 auto 16px",
                borderRadius: 12,
                background: "#fee2e2",
                color: "#b91c1c",
                display: "grid",
                placeItems: "center",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              !
            </div>
            <h1 style={{ margin: "0 0 8px", fontSize: 20 }}>Something went wrong</h1>
            <p style={{ color: "var(--color-text-muted, #64748b)", margin: "0 0 8px" }}>
              An unexpected error occurred while rendering this page.
            </p>
            {this.props.fallbackMessage && (
              <p style={{ fontSize: 13, color: "var(--color-text-muted, #64748b)", margin: "0 0 20px" }}>
                {this.props.fallbackMessage}
              </p>
            )}
            <button
              onClick={this.handleReset}
              style={{
                padding: "10px 20px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
