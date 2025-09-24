import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpDown } from 'lucide-react'

import SectionHeader from '@/components/SectionHeader.jsx'
import Select from '@/components/ui/Select.jsx'
import Badge from '@/components/ui/Badge.jsx'
import Avatar from '@/components/ui/Avatar.jsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card.jsx'

export default function HistorySection({
  participants = [],
  penalties = [],
  showImage,
  getInitials,
  formatSigned,
  formatDate,
  getSignClass,
}) {
  const initials = getInitials || ((name) => (name || '?').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 3).toUpperCase())
  const fmtSigned = formatSigned || ((n) => (n > 0 ? '+' + n : String(n)))
  const fmtDate = formatDate || ((value) => {
    try {
      return new Date(value).toLocaleDateString()
    } catch (e) {
      return value || '—'
    }
  })
  const signClass = getSignClass || ((n) => {
    if (n > 0) return 'bg-emerald-600'
    if (n < 0) return 'bg-rose-600'
    return 'bg-slate-600'
  })

  const [collapsed, setCollapsed] = useState(false)
  const [filterParticipantId, setFilterParticipantId] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  const rows = useMemo(() => {
    const joined = (penalties || []).map(p => {
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

  return (
    <section className="mt-10">
      <SectionHeader
        title="Historial"
        subtitle="Consulta detallada ordenable y filtrable"
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
      />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="history-body"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mt-4"
          >
            <div className="mt-4 pb-4 grid gap-3 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1">Participante</label>
                <Select
                  value={filterParticipantId}
                  onChange={v => setFilterParticipantId(v)}
                  options={[{ value: 'all', label: 'Todos' }, ...(participants || []).map(p => ({ value: p.id, label: p.name }))]}
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
                    { value: 'amount', label: 'Penalización' },
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1">Dirección</label>
                <Select
                  value={sortDir}
                  onChange={setSortDir}
                  options={[{ value: 'asc', label: 'Ascendente' }, { value: 'desc', label: 'Descendente' }]}
                  className="w-full"
                />
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
                              <div
                                onClick={() => {
                                  if (pen._photo && typeof showImage === 'function') {
                                    showImage(pen._photo, { alt: `Avatar de ${pen._name}` })
                                  }
                                }}
                                className={pen._photo && typeof showImage === 'function' ? 'cursor-zoom-in inline-block' : 'inline-block'}
                              >
                                <Avatar src={pen._photo} alt={pen._name} fallback={initials(pen._name)} />
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{pen._name || '—'}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{pen._team || '—'}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{fmtDate(pen.date)}</td>
                            <td className="px-4 py-3">
                              <Badge className={['text-white', signClass(Number(pen.amount) || 0)].join(' ')}>{fmtSigned(Number(pen.amount) || 0)}</Badge>
                            </td>
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
  )
}
