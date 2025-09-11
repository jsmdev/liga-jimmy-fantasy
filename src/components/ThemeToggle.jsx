
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
      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-600 dark:text-slate-100 transition"
      title={isDark ? 'Cambiar a claro' : 'Cambiar a oscuro'}
      aria-label="Cambiar tema"
      type="button"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {isDark ? 'Claro' : 'Oscuro'}
    </button>
  )
}
