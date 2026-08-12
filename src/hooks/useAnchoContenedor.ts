import { useEffect, useRef, useState } from 'react'

/**
 * Mide el ancho real del contenedor (con ResizeObserver) para que los
 * lienzos de Konva (que necesitan un ancho en píxeles fijo, no CSS fluido)
 * se ajusten al viewport real en vez de desbordar en pantallas angostas.
 */
export function useAnchoContenedor<T extends HTMLElement>(anchoInicial = 360) {
  const ref = useRef<T>(null)
  const [ancho, setAncho] = useState(anchoInicial)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w && Math.round(w) !== ancho) setAncho(Math.floor(w))
    })
    obs.observe(el)
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [ref, ancho] as const
}