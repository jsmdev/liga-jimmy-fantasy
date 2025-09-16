import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useStandings(jornada) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    async function run() {
      setLoading(true)
      const { data, error } = await supabase.rpc('rpc_get_standings', { j: jornada })
      if (!active) return
      if (error) setError(error)
      else setData(data || [])
      setLoading(false)
    }
    if (jornada) run()
    return () => { active = false }
  }, [jornada])

  return { data, loading, error }
}

export function useCompare(jornada) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    async function run() {
      setLoading(true)
      const { data, error } = await supabase.rpc('rpc_compare_external_vs_adjusted', { j: jornada })
      if (!active) return
      if (error) setError(error)
      else setData(data || [])
      setLoading(false)
    }
    if (jornada) run()
    return () => { active = false }
  }, [jornada])

  return { data, loading, error }
}

// Serie de posiciones para un participante (toda la liga)
export function useParticipantPositions(participantId) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ok = true
    async function run() {
      if (!participantId) { setRows([]); return }
      setLoading(true)
      const { data, error } = await supabase
        .from('v_cum_standings')
        .select('jornada, rank_adjusted')
        .eq('participant_id', participantId)
        .order('jornada', { ascending: true })
      if (!ok) return
      if (error) setError(error)
      else setRows(data || [])
      setLoading(false)
    }
    run()
    return () => { ok = false }
  }, [participantId])

  return { rows, loading, error }
}