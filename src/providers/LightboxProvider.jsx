import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'

const LightboxContext = createContext(null)

function normalizeSlides(input) {
  if (!input) return []
  if (Array.isArray(input)) {
    return input
      .filter(Boolean)
      .map((slide) => (typeof slide === 'string' ? { src: slide } : slide))
  }
  return [typeof input === 'string' ? { src: input } : input]
}

export function LightboxProvider({ children }) {
  const [lightboxState, setLightboxState] = useState({ open: false, slides: [], index: 0, config: {} })

  const openLightbox = useCallback((slides, options = {}) => {
    const normalizedSlides = normalizeSlides(slides)
    if (!normalizedSlides.length) return
    setLightboxState({
      open: true,
      slides: normalizedSlides,
      index: options.index ?? 0,
      config: options.config || {},
    })
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxState((prev) => ({ ...prev, open: false }))
  }, [])

  const value = useMemo(() => ({ openLightbox, closeLightbox }), [openLightbox, closeLightbox])

  return (
    <LightboxContext.Provider value={value}>
      {children}
      <Lightbox
        styles={{ container: { backgroundColor: 'rgba(15, 23, 42, 0.92)' } }}
        open={lightboxState.open}
        close={closeLightbox}
        slides={lightboxState.slides}
        index={lightboxState.index}
        plugins={[Zoom]}
        zoom={{
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 1.3,
          scrollToZoom: true,
        }}
        controller={{ closeOnBackdropClick: true, ...lightboxState.config?.controller }}
        on={{
          view: ({ index }) =>
            setLightboxState((prev) => ({ ...prev, index })),
        }}
      />
    </LightboxContext.Provider>
  )
}

export function useLightbox() {
  const ctx = useContext(LightboxContext)
  if (!ctx) throw new Error('useLightbox must be used within a LightboxProvider')
  return ctx
}
