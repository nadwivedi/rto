import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AuditProvider } from './context/AuditContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AuditProvider>
        <App />
      </AuditProvider>
    </AuthProvider>
  </StrictMode>
);
