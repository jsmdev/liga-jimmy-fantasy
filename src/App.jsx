// ==============================
//  APP PRINCIPAL – Liga Jimmy Fantasy
//  - Carrusel (tabla Supabase carousel_photos)
//  - Ranking desde servidor (v_ranking_current) con podio y farolillo rojo
//    · Click en 1º = confeti + toast
//    · Desglose: "Puntos Fantasy" (externo) y "Ajuste" (bonificaciones - sanciones)
//    · "Premio bote: XX%" debajo del icono en Oro/Plata/Bronce
//  - Resumen por participante (colapsable)
//  - Historial con filtros integrados (colapsable)
//  - Footer
// ==============================

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Iconos e interacción visual
import { ChevronDown, Loader2, ArrowUpDown, Trophy, Medal, ThumbsDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Componentes propios
import ThemeToggle from '@/components/ThemeToggle.jsx'
import ConfettiButton, { blastConfetti } from '@/components/ConfettiButton.jsx'
import KonamiEasterEgg from '@/components/KonamiEasterEgg.jsx'
import PhotoCarousel from '@/components/PhotoCarousel.jsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card.jsx'
import Badge from '@/components/ui/Badge.jsx'
import Avatar from '@/components/ui/Avatar.jsx'
import Select from '@/components/ui/Select.jsx'

// ==============================
//  CONSTANTES GENERALES
// ==============================
const TITLE = 'Liga Jimmy Fantasy'
const SUBTITLE = 'Una liga para gente de bien'

// Cliente Supabase (lee .env Vite)
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

// ==============================
//  HELPERS DE FORMATO / UI
// ==============================
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
// Nota: 0 en negro (light) / blanco (dark) para mejor contraste
function signTextClass(n) {
  if (n > 0) return 'text-emerald-700 dark:text-emerald-400'
  if (n < 0) return 'text-rose-700 dark:text-rose-400'
  return 'text-slate-900 dark:text-slate-100'
}
function fmtSigned(n) {
  return n > 0 ? '+' + n : String(n)
}

// ==============================
//  CABECERA DE SECCIÓN (colapsable)
// ==============================
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

// ==============================
//  COMPONENTE PRINCIPAL
// ==============================
export default function App() {
  // ------------------------------
  // ESTADO DE DATOS BÁSICOS
  // ------------------------------
  const [participants, setParticipants] = useState([])
  const [penalties, setPenalties] = useState([])
  const [loading, setLoading] = useState(true)

  // ------------------------------
  // ESTADO FILTROS HISTORIAL
  // ------------------------------
  const [filterParticipantId, setFilterParticipantId] = useState('all')
  const [sortBy, setSortBy] = useState('date') // 'date' | 'name' | 'team' | 'amount'
  const [sortDir, setSortDir] = useState('desc') // 'asc' | 'desc'

  // ------------------------------
  // ESTADO VARIOS (lightbox / carrusel / ranking)
  // ------------------------------
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [carousel, setCarousel] = useState([]) // fotos del carrusel desde Supabase
  const [rankingRows, setRankingRows] = useState([]) // filas de v_ranking_current

  // ------------------------------
  // ESTADO DE COLAPSABLES
  // ------------------------------
  const [collapsedRanking, setCollapsedRanking] = useState(false)
  const [collapsedSummary, setCollapsedSummary] = useState(false)
  const [collapsedHistory, setCollapsedHistory] = useState(false)

  // ------------------------------
  // CARGA DE DATOS DESDE SUPABASE
  // ------------------------------
  async function load() {
    setLoading(true)
    try {
      // Participantes (para nombres, equipos y fotos)
      const { data: parts } = await supabase
        .from('participants')
        .select('id,name,team_name,photo_url')
        .order('name')

      // Penalizaciones/bonificaciones (historial y totales por participante)
      const { data: pens } = await supabase
        .from('penalties')
        .select('id,participant_id,amount,reason,date')
        .order('date', { ascending: false })

      // Carrusel (tabla dedicada)
      const { data: photos } = await supabase
        .from('carousel_photos')
        .select('url, alt, caption, position, is_active')
        .eq('is_active', true)
        .order('position', { ascending: true })

      // Ranking desde servidor (vista con externos + penalizaciones)
      const { data: rank } = await supabase
        .from('v_ranking_current')
        .select('participant_id,name,team_name,external_total,penalty_total,score,rank')
        .order('rank', { ascending: true })

      setParticipants(parts || [])
      setPenalties(pens || [])
      setCarousel(
        (photos || []).map(p => ({
          url: p.url,
          alt: p.alt || '',
          caption: p.caption || '',
        })),
      )
      setRankingRows(rank || [])
    } catch (e) {
      console.error('load() error', e)
      setParticipants([])
      setPenalties([])
      setCarousel([])
      setRankingRows([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  // ------------------------------
  // TOTALES POR PARTICIPANTE (para tarjetas del resumen)
  // ------------------------------
  const totals = useMemo(() => {
    const map = Object.fromEntries(participants.map(p => [p.id, 0]))
    for (const pen of penalties) {
      if (map[pen.participant_id] !== undefined) map[pen.participant_id] += Number(pen.amount) || 0
    }
    return map
  }, [participants, penalties])

  // ------------------------------
  // DESGLOSE (SANCIONES / BONIFICACIONES) POR PARTICIPANTE (resumen)
  // ------------------------------
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

  // ------------------------------
  // DESGLOSE GLOBAL (para cabecera del resumen)
  // ------------------------------
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

  // ------------------------------
  // HISTORIAL: FILAS UNIDAS + ORDENACIÓN
  // ------------------------------
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

  // ------------------------------
  // RANKING (desde servidor) + mapeo a la UI
  //  - p.ext  = external_total  (Puntos Fantasy)
  //  - p.pen  = penalty_total   (Ajuste = bonificaciones - sanciones)
  //  - p.score = ext + pen
  // ------------------------------
  const ranking = useMemo(() => {
    const rows = (rankingRows || []).slice().sort((a, b) => (a.rank || 999) - (b.rank || 999))
    return rows.map(r => {
      const p = participants.find(pp => pp.id === r.participant_id)
      return {
        id: r.participant_id,
        name: r.name,
        team_name: r.team_name,
        photo_url: p?.photo_url || '',
        ext: Number(r.external_total) || 0,
        pen: Number(r.penalty_total) || 0,
        score: Number(r.score) || 0,
        rank: Number(r.rank) || 0,
      }
    })
  }, [rankingRows, participants])

  const podium = useMemo(() => ranking.slice(0, 3), [ranking])
  const tailTwo = useMemo(() => ranking.slice(-2).reverse(), [ranking]) // penúltimo y último
  const middlePack = useMemo(() => ranking.slice(3, Math.max(3, ranking.length - 2)), [ranking])

  // ------------------------------
  // CARRUSEL (solo datos de tabla; sin fallback)
  // ------------------------------
  const carouselPhotos = useMemo(() => carousel, [carousel])

  // ------------------------------
  // UTILIDAD: TOAST RÁPIDO (para "¡Campeón!")
  // ------------------------------
  function showToast(message) {
    const el = document.createElement('div')
    el.textContent = message
    el.className =
      'fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg z-[10000]'
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 1800)
  }
  function celebrateChampion() {
    blastConfetti({ originY: 0.7, particleCount: 180 })
    showToast('🏆 ¡Campeón!')
  }

  // ==============================
  //  RENDER
  // ==============================
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      {/* ---------------------------------
         CABECERA SUPERIOR (título + acciones)
      ----------------------------------- */}
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

      {/* ---------------------------------
         CONTENIDO PRINCIPAL
      ----------------------------------- */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <KonamiEasterEgg />

        {/* ===== CARRUSEL (solo si hay fotos en la tabla) ===== */}
        {Array.isArray(carouselPhotos) && carouselPhotos.length > 0 && (
          <section>
            <PhotoCarousel photos={carouselPhotos} />
          </section>
        )}

        {loading ? (
          // ----- ESTADO CARGANDO -----
          <div className="flex items-center justify-center py-24 text-slate-600 dark:text-slate-300">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Cargando datos…
          </div>
        ) : (
          <>
            {/* ===== RANKING (colapsable) ===== */}
            <section>
              <SectionHeader
                title="Ranking actual de la liga"
                subtitle="Reparto del bote: 50% / 30% / 20%. Los dos últimos… escarnio público 😉"
                collapsed={collapsedRanking}
                onToggle={() => setCollapsedRanking(v => !v)}
              />

              <AnimatePresence initial={false}>
                {!collapsedRanking && (
                  <motion.div
                    key="ranking-body"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="mt-4 space-y-6"
                  >
                    {/* --- Podio (oro/plata/bronce) --- */}
                    <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:items-end sm:justify-items-center">
                      {/* Plata (2º) */}
                      <div className="text-center order-2 sm:order-none sm:col-start-1 w-full">
                        {podium[1] && (
                          <div className="glass border border-slate-200 dark:border-slate-700 rounded-2xl p-4 card-float mx-auto max-w-[280px]">
                            <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 dark:from-slate-600 dark:to-slate-400 flex items-center justify-center text-white shadow">
                              <Medal className="w-7 h-7" />
                            </div>
                            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                              Premio bote: <strong>30%</strong>
                            </div>
                            <div className="mt-2 font-semibold">{podium[1].name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{podium[1].team_name || 'Equipo'}</div>
                            <div className="mt-2 text-sm">
                              <span className="text-slate-700 dark:text-slate-300">Puntos: </span>
                              <span className={signTextClass(podium[1].score)}>{fmtSigned(podium[1].score)}</span>
                            </div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Puntos Fantasy: <span className="font-medium">{fmtSigned(podium[1].ext)}</span> ·{' '}
                              <span title="Bonificaciones − Sanciones">Ajuste:</span>{' '}
                              <span className={signTextClass(podium[1].pen)}>{fmtSigned(podium[1].pen)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Oro (1º) */}
                      <div className="text-center order-1 sm:order-none sm:col-start-2 w-full">
                        {podium[0] && (
                          <button type="button" onClick={celebrateChampion} className="w-full" title="¡Celebrar al líder!">
                            <motion.div
                              className="glass border border-amber-300 dark:border-amber-600 rounded-2xl p-5 card-float shadow-lg mx-auto max-w-[300px]"
                              initial={isMobile ? { scale: 0.94, y: 6, opacity: 0.95 } : false}
                              animate={isMobile ? { scale: 1, y: 0, opacity: 1 } : {}}
                              transition={{ type: 'spring', stiffness: 220, damping: 18, mass: 0.6 }}
                              whileHover={{ scale: 1.015 }}
                              whileTap={{ scale: 0.985 }}
                            >
                              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-white shadow">
                                <Trophy className="w-8 h-8" />
                              </div>
                              <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                                Premio bote: <strong>50%</strong>
                              </div>
                              <div className="mt-2 font-bold text-lg">{podium[0].name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{podium[0].team_name || 'Equipo'}</div>
                              <div className="mt-2">
                                <span className="text-slate-700 dark:text-slate-300 text-sm">Puntos: </span>
                                <span className={signTextClass(podium[0].score)}>{fmtSigned(podium[0].score)}</span>
                              </div>
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Puntos Fantasy: <span className="font-medium">{fmtSigned(podium[0].ext)}</span> ·{' '}
                                <span title="Bonificaciones − Sanciones">Ajuste:</span>{' '}
                                <span className={signTextClass(podium[0].pen)}>{fmtSigned(podium[0].pen)}</span>
                              </div>
                            </motion.div>
                          </button>
                        )}
                      </div>

                      {/* Bronce (3º) */}
                      <div className="text-center order-3 sm:order-none sm:col-start-3 w-full">
                        {podium[2] && (
                          <div className="glass border border-slate-200 dark:border-slate-700 rounded-2xl p-4 card-float mx-auto max-w-[280px]">
                            <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-amber-800 to-orange-700 flex items-center justify-center text-white shadow">
                              <Medal className="w-7 h-7" />
                            </div>
                            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                              Premio bote: <strong>20%</strong>
                            </div>
                            <div className="mt-2 font-semibold">{podium[2].name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{podium[2].team_name || 'Equipo'}</div>
                            <div className="mt-2 text-sm">
                              <span className="text-slate-700 dark:text-slate-300">Puntos: </span>
                              <span className={signTextClass(podium[2].score)}>{fmtSigned(podium[2].score)}</span>
                            </div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Puntos Fantasy: <span className="font-medium">{fmtSigned(podium[2].ext)}</span> ·{' '}
                              <span title="Bonificaciones − Sanciones">Ajuste:</span>{' '}
                              <span className={signTextClass(podium[2].pen)}>{fmtSigned(podium[2].pen)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* --- El pelotón (resto, tonos neutros) --- */}
                    {middlePack.length > 0 && (
                      <div className="glass border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                        <div className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">El pelotón</div>
                        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                          {middlePack.map((p) => (
                            <li key={p.id} className="py-2 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 text-xs rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                  {ranking.findIndex(r => r.id === p.id) + 1}
                                </div>
                                <div>
                                  <div className="font-medium">{p.name}</div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">{p.team_name || 'Equipo'}</div>
                                </div>
                              </div>

                              {/* Score + desglose solicitado a la derecha */}
                              <div className="text-right">
                                <div className={['text-sm font-semibold', signTextClass(p.score)].join(' ')}>
                                  {fmtSigned(p.score)}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  Puntos Fantasy: <span className="font-medium">{fmtSigned(p.ext)}</span> ·{' '}
                                  <span title="Bonificaciones − Sanciones">Ajuste:</span>{' '}
                                  <span className={signTextClass(p.pen)}>{fmtSigned(p.pen)}</span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* --- Farolillo rojo (dos últimos) --- */}
                    {tailTwo.length > 0 && (
                      <div className="glass border border-rose-300/70 dark:border-rose-700/70 rounded-2xl p-4">
                        <div className="text-sm font-semibold mb-2 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                          <ThumbsDown className="w-4 h-4" /> Escarnio público (los dos últimos)
                        </div>
                        <ul className="divide-y divide-rose-200/60 dark:divide-rose-800/60">
                          {tailTwo.map(p => (
                            <li key={p.id} className="py-2 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 text-xs rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                                  {ranking.findIndex(r => r.id === p.id) + 1}
                                </div>
                                <div>
                                  <div className="font-semibold text-rose-700 dark:text-rose-300">{p.name}</div>
                                  <div className="text-xs text-rose-600/90 dark:text-rose-400/90">{p.team_name || 'Equipo'}</div>
                                </div>
                              </div>

                              {/* Score + desglose solicitado a la derecha */}
                              <div className="text-right">
                                <div className="text-sm font-bold text-rose-700 dark:text-rose-300">
                                  {fmtSigned(p.score)}
                                </div>
                                <div className="text-xs text-rose-700/90 dark:text-rose-300/90">
                                  Puntos Fantasy: <span className="font-medium">{fmtSigned(p.ext)}</span> ·{' '}
                                  <span title="Bonificaciones − Sanciones">Ajuste:</span>{' '}
                                  <span className={signTextClass(p.pen)}>{fmtSigned(p.pen)}</span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* ===== RESUMEN (colapsable) ===== */}
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
                    {/* Sanciones */}
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

                    {/* Bonificaciones */}
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

                    {/* Total global */}
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

              {/* Grid de tarjetas por participante */}
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

            {/* ===== HISTORIAL (colapsable) ===== */}
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
                    {/* --- Filtros del historial (debajo del título, ocultos al colapsar) --- */}
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

                      {/* Botón limpiar (solo si hay variaciones respecto a los valores por defecto) */}
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

                    {/* --- Tabla del historial --- */}
                    <Card className="glass card-float overflow-hidden">
                      {/* (Opcional) Puedes eliminar este CardHeader si no quieres subtítulo interno */}
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

            {/* ===== LIGHTBOX DE FOTOS ===== */}
            {lightboxUrl && (
              <div
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                onClick={() => setLightboxUrl(null)}
              >
                <img
                  src={lightboxUrl}
                  alt="Foto ampliada"
                  className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-lg"
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* ---------------------------------
         FOOTER
      ----------------------------------- */}
      <footer className="mt-16 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-600 dark:text-slate-400">
        Desarrollado con <span className="mx-1">❤️</span> por <strong>Pepe Sancho</strong>
      </footer>
    </div>
  )
}