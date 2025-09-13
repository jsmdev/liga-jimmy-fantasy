// ==============================
//  APP PRINCIPAL – Liga Jimmy Fantasy
// ==============================
import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  ChevronDown, Loader2, ArrowUpDown,
  Trophy, Medal, ThumbsDown, Crown, Users,
  BarChart2, AlertTriangle, ThumbsUp, Calendar, Flame
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import ThemeToggle from '@/components/ThemeToggle.jsx'
import ConfettiButton, { blastConfetti } from '@/components/ConfettiButton.jsx'
import KonamiEasterEgg from '@/components/KonamiEasterEgg.jsx'
import PhotoCarousel from '@/components/PhotoCarousel.jsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card.jsx'
import Badge from '@/components/ui/Badge.jsx'
import Avatar from '@/components/ui/Avatar.jsx'
import Select from '@/components/ui/Select.jsx'

// ==============================
//  CONSTANTES
// ==============================
const TITLE = 'Liga Jimmy Fantasy'
const SUBTITLE = 'Una liga para gente de bien'
// Mostrar/ocultar carrusel globalmente
const SHOW_CAROUSEL = true

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

// ==============================
//  HELPERS
// ==============================
function initials(name) {
  return (name || '?')
    .split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 3).toUpperCase()
}
function fmtDate(d) { try { return new Date(d).toLocaleDateString() } catch { return d } }
function signClass(n) { if (n > 0) return 'bg-emerald-600'; if (n < 0) return 'bg-rose-600'; return 'bg-slate-600' }
function signTextClass(n) { if (n > 0) return 'text-emerald-700 dark:text-emerald-400'; if (n < 0) return 'text-rose-700 dark:text-rose-400'; return 'text-slate-900 dark:text-slate-100' }
function fmtSigned(n) { return n > 0 ? '+' + n : String(n) }

