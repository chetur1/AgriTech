/**
 * AGRI SMART — Application Root
 * File: frontend/src/main.jsx
 *
 * Bootstraps React, sets up i18n (translations), and renders the app.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import './i18n/i18n'  // initialise translations

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
