import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { LightboxProvider } from './providers/LightboxProvider.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LightboxProvider>
        <App />
      </LightboxProvider>
    </BrowserRouter>
  </React.StrictMode>
)
