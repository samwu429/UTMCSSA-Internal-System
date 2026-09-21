import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import '@/app/styles/global.css'

const storedRedirect = sessionStorage.getItem('utmcssa-spa-redirect')
if (storedRedirect !== null) {
  sessionStorage.removeItem('utmcssa-spa-redirect')
  const restored = new URL(storedRedirect)
  window.history.replaceState(null, '', restored.pathname + restored.search + restored.hash)
}

const rootElement = document.getElementById('root')
if (rootElement === null) {
  throw new Error('The application root element is missing from the document.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
