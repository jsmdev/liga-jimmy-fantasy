// ==============================
//  APP PRINCIPAL – Liga Jimmy Fantasy
// ==============================
import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Loader2, ArrowUpDown,
  Trophy, Medal, ThumbsDown, Crown, Users,
  BarChart2, AlertTriangle, ThumbsUp, Calendar, Flame,
  Gavel, ShieldCheck, Skull, Sparkles, Gem, CalendarX,
  Home, Book, PieChart
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
import { Routes, Route, Link, useLocation } from "react-router-dom"
import Rules from "./Rules"
import Stats from "./pages/Stats"
import SectionHeader from '@/components/SectionHeader.jsx'

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

// StatDuo: Top 2 con “chip + barras” y medallón de valor.
// variant: 'infernal' | 'luminous' (default: luminous)
// type: 'count' | 'amount'
function StatDuo({ rows, type = 'count', variant = 'luminous' }) {
  const r = Array.isArray(rows) ? rows.slice(0, 2) : []

  const theme = variant === 'infernal'
    ? {
      chipGold: 'bg-rose-600 text-white dark:bg-rose-700',
      chipSilver: 'bg-rose-300 text-rose-900 dark:bg-rose-400',
      barGold: 'from-rose-200/80 to-rose-300/60 dark:from-rose-900/40 dark:to-rose-800/30',
      barSilver: 'from-rose-100/80 to-rose-200/60 dark:from-rose-950/40 dark:to-rose-900/30',
      ringGold: 'ring-rose-300 dark:ring-rose-700',
      ringSilver: 'ring-rose-200 dark:ring-rose-800',
    }
    : {
      chipGold: 'bg-amber-400 text-amber-950',
      chipSilver: 'bg-slate-300 text-slate-900 dark:bg-slate-400',
      barGold: 'from-amber-200/80 to-yellow-300/60 dark:from-amber-900/40 dark:to-yellow-900/30',
      barSilver: 'from-slate-200/80 to-slate-300/60 dark:from-slate-800/40 dark:to-slate-700/30',
      ringGold: 'ring-amber-300 dark:ring-amber-700',
      ringSilver: 'ring-slate-300 dark:ring-slate-600',
    }

  const Chip = ({ idx }) => (
    <span
      className={[
        'shrink-0 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide',
        idx === 0 ? theme.chipGold : theme.chipSilver,
      ].join(' ')}
    >
      {variant === 'infernal' ? (idx === 0 ? '🔥 Infierno' : '😈 Averno') : (idx === 0 ? 'Oro' : 'Plata')}
    </span>
  )

  const ValueMedal = ({ idx, v }) => (
    <span
      className={[
        'shrink-0 inline-flex items-center justify-center rounded-xl px-3 py-1.5',
        'text-sm md:text-base font-extrabold shadow-sm ring-1',
        idx === 0
          ? (variant === 'infernal'
            ? `bg-rose-50/95 text-rose-900 ${theme.ringGold} dark:bg-rose-900/30 dark:text-rose-200`
            : `bg-amber-50/95 text-amber-900 ${theme.ringGold} dark:bg-amber-900/30 dark:text-amber-200`)
          : (variant === 'infernal'
            ? `bg-rose-50/80 text-rose-900 ${theme.ringSilver} dark:bg-rose-950/30 dark:text-rose-100`
            : `bg-slate-50/90 text-slate-900 ${theme.ringSilver} dark:bg-slate-800/40 dark:text-slate-100`),
      ].join(' ')}
    >
      {type === 'count' ? `×${v}` : fmtSigned(v)}
    </span>
  )

  const Bar = ({ idx, labels, value }) => (
    <div
      className={[
        'flex-1 rounded-xl px-3 py-2 border bg-gradient-to-r',
        idx === 0 ? theme.barGold : theme.barSilver,
        'border-slate-200 dark:border-slate-700',
        'flex items-stretch gap-3 min-h-[3.75rem]',
      ].join(' ')}
    >
      <div className="flex items-center">
        <Chip idx={idx} />
      </div>
      <div className="flex-1 flex items-center justify-between gap-3">
        <div className="text-sm text-slate-800 dark:text-slate-200 leading-snug w-full">
          <ul className="space-y-0.5">
            {(labels || []).map((label, i) => <li key={i}>{label}</li>)}
          </ul>
        </div>
        <ValueMedal idx={idx} v={value} />
      </div>
    </div>
  )

  if (!r.length) return <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">—</div>

  return (
    <div className="mt-3 flex flex-col gap-2">
      {r.map((row, idx) => (
        <Bar key={idx} idx={idx} labels={row.labels} value={row.value} />
      ))}
    </div>
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
  const [collapsedRules, setCollapsedRules] = useState(false) // Normativa

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

  // Podio del Caos: Top 3 por suma NEGATIVA total (más negativo primero)
  const worstNegPodium = useMemo(() => {
    if (!participants?.length) return []

    const rows = participants.map(p => {
      const totalNeg = (penalties || [])
        .filter(pe => pe.participant_id === p.id && Number(pe.amount) < 0)
        .reduce((acc, pe) => acc + (Number(pe.amount) || 0), 0)
      return {
        id: p.id,
        name: p.name,
        team_name: p.team_name,
        photo_url: p.photo_url || '',
        totalNeg, // negativo o 0
      }
    })
    // Orden: más negativo primero
    rows.sort((a, b) => (a.totalNeg ?? 0) - (b.totalNeg ?? 0))
    // Solo los que tengan algo negativo
    return rows.filter(r => r.totalNeg < 0).slice(0, 3)
  }, [participants, penalties])

  // ==============================
  //  Estadísticas – Top 2 (dedupe por valor) 
  // ==============================
  const statsTop2 = useMemo(() => {
    const negCount = Object.fromEntries((participants || []).map(p => [p.id, 0]))
    const posCount = Object.fromEntries((participants || []).map(p => [p.id, 0]))

    const negatives = []  // sanciones: { amount<0, name }
    const positives = []  // bonificaciones: { amount>0, name }
    const perDay = new Map() // YYYY-MM-DD -> { count }

    for (const pen of (penalties || [])) {
      const pid = pen.participant_id
      const amount = Number(pen.amount) || 0
      const part = (participants || []).find(pp => pp.id === pid)
      const name = part?.name ?? '—'

      if (amount < 0) {
        negCount[pid] = (negCount[pid] || 0) + 1
        negatives.push({ amount, name })
        if (pen.date) {
          const day = new Date(pen.date).toISOString().slice(0, 10)
          const curr = perDay.get(day) || { count: 0 }
          curr.count += 1
          perDay.set(day, curr)
        }
      } else if (amount > 0) {
        posCount[pid] = (posCount[pid] || 0) + 1
        positives.push({ amount, name })
      }
    }

    // Agrupa por valor, deduplica labels, ordena y devuelve Top N de valores distintos
    function topNByValueDistinct(entries, getValue, getLabel, sortDir = 'desc', N = 2) {
      const byValue = new Map()
      for (const e of entries) {
        const v = getValue(e)
        if (!byValue.has(v)) byValue.set(v, new Set())
        byValue.get(v).add(getLabel(e)) // ← dedupe
      }
      const values = Array.from(byValue.keys()).sort((a, b) => sortDir === 'asc' ? a - b : b - a)
      const topVals = values.slice(0, N)
      return topVals.map(v => ({ value: v, labels: Array.from(byValue.get(v)).sort() }))
    }

    const mostSanctionsTop2 = topNByValueDistinct(
      Object.entries(negCount).map(([pid, c]) => ({ pid, c })),
      e => e.c,
      e => (participants || []).find(p => p.id === e.pid)?.name ?? '—',
      'desc',
      2
    )

    const leastSanctionsTop2 = topNByValueDistinct(
      Object.entries(negCount).map(([pid, c]) => ({ pid, c })),
      e => e.c,
      e => (participants || []).find(p => p.id === e.pid)?.name ?? '—',
      'asc',
      2
    )

    const mostBonusesTop2 = topNByValueDistinct(
      Object.entries(posCount).map(([pid, c]) => ({ pid, c })),
      e => e.c,
      e => (participants || []).find(p => p.id === e.pid)?.name ?? '—',
      'desc',
      2
    )

    const worstPenaltiesTop2 = topNByValueDistinct(
      negatives,
      e => e.amount,
      e => e.name,
      'asc',
      2
    )

    const biggestBonusesTop2 = topNByValueDistinct(
      positives,
      e => e.amount,
      e => e.name,
      'desc',
      2
    )

    const daysMostSanctionsTop2 = topNByValueDistinct(
      Array.from(perDay.entries()).map(([day, obj]) => ({ day, count: obj.count })),
      e => e.count,
      e => e.day,
      'desc',
      2
    )

    return {
      mostSanctionsTop2,
      leastSanctionsTop2,
      mostBonusesTop2,
      worstPenaltiesTop2,
      biggestBonusesTop2,
      daysMostSanctionsTop2,
    }
  }, [participants, penalties])

  // ==============================
  //  HOME
  // ==============================
  // Componente para los enlaces de navegación
function NavigationLink({ to, icon, label }) {
  const location = useLocation()
  const isActive = location.pathname === to || (to === '/' && location.pathname === '')

  return (
    <Link
      to={to}
      className={[
        'relative flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg transition-all font-medium whitespace-nowrap',
        isActive
          ? 'bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 dark:from-indigo-500/20 dark:to-cyan-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-200/30 dark:border-indigo-500/20'
          : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/5'
      ].join(' ')}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

function HomePage() {
    return (
      <>
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
                <div
                  className="chrome-paint-fix overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"
                  style={{ minHeight: 220 }}
                >
                  <PhotoCarousel photos={carouselPhotos} />
                </div>
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

            {/* ==============================
                ESTADÍSTICAS – Lado oscuro vs lado luminoso
              ================================= */}
            <section>
              <SectionHeader
                title="Estadísticas"
                subtitle="Top 2 en todas las categorías (empates incluidos)"
                collapsed={collapsedStats}
                onToggle={() => setCollapsedStats(v => !v)}
              />
              <AnimatePresence initial={false}>
                {!collapsedStats && (
                  <motion.div
                    key="stats-groups"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="mt-4 space-y-6"
                  >
                    {/* ====== LADO OSCURO (Sanciones) ====== */}
                    <div className="glass rounded-2xl border border-rose-300/70 dark:border-rose-700/70 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950 dark:to-rose-900 shadow-sm">
                      {/* Cabecera del grupo */}
                      <div className="px-4 py-3 border-b border-rose-200/60 dark:border-rose-800/60 flex items-center gap-2">
                        <Skull className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300">El lado oscuro (sanciones)</h3>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* --- Podio del caos (arriba) --- */}
                        {worstNegPodium.length > 0 && (
                          <div className="glass border border-rose-300/70 dark:border-rose-700/70 rounded-2xl p-4">
                            <div className="text-sm font-semibold mb-2 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                              <Flame className="w-5 h-5" /> Podio del caos
                            </div>

                            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:items-end sm:justify-items-center">
                              {/* Plata */}
                              <div className="text-center order-2 sm:order-none sm:col-start-1 w-full">
                                {worstNegPodium[1] && (
                                  <div className="glass border border-rose-300/60 dark:border-rose-700/60 rounded-2xl p-4 card-float mx-auto max-w-[280px]">
                                    <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white shadow">
                                      <Skull className="w-7 h-7" />
                                    </div>
                                    <div className="mt-2 font-semibold">{worstNegPodium[1].name}</div>
                                    <div className="text-xs text-rose-700/80 dark:text-rose-300/80">{worstNegPodium[1].team_name || 'Equipo'}</div>
                                    <div className="mt-2 text-sm">
                                      <span className="text-slate-700 dark:text-slate-300">Suma sanciones: </span>
                                      <span className={signTextClass(worstNegPodium[1].totalNeg)}>{fmtSigned(worstNegPodium[1].totalNeg)}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-rose-700/80 dark:text-rose-300/80">“Reincidente con estilo” 😅</div>
                                  </div>
                                )}
                              </div>

                              {/* Oro */}
                              <div className="text-center order-1 sm:order-none sm:col-start-2 w-full">
                                {worstNegPodium[0] && (
                                  <div className="glass border border-rose-400 dark:border-rose-600 rounded-2xl p-5 card-float shadow-lg mx-auto max-w-[300px]">
                                    <div className="mx-auto w-16 h-16 aspect-square rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white shadow">
                                      <Flame className="w-8 h-8" />
                                    </div>
                                    <div className="mt-2 font-bold text-lg">{worstNegPodium[0].name}</div>
                                    <div className="text-xs text-rose-700/80 dark:text-rose-300/80">{worstNegPodium[0].team_name || 'Equipo'}</div>
                                    <div className="mt-2">
                                      <span className="text-slate-700 dark:text-slate-300 text-sm">Suma sanciones: </span>
                                      <span className={signTextClass(worstNegPodium[0].totalNeg)}>{fmtSigned(worstNegPodium[0].totalNeg)}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-rose-700/90 dark:text-rose-300/90">“Capitán del caos absoluto” 🔥</div>
                                  </div>
                                )}
                              </div>

                              {/* Bronce */}
                              <div className="text-center order-3 sm:order-none sm:col-start-3 w-full">
                                {worstNegPodium[2] && (
                                  <div className="glass border border-rose-300/60 dark:border-rose-700/60 rounded-2xl p-4 card-float mx-auto max-w-[280px]">
                                    <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white shadow">
                                      <Skull className="w-7 h-7" />
                                    </div>
                                    <div className="mt-2 font-semibold">{worstNegPodium[2].name}</div>
                                    <div className="text-xs text-rose-700/80 dark:text-rose-300/80">{worstNegPodium[2].team_name || 'Equipo'}</div>
                                    <div className="mt-2 text-sm">
                                      <span className="text-slate-700 dark:text-slate-300">Suma sanciones: </span>
                                      <span className={signTextClass(worstNegPodium[2].totalNeg)}>{fmtSigned(worstNegPodium[2].totalNeg)}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-rose-700/80 dark:text-rose-300/80">“Aprendiz de villano” 😈</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tarjetas negativas: grid 3 */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Mayor nº de sanciones */}
                          <div className="glass rounded-2xl p-4 border border-rose-200/70 dark:border-rose-700/70">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                              <Gavel className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                              Mayor nº de sanciones
                            </div>
                            <StatDuo rows={statsTop2.mostSanctionsTop2} type="count" variant="infernal" />
                          </div>

                          {/* Sanciones más altas (importe) */}
                          <div className="glass rounded-2xl p-4 border border-rose-200/70 dark:border-rose-700/70">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                              <Skull className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                              Sanciones más altas
                            </div>
                            <StatDuo rows={statsTop2.worstPenaltiesTop2} type="amount" variant="infernal" />
                          </div>

                          {/* Días con más sanciones (nº) */}
                          <div className="glass rounded-2xl p-4 border border-rose-200/70 dark:border-rose-700/70">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                              <CalendarX className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                              Días con más sanciones
                            </div>
                            <StatDuo rows={statsTop2.daysMostSanctionsTop2} type="count" variant="infernal" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ====== LADO LUMINOSO (Bonificaciones y fair play) ====== */}
                    <div className="glass rounded-2xl border border-emerald-300/70 dark:border-emerald-700/70 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 shadow-sm">                      {/* Cabecera del grupo */}
                      <div className="px-4 py-3 border-b border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">El lado luminoso (bonificaciones)</h3>
                      </div>

                      <div className="p-4">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Menor nº de sanciones */}
                          <div className="glass rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              Menor nº de sanciones
                            </div>
                            <StatDuo rows={statsTop2.leastSanctionsTop2} type="count" />
                          </div>

                          {/* Mayor nº de bonificaciones */}
                          <div className="glass rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              Mayor nº de bonificaciones
                            </div>
                            <StatDuo rows={statsTop2.mostBonusesTop2} type="count" />
                          </div>

                          {/* Bonificaciones más altas (importe) */}
                          <div className="glass rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                              <Gem className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              Bonificaciones más altas
                            </div>
                            <StatDuo rows={statsTop2.biggestBonusesTop2} type="amount" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Normativa */}
            <section>
              <SectionHeader
                title="Normativa"
                subtitle="Reglamento oficial de la competición"
                collapsed={collapsedRules}
                onToggle={() => setCollapsedRules(v => !v)}
              />
              <AnimatePresence initial={false}>
                {!collapsedRules && (
                  <motion.div
                    key="rules-body"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="mt-4"
                  >
                    {/* Pasa aquí la URL pública del PDF si quieres mostrar el botón de descarga */}
                    <Rules pdfUrl={import.meta.env.VITE_RULES_PDF_URL /* o undefined */} />
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
      </>
    )
  }

  // ==============================
  //  RENDER
  // ==============================
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Logo y título */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-title">{TITLE}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">{SUBTITLE}</p>
              <div className="mt-2 sm:mt-3 gradient-bar" />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-4">
              {/* Enlaces de navegación */}
              {/* Enlaces de navegación */}
              <nav className="flex flex-wrap items-center gap-2 text-sm p-1.5 bg-gradient-to-r from-slate-100/90 to-slate-50/80 dark:from-slate-800/90 dark:to-slate-800/60 rounded-xl shadow-sm">
                <NavigationLink to="/" icon={<Home className="w-4 h-4" />} label="Inicio" />
                <NavigationLink to="/stats" icon={<PieChart className="w-4 h-4" />} label="Stats" />
                <NavigationLink to="/rules" icon={<Book className="w-4 h-4" />} label="Reglas" />
              </nav>

              {/* Controles */}
              <div className="flex items-center gap-2 shrink-0">
                <ConfettiButton>Modo fiesta</ConfettiButton>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-600 dark:text-slate-400">
        Desarrollado con <span className="mx-1">❤️</span> por el <strong>Dictador del Fantasy</strong>
      </footer>
    </div>
  )
}