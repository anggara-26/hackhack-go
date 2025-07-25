import React, { createContext, useContext, ReactNode } from 'react';
import { authStore, AuthStore } from './AuthStore';

// Create context for the store
const StoreContext = createContext<{
  authStore: AuthStore;
}>({
  authStore,
});

// Provider component
interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  return (
    <StoreContext.Provider value={{ authStore }}>
      {children}
    </StoreContext.Provider>
  );
};

// Hook to use the stores
export const useStores = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStores must be used within a StoreProvider');
  }
  return context;
};

// Individual hooks for each store
export const useAuthStore = () => {
  const { authStore } = useStores();
  return authStore;
};

export default StoreProvider;
