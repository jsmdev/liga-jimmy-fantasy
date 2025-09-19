
import React from 'react'
import confetti from 'canvas-confetti'

export function blastConfetti({ originY = 0.7, particleCount = 120 } = {}) {
  confetti({ particleCount, spread: 70, origin: { y: originY }, scalar: 1.0, ticks: 200, zIndex: 9999 })
  setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: originY - 0.1 }, zIndex: 9999 }), 200)
}

export default function ConfettiButton({ children = 'Modo fiesta', className = '' }) {
  return (
    <button
      onClick={() => blastConfetti({ originY: 0.8 })}
      className={[
        'inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 hover:bg-white/90 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm transition-colors',
        'h-11 w-11 p-2 sm:w-auto sm:px-4 sm:gap-2',
        className,
      ].join(' ')}
      type="button"
      aria-label="Modo fiesta"
      title="Modo fiesta"
    >
      <span className="text-lg" aria-hidden="true">🎉</span>
      <span className="hidden sm:inline font-semibold">{children}</span>
    </button>
  )
}
