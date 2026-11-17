"use client";

import React, { Component } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { env } from "../env";
import { captureFrontendError } from "../lib/observability";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    captureFrontendError(error, { module: this.props.moduleName, componentStack: errorInfo.componentStack || '' });
    console.error(`[ErrorBoundary${this.props.moduleName ? `: ${this.props.moduleName}` : ""}]`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-[#1E293B] border border-[#EF4444]/30 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-[#EF4444]/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC] mb-2">
            {this.props.moduleName ? `${this.props.moduleName} Error` : "Something went wrong"}
          </h2>
          <p className="text-[#94A3B8] text-sm mb-4 text-center max-w-md">
            {this.state.error?.message || "An unexpected error occurred. Please try again."}
          </p>
          {env.DEV && this.state.error?.stack && (
            <details className="mb-4 w-full max-w-lg">
              <summary className="text-xs text-[#64748B] cursor-pointer hover:text-[#94A3B8]">
                Stack trace
              </summary>
              <pre className="mt-2 p-3 bg-[#0F172A] rounded text-[10px] text-[#EF4444] overflow-auto max-h-40">
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] border border-[#334155] text-[#94A3B8] rounded-lg hover:text-[#F8FAFC] transition"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for convenience
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  moduleName?: string
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary moduleName={moduleName}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
