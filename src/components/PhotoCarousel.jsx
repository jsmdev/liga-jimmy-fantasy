
import React, { useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'

export default function PhotoCarousel({ photos = [] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [Autoplay({ delay: 2500 })])
  useEffect(()=>{ if (emblaApi) emblaApi.reInit() }, [emblaApi, photos])
  if (!photos.length) return null
  return (
    <div className="glass rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="px-6 pt-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Galería de la Liga</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">Momentos estelares y caritas de sufrimiento.</p>
      </div>
      <div className="px-6 pb-6">
        <div className="overflow-hidden rounded-xl" ref={emblaRef}>
          <div className="flex">
            {photos.map((p, i)=>(
              <div key={i} className="min-w-0 flex-[0_0_80%] sm:flex-[0_0_33%] md:flex-[0_0_25%] lg:flex-[0_0_20%] p-2">
                <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                  <img src={p.url} alt={p.alt || 'Foto liga'} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 truncate">{p.caption || p.alt || ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
