/**
 * PROTOTYPE — Splash/velkommen-skærm (inde i iPhone-rammen)
 * Venstre: konstruktionsfoto. Højre: gul stribe med logo + hilsen + start.
 */
import { Sun } from 'lucide-react'
import { FS } from '@/styles/spacing'

export interface SplashScreenProps {
  onStart: () => void
}

export function SplashScreen({ onStart }: SplashScreenProps) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

      {/* Left: hero photo / construction gradient */}
      <div
        style={{
          flex: 3,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#062536',
        }}
      >
        <img
          src="/hero-worker.png"
          alt=""
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </div>

      {/* Right: yellow strip */}
      <div
        style={{
          flex: 2,
          backgroundColor: '#FEEE32',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* Colas logo — top right */}
        <img
          src="/logo_splash.png"
          alt="Colas"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 99,
            height: '73%',
            objectFit: 'contain',
            objectPosition: 'top right',
          }}
        />

        {/* Bottom content */}
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            left: 0,
            right: 0,
            paddingLeft: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* Weather */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sun size={16} color="#1D1D1D" />
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: FS.xs,
                color: '#1D1D1D',
                lineHeight: 1,
              }}
            >
              14 Grader
            </span>
          </div>

          {/* Greeting */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: FS.sm,
                color: '#1D1D1D',
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Godmorgen.
            </p>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: FS.xs,
                color: '#1D1D1D',
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Idag bliver en god dag.
            </p>
          </div>

          {/* Start button */}
          <button
            onClick={onStart}
            aria-label="Start"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#FEF589',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
              fontSize: FS.xl,
              fontFamily: 'Inter, sans-serif',
              marginTop: 4,
            }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