// --- Helpers de estilo y frase según posición en ranking ---
function rankStyle(rank, total) {
  if (!rank || !total) return { container: 'bg-slate-100 dark:bg-slate-800', badge: 'bg-slate-300 dark:bg-slate-600' }
  if (rank === 1) return { container: 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20', badge: 'bg-amber-400 text-amber-900' }
  if (rank === 2) return { container: 'bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700', badge: 'bg-slate-300 text-slate-900 dark:bg-slate-400' }
  if (rank === 3) return { container: 'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/20', badge: 'bg-orange-400 text-orange-900' }
  if (rank === total) return { container: 'bg-rose-50 dark:bg-rose-900/20', badge: 'bg-rose-500 text-white' }
  if (rank === total - 1) return { container: 'bg-rose-50/70 dark:bg-rose-900/10', badge: 'bg-rose-400 text-white' }
  return { container: 'bg-sky-50 dark:bg-sky-900/20', badge: 'bg-sky-400 text-sky-900' }
}
function rankPhrase(rank, total) {
  if (!rank || !total) return 'Posición no disponible'
  if (rank === 1) return '¡Líder indiscutible! 🏆'
  if (rank === 2) return 'Plata con brillo. 🥈'
  if (rank === 3) return 'Bronce con estilo. 🥉'
  if (rank === total) return 'Farolillo rojo, pero con pundonor. 🔴'
  if (rank === total - 1) return 'Al filo del abismo… 👀'
  return 'En el pelotón, acechando. 🚴‍♂️'
}

// ==============================
//  CABECERA DE SECCIÓN
// ==============================
function SectionHeader({ title, subtitle, collapsed, onToggle }) {
  return (
    <button type="button" onClick={onToggle} className="w-full text-left group" aria-expanded={!collapsed}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
          {subtitle && <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
          <div className="mt-3 h-1 rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-500 opacity-90" />
        </div>
        <div className={[
          'shrink-0 rounded-xl border px-2.5 py-2 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 transition-transform',
          collapsed ? 'rotate-0' : 'rotate-180',
        ].join(' ')}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
    </button>
  )
}

// ==============================
//  APP
// ==============================
export default function App() {
  // Datos
  const [participants, setParticipants] = useState([])
  const [penalties, setPenalties] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtros historial
  const [filterParticipantId, setFilterParticipantId] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  // Varios
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [carousel, setCarousel] = useState([])
  const [rankingRows, setRankingRows] = useState([])

  // Colapsables
  const [collapsedRanking, setCollapsedRanking] = useState(false)
  const [collapsedSummary, setCollapsedSummary] = useState(false)
  const [collapsedHistory, setCollapsedHistory] = useState(false)
  const [collapsedStats, setCollapsedStats] = useState(false) // sección estadísticas
  const [collapsedGallery, setCollapsedGallery] = useState(false) // galería

  // Móvil (animación campeón)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640)
    onResize(); window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Día(s) más travieso(s) (desde vista SQL)
  const [naughtyDays, setNaughtyDays] = useState([])

  // Cargar datos
  async function load() {
    setLoading(true)
    try {
      const { data: parts } = await supabase
        .from('participants')
        .select('id,name,team_name,photo_url,photo_real_url,coach_photo_url,ref_coach')
        .order('name')

      const { data: pens } = await supabase
        .from('penalties')
        .select('id,participant_id,amount,reason,date')
        .order('date', { ascending: false })

      // Carrusel (solo si está activado)
      if (SHOW_CAROUSEL) {
        const { data: photos } = await supabase
          .from('carousel_photos')
          .select('url, alt, caption, position, is_active')
          .eq('is_active', true)
          .order('position', { ascending: true })
        setCarousel((photos || []).map(p => ({ url: p.url, alt: p.alt || '', caption: p.caption || '' })))
      } else {
        setCarousel([])
      }

      const { data: rank } = await supabase
        .from('v_ranking_current')
        .select('participant_id,name,team_name,external_total,penalty_total,score,rank')
        .order('rank', { ascending: true })

      // Día(s) más travieso(s)
      const { data: naughty } = await supabase
        .from('v_stats_naughty_day')
        .select('day, negative_sum, negatives_count')
        .order('day', { ascending: false })

      setParticipants(parts || [])
      setPenalties(pens || [])
      setRankingRows(rank || [])
      setNaughtyDays(naughty || [])
    } catch (e) {
      console.error('load() error', e)
      setParticipants([]); setPenalties([]); setCarousel([]); setRankingRows([]); setNaughtyDays([])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  // Totales por participante
  const totals = useMemo(() => {
    const map = Object.fromEntries(participants.map(p => [p.id, 0]))
    for (const pen of penalties) {
      if (map[pen.participant_id] !== undefined) map[pen.participant_id] += Number(pen.amount) || 0
    }
    return map
  }, [participants, penalties])

  // Desglose por participante
  const breakdown = useMemo(() => {
    const map = Object.fromEntries(participants.map(p => [p.id, { sanciones: 0, sancionesTotal: 0, bonificaciones: 0, bonificacionesTotal: 0 }]))
    for (const pen of penalties) {
      const entry = map[pen.participant_id]; if (!entry) continue
      const amount = Number(pen.amount) || 0
      if (amount < 0) { entry.sanciones++; entry.sancionesTotal += amount }
      else if (amount > 0) { entry.bonificaciones++; entry.bonificacionesTotal += amount }
    }
    return map
  }, [participants, penalties])

  // Desglose global
  const globalBreakdown = useMemo(() => {
    let sanciones = 0, sancionesTotal = 0, bonificaciones = 0, bonificacionesTotal = 0
    let totalCount = 0, totalSum = 0
    for (const pen of penalties) {
      const amount = Number(pen.amount) || 0
      totalCount++; totalSum += amount
      if (amount < 0) { sanciones++; sancionesTotal += amount }
      else if (amount > 0) { bonificaciones++; bonificacionesTotal += amount }
    }
    return { sanciones, sancionesTotal, bonificaciones, bonificacionesTotal, totalCount, totalSum }
  }, [penalties])

  // Historial unido + orden
  const rows = useMemo(() => {
    const joined = penalties.map(p => {
      const part = participants.find(pp => pp.id === p.participant_id)
      return { ...p, _name: part?.name || '', _team: part?.team_name || '', _photo: part?.photo_url || '', _date: p.date ? new Date(p.date) : null }
    })
    const dir = sortDir === 'asc' ? 1 : -1
    joined.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a._name.localeCompare(b._name) * dir
        case 'team': return a._team.localeCompare(b._team) * dir
        case 'amount': return ((a.amount || 0) - (b.amount || 0)) * dir
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

  // Ranking
  const ranking = useMemo(() => {
    const r = (rankingRows || []).slice().sort((a, b) => (a.rank || 999) - (b.rank || 999))
    return r.map(row => {
      const p = participants.find(pp => pp.id === row.participant_id)
      return {
        id: row.participant_id,
        name: row.name,
        team_name: row.team_name,
        photo_url: p?.photo_url || '',
        ext: Number(row.external_total) || 0,
        pen: Number(row.penalty_total) || 0,
        score: Number(row.score) || 0,
        rank: Number(row.rank) || 0,
      }
    })
  }, [rankingRows, participants])

  const podium = useMemo(() => ranking.slice(0, 3), [ranking])
  const tailTwo = useMemo(() => ranking.slice(-2), [ranking])
  const middlePack = useMemo(() => ranking.slice(3, Math.max(3, ranking.length - 2)), [ranking])

  // Carrusel
  const carouselPhotos = useMemo(() => carousel, [carousel])

  // Toast + confetti
  function showToast(message) {
    const el = document.createElement('div')
    el.textContent = message
    el.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg z-[10000]'
    document.body.appendChild(el); setTimeout(() => el.remove(), 1800)
  }
  function celebrateChampion() { blastConfetti({ originY: 0.7, particleCount: 180 }); showToast('🏆 ¡Campeón!') }

  // Modal detalle
  const [detailParticipant, setDetailParticipant] = useState(null)
  const openDetail = (p) => { setLightboxUrl(null); setDetailParticipant(p) }
  const closeDetail = () => setDetailParticipant(null)

  // Cierre con ESC y bloqueo del scroll del body
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && closeDetail()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => {
    if (detailParticipant) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [detailParticipant])

  // ==============================
  //  Estadísticas (frontend): empates y listas completas + días con más sanciones (nº)
  // ==============================
  const stats = useMemo(() => {
    const base = {
      mostSanctions: { names: [], count: 0 },
      leastSanctions: { names: [], count: 0 },
      worstPenalties: [],   // [{pen, participant}]
      mostBonuses: { names: [], count: 0 },
      biggestBonuses: [],   // [{pen, participant}]
      naughtyCountDays: []  // [{ day: 'YYYY-MM-DD', negatives_count: N, negative_sum: -X }]
    }
    if (!participants?.length) return base

    // Conteos y extremos
    const negCount = Object.fromEntries(participants.map(p => [p.id, 0]))
    const posCount = Object.fromEntries(participants.map(p => [p.id, 0]))
    let minNegAmount = null
    let maxPosAmount = null

    // Para el cálculo por día (máximo nº de sanciones)
    const perDay = new Map() // día -> { count, sum }

    for (const pen of penalties || []) {
      const amount = Number(pen.amount) || 0
      if (amount < 0) {
        // Conteos por participante
        negCount[pen.participant_id] = (negCount[pen.participant_id] || 0) + 1
        if (minNegAmount === null || amount < minNegAmount) minNegAmount = amount

        // Agregado por día (solo sanciones negativas)
        if (pen.date) {
          const day = new Date(pen.date).toISOString().slice(0, 10) // YYYY-MM-DD
          const prev = perDay.get(day) || { count: 0, sum: 0 }
          prev.count += 1
          prev.sum += amount
          perDay.set(day, prev)
        }
      } else if (amount > 0) {
        posCount[pen.participant_id] = (posCount[pen.participant_id] || 0) + 1
        if (maxPosAmount === null || amount > maxPosAmount) maxPosAmount = amount
      }
    }

    const negEntries = Object.entries(negCount)
    const maxNeg = Math.max(0, ...negEntries.map(([, c]) => c))
    const minNeg = Math.min(...negEntries.map(([, c]) => c))

    const mostNames = negEntries
      .filter(([, c]) => c === maxNeg)
      .map(([id]) => participants.find(p => p.id === id)?.name || '—')

    const leastNames = negEntries
      .filter(([, c]) => c === minNeg)
      .map(([id]) => participants.find(p => p.id === id)?.name || '—')

    const maxPos = Math.max(0, ...Object.values(posCount))
    const mostBonusNames = Object.entries(posCount)
      .filter(([, c]) => c === maxPos && c > 0)
      .map(([id]) => participants.find(p => p.id === id)?.name || '—')

    // Empates de peor sanción (mismo importe mínimo)
    const worstPenalties = (minNegAmount === null)
      ? []
      : (penalties || [])
        .filter(p => Number(p.amount) === minNegAmount)
        .map(p => ({ pen: p, participant: participants.find(pp => pp.id === p.participant_id) }))

    // Empates de mayor bonificación (mismo importe máximo)
    const biggestBonuses = (maxPosAmount === null)
      ? []
      : (penalties || [])
        .filter(p => Number(p.amount) === maxPosAmount)
        .map(p => ({ pen: p, participant: participants.find(pp => pp.id === p.participant_id) }))

    // Días con MÁS sanciones (por número) — empates incluidos
    let naughtyCountDays = []
    if (perDay.size > 0) {
      let maxCount = 0
      for (const { count } of perDay.values()) {
        if (count > maxCount) maxCount = count
      }
      for (const [day, { count, sum }] of perDay.entries()) {
        if (count === maxCount) naughtyCountDays.push({ day, negatives_count: count, negative_sum: sum })
      }
      // Orden descendente por fecha
      naughtyCountDays.sort((a, b) => (a.day < b.day ? 1 : -1))
    }

    return {
      mostSanctions: { names: mostNames, count: maxNeg },
      leastSanctions: { names: leastNames, count: minNeg },
      worstPenalties,
      mostBonuses: { names: mostBonusNames, count: maxPos },
      biggestBonuses,
      naughtyCountDays
    }
  }, [participants, penalties])

  // ==============================
  //  RENDER
  // ==============================
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
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-4 flex items-center justify-end gap-3">
          <ConfettiButton>Modo fiesta</ConfettiButton>
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <KonamiEasterEgg />

        {/* Galería de la Liga (Carrusel opcional) */}
        <section>
          <SectionHeader
            title="Galería de la Liga"
            subtitle="Momentazos y cromos de la leyenda"
            collapsed={collapsedGallery}
            onToggle={() => setCollapsedGallery(v => !v)}
          />
          <AnimatePresence initial={false}>
            {!collapsedGallery && SHOW_CAROUSEL && Array.isArray(carouselPhotos) && carouselPhotos.length > 0 && (
              <motion.div
                key="gallery-body"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="mt-4"
              >
                <PhotoCarousel photos={carouselPhotos} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-600 dark:text-slate-300">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Cargando datos…
          </div>
        ) : (
          <>
            {/* Ranking actual */}
            <section>
              <SectionHeader
                title="Ranking actual"
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
                    {/* Podio */}
                    <div className="glass border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                      <div className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" /> El podio
                      </div>
                      <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:items-end sm:justify-items-center">
                        {/* Plata */}
                        <div className="text-center order-2 sm:order-none sm:col-start-1 w-full">
                          {podium[1] && (
                            <div className="glass border border-slate-200 dark:border-slate-700 rounded-2xl p-4 card-float mx-auto max-w-[280px]">
                              <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 dark:from-slate-600 dark:to-slate-400 flex items-center justify-center text-white shadow">
                                <Medal className="w-7 h-7" />
                              </div>
                              <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">Premio bote: <strong>30%</strong></div>
                              <div className="mt-2 font-semibold">{podium[1].name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{podium[1].team_name || 'Equipo'}</div>
                              <div className="mt-2 text-sm">
                                <span className="text-slate-700 dark:text-slate-300">Puntos: </span>
                                <span className={signTextClass(podium[1].score)}>{fmtSigned(podium[1].score)}</span>
                              </div>
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Puntos Fantasy: <span className="font-medium">{fmtSigned(podium[1].ext)}</span> · <span title="Bonificaciones − Sanciones">Ajuste:</span> <span className={signTextClass(podium[1].pen)}>{fmtSigned(podium[1].pen)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Oro */}
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
                                <div className="mx-auto w-16 h-16 aspect-square rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-white shadow">
                                  <Trophy className="w-8 h-8" />
                                </div>
                                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">Premio bote: <strong>50%</strong></div>
                                <div className="mt-2 font-bold text-lg">{podium[0].name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{podium[0].team_name || 'Equipo'}</div>
                                <div className="mt-2">
                                  <span className="text-slate-700 dark:text-slate-300 text-sm">Puntos: </span>
                                  <span className={signTextClass(podium[0].score)}>{fmtSigned(podium[0].score)}</span>
                                </div>
                                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  Puntos Fantasy: <span className="font-medium">{fmtSigned(podium[0].ext)}</span> · <span title="Bonificaciones − Sanciones">Ajuste:</span> <span className={signTextClass(podium[0].pen)}>{fmtSigned(podium[0].pen)}</span>
                                </div>
                              </motion.div>
                            </button>
                          )}
                        </div>

                        {/* Bronce */}
                        <div className="text-center order-3 sm:order-none sm:col-start-3 w-full">
                          {podium[2] && (
                            <div className="glass border border-slate-200 dark:border-slate-700 rounded-2xl p-4 card-float mx-auto max-w-[280px]">
                              <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-amber-800 to-orange-700 flex items-center justify-center text-white shadow">
                                <Medal className="w-7 h-7" />
                              </div>
                              <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">Premio bote: <strong>20%</strong></div>
                              <div className="mt-2 font-semibold">{podium[2].name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{podium[2].team_name || 'Equipo'}</div>
                              <div className="mt-2 text-sm">
                                <span className="text-slate-700 dark:text-slate-300">Puntos: </span>
                                <span className={signTextClass(podium[2].score)}>{fmtSigned(podium[2].score)}</span>
                              </div>
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Puntos Fantasy: <span className="font-medium">{fmtSigned(podium[2].ext)}</span> · <span title="Bonificaciones − Sanciones">Ajuste:</span> <span className={signTextClass(podium[2].pen)}>{fmtSigned(podium[2].pen)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pelotón */}
                    {middlePack.length > 0 && (
                      <div className="glass border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                        <div className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Users className="w-6 h-6" /> El pelotón
                        </div>
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
                              <div className="text-right">
                                <div className={['text-sm font-semibold', signTextClass(p.score)].join(' ')}>{fmtSigned(p.score)}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  Puntos Fantasy: <span className="font-medium">{fmtSigned(p.ext)}</span> · <span title="Bonificaciones − Sanciones">Ajuste:</span> <span className={signTextClass(p.pen)}>{fmtSigned(p.pen)}</span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Farolillo rojo */}
                    {tailTwo.length > 0 && (
                      <div className="glass border border-rose-300/70 dark:border-rose-700/70 rounded-2xl p-4">
                        <div className="text-sm font-semibold mb-2 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                          <ThumbsDown className="w-6 h-6" /> Escarnio público (los dos últimos)
                        </div>
                        <ul className="divide-y divide-rose-200/60 dark:divide-rose-800/60">
                          {tailTwo.map(p => (
                            <li key={p.id} className="py-2 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 text-xs rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                                  {p.rank || (ranking.findIndex(r => r.id === p.id) + 1)}
                                </div>
                                <div>
                                  <div className="font-semibold text-rose-700 dark:text-rose-300">{p.name}</div>
                                  <div className="text-xs text-rose-600/90 dark:text-rose-400/90">{p.team_name || 'Equipo'}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-rose-700 dark:text-rose-300">{fmtSigned(p.score)}</div>
                                <div className="text-xs text-rose-700/90 dark:text-rose-300/90">
                                  Puntos Fantasy: <span className="font-medium">{fmtSigned(p.ext)}</span> · <span title="Bonificaciones − Sanciones">Ajuste:</span> <span className={signTextClass(p.pen)}>{fmtSigned(p.pen)}</span>
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

            {/* Resumen por participante (cards → modal) */}
            <section>
              <SectionHeader
                title="Resumen por participante"
                collapsed={collapsedSummary}
                onToggle={() => setCollapsedSummary(v => !v)}
              />

              <AnimatePresence initial={false}>
                {!collapsedSummary && (
                  <>
                    {/* Totales globales */}
                    <motion.div
                      key="summary-totals"
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                      className="mt-3 flex items-center gap-4 text-sm flex-wrap"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 dark:text-slate-300">Sanciones:</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {globalBreakdown.sanciones} [<span className={signTextClass(globalBreakdown.sancionesTotal)}>{fmtSigned(globalBreakdown.sancionesTotal)}</span>]
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 dark:text-slate-300">Bonificaciones:</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {globalBreakdown.bonificaciones} [<span className={signTextClass(globalBreakdown.bonificacionesTotal)}>{fmtSigned(globalBreakdown.bonificacionesTotal)}</span>]
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 dark:text-slate-300">Total global:</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {globalBreakdown.totalCount} [<span className={signTextClass(globalBreakdown.totalSum)}>{fmtSigned(globalBreakdown.totalSum)}</span>]
                        </span>
                      </div>
                    </motion.div>

                    {/* Grid de tarjetas */}
                    <motion.div
                      key="summary-grid"
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                      className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      {participants.map((p, idx) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.04 }}
                          onClick={() => { openDetail(p) }}
                          className="cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openDetail(p)}
                        >
                          <Card className="glass card-float hover:shadow-lg hover:-translate-y-0.5 transition">
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-3">
                                <div
                                  onClick={(e) => { e.stopPropagation(); p.photo_url && setLightboxUrl(p.photo_url) }}
                                  className={p.photo_url ? 'cursor-zoom-in' : ''}
                                >
                                  <Avatar src={p.photo_url} alt={p.name} fallback={initials(p.name)} size="lg" />
                                </div>
                                <div>
                                  <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
                                  <div className="text-xs text-slate-600 dark:text-slate-400 truncate">{p.team_name || 'Equipo sin nombre'}</div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex items-center justify-start gap-3">
                                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Total:</span>
                                <Badge className={['px-3 py-1.5 text-lg font-bold text-white', signClass(totals[p.id] || 0)].join(' ')}>{fmtSigned(totals[p.id] || 0)}</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-700 dark:text-slate-300">Sanciones:</span>
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                  {(breakdown[p.id]?.sanciones || 0)} [<span className={signTextClass(breakdown[p.id]?.sancionesTotal || 0)}>{fmtSigned(breakdown[p.id]?.sancionesTotal || 0)}</span>]
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-700 dark:text-slate-300">Bonificaciones:</span>
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                  {(breakdown[p.id]?.bonificaciones || 0)} [<span className={signTextClass(breakdown[p.id]?.bonificacionesTotal || 0)}>{fmtSigned(breakdown[p.id]?.bonificacionesTotal || 0)}</span>]
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </section>

            {/* Historial */}
            <section className="mt-10">
              <SectionHeader
                title="Historial"
                subtitle="Consulta detallada ordenable y filtrable"
                collapsed={collapsedHistory}
                onToggle={() => setCollapsedHistory(v => !v)}
              />
              <AnimatePresence initial={false}>
                {!collapsedHistory && (
                  <motion.div key="history-body" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="mt-4">
                    <div className="mt-4 pb-4 grid gap-3 lg:grid-cols-4">
                      <div className="lg:col-span-2">
                        <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1">Participante</label>
                        <Select
                          value={filterParticipantId}
                          onChange={v => setFilterParticipantId(v)}
                          options={[{ value: 'all', label: 'Todos' }, ...participants.map(p => ({ value: p.id, label: p.name }))]}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1">Ordenar por</label>
                        <Select
                          value={sortBy}
                          onChange={setSortBy}
                          options={[
                            { value: 'date', label: 'Fecha' },
                            { value: 'name', label: 'Nombre participante' },
                            { value: 'team', label: 'Nombre equipo' },
                            { value: 'amount', label: 'Penalización' }
                          ]}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1">Dirección</label>
                        <Select value={sortDir} onChange={setSortDir} options={[{ value: 'asc', label: 'Ascendente' }, { value: 'desc', label: 'Descendente' }]} className="w-full" />
                      </div>
                      {(filterParticipantId !== 'all' || sortBy !== 'date' || sortDir !== 'desc') && (
                        <div className="lg:col-span-4 flex justify-end">
                          <button
                            onClick={() => { setFilterParticipantId('all'); setSortBy('date'); setSortDir('desc') }}
                            className="mt-2 text-sm px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition"
                          >
                            Limpiar filtros
                          </button>
                        </div>
                      )}
                    </div>

                    <Card className="glass card-float overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <div>
                          <CardTitle>Historial de penalizaciones</CardTitle>
                          <CardDescription>
                            Consulta detallada de sanciones y bonificaciones. Orden actual: <strong>{({ date: 'Fecha', name: 'Nombre', team: 'Equipo', amount: 'Penalización' })[sortBy]}</strong> <ArrowUpDown className="inline w-4 h-4" />
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
                                  <tr key={pen.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700">
                                    <td className="px-4 py-3">
                                      <div onClick={() => pen._photo && setLightboxUrl(pen._photo)} className={pen._photo ? 'cursor-zoom-in inline-block' : 'inline-block'}>
                                        <Avatar src={pen._photo} alt={pen._name} fallback={initials(pen._name)} />
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{pen._name || '—'}</td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{pen._team || '—'}</td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{fmtDate(pen.date)}</td>
                                    <td className="px-4 py-3"><Badge className={['text-white', signClass(pen.amount)].join(' ')}>{fmtSigned(pen.amount)}</Badge></td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">{pen.reason}</td>
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

            {/* === ESTADÍSTICAS (AL FINAL) === */}
            <section>
              <SectionHeader
                title="Estadísticas"
                subtitle="Datos curiosos, récords y villanos de la jornada 😈"
                collapsed={collapsedStats}
                onToggle={() => setCollapsedStats(v => !v)}
              />
              <AnimatePresence initial={false}>
                {!collapsedStats && (
                  <motion.div
                    key="stats-body"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="mt-4"
                  >
                    <Card className="glass card-float border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <CardHeader className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-3">
                            <BarChart2 className="w-7 h-7" /> Panel de estadísticas
                          </CardTitle>
                          <CardDescription>Quién rompe el fair play y quién va con flores 🌼</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Mayor número de penalizaciones */}
                          <div className="rounded-2xl p-5 border bg-rose-50/60 dark:bg-rose-900/20 border-rose-200/70 dark:border-rose-800/70">
                            <div className="text-base font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-3">
                              <AlertTriangle className="w-7 h-7" /> Mayor nº de sanciones
                            </div>
                            <div className="mt-2 text-xl font-extrabold text-rose-700 dark:text-rose-300">
                              {stats.mostSanctions.count} {stats.mostSanctions.count === 1 ? 'sanción' : 'sanciones'}
                            </div>
                            <div className="mt-1 text-sm text-rose-800 dark:text-rose-200">
                              {stats.mostSanctions.names.length ? stats.mostSanctions.names.join(', ') : '—'}
                            </div>
                            <div className="mt-2 text-xs text-rose-700/80 dark:text-rose-300/80">
                              ¡Menos VAR y más fair play! 😅
                            </div>
                          </div>

                          {/* Menor número de penalizaciones */}
                          <div className="rounded-2xl p-5 border bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-200/70 dark:border-emerald-800/70">
                            <div className="text-base font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-3">
                              <ThumbsUp className="w-7 h-7" /> Menor nº de sanciones
                            </div>
                            <div className="mt-2 text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                              {stats.leastSanctions.count} {stats.leastSanctions.count === 1 ? 'sanción' : 'sanciones'}
                            </div>
                            <div className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
                              {stats.leastSanctions.names.length ? stats.leastSanctions.names.join(', ') : '—'}
                            </div>
                            <div className="mt-2 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                              Gente de bien de verdad ✨
                            </div>
                          </div>

                          {/* Peor(es) sanción(es) (empates incluidos) */}
                          <div className="rounded-2xl p-5 border bg-amber-50/60 dark:bg-amber-900/20 border-amber-200/70 dark:border-amber-800/70">
                            <div className="text-base font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-3">
                              <AlertTriangle className="w-7 h-7" /> Penalización más alta
                            </div>
                            {stats.worstPenalties.length > 0 ? (
                              <ul className="mt-2 space-y-2">
                                {stats.worstPenalties.map(({ pen, participant }) => (
                                  <li key={pen.id} className="text-sm">
                                    <div className="font-bold text-amber-700 dark:text-amber-300">
                                      {participant?.name || '—'} · {fmtSigned(pen.amount)}
                                    </div>
                                    <div className="text-amber-800 dark:text-amber-200">
                                      {fmtDate(pen.date)} — {pen.reason}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="mt-2 text-sm text-amber-800 dark:text-amber-200">Sin sanciones registradas</div>
                            )}
                          </div>

                          {/* Más bonificaciones (conteo, empates) */}
                          <div className="rounded-2xl p-5 border bg-sky-50/60 dark:bg-sky-900/20 border-sky-200/70 dark:border-sky-800/70">
                            <div className="text-base font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-3">
                              <ThumbsUp className="w-7 h-7" /> Más bonificaciones (nº)
                            </div>
                            {stats.mostBonuses.count > 0 ? (
                              <>
                                <div className="mt-2 text-xl font-extrabold text-sky-700 dark:text-sky-300">
                                  {stats.mostBonuses.count} {stats.mostBonuses.count === 1 ? 'bonificación' : 'bonificaciones'}
                                </div>
                                <div className="mt-1 text-sm text-sky-800 dark:text-sky-200">
                                  {stats.mostBonuses.names.join(', ')}
                                </div>
                                <div className="mt-2 text-xs text-sky-700/80 dark:text-sky-300/80">
                                  ¡Fair play de manual! 😇
                                </div>
                              </>
                            ) : (
                              <div className="mt-2 text-sm text-sky-800 dark:text-sky-200">Sin bonificaciones por ahora</div>
                            )}
                          </div>

                          {/* Mayor(es) bonificación(es) (importe, empates) */}
                          <div className="rounded-2xl p-5 border bg-violet-50/60 dark:bg-violet-900/20 border-violet-200/70 dark:border-violet-800/70">
                            <div className="text-base font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-3">
                              <ThumbsUp className="w-7 h-7" /> Bonificación más grande
                            </div>
                            {stats.biggestBonuses.length > 0 ? (
                              <ul className="mt-2 space-y-2">
                                {stats.biggestBonuses.map(({ pen, participant }) => (
                                  <li key={pen.id} className="text-sm">
                                    <div className="font-bold text-violet-700 dark:text-violet-300">
                                      {participant?.name || '—'} · {fmtSigned(pen.amount)}
                                    </div>
                                    <div className="text-violet-800 dark:text-violet-200">
                                      {fmtDate(pen.date)} — {pen.reason}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="mt-2 text-sm text-violet-800 dark:text-violet-200">Sin bonificaciones registradas</div>
                            )}
                          </div>

                          {/* Día(s) con MÁS sanciones por número (frontend) */}
                          <div className="rounded-2xl p-5 border bg-rose-50/60 dark:bg-rose-900/20 border-rose-200/70 dark:border-rose-800/70">
                            <div className="text-base font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-3">
                              <Calendar className="w-7 h-7" /> Días con más sanciones
                            </div>

                            {Array.isArray(stats.naughtyCountDays) && stats.naughtyCountDays.length > 0 ? (
                              <>
                                {stats.naughtyCountDays.map((d, idx) => (
                                  <div
                                    key={idx}
                                    className={idx > 0 ? 'mt-3 pt-3 border-t border-rose-200/60 dark:border-rose-800/60' : 'mt-2'}
                                  >
                                    <div className="text-base font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                                      <Calendar className="w-5 h-5" />
                                      {new Date(d.day).toLocaleDateString()}
                                    </div>
                                    <div className="text-sm text-rose-800 dark:text-rose-200">
                                      Nº sanciones: <span className="font-semibold">{d.negatives_count}</span>
                                      {typeof d.negative_sum === 'number' && (
                                        <> · Suma negativa: <span className="font-semibold">{d.negative_sum}</span></>
                                      )}
                                    </div>
                                    <div className="mt-1 text-xs text-rose-700/80 dark:text-rose-300/80">
                                      Día movidito en los despachos… 📣
                                    </div>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div className="mt-2 text-sm text-rose-800 dark:text-rose-200">
                                Aún no hay suficientes sanciones para destacar un día.
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Lightbox foto */}
            {lightboxUrl && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setLightboxUrl(null)}>
                <img src={lightboxUrl} alt="Foto ampliada" className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-lg" />
              </div>
            )}

            {/* ===== MODAL DETALLE PARTICIPANTE ===== */}
            {detailParticipant && (
              <div
                className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center sm:px-4"
                onClick={closeDetail}
                role="dialog"
                aria-modal="true"
                aria-labelledby="participant-modal-title"
              >
                {/* Contenedor: fullscreen móvil, centrado en desktop */}
                <div
                  className={[
                    'w-full h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-3xl',
                    'bg-white dark:bg-slate-900',
                    'rounded-none sm:rounded-2xl shadow-2xl ring-1 ring-slate-200/60 dark:ring-slate-800/60',
                    'overflow-hidden flex flex-col'
                  ].join(' ')}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Cabecera fija */}
                  <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 flex-none">
                    <div>
                      <h3 id="participant-modal-title" className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                        {detailParticipant.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {detailParticipant.team_name || 'Equipo sin nombre'}
                      </p>
                    </div>
                    <button
                      onClick={closeDetail}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-sm"
                      aria-label="Cerrar"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Contenido scrollable */}
                  <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5">
                    {/* Banner de posición */}
                    {(() => {
                      const rk = ranking.find(r => r.id === detailParticipant.id)
                      const pos = rk?.rank
                      const total = ranking.length
                      const styles = rankStyle(pos, total)
                      return (
                        <div className={['mb-5 rounded-xl px-4 py-3 border', styles.container, 'border-slate-200/70 dark:border-slate-800/60'].join(' ')}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className={['inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-sm font-bold', styles.badge].join(' ')}>
                                #{pos || '—'}
                              </span>
                              <span className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100">
                                {rankPhrase(pos, total)}
                              </span>
                            </div>
                            {pos && pos <= 3 && (
                              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                {pos === 1 ? 'Premio del bote: 50%' : pos === 2 ? 'Premio del bote: 30%' : 'Premio del bote: 20%'}
                              </div>
                            )}
                            {pos && (pos === total || pos === total - 1) && (
                              <div className="text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                                Escarnio público garantizado
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Grid de fotos (responsive) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                      {/* Foto del equipo */}
                      <div className="glass rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                        <div className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Foto del equipo</div>
                        <div className="aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                          {detailParticipant.photo_url ? (
                            <img src={detailParticipant.photo_url} alt={`Equipo de ${detailParticipant.name}`} className="object-cover w-full h-full" loading="lazy" />
                          ) : (<span className="text-slate-400 text-sm flex items-center justify-center h-full">Sin imagen</span>)}
                        </div>
                      </div>

                      {/* Foto real */}
                      <div className="glass rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                        <div className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Foto real</div>
                        <div className="aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                          {detailParticipant.photo_real_url ? (
                            <img src={detailParticipant.photo_real_url} alt={`Foto real de ${detailParticipant.name}`} className="object-cover w-full h-full" loading="lazy" />
                          ) : (<span className="text-slate-400 text-sm flex items-center justify-center h-full">Sin imagen</span>)}
                        </div>
                      </div>

                      {/* Entrenador de referencia */}
                      <div className="glass rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                        <div className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Entrenador de referencia</div>
                        <div className="aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                          {detailParticipant.coach_photo_url ? (
                            <img src={detailParticipant.coach_photo_url} alt={`Entrenador de referencia de ${detailParticipant.name}`} className="object-cover w-full h-full" loading="lazy" />
                          ) : (<span className="text-slate-400 text-sm flex items-center justify-center h-full">Sin imagen</span>)}
                        </div>
                        <div className="mt-3 text-sm">
                          <span className="text-slate-500 dark:text-slate-400 mr-1">Referente:</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {detailParticipant.ref_coach || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* fin contenido scrollable */}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-600 dark:text-slate-400">
        Desarrollado con <span className="mx-1">❤️</span> por el <strong>Dictador del Fantasy</strong>
      </footer>
    </div>
  )
}