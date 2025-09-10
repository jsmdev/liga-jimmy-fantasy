import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { LogOut, Filter, Plus, Edit, Trash2, Loader2, UserCircle2, Eye } from 'lucide-react'

import Button from '@/components/ui/Button.jsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card.jsx'
import Badge from '@/components/ui/Badge.jsx'
import Avatar from '@/components/ui/Avatar.jsx'
import Modal from '@/components/ui/Modal.jsx'
import Select from '@/components/ui/Select.jsx'

const TITLE = 'Liga Jimmy Fantasy'
const SUBTITLE = 'Una liga para gente de bien'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: true, autoRefreshToken: true } })

function initials(name) {
  return (name || '?').split(' ').filter(Boolean).map(n=>n[0]).join('').slice(0,3).toUpperCase()
}
function fmtDate(d) { try { return new Date(d).toLocaleDateString() } catch { return d } }
function totalsByParticipant(participants, penalties) {
  const map = Object.fromEntries(participants.map(p => [p.id, 0]))
  for (const pen of penalties) if (map[pen.participant_id] !== undefined) map[pen.participant_id] += Number(pen.amount) || 0
  return map
}
function signClass(n) { if (n>0) return 'bg-emerald-600'; if (n<0) return 'bg-rose-600'; return 'bg-slate-600' }
function signTextClass(n) { if (n>0) return 'text-emerald-700'; if (n<0) return 'text-rose-700'; return 'text-slate-900' }
function fmtSigned(n){ return n>0? '+'+n : String(n) }

export default function App(){
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [bootLoading, setBootLoading] = useState(true)

  useEffect(()=>{
    (async ()=>{
      const { data } = await supabase.auth.getSession()
      setSession(data.session ?? null)
      if (data.session?.user) {
        const prof = await fetchProfile(data.session.user.id)
        setProfile(prof)
      }
      setBootLoading(false)
    })()
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, sess) => {
      setSession(sess)
      if (sess?.user) setProfile(await fetchProfile(sess.user.id))
      else setProfile(null)
    })
    return ()=>sub.subscription.unsubscribe()
  }, [])

  if (bootLoading) return <Splash/>
  if (!session || !profile) return <AuthScreen/>

  return <AppAuthed profile={profile} onLogout={()=>supabase.auth.signOut()}/>
}

async function fetchProfile(userId){
  const { data, error } = await supabase.from('profiles').select('user_id, full_name, role').eq('user_id', userId).single()
  if (error) { console.error(error); return null }
  return data
}

function AppAuthed({ profile, onLogout }){
  const isAdmin = profile.role === 'admin'
  const [participants, setParticipants] = useState([])
  const [penalties, setPenalties] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterParticipantId, setFilterParticipantId] = useState('all')

  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false)
  const [editingPenalty, setEditingPenalty] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(()=>{(async()=>{ setLoading(true); await loadParticipants(); await loadPenalties(); setLoading(false) })()},[])

  async function loadParticipants(){
    const { data, error } = await supabase.from('participants').select('id,name,team_name,photo_url').order('name')
    if (error) return console.error(error)
    setParticipants(data ?? [])
  }
  async function loadPenalties(){
    const { data, error } = await supabase.from('penalties').select('id,participant_id,amount,reason,date,created_by').order('date', { ascending:false })
    if (error) return console.error(error)
    setPenalties(data ?? [])
  }

  async function addPenalty(pen){
    const { error } = await supabase.from('penalties').insert({
      participant_id: pen.participant_id,
      amount: pen.amount,
      reason: pen.reason,
      date: pen.date
    })
    if (error) return console.error(error)
    await loadPenalties()
  }
  async function updatePenalty(pen){
    const { error } = await supabase.from('penalties').update({
      participant_id: pen.participant_id,
      amount: pen.amount,
      reason: pen.reason,
      date: pen.date
    }).eq('id', pen.id)
    if (error) return console.error(error)
    await loadPenalties()
  }
  async function deletePenalty(id){
    const { error } = await supabase.from('penalties').delete().eq('id', id)
    if (error) return console.error(error)
    await loadPenalties()
  }

  async function upsertParticipant(id, data){
    if (!isAdmin) return
    const { error } = await supabase.from('participants').update({
      team_name: data.teamName ?? null,
      photo_url: data.photoUrl ?? null
    }).eq('id', id)
    if (error) return console.error(error)
    await loadParticipants()
  }

  const totals = useMemo(()=>totalsByParticipant(participants, penalties), [participants, penalties])
  const filtered = useMemo(()=> penalties.filter(p=> filterParticipantId==='all' || p.participant_id===filterParticipantId), [penalties, filterParticipantId])
  const totalGlobal = Object.values(totals).reduce((a,b)=>a+b,0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{TITLE}</h1>
            <p className="text-sm text-slate-600">{SUBTITLE}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-600 text-white">
              <UserCircle2 className="w-4 h-4 mr-1"/> {(profile.full_name)||'Usuario'} ({profile.role})
            </Badge>
            <Button variant="secondary" onClick={()=>setSettingsOpen(true)}>Configurar participantes</Button>
            {isAdmin ? (
              <Button onClick={()=>{ setEditingPenalty(null); setPenaltyModalOpen(true) }}><Plus className="w-4 h-4 mr-2"/>Añadir penalización</Button>
            ) : (
              <Button variant="secondary" disabled><Eye className="w-4 h-4 mr-2"/>Solo lectura</Button>
            )}
            <Button variant="destructive" onClick={onLogout}><LogOut className="w-4 h-4 mr-2"/>Salir</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-600"><Loader2 className="w-5 h-5 mr-2 animate-spin"/>Cargando datos…</div>
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

            <section className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500"/>
                <label className="text-slate-700 text-sm">Filtrar por participante</label>
              </div>
              <Select
                value={filterParticipantId}
                onChange={v=>setFilterParticipantId(v)}
                options={[{value:'all', label:'Todos'}, ...participants.map(p=>({value:p.id, label:p.name}))]}
                className="w-60"
              />
            </section>

            <section>
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>Historial de penalizaciones</CardTitle>
                    <CardDescription>Solo el administrador puede crear, editar o borrar penalizaciones.</CardDescription>
                  </div>
                  {isAdmin && <Button onClick={()=>{ setEditingPenalty(null); setPenaltyModalOpen(true) }}><Plus className="w-4 h-4 mr-2"/>Añadir penalización</Button>}
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-left">
                          <th className="px-4 py-3 text-slate-700">Foto</th>
                          <th className="px-4 py-3 text-slate-700">Nombre participante</th>
                          <th className="px-4 py-3 text-slate-700">Nombre Equipo</th>
                          <th className="px-4 py-3 text-slate-700">Fecha</th>
                          <th className="px-4 py-3 text-slate-700">Penalización</th>
                          <th className="px-4 py-3 text-slate-700">Motivo</th>
                          {isAdmin && <th className="px-4 py-3 text-right text-slate-700">Acciones</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length===0 ? (
                          <tr><td colSpan={isAdmin?7:6} className="text-center py-10 text-slate-500">No hay penalizaciones aún.</td></tr>
                        ) : filtered.map(pen=>{
                          const part = participants.find(pp=>pp.id===pen.participant_id)
                          return (
                            <tr key={pen.id} className="align-top hover:bg-slate-50 border-t">
                              <td className="px-4 py-3"><Avatar src={part?.photo_url} alt={part?.name} fallback={initials(part?.name || '?')} /></td>
                              <td className="px-4 py-3 font-medium text-slate-900">{part?.name || '—'}</td>
                              <td className="px-4 py-3 text-slate-700">{part?.team_name || '—'}</td>
                              <td className="px-4 py-3 text-slate-700">{fmtDate(pen.date)}</td>
                              <td className="px-4 py-3"><Badge className={['text-white', signClass(pen.amount)].join(' ')}>{fmtSigned(pen.amount)}</Badge></td>
                              <td className="px-4 py-3 text-slate-700 whitespace-pre-wrap break-words">{pen.reason}</td>
                              {isAdmin && (
                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="secondary" onClick={()=>{ setEditingPenalty(pen); setPenaltyModalOpen(true) }}><Edit className="w-4 h-4 mr-1"/>Editar</Button>
                                    <Button variant="destructive" onClick={()=>deletePenalty(pen.id)}><Trash2 className="w-4 h-4 mr-1"/>Borrar</Button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </main>

      {/* Penalty Modal */}
      <PenaltyModal
        open={penaltyModalOpen}
        onClose={()=>{ setPenaltyModalOpen(false); setEditingPenalty(null) }}
        participants={participants}
        penalty={editingPenalty}
        onSubmit={async (pen)=>{
          if (editingPenalty) await updatePenalty(pen)
          else await addPenalty(pen)
          setPenaltyModalOpen(false); setEditingPenalty(null)
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={()=>setSettingsOpen(false)}
        participants={participants}
        isAdmin={isAdmin}
        onUpdate={upsertParticipant}
      />
    </div>
  )
}

function PenaltyModal({ open, onClose, participants, penalty, onSubmit }){
  const initialType = penalty ? (penalty.amount >= 0 ? 'positivo' : 'negativo') : 'negativo'
  const initialAbs = penalty ? Math.abs(penalty.amount) : 1
  const [participantId, setParticipantId] = useState(penalty?.participant_id || participants[0]?.id || '')
  const [date, setDate] = useState(penalty?.date || new Date().toISOString().slice(0, 10))
  const [type, setType] = useState(initialType)
  const [amountAbs, setAmountAbs] = useState(String(initialAbs))
  const [reason, setReason] = useState(penalty?.reason || '')

  useEffect(()=>{
    if (penalty){
      setParticipantId(penalty.participant_id)
      setDate(penalty.date)
      setType(penalty.amount>=0 ? 'positivo' : 'negativo')
      setAmountAbs(String(Math.abs(penalty.amount)))
      setReason(penalty.reason)
    } else {
      setParticipantId(participants[0]?.id || '')
      setDate(new Date().toISOString().slice(0,10))
      setType('negativo')
      setAmountAbs('1')
      setReason('')
    }
  }, [penalty, participants])

  function handleSubmit(){
    if (!participantId) return
    const signed = (Number(amountAbs)||0) * (type==='negativo'?-1:1)
    onSubmit({
      id: penalty?.id || crypto.randomUUID(),
      participant_id: participantId,
      date,
      amount: signed,
      reason: reason.trim(),
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={penalty? 'Editar penalización':'Nueva penalización'} description="Registra una sanción o bonificación con su fecha, tipo, cantidad y motivo."
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit}>{penalty? 'Guardar cambios':'Añadir'}</Button>
      </>}
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-slate-700 text-sm">Participante</label>
          <Select value={participantId} onChange={setParticipantId} options={participants.map(p=>({value:p.id, label:p.name}))} />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <label className="text-slate-700 text-sm">Fecha</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm"/>
          </div>
          <div className="grid gap-2">
            <label className="text-slate-700 text-sm">Tipo</label>
            <Select value={type} onChange={setType} options={[{value:'positivo', label:'Bonificación (+)'},{value:'negativo', label:'Penalización (−)'}]} />
          </div>
          <div className="grid gap-2">
            <label className="text-slate-700 text-sm">Cantidad</label>
            <input type="number" min="0" step="1" value={amountAbs} onChange={e=>setAmountAbs(e.target.value)} className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm"/>
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-slate-700 text-sm">Motivo</label>
          <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Ej. Bonus por fair play / Llegar tarde al draft" className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm"/>
        </div>
      </div>
    </Modal>
  )
}

function SettingsModal({ open, onClose, participants, isAdmin, onUpdate }){
  return (
    <Modal open={open} onClose={onClose} title="Configurar participantes" description="Edita nombre de equipo y foto (solo admin).">
      <div className="space-y-4 max-h-[70vh] overflow-auto pr-1">
        {participants.map(p=>(
          <Card key={p.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar src={p.photo_url} alt={p.name} fallback={initials(p.name)} />
                <div className="flex-1 grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 text-sm">Participante</label>
                    <input value={p.name} readOnly className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm w-full"/>
                  </div>
                  <div>
                    <label className="text-slate-700 text-sm">Nombre del equipo</label>
                    <input value={p.team_name || ''} onChange={e=> isAdmin && onUpdate(p.id, { teamName: e.target.value })} readOnly={!isAdmin} className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm w-full"/>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-slate-700 text-sm">URL de foto (opcional)</label>
                    <input value={p.photo_url || ''} onChange={e=> isAdmin && onUpdate(p.id, { photoUrl: e.target.value })} readOnly={!isAdmin} className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm w-full"/>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Modal>
  )
}

function AuthScreen(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(){
    setError(''); setLoading(TrueFalse(false))
  }

  async function doLogin(){
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg w-full max-w-md">
        <div className="px-6 pt-6">
          <h3 className="text-2xl font-bold text-slate-900">{TITLE}</h3>
          <p className="text-slate-700">{SUBTITLE}</p>
        </div>
        <div className="px-6 py-4 grid gap-4">
          <div className="grid gap-2">
            <label className="text-slate-800 text-sm">Email</label>
            <input placeholder="tu@correo.com" value={email} onChange={e=>setEmail(e.target.value)} className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm"/>
          </div>
          <div className="grid gap-2">
            <label className="text-slate-800 text-sm">Contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm"/>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button onClick={doLogin} disabled={loading}>{loading ? (<span className="inline-flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Entrando…</span>) : 'Entrar'}</Button>
        </div>
      </div>
    </div>
  )
}

function Splash(){
  return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700"><Loader2 className="w-5 h-5 mr-2 animate-spin"/>Cargando…</div>
}

function TrueFalse(x){ return !!x } // tiny helper
