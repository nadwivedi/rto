import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const root = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Prerendered pages already contain the HTML (see prerender.jsx); the fallback page (spa.html) is empty
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
