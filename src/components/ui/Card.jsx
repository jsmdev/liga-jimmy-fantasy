
export function Card({ className='', children }) {
  return <div className={['bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm', className].join(' ')}>{children}</div>
}
export function CardHeader({ className='', children }) {
  return <div className={['px-6 pt-6', className].join(' ')}>{children}</div>
}
export function CardTitle({ className='', children }) {
  return <h3 className={['text-lg font-semibold text-slate-900 dark:text-slate-100', className].join(' ')}>{children}</h3>
}
export function CardDescription({ className='', children }) {
  return <p className={['text-sm text-slate-600 dark:text-slate-400', className].join(' ')}>{children}</p>
}
export function CardContent({ className='', children }) {
  return <div className={['px-6 pb-6', className].join(' ')}>{children}</div>
}
