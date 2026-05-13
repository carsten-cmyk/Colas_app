/**
 * PROTOTYPE — Login-side for Chauffør Demo
 * Dummy PIN-beskyttelse identisk design med formand + vognmand.
 * Må ikke importeres i produktionskode.
 */
/// <reference types="vite/client" />
import { useRef, useState } from 'react'
import type { KeyboardEvent, ClipboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'

const CORRECT_PIN = import.meta.env.VITE_DEMO_PIN ?? '123456'
const PIN_LENGTH = 6

export function LoginScreen() {
  const navigate = useNavigate()
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''))
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  function submit(pin: string) {
    if (pin === CORRECT_PIN) {
      sessionStorage.setItem('chauffeur_auth', '1')
      navigate('/app')
    } else {
      setShake(true)
      setError(true)
      setDigits(Array(PIN_LENGTH).fill(''))
      inputs.current[0]?.focus()
      setTimeout(() => setShake(false), 500)
    }
  }

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)
    setError(false)
    if (value && index < PIN_LENGTH - 1) inputs.current[index + 1]?.focus()
    if (next.every(d => d !== '') && next.join('').length === PIN_LENGTH) submit(next.join(''))
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus()
    if (e.key === 'Enter') {
      const pin = digits.join('')
      if (pin.length === PIN_LENGTH) submit(pin)
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH)
    const next = [...digits]
    pasted.split('').forEach((d, i) => { next[i] = d })
    setDigits(next)
    setError(false)
    inputs.current[Math.min(pasted.length, PIN_LENGTH - 1)]?.focus()
    if (pasted.length === PIN_LENGTH) submit(pasted)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>

      {/* Left: hero photo */}
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

      {/* Right: login panel */}
      <div style={{
        flex: 1,
        backgroundColor: '#FEEE32',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 10%',
        position: 'relative',
      }}>

        <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Logo */}
          <img
            src="/colas-logo.png"
            alt="Colas"
            style={{ height: 64, width: 'auto', objectFit: 'contain', marginBottom: 16 }}
          />

          {/* Role badge */}
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            color: 'rgba(29,29,29,0.45)',
            marginBottom: 32,
          }}>
            Chauffør
          </div>

          {/* Heading */}
          <h1 style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: 28,
            color: '#1D1D1D',
            lineHeight: 1.2,
            margin: '0 0 8px 0',
            textAlign: 'center',
          }}>
            Velkommen
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: 'rgba(29,29,29,0.55)',
            margin: '0 0 36px 0',
            textAlign: 'center',
          }}>
            Indtast adgangskode for at fortsætte
          </p>

          {/* PIN fields */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginBottom: 16,
              animation: shake ? 'shake 0.4s ease' : 'none',
            }}
          >
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={d}
                autoFocus={i === 0}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={handlePaste}
                style={{
                  width: 34,
                  height: 40,
                  textAlign: 'center',
                  fontSize: 17,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  borderRadius: 8,
                  border: error ? '1.5px solid #C8372D' : '1.5px solid rgba(29,29,29,0.18)',
                  backgroundColor: '#fff',
                  outline: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'border-color 0.15s',
                  caretColor: 'transparent',
                }}
                onFocus={e => {
                  if (!error) e.currentTarget.style.borderColor = 'rgba(29,29,29,0.5)'
                }}
                onBlur={e => {
                  if (!error) e.currentTarget.style.borderColor = 'rgba(29,29,29,0.18)'
                }}
              />
            ))}
          </div>

          {/* Error */}
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            color: '#C8372D',
            textAlign: 'center',
            minHeight: 20,
            margin: 0,
            opacity: error ? 1 : 0,
            transition: 'opacity 0.2s',
          }}>
            Forkert kode — prøv igen
          </p>

        </div>

        {/* Footer */}
        <p style={{
          position: 'absolute',
          bottom: 24,
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          color: 'rgba(29,29,29,0.25)',
          margin: 0,
        }}>
          &copy; {new Date().getFullYear()} Colas Danmark A/S
        </p>

      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
