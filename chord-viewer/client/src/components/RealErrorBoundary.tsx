import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

class RealErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: 24,
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: 8 }}>Algo deu errado.</h2>
          <p style={{ color: '#666', marginBottom: 16 }}>
            {this.state.error?.message ?? 'Ocorreu um erro inesperado.'}
          </p>
          <button onClick={this.handleRetry} style={{
            backgroundColor: '#1976d2',
            color: 'white',
            border: 0,
            borderRadius: 6,
            padding: '8px 16px',
            cursor: 'pointer'
          }}>
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RealErrorBoundary;

