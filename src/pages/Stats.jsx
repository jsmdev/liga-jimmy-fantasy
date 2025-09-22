// ==============================
// File: src/pages/Stats.jsx
// ==============================
import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart2, TrendingUp, TrendingDown, Trophy, Eye, EyeOff, Medal, PlaySquare, Info, X } from 'lucide-react'

import SectionHeader from '@/components/SectionHeader.jsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card.jsx'
import Select from '@/components/ui/Select.jsx'
import Badge from '@/components/ui/Badge.jsx'
import { supabase } from '@/lib/supabaseClient.js'

// Helpers locales (idénticos a Home para coherencia visual)
function signTextClass(n){ if(n>0) return 'text-emerald-700 dark:text-emerald-400'; if(n<0) return 'text-rose-700 dark:text-rose-400'; return 'text-slate-900 dark:text-slate-100'}
function fmtSigned(n){ return n>0?('+'+n):String(n) }
function formatOrdinal(n){ return (Number.isFinite(n) && n>0) ? `${n}º` : '—' }

export default function Stats(){
  const [loading, setLoading] = useState(true)
  const [participants, setParticipants] = useState([])
  const [byGw, setByGw] = useState([]) // filas: { gw, participant_id, name, rank }
  const [officialRanking, setOfficialRanking] = useState([])
  const [lastPlayedJornada, setLastPlayedJornada] = useState(null)

  // UI: colapsables
  const [cHistoric, setCHistoric] = useState(false)
  const [cChart, setCChart] = useState(false)
  const [cRecords, setCRecords] = useState(false)

  // UI: ajustes por sección (independientes)
  const [showAdjustedHistoric, setShowAdjustedHistoric] = useState(true)
  const [showAdjustedChart, setShowAdjustedChart] = useState(true)

  const [selectedPid, setSelectedPid] = useState('')
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 640
  })
  const [activeCell, setActiveCell] = useState(null)

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return
      setIsMobileViewport(window.innerWidth < 640)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if(!activeCell) return
    if(typeof window === 'undefined') return undefined
    const handleKeyDown = (event) => {
      if(event.key === 'Escape') setActiveCell(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeCell])

  useEffect(() => {
    async function load(){
      setLoading(true)
      try{
        const { data: parts } = await supabase
          .from('participants')
          .select('id,name,team_name')
          .order('name')

        // Obtenemos los datos de ranking por jornada directamente de scores
        const { data: times } = await supabase
          .from('scores')
          .select(`
            jornada,
            participant_id,
            participants (
              name,
              team_name
            ),
            points_external,
            points_adjustments
          `)
          .order('jornada', { ascending: true })

        // Ranking actual (con externos, ajuste y total)
        const { data: official } = await supabase
          .from('v_ranking_official')
          .select('participant_id,name,team_name,external_total,adjustment_total,score,rank,last_jornada,last_played_on')
          .order('rank', { ascending: true })

        setParticipants(parts || [])
        setByGw(times || [])
        setOfficialRanking(official || [])
        const lastJ = (official || []).reduce((max, row) => {
          const j = Number(row.last_jornada) || 0
          return j > max ? j : max
        }, 0)
        setLastPlayedJornada(lastJ || null)
        if((parts||[]).length && !selectedPid){ setSelectedPid(parts[0].id) }
      } catch(e){
        console.error('Stats load()', e)
        setParticipants([]); setByGw([]); setOfficialRanking([]); setLastPlayedJornada(null)
      } finally{ setLoading(false) }
    }
    load()
  }, [])

  // ======= Derivados =======
  const byGwFiltered = useMemo(() => {
    if (!lastPlayedJornada) return byGw || []
    return (byGw || []).filter(r => {
      const j = Number(r.jornada) || 0
      return j && j <= lastPlayedJornada
    })
  }, [byGw, lastPlayedJornada])

  const jornadas = useMemo(() => {
    const maxGw = (byGwFiltered||[]).reduce((m, r) => Math.max(m, r.jornada||0), 0)
    return Array.from({length: maxGw}, (_,i)=> i+1)
  }, [byGwFiltered])

  const participantsById = useMemo(() => {
    const map = new Map()
    for(const p of participants){
      map.set(p.id, p)
    }
    return map
  }, [participants])

  // Ranking por jornada individual (depende de showAdjustedHistoric)
  const { ranksByPid, historicCellDetails } = useMemo(() => {
    const rankMap = new Map()
    const detailMap = new Map()
    const byJornada = new Map()
    for(const r of (byGwFiltered||[])){
      if(!byJornada.has(r.jornada)) byJornada.set(r.jornada, [])
      byJornada.get(r.jornada).push({
        participant_id: r.participant_id,
        name: r.participants.name,
        team_name: r.participants.team_name,
        points_external: r.points_external || 0,
        points_adjustments: r.points_adjustments || 0
      })
    }
    const sortedJornadas = Array.from(byJornada.keys()).sort((a, b) => a - b)
    for(const jornada of sortedJornadas) {
      const scores = byJornada.get(jornada)
      const jornadaScores = scores.map(score => ({
        ...score,
        total_points: showAdjustedHistoric
          ? score.points_external + score.points_adjustments
          : score.points_external
      }))
      jornadaScores.sort((a, b) => b.total_points - a.total_points)
      jornadaScores.forEach((score, idx) => {
        if(!rankMap.has(score.participant_id)) rankMap.set(score.participant_id, Array(38).fill(null))
        if(!detailMap.has(score.participant_id)) detailMap.set(score.participant_id, Array(38).fill(null))
        rankMap.get(score.participant_id)[jornada - 1] = idx + 1
        detailMap.get(score.participant_id)[jornada - 1] = {
          rank: idx + 1,
          jornada,
          pointsBase: score.points_external,
          pointsAdjustments: score.points_adjustments,
          pointsTotal: score.total_points,
          pointsTotalAdjusted: score.points_external + score.points_adjustments,
          isAdjusted: showAdjustedHistoric
        }
      })
    }
    return { ranksByPid: rankMap, historicCellDetails: detailMap }
  }, [byGwFiltered, showAdjustedHistoric])

  // Ranking por puntos acumulados (depende de showAdjustedAccum)
  const { accumulatedRanksByPid, accumulatedCellDetails } = useMemo(() => {
    const accRankMap = new Map()
    const detailMap = new Map()
    const accumulatedPoints = new Map()
    const byJornada = new Map()
    for(const r of (byGwFiltered||[])){
      if(!byJornada.has(r.jornada)) byJornada.set(r.jornada, [])
      byJornada.get(r.jornada).push({
        participant_id: r.participant_id,
        name: r.participants.name,
        team_name: r.participants.team_name,
        points_external: r.points_external || 0,
        points_adjustments: r.points_adjustments || 0
      })
    }
    const sortedJornadas = Array.from(byJornada.keys()).sort((a, b) => a - b)
    for(const jornada of sortedJornadas) {
      const scores = byJornada.get(jornada)
      // acumular
      scores.forEach(score => {
        const pid = score.participant_id
        if(!accumulatedPoints.has(pid)) accumulatedPoints.set(pid, {
          participant_id: pid,
          name: score.name,
          team_name: score.team_name,
          acc_external: 0,
          acc_adjustments: 0
        })
        const acc = accumulatedPoints.get(pid)
        acc.acc_external += score.points_external
        acc.acc_adjustments += score.points_adjustments
      })
      // ranking acumulado en esta jornada
      const accumulatedScores = Array.from(accumulatedPoints.values())
        .map(acc => ({
          ...acc,
          total_points: showAdjustedHistoric
            ? acc.acc_external + acc.acc_adjustments
            : acc.acc_external
        }))
      accumulatedScores.sort((a, b) => b.total_points - a.total_points)
      accumulatedScores.forEach((score, idx) => {
        if(!accRankMap.has(score.participant_id)) accRankMap.set(score.participant_id, Array(38).fill(null))
        if(!detailMap.has(score.participant_id)) detailMap.set(score.participant_id, Array(38).fill(null))
        accRankMap.get(score.participant_id)[jornada - 1] = idx + 1
        detailMap.get(score.participant_id)[jornada - 1] = {
          rank: idx + 1,
          jornada,
          pointsBase: score.acc_external,
          pointsAdjustments: score.acc_adjustments,
          pointsTotal: score.total_points,
          pointsTotalAdjusted: score.acc_external + score.acc_adjustments,
          isAdjusted: showAdjustedHistoric
        }
      })
    }
    return { accumulatedRanksByPid: accRankMap, accumulatedCellDetails: detailMap }
  }, [byGwFiltered, showAdjustedHistoric])

  const leadersCount = useMemo(() => {
    // cuenta jornadas lideradas en la clasificación acumulada
    const counts = new Map()
    const totalJornadas = jornadas.length
    for(let idx=0; idx<totalJornadas; idx++){
      let bestRank = Infinity
      const leaders = []
      for(const p of participants){
        const arr = accumulatedRanksByPid.get(p.id) || []
        const rank = arr[idx]
        if(!rank) continue
        if(rank < bestRank){
          bestRank = rank
          leaders.length = 0
          leaders.push(p.id)
        } else if(rank === bestRank){
          leaders.push(p.id)
        }
      }
      if(bestRank === 1){
        leaders.forEach(pid => {
          counts.set(pid, (counts.get(pid) || 0) + 1)
        })
      }
    }
    return counts
  }, [participants, accumulatedRanksByPid, jornadas])

  const moves = useMemo(() => {
    // mayores subidas/bajadas en el ranking acumulado entre jornadas consecutivas
    const riseList = [] // { pid, name, delta, fromGw, toGw, fromRank, toRank }
    const dropList = []
    for(const p of participants){
      const arr = accumulatedRanksByPid.get(p.id) || []
      for(let gw=1; gw<arr.length; gw++){
        const prev = arr[gw-1]
        const curr = arr[gw]
        if(!prev || !curr) continue
        const delta = prev - curr // positivo = mejora
        if(delta>0) riseList.push({ pid:p.id, name:p.name, delta, fromGw:gw, toGw:gw+1, fromRank:prev, toRank:curr })
        if(delta<0) dropList.push({ pid:p.id, name:p.name, delta, fromGw:gw, toGw:gw+1, fromRank:prev, toRank:curr })
      }
    }
    riseList.sort((a,b)=> b.delta - a.delta)
    dropList.sort((a,b)=> Math.abs(b.delta) - Math.abs(a.delta))
    return { riseTop: riseList.slice(0,5), dropTop: dropList.slice(0,5) }
  }, [participants, accumulatedRanksByPid])

  // ======= UI helpers =======
  function rankCellClass(rank, total){
    if(!rank) return 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400'
    if(rank===1) return 'bg-gradient-to-br from-amber-200/80 to-yellow-200/60 dark:from-amber-900/30 dark:to-yellow-900/20 text-amber-900 dark:text-amber-200'
    if(rank===2) return 'bg-slate-200/80 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100'
    if(rank===3) return 'bg-gradient-to-br from-orange-200/80 to-amber-200/60 dark:from-orange-900/30 dark:to-amber-900/20 text-orange-900 dark:text-amber-200'
    if(total && rank>=total-1) return 'bg-rose-100/70 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300'
    return 'bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200'
  }

  // Datos para la gráfica del participante seleccionado
  // Recalcular ranking por jornada para la gráfica según su propio estado
  const chartRanksByPid = useMemo(() => {
    const rankMap = new Map()
    const accumulatedPoints = new Map()
    const byJornada = new Map()
    for(const r of (byGwFiltered||[])){
      if(!byJornada.has(r.jornada)) byJornada.set(r.jornada, [])
      byJornada.get(r.jornada).push({
        participant_id: r.participant_id,
        points_external: r.points_external || 0,
        points_adjustments: r.points_adjustments || 0
      })
    }
    const sortedJornadas = Array.from(byJornada.keys()).sort((a, b) => a - b)
    for(const jornada of sortedJornadas) {
      const scores = byJornada.get(jornada)
      scores.forEach(score => {
        const pid = score.participant_id
        if(!accumulatedPoints.has(pid)){
          accumulatedPoints.set(pid, { acc_external: 0, acc_adjustments: 0 })
        }
        const acc = accumulatedPoints.get(pid)
        acc.acc_external += score.points_external
        acc.acc_adjustments += score.points_adjustments
      })
      const accumulatedScores = Array.from(accumulatedPoints.entries()).map(([pid, acc]) => ({
        participant_id: pid,
        total_points: showAdjustedChart
          ? acc.acc_external + acc.acc_adjustments
          : acc.acc_external
      }))
      accumulatedScores.sort((a, b) => b.total_points - a.total_points)
      accumulatedScores.forEach((score, idx) => {
        if(!rankMap.has(score.participant_id)) rankMap.set(score.participant_id, Array(38).fill(null))
        rankMap.get(score.participant_id)[jornada - 1] = idx + 1
      })
    }
    return rankMap
  }, [byGwFiltered, showAdjustedChart])

  const chartData = useMemo(() => {
    if(!selectedPid) return []
    const arr = chartRanksByPid.get(selectedPid) || []
    return jornadas.map(gw => ({ gw, rank: arr[gw-1] || null }))
  }, [selectedPid, chartRanksByPid, jornadas])

  // SVG simple (sin libs) con eje Y invertido (1 arriba)
  function LineChartPositions({ data, isMobile }){
    if(!data?.length) return <div className="text-sm text-slate-500 dark:text-slate-400">Sin datos</div>
    const W = isMobile ? 360 : 720
    const H = isMobile ? 340 : 260
    const P = 28
    const xs = (i)=> P + (i)*( (W-2*P) / Math.max(1,(data.length-1)) )
    const maxRank = Math.max(...data.map(d=> d.rank||0).filter(Boolean)) || 1
    const ys = (r)=> P + (H-2*P) * ((r-1)/Math.max(1,(maxRank-1)))
    const pts = data.map((d,i)=> d.rank? `${xs(i)},${ys(d.rank)}` : null).filter(Boolean)
    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        preserveAspectRatio={isMobile ? 'none' : 'xMidYMid meet'}
        className={`w-full ${isMobile ? 'h-[340px]' : 'h-[260px]'}`}
      >
        <rect x="0" y="0" width={W} height={H} className="fill-slate-50 dark:fill-slate-900"/>
        {/* grid horizontal */}
        {Array.from({length: maxRank}, (_,i)=>i+1).map(r=> (
          <line key={r} x1={P} y1={ys(r)} x2={W-P} y2={ys(r)} className="stroke-slate-200 dark:stroke-slate-700" strokeDasharray="4 4"/>
        ))}
        {/* path */}
        {pts.length>1 && (
          <polyline points={pts.join(' ')} fill="none" strokeWidth={isMobile ? 4 : 2.5} className="stroke-emerald-600 dark:stroke-emerald-400"/>
        )}
        {/* puntos */}
        {data.map((d,i)=> d.rank && (
          <g key={i}>
            <circle cx={xs(i)} cy={ys(d.rank)} r={isMobile ? 6 : 4} className="fill-emerald-600 dark:fill-emerald-400"/>
            <text
              x={xs(i)}
              y={ys(d.rank) - (isMobile ? 16 : 10)}
              textAnchor="middle"
              className="fill-slate-700 dark:fill-slate-300 text-[18px] sm:text-[16px] md:text-[15px] lg:text-[14px] font-semibold"
            >
              {formatOrdinal(d.rank)}
            </text>
          </g>
        ))}
        {/* eje X */}
        {data.map((d,i)=> {
          const showLabel = !isMobile || data.length <= 12 || i % 2 === 0
          if(!showLabel) return null
          return (
            <text
              key={i}
              x={xs(i)}
              y={H-8}
              textAnchor="middle"
              className="fill-slate-600 dark:fill-slate-400 text-[14px] sm:text-[13px] md:text-[12px] font-medium"
            >
              J{d.gw}
            </text>
          )
        })}
      </svg>
    )
  }

  // Máxima jornada con datos para atenuar columnas futuras sin valores
  const maxJornadaWithData = useMemo(() => {
    const arr = (byGwFiltered || []).map(r => Number(r.jornada) || 0)
    return arr.length ? Math.max(...arr) : 0
  }, [byGwFiltered])

  const officialRankingRows = useMemo(() => {
    if (!officialRanking?.length) return []
    const base = officialRanking.map(row => ({
      participant_id: row.participant_id,
      name: row.name,
      team_name: row.team_name,
      external_total: Number(row.external_total) || 0,
      adjustment_total: Number(row.adjustment_total) || 0,
      score: Number(row.score) || 0,
      original_rank: Number(row.rank) || 0,
    }))
    const sorted = base.slice().sort((a, b) => {
      if (showAdjustedHistoric) {
        if (b.score !== a.score) return b.score - a.score
      } else {
        if (b.external_total !== a.external_total) return b.external_total - a.external_total
      }
      if (b.external_total !== a.external_total) return b.external_total - a.external_total
      if (a.adjustment_total !== b.adjustment_total) return b.adjustment_total - a.adjustment_total
      return a.name.localeCompare(b.name)
    })
    return sorted.map((row, idx) => ({
      ...row,
      display_rank: idx + 1,
      total_points: showAdjustedHistoric ? row.score : row.external_total,
    }))
  }, [officialRanking, showAdjustedHistoric])

  const activeCellData = useMemo(() => {
    if(!activeCell) return null
    const { participantId, jornada, type } = activeCell
    const detailMap = type === 'historic' ? historicCellDetails : accumulatedCellDetails
    const detail = detailMap?.get(participantId)?.[jornada - 1]
    if(!detail) return null
    const participant = participantsById.get(participantId)
    if(!participant) return null
    return {
      ...detail,
      participant,
      type,
      jornada
    }
  }, [activeCell, historicCellDetails, accumulatedCellDetails, participantsById])

  const activeCellLabels = useMemo(() => {
    if(!activeCellData) return null
    const isHistoric = activeCellData.type === 'historic'
    return {
      jimmyLabel: 'Liga Jimmy Fantasy',
      daznLabel: 'Liga Fantasy DAZN',
      adjustmentLabel: 'Ajuste',
      modeHint: 'Comparativa de puntos con y sin ajustes.',
      dialogTitle: isHistoric ? 'RANKING JORNADA INDIVIDUAL' : 'RANKING JORNADA ACUMULADA',
      jornadaLabel: `Jornada ${activeCellData.jornada}`
    }
  }, [activeCellData])

  useEffect(() => {
    if(!activeCell) return
    if(!activeCellData) setActiveCell(null)
  }, [activeCell, activeCellData])

  // ======= RENDER =======
  if(loading){
    return (
      <div className="glass border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <BarChart2 className="w-5 h-5"/> Cargando stats…
      </div>
    )
  }

  const totalPlayers = participants.length

  return (
    <div className="space-y-8">
      {/* RANKING HISTÓRICO */}
      <section>
        <SectionHeader
          title="Ranking histórico por jornada"
          subtitle="Tabla de posiciones J1 → J38"
          collapsed={cHistoric}
          onToggle={()=> setCHistoric(v=>!v)}
        />
        <AnimatePresence initial={false}>
          {!cHistoric && (
            <motion.div initial={{opacity:0, y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.18}} className="mt-4">
              {/* Cabecera local con título dinámico + botón de alternancia (SECCIÓN: Jornada) */}
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-3">
                  <img
                    src={showAdjustedHistoric
                      ? 'https://ikelgpniohzalybpafuf.supabase.co/storage/v1/object/public/carousel/JimmyFantasia.jpeg'
                      : 'https://ikelgpniohzalybpafuf.supabase.co/storage/v1/object/public/carousel/logo_fantasy_dazn.jpeg'}
                    alt={showAdjustedHistoric ? 'Liga Jimmy Fantasy' : 'Liga Fantasy Dazn'}
                    decoding="async"
                    loading="lazy"
                    className={[
                      'h-9 w-9 rounded-full object-cover ring-2',
                      showAdjustedHistoric ? 'ring-indigo-400 dark:ring-violet-400' : 'ring-amber-400 dark:ring-orange-400'
                    ].join(' ')}
                  />
                  {showAdjustedHistoric
                    ? <Medal className="w-5 h-5 text-indigo-500 dark:text-violet-400"/>
                    : <PlaySquare className="w-5 h-5 text-amber-500 dark:text-orange-400"/>}
                  <span
                    className={[
                      'text-xl md:text-2xl font-extrabold tracking-tight',
                      'bg-clip-text text-transparent bg-gradient-to-r',
                      showAdjustedHistoric
                        ? 'from-indigo-500 via-violet-500 to-cyan-400'
                        : 'from-amber-500 via-orange-500 to-yellow-400'
                    ].join(' ')}
                  >
                    {showAdjustedHistoric ? 'Liga Jimmy Fantasy' : 'Liga Fantasy Dazn'}
                  </span>
                </h2>
                <button
                  id="btn-toggle-adjustments"
                  type="button"
                  aria-pressed={showAdjustedHistoric}
                  aria-controls="table-jornada"
                  onClick={() => setShowAdjustedHistoric(v => !v)}
                  className={[
                    'inline-flex flex-wrap items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold shadow-sm min-h-[38px] text-center max-w-full leading-tight',
                    'sm:justify-start sm:px-3 sm:py-2 sm:text-sm sm:min-h-[44px]',
                    'bg-gradient-to-r text-white',
                    showAdjustedHistoric
                      ? 'border-indigo-300 from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-700 hover:via-violet-700 hover:to-cyan-600'
                      : 'border-amber-300 from-amber-600 via-orange-600 to-yellow-500 hover:from-amber-700 hover:via-orange-700 hover:to-yellow-600'
                  ].join(' ')}
                >
                  {showAdjustedHistoric ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span className="sm:hidden">Ver sin ajuste</span>
                      <span className="hidden sm:inline">Ver sin bonificaciones/penalizaciones</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span className="sm:hidden">Ver con ajuste</span>
                      <span className="hidden sm:inline">Ver con bonificaciones/penalizaciones</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tabla por jornada individual */}
              <div className="mb-8">
                <h3 className={[
                  'text-lg font-semibold mb-3',
                  showAdjustedHistoric ? 'text-indigo-700 dark:text-indigo-300' : 'text-amber-700 dark:text-amber-300'
                ].join(' ')}>
                  Ranking por jornada individual
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  👉 Clasificación de los participantes en una jornada concreta. Solo se cuentan los puntos obtenidos en esa jornada, sin tener en cuenta el resto de la temporada.
                </p>
                <div
                  data-adjustments={showAdjustedHistoric ? 'on' : 'off'}
                  className={[
                    'glass rounded-2xl overflow-hidden border',
                    showAdjustedHistoric ? 'border-indigo-200 dark:border-violet-700' : 'border-amber-200 dark:border-orange-700'
                  ].join(' ')}
                >
                  <div className="overflow-x-auto">
                    <table id="table-jornada" className="w-full text-sm min-w-[900px]">
                      <thead className={[
                        'bg-gradient-to-r',
                        showAdjustedHistoric
                          ? 'from-indigo-50 via-violet-50 to-cyan-50 dark:from-indigo-900/20 dark:via-violet-900/20 dark:to-cyan-900/20'
                          : 'from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20'
                      ].join(' ')}>
                        <tr>
                          <th className={[
                            'sticky left-0 z-10 px-3 py-2 text-left',
                            showAdjustedHistoric
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                          ].join(' ')}>Participante</th>
                          {Array.from({length: 38}, (_,i) => i+1).map(gw => (
                            <th key={gw} className={[
                              'px-2 py-2 text-center',
                              showAdjustedHistoric ? 'text-indigo-700 dark:text-indigo-300' : 'text-amber-700 dark:text-amber-300',
                              gw > maxJornadaWithData ? 'opacity-30' : ''
                            ].join(' ')}>J{gw}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map(p => {
                          const arr = ranksByPid.get(p.id) || Array(38).fill(null)
                          return (
                            <tr key={p.id} className={[
                              'border-t',
                              showAdjustedHistoric
                                ? 'border-indigo-200 dark:border-violet-700 hover:bg-indigo-50/70 dark:hover:bg-indigo-900/30'
                                : 'border-amber-200 dark:border-orange-700 hover:bg-amber-50/70 dark:hover:bg-amber-900/30'
                            ].join(' ')}>
                              <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-3 py-2">
                                <div className="font-medium text-slate-900 dark:text-slate-100">{p.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{p.team_name || 'Sin equipo'}</div>
                              </td>
                              {Array.from({length: 38}, (_,i) => i+1).map(gw => {
                                const rk = arr[gw-1]
                                const detail = historicCellDetails.get(p.id)?.[gw-1] || null
                                const isFuture = gw > maxJornadaWithData
                                const isDisabled = !detail
                                const ringClass = showAdjustedHistoric
                                  ? 'focus-visible:ring-indigo-400 dark:focus-visible:ring-violet-400'
                                  : 'focus-visible:ring-amber-400 dark:focus-visible:ring-orange-400'
                                return (
                                  <td key={gw} className={['px-1.5 py-1.5', isFuture && !rk ? 'opacity-30' : ''].join(' ')}>
                                    <button
                                      type="button"
                                      disabled={isDisabled}
                                      onClick={() => detail && setActiveCell({ type: 'historic', participantId: p.id, jornada: gw })}
                                      title={detail ? `Detalles jornada ${gw} · ${p.name}` : undefined}
                                      aria-label={detail ? `Detalles jornada ${gw} para ${p.name}` : undefined}
                                      className={[
                                        'w-full rounded-md text-center text-xs font-semibold px-2 py-1 border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-default',
                                        showAdjustedHistoric ? 'border-indigo-200 dark:border-violet-700' : 'border-amber-200 dark:border-orange-700',
                                        rk ? 'hover:shadow-sm' : '',
                                        ringClass,
                                        rankCellClass(rk, totalPlayers)
                                      ].join(' ')}
                                    >
                                      {formatOrdinal(rk)}
                                    </button>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Tabla por puntos acumulados */}
              <div>
                {/* Eliminado título/botón secundarios: usa el control superior */}
                <h3 className={[
                  'text-lg font-semibold mb-3',
                  showAdjustedHistoric ? 'text-indigo-700 dark:text-indigo-300' : 'text-amber-700 dark:text-amber-300'
                ].join(' ')}>
                  Ranking por puntos acumulados
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  👉 Clasificación general de la temporada. Tabla que recoge, jornada tras jornada, la suma de los puntos conseguidos por cada participante, mostrando la evolución y reflejando la clasificación general en cada momento.
                </p>
                <div
                  data-adjustments={showAdjustedHistoric ? 'on' : 'off'}
                  className={[
                    'glass rounded-2xl overflow-hidden border',
                    showAdjustedHistoric ? 'border-indigo-200 dark:border-violet-700' : 'border-amber-200 dark:border-orange-700'
                  ].join(' ')}
                >
                  <div className="overflow-x-auto">
                    <table id="table-acumulado" className="w-full text-sm min-w-[900px]">
                      <thead className={[
                        'bg-gradient-to-r',
                        showAdjustedHistoric
                          ? 'from-indigo-50 via-violet-50 to-cyan-50 dark:from-indigo-900/20 dark:via-violet-900/20 dark:to-cyan-900/20'
                          : 'from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20'
                      ].join(' ')}>
                        <tr>
                          <th className={[
                            'sticky left-0 z-10 px-3 py-2 text-left',
                            showAdjustedHistoric
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                          ].join(' ')}>Participante</th>
                          {Array.from({length: 38}, (_,i) => i+1).map(gw => (
                            <th key={gw} className={[
                              'px-2 py-2 text-center',
                              showAdjustedHistoric ? 'text-indigo-700 dark:text-indigo-300' : 'text-amber-700 dark:text-amber-300',
                              gw > maxJornadaWithData ? 'opacity-30' : ''
                            ].join(' ')}>J{gw}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map(p => {
                          const arr = accumulatedRanksByPid.get(p.id) || Array(38).fill(null)
                          return (
                            <tr key={p.id} className={[
                              'border-t',
                              showAdjustedHistoric
                                ? 'border-indigo-200 dark:border-violet-700 hover:bg-indigo-50/70 dark:hover:bg-indigo-900/30'
                                : 'border-amber-200 dark:border-orange-700 hover:bg-amber-50/70 dark:hover:bg-amber-900/30'
                            ].join(' ')}>
                              <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-3 py-2">
                                <div className="font-medium text-slate-900 dark:text-slate-100">{p.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{p.team_name || 'Sin equipo'}</div>
                              </td>
                              {Array.from({length: 38}, (_,i) => i+1).map(gw => {
                                const rk = arr[gw-1]
                                const detail = accumulatedCellDetails.get(p.id)?.[gw-1] || null
                                const isFuture = gw > maxJornadaWithData
                                const isDisabled = !detail
                                const ringClass = showAdjustedHistoric
                                  ? 'focus-visible:ring-indigo-400 dark:focus-visible:ring-violet-400'
                                  : 'focus-visible:ring-amber-400 dark:focus-visible:ring-orange-400'
                                return (
                                  <td key={gw} className={['px-1.5 py-1.5', isFuture && !rk ? 'opacity-30' : ''].join(' ')}>
                                    <button
                                      type="button"
                                      disabled={isDisabled}
                                      onClick={() => detail && setActiveCell({ type: 'accumulated', participantId: p.id, jornada: gw })}
                                      title={detail ? `Detalles acumulado jornada ${gw} · ${p.name}` : undefined}
                                      aria-label={detail ? `Detalles acumulados hasta la jornada ${gw} para ${p.name}` : undefined}
                                      className={[
                                        'w-full rounded-md text-center text-xs font-semibold px-2 py-1 border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-default',
                                        showAdjustedHistoric ? 'border-indigo-200 dark:border-violet-700' : 'border-amber-200 dark:border-orange-700',
                                        rk ? 'hover:shadow-sm' : '',
                                        ringClass,
                                        rankCellClass(rk, totalPlayers)
                                      ].join(' ')}
                                    >
                                      {formatOrdinal(rk)}
                                    </button>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Clasificación oficial {lastPlayedJornada ? `hasta la jornada ${lastPlayedJornada}` : ''}
                    </h4>
                    {lastPlayedJornada ? (
                      <Badge className="text-xs border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300">
                        Última jornada jugada: J{lastPlayedJornada}
                      </Badge>
                    ) : null}
                  </div>
                  {officialRankingRows.length ? (
                    <div className="mt-3 glass rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[520px]">
                          <thead className="bg-slate-50 dark:bg-slate-900/40">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 w-24">Posición</th>
                              <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">Participante</th>
                              <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">Equipo</th>
                              <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Fantasy</th>
                              <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Ajuste</th>
                              <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">
                                {showAdjustedHistoric ? 'Total (ajustado)' : 'Total (sin ajuste)'}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {officialRankingRows.map(row => (
                              <tr key={row.participant_id} className="border-t border-slate-200 dark:border-slate-700">
                                <td className="px-3 py-2">
                                  <span
                                    className={[
                                      'inline-flex min-w-[3rem] items-center justify-center rounded-md border px-2 py-1 text-xs font-semibold',
                                      rankCellClass(row.display_rank, officialRankingRows.length)
                                    ].join(' ')}
                                  >
                                    {formatOrdinal(row.display_rank)}
                                  </span>
                                  {!showAdjustedHistoric && row.display_rank !== row.original_rank ? (
                                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                      Oficial: {formatOrdinal(row.original_rank)}
                                    </div>
                                  ) : null}
                                </td>
                                <td className="px-3 py-2">
                                  <div className="font-medium text-slate-900 dark:text-slate-100">{row.name}</div>
                                </td>
                                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.team_name || 'Sin equipo'}</td>
                                <td className="px-3 py-2 text-right">
                                  <span className={[
                                    'font-semibold',
                                    signTextClass(row.external_total)
                                  ].join(' ')}>{fmtSigned(row.external_total)}</span>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <span className={[
                                    'font-semibold',
                                    signTextClass(row.adjustment_total)
                                  ].join(' ')}>{fmtSigned(row.adjustment_total)}</span>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <span className={[
                                    'font-semibold',
                                    signTextClass(row.total_points)
                                  ].join(' ')}>{fmtSigned(row.total_points)}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">Sin datos disponibles.</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* GRÁFICA POSICIONES */}
      <section>
        <SectionHeader
          title="Gráfica de posiciones por participante"
          subtitle="👉 La gráfica muestra la posición de cada participante en cada jornada: el número indica el puesto. Cuanto más arriba esté la línea, mejor va en la clasificación."
          collapsed={cChart}
          onToggle={()=> setCChart(v=>!v)}
        />
        <AnimatePresence initial={false}>
          {!cChart && (
            <motion.div initial={{opacity:0, y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.18}} className="mt-4 glass rounded-2xl p-4 border"
              data-adjustments={showAdjustedChart ? 'on' : 'off'}
              >
              {/* Cabecera Chart: título dinámico y botón */}
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-3">
                  <img
                    src={showAdjustedChart
                      ? 'https://ikelgpniohzalybpafuf.supabase.co/storage/v1/object/public/carousel/JimmyFantasia.jpeg'
                      : 'https://ikelgpniohzalybpafuf.supabase.co/storage/v1/object/public/carousel/logo_fantasy_dazn.jpeg'}
                    alt={showAdjustedChart ? 'Liga Jimmy Fantasy' : 'Liga Fantasy Dazn'}
                    decoding="async"
                    loading="lazy"
                    className={[
                      'h-9 w-9 rounded-full object-cover ring-2',
                      showAdjustedChart ? 'ring-indigo-400 dark:ring-violet-400' : 'ring-amber-400 dark:ring-orange-400'
                    ].join(' ')}
                  />
                  {showAdjustedChart
                    ? <Medal className="w-5 h-5 text-indigo-500 dark:text-violet-400"/>
                    : <PlaySquare className="w-5 h-5 text-amber-500 dark:text-orange-400"/>}
                  <span
                    className={[
                      'text-xl md:text-2xl font-extrabold tracking-tight',
                      'bg-clip-text text-transparent bg-gradient-to-r',
                      showAdjustedChart
                        ? 'from-indigo-500 via-violet-500 to-cyan-400'
                        : 'from-amber-500 via-orange-500 to-yellow-400'
                    ].join(' ')}
                  >
                    {showAdjustedChart ? 'Liga Jimmy Fantasy' : 'Liga Fantasy Dazn'}
                  </span>
                </h2>
                <button
                  type="button"
                  aria-pressed={showAdjustedChart}
                  aria-controls="chart-positions"
                  onClick={() => setShowAdjustedChart(v => !v)}
                  className={[
                    'inline-flex flex-wrap items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold shadow-sm min-h-[38px] text-center max-w-full leading-tight',
                    'sm:justify-start sm:px-3 sm:py-2 sm:text-sm sm:min-h-[44px]',
                    'bg-gradient-to-r text-white',
                    showAdjustedChart
                      ? 'border-indigo-300 from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-700 hover:via-violet-700 hover:to-cyan-600'
                      : 'border-amber-300 from-amber-600 via-orange-600 to-yellow-500 hover:from-amber-700 hover:via-orange-700 hover:to-yellow-600'
                  ].join(' ')}
                >
                  {showAdjustedChart ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span className="sm:hidden">Ver sin ajuste</span>
                      <span className="hidden sm:inline">Ver sin bonificaciones/penalizaciones</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span className="sm:hidden">Ver con ajuste</span>
                      <span className="hidden sm:inline">Ver con bonificaciones/penalizaciones</span>
                    </>
                  )}
                </button>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Participante</label>
                  <Select
                    value={selectedPid}
                    onChange={v=> setSelectedPid(v)}
                    options={participants.map(p=>({
                      value: p.id,
                      label: p.team_name ? `${p.name} (${p.team_name})` : p.name
                    }))}
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-2" id="chart-positions">
                  <LineChartPositions data={chartData} isMobile={isMobileViewport} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
      {/* RÉCORDS DE MOVIMIENTO */}
      <section>
        <SectionHeader
          title="Récords de movimiento"
          subtitle="👉 Más jornadas como líder • Mayor subida • Mayor bajada"
          collapsed={cRecords}
          onToggle={()=> setCRecords(v=>!v)}
        />
        <AnimatePresence initial={false}>
          {!cRecords && (
            <motion.div initial={{opacity:0, y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.18}} className="mt-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-3">
                  <img
                    src={showAdjustedHistoric
                      ? 'https://ikelgpniohzalybpafuf.supabase.co/storage/v1/object/public/carousel/JimmyFantasia.jpeg'
                      : 'https://ikelgpniohzalybpafuf.supabase.co/storage/v1/object/public/carousel/logo_fantasy_dazn.jpeg'}
                    alt={showAdjustedHistoric ? 'Liga Jimmy Fantasy' : 'Liga Fantasy Dazn'}
                    decoding="async"
                    loading="lazy"
                    className={[
                      'h-9 w-9 rounded-full object-cover ring-2',
                      showAdjustedHistoric ? 'ring-indigo-400 dark:ring-violet-400' : 'ring-amber-400 dark:ring-orange-400'
                    ].join(' ')}
                  />
                  {showAdjustedHistoric
                    ? <Medal className="w-5 h-5 text-indigo-500 dark:text-violet-400"/>
                    : <PlaySquare className="w-5 h-5 text-amber-500 dark:text-orange-400"/>}
                  <span
                    className={[
                      'text-xl md:text-2xl font-extrabold tracking-tight',
                      'bg-clip-text text-transparent bg-gradient-to-r',
                      showAdjustedHistoric
                        ? 'from-indigo-500 via-violet-500 to-cyan-400'
                        : 'from-amber-500 via-orange-500 to-yellow-400'
                    ].join(' ')}
                  >
                    {showAdjustedHistoric ? 'Liga Jimmy Fantasy' : 'Liga Fantasy Dazn'}
                  </span>
                </h2>
                <button
                  type="button"
                  aria-pressed={showAdjustedHistoric}
                  onClick={() => setShowAdjustedHistoric(v => !v)}
                  className={[
                    'inline-flex flex-wrap items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold shadow-sm min-h-[38px] text-center max-w-full leading-tight',
                    'sm:justify-start sm:px-3 sm:py-2 sm:text-sm sm:min-h-[44px]',
                    'bg-gradient-to-r text-white',
                    showAdjustedHistoric
                      ? 'border-indigo-300 from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-700 hover:via-violet-700 hover:to-cyan-600'
                      : 'border-amber-300 from-amber-600 via-orange-600 to-yellow-500 hover:from-amber-700 hover:via-orange-700 hover:to-yellow-600'
                  ].join(' ')}
                >
                  {showAdjustedHistoric ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span className="sm:hidden">Ver sin ajuste</span>
                      <span className="hidden sm:inline">Ver sin bonificaciones/penalizaciones</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span className="sm:hidden">Ver con ajuste</span>
                      <span className="hidden sm:inline">Ver con bonificaciones/penalizaciones</span>
                    </>
                  )}
                </button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Más jornadas líder */}
                <div className="glass rounded-2xl h-full p-4 border border-slate-200 dark:border-slate-700 flex flex-col">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <Trophy className="w-4 h-4 text-amber-600"/> Más jornadas líder
                  </div>
                  <div className="mt-3 space-y-2 flex-1">
                    {participants
                      .map(p => ({ id:p.id, name:p.name, count: leadersCount.get(p.id)||0 }))
                      .filter(r => r.count > 0)
                      .sort((a,b)=> b.count - a.count)
                      .slice(0,5)
                      .map((r,idx)=> (
                        <div key={r.id} className="flex items-center justify-between">
                          <span className="text-sm text-slate-800 dark:text-slate-200">{idx+1}. {r.name}</span>
                          <Badge className="bg-amber-500 text-amber-950">×{r.count}</Badge>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Mayor subida */}
                <div className="glass rounded-2xl h-full p-4 border border-slate-200 dark:border-slate-700 flex flex-col">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <TrendingUp className="w-4 h-4 text-emerald-600"/> Mayor subida (entre jornadas)
                  </div>
                  <div className="mt-3 space-y-2 flex-1">
                    {moves.riseTop.map((r,idx)=> (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-slate-800 dark:text-slate-200">{idx+1}. {r.name} (J{r.fromGw}→J{r.toGw})</span>
                        <Badge className="bg-emerald-600 text-white">
                          {`+${r.delta}`} ({formatOrdinal(r.fromRank)} → {formatOrdinal(r.toRank)})
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mayor bajada */}
                <div className="glass rounded-2xl h-full p-4 border border-slate-200 dark:border-slate-700 flex flex-col">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <TrendingDown className="w-4 h-4 text-rose-600"/> Mayor bajada (entre jornadas)
                  </div>
                  <div className="mt-3 space-y-2 flex-1">
                    {moves.dropTop.map((r,idx)=> (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-slate-800 dark:text-slate-200">{idx+1}. {r.name} (J{r.fromGw}→J{r.toGw})</span>
                        <Badge className="bg-rose-600 text-white">
                          {`${r.delta}`} ({formatOrdinal(r.fromRank)} → {formatOrdinal(r.toRank)})
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
      <AnimatePresence>
        {activeCellData && activeCellLabels ? (
          <motion.div
            key="cell-info-overlay"
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCell(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="cell-info-title"
              aria-describedby="cell-info-description"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative z-[201] w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 sm:p-6"
              onClick={event => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-3">
                  <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {activeCellLabels.dialogTitle}
                  </Badge>
                  <Badge className="inline-flex w-fit bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                    {activeCellLabels.jornadaLabel}
                  </Badge>
                  <div>
                    <h3 id="cell-info-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {activeCellData.participant.name}
                    </h3>
                    {activeCellData.participant.team_name ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {activeCellData.participant.team_name}
                      </p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCell(null)}
                  className="rounded-full border border-slate-300 p-1 text-slate-500 transition hover:border-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-200 dark:focus-visible:ring-slate-500 dark:focus-visible:ring-offset-slate-900"
                  aria-label="Cerrar detalles"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/50 flex flex-col justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Puesto</span>
                  <div className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100">
                    {formatOrdinal(activeCellData.rank)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70 flex flex-col justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {activeCellLabels.adjustmentLabel}
                  </span>
                  <div className={['mt-3 text-lg font-semibold', signTextClass(activeCellData.pointsAdjustments)].join(' ')}>
                    {fmtSigned(activeCellData.pointsAdjustments)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <img
                      src="https://ikelgpniohzalybpafuf.supabase.co/storage/v1/object/public/carousel/JimmyFantasia.jpeg"
                      alt="Liga Jimmy Fantasy"
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-300 dark:ring-violet-400"
                      decoding="async"
                      loading="lazy"
                    />
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {activeCellLabels.jimmyLabel}
                    </span>
                  </div>
                  <div className={['text-lg font-semibold', signTextClass((activeCellData.pointsTotalAdjusted ?? (activeCellData.pointsBase + activeCellData.pointsAdjustments)))].join(' ')}>
                    {fmtSigned(activeCellData.pointsTotalAdjusted ?? (activeCellData.pointsBase + activeCellData.pointsAdjustments))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <img
                      src="https://ikelgpniohzalybpafuf.supabase.co/storage/v1/object/public/carousel/logo_fantasy_dazn.jpeg"
                      alt="Liga Fantasy DAZN"
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-amber-300 dark:ring-orange-400"
                      decoding="async"
                      loading="lazy"
                    />
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {activeCellLabels.daznLabel}
                    </span>
                  </div>
                  <div className={['text-lg font-semibold', signTextClass(activeCellData.pointsBase)].join(' ')}>
                    {fmtSigned(activeCellData.pointsBase)}
                  </div>
                </div>
              </div>

              <div id="cell-info-description" className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Info className="mt-[2px] h-4 w-4 text-slate-400 dark:text-slate-500" />
                <span>{activeCellLabels.modeHint}</span>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
