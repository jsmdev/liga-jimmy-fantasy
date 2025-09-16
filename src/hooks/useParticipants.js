import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useParticipantsMap() {
  const [map, setMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function run() {
      setLoading(true)
      const { data, error } = await supabase
        .from('participants')
        .select('id,name,team_name,active')
        .order('name', { ascending: true })
      if (!isMounted) return
      if (error) setError(error)
      else {
        const m = {}
        for (const r of data || []) m[r.id] = r
        setMap(m)
      }
      setLoading(false)
    }
    run()
    return () => { isMounted = false }
  }, [])

  return { map, loading, error }
}