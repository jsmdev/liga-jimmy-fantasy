export default function JornadaSelect({ value, onChange, max = 38 }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Jornada</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-md border p-2 text-sm"
      >
        {Array.from({ length: max }, (_, i) => i + 1).map(j => (
          <option key={j} value={j}>{j}</option>
        ))}
      </select>
    </div>
  )
}