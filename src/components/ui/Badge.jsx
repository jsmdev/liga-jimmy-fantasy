export default function Badge({className='',children}){return <span className={['inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-semibold',className].join(' ')}>{children}</span>}
