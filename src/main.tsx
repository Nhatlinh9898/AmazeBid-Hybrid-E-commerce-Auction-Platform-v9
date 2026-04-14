import React from 'react';
import { createRoot } from 'react-dom/client';
import AppRouter from './AppRouter';
import { AuthProvider } from '../context/AuthProvider';
import './index.css';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  
  // Simple Error Boundary
  class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: any) {
      return { hasError: true, error };
    }
    componentDidCatch(error: any, errorInfo: any) {
      console.error("App Error:", error, errorInfo);
    }
    render() {
      if (this.state.hasError) {
        return (
          <div style={{ padding: '20px', color: 'red', background: '#fff' }}>
            <h1>Something went wrong.</h1>
            <pre>{this.state.error?.toString()}</pre>
          </div>
        );
      }
      return this.props.children;
    }
  }

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element");
}
