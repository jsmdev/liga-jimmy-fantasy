
import { useEffect } from 'react'
import { blastConfetti } from './ConfettiButton.jsx'

const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']

export default function KonamiEasterEgg(){
  useEffect(()=>{
    let idx = 0
    const handler = (e)=>{
      const key = e.key
      if (key === KONAMI[idx]) {
        idx++
        if (idx === KONAMI.length) {
          blastConfetti({originY: 0.6, particleCount: 180})
          const el = document.createElement('div')
          el.textContent = '🦄 ¡Easter egg desbloqueado!'
          el.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg z-[10000]'
          document.body.appendChild(el)
          setTimeout(()=> el.remove(), 2000)
          idx = 0
        }
      } else {
        idx = 0
      }
    }
    window.addEventListener('keydown', handler)
    return ()=> window.removeEventListener('keydown', handler)
  }, [])
  return null
}
