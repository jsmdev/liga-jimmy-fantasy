import React, { useEffect, useState } from 'react'

async function getCachedObjectUrl(url){
  try{
    if (!url) return null
    // Cache Storage API (funciona en HTTPS: Vercel ✓)
    const cache = await caches.open('participant-photos-v1')
    const absolute = new URL(url, window.location.href).toString()

    let response = await cache.match(absolute)
    if (!response){
      response = await fetch(absolute, { mode: 'cors' })
      if (response.ok) {
        // Guarda en caché para futuras vistas
        await cache.put(absolute, response.clone())
      } else {
        return null
      }
    }
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (e){
    console.warn('Avatar cache error:', e)
    return null
  }
}

export default function Avatar({ src, alt, fallback }) {
  const [objectUrl, setObjectUrl] = useState(null)

  useEffect(()=>{
    let revoked
    ;(async ()=>{
      const url = await getCachedObjectUrl(src)
      setObjectUrl(prev=>{
        if (prev && prev !== url) URL.revokeObjectURL(prev)
        return url
      })
    })()
    return ()=>{ 
      if (objectUrl) { URL.revokeObjectURL(objectUrl); revoked = true }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  return (
    <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-indigo-100 bg-slate-200 flex items-center justify-center text-slate-700">
      {objectUrl 
        ? <img src={objectUrl} alt={alt} className="h-full w-full object-cover" loading="lazy" />
        : (src 
            ? <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
            : <span className="text-sm">{fallback}</span>
          )
      }
    </div>
  )
}