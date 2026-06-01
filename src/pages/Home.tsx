import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PROFESSIONALS } from '../data/professionals'
import type { Professional } from '../types/professional'

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Todos', medico: 'Médico', dentista: 'Dentista',
  barbero: 'Barbero', estetica: 'Estética', psicologo: 'Psicólogo', otro: 'Otro',
}
const CATEGORY_ICONS: Record<string, string> = {
  all: '✦', medico: '🩺', dentista: '🦷',
  barbero: '✂️', estetica: '✨', psicologo: '🧠', otro: '◇',
}
const GOLD = '#c4995a'
const GOLD_L = '#d4b078'

export default function Home() {
  const pros = Object.values(PROFESSIONALS)
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('all')
  const [city,     setCity]     = useState('all')

  const cities = useMemo(() => {
    const set = new Set(pros.map(p => p.location.split(',')[0].trim()))
    return ['all', ...Array.from(set).sort()]
  }, [pros])

  const categories = useMemo(() => {
    const set = new Set(pros.map(p => p.category ?? 'otro'))
    return ['all', ...Array.from(set)]
  }, [pros])

  const filtered = useMemo(() => pros.filter(p => {
    const matchCat    = category === 'all' || (p.category ?? 'otro') === category
    const matchCity   = city === 'all' || p.location.split(',')[0].trim() === city
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.specialty.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchCity && matchSearch
  }), [pros, category, city, search])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0907', color: '#ede8df' }}>

      {/* ── Header ── */}
      <div style={{ padding: '4rem 1.5rem 2.5rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(2.5rem,7vw,5rem)', fontWeight: 300, color: '#ffffff', letterSpacing: '-.02em', marginBottom: '.4rem' }}>
          Probo<em style={{ color: GOLD }}>.pro</em>
        </p>
        <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,.6)', maxWidth: '28rem', margin: '0 auto' }}>
          Encuentra tu profesional y agenda en segundos
        </p>
      </div>

      {/* ── Filters ── */}
      <div style={{ padding: '0 1.5rem 2rem', maxWidth: '680px', margin: '0 auto' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '1.1rem' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.35)', pointerEvents: 'none' }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input type="text" placeholder="Buscar profesional..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.75rem', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.2)', color: '#ffffff', fontSize: '1rem', padding: '.85rem 1rem .85rem 2.75rem' }} />
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: '.45rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '.75rem' }}>
          {categories.map(cat => {
            const active = category === cat
            return (
              <button key={cat} onClick={() => setCategory(cat)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', padding: '.4rem .9rem', background: active ? GOLD : 'transparent', color: active ? '#0a0907' : 'rgba(255,255,255,.5)', border: `1px solid ${active ? GOLD : 'rgba(255,255,255,.16)'}`, fontFamily: 'var(--font-body)', fontSize: '.73rem', fontWeight: active ? 500 : 300, letterSpacing: '.07em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = '#ffffff' }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,.16)'; e.currentTarget.style.color = 'rgba(255,255,255,.5)' }}}
              >
                <span style={{ fontSize: '.9rem' }}>{CATEGORY_ICONS[cat] ?? '◇'}</span>
                {CATEGORY_LABELS[cat] ?? cat}
              </button>
            )
          })}
        </div>

        {/* City chips */}
        {cities.length > 2 && (
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.25rem', alignItems: 'center' }}>
            <span style={{ fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginRight: '.2rem' }}>Ciudad:</span>
            {cities.map(c => {
              const active = city === c
              return (
                <button key={c} onClick={() => setCity(c)}
                  style={{ padding: '.3rem .7rem', background: active ? 'rgba(255,255,255,.14)' : 'transparent', color: active ? '#ffffff' : 'rgba(255,255,255,.38)', border: `1px solid ${active ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.12)'}`, fontFamily: 'var(--font-body)', fontSize: '.68rem', fontWeight: 300, letterSpacing: '.06em', cursor: 'pointer', transition: 'all .2s' }}
                >
                  {c === 'all' ? 'Todas' : c}
                </button>
              )
            })}
          </div>
        )}

        {/* Count */}
        <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.35)', textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ color: '#ffffff', fontWeight: 400 }}>{filtered.length}</span> profesional{filtered.length !== 1 ? 'es' : ''}
          {(search || category !== 'all' || city !== 'all') && (
            <button onClick={() => { setSearch(''); setCategory('all'); setCity('all') }}
              style={{ marginLeft: '1rem', background: 'none', border: 'none', color: GOLD, cursor: 'pointer', fontSize: '.7rem', fontFamily: 'var(--font-body)', textDecoration: 'underline' }}>
              Limpiar
            </button>
          )}
        </p>
      </div>

      {/* ── Cards — centered, max 4 per row on desktop ── */}
      <div style={{ padding: '0 clamp(1rem,3vw,2.5rem) 5rem', maxWidth: '1320px', margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.3rem', color: 'rgba(255,255,255,.35)', padding: '4rem 0' }}>
            Sin resultados para esos filtros.
          </p>
        ) : (
          /* Flexbox centers items when fewer than 4 fill a row */
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', justifyContent: 'center' }}>
            {filtered.map(pro => (
              <div key={pro.slug} style={{ flex: '1 1 260px', maxWidth: '320px', minWidth: '260px' }}>
                <ProCard pro={pro} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Professional card — always fully expanded ── */
function ProCard({ pro }: { pro: Professional }) {
  const navigate = useNavigate()
  const city = pro.location.split(',')[0].trim()
  const cat  = pro.category ?? 'otro'
  const bg   = pro.heroPhoto ?? pro.photos?.[0] ?? null

  return (
    <div
      onClick={() => navigate(`/${pro.slug}`)}
      style={{ position: 'relative', overflow: 'hidden', background: '#1a1815', minHeight: '360px', height: '100%', cursor: 'pointer' }}
      onMouseEnter={e => { const img = e.currentTarget.querySelector('.card-img') as HTMLElement; if (img) img.style.transform = 'scale(1.04)' }}
      onMouseLeave={e => { const img = e.currentTarget.querySelector('.card-img') as HTMLElement; if (img) img.style.transform = 'scale(1)' }}
    >
      {/* Background image */}
      {bg && (
        <div className="card-img" style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center top', transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)' }} />
      )}

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.90) 0%, rgba(0,0,0,.45) 55%, rgba(0,0,0,.2) 100%)' }} />

      {/* Gold top line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: GOLD }} />

      {/* Content */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(1rem,3vw,1.75rem) clamp(.9rem,2.5vw,1.5rem)' }}>
        {/* Category badge */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: '#000', background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(4px)', padding: '.2rem .55rem', marginBottom: '.55rem', fontWeight:'500'}}>
          {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
        </span>

        {/* Name */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 400, color: '#ffffff', lineHeight: 1.1, marginBottom: '.35rem', textShadow: '0 1px 10px rgba(0,0,0,.9)' }}>
          {pro.name}
        </h2>

        {/* Title */}
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.2rem', color: 'rgba(255,255,255,.78)', marginBottom: '.3rem' }}>
          {pro.title}
        </p>

        {/* City */}
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,.75)', marginBottom: '1.1rem' }}>
          📍 {city}
        </p>

        {/* CTA */}
        <button
          onClick={e => { e.stopPropagation(); navigate(`/${pro.slug}`) }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.6rem 1.4rem', background: GOLD, color: '#0a0907', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'background .2s' }}
          onMouseEnter={e => (e.currentTarget.style.background = GOLD_L)}
          onMouseLeave={e => (e.currentTarget.style.background = GOLD)}
        >
          Visitar Perfil
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M6.5 1l3 3L6.5 7M1 4h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </button>
      </div>
    </div>
  )
}
