import { useEffect, type CSSProperties } from 'react'
import { HomeSEOHead } from '../components/SEOHead'
import Reveal from '../components/Reveal'
import { Bell, CalendarDays, MessageCircle, Palette } from 'lucide-react'

const GOLD   = '#c4995a'
const GOLD_L = '#d4b078'

// TODO: reemplaza por el número real de WhatsApp de ventas (formato 591XXXXXXXX)
const SALES_WHATSAPP = '59172235605'
const waLink = (msg: string) => `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(msg)}`

const FEATURES = [
  {
    icon: Bell,
    title: 'Notificaciones al instante',
    desc: 'Recibe un aviso push apenas alguien reserva — directo en tu celular, sin instalar nada.',
  },
  {
    icon: CalendarDays,
    title: 'Sincroniza tu calendario',
    desc: 'Cada cita aparece automáticamente en tu Google Calendar, Apple Calendar u Outlook.',
  },
  {
    icon: MessageCircle,
    title: 'Confirmación por WhatsApp',
    desc: 'Con un clic mandas un recordatorio formateado y profesional a tus clientes.',
  },
  {
    icon: Palette,
    title: 'Tu página, tu marca',
    desc: 'Diseño elegante con tus colores, fotos, servicios y horarios — lista para compartir.',
  },
]

const PLANS = [
  {
    name: 'Pro',
    price: 'Bs 149',
    period: '/mes',
    tag: 'Más popular',
    desc: 'Ideal para empezar a recibir reservas online.',
    items: [
      'Página propia personalizada',
      'Reservas online ilimitadas',
      'Notificaciones push',
      'Sincronización con calendario',
    ],
  },
  {
    name: 'Agencia',
    price: 'Bs 399',
    period: '/mes',
    tag: null,
    desc: 'Para negocios con varios profesionales o sucursales.',
    items: [
      'Todo lo del plan Pro',
      'Múltiples profesionales / staff',
      'Agenda individual por persona',
      'Asesoría de configuración incluida',
    ],
  },
]

