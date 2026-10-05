import { useState, useEffect, useCallback, type CSSProperties } from 'react'
import { UserPlus, X, KeyRound, CircleUser, TriangleAlert, Check } from 'lucide-react'
import type { Professional } from '../../types/professional'
import { emailAUsuario, normalizarUsuario, usuarioAEmail, type PosUsuario, type PosRol } from '../../lib/pos/auth'
import {
  getUsuarios, crearUsuario, cambiarClave, cambiarRol, cambiarEstado,
  ROLES, ErrorUsuarios, type UsuarioCaja,
} from '../../lib/pos/usuarios'
import { btnPrimario, btnSecundario, chip } from '../../lib/panelUI'

const ROJO = '#c47070'

export default function SeccionEquipo({ pro, usuario }: { pro: Professional; usuario: PosUsuario }) {
  const [lista, setLista] = useState<UsuarioCaja[]>([])
  const [cargando, setCargando] = useState(true)
  const [fallo, setFallo] = useState<string | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const [clavePara, setClavePara] = useState<UsuarioCaja | null>(null)
  /** user_id de la fila que está guardando un cambio, o null. */
  const [ocupado, setOcupado] = useState<string | null>(null)

  // Devuelve la lista además de guardarla: el alta necesita comprobar que la
  // cuenta nueva volvió de verdad, no solo que el alta no tiró error.
  const cargar = useCallback(async (): Promise<UsuarioCaja[]> => {
    try {
      const l = await getUsuarios(pro.businessId)
      setLista(l)
      setFallo(null)
      return l
    } catch (e) {
      setFallo(e instanceof ErrorUsuarios ? e.message : 'No se pudo cargar el equipo')
      return []
    } finally {
      setCargando(false)
    }
  }, [pro.businessId])

  useEffect(() => { cargar() }, [cargar])

  // Último dueño activo: si se lo degrada o desactiva, la caja queda sin nadie
  // que pueda administrarla y hay que volver a tocar la base a mano.
  const duenosActivos = lista.filter(u => u.rol === 'dueno' && u.activo).length

  /**
   * Aplica un cambio de rol o de estado sobre una fila.
   *
   * No vuelve a pedir la lista entera: el listado pasa por la Edge Function y
   * tarda cerca de un segundo, mientras que la escritura va directo a la tabla.
   * Como `cambiarRol`/`cambiarEstado` fallan si la política rechaza el UPDATE,
   * que no tiren error ya significa que quedó guardado, y alcanza con parchear
   * la fila en memoria.
   */
  const aplicar = async (
    userId: string,
    fn: () => Promise<void>,
    cambios: Partial<UsuarioCaja>,
  ) => {
    setOcupado(userId)
    setFallo(null)
    try {
      await fn()
      setLista(prev => prev.map(u => (u.user_id === userId ? { ...u, ...cambios } : u)))
    } catch (e) {
      setFallo(e instanceof ErrorUsuarios ? e.message : 'No se pudo guardar el cambio')
    } finally {
      setOcupado(null)
    }
  }

  return (
    <section style={{ marginTop: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '.5rem', marginBottom: '.6rem' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '.64rem', fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>
          Equipo de la caja
        </span>
        {!cargando && (
          <span style={{ fontSize: '.68rem', color: 'var(--color-ink-ghost)' }}>
            {lista.length} {lista.length === 1 ? 'cuenta' : 'cuentas'}
          </span>
        )}
      </div>

      {cargando ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
          {[0, 1].map(i => <div key={i} className="skeleton" style={{ height: '4.5rem', animationDelay: `${i * 80}ms` }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
          {lista.map(u => {
            const soyYo = u.user_id === usuario.user_id
            // Nadie se bloquea a sí mismo, y el último dueño activo queda fijo.
            const ultimoDueno = u.rol === 'dueno' && u.activo && duenosActivos === 1
            const bloqueado = soyYo || ultimoDueno
            const guardando = ocupado === u.user_id

            return (
              // El skeleton va encima de la fila, que queda con visibility
              // hidden: así conserva su alto exacto y la lista no da un salto
              // al entrar y salir del estado de carga.
              <div key={u.user_id} style={{ position: 'relative' }}>
                {guardando && (
                  <div className="skeleton" aria-label="Guardando cambio" style={{
                    position: 'absolute', inset: 0, zIndex: 1, borderRadius: 'var(--r-lg)',
                  }} />
                )}
                <div style={{
                  background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
                  borderLeft: `3px solid ${u.activo ? 'var(--color-gold)' : 'var(--color-rim-l)'}`,
                  borderRadius: 'var(--r-lg)', padding: '.85rem 1rem',
                  opacity: u.activo ? 1 : .6,
                  visibility: guardando ? 'hidden' : 'visible',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.7rem' }}>
                    <CircleUser size={22} color={u.activo ? 'var(--color-gold)' : 'var(--color-ink-ghost)'} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '.1rem' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '.92rem', fontWeight: 600, color: 'var(--color-ink)' }}>{u.nombre}</span>
                        {soyYo && (
                          <span style={{ fontSize: '.58rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)', border: '1px solid var(--color-rim-l)', borderRadius: 'var(--r-sm)', padding: '.1rem .35rem' }}>
                            Vos
                          </span>
                        )}
                        {!u.activo && (
                          <span style={{ fontSize: '.58rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: ROJO }}>
                            Desactivada
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)', marginTop: '.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {emailAUsuario(u.email, pro.businessId) || 'sin usuario'}
                      </p>
                    </div>
                  </div>

                  {/* ── Rol ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.35rem', marginTop: '.7rem' }}>
                    {ROLES.map(r => (
                      <button
                        key={r.id}
                        onClick={() => !bloqueado && r.id !== u.rol &&
                          aplicar(u.user_id, () => cambiarRol(u.user_id, r.id as PosRol), { rol: r.id as PosRol })}
                        disabled={bloqueado || guardando}
                        title={bloqueado ? (soyYo ? 'No podés cambiar tu propio rol' : 'Tiene que quedar al menos un dueño activo') : undefined}
                        style={{
                          ...chip(r.id === u.rol), padding: '.45rem .3rem', fontSize: '.62rem',
                          letterSpacing: '.05em', opacity: bloqueado && r.id !== u.rol ? .4 : 1,
                          cursor: bloqueado ? 'not-allowed' : 'pointer',
                        }}
                      >{r.label}</button>
                    ))}
                  </div>

                  {/* ── Acciones ── */}
                  <div style={{ display: 'flex', gap: '.35rem', marginTop: '.35rem' }}>
                    <button onClick={() => setClavePara(u)} style={{ ...btnSecundario('sm'), flex: 1, padding: '.45rem .3rem', fontSize: '.6rem' }}>
                      <KeyRound size={12} /> Cambiar clave
                    </button>
                    <button
                      onClick={() => !bloqueado &&
                        aplicar(u.user_id, () => cambiarEstado(u.user_id, !u.activo), { activo: !u.activo })}
                      disabled={bloqueado || guardando}
                      title={bloqueado ? (soyYo ? 'No podés desactivar tu propia cuenta' : 'Tiene que quedar al menos un dueño activo') : undefined}
                      style={{
                        ...btnSecundario('sm'), flex: 1, padding: '.45rem .3rem', fontSize: '.6rem',
                        color: bloqueado ? 'var(--color-ink-ghost)' : u.activo ? ROJO : 'var(--color-gold)',
                        opacity: bloqueado ? .45 : 1, cursor: bloqueado ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {u.activo ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {fallo && (
        <div style={{
          display: 'flex', gap: '.5rem', marginTop: '.75rem', padding: '.7rem .8rem',
          background: 'var(--color-surface2)', border: `1px solid ${ROJO}`, borderRadius: 'var(--r-md)',
        }}>
          <TriangleAlert size={14} color={ROJO} style={{ flexShrink: 0, marginTop: '.1rem' }} />
          <p style={{ fontSize: '.74rem', color: 'var(--color-ink-dim)', lineHeight: 1.55 }}>{fallo}</p>
        </div>
      )}

      <button onClick={() => setNuevo(true)} style={{ ...btnPrimario('md'), width: '100%', marginTop: '.75rem' }}>
        <UserPlus size={15} /> Agregar cuenta
      </button>

      {nuevo && (
        <DialogoNuevo
          businessId={pro.businessId}
          onRefrescar={cargar}
          onCerrar={aviso => { setNuevo(false); if (aviso) setFallo(aviso) }}
        />
      )}

      {clavePara && (
        <DialogoClave
          businessId={pro.businessId}
          usuario={clavePara}
          onCerrar={() => setClavePara(null)}
        />
      )}
    </section>
  )
}

/* ── Alta de cuenta ───────────────────────────────────────── */

function DialogoNuevo({ businessId, onRefrescar, onCerrar }: {
  businessId: string
  /** Recarga la lista de atrás y la devuelve, para poder comprobarla. */
  onRefrescar: () => Promise<UsuarioCaja[]>
  /** El aviso, si lo hay, lo muestra la sección: el diálogo ya se cerró. */
  onCerrar: (aviso?: string) => void
}) {
  const [nombre, setNombre] = useState('')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<PosRol>('cajera')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !guardando) onCerrar() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onCerrar, guardando])

  // Se valida lo normalizado, no lo tipeado: «Caja 1» queda en «caja1», y
  // escribir solo espacios o acentos no puede dar por válido un usuario vacío.
  const usuarioLimpio = normalizarUsuario(usuario)
  const valido = nombre.trim().length > 0 && usuarioLimpio.length >= 3 && password.length >= 8

  const guardar = async () => {
    setGuardando(true); setError('')
    try {
      await crearUsuario({ businessId, nombre, usuario: usuarioLimpio, password, rol })

      // Primero refrescar, después cerrar: así el diálogo se va cuando la
      // cuenta nueva ya está en la lista, y no queda un parpadeo sin ella.
      const l = await onRefrescar()
      // Si el alta no tiró error pero la cuenta no vuelve en el listado, el
      // aviso viaja a la sección: acá no queda nadie para mostrarlo.
      const esperado = usuarioAEmail(usuarioLimpio, businessId)
      const falta = !l.some(u => u.email.toLowerCase() === esperado)
      onCerrar(falta
        ? 'La cuenta se creó, pero no vuelve en el listado. Recargá la página; si sigue sin aparecer, el problema está en la función pos-usuarios.'
        : undefined)
    } catch (e) {
      setError(e instanceof ErrorUsuarios ? e.message : 'No se pudo crear la cuenta')
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Agregar cuenta" onCerrar={() => onCerrar()}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <section>
          <Rotulo>Nombre</Rotulo>
          <input value={nombre} onChange={e => setNombre(e.target.value)} autoFocus
            placeholder="Cómo se la llama en el local" style={estiloInput} />
        </section>

        <section>
          <Rotulo extra={usuarioLimpio && usuarioLimpio !== usuario.trim().toLowerCase() ? `queda: ${usuarioLimpio}` : undefined}>
            Usuario
          </Rotulo>
          <input type="text" autoCapitalize="none" autoCorrect="off" spellCheck={false}
            value={usuario} onChange={e => setUsuario(e.target.value)}
            placeholder="cajera1" style={estiloInput} />
        </section>

        <section>
          <Rotulo extra="mínimo 8 caracteres">Clave</Rotulo>
          <input type="text" autoCapitalize="none" autoCorrect="off"
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="La que le vas a pasar" style={estiloInput} />
        </section>

        <section>
          <Rotulo>Permisos</Rotulo>
          {/* Mismos chips que en la lista: elegir el rol acá y cambiarlo
              después se ven igual. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.35rem' }}>
            {ROLES.map(r => (
              <button key={r.id} onClick={() => setRol(r.id as PosRol)}
                style={{ ...chip(r.id === rol), padding: '.6rem .3rem', fontSize: '.68rem' }}>
                {r.label}
              </button>
            ))}
          </div>
        </section>

        {error && <Alerta texto={error} />}
      </div>

      <div style={{ display: 'flex', gap: '.5rem', marginTop: '1.25rem' }}>
        {/* Envuelto: si no, el click le pasa el MouseEvent como `aviso`. */}
        <button onClick={() => onCerrar()} disabled={guardando} style={{ ...btnSecundario('md'), flex: 1 }}>Cancelar</button>
        <button onClick={guardar} disabled={!valido || guardando} style={{ ...btnPrimario('md', !valido || guardando), flex: 1 }}>
          {guardando ? 'Creando…' : 'Crear cuenta'}
        </button>
      </div>
    </Modal>
  )
}

/* ── Cambio de clave ──────────────────────────────────────── */

function DialogoClave({ businessId, usuario, onCerrar }: {
  businessId: string
  usuario: UsuarioCaja
  onCerrar: () => void
}) {
  const [password, setPassword] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !guardando) onCerrar() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onCerrar, guardando])

  const guardar = async () => {
    setGuardando(true); setError('')
    try {
      await cambiarClave(businessId, usuario.user_id, password)
      setListo(true)
    } catch (e) {
      setError(e instanceof ErrorUsuarios ? e.message : 'No se pudo cambiar la clave')
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Cambiar clave" sub={usuario.nombre} onCerrar={onCerrar}>
      {listo ? (
        <>
          <div style={{
            display: 'flex', gap: '.6rem', alignItems: 'flex-start',
            background: 'var(--color-gold-glow)', border: '1px solid var(--color-gold)',
            borderRadius: 'var(--r-md)', padding: '.85rem 1rem',
          }}>
            <Check size={16} color="var(--color-gold)" style={{ flexShrink: 0, marginTop: '.1rem' }} />
            <p style={{ fontSize: '.78rem', color: 'var(--color-ink-dim)', lineHeight: 1.55 }}>
              Clave cambiada. La sesión que tenga abierta sigue andando hasta que
              cierre sesión; la nueva clave es para el próximo ingreso.
            </p>
          </div>
          <div style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-rim)', borderRadius: 'var(--r-md)', padding: '.9rem 1rem', marginTop: '.75rem' }}>
            <Campo rotulo="Clave nueva" valor={password} />
          </div>
          <button onClick={onCerrar} style={{ ...btnPrimario('md'), width: '100%', marginTop: '1.25rem' }}>Listo</button>
        </>
      ) : (
        <>
          <section>
            <Rotulo extra="mínimo 8 caracteres">Clave nueva</Rotulo>
            <input type="text" autoFocus autoCapitalize="none" autoCorrect="off"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="La que le vas a pasar" style={estiloInput} />
          </section>

          {error && <Alerta texto={error} />}

          <div style={{ display: 'flex', gap: '.5rem', marginTop: '1.25rem' }}>
            <button onClick={onCerrar} disabled={guardando} style={{ ...btnSecundario('md'), flex: 1 }}>Cancelar</button>
            <button onClick={guardar} disabled={password.length < 8 || guardando} style={{ ...btnPrimario('md', password.length < 8 || guardando), flex: 1 }}>
              {guardando ? 'Guardando…' : 'Cambiar'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

/* ── Piezas ───────────────────────────────────────────────── */

function Modal({ titulo, sub, children, onCerrar }: {
  titulo: string
  sub?: string
  children: React.ReactNode
  onCerrar: () => void
}) {
  return (
    <div onClick={onCerrar} style={{
      position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '24rem', maxHeight: '88dvh',
        background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
        borderRadius: 'var(--r-xl)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <header style={{
          padding: '1rem 1.15rem', borderBottom: '1px solid var(--color-rim)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem',
        }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.1 }}>
              {titulo}
            </h2>
            {sub && <p style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)', marginTop: '.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>}
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" style={{
            background: 'var(--color-surface2)', border: '1px solid var(--color-rim)',
            borderRadius: 'var(--r-sm)', color: 'var(--color-ink-dim)', cursor: 'pointer',
            width: '2rem', height: '2rem', flexShrink: 0, display: 'grid', placeItems: 'center', padding: 0,
          }}><X size={15} /></button>
        </header>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.15rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/** Rótulo arriba y valor abajo, seleccionable para poder copiarlo. */
function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: '.6rem', fontWeight: 600,
        letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)',
      }}>{rotulo}</p>
      <p style={{
        fontSize: '.88rem', fontWeight: 600, color: 'var(--color-ink)', marginTop: '.2rem',
        userSelect: 'all', wordBreak: 'break-all',
      }}>{valor}</p>
    </div>
  )
}

function Rotulo({ children, extra }: { children: React.ReactNode; extra?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '.5rem', marginBottom: '.45rem' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '.62rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>
        {children}
      </span>
      {extra && <span style={{ fontSize: '.64rem', color: 'var(--color-ink-ghost)' }}>{extra}</span>}
    </div>
  )
}

function Alerta({ texto }: { texto: string }) {
  return (
    <div style={{
      display: 'flex', gap: '.5rem', padding: '.7rem .8rem',
      background: 'var(--color-surface2)', border: `1px solid ${ROJO}`, borderRadius: 'var(--r-md)',
    }}>
      <TriangleAlert size={14} color={ROJO} style={{ flexShrink: 0, marginTop: '.1rem' }} />
      <p style={{ fontSize: '.74rem', color: 'var(--color-ink-dim)', lineHeight: 1.55 }}>{texto}</p>
    </div>
  )
}

const estiloInput: CSSProperties = {
  width: '100%',
  padding: '.7rem .85rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-rim-l)',
  borderRadius: 'var(--r-md)',
  color: 'var(--color-ink)',
  fontFamily: 'var(--font-body)',
  fontSize: '16px', // evita el zoom de iOS al enfocar
}
