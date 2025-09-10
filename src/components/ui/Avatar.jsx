export default function Avatar({ src, alt, fallback }) {
  return (
    <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-indigo-100 bg-slate-200 flex items-center justify-center text-slate-700">
      {src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : <span className="text-sm">{fallback}</span>}
    </div>
  )
}