import { useEffect, useState } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'Servicios',    href: '#servicios' },
    { label: 'Nosotros',     href: '#nosotros'  },
    { label: 'Pacientes',    href: '#testimonios' },
    { label: 'Contacto',     href: '#contacto'  },
  ]

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: scrolled ? '1rem 4.5rem' : '1.75rem 4.5rem',
        background: scrolled ? 'rgba(10,9,7,.93)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--color-rim)' : 'transparent'}`,
        transition: 'all .5s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Logo */}
      <a href="#inicio" style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', letterSpacing: '.06em', color: 'var(--color-ink)', textDecoration: 'none' }}>
        Dr. Melgar{' '}
        <span style={{ color: 'var(--color-gold)' }}>Baldi</span>
      </a>

      {/* Desktop links */}
      <ul style={{ display: 'flex', gap: '2.5rem', listStyle: 'none' }} className="hidden md:flex">
        {links.map(l => (
          <li key={l.href}>
            <a
              href={l.href}
              style={{ fontSize: '.72rem', fontWeight: 300, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-ink-dim)', textDecoration: 'none', transition: 'color .3s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-dim)')}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <a
        href="#citas"
        className="hidden md:inline-flex"
        style={{ fontSize: '.72rem', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-bg)', background: 'var(--color-gold)', padding: '.6rem 1.6rem', textDecoration: 'none', transition: 'background .3s' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-gold-l)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-gold)')}
      >
        Reservar Cita
      </a>

      {/* Mobile burger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex md:hidden flex-col gap-[5px] cursor-pointer bg-transparent border-none p-1"
        aria-label="Menú"
      >
        {[0,1,2].map(i => (
          <span key={i} style={{ display: 'block', width: 22, height: 1, background: 'var(--color-ink-dim)', transition: '.3s' }} />
        ))}
      </button>

      {/* Mobile menu */}
      {open && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: 'rgba(10,9,7,.97)', backdropFilter: 'blur(14px)',
            borderBottom: '1px solid var(--color-rim)',
            padding: '1.5rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
          }}
        >
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              style={{ fontSize: '.8rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--color-ink-dim)', textDecoration: 'none' }}>
              {l.label}
            </a>
          ))}
          <a href="#citas" onClick={() => setOpen(false)}
            style={{ fontSize: '.8rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-bg)', background: 'var(--color-gold)', padding: '.65rem 1.5rem', textDecoration: 'none', textAlign: 'center' }}>
            Reservar Cita
          </a>
        </div>
      )}
    </nav>
  )
}
