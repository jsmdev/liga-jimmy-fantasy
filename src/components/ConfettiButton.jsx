
import React from 'react'
import confetti from 'canvas-confetti'

export function blastConfetti({originY=0.7, particleCount=120} = {}) {
  confetti({ particleCount, spread: 70, origin: { y: originY }, scalar: 1.0, ticks: 200, zIndex: 9999 })
  setTimeout(()=> confetti({ particleCount: 80, spread: 100, origin: { y: originY-0.1 }, zIndex: 9999 }), 200)
}

export default function ConfettiButton({ children = '¡Fiesta!', className='' }) {
  return (
    <button
      onClick={()=> blastConfetti({originY: 0.8})}
      className={['inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm', className].join(' ')}
      type="button"
      aria-label="Lanzar confeti"
      title="Lanzar confeti"
    >
      🎉 {children}
    </button>
  )
}
