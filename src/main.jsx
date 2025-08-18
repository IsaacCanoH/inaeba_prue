import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { LoaderProvider } from './context/LoaderContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { SyncProvider } from './context/SyncContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LoaderProvider>
      <ToastProvider>
        <NotificationProvider>
          <SyncProvider> 
            <App />
          </SyncProvider>
        </NotificationProvider>
      </ToastProvider>
    </LoaderProvider>
  </StrictMode>
);