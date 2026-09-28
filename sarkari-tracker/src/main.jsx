import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

// Normalize multiple leading slashes in URL path (e.g. //login -> /login)
if (typeof window !== 'undefined' && window.location.pathname.startsWith('//')) {
  const cleanPath = window.location.pathname.replace(/^\/+/, '/');
  window.history.replaceState(null, '', cleanPath + window.location.search + window.location.hash);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
