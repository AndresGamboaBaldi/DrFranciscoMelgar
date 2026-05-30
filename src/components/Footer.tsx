const SERVICES = ['Toxina Botulínica','Ácido Hialurónico','Colágeno & PRP','Peeling Médico','Radiofrecuencia','Diseño de Labios']
const CLINIC   = [{ l: 'Sobre Nosotros', h: '#nosotros' },{ l: 'Pacientes', h: '#testimonios' },{ l: 'Reservar Cita', h: '#citas' },{ l: 'Blog & Consejos', h: '#' },{ l: 'Política de Privacidad', h: '#' }]
const SOCIAL   = [{ l: 'ig', title: 'Instagram' },{ l: 'wa', title: 'WhatsApp' },{ l: 'fb', title: 'Facebook' },{ l: 'tt', title: 'TikTok' }]

export default function Footer() {
  return (
    <footer id="contacto" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-rim)' }}>
      <div style={{ padding: '5rem 4.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '3.5rem' }}>

        {/* Brand */}
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 400, color: 'var(--color-ink)', marginBottom: '1rem' }}>
            Dr. Melgar <span style={{ color: 'var(--color-gold)' }}>Baldi</span>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '.95rem', color: 'var(--color-ink-dim)', lineHeight: 1.65, marginBottom: '1.75rem' }}>
            "La precisión médica al servicio<br />de tu belleza natural."
          </p>
          <div style={{ display: 'flex', gap: '.6rem' }}>
            {SOCIAL.map(s => (
              <a key={s.l} href="#" title={s.title}
                style={{ width: '1.9rem', height: '1.9rem', border: '1px solid var(--color-rim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-ghost)', fontSize: '.72rem', textDecoration: 'none', transition: 'all .3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-gold)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-rim)'; e.currentTarget.style.color = 'var(--color-ink-ghost)' }}
              >{s.l}</a>
            ))}
          </div>
        </div>

        {/* Services */}
        <div>
          <h5 style={{ fontSize: '.62rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '1.5rem' }}>Servicios</h5>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {SERVICES.map(s => (
              <li key={s}><a href="#servicios" style={{ fontSize: '.83rem', color: 'var(--color-ink-dim)', textDecoration: 'none', transition: 'color .3s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-dim)')}>{s}</a></li>
            ))}
          </ul>
        </div>

        {/* Clinic */}
        <div>
          <h5 style={{ fontSize: '.62rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '1.5rem' }}>Clínica</h5>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {CLINIC.map(c => (
              <li key={c.l}><a href={c.h} style={{ fontSize: '.83rem', color: 'var(--color-ink-dim)', textDecoration: 'none', transition: 'color .3s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-dim)')}>{c.l}</a></li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h5 style={{ fontSize: '.62rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '1.5rem' }}>Contacto</h5>
          <div style={{ fontSize: '.83rem', color: 'var(--color-ink-dim)', lineHeight: 1.9 }}>
            <p>Cl. 93 #15-36, Of. 502<br />Bogotá, Colombia</p>
            <br />
            <a href="tel:+573001234567" style={{ display: 'block', color: 'var(--color-ink-dim)', textDecoration: 'none', transition: 'color .3s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-dim)')}>+57 300 123 4567</a>
            <a href="mailto:citas@dravr.com" style={{ display: 'block', color: 'var(--color-ink-dim)', textDecoration: 'none', transition: 'color .3s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-dim)')}>citas@dravr.com</a>
            <br />
            <p>Lun — Vie: 8:00 — 18:00<br />Sábados: 9:00 — 14:00</p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid var(--color-rim)', padding: '1.5rem 4.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem' }}>
        <p style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)' }}>© 2026 Dr. Francisco Melgar Baldi · Medicina Estética. Todos los derechos reservados.</p>
        <p style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)' }}>Bogotá, Colombia</p>
      </div>
    </footer>
  )
}
