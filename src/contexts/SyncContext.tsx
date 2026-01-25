import { createContext, useContext, ReactNode } from 'react';
import { useSync, UseSyncReturn } from '../hooks';

const SyncContext = createContext<UseSyncReturn | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const syncValue = useSync();

  return (
    <SyncContext.Provider value={syncValue}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext(): UseSyncReturn {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
}
