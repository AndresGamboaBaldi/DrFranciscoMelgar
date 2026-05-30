import Reveal from './Reveal'

const TESTIMONIALS = [
  { init: 'S', name: 'Sofía Martínez',  detail: 'Ácido Hialurónico · Bogotá',   text: '"Llevaba años con inseguridades sobre mis ojeras y líneas de expresión. La Dr. Melgar me escuchó con calma y el resultado fue completamente natural. ¡Me encantó cada detalle!"' },
  { init: 'C', name: 'Catalina Herrera',detail: 'Radiofrecuencia · Medellín',    text: '"Después de mi primera sesión de radiofrecuencia, noté la piel más firme y luminosa de inmediato. El consultorio es impecable y la atención es de primer nivel absoluto."' },
  { init: 'V', name: 'Valentina Cruz',  detail: 'Diseño de Labios · Bogotá',    text: `"Siempre tuve miedo de quedar 'rara'. El Dr. Melgar tiene un ojo artístico increíble. Mi diseño de labios quedó perfecto: natural, armonioso y exactamente como lo soñé."` },
]

export default function Testimonials() {
  return (
    <section id="testimonios" style={{ padding: '8rem 4.5rem', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <Reveal><p style={{ fontSize: '.62rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--color-gold)', opacity: .7, marginBottom: '.7rem' }}>04 — Pacientes</p></Reveal>
          <Reveal delay={100}><h2 style={{ fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 300, letterSpacing: '-.02em', lineHeight: 1 }}>Lo que dicen<br /><em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>nuestras pacientes</em></h2></Reveal>
        </div>
        <Reveal delay={200}>
          <p style={{ maxWidth: '28rem', fontSize: '.88rem', lineHeight: 1.9, color: 'var(--color-ink-dim)', fontWeight: 300 }}>
            Más de 3.000 pacientes han confiado en nuestra experiencia. Sus resultados son nuestra mayor satisfacción.
          </p>
        </Reveal>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '4.5rem' }}>
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 100}>
            <div style={{ padding: '2.25rem 2rem', background: 'var(--color-surface)', border: '1px solid var(--color-rim)', position: 'relative' }}>
              {/* Decorative quote */}
              <div style={{ position: 'absolute', top: '-.4rem', left: '1.5rem', fontFamily: 'var(--font-display)', fontSize: '5.5rem', color: 'var(--color-gold)', opacity: .12, lineHeight: 1, pointerEvents: 'none' }}>"</div>

              {/* Stars */}
              <div style={{ display: 'flex', gap: '.2rem', marginBottom: '1rem' }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: 'var(--color-gold)', fontSize: '.73rem' }}>★</span>)}
              </div>

              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.05rem', fontWeight: 300, lineHeight: 1.75, color: 'var(--color-ink)', marginBottom: '1.75rem', position: 'relative', zIndex: 1 }}>
                {t.text}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
                <div style={{ width: '2.4rem', height: '2.4rem', borderRadius: '50%', background: 'var(--color-surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--color-gold)' }}>
                  {t.init}
                </div>
                <div>
                  <div style={{ fontSize: '.82rem', color: 'var(--color-ink)', fontWeight: 400, marginBottom: '.1rem' }}>{t.name}</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--color-ink-ghost)', letterSpacing: '.04em' }}>{t.detail}</div>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
