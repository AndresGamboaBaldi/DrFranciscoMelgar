import { useProfessional } from '../context/ProfessionalContext'

export default function Footer() {
  const pro = useProfessional()
  const parts = pro.shortName.split(' ')
  const first = parts.slice(0, -1).join(' ')
  const last  = parts[parts.length - 1]

  return (
    <footer id="contacto" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-rim)' }}>
      <div style={{ padding: '5rem 4.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '3.5rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 400, color: 'var(--color-ink)', marginBottom: '1rem' }}>
            {first} <span style={{ color: 'var(--color-gold)' }}>{last}</span>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '.95rem', color: 'var(--color-ink-dim)', lineHeight: 1.65, marginBottom: '1.75rem' }}>{pro.title}</p>
          <div style={{ display: 'flex', gap: '.6rem' }}>
            {[['ig','Instagram'],['wa','WhatsApp'],['fb','Facebook']].map(([l,title]) => (
              <a key={l} href="#" title={title} style={{ width: '1.9rem', height: '1.9rem', border: '1px solid var(--color-rim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-ghost)', fontSize: '.72rem', textDecoration: 'none', transition: 'all .3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-gold)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-rim)'; e.currentTarget.style.color = 'var(--color-ink-ghost)' }}
              >{l}</a>
            ))}
          </div>
        </div>
        <div>
          <h5 style={{ fontSize: '.62rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '1.5rem' }}>Servicios</h5>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {pro.services.map(s => (
              <li key={s.id}><a href="#servicios" style={{ fontSize: '.83rem', color: 'var(--color-ink-dim)', textDecoration: 'none', transition: 'color .3s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-dim)')}>{s.name}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h5 style={{ fontSize: '.62rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '1.5rem' }}>Información</h5>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {[['Sobre Nosotros','#nosotros'],['Clientes','#testimonios'],['Reservar Cita','#citas']].map(([l,h]) => (
              <li key={l}><a href={h} style={{ fontSize: '.83rem', color: 'var(--color-ink-dim)', textDecoration: 'none', transition: 'color .3s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-dim)')}>{l}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h5 style={{ fontSize: '.62rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '1.5rem' }}>Contacto</h5>
          <div style={{ fontSize: '.83rem', color: 'var(--color-ink-dim)', lineHeight: 1.9 }}>
            <p style={{ whiteSpace: 'pre-line' }}>{pro.address}</p><br />
            <a href={`tel:+${pro.phone}`} style={{ display: 'block', color: 'var(--color-ink-dim)', textDecoration: 'none', transition: 'color .3s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-dim)')}>+{pro.phone}</a>
            <a href={`mailto:${pro.email}`} style={{ display: 'block', color: 'var(--color-ink-dim)', textDecoration: 'none', transition: 'color .3s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-dim)')}>{pro.email}</a><br />
            {pro.schedule.map(s => <p key={s}>{s}</p>)}
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--color-rim)', padding: '1.5rem 4.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem' }}>
        <p style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)' }}>© 2026 {pro.name}. Todos los derechos reservados.</p>
        <p style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)' }}>{pro.location}</p>
      </div>
    </footer>
  )
}
