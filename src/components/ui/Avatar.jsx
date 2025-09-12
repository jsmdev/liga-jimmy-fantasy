import React, { useState } from 'react'

/**
 * Avatar simple sin fetch/caché (evita problemas CORS).
 * - Muestra <img src="..."> directamente.
 * - Si falla la carga o no hay src, muestra las iniciales (fallback).
 * - Tamaños: sm (32px), md (40px), lg (56px).
 */
export default function Avatar({
  src,
  alt = '',
  fallback = '—',
  size = 'md',
  className = '',
}) {
  const [error, setError] = useState(false)

  const sizePx =
    size === 'sm' ? 32 :
    size === 'lg' ? 56 :
    40 // md

  return (
    <div
      className={[
        'rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700',
        'flex items-center justify-center',
        'text-slate-700 dark:text-slate-200 select-none',
        'ring-1 ring-slate-300/60 dark:ring-slate-600/60',
        className,
      ].join(' ')}
      style={{ width: sizePx, height: sizePx }}
      aria-label={alt}
      title={alt}
    >
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
      ) : (
        <span className="text-xs font-semibold">
          {fallback}
        </span>
      )}
    </div>
  )
}