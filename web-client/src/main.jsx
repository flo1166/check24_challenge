/**
 * =========================================================================
 * main.jsx - React Application Entry Point
 * =========================================================================
 * Bootstrap file that renders the React application into the DOM.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import App from './App.jsx';

// Mount React application
const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);