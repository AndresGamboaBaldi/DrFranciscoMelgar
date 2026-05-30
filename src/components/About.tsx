import Reveal from './Reveal'
import { useProfessional } from '../context/ProfessionalContext'

export default function About() {
  const pro = useProfessional()
  return (
    <section id="nosotros" style={{ padding: '8rem 4.5rem', position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '6rem', alignItems: 'center' }}>

        <Reveal>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '100%', paddingBottom: '118%', background: 'var(--color-surface2)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(140deg, transparent 55%, rgba(196,153,90,.09))' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '.75rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-ink-ghost)', opacity: .4 }}>◇</span>
                <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '.95rem', color: 'var(--color-ink-ghost)', opacity: .5 }}>Foto</span>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: '-1.75rem', right: '-1.75rem', width: '9rem', height: '9rem', border: '1px solid var(--color-rim)', zIndex: -1 }} />
            <div style={{ position: 'absolute', top: '-1.25rem', left: '-1.25rem', width: '5rem', height: '5rem', background: 'var(--color-gold)', opacity: .07, zIndex: -1 }} />
            <div style={{ position: 'absolute', bottom: '2.5rem', right: '-3rem', background: 'var(--color-bg)', border: '1px solid var(--color-rim-l)', padding: '1.25rem 1.75rem', zIndex: 2 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.75rem', fontWeight: 300, color: 'var(--color-gold)', lineHeight: 1, marginBottom: '.2rem' }}>{pro.stats[0]?.n}</div>
              <div style={{ fontSize: '.65rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>{pro.stats[0]?.label}</div>
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal><p style={{ fontSize: '.62rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--color-gold)', opacity: .7, marginBottom: '.7rem' }}>02 — La Especialista</p></Reveal>
          <Reveal delay={100}><h2 style={{ fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 300, letterSpacing: '-.02em', lineHeight: 1, marginBottom: '2rem' }}>Acerca de<br /><em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>{pro.aboutTitle}</em></h2></Reveal>
          <Reveal delay={200}><p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1.3rem,2.2vw,1.75rem)', fontWeight: 300, lineHeight: 1.55, color: 'var(--color-ink)', marginBottom: '1.75rem' }}>"{pro.quote}"</p></Reveal>
          <Reveal delay={300}><p style={{ fontSize: '.87rem', lineHeight: 1.95, color: 'var(--color-ink-dim)', marginBottom: '2.25rem' }}>{pro.bio}</p></Reveal>
          <Reveal delay={400}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--color-rim)', marginBottom: '2.5rem' }}>
              {pro.credentials.map(c => (
                <div key={c.label} style={{ background: 'var(--color-bg)', padding: '1.1rem 1.5rem' }}>
                  <div style={{ fontSize: '.62rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.35rem' }}>{c.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '.92rem', color: 'var(--color-ink)' }}>{c.value}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={500}>
            <a href="#citas" style={{ display: 'inline-flex', alignItems: 'center', gap: '.7rem', padding: '.85rem 2rem', background: 'var(--color-gold)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background .3s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-gold-l)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-gold)')}
            >Agendar Consulta <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M7.5 1l3.5 3.5L7.5 8M1 4.5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg></a>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
