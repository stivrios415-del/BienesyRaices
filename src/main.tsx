import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import Konva from 'konva'
import App from './App'
import './index.css'

// Los celulares modernos suelen reportar devicePixelRatio 3 (o más), lo que
// hace que Konva dibuje cada canvas a 3x la resolución real de la pantalla.
// Eso triplica el costo de cada repintado (zoom, arrastre, selección) sin
// aportar nitidez perceptible en un mapa de polígonos simples. Se limita a
// un máximo de 2 para aligerar el dibujo en gama media/baja sin verse pixelado.
Konva.pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
