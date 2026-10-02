import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { Banknote, Percent, ChartColumn, Settings } from 'lucide-react'
import { useHideOnScroll, useAltura, useEsMobile } from '../../lib/useHideOnScroll'
import { useParams } from 'react-router-dom'
import { getProfessional } from '../../data/professionals'
import { buildThemeVars, PANEL_FONT_VARS, PANEL_FONTS_URL } from '../../lib/theme'
import CajaGuard from '../../components/caja/CajaGuard'
import { signOut, type PosUsuario } from '../../lib/pos/auth'
import TabCobros from './TabCobros'
import TabConfig from './TabConfig'
import type { Professional } from '../../types/professional'

type Pestana = 'cobros' | 'comisiones' | 'reportes' | 'config'

const PESTANAS: { id: Pestana; label: string; icon: typeof Banknote; soloDueno?: boolean }[] = [
  { id: 'cobros',     label: 'Cobros',     icon: Banknote },
  { id: 'comisiones', label: 'Comisiones', icon: Percent,     soloDueno: true },
  { id: 'reportes',   label: 'Reportes',   icon: ChartColumn, soloDueno: true },
  { id: 'config',     label: 'Ajustes',    icon: Settings,    soloDueno: true },
]

export default function CajaPage() {
  const { slug } = useParams<{ slug: string }>()
  const pro = getProfessional(slug ?? '')

  // Bebas Neue + Inter, igual que el panel de setup. Se cargan acá porque la
  // caja vive fuera de ProfessionalPage, que es quien inyecta las fuentes.
  useEffect(() => {
    const id = 'gf-setup-bebas-inter'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = PANEL_FONTS_URL
    document.head.appendChild(link)
  }, [])

  useEffect(() => {
    if (pro) document.title = `Caja · ${pro.shortName ?? pro.name}`
  }, [pro])

  if (!pro) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', background: '#0a0907', color: '#a09890' }}>
        <p style={{ fontSize: '1.4rem' }}>Negocio no encontrado</p>
        <p style={{ fontSize: '.82rem' }}>/{slug}</p>
      </div>
    )
  }

  const themeVars = { ...buildThemeVars(pro), ...PANEL_FONT_VARS } as CSSProperties
  const isLight = pro.theme?.mode === 'light'

  return (
    <div className="panel-shell" style={{ ...themeVars, colorScheme: isLight ? 'light' : 'dark', background: 'var(--color-bg)', color: 'var(--color-ink)' }}>
      <CajaGuard businessId={pro.businessId} nombreNegocio={pro.shortName ?? pro.name} slug={pro.slug}>
        {(usuario) => <CajaShell usuario={usuario} pro={pro} />}
      </CajaGuard>
    </div>
  )
}

