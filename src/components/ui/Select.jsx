
export default function Select({ value, onChange, options, className='' }) {
  return (
    <select
      value={value}
      onChange={(e)=>onChange(e.target.value)}
      className={['bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100', className].join(' ')}
    >
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  )
}
