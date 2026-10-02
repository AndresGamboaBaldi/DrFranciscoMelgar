import { useState, useEffect, useRef, useCallback } from 'react'
import { QrCode, Upload, Trash2 } from 'lucide-react'
import { getScheduleSettings, uploadQrImage, savePaymentSettings } from '../../lib/supabase'
import { btnFantasma } from '../../lib/panelUI'
import type { Professional } from '../../types/professional'

export default function TabConfig({ pro }: { pro: Professional }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  // Se conservan tal cual al guardar: el upsert de admin-write escribe las tres
  // columnas juntas, así que si no los mandamos se borra el cobro anticipado.
  const [requierePago, setRequierePago] = useState(false)
  const [porcentaje, setPorcentaje] = useState(50)

  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const archivoRef = useRef<HTMLInputElement | null>(null)

  const cargar = useCallback(async () => {
    const cfg = await getScheduleSettings(pro.businessId)
    setQrUrl(cfg?.qr_image_url ?? null)
    setRequierePago(!!cfg?.require_payment)
    setPorcentaje(cfg?.payment_percentage ?? 50)
    setCargando(false)
  }, [pro.businessId])

  useEffect(() => { cargar() }, [cargar])

  const elegirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('El archivo tiene que ser una imagen'); return }
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no puede pesar más de 5 MB'); return }

    setSubiendo(true)
    setError('')
    try {
      const url = await uploadQrImage(pro.businessId, file)
      await savePaymentSettings(pro.businessId, requierePago, porcentaje, url)
      // El ?t= fuerza a recargar: la ruta en storage es siempre la misma
      setQrUrl(`${url}?t=${Date.now()}`)
    } catch {
      setError('No se pudo subir la imagen. Revisá la conexión e intentá de nuevo.')
    } finally {
      setSubiendo(false)
      if (archivoRef.current) archivoRef.current.value = ''
    }
  }

  const quitar = async () => {
    setSubiendo(true)
    setError('')
    try {
      await savePaymentSettings(pro.businessId, requierePago, porcentaje, null)
      setQrUrl(null)
    } catch {
      setError('No se pudo quitar el QR.')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.5vw,2.5rem)', fontWeight: 400, letterSpacing: '-.02em', color: 'var(--color-ink)' }}>
          Configuración
        </h2>
      </div>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '.5rem', marginBottom: '.6rem' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '.64rem', fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>
            QR de cobro
          </span>
        </div>

        <p style={{ fontSize: '.85rem', color: 'var(--color-ink-dim)', lineHeight: 1.6, marginBottom: '1rem' }}>
          Es el que se le muestra al cliente cuando paga por QR en el mostrador.
          {requierePago && ' También es el que ven los clientes al reservar con pago anticipado.'}
        </p>

        <input ref={archivoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={elegirArchivo} />

        {cargando ? (
          <div className="skeleton" style={{ height: '9rem' }} />
        ) : qrUrl ? (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <img src={qrUrl} alt="QR de cobro" style={{
              width: '9rem', height: '9rem', objectFit: 'contain',
              border: '1px solid var(--color-rim)', borderRadius: 'var(--r-md)',
              background: '#fff', padding: '.5rem', flexShrink: 0,
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', minWidth: '11rem', flex: 1 }}>
              <button onClick={() => archivoRef.current?.click()} disabled={subiendo} style={btnFantasma('md')}>
                <Upload size={13} /> {subiendo ? 'Subiendo…' : 'Cambiar imagen'}
              </button>
              <button onClick={quitar} disabled={subiendo} style={{ ...btnFantasma('md'), color: '#c47070', borderColor: 'var(--color-rim-l)' }}>
                <Trash2 size={13} /> Quitar
              </button>
              <p style={{ fontSize: '.75rem', color: 'var(--color-ink-ghost)', lineHeight: 1.5 }}>
                Usá una captura nítida del QR de tu billetera. Al mostrarlo, subí el brillo de la pantalla.
              </p>
            </div>
          </div>
        ) : (
          <button onClick={() => archivoRef.current?.click()} disabled={subiendo}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '.75rem', width: '100%', padding: '2.5rem 1.5rem',
              border: '1px dashed var(--color-rim-l)', borderRadius: 'var(--r-lg)',
              background: 'transparent', cursor: 'pointer', color: 'var(--color-ink-ghost)',
              fontFamily: 'var(--font-body)', transition: 'border-color .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-gold)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-rim-l)' }}
          >
            <QrCode size={30} color="var(--color-gold)" />
            <span style={{ fontSize: '.78rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>
              {subiendo ? 'Subiendo…' : 'Subir imagen del QR'}
            </span>
          </button>
        )}

        {error && (
          <p role="alert" style={{ fontSize: '.78rem', color: '#c47070', marginTop: '.75rem' }}>{error}</p>
        )}
      </section>
    </div>
  )
}
