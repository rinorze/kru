import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './state'
import './styles.css'

// a crash in one page shows a reload button instead of a blank white screen
class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif', maxWidth: 560 }}>
        <h1 style={{ fontSize: 22 }}>Diçka shkoi keq / Something went wrong</h1>
        <p style={{ color: '#4A5D69' }}>{this.state.error.message}</p>
        <button onClick={() => { try { localStorage.clear() } catch { /* private mode */ } location.href = '/' }}
          style={{ padding: '10px 16px', borderRadius: 8, border: 0, background: '#0C2D44', color: '#fff', fontSize: 15, cursor: 'pointer' }}>
          Ringarko / Reload
        </button>
      </div>
    )
  }
}

// a stale page after a redeploy asks for bundles that no longer exist: reload once to get the new build
window.addEventListener('vite:preloadError', () => {
  if (!sessionStorage.getItem('reloaded')) { sessionStorage.setItem('reloaded', '1'); location.reload() }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Boundary>
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    </Boundary>
  </StrictMode>,
)
