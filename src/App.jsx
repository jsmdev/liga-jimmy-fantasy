import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ChevronDown, Loader2, ArrowUpDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import ThemeToggle from '@/components/ThemeToggle.jsx'
import ConfettiButton from '@/components/ConfettiButton.jsx'
import KonamiEasterEgg from '@/components/KonamiEasterEgg.jsx'
import PhotoCarousel from '@/components/PhotoCarousel.jsx'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card.jsx'
import Badge from '@/components/ui/Badge.jsx'
import Avatar from '@/components/ui/Avatar.jsx'
import Select from '@/components/ui/Select.jsx'

const TITLE = 'Liga Jimmy Fantasy'
const SUBTITLE = 'Una liga para gente de bien'

// Supabase
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

// Helpers UI/format
function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
}
function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString()
  } catch {
    return d
  }
}
function signClass(n) {
  if (n > 0) return 'bg-emerald-600'
  if (n < 0) return 'bg-rose-600'
  return 'bg-slate-600'
}
// 👉 0 ahora con contraste correcto (negro en claro / blanco en dark)
function signTextClass(n) {
  if (n > 0) return 'text-emerald-700 dark:text-emerald-400'
  if (n < 0) return 'text-rose-700 dark:text-rose-400'
  return 'text-slate-900 dark:text-slate-100'
}
function fmtSigned(n) {
  return n > 0 ? '+' + n : String(n)
}

// Cabecera de sección (potente + colapsable)
function SectionHeader({ title, subtitle, collapsed, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-left group"
      aria-expanded={!collapsed}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}
          <div className="mt-3 h-1 rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-500 opacity-90" />
        </div>
        <div
          className={[
            'shrink-0 rounded-xl border px-2.5 py-2 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 transition-transform',
            collapsed ? 'rotate-0' : 'rotate-180',
          ].join(' ')}
        >
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
    </button>
  )
}

