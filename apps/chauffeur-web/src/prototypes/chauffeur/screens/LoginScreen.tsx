/**
 * PROTOTYPE — Login-side for Chauffør Demo
 * SMS-OTP login-flow med tre trin: mobilnummer → 6-cifret OTP → permissions.
 * Trin 1: Chauffør indtaster 8-cifret dansk mobilnummer (+45 prefix).
 * Trin 2: 6-cifret OTP (demo-kode: 123456). Token gemmes i localStorage.
 * Trin 3: Obligatoriske toggles — kamera + PWA install (UI-mock i prototype).
 * Layout matcher SplashScreen: flex: 3 venstre hero + flex: 2 gul højre,
 * logo top-right, login-content placeret bottom-left.
 * Må ikke importeres i produktionskode.
 */
/// <reference types="vite/client" />
import { useRef, useState, useEffect } from 'react'
import type { KeyboardEvent, ClipboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FS } from '@/styles/spacing'
import { setAuth } from '@/utils/storage'

const CORRECT_OTP = import.meta.env.VITE_DEMO_PIN ?? '123456'
const OTP_LENGTH = 6

type Step = 'phone' | 'otp' | 'permissions'

function formatPhone(phone: string): string {
  // "12345678" → "12 34 56 78"
  return phone.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
}

