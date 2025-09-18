// ==============================
// File: src/pages/Stats.jsx
// ==============================
import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart2, LineChart, ArrowUpDown, TrendingUp, TrendingDown, Trophy, Eye, EyeOff } from 'lucide-react'

import SectionHeader from '@/components/SectionHeader.jsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card.jsx'
import Select from '@/components/ui/Select.jsx'
import Badge from '@/components/ui/Badge.jsx'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

// Helpers locales (idénticos a Home para coherencia visual)
function signTextClass(n){ if(n>0) return 'text-emerald-700 dark:text-emerald-400'; if(n<0) return 'text-rose-700 dark:text-rose-400'; return 'text-slate-900 dark:text-slate-100'}
function fmtSigned(n){ return n>0?('+'+n):String(n) }
function formatOrdinal(n){ return (Number.isFinite(n) && n>0) ? `${n}º` : '—' }

export default function Stats(){
  const [loading, setLoading] = useState(true)
  const [participants, setParticipants] = useState([])
  const [byGw, setByGw] = useState([]) // filas: { gw, participant_id, name, rank }
  const [current, setCurrent] = useState([]) // filas: { participant_id, name, team_name, external_total, penalty_total, score, rank }

  // UI: colapsables
  const [cHistoric, setCHistoric] = useState(false)
  const [cChart, setCChart] = useState(false)
  const [cCompare, setCCompare] = useState(false)
  const [cRecords, setCRecords] = useState(false)

  // UI: ajustes por sección (independientes)
  const [showAdjustedHistoric, setShowAdjustedHistoric] = useState(true)
  const [showAdjustedChart, setShowAdjustedChart] = useState(true)

  const [selectedPid, setSelectedPid] = useState('')

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
        const { data: curr } = await supabase
          .from('v_ranking_current')
          .select('participant_id,name,team_name,external_total,penalty_total,score,rank')
          .order('rank', { ascending: true })

        setParticipants(parts || [])
        setByGw(times || [])
        setCurrent(curr || [])
        if((parts||[]).length && !selectedPid){ setSelectedPid(parts[0].id) }
      } catch(e){
        console.error('Stats load()', e)
        setParticipants([]); setByGw([]); setCurrent([])
      } finally{ setLoading(false) }
    }
    load()
  }, [])

  // ======= Derivados =======
  const jornadas = useMemo(() => {
    const maxGw = (byGw||[]).reduce((m, r) => Math.max(m, r.jornada||0), 0)
    return Array.from({length: maxGw}, (_,i)=> i+1)
  }, [byGw])

  // Ranking por jornada individual (depende de showAdjustedHistoric)
  const ranksByPid = useMemo(() => {
    const rankMap = new Map()
    const byJornada = new Map()
    for(const r of (byGw||[])){
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
        rankMap.get(score.participant_id)[jornada - 1] = idx + 1
      })
    }
    return rankMap
  }, [byGw, showAdjustedHistoric])

  // Ranking por puntos acumulados (depende de showAdjustedAccum)
  const accumulatedRanksByPid = useMemo(() => {
    const accRankMap = new Map()
    const accumulatedPoints = new Map()
    const byJornada = new Map()
    for(const r of (byGw||[])){
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
        accRankMap.get(score.participant_id)[jornada - 1] = idx + 1
      })
    }
    return accRankMap
  }, [byGw, showAdjustedHistoric])

  const leadersCount = useMemo(() => {
    // cuenta jornadas con rank===1 por participante
    const counts = new Map()
    for(const r of (byGw||[])){
      if(r.rank === 1){ counts.set(r.participant_id, (counts.get(r.participant_id)||0)+1) }
    }
    return counts
  }, [byGw])

  const moves = useMemo(() => {
    // mayores subidas/bajadas entre jornadas consecutivas
    const riseList = [] // { pid, name, delta, fromGw, toGw }
    const dropList = []
    for(const p of participants){
      const arr = ranksByPid.get(p.id) || []
      for(let gw=2; gw<arr.length; gw++){
        const prev = arr[gw-1]; const curr = arr[gw]
        if(!prev || !curr) continue
        const delta = (prev - curr) // positivo = mejora
        if(delta>0) riseList.push({ pid:p.id, name:p.name, delta, fromGw:gw-1, toGw:gw })
        if(delta<0) dropList.push({ pid:p.id, name:p.name, delta, fromGw:gw-1, toGw:gw })
      }
    }
    riseList.sort((a,b)=> b.delta - a.delta)
    dropList.sort((a,b)=> Math.abs(b.delta) - Math.abs(a.delta))
    return { riseTop: riseList.slice(0,5), dropTop: dropList.slice(0,5) }
  }, [participants, ranksByPid])

  const externalOrder = useMemo(() => {
    // ordenados por puntos externos (desc), con posición
    const rows = (current||[]).slice().sort((a,b)=> (b.external_total||0) - (a.external_total||0))
    return rows.map((r, idx) => ({...r, posExt: idx+1 }))
  }, [current])

  const adjustedOrder = useMemo(() => {
    // ya viene ordenado por rank asc
    return (current||[]).map(r => ({...r, posAdj: r.rank}))
  }, [current])

  const compareRows = useMemo(() => {
    // une por participante y calcula delta de posiciones (ext -> adj)
    const byIdExt = new Map(externalOrder.map(r => [r.participant_id, r]))
    const byIdAdj = new Map(adjustedOrder.map(r => [r.participant_id, r]))
    const merged = participants.map(p => {
      const e = byIdExt.get(p.id) || {}
      const a = byIdAdj.get(p.id) || {}
      const delta = (e.posExt||0) && (a.posAdj||0) ? (e.posExt - a.posAdj) : 0
      return {
        id: p.id,
        name: p.name,
        team_name: p.team_name,
        posExt: e.posExt || '—',
        ptsExt: e.external_total ?? 0,
        posAdj: a.posAdj || '—',
        ptsAdj: a.score ?? 0,
        delta,
      }
    })
    // orden por posAdj si disponible
    merged.sort((x,y)=> (x.posAdj||99) - (y.posAdj||99))
    return merged
  }, [participants, externalOrder, adjustedOrder])

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
    const byJornada = new Map()
    for(const r of (byGw||[])){
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
      const jornadaScores = scores.map(score => ({
        ...score,
        total_points: showAdjustedChart
          ? score.points_external + score.points_adjustments
          : score.points_external
      }))
      jornadaScores.sort((a, b) => b.total_points - a.total_points)
      jornadaScores.forEach((score, idx) => {
        if(!rankMap.has(score.participant_id)) rankMap.set(score.participant_id, Array(38).fill(null))
        rankMap.get(score.participant_id)[jornada - 1] = idx + 1
      })
    }
    return rankMap
  }, [byGw, showAdjustedChart])

  const chartData = useMemo(() => {
    if(!selectedPid) return []
    const arr = chartRanksByPid.get(selectedPid) || []
    return jornadas.map(gw => ({ gw, rank: arr[gw-1] || null }))
  }, [selectedPid, chartRanksByPid, jornadas])

  // SVG simple (sin libs) con eje Y invertido (1 arriba)
  function LineChartPositions({ data }){
    if(!data?.length) return <div className="text-sm text-slate-500 dark:text-slate-400">Sin datos</div>
    const W=720, H=260, P=28
    const xs = (i)=> P + (i)*( (W-2*P) / Math.max(1,(data.length-1)) )
    const maxRank = Math.max(...data.map(d=> d.rank||0).filter(Boolean)) || 1
    const ys = (r)=> P + (H-2*P) * ((r-1)/Math.max(1,(maxRank-1)))
    const pts = data.map((d,i)=> d.rank? `${xs(i)},${ys(d.rank)}` : null).filter(Boolean)
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[260px]">
        <rect x="0" y="0" width={W} height={H} className="fill-slate-50 dark:fill-slate-900"/>
        {/* grid horizontal */}
        {Array.from({length: maxRank}, (_,i)=>i+1).map(r=> (
          <line key={r} x1={P} y1={ys(r)} x2={W-P} y2={ys(r)} className="stroke-slate-200 dark:stroke-slate-700" strokeDasharray="4 4"/>
        ))}
        {/* path */}
        {pts.length>1 && (
          <polyline points={pts.join(' ')} fill="none" strokeWidth="2.5" className="stroke-emerald-600 dark:stroke-emerald-400"/>
        )}
        {/* puntos */}
        {data.map((d,i)=> d.rank && (
          <g key={i}>
            <circle cx={xs(i)} cy={ys(d.rank)} r="4" className="fill-emerald-600 dark:fill-emerald-400"/>
            <text x={xs(i)} y={ys(d.rank)-8} textAnchor="middle" className="fill-slate-700 dark:fill-slate-300 text-[10px]">{d.rank}</text>
          </g>
        ))}
        {/* eje X */}
        {data.map((d,i)=> (
          <text key={i} x={xs(i)} y={H-6} textAnchor="middle" className="fill-slate-600 dark:fill-slate-400 text-[10px]">J{d.gw}</text>
        ))}
      </svg>
    )
  }

  // Máxima jornada con datos para atenuar columnas futuras sin valores
  const maxJornadaWithData = useMemo(() => {
    const arr = (byGw || []).map(r => Number(r.jornada) || 0)
    return arr.length ? Math.max(...arr) : 0
  }, [byGw])

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
                <h2
                  className={[
                    'text-xl md:text-2xl font-extrabold tracking-tight',
                    'bg-clip-text text-transparent bg-gradient-to-r',
                    showAdjustedHistoric
                      ? 'from-indigo-500 via-violet-500 to-cyan-400'
                      : 'from-amber-500 via-orange-500 to-yellow-400'
                  ].join(' ')}
                >
                  {showAdjustedHistoric ? '🏆 Liga Jimmy Fantasy' : '⚽ Liga Fantasy Dazn'}
                </h2>
                <button
                  id="btn-toggle-adjustments"
                  type="button"
                  aria-pressed={showAdjustedHistoric}
                  aria-controls="table-jornada"
                  onClick={() => setShowAdjustedHistoric(v => !v)}
                  className={[
                    'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm min-h-[44px]',
                    'bg-gradient-to-r text-white',
                    showAdjustedHistoric
                      ? 'border-indigo-300 from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-700 hover:via-violet-700 hover:to-cyan-600'
                      : 'border-amber-300 from-amber-600 via-orange-600 to-yellow-500 hover:from-amber-700 hover:via-orange-700 hover:to-yellow-600'
                  ].join(' ')}
                >
                  {showAdjustedHistoric ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Ver sin bonificaciones/penalizaciones
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Ver con bonificaciones/penalizaciones
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
                  Clasificación de los participantes en una jornada concreta. Solo se cuentan los puntos obtenidos en esa fecha, sin tener en cuenta el resto de la temporada.
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
                              gw > maxJornadaWithData ? 'opacity-50' : ''
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
                                const isFuture = gw > maxJornadaWithData
                                return (
                                  <td key={gw} className={['px-1.5 py-1.5', isFuture && !rk ? 'opacity-50' : ''].join(' ')}>
                                    <div className={[
                                      'rounded-md text-center text-xs font-semibold px-2 py-1 border',
                                      showAdjustedHistoric ? 'border-indigo-200 dark:border-violet-700' : 'border-amber-200 dark:border-orange-700',
                                      rankCellClass(rk, totalPlayers)
                                    ].join(' ')}>{formatOrdinal(rk)}</div>
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
                  Clasificación general de la temporada. Suma todos los puntos conseguidos en cada jornada, mostrando quién lidera el total acumulado hasta el momento.
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
                              gw > maxJornadaWithData ? 'opacity-50' : ''
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
                                const isFuture = gw > maxJornadaWithData
                                return (
                                  <td key={gw} className={['px-1.5 py-1.5', isFuture && !rk ? 'opacity-50' : ''].join(' ')}>
                                    <div className={[
                                      'rounded-md text-center text-xs font-semibold px-2 py-1 border',
                                      showAdjustedHistoric ? 'border-indigo-200 dark:border-violet-700' : 'border-amber-200 dark:border-orange-700',
                                      rankCellClass(rk, totalPlayers)
                                    ].join(' ')}>{formatOrdinal(rk)}</div>
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
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* GRÁFICA POSICIONES */}
      <section>
        <SectionHeader
          title="Gráfica de posiciones por participante"
          subtitle="El 1 es la cima (eje Y invertido)"
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
                <h2
                  className={[
                    'text-xl md:text-2xl font-extrabold tracking-tight',
                    'bg-clip-text text-transparent bg-gradient-to-r',
                    showAdjustedChart
                      ? 'from-indigo-500 via-violet-500 to-cyan-400'
                      : 'from-amber-500 via-orange-500 to-yellow-400'
                  ].join(' ')}
                >
                  {showAdjustedChart ? '🏆 Liga Jimmy Fantasy' : '⚽ Liga Fantasy Dazn'}
                </h2>
                <button
                  type="button"
                  aria-pressed={showAdjustedChart}
                  aria-controls="chart-positions"
                  onClick={() => setShowAdjustedChart(v => !v)}
                  className={[
                    'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm min-h-[44px]',
                    'bg-gradient-to-r text-white',
                    showAdjustedChart
                      ? 'border-indigo-300 from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-700 hover:via-violet-700 hover:to-cyan-600'
                      : 'border-amber-300 from-amber-600 via-orange-600 to-yellow-500 hover:from-amber-700 hover:via-orange-700 hover:to-yellow-600'
                  ].join(' ')}
                >
                  {showAdjustedChart ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Ver sin bonificaciones/penalizaciones
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Ver con bonificaciones/penalizaciones
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
                    options={participants.map(p=>({ value:p.id, label:p.name }))}
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-2" id="chart-positions">
                  <LineChartPositions data={chartData} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* COMPARATIVA EXTERNO vs AJUSTADO */}
      <section>
        <SectionHeader
          title="Comparativa: Fantasy externo vs Liga Jimmy (ajustada)"
          subtitle="Posiciones y puntos; Δ = posExt − posAjustada (positivo = mejora al aplicar reglas)"
          collapsed={cCompare}
          onToggle={()=> setCCompare(v=>!v)}
        />
        <AnimatePresence initial={false}>
          {!cCompare && (
            <motion.div initial={{opacity:0, y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.18}} className="mt-4">
              <Card className="glass card-float overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>Clasificación comparada</CardTitle>
                    <CardDescription>
                      Ordenada por posición <strong>ajustada</strong> (nuestra). <ArrowUpDown className="inline w-4 h-4"/>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl overflow-x-auto border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-sm min-w-[780px]">
                      <thead className="bg-slate-50 dark:bg-slate-800/60">
                        <tr className="text-left">
                          <th className="px-3 py-2 text-slate-700 dark:text-slate-300"># Ext</th>
                          <th className="px-3 py-2 text-slate-700 dark:text-slate-300">Participante</th>
                          <th className="px-3 py-2 text-slate-700 dark:text-slate-300">Pts Ext</th>
                          <th className="px-3 py-2 text-slate-700 dark:text-slate-300"># Ajustada</th>
                          <th className="px-3 py-2 text-slate-700 dark:text-slate-300">Pts Ajust</th>
                          <th className="px-3 py-2 text-slate-700 dark:text-slate-300">Δ pos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compareRows.map(row => (
                          <tr key={row.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700">
                            <td className="px-3 py-2">{row.posExt}</td>
                            <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{row.name}</td>
                            <td className="px-3 py-2"><Badge className="bg-slate-600 text-white">{fmtSigned(row.ptsExt||0)}</Badge></td>
                            <td className="px-3 py-2">{row.posAdj}</td>
                            <td className="px-3 py-2"><Badge className={row.ptsAdj>=0? 'bg-emerald-600 text-white':'bg-rose-600 text-white'}>{fmtSigned(row.ptsAdj||0)}</Badge></td>
                            <td className="px-3 py-2 font-semibold">
                              <span className={[signTextClass(row.delta), 'inline-flex items-center gap-1'].join(' ')}>
                                {row.delta>0 ? <TrendingUp className="w-4 h-4"/> : row.delta<0 ? <TrendingDown className="w-4 h-4"/> : null}
                                {fmtSigned(row.delta)}
                              </span>
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

      {/* RÉCORDS DE MOVIMIENTO */}
      <section>
        <SectionHeader
          title="Récords de movimiento"
          subtitle="Más jornadas como líder • Mayor subida • Mayor bajada"
          collapsed={cRecords}
          onToggle={()=> setCRecords(v=>!v)}
        />
        <AnimatePresence initial={false}>
          {!cRecords && (
            <motion.div initial={{opacity:0, y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.18}} className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Más jornadas líder */}
              <div className="glass rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <Trophy className="w-4 h-4 text-amber-600"/> Más jornadas líder
                </div>
                <div className="mt-3 space-y-2">
                  {participants
                    .map(p => ({ id:p.id, name:p.name, count: leadersCount.get(p.id)||0 }))
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
              <div className="glass rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <TrendingUp className="w-4 h-4 text-emerald-600"/> Mayor subida (entre jornadas)
                </div>
                <div className="mt-3 space-y-2">
                  {moves.riseTop.map((r,idx)=> (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-slate-800 dark:text-slate-200">{idx+1}. {r.name} (J{r.fromGw}→J{r.toGw})</span>
                      <Badge className="bg-emerald-600 text-white">+{r.delta}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mayor bajada */}
              <div className="glass rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <TrendingDown className="w-4 h-4 text-rose-600"/> Mayor bajada (entre jornadas)
                </div>
                <div className="mt-3 space-y-2">
                  {moves.dropTop.map((r,idx)=> (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-slate-800 dark:text-slate-200">{idx+1}. {r.name} (J{r.fromGw}→J{r.toGw})</span>
                      <Badge className="bg-rose-600 text-white">{r.delta}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}