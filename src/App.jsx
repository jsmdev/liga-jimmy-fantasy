import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Filter, Loader2, ArrowUpDown } from 'lucide-react'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card.jsx'
import Badge from '@/components/ui/Badge.jsx'
import Avatar from '@/components/ui/Avatar.jsx'
import Select from '@/components/ui/Select.jsx'

const TITLE = 'Liga Jimmy Fantasy'
const SUBTITLE = 'Una liga para gente de bien'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

function initials(name){ return (name||'?').split(' ').filter(Boolean).map(n=>n[0]).join('').slice(0,3).toUpperCase() }
function fmtDate(d){ try { return new Date(d).toLocaleDateString() } catch { return d } }
function signClass(n){ if (n>0) return 'bg-emerald-600'; if (n<0) return 'bg-rose-600'; return 'bg-slate-600' }
function signTextClass(n){ if (n>0) return 'text-emerald-700'; if (n<0) return 'text-rose-700'; return 'text-slate-900' }
function fmtSigned(n){ return n>0? '+'+n : String(n) }

const SHOW_DATE_FILTERS = false

export default function App(){
  const [participants, setParticipants] = useState([])
  const [penalties, setPenalties] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtros y ordenación
  const [filterParticipantId, setFilterParticipantId] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('date')      // 'date' | 'name' | 'team' | 'amount'
  const [sortDir, setSortDir] = useState('desc')    // 'asc' | 'desc'

  async function load(){
    setLoading(true)
    const { data: parts, error: e1 } = await supabase.from('participants').select('id,name,team_name,photo_url').order('name')
    if (e1) console.error(e1)
    const { data: pens,  error: e2 } = await supabase.from('penalties').select('id,participant_id,amount,reason,date').order('date', { ascending:false })
    if (e2) console.error(e2)
    setParticipants(parts||[])
    setPenalties(pens||[])
    setLoading(false)
  }

  useEffect(()=>{ load() }, [])

  // Totales
  const totals = useMemo(()=>{
    const map = Object.fromEntries(participants.map(p=>[p.id,0]))
    for(const pen of penalties) if (map[pen.participant_id]!==undefined) map[pen.participant_id]+=Number(pen.amount)||0
    return map
  }, [participants, penalties])

  // Enriquecemos filas para filtrar/ordenar
  const rows = useMemo(()=>{
    const joined = penalties.map(p=>{
      const part = participants.find(pp=>pp.id===p.participant_id)
      return {
        ...p,
        _name: part?.name || '',
        _team: part?.team_name || '',
        _photo: part?.photo_url || '',
        _date: p.date ? new Date(p.date) : null
      }
    })

    // Filtros
    let r = joined
    if (filterParticipantId !== 'all') r = r.filter(x=> x.participant_id === filterParticipantId)
    if (dateFrom) {
      const from = new Date(dateFrom)
      r = r.filter(x=> x._date ? x._date >= from : true)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      // incluir el día final completo
      to.setHours(23,59,59,999)
      r = r.filter(x=> x._date ? x._date <= to : true)
    }

    // Ordenación
    const dir = (sortDir === 'asc') ? 1 : -1
    r.sort((a,b)=>{
      switch (sortBy){
        case 'name':  return a._name.localeCompare(b._name) * dir
        case 'team':  return a._team.localeCompare(b._team) * dir
        case 'amount': return ((a.amount||0) - (b.amount||0)) * dir
        case 'date':
        default: {
          const at = a._date ? a._date.getTime() : 0
          const bt = b._date ? b._date.getTime() : 0
          return (at - bt) * dir
        }
      }
    })
    return r
  }, [penalties, participants, filterParticipantId, dateFrom, dateTo, sortBy, sortDir])

  const totalGlobal = Object.values(totals).reduce((a,b)=>a+b,0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{TITLE}</h1>
          <p className="text-sm text-slate-600">{SUBTITLE}</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-600"><Loader2 className="w-5 h-5 mr-2 animate-spin"/>Cargando datos…</div>
        ) : (
          <>
            {/* Resumen de totales */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">Resumen de penalizaciones</h2>
                <div className={['text-sm font-semibold', signTextClass(totalGlobal)].join(' ')}>
                  Total global: <span>{fmtSigned(totalGlobal)}</span>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {participants.map(p=>(
                  <Card key={p.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <Avatar src={p.photo_url} alt={p.name} fallback={initials(p.name)} />
                        <div>
                          <div className="text-base font-semibold text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-600 truncate">{p.team_name || 'Equipo sin nombre'}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">Sumatorio</div>
                        <Badge className={['text-base text-white', signClass(totals[p.id]||0)].join(' ')}>{fmtSigned(totals[p.id]||0)}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Controles: filtro participante + rango fechas + orden */}
            <section className="grid gap-3 md:grid-cols-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500"/>
                <label className="text-slate-700 text-sm">Participante</label>
              </div>
              <Select
                value={filterParticipantId}
                onChange={v=>setFilterParticipantId(v)}
                options={[{value:'all', label:'Todos'}, ...participants.map(p=>({value:p.id, label:p.name}))]}
                className="w-full"
              />
              {SHOW_DATE_FILTERS && (
                <div className="grid grid-cols-2 gap-3 md:col-span-2">
                  <div>
                    <label className="block text-slate-700 text-sm mb-1">Desde</label>
                    <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm w-full"/>
                  </div>
                  <div>
                    <label className="block text-slate-700 text-sm mb-1">Hasta</label>
                    <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm w-full"/>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 md:col-span-4">
                <div>
                  <label className="block text-slate-700 text-sm mb-1">Ordenar por</label>
                  <Select
                    value={sortBy}
                    onChange={setSortBy}
                    options={[
                      {value:'date', label:'Fecha'},
                      {value:'name', label:'Nombre participante'},
                      {value:'team', label:'Nombre equipo'},
                      {value:'amount', label:'Penalización'},
                    ]}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-sm mb-1">Dirección</label>
                  <Select
                    value={sortDir}
                    onChange={setSortDir}
                    options={[
                      {value:'asc', label:'Ascendente'},
                      {value:'desc', label:'Descendente'},
                    ]}
                    className="w-full"
                  />
                </div>
              </div>
            </section>

            {/* HISTORIAL - versión móvil (cards) */}
            <section className="sm:hidden">
              <div className="grid gap-3">
                {rows.length===0 ? (
                  <Card><CardContent className="py-10 text-center text-slate-500">No hay penalizaciones que coincidan.</CardContent></Card>
                ) : rows.map(pen=>{
                  return (
                    <Card key={pen.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <Avatar src={pen._photo} alt={pen._name} fallback={initials(pen._name)} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-slate-900">{pen._name}</div>
                              <Badge className={['text-white', signClass(pen.amount)].join(' ')}>{fmtSigned(pen.amount)}</Badge>
                            </div>
                            <div className="text-xs text-slate-600">{pen._team || '—'}</div>
                            <div className="text-xs text-slate-600 mt-1">{fmtDate(pen.date)}</div>
                            <div className="text-sm text-slate-800 whitespace-pre-wrap break-words mt-2">{pen.reason}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>

            {/* HISTORIAL - versión escritorio (tabla con scroll horizontal) */}
            <section className="hidden sm:block">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>Historial de penalizaciones</CardTitle>
                    <CardDescription>Consulta detallada de sanciones y bonificaciones. Orden actual: <strong>{({date:'Fecha',name:'Nombre',team:'Equipo',amount:'Penalización'})[sortBy]}</strong> <ArrowUpDown className="inline w-4 h-4"/></CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl overflow-x-auto border border-slate-200">
                    <table className="w-full text-sm min-w-[820px]">
                      <thead className="bg-slate-50">
                        <tr className="text-left">
                          <th className="px-4 py-3 text-slate-700">Foto</th>
                          <th className="px-4 py-3 text-slate-700">Nombre participante</th>
                          <th className="px-4 py-3 text-slate-700">Nombre Equipo</th>
                          <th className="px-4 py-3 text-slate-700">Fecha</th>
                          <th className="px-4 py-3 text-slate-700">Penalización</th>
                          <th className="px-4 py-3 text-slate-700">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length===0 ? (
                          <tr><td colSpan={6} className="text-center py-10 text-slate-500">No hay penalizaciones que coincidan.</td></tr>
                        ) : rows.map(pen=>(
                          <tr key={pen.id} className="align-top hover:bg-slate-50 border-t">
                            <td className="px-4 py-3"><Avatar src={pen._photo} alt={pen._name} fallback={initials(pen._name)} /></td>
                            <td className="px-4 py-3 font-medium text-slate-900">{pen._name || '—'}</td>
                            <td className="px-4 py-3 text-slate-700">{pen._team || '—'}</td>
                            <td className="px-4 py-3 text-slate-700">{fmtDate(pen.date)}</td>
                            <td className="px-4 py-3"><Badge className={['text-white', signClass(pen.amount)].join(' ')}>{fmtSigned(pen.amount)}</Badge></td>
                            <td className="px-4 py-3 text-slate-700 whitespace-pre-wrap break-words">{pen.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  )
}