import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './store';
import { getSupabase } from './utils/supabase';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered successfully with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('Service Worker registration failed: ', error);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

try {
  // Initial check to ensure Supabase is configured before rendering the app.
  // This will throw an error if the URL or key is missing.
  getSupabase();
  
  root.render(
    <React.StrictMode>
      <AppProvider>
        <App />
      </AppProvider>
    </React.StrictMode>
  );
} catch (e: any) {
  // If configuration is missing, render a helpful error message instead of crashing.
  root.render(
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-900 p-4 font-sans text-text-primary">
        <div className="bg-surface dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-2xl w-full text-center border border-danger/20">
            <h1 className="text-2xl font-heading font-bold text-danger mb-4">Error de Configuración</h1>
            <pre className="text-left bg-background dark:bg-slate-700 p-4 rounded-lg whitespace-pre-wrap text-sm text-text-secondary dark:text-slate-300 font-mono leading-relaxed">
                {e.message}
            </pre>
        </div>
    </div>
  );
}
