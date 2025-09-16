export default function StandingsTable({ data, participantsById }) {
  if (!data?.length) {
    return <div className="text-sm text-neutral-500">Sin datos para esta jornada.</div>
  }
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-100">
          <tr>
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Participante</th>
            <th className="p-2 text-right">Pts Ext</th>
            <th className="p-2 text-right">Pts Ajust</th>
            <th className="p-2 text-right">Δ Pts</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => {
            const p = participantsById[r.participant_id]
            const name = p?.name ?? r.participant_id.slice(0, 6)
            const deltaPts = Number(r.cum_adjusted) - Number(r.cum_external)
            return (
              <tr key={r.participant_id} className="odd:bg-white even:bg-neutral-50">
                <td className="p-2 font-semibold">{r.rank_adjusted}</td>
                <td className="p-2">{name}</td>
                <td className="p-2 text-right">{Number(r.cum_external).toFixed(0)}</td>
                <td className="p-2 text-right">{Number(r.cum_adjusted).toFixed(0)}</td>
                <td className={`p-2 text-right ${deltaPts > 0 ? 'text-green-600' : deltaPts < 0 ? 'text-red-600' : ''}`}>
                  {deltaPts > 0 ? `+${deltaPts.toFixed(0)}` : deltaPts.toFixed(0)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}