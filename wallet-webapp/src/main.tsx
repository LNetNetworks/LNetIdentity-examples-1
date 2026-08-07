import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import './styles/global.css'

// `autoUpdate`: el service worker se reemplaza solo cuando hay una versión nueva.
registerSW({ immediate: true })

const container = document.getElementById('root')
if (!container) throw new Error('No se encontró el contenedor #root')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
