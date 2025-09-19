
import React, { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

function getInitialTheme() {
  const stored = localStorage.getItem('theme')
  if (stored === 'dark' || stored === 'light') return stored
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  return mql.matches ? 'dark' : 'light'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => getInitialTheme())
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])
  const isDark = theme === 'dark'
  return (
    <button
      onClick={()=> setTheme(t=> t==='dark'?'light':'dark')}
      className={[
        'inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 hover:bg-white/90 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm transition-colors',
        'h-11 w-11 p-2 sm:w-auto sm:px-4 sm:gap-2'
      ].join(' ')}
      title={isDark ? 'Cambiar a claro' : 'Cambiar a oscuro'}
      aria-label="Cambiar tema"
      type="button"
    >
      {isDark ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
      <span className="hidden sm:inline font-medium">{isDark ? 'Claro' : 'Oscuro'}</span>
    </button>
  )
}
