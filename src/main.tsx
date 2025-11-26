import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { performanceMonitoring } from './services/performanceMonitoring';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

performanceMonitoring.init();

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);