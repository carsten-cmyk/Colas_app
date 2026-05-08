/**
 * PROTOTYPE — Login-side
 * Dummy AD/SSO login til illustration.
 * Må ikke importeres i produktionskode.
 */
import { useNavigate } from 'react-router-dom'

export function LoginScreen() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>

      {/* ── Venstre: Hero-foto ─────────────────────────────────── */}
      <div style={{ position: 'relative', width: '55%', flexShrink: 0 }}>
        <img
          src="/hero-worker.png"
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 60%)',
        }} />
      </div>

      {/* ── Højre: Login-panel ─────────────────────────────────── */}
      <div style={{
        flex: 1,
        backgroundColor: '#FEEE32',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 10%',
      }}>

        <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Logo */}
          <img
            src="/colas-logo.png"
            alt="Colas"
            style={{ height: 40, width: 'auto', objectFit: 'contain', objectPosition: 'left', marginBottom: 40 }}
          />

          {/* Velkomsttekst */}
          <h1 style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: 28,
            color: '#1D1D1D',
            lineHeight: 1.2,
            margin: '0 0 8px 0',
          }}>
            Velkommen
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: 'rgba(29,29,29,0.55)',
            margin: '0 0 40px 0',
          }}>
            I dag bliver en god dag
          </p>

          {/* Log ind med Microsoft */}
          <button
            onClick={() => navigate('/prototyper')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              backgroundColor: '#fff',
              border: '1px solid rgba(29,29,29,0.12)',
              borderRadius: 12,
              padding: '12px 16px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'box-shadow 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(29,29,29,0.22)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(29,29,29,0.12)'
            }}
          >
            {/* Microsoft logo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, width: 20, height: 20, flexShrink: 0 }}>
              <div style={{ backgroundColor: '#F25022', borderRadius: 1 }} />
              <div style={{ backgroundColor: '#7FBA00', borderRadius: 1 }} />
              <div style={{ backgroundColor: '#00A4EF', borderRadius: 1 }} />
              <div style={{ backgroundColor: '#FFB900', borderRadius: 1 }} />
            </div>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              color: '#1D1D1D',
            }}>
              Log ind med Microsoft
            </span>
          </button>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            color: 'rgba(29,29,29,0.35)',
            textAlign: 'center',
            marginTop: 16,
          }}>
            Brug din Colas-arbejdsmail til at logge ind
          </p>

        </div>

        {/* Footer */}
        <p style={{
          position: 'absolute',
          bottom: 24,
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          color: 'rgba(29,29,29,0.25)',
        }}>
          © {new Date().getFullYear()} Colas Danmark A/S
        </p>

      </div>
    </div>
  )
}
