import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Automatically handle stale chunk import errors after new deployments
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const key = 'chunk_reload_attempts'
  const attempts = Number(sessionStorage.getItem(key) || 0)
  if (attempts < 2) {
    sessionStorage.setItem(key, String(attempts + 1))
    window.location.reload()
  }
})

window.addEventListener('load', () => {
  sessionStorage.removeItem('chunk_reload_attempts')
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
