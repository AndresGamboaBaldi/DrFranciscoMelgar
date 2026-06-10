import { useEffect, useRef, type ReactNode, type ElementType, type CSSProperties } from 'react'

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
  as?: ElementType
  style?: CSSProperties
}

/**
 * Wraps children in a scroll-triggered fade-up reveal animation.
 * Uses IntersectionObserver — no library needed.
 */
export default function Reveal({ children, delay = 0, className = '', as: Tag = 'div', style }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`
          el.classList.add('visible')
          obs.unobserve(el)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])

  return <Tag ref={ref as never} className={`reveal ${className}`} style={style}>{children}</Tag>
}
