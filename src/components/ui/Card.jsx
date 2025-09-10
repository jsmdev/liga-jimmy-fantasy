export function Card({ className='', children }) {
  return <div className={['bg-white border border-slate-200 rounded-2xl shadow-sm', className].join(' ')}>{children}</div>
}
export function CardHeader({ className='', children }) {
  return <div className={['px-6 pt-6', className].join(' ')}>{children}</div>
}
export function CardTitle({ className='', children }) {
  return <h3 className={['text-lg font-semibold text-slate-900', className].join(' ')}>{children}</h3>
}
export function CardDescription({ className='', children }) {
  return <p className={['text-sm text-slate-600', className].join(' ')}>{children}</p>
}
export function CardContent({ className='', children }) {
  return <div className={['px-6 pb-6', className].join(' ')}>{children}</div>
}