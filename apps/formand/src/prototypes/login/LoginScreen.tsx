/**
 * PROTOTYPE — Login-side
 * Dummy AD/SSO login til illustration.
 * Må ikke importeres i produktionskode.
 */
import { useNavigate } from 'react-router-dom'

export function LoginScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex">

      {/* ── Venstre: Hero-foto ─────────────────────────────────── */}
      <div className="hidden md:block w-[55%] relative overflow-hidden">
        <img
          src="/hero-worker.png"
          alt="Colas formand på pladsen"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Subtil gradient i bunden for at forankre billedet */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* ── Højre: Login-panel ─────────────────────────────────── */}
      <div className="flex-1 bg-[#FEEE32] flex flex-col items-start justify-center px-[8%] py-xl">

        {/* COLAS logo */}
        <div className="mb-xl">
          <span className="font-poppins font-black text-[36px] text-[#1D1D1D] tracking-tight leading-none">
            COLAS
          </span>
        </div>

        {/* Velkomsttekst */}
        <div className="mb-lg">
          <h1 className="font-poppins font-bold text-[28px] text-[#1D1D1D] leading-tight mb-xs">
            Velkommen
          </h1>
          <p className="font-inter text-sm text-[#1D1D1D]/60">
            I dag bliver en god dag
          </p>
        </div>

        {/* Log ind med Microsoft */}
        <div className="flex flex-col gap-sm w-full max-w-[320px]">
          <button
            onClick={() => navigate('/prototyper')}
            className="w-full flex items-center gap-sm bg-white border border-[#1D1D1D]/10 rounded-xl px-sm py-xs shadow-sm hover:shadow-md hover:border-[#1D1D1D]/20 transition-all active:scale-[0.98] group"
          >
            {/* Microsoft logo */}
            <div className="flex-shrink-0 grid grid-cols-2 gap-[3px] w-[20px] h-[20px]">
              <div className="bg-[#F25022] rounded-[1px]" />
              <div className="bg-[#7FBA00] rounded-[1px]" />
              <div className="bg-[#00A4EF] rounded-[1px]" />
              <div className="bg-[#FFB900] rounded-[1px]" />
            </div>
            <span className="font-inter font-semibold text-sm text-[#1D1D1D] group-hover:text-[#1D1D1D]">
              Log ind med Microsoft
            </span>
          </button>

          <p className="font-inter text-xs text-[#1D1D1D]/40 text-center pt-xs">
            Brug din Colas-arbejdsmail til at logge ind
          </p>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-xl">
          <p className="font-inter text-xs text-[#1D1D1D]/30">
            © {new Date().getFullYear()} Colas Danmark A/S
          </p>
        </div>
      </div>

    </div>
  )
}
