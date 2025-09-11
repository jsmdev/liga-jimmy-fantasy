
import React, { useEffect, useState } from 'react'

async function getCachedObjectUrl(url){
  try{
    if (!url) return null
    if (typeof caches === 'undefined') return null
    const cache = await caches.open('participant-photos-v1')
    const absolute = new URL(url, window.location.href).toString()
    let response = await cache.match(absolute)
    if (!response){
      response = await fetch(absolute, { mode: 'cors' })
      if (response.ok) await cache.put(absolute, response.clone())
      else return null
    }
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (e){
    console.warn('Avatar cache error:', e)
    return null
  }
}

export default function Avatar({ src, alt, fallback, size = "md" }) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-base",
    xl: "h-24 w-24 text-lg"
  }
  const [objectUrl, setObjectUrl] = useState(null)
  useEffect(()=>{
    let last = null
    ;(async ()=>{
      const url = await getCachedObjectUrl(src)
      setObjectUrl(prev=>{ if (prev && prev !== url) URL.revokeObjectURL(prev); last = url; return url })
    })()
    return ()=>{ if (last) URL.revokeObjectURL(last) }
  }, [src])
  return (
    <div className={['rounded-full overflow-hidden ring-2 ring-indigo-100 dark:ring-slate-700 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-100', sizes[size] || sizes.md].join(' ')}>
      {objectUrl
        ? <img src={objectUrl} alt={alt} className="h-full w-full object-cover" loading="lazy" />
        : (src ? <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" /> : <span>{fallback}</span>)
      }
    </div>
  )
}