export default function App() {
  // Estado
  const [participants, setParticipants] = useState([])
  const [penalties, setPenalties] = useState([])
  const [loading, setLoading] = useState(true)

  const [filterParticipantId, setFilterParticipantId] = useState('all')
  const [sortBy, setSortBy] = useState('date') // 'date' | 'name' | 'team' | 'amount'
  const [sortDir, setSortDir] = useState('desc') // 'asc' | 'desc'

  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [carousel, setCarousel] = useState([]) // fotos del carrusel desde Supabase

  const [collapsedSummary, setCollapsedSummary] = useState(false)
  const [collapsedHistory, setCollapsedHistory] = useState(false)

  // Carga de datos
  async function load() {
    setLoading(true)
    try {
      const { data: parts } = await supabase
        .from('participants')
        .select('id,name,team_name,photo_url')
        .order('name')

      const { data: pens } = await supabase
        .from('penalties')
        .select('id,participant_id,amount,reason,date')
        .order('date', { ascending: false })

      const { data: photos } = await supabase
        .from('carousel_photos')
        .select('url, alt, caption, position, is_active')
        .eq('is_active', true)
        .order('position', { ascending: true })

      setParticipants(parts || [])
      setPenalties(pens || [])
      setCarousel(
        (photos || []).map(p => ({
          url: p.url,
          alt: p.alt || '',
          caption: p.caption || '',
        })),
      )
    } catch (e) {
      console.error('load() error', e)
      setParticipants([])
      setPenalties([])
      setCarousel([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  // Totales por participante
  const totals = useMemo(() => {
    const map = Object.fromEntries(participants.map(p => [p.id, 0]))
    for (const pen of penalties) {
      if (map[pen.participant_id] !== undefined) map[pen.participant_id] += Number(pen.amount) || 0
    }
    return map
  }, [participants, penalties])

  // Desglose sanciones/bonificaciones por participante
  const breakdown = useMemo(() => {
    const map = Object.fromEntries(
      participants.map(p => [
        p.id,
        { sanciones: 0, sancionesTotal: 0, bonificaciones: 0, bonificacionesTotal: 0 },
      ]),
    )
    for (const pen of penalties) {
      const entry = map[pen.participant_id]
      if (!entry) continue
      const amount = Number(pen.amount) || 0
      if (amount < 0) {
        entry.sanciones++
        entry.sancionesTotal += amount
      } else if (amount > 0) {
        entry.bonificaciones++
        entry.bonificacionesTotal += amount
      }
    }
    return map
  }, [participants, penalties])

  // Desglose global
  const globalBreakdown = useMemo(() => {
    let sanciones = 0,
      sancionesTotal = 0,
      bonificaciones = 0,
      bonificacionesTotal = 0
    let totalCount = 0,
      totalSum = 0

    for (const pen of penalties) {
      const amount = Number(pen.amount) || 0
      totalCount++
      totalSum += amount
      if (amount < 0) {
        sanciones++
        sancionesTotal += amount
      } else if (amount > 0) {
        bonificaciones++
        bonificacionesTotal += amount
      }
    }
    return { sanciones, sancionesTotal, bonificaciones, bonificacionesTotal, totalCount, totalSum }
  }, [penalties])

  // Filas unidas + ordenación
  const rows = useMemo(() => {
    const joined = penalties.map(p => {
      const part = participants.find(pp => pp.id === p.participant_id)
      return {
        ...p,
        _name: part?.name || '',
        _team: part?.team_name || '',
        _photo: part?.photo_url || '',
        _date: p.date ? new Date(p.date) : null,
      }
    })
    const dir = sortDir === 'asc' ? 1 : -1
    joined.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a._name.localeCompare(b._name) * dir
        case 'team':
          return a._team.localeCompare(b._team) * dir
        case 'amount':
          return ((a.amount || 0) - (b.amount || 0)) * dir
        case 'date':
        default: {
          const at = a._date ? a._date.getTime() : 0
          const bt = b._date ? b._date.getTime() : 0
          return (at - bt) * dir
        }
      }
    })
    return joined
  }, [penalties, participants, sortBy, sortDir])

  // Carrusel: solo usa la tabla (sin fallback a participants)
  const carouselPhotos = useMemo(() => carousel, [carousel])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-title">{TITLE}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">{SUBTITLE}</p>
            <div className="mt-3 gradient-bar" />
          </div>
          <div className="flex items-center gap-3">
            <ConfettiButton>Modo fiesta</ConfettiButton>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <KonamiEasterEgg />

        {/* Carrusel solo si hay fotos */}
        {Array.isArray(carouselPhotos) && carouselPhotos.length > 0 && (
          <section>
            <PhotoCarousel photos={carouselPhotos} />
          </section>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-600 dark:text-slate-300">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Cargando datos…
          </div>
        ) : (
          <>
            {/* === RESUMEN (colapsable) === */}
            <section>
              <SectionHeader
                title="Resumen de penalizaciones"
                collapsed={collapsedSummary}
                onToggle={() => setCollapsedSummary(v => !v)}
              />

              {/* Totales globales */}
              <AnimatePresence initial={false}>
                {!collapsedSummary && (
                  <motion.div
                    key="summary-totals"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="mt-3 flex items-center gap-4 text-sm flex-wrap"
                  >
                    {/* Sanciones globales */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700 dark:text-slate-300">Sanciones:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {globalBreakdown.sanciones} [
                        <span className={signTextClass(globalBreakdown.sancionesTotal)}>
                          {fmtSigned(globalBreakdown.sancionesTotal)}
                        </span>
                        ]
                      </span>
                    </div>

                    {/* Bonificaciones globales */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700 dark:text-slate-300">Bonificaciones:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {globalBreakdown.bonificaciones} [
                        <span className={signTextClass(globalBreakdown.bonificacionesTotal)}>
                          {fmtSigned(globalBreakdown.bonificacionesTotal)}
                        </span>
                        ]
                      </span>
                    </div>

                    {/* Total global mismo formato */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700 dark:text-slate-300">Total global:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {globalBreakdown.totalCount} [
                        <span className={signTextClass(globalBreakdown.totalSum)}>
                          {fmtSigned(globalBreakdown.totalSum)}
                        </span>
                        ]
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Grid de tarjetas */}
              <AnimatePresence initial={false}>
                {!collapsedSummary && (
                  <motion.div
                    key="summary-grid"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {participants.map((p, idx) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.04 }}
                      >
                        <Card className="glass card-float">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => p.photo_url && setLightboxUrl(p.photo_url)}
                                className={p.photo_url ? 'cursor-zoom-in' : ''}
                              >
                                <Avatar src={p.photo_url} alt={p.name} fallback={initials(p.name)} size="lg" />
                              </div>
                              <div>
                                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                  {p.name}
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                  {p.team_name || 'Equipo sin nombre'}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {/* Total */}
                            <div className="flex items-center justify-start gap-3">
                              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Total:</span>
                              <Badge
                                className={['px-3 py-1.5 text-lg font-bold text-white', signClass(totals[p.id] || 0)].join(
                                  ' ',
                                )}
                              >
                                {fmtSigned(totals[p.id] || 0)}
                              </Badge>
                            </div>

                            {/* Sanciones */}
                            <div className="flex items-center justify-between">
                              <span className="text-slate-700 dark:text-slate-300">Sanciones:</span>
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {(breakdown[p.id]?.sanciones || 0)} [
                                <span className={signTextClass(breakdown[p.id]?.sancionesTotal || 0)}>
                                  {fmtSigned(breakdown[p.id]?.sancionesTotal || 0)}
                                </span>
                                ]
                              </span>
                            </div>

                            {/* Bonificaciones */}
                            <div className="flex items-center justify-between">
                              <span className="text-slate-700 dark:text-slate-300">Bonificaciones:</span>
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {(breakdown[p.id]?.bonificaciones || 0)} [
                                <span className={signTextClass(breakdown[p.id]?.bonificacionesTotal || 0)}>
                                  {fmtSigned(breakdown[p.id]?.bonificacionesTotal || 0)}
                                </span>
                                ]
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* === HISTORIAL (colapsable) === */}
            <section className="mt-10">
              <SectionHeader
                title="Historial de penalizaciones/bonificaciones"
                subtitle="Consulta detallada ordenable y filtrable"
                collapsed={collapsedHistory}
                onToggle={() => setCollapsedHistory(v => !v)}
              />

              <AnimatePresence initial={false}>
                {!collapsedHistory && (
                  <motion.div
                    key="history-body"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="mt-4"
                  >
                    {/* Filtros del historial (debajo del título y ocultos al colapsar) */}
                    <div className="mt-4 pb-4 grid gap-3 lg:grid-cols-4">
                      {/* Participante */}
                      <div className="lg:col-span-2">
                        <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1">Participante</label>
                        <Select
                          value={filterParticipantId}
                          onChange={v => setFilterParticipantId(v)}
                          options={[{ value: 'all', label: 'Todos' }, ...participants.map(p => ({ value: p.id, label: p.name }))]}
                          className="w-full"
                        />
                      </div>

                      {/* Ordenar por */}
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1">Ordenar por</label>
                        <Select
                          value={sortBy}
                          onChange={setSortBy}
                          options={[
                            { value: 'date', label: 'Fecha' },
                            { value: 'name', label: 'Nombre participante' },
                            { value: 'team', label: 'Nombre equipo' },
                            { value: 'amount', label: 'Penalización' },
                          ]}
                          className="w-full"
                        />
                      </div>

                      {/* Dirección */}
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1">Dirección</label>
                        <Select
                          value={sortDir}
                          onChange={setSortDir}
                          options={[
                            { value: 'asc', label: 'Ascendente' },
                            { value: 'desc', label: 'Descendente' },
                          ]}
                          className="w-full"
                        />
                      </div>

                      {/* Botón limpiar (solo si hay cambios respecto a los valores por defecto) */}
                      {(filterParticipantId !== 'all' || sortBy !== 'date' || sortDir !== 'desc') && (
                        <div className="lg:col-span-4 flex justify-end">
                          <button
                            onClick={() => {
                              setFilterParticipantId('all')
                              setSortBy('date')
                              setSortDir('desc')
                            }}
                            className="mt-2 text-sm px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition"
                          >
                            Limpiar filtros
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Tabla */}
                    <Card className="glass card-float overflow-hidden">
                      {/* Puedes eliminar este CardHeader si no quieres subtítulo interno */}
                      <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <div>
                          <CardTitle>Historial de penalizaciones</CardTitle>
                          <CardDescription>
                            Consulta detallada de sanciones y bonificaciones. Orden actual:{' '}
                            <strong>
                              {({ date: 'Fecha', name: 'Nombre', team: 'Equipo', amount: 'Penalización' })[sortBy]}
                            </strong>{' '}
                            <ArrowUpDown className="inline w-4 h-4" />
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-xl overflow-x-auto border border-slate-200 dark:border-slate-700">
                          <table className="w-full text-sm min-w-[820px]">
                            <thead className="bg-slate-50 dark:bg-slate-800/60">
                              <tr className="text-left">
                                <th className="px-4 py-3 text-slate-700 dark:text-slate-300">Foto</th>
                                <th className="px-4 py-3 text-slate-700 dark:text-slate-300">Nombre participante</th>
                                <th className="px-4 py-3 text-slate-700 dark:text-slate-300">Nombre Equipo</th>
                                <th className="px-4 py-3 text-slate-700 dark:text-slate-300">Fecha</th>
                                <th className="px-4 py-3 text-slate-700 dark:text-slate-300">Penalización</th>
                                <th className="px-4 py-3 text-slate-700 dark:text-slate-300">Motivo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows
                                .filter(p => filterParticipantId === 'all' || p.participant_id === filterParticipantId)
                                .map(pen => (
                                  <tr
                                    key={pen.id}
                                    className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700"
                                  >
                                    <td className="px-4 py-3">
                                      <div
                                        onClick={() => pen._photo && setLightboxUrl(pen._photo)}
                                        className={pen._photo ? 'cursor-zoom-in inline-block' : 'inline-block'}
                                      >
                                        <Avatar src={pen._photo} alt={pen._name} fallback={initials(pen._name)} />
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                      {pen._name || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{pen._team || '—'}</td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{fmtDate(pen.date)}</td>
                                    <td className="px-4 py-3">
                                      <Badge className={['text-white', signClass(pen.amount)].join(' ')}>
                                        {fmtSigned(pen.amount)}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                                      {pen.reason}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Lightbox */}
            {lightboxUrl && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setLightboxUrl(null)}>
                <img src={lightboxUrl} alt="Foto ampliada" className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-lg" />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}