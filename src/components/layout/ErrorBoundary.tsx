"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md" dir="rtl">
          <h3 className="text-lg font-medium text-red-800">משהו השתבש</h3>
          <p className="mt-2 text-sm text-red-700">
            אירעה שגיאה בטעינת הקומפוננטה. אנא רענן את הדף ונסה שוב.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;