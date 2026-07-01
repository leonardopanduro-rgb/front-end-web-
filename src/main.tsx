import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { UiFeedbackProvider } from './contexts/UiFeedbackContext';
import './styles/theme.css';
import './styles/global.css';
import 'leaflet/dist/leaflet.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <UiFeedbackProvider>
            <App />
          </UiFeedbackProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
