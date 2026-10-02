import { useState, useEffect, useRef, useLayoutEffect, type RefObject } from 'react'

/** Píxeles de contenido desbordado que tiene que haber para que valga la pena ocultar. */
const MIN_DESBORDE = 240
/** Cerca del tope siempre se muestran, aunque vengas bajando. */
const ZONA_TOPE = 60
/** Movimiento mínimo para reaccionar — evita el parpadeo del scroll por inercia. */
const DELTA_MIN = 6
/** Cerca del final siempre se muestran: ahí ya llegaste y conviene ver la navegación. */
const ZONA_FONDO = 72

export function useEsMobile(maxWidth = 767): boolean {
  const [esMobile, setEsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${maxWidth}px)`).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`)
    const onChange = () => setEsMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [maxWidth])
  return esMobile
}

/**
 * Oculta las barras al bajar y las devuelve al subir, estilo Instagram.
 *
 * `scrollRef` es el contenedor con overflow, no la ventana: estos paneles son
 * una columna de 100dvh donde el que scrollea es el <main>.
 *
 * No se activa si no hay suficiente contenido desbordado — en una pestaña
 * corta, ocultar la navegación solo molesta.
 */
export function useHideOnScroll(scrollRef: RefObject<HTMLElement | null>, activo: boolean) {
  const [oculto, setOculto] = useState(false)
  const ultimoY = useRef(0)

  useEffect(() => {
    if (!activo) { setOculto(false); return }
    const el = scrollRef.current
    if (!el) return

    ultimoY.current = el.scrollTop
    let pendiente = false

    const onScroll = () => {
      if (pendiente) return
      pendiente = true
      requestAnimationFrame(() => {
        pendiente = false
        const y = el.scrollTop
        const aplicar = (v: boolean) => { ultimoY.current = y; setOculto(v) }

        // Poco para scrollear: la navegación se queda.
        if (el.scrollHeight - el.clientHeight < MIN_DESBORDE) return aplicar(false)
        // Arriba del todo, siempre visible.
        if (y <= ZONA_TOPE) return aplicar(false)
        // Al final también: ahí ya llegaste y conviene tener la navegación.
        // Esta comparación es estable porque las barras flotan: ocultarlas no
        // cambia clientHeight, así que mostrarlas no invalida la condición.
        if (el.scrollHeight - (y + el.clientHeight) <= ZONA_FONDO) return aplicar(false)

        const delta = y - ultimoY.current
        if (Math.abs(delta) < DELTA_MIN) return
        aplicar(delta > 0)
      })
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollRef, activo])

  return oculto
}

/**
 * Alto real del elemento, para colapsarlo con margen negativo.
 * Se mide en vez de fijarlo porque la barra inferior suma el safe-area del iPhone.
 */
export function useAltura(ref: RefObject<HTMLElement | null>): number {
  const [alto, setAlto] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => setAlto(el.offsetHeight)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return alto
}
