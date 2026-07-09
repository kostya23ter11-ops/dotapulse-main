'use client';

import React, { type ReactNode } from 'react';
import { useLocale } from '@/app/context/LocaleContext';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={() => {
            this.setState({ hasError: false, error: null });
            window.location.reload();
          }}
        />
      );
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const { t } = useLocale();
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorCard}>
        <i className={`bx bx-error ${styles.errorIcon}`}></i>
        <h2 className={styles.errorTitle}>{t('error.title')}</h2>
        <p className={styles.errorMessage}>
          {error?.message || t('error.message')}
        </p>
        <button className={styles.retryBtn} onClick={onRetry}>
          <i className='bx bx-refresh'></i> {t('error.reload')}
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundary;