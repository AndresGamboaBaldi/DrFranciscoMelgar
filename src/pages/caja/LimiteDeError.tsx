import { Component, type ErrorInfo, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { btnPrimario, btnSecundario } from '../../lib/panelUI'

/**
 * Atrapa los errores de render de una pestaña.
 *
 * Sin esto, cualquier excepción dentro de un componente desmonta TODO el árbol
 * de React y la caja queda en negro, sin ningún indicio de qué pasó. Con esto
 * queda a la vista el mensaje del error y se puede seguir trabajando cambiando
 * de pestaña.
 */

interface Props {
  children: ReactNode
  /** Nombre de la pestaña, para saber dónde reventó. */
  donde: string
}

interface State {
  error: Error | null
}

export default class LimiteDeError extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // El stack de componentes es lo único que dice en qué parte de la pestaña
    // fue; queda en la consola para poder pedirlo después.
    console.error(`[caja/${this.props.donde}] error de render`, error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
        borderLeft: '3px solid #c47070', borderRadius: 'var(--r-lg)', padding: '1.25rem',
      }}>
        <p style={{
          display: 'flex', alignItems: 'center', gap: '.5rem',
          fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400,
          color: 'var(--color-ink)', lineHeight: 1.15,
        }}>
          <TriangleAlert size={16} color="#c47070" style={{ flexShrink: 0 }} />
          Algo se rompió en {this.props.donde}
        </p>
        <p style={{ fontSize: '.8rem', color: 'var(--color-ink-ghost)', lineHeight: 1.6, margin: '.4rem 0 .9rem' }}>
          Los datos están a salvo: esto es un fallo al dibujar la pantalla, no al guardar.
        </p>

        <pre style={{
          background: 'var(--color-bg)', border: '1px solid var(--color-rim)',
          borderRadius: 'var(--r-md)', padding: '.7rem .8rem', marginBottom: '.9rem',
          fontSize: '.7rem', lineHeight: 1.5, color: 'var(--color-ink-dim)',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '9rem', overflowY: 'auto',
        }}>
          {error.message || String(error)}
        </pre>

        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button onClick={() => this.setState({ error: null })} style={{ ...btnPrimario('md'), flex: 1 }}>
            Reintentar
          </button>
          <button onClick={() => window.location.reload()} style={{ ...btnSecundario('md'), flex: 1 }}>
            Recargar
          </button>
        </div>
      </div>
    )
  }
}
