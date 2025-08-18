import { createContext, useContext, useState, useCallback } from "react";

const SyncContext = createContext();

export const SyncProvider = ({ children }) => {
  const [syncTick, setSyncTick] = useState(0);         
  const [lastSyncedAt, setLastSyncedAt] = useState(0); 

  const bumpSync = useCallback(() => {
    setSyncTick(t => t + 1);
    setLastSyncedAt(Date.now());
  }, []);

  return (
    <SyncContext.Provider value={{ syncTick, lastSyncedAt, bumpSync }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSyncStatus = () => useContext(SyncContext);