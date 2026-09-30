import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getProfessional } from '../../data/professionals'
import CajaGuard from '../../components/caja/CajaGuard'
import { signOut, type PosUsuario } from '../../lib/pos/auth'
import { CAJA_VARS, CAJA_FONTS_URL } from './cajaTheme'

type Pestana = 'cobrar' | 'caja' | 'comisiones' | 'reportes'

const PESTANAS: { id: Pestana; label: string; soloDueno?: boolean }[] = [
  { id: 'cobrar',     label: 'Cobrar' },
  { id: 'caja',       label: 'Caja' },
  { id: 'comisiones', label: 'Comisiones', soloDueno: true },
  { id: 'reportes',   label: 'Reportes',   soloDueno: true },
]

export default function CajaPage() {
  const { slug } = useParams<{ slug: string }>()
  const pro = getProfessional(slug ?? '')

  // Inter se carga acá porque la caja vive fuera de ProfessionalPage,
  // que es quien inyecta las fuentes del tema de cada profesional.
  useEffect(() => {
    const id = 'gf-caja'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = CAJA_FONTS_URL
    document.head.appendChild(link)
  }, [])

  useEffect(() => {
    if (pro) document.title = `Caja · ${pro.shortName ?? pro.name}`
  }, [pro])

  if (!pro) {
    return (
      <div style={{ ...CAJA_VARS, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '.6rem' }}>
        <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--caja-ink-dim)' }}>Negocio no encontrado</p>
        <p style={{ margin: 0, fontSize: '.8rem', color: 'var(--caja-ink-ghost)' }}>/{slug}</p>
      </div>
    )
  }

  return (
    <CajaGuard businessId={pro.businessId} nombreNegocio={pro.shortName ?? pro.name} slug={pro.slug}>
      {(usuario) => <CajaShell usuario={usuario} nombreNegocio={pro.shortName ?? pro.name} />}
    </CajaGuard>
  )
}

function CajaShell({ usuario, nombreNegocio }: { usuario: PosUsuario; nombreNegocio: string }) {
  const esDueno = usuario.rol === 'dueno'
  const visibles = PESTANAS.filter(p => !p.soloDueno || esDueno)
  const [activa, setActiva] = useState<Pestana>('cobrar')

  return (
    <div style={{ ...CAJA_VARS, display: 'flex', flexDirection: 'column' }}>
      {/* ── Cabecera ── */}
      <header style={{
        background: 'var(--caja-surface)', borderBottom: '1px solid var(--caja-rim)',
        padding: '.8rem clamp(1rem,4vw,2rem)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      }}>
        <div style={{ minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: '.62rem', fontWeight: 600, letterSpacing: '.18em',
            textTransform: 'uppercase', color: 'var(--caja-accent)',
          }}>Caja</p>
          <p style={{
            margin: '.1rem 0 0', fontSize: '.95rem', fontWeight: 600,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{nombreNegocio}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '.8rem', fontWeight: 500 }}>{usuario.nombre}</p>
            <p style={{ margin: 0, fontSize: '.68rem', color: 'var(--caja-ink-ghost)', textTransform: 'capitalize' }}>
              {esDueno ? 'Dueño' : 'Cajera'}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            title="Cerrar sesión"
            style={{
              background: 'none', border: '1px solid var(--caja-rim-l)', borderRadius: '6px',
              color: 'var(--caja-ink-ghost)', cursor: 'pointer',
              width: '2.2rem', height: '2.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Pestañas ── */}
      <nav style={{
        background: 'var(--caja-surface)', borderBottom: '1px solid var(--caja-rim)',
        padding: '0 clamp(1rem,4vw,2rem)', display: 'flex', gap: '.25rem', overflowX: 'auto',
      }}>
        {visibles.map(p => {
          const on = p.id === activa
          return (
            <button
              key={p.id}
              onClick={() => setActiva(p.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '.85rem .9rem', fontFamily: 'inherit',
                fontSize: '.78rem', fontWeight: on ? 600 : 500, whiteSpace: 'nowrap',
                color: on ? 'var(--caja-accent)' : 'var(--caja-ink-ghost)',
                borderBottom: `2px solid ${on ? 'var(--caja-accent)' : 'transparent'}`,
                marginBottom: '-1px',
              }}
            >{p.label}</button>
          )
        })}
      </nav>

      {/* ── Contenido ── */}
      <main style={{ flex: 1, padding: 'clamp(1.2rem,3vw,2rem) clamp(1rem,4vw,2rem)' }}>
        <div style={{ maxWidth: '54rem', margin: '0 auto' }}>
          <EnConstruccion pestana={visibles.find(p => p.id === activa)?.label ?? ''} />
        </div>
      </main>
    </div>
  )
}

function EnConstruccion({ pestana }: { pestana: string }) {
  return (
    <div style={{
      border: '1px dashed var(--caja-rim-l)', borderRadius: '10px',
      padding: '3rem 1.5rem', textAlign: 'center',
    }}>
      <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--caja-ink-dim)' }}>{pestana}</p>
      <p style={{ margin: '.4rem 0 0', fontSize: '.85rem', color: 'var(--caja-ink-ghost)' }}>
        Todavía sin construir.
      </p>
    </div>
  )
}
