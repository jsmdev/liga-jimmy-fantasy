export default function Select({ value, onChange, options, className='' }) {
  return (
    <select value={value} onChange={(e)=>onChange(e.target.value)} className={['bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm', className].join(' ')}>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  )
}