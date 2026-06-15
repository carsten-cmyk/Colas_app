/**
 * PROTOTYPE — Demo-side
 * Viser iPhone 14 Pro-rammen med Chauffør App prototype centreret på siden.
 * Beskyttet af PIN-login (/). Kræver localStorage 'chauffeur_auth' (30-dages token).
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FS } from '@/styles/spacing'
import { isAuthed, clearAuth } from '@/utils/storage'
import { IPhoneFrame } from './IPhoneFrame'
import { ChauffoerPrototype } from './ChauffoerPrototype'

export function DemoPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Auth-token gemmes i localStorage af LoginScreen med 30-dages udløb.
    if (!isAuthed()) {
      clearAuth()
      navigate('/', { replace: true })
    }
  }, [navigate])

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#062536',
        background: 'linear-gradient(160deg, #041c28 0%, #0B3950 50%, #0E4764 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle grid pattern */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          marginBottom: 32,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <img
          src="/colas-logo.png"
          alt="Colas"
          style={{ height: 32, width: 'auto', objectFit: 'contain', marginBottom: 10, opacity: 0.9 }}
        />
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: FS.xs,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: 'rgba(255,255,255,0.35)',
            margin: 0,
          }}
        >
          Chauffør App — Demo
        </p>
      </div>

      {/* iPhone frame */}
      <div style={{ position: 'relative' }}>
        <IPhoneFrame>
          <ChauffoerPrototype />
        </IPhoneFrame>
      </div>

      {/* Footer */}
      <p
        style={{
          marginTop: 32,
          fontFamily: 'Inter, sans-serif',
          fontSize: FS.xxs,
          color: 'rgba(255,255,255,0.2)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        PIN: 123456 &nbsp;&middot;&nbsp; &copy; {new Date().getFullYear()} Colas Danmark A/S
      </p>
    </div>
  )
}
