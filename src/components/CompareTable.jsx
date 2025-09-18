export default function CompareTable({ data, participantsById }) {
  if (!data?.length) return null
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-100">
          <tr>
            <th className="p-2 text-left"># Ext</th>
            <th className="p-2 text-left"># Ajust</th>
            <th className="p-2 text-left">Participante</th>
            <th className="p-2 text-right">Pts Ext</th>
            <th className="p-2 text-right">Pts Ajust</th>
            <th className="p-2 text-right">Δ Pts</th>
            <th className="p-2 text-right">Δ Pos</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => {
            const p = participantsById[r.participant_id]
            const name = p?.name ?? r.participant_id.slice(0, 6)
            const dPts = Number(r.delta_points || 0)
            const dRank = Number(r.delta_rank || 0)
            return (
              <tr key={r.participant_id} className="odd:bg-white even:bg-neutral-50">
                <td className="p-2">{r.rank_external}</td>
                <td className="p-2 font-semibold">{r.rank_adjusted}</td>
                <td className="p-2">{name}</td>
                <td className="p-2 text-right">{Number(r.cum_external).toFixed(0)}</td>
                <td className="p-2 text-right">{Number(r.cum_adjusted).toFixed(0)}</td>
                <td className={`p-2 text-right ${dPts > 0 ? 'text-green-600' : dPts < 0 ? 'text-red-600' : ''}`}>
                  {dPts > 0 ? `+${dPts.toFixed(0)}` : dPts.toFixed(0)}
                </td>
                <td className={`p-2 text-right ${dRank > 0 ? 'text-green-600' : dRank < 0 ? 'text-red-600' : ''}`}>
                  {dRank > 0 ? `+${dRank}` : dRank}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}