export default function Home() {
  useEffect(() => {
    const id = 'gf-home-bebas-inter'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id   = id
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;1,400&display=swap'
    document.head.appendChild(link)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0907', color: '#ede8df', overflowX: 'hidden', '--font-display': "'Bebas Neue', serif", '--font-body': "'Inter', sans-serif" } as CSSProperties}>
      <HomeSEOHead />

      {/* ── Hero ── */}
      <section style={{ position: 'relative', minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6rem 1.5rem', overflow: 'hidden' }}>

        {/* Decorative glow */}
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '60rem', height: '60rem', background: `radial-gradient(circle, ${GOLD}22 0%, transparent 65%)`, pointerEvents: 'none' }} />


        <h1 className="animate-fade-up" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem,9vw,6.5rem)', fontWeight: 300, color: '#fff', letterSpacing: '-.02em', lineHeight: 1.05, marginBottom: '1.25rem', position: 'relative', animationDelay: '.1s' }}>
          Tu propia página de<br />
         <em style={{ color: GOLD }}>reservas online,</em> lista en minutos
        </h1>

        <p className="animate-fade-up" style={{ fontSize: 'clamp(1rem,2.2vw,1.25rem)', color: 'rgba(255,255,255,.72)', maxWidth: '48rem', margin: '0 auto 2.5rem', lineHeight: 1.7, position: 'relative', animationDelay: '.2s' }}>
          Diseñada para profesionales independientes que valoran la excelencia. Automatiza tu agenda y adquiere una elegante página para mostrar tus servicios
        </p>

        <div className="animate-fade-up" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', position: 'relative', animationDelay: '.3s' }}>
          <a href={waLink('Hola! Quiero crear mi página en Probo.pro 🙌')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '1rem 2.25rem', background: GOLD, color: '#0a0907', fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background .25s' }}
            onMouseEnter={e => (e.currentTarget.style.background = GOLD_L)}
            onMouseLeave={e => (e.currentTarget.style.background = GOLD)}
          >
            Quiero mi página
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M7.5 1l4 4-4 4M1 5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </a>
          <a href="#planes"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '1rem 2.25rem', background: 'rgba(255,255,255,.06)', color: '#fff', border: '1px solid rgba(255,255,255,.25)', fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', textDecoration: 'none', transition: 'all .25s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = 'rgba(255,255,255,.1)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.25)'; e.currentTarget.style.background = 'rgba(255,255,255,.06)' }}
          >
            Ver planes
          </a>
        </div>

        {/* Scroll cue */}
        <div className="animate-scroll-bob" style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', width: 1, height: '3rem', background: 'rgba(255,255,255,.3)' }} />
      </section>

      {/* ── Beneficios ── */}
      <section className="s-pad" style={{ maxWidth: '1320px', margin: '0 auto' }}>
        <Reveal as="div" className="s-header" style={undefined as never}>
          <div>
            <p style={{ fontSize: '1rem', letterSpacing: '.3em', textTransform: 'uppercase', color: GOLD, marginBottom: '.75rem' }}>Beneficios diseñados para la excelencia</p>
            <h2 className="s-title">Herramientas de <em style={{ color: GOLD }}>élite</em></h2>
          </div>
        </Reveal>

        <div className="benefit-bento">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 80} as="div" className={`benefit-card benefit-card-${i + 1}`} style={undefined as never}>
              <span className="benefit-card-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="benefit-card-icon" style={{ color: GOLD, marginBottom: '1rem' }}><f.icon size={28} strokeWidth={1.5} /></div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: '#fff', fontWeight: 400, marginBottom: '.6rem' }}>{f.title}</h3>
              <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.7 }}>{f.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ── Cómo funciona ── */}
      <section className="s-pad" style={{ maxWidth: '1320px', margin: '0 auto' }}>
        <Reveal as="div" style={{ textAlign: 'center', marginBottom: '4rem' } as never}>
          <h2 className="s-title">Tres pasos. <em style={{ color: GOLD }}>Cero complicaciones.</em></h2>
          <p style={{ fontSize: '1rem', letterSpacing: '.2em', textTransform: 'uppercase', color: GOLD, marginTop: '.75rem' }}>Cómo funciona</p>
        </Reveal>

        <div style={{ position: 'relative' }}>
          {/* Vertical timeline line */}
          <div className="timeline-line" style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'rgba(255,255,255,.12)', transform: 'translateX(-50%)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
            {[
              { n: '01', title: 'Cuéntanos de tu negocio', desc: 'Nos compartes tus servicios, horarios y fotos — nosotros armamos tu página.', image: '/steps/step1.png' },
              { n: '02', title: 'Recibe tu link', desc: 'Tu página queda lista con tu marca, lista para compartir en redes y WhatsApp.', image: '/steps/step2.png' },
              { n: '03', title: 'Empieza a recibir citas', desc: 'Tus clientes reservan solos y tú administras todo desde tu celular.', image: '/steps/step3.png' },
            ].map((s, i) => {
              const reverse = i % 2 === 1
              return (
                <Reveal key={s.n} delay={i * 100} as="div" style={undefined as never}>
                  <div className="timeline-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: '2.5rem', position: 'relative' }}>

                    {/* Text */}
                    <div style={{ order: reverse ? 2 : 1, textAlign: reverse ? 'left' : 'right' }} className="timeline-text">
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: '6rem', color: 'rgba(255,255,255,.14)', fontWeight: 600, lineHeight: 1, marginBottom: '.5rem' }}>{s.n}</p>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', color: '#fff', fontWeight: 400, marginBottom: '.6rem' }}>{s.title}</h3>
                      <p style={{ fontSize: '1.1rem', color: GOLD, lineHeight: 1.7 }}>{s.desc}</p>
                    </div>

                    {/* Center dot */}
                    <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '.6rem', height: '.6rem', borderRadius: '50%', background: GOLD, zIndex: 2 }} className="timeline-dot" />

                    {/* Visual placeholder */}
                    <div style={{ order: reverse ? 1 : 2 }} className="timeline-visual">
                      <div style={{ background: '#f4f1ea', borderRadius: '12px', minHeight: '12rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img
                          src={s.image}
                          alt={s.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={e => {
                            const el = e.currentTarget
                            el.style.display = 'none'
                            const sib = el.nextElementSibling as HTMLElement | null
                            if (sib) sib.style.display = 'flex'
                          }}
                        />
                        <span style={{ display: 'none', fontSize: '.8rem', color: '#9a9488', letterSpacing: '.1em', textTransform: 'uppercase', padding: '4rem' }}>Vista previa</span>
                      </div>
                    </div>

                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── Planes ── */}
      <section id="planes" className="s-pad" style={{ maxWidth: '1320px', margin: '0 auto' }}>
        <Reveal as="div" style={{ textAlign: 'center', marginBottom: '4rem' } as never}>
          <h2 className="s-title">Inversion <em style={{ color: GOLD }}>en tu marca</em></h2>
          <p style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,.6)', maxWidth: '28rem', margin: '1rem auto 0', lineHeight: 1.7 }}>
            Precios transparentes diseñados para crecer contigo.
          </p>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 80} as="div" style={undefined as never}>
              <div style={{
                position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
                padding: '2.5rem 2rem', background: plan.tag ? 'linear-gradient(160deg, #1d1813, #0e0c0a)' : '#0e0c0a',
                border: `1px solid ${plan.tag ? GOLD : 'rgba(255,255,255,.1)'}`,
              }}>
                {plan.tag && (
                  <span style={{ position: 'absolute', top: '-.7rem', left: '2rem', background: GOLD, color: '#0a0907', fontSize: '.8rem', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', padding: '.3rem .75rem' }}>
                    {plan.tag}
                  </span>
                )}
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#fff', fontWeight: 400, marginBottom: '.4rem' }}>{plan.name}</h3>
                <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,.55)', marginBottom: '1.5rem', lineHeight: 1.6, minHeight: '2.6rem' }}>{plan.desc}</p>
                <p style={{ marginBottom: '1.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: GOLD, fontWeight: 400 }}>{plan.price}</span>
                  <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,.5)' }}>{plan.period}</span>
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.75rem', marginBottom: '2.25rem', flex: 1 }}>
                  {plan.items.map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '.6rem', fontSize: '1.1rem', color: 'rgba(255,255,255,.78)' }}>
                      <span style={{ color: GOLD, flexShrink: 0, marginTop: '.15rem' }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a href={waLink(`Hola! Me interesa el plan ${plan.name} de Probo.pro`)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
                    padding: '.9rem 1.5rem', textAlign: 'center',
                    background: plan.tag ? GOLD : 'transparent', color: plan.tag ? '#0a0907' : '#fff',
                    border: plan.tag ? 'none' : '1px solid rgba(255,255,255,.25)',
                    fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase',
                    textDecoration: 'none', transition: 'all .25s',
                  }}
                  onMouseEnter={e => { if (plan.tag) e.currentTarget.style.background = GOLD_L; else { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD } }}
                  onMouseLeave={e => { if (plan.tag) e.currentTarget.style.background = GOLD; else { e.currentTarget.style.borderColor = 'rgba(255,255,255,.25)'; e.currentTarget.style.color = '#fff' } }}
                >
                  Empezar
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="s-pad" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: '-30%', left: '50%', transform: 'translateX(-50%)', width: '50rem', height: '50rem', background: `radial-gradient(circle, ${GOLD}1a 0%, transparent 65%)`, pointerEvents: 'none' }} />
        <Reveal as="div" style={{ position: 'relative' } as never}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,6vw,4rem)', fontWeight: 300, color: '#fff', marginBottom: '1.25rem' }}>
            ¿Listo elevar tu estándar?
          </h2>
          <p style={{ fontSize: '1.3rem', color: 'rgba(255,255,255,.65)', maxWidth: '30rem', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Hablemos hoy mismo sobre como podemos automatizar tu negocio — sin compromiso.
          </p>
          <a href={waLink('Hola! Quiero crear mi página en Probo.pro 🙌')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '1.1rem 2.5rem', background: GOLD, color: '#0a0907', fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background .25s' }}
            onMouseEnter={e => (e.currentTarget.style.background = GOLD_L)}
            onMouseLeave={e => (e.currentTarget.style.background = GOLD)}
          >
            Hablar por WhatsApp
          </a>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer style={{ textAlign: 'center', padding: '2.5rem 1.5rem', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: '#fff', marginBottom: '.5rem' }}>
          Pro<em style={{ fontStyle: 'italic', color: GOLD }}>bo</em>.pro
        </p>
        <p style={{ fontSize: '.9rem', color: 'rgba(255,255,255,.4)' }}>© {new Date().getFullYear()} Probo.pro — Reservas online para profesionales en Bolivia</p>
      </footer>
    </div>
  )
}

