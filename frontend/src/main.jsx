// src/main.jsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './index.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}