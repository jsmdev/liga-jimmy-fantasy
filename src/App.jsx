
import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Filter, Loader2, ArrowUpDown } from 'lucide-react'
import { motion } from 'framer-motion'

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

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

function initials(name){ return (name||'?').split(' ').filter(Boolean).map(n=>n[0]).join('').slice(0,3).toUpperCase() }
function fmtDate(d){ try { return new Date(d).toLocaleDateString() } catch { return d } }
function signClass(n){ if (n>0) return 'bg-emerald-600'; if (n<0) return 'bg-rose-600'; return 'bg-slate-600' }
function signTextClass(n){ if (n>0) return 'text-emerald-700'; if (n<0) return 'text-rose-700'; return 'text-slate-100' }
function fmtSigned(n){ return n>0? '+'+n : String(n) }

export default function App(){
  const [participants, setParticipants] = useState([])
  const [penalties, setPenalties] = useState([])
  const [loading, setLoading] = useState(true)

  const [filterParticipantId, setFilterParticipantId] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  const [lightboxUrl, setLightboxUrl] = useState(null)

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

  const totals = useMemo(()=>{
    const map = Object.fromEntries(participants.map(p=>[p.id,0]))
    for(const pen of penalties) if (map[pen.participant_id]!==undefined) map[pen.participant_id]+=Number(pen.amount)||0
    return map
  }, [participants, penalties])

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
    const dir = (sortDir === 'asc') ? 1 : -1
    joined.sort((a,b)=>{
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
    return joined
  }, [penalties, participants, sortBy, sortDir])

  const totalGlobal = Object.values(totals).reduce((a,b)=>a+b,0)

  const carouselPhotos = useMemo(()=>{
    const pics = participants
      .map(p=> p.photo_url ? ({ url: p.photo_url, alt: p.name, caption: p.team_name || p.name }) : null)
      .filter(Boolean)
    return pics.length ? [...pics, ...pics.slice(0, Math.min(5, pics.length))] : []
  }, [participants])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-title">{TITLE}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">{SUBTITLE}</p>
            <div className="mt-3 gradient-bar" />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <KonamiEasterEgg />

        <section>
          <PhotoCarousel photos={carouselPhotos} />
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-600 dark:text-slate-300"><Loader2 className="w-5 h-5 mr-2 animate-spin"/>Cargando datos…</div>
        ) : (
          <>
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">Resumen de penalizaciones</h2>
                <div className={['text-sm font-semibold', signTextClass(totalGlobal)].join(' ')}>
                  Total global: <span>{fmtSigned(totalGlobal)}</span>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {participants.map((p, idx)=>(
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: .3, delay: idx * 0.04 }}
                  >
                    <Card className="glass card-float">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div onClick={()=> p.photo_url && setLightboxUrl(p.photo_url)} className={p.photo_url ? "cursor-zoom-in" : ""}>
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
                          <Badge className={['px-3 py-1.5 text-lg font-bold text-white', signClass(totals[p.id]||0)].join(' ')}>
                            {fmtSigned(totals[p.id]||0)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500"/>
                <label className="text-slate-700 dark:text-slate-300 text-sm">Participante</label>
              </div>
              <Select
                value={filterParticipantId}
                onChange={v=>setFilterParticipantId(v)}
                options={[{value:'all', label:'Todos'}, ...participants.map(p=>({value:p.id, label:p.name}))]}
                className="w-full"
              />
              <div className="md:col-span-2 flex items-center md:justify-end">
                <ConfettiButton>Modo fiesta</ConfettiButton>
              </div>

              <div className="grid grid-cols-2 gap-3 md:col-span-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1">Ordenar por</label>
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
                  <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1">Dirección</label>
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

            <section className="sm:hidden">
              <div className="grid gap-3">
                {rows
                  .filter(p=> filterParticipantId==='all' || p.participant_id===filterParticipantId)
                  .map(pen=>{
                    return (
                      <Card key={pen.id} className="glass card-float">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <div onClick={()=> pen._photo && setLightboxUrl(pen._photo)} className={pen._photo ? "cursor-zoom-in" : ""}>
                              <Avatar src={pen._photo} alt={pen._name} fallback={initials(pen._name)} size="lg" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-slate-900 dark:text-slate-100">{pen._name}</div>
                                <Badge className={['text-white', signClass(pen.amount)].join(' ')}>{fmtSigned(pen.amount)}</Badge>
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-400">{pen._team || '—'}</div>
                              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{fmtDate(pen.date)}</div>
                              <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words mt-2">{pen.reason}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                })}
              </div>
            </section>

            <section className="hidden sm:block">
              <Card className="glass card-float overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>Historial de penalizaciones</CardTitle>
                    <CardDescription>Consulta detallada de sanciones y bonificaciones. Orden actual: <strong>{({date:'Fecha',name:'Nombre',team:'Equipo',amount:'Penalización'})[sortBy]}</strong> <ArrowUpDown className="inline w-4 h-4"/></CardDescription>
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
                          .filter(p=> filterParticipantId==='all' || p.participant_id===filterParticipantId)
                          .map(pen=>(
                          <tr key={pen.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700">
                            <td className="px-4 py-3">
                              <div onClick={()=> pen._photo && setLightboxUrl(pen._photo)} className={pen._photo ? 'cursor-zoom-in inline-block' : 'inline-block'}>
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
            </section>

            {lightboxUrl && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={()=> setLightboxUrl(null)}>
                <img src={lightboxUrl} alt="Foto ampliada" className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-lg" />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
