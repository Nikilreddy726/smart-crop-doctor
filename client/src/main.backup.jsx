import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

createRoot(document.getElementById('root')).render(
  <div style={{ padding: 20, fontSize: 30, color: 'red' }}>
    <h1>System Sanity Check</h1>
    <p>If you can see this, React is working.</p>
  </div>
)
