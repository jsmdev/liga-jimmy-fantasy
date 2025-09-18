// src/Rules.jsx
import { useEffect, useMemo, useRef, useState, isValidElement } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BookOpen, Download, Printer, ListOrdered } from 'lucide-react'

const RULES_MD_URL = '/rules.md' // se sirve desde /public

// ---------------- Utils ----------------
function slugify(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9\s-]/g, '') // quita símbolos/emoji
    .trim()
    .replace(/\s+/g, '-')
}

function getNodeText(node) {
  if (node == null) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getNodeText).join('')
  if (isValidElement(node)) return getNodeText(node.props?.children)
  return ''
}

// Del markdown crudo, saca headings #, ##, ### para el TOC
function extractHeadings(md) {
  const lines = md.split('\n')
  const out = []
  for (const line of lines) {
    const m = /^(#{1,3})\s+(.*)$/.exec(line.trim())
    if (m) {
      const level = m[1].length
      const text = m[2].trim()
      const id = slugify(text)
      out.push({ level, text, id })
    }
  }
  return out
}

// -------------- Componente --------------
export default function Rules({ pdfUrl }) {
  const [md, setMd] = useState('')
  const [activeId, setActiveId] = useState(null)

  const containerRef = useRef(null)
  const headingsMapRef = useRef({}) // { id: HTMLElement }

  // Carga del markdown
  useEffect(() => {
    fetch(RULES_MD_URL)
      .then(r => r.text())
      .then(setMd)
      .catch(() => setMd('# Normativa\nNo se pudo cargar el reglamento.'))
  }, [])

  // Botón de descarga: se muestra solo si se proporciona pdfUrl

  const headings = useMemo(() => extractHeadings(md), [md])

  // ScrollSpy robusto observando refs reales (no querySelector)
  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const els = Object.values(headingsMapRef.current).filter(Boolean)
    if (els.length === 0) return

    const io = new IntersectionObserver(
      entries => {
        const vis = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (vis[0]?.target?.id) setActiveId(vis[0].target.id)
      },
      {
        root,
        rootMargin: '0px 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    )

    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [md]) // recalcular cuando cambie el MD

  // Navegación del TOC: scroll dentro del contenedor usando refs
  const handleTocClick = (e, id) => {
    e.preventDefault()
    const root = containerRef.current
    const el = headingsMapRef.current[id]
    if (!root || !el) return

    const targetRect = el.getBoundingClientRect()
    const containerRect = root.getBoundingClientRect()
    const offset = (targetRect.top - containerRect.top) + root.scrollTop - 24 // margen superior
    root.scrollTo({ top: offset, behavior: 'smooth' })
  }

  // Renderers: inyecta id y ref en h1/h2/h3
  const components = {
    h1: ({ node, children, ...props }) => {
      const text = getNodeText(children)
      const id = slugify(text)
      return (
        <h1
          id={id}
          ref={el => { if (el) headingsMapRef.current[id] = el }}
          {...props}
        >
          {children}
        </h1>
      )
    },
    h2: ({ node, children, ...props }) => {
      const text = getNodeText(children)
      const id = slugify(text)
      return (
        <h2
          id={id}
          ref={el => { if (el) headingsMapRef.current[id] = el }}
          {...props}
        >
          {children}
        </h2>
      )
    },
    h3: ({ node, children, ...props }) => {
      const text = getNodeText(children)
      const id = slugify(text)
      return (
        <h3
          id={id}
          ref={el => { if (el) headingsMapRef.current[id] = el }}
          {...props}
        >
          {children}
        </h3>
      )
    }
  }

  const onPrint = () => window.print()

  return (
    <div className="glass border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
      {/* Cabecera */}
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 dark:from-indigo-500/10 dark:to-cyan-500/10 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">Reglamento oficial</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Normativa vigente de la Liga Jimmy Fantasy</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pdfUrl && (
            <a
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-sm"
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Download className="w-4 h-4" /> PDF
            </a>
          )}
          <button
            onClick={onPrint}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-sm"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      {/* Contenido + TOC */}
      <div className="grid md:grid-cols-[260px,1fr]">
        {/* TOC */}
        <aside className="md:border-r border-slate-200 dark:border-slate-700 p-3 md:p-4 overflow-x-auto">
          <div className="hidden md:block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-wide">
            <ListOrdered className="inline w-4 h-4 mr-1" /> Índice
          </div>

          {/* TOC móvil: chips horizontales */}
          <div className="md:hidden flex items-center gap-2 overflow-x-auto py-2">
            {headings.map(h => (
              <a
                key={h.id}
                href={`#${h.id}`}
                onClick={e => handleTocClick(e, h.id)}
                className={[
                  'whitespace-nowrap px-3 py-1.5 rounded-full border text-sm',
                  activeId === h.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                ].join(' ')}
              >
                {h.text}
              </a>
            ))}
          </div>

          {/* TOC desktop jerárquico */}
          <ul className="hidden md:flex md:flex-col gap-1">
            {headings.map(h => (
              <li key={h.id} className={h.level === 1 ? 'mt-2' : ''}>
                <a
                  href={`#${h.id}`}
                  onClick={e => handleTocClick(e, h.id)}
                  className={[
                    'block rounded-lg px-2 py-1.5 text-sm transition',
                    h.level === 1 ? 'font-bold' : h.level === 2 ? 'pl-4' : 'pl-8',
                    activeId === h.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  ].join(' ')}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Contenido scrollable */}
        <div
          ref={containerRef}
          className="max-h-[70vh] overflow-y-auto p-4 sm:p-6 prose prose-slate dark:prose-invert max-w-none scroll-smooth
                     [&_h1]:scroll-mt-24 [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {md}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}