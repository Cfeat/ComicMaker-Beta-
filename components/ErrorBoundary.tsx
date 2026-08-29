import React from 'react';
import { LanguageContext, type LanguageContextValue } from '../i18n/LanguageContext';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Prevents a full white screen when rendering fails unexpectedly.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static contextType = LanguageContext;
  declare context: LanguageContextValue;

  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const { t } = this.context;
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-comic">
          <div className="max-w-md w-full bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
            <h1 className="font-bangers text-4xl text-comic-purple tracking-wider mb-2">KA-POW!</h1>
            <p className="text-slate-600 mb-4">{t('boundary.text')}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-comic-blue hover:bg-teal-400 text-white font-bold border-2 border-black px-4 py-2 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
            >
              {t('boundary.reload')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
