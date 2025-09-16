import { useMemo, useState } from 'react'
import JornadaSelect from '@/components/JornadaSelect'
import StandingsTable from '@/components/StandingsTable'
import CompareTable from '@/components/CompareTable'
import ParticipantLineChart from '@/components/ParticipantLineChart'
import { useParticipantsMap } from '@/hooks/useParticipants'
import { useStandings, useCompare, useParticipantPositions } from '@/hooks/useStandings'

export default function Stats() {
  const [jornada, setJornada] = useState(4) // empieza en la última que tengas cargada
  const { map: participantsById, loading: loadingP } = useParticipantsMap()
  const { data: standings, loading: loadingS } = useStandings(jornada)
  const { data: compare, loading: loadingC } = useCompare(jornada)

  const firstParticipantId = useMemo(() => standings?.[0]?.participant_id ?? null, [standings])
  const [selectedPid, setSelectedPid] = useState(null)
  const pid = selectedPid || firstParticipantId
  const { rows: posRows } = useParticipantPositions(pid)

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Estadísticas por Jornada</h1>
        <JornadaSelect value={jornada} onChange={setJornada} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Clasificación (ajustada)</h2>
        {(loadingP || loadingS) ? <Skeleton /> : (
          <StandingsTable data={standings} participantsById={participantsById} />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Comparativa: Externo vs Ajustado</h2>
        {loadingC ? <Skeleton /> : (
          <CompareTable data={compare} participantsById={participantsById} />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Evolución de posiciones (participante)</h2>
          <select
            className="rounded-md border p-2 text-sm"
            value={pid || ''}
            onChange={e => setSelectedPid(e.target.value || null)}
          >
            {Object.values(participantsById).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <ParticipantLineChart rows={posRows} />
      </section>
    </div>
  )
}

function Skeleton() {
  return <div className="h-24 w-full animate-pulse rounded-xl bg-neutral-200" />
}