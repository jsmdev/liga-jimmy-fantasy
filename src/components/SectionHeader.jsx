// ==============================
// File: src/components/SectionHeader.jsx
// ==============================
import { ChevronDown } from 'lucide-react'

export default function SectionHeader({ title, subtitle, collapsed, onToggle }) {
  return (
    <button type="button" onClick={onToggle} className="w-full text-left group" aria-expanded={!collapsed}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
          {subtitle && <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
          <div className="mt-3 h-1 rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-500 opacity-90" />
        </div>
        <div className={[
          'shrink-0 rounded-xl border px-2.5 py-2 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 transition-transform',
          collapsed ? 'rotate-0' : 'rotate-180',
        ].join(' ')}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
    </button>
  )
}