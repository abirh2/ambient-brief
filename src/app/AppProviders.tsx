import React from 'react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return <ErrorBoundary>{children}</ErrorBoundary>;
};
