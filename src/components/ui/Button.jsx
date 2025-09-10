export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-white border border-slate-300 text-slate-900 hover:bg-slate-50',
    destructive: 'bg-rose-600 hover:bg-rose-700 text-white',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-900',
  }
  return (
    <button className={[base, variants[variant] || variants.primary, className].join(' ')} {...props}>
      {children}
    </button>
  )
}