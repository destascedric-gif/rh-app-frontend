import './global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Sentry from './config/sentry.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Une erreur est survenue. L'équipe a été notifiée.</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
