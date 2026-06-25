// Lokal helper — kun MksSkema bruger denne. Genbrug Afregning-togglens eksakte Tailwind-klasser.
export function JaNejToggle({
  value,
  onChange,
}: {
  value: 'ja' | 'nej' | null
  onChange: (v: 'ja' | 'nej') => void
}) {
  return (
    <div className="flex bg-surface-2 rounded-md p-xxxs border border-hairline w-fit">
      {(['ja', 'nej'] as const).map(v => {
        const isActive = value === v
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-pressed={isActive}
            className={[
              'px-xs py-xxxs rounded-sm font-inter text-xxs font-semibold transition-colors',
              isActive ? 'bg-dark-teal text-white' : 'text-text-muted hover:bg-soft-aqua',
            ].join(' ')}
          >
            {v === 'ja' ? 'Ja' : 'Nej'}
          </button>
        )
      })}
    </div>
  )
}