function CajaShell({ usuario, pro }: { usuario: PosUsuario; pro: Professional }) {
  const esDueno = usuario.rol === 'dueno'
  const visibles = PESTANAS.filter(p => !p.soloDueno || esDueno)
  const [activa, setActiva] = useState<Pestana>('cobros')

  // Cabecera y barra inferior se esconden al bajar, igual que en el panel de setup.
  const mainRef   = useRef<HTMLElement | null>(null)
  const headerRef = useRef<HTMLElement | null>(null)
  const tabbarRef = useRef<HTMLElement | null>(null)
  const esMobile  = useEsMobile()
  const barrasOcultas = useHideOnScroll(mainRef, esMobile)
  const altoHeader = useAltura(headerRef)
  const altoTabbar = useAltura(tabbarRef)

  return (
    <div className="panel-shell" style={{ position: 'relative', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Cabecera ── */}
      {/* En mobile FLOTA sobre el contenido. Si colapsara, cambiaría el
          clientHeight del área que scrollea y realimentaría al detector. */}
      <header ref={headerRef} style={{
        zIndex: 50,
        background: 'var(--color-nav-scrolled, var(--color-surface))',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--color-rim)',
        padding: '.85rem clamp(1rem, 4vw, 2.5rem)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        ...(esMobile ? {
          position: 'absolute' as const, top: 0, left: 0, right: 0,
          transform: barrasOcultas ? 'translateY(-100%)' : 'none',
          transition: 'transform .25s ease',
        } : null),
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', minWidth: 0 }}>
          <a href={`/${pro.slug}`} aria-label="Volver a la página"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2.1rem', height: '2.1rem', flexShrink: 0, color: 'var(--color-gold)', textDecoration: 'none', transition: 'opacity .2s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '.7' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            <svg width="16" height="14" viewBox="0 0 12 10" fill="none"><path d="M4.5 1L1 5l3.5 4M1 5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          </a>
          {pro.logo && <img src={pro.logo} alt="" style={{ height: 28, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />}
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,3.8vw,2.1rem)', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Caja
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '.8rem', fontWeight: 500, color: 'var(--color-ink)' }}>{usuario.nombre}</p>
            <p style={{ fontSize: '.68rem', color: 'var(--color-ink-ghost)' }}>{esDueno ? 'Dueño' : 'Cajera'}</p>
          </div>
          <button
            onClick={() => signOut()} title="Cerrar sesión" aria-label="Cerrar sesión"
            style={{
              background: 'none', border: '1px solid var(--color-rim-l)',
              color: 'var(--color-ink-ghost)', cursor: 'pointer',
              width: '2.1rem', height: '2.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-gold)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-rim-l)'; e.currentTarget.style.color = 'var(--color-ink-ghost)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Pestañas (desktop/tablet) ── */}
      <div className="panel-tabbar-top" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-rim)', padding: '0 clamp(1rem,4vw,2.5rem)', overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ display: 'flex', gap: 0, minWidth: 'max-content' }}>
          {visibles.map(p => {
            const active = p.id === activa
            return (
              <button key={p.id} onClick={() => setActiva(p.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '.85rem 1.25rem',
                  borderBottom: `2px solid ${active ? 'var(--color-gold)' : 'transparent'}`,
                  marginBottom: -1,
                  fontFamily: 'var(--font-body)', fontSize: '.78rem',
                  fontWeight: active ? 500 : 300,
                  letterSpacing: '.08em', textTransform: 'uppercase',
                  color: active ? 'var(--color-ink)' : 'var(--color-ink-dim)',
                  transition: 'color .2s, border-color .2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--color-ink)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--color-ink-dim)' }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Contenido ── */}
      <main ref={mainRef} className="panel-main-mobile-pad" style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        padding: 'clamp(1.5rem,3vw,2.5rem) clamp(1rem,4vw,2.5rem)',
        ...(esMobile ? {
          paddingTop: altoHeader + 20,
          paddingBottom: altoTabbar + 20,
        } : null),
      }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
          {activa === 'cobros' ? <TabCobros pro={pro} usuario={usuario} />
            : activa === 'config' ? <TabConfig pro={pro} />
            : <EnConstruccion pestana={visibles.find(p => p.id === activa)?.label ?? ''} />}
        </div>
      </main>

      {/* ── Pestañas (mobile, barra inferior) ── */}
      <nav
        className="panel-tabbar-bottom"
        ref={tabbarRef}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50,
          transform: barrasOcultas ? 'translateY(100%)' : 'none',
          transition: 'transform .25s ease',
        }}
      >
        {visibles.map(p => {
          const active = p.id === activa
          const Icon = p.icon
          return (
            <button key={p.id} onClick={() => setActiva(p.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '.3rem', padding: '.7rem .25rem .35rem', minHeight: '3.75rem', background: 'none', border: 'none',
                borderTop: `2px solid ${active ? 'var(--color-gold)' : 'transparent'}`,
                marginTop: -1, cursor: 'pointer',
                color: active ? 'var(--color-gold)' : 'var(--color-ink-dim)',
                fontFamily: 'var(--font-body)', fontSize: '.68rem',
                fontWeight: active ? 500 : 300, letterSpacing: '.04em', textTransform: 'uppercase',
                transition: 'color .2s, border-color .2s',
              }}
            >
              <Icon size={22} color={active ? 'var(--color-gold)' : 'var(--color-ink-dim)'} />
              {p.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function EnConstruccion({ pestana }: { pestana: string }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.5vw,2.5rem)', fontWeight: 400, letterSpacing: '-.02em', color: 'var(--color-ink)', marginBottom: '.45rem' }}>
        {pestana}
      </h2>
      <p style={{ fontSize: '1rem', color: 'var(--color-ink-dim)', lineHeight: 1.7 }}>
        Todavía sin construir.
      </p>
    </div>
  )
}