export function LoginScreen() {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const [cameraAllowed, setCameraAllowed] = useState(true)
  const [iconAdded, setIconAdded] = useState(true)

  const otpInputs = useRef<(HTMLInputElement | null)[]>([])
  const phoneInputRef = useRef<HTMLInputElement | null>(null)

  // Cooldown-timer: dekrementér hvert sekund, stop ved 0
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  function handlePhoneSubmit() {
    if (phone.length !== 8) return
    setStep('otp')
    setCooldown(30)
    setDigits(Array(OTP_LENGTH).fill(''))
    setError(false)
    setTimeout(() => otpInputs.current[0]?.focus(), 50)
  }

  function submitOtp(otp: string) {
    if (otp === CORRECT_OTP) {
      setAuth()
      setStep('permissions')
    } else {
      setShake(true)
      setError(true)
      setDigits(Array(OTP_LENGTH).fill(''))
      otpInputs.current[0]?.focus()
      setTimeout(() => setShake(false), 500)
    }
  }

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)
    setError(false)
    if (value && index < OTP_LENGTH - 1) otpInputs.current[index + 1]?.focus()
    if (next.every(d => d !== '') && next.join('').length === OTP_LENGTH) submitOtp(next.join(''))
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) otpInputs.current[index - 1]?.focus()
    if (e.key === 'Enter') {
      const otp = digits.join('')
      if (otp.length === OTP_LENGTH) submitOtp(otp)
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    const next = [...digits]
    pasted.split('').forEach((d, i) => { next[i] = d })
    setDigits(next)
    setError(false)
    otpInputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
    if (pasted.length === OTP_LENGTH) submitOtp(pasted)
  }

  function handleResend() {
    if (cooldown > 0) return
    setCooldown(30)
    // TODO: Erstat med Supabase SMS-afsendelse når klar
  }

  function handleFinish() {
    navigate('/app')
  }

  function handleChangeNumber() {
    setStep('phone')
    setDigits(Array(OTP_LENGTH).fill(''))
    setError(false)
    setTimeout(() => phoneInputRef.current?.focus(), 50)
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

      {/* Left: hero photo — ingen gradient (matcher Splash) */}
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

      {/* Right: gul panel — logo top-right, login-content bottom-left */}
      <div
        style={{
          flex: 2,
          backgroundColor: '#FEEE32',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* Colas logo — top right (identisk med Splash) */}
        <img
          src="/logo_splash.png"
          alt="Colas"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 99,
            height: '40%',
            objectFit: 'contain',
            objectPosition: 'top right',
          }}
        />

        {/* Login-content — bottom-left (erstatter Splash's vejr + hilsen + pile-knap) */}
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            left: 0,
            right: 0,
            paddingLeft: 20,
            paddingRight: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {/* ── Trin 1: Mobilnummer ── */}
          {step === 'phone' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <h1 style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: FS.md,
                  color: '#1D1D1D',
                  lineHeight: 1.2,
                  margin: 0,
                }}>
                  Log ind
                </h1>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: FS.sm,
                  fontWeight: 400,
                  color: 'rgba(29,29,29,0.75)',
                  margin: 0,
                  lineHeight: 1.4,
                }}>
                  Indtast dit mobilnummer for at modtage en SMS-kode
                </p>
              </div>

              {/* Phone input */}
              <div style={{
                backgroundColor: '#fff',
                border: '1px solid #0E4764',
                borderRadius: 12,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: FS.md,
                  fontWeight: 600,
                  color: '#1D1D1D',
                  userSelect: 'none' as const,
                  flexShrink: 0,
                }}>
                  +45
                </span>
                <div style={{
                  width: 1,
                  height: 24,
                  backgroundColor: 'rgba(14,71,100,0.3)',
                  flexShrink: 0,
                }} />
                <input
                  ref={phoneInputRef}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="00 00 00 00"
                  autoFocus
                  value={phone}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 8)
                    setPhone(val)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handlePhoneSubmit()
                  }}
                  style={{
                    flex: 1,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: FS.md,
                    color: '#1D1D1D',
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                onClick={handlePhoneSubmit}
                disabled={phone.length < 8}
                style={{
                  width: '100%',
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'transparent',
                  color: '#1D1D1D',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: FS.md,
                  border: '1px solid #1D1D1D',
                  cursor: phone.length < 8 ? 'not-allowed' : 'pointer',
                  opacity: phone.length < 8 ? 0.4 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                Send SMS
              </button>
            </>
          )}

          {/* ── Trin 2: OTP ── */}
          {step === 'otp' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <h1 style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: FS.md,
                  color: '#1D1D1D',
                  lineHeight: 1.2,
                  margin: 0,
                }}>
                  Indtast kode
                </h1>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: FS.sm,
                  fontWeight: 400,
                  color: 'rgba(29,29,29,0.75)',
                  margin: 0,
                  lineHeight: 1.4,
                }}>
                  Vi har sendt en 6-cifret kode til +45 {formatPhone(phone)}
                </p>
              </div>

              {/* OTP input row — reduceret til 36×48 så 6 cifre passer i smal container */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  animation: shake ? 'shake 0.4s ease' : 'none',
                }}
              >
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { otpInputs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: 40,
                      textAlign: 'center',
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: FS.lg,
                      fontWeight: 600,
                      color: '#1D1D1D',
                      borderRadius: 10,
                      border: error ? '1px solid #B42828' : '1px solid #0E4764',
                      backgroundColor: '#fff',
                      outline: 'none',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      transition: 'border-color 0.15s',
                      caretColor: 'transparent',
                    }}
                    onFocus={e => {
                      if (!error) e.currentTarget.style.borderColor = 'rgba(14,71,100,0.6)'
                    }}
                    onBlur={e => {
                      if (!error) e.currentTarget.style.borderColor = '#0E4764'
                    }}
                  />
                ))}
              </div>

              {/* Fejl-besked */}
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: FS.sm,
                fontWeight: 500,
                color: '#B42828',
                margin: 0,
                minHeight: 18,
                opacity: error ? 1 : 0,
                transition: 'opacity 0.2s',
              }}>
                Forkert kode. Prøv igen.
              </p>

              {/* Resend */}
              <button
                onClick={handleResend}
                disabled={cooldown > 0}
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 20,
                  border: '1px solid #1D1D1D',
                  backgroundColor: 'transparent',
                  color: '#1D1D1D',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                  fontSize: FS.sm,
                  cursor: cooldown > 0 ? 'default' : 'pointer',
                  opacity: cooldown > 0 ? 0.6 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {cooldown > 0 ? `Send igen (${cooldown}s)` : 'Send SMS igen'}
              </button>

              {/* Skift nummer */}
              <button
                onClick={handleChangeNumber}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: FS.sm,
                  color: '#1D1D1D',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  textAlign: 'center' as const,
                }}
              >
                Skift nummer
              </button>
            </>
          )}

          {/* ── Trin 3: Permissions ── */}
          {step === 'permissions' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <h1 style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: FS.md,
                  color: '#1D1D1D',
                  lineHeight: 1.2,
                  margin: 0,
                }}>
                  Sidste trin
                </h1>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: FS.sm,
                  fontWeight: 400,
                  color: 'rgba(29,29,29,0.75)',
                  margin: 0,
                  lineHeight: 1.4,
                }}>
                  Aktivér begge for at fortsætte
                </p>
              </div>

              {/* Toggle 1: Kamera */}
              <button
                onClick={() => setCameraAllowed(true)}
                disabled={cameraAllowed}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  backgroundColor: '#fff',
                  border: '1px solid #0E4764',
                  borderRadius: 12,
                  cursor: cameraAllowed ? 'default' : 'pointer',
                  textAlign: 'left' as const,
                  width: '100%',
                }}
              >
                {/* Toggle-pille — visuel switch */}
                <div style={{
                  width: 36,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: cameraAllowed ? '#1D1D1D' : '#D9D9D9',
                  position: 'relative',
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    position: 'absolute',
                    top: 2,
                    left: cameraAllowed ? 16 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  }} />
                </div>
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: FS.sm,
                  color: '#1D1D1D',
                  lineHeight: 1.3,
                  flex: 1,
                }}>
                  Tillad kamera til scanning af vejekort
                </span>
              </button>

              {/* Toggle 2: PWA install */}
              <button
                onClick={() => setIconAdded(true)}
                disabled={iconAdded}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  backgroundColor: '#fff',
                  border: '1px solid #0E4764',
                  borderRadius: 12,
                  cursor: iconAdded ? 'default' : 'pointer',
                  textAlign: 'left' as const,
                  width: '100%',
                }}
              >
                <div style={{
                  width: 36,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: iconAdded ? '#1D1D1D' : '#D9D9D9',
                  position: 'relative',
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    position: 'absolute',
                    top: 2,
                    left: iconAdded ? 16 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  }} />
                </div>
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: FS.sm,
                  color: '#1D1D1D',
                  lineHeight: 1.3,
                  flex: 1,
                }}>
                  Føj appen til hjemmeskærm
                </span>
              </button>

              {/* Færdig-knap */}
              <button
                onClick={handleFinish}
                disabled={!cameraAllowed || !iconAdded}
                style={{
                  width: '100%',
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'transparent',
                  color: '#1D1D1D',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: FS.md,
                  border: '1px solid #1D1D1D',
                  cursor: (!cameraAllowed || !iconAdded) ? 'not-allowed' : 'pointer',
                  opacity: (!cameraAllowed || !iconAdded) ? 0.4 : 1,
                  transition: 'opacity 0.15s',
                  marginTop: 4,
                }}
              >
                Færdig
              </button>
            </>
          )}
        </div>
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
