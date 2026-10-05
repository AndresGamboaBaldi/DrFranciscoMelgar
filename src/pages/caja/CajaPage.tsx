import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { Banknote, Vault, Percent, ChartColumn, Settings, CircleUser, ChevronDown, LogOut } from 'lucide-react'
import { useHideOnScroll, useAltura, useEsMobile } from '../../lib/useHideOnScroll'
import { useParams } from 'react-router-dom'
import { getProfessional } from '../../data/professionals'
import { buildThemeVars, PANEL_FONT_VARS, PANEL_FONTS_URL } from '../../lib/theme'
import CajaGuard from '../../components/caja/CajaGuard'
import { signOut, type PosUsuario } from '../../lib/pos/auth'
import TabCobros from './TabCobros'
import TabCaja from './TabCaja'
import TabComisiones from './TabComisiones'
import TabReportes from './TabReportes'
import TabConfig from './TabConfig'
import type { Professional } from '../../types/professional'

type Pestana = 'cobros' | 'caja' | 'comisiones' | 'reportes' | 'config'

// La caja la arquea quien está en el mostrador, así que no es soloDueno.
const PESTANAS: { id: Pestana; label: string; icon: typeof Banknote; soloDueno?: boolean }[] = [
  { id: 'cobros',     label: 'Cobros',     icon: Banknote },
  { id: 'caja',       label: 'Caja',       icon: Vault },
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', minWidth: 0 }}>
          {/* contain + ancho automático: el logo no es cuadrado (634×503),
              recortarlo a un cuadrado o círculo le come los costados. */}
          {pro.logo && (
            <img src={pro.logo} alt="" style={{
              height: '2.1rem', width: 'auto', objectFit: 'contain', flexShrink: 0,
            }} />
          )}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,3.8vw,2.1rem)', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
            {pro.shortName ?? pro.name}
          </h1>
        </div>

        <MenuCuenta nombre={usuario.nombre} rol={esDueno ? 'Dueño' : 'Caja'} />
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
            : activa === 'caja' ? <TabCaja pro={pro} usuario={usuario} />
            : activa === 'comisiones' ? <TabComisiones pro={pro} usuario={usuario} />
            : activa === 'reportes' ? <TabReportes pro={pro} />
            : activa === 'config' ? <TabConfig pro={pro} usuario={usuario} />
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
                fontFamily: 'var(--font-body)',
                // Con cinco pestañas cada una queda en ~67px útiles y
                // "COMISIONES" no entra: se achica el tipo en vez de cortar
                // la palabra en dos líneas, que descuadraría la barra.
                fontSize: visibles.length >= 5 ? '.6rem' : '.68rem',
                fontWeight: active ? 500 : 300,
                letterSpacing: visibles.length >= 5 ? '.02em' : '.04em',
                textTransform: 'uppercase', whiteSpace: 'nowrap',
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

/** Identidad del usuario con menú desplegable. Por ahora solo cierra sesión. */
function MenuCuenta({ nombre, rol }: { nombre: string; rol: string }) {
  const [abierto, setAbierto] = useState(false)
  const cajaRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => {
      if (!cajaRef.current?.contains(e.target as Node)) setAbierto(false)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', esc)
    }
  }, [abierto])

  return (
    <div ref={cajaRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setAbierto(v => !v)}
        aria-haspopup="menu" aria-expanded={abierto}
        style={{
          display: 'flex', alignItems: 'center', gap: '.55rem',
          padding: '.3rem .5rem .3rem .4rem',
          background: abierto ? 'var(--color-surface2)' : 'none',
          border: `1px solid ${abierto ? 'var(--color-rim-l)' : 'transparent'}`,
          cursor: 'pointer', fontFamily: 'var(--font-body)', maxWidth: '11rem',
        }}
      >
        <CircleUser size={24} color="var(--color-gold)" strokeWidth={1.5} style={{ flexShrink: 0 }} />
        <span style={{ textAlign: 'left', minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: '.78rem', fontWeight: 500, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nombre}
          </span>
          <span style={{ display: 'block', fontSize: '.66rem', color: 'var(--color-ink-ghost)' }}>{rol}</span>
        </span>
        <ChevronDown size={13} color="var(--color-ink-ghost)" style={{ flexShrink: 0, transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>

      {abierto && (
        <div role="menu" style={{
          position: 'absolute', top: 'calc(100% + .4rem)', right: 0, zIndex: 60,
          minWidth: '11rem', background: 'var(--color-surface)',
          border: '1px solid var(--color-rim)', borderRadius: 'var(--r-md)',
          boxShadow: '0 8px 24px rgba(0,0,0,.35)', overflow: 'hidden',
        }}>
          <button
            role="menuitem"
            onClick={() => { setAbierto(false); signOut() }}
            style={{
              display: 'flex', alignItems: 'center', gap: '.6rem', width: '100%',
              padding: '.75rem .9rem', background: 'none', border: 'none',
              borderRadius: 0, cursor: 'pointer', textAlign: 'left',
              fontFamily: 'var(--font-body)', fontSize: '.78rem', color: 'var(--color-ink-dim)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface2)'; e.currentTarget.style.color = 'var(--color-ink)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-ink-dim)' }}
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      )}
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
