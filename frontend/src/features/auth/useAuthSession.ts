'use client'

import { useCallback, useEffect, useState } from 'react'
import { getAuthAdapter, getSupabaseClient } from './adapters'
import type { AuthSession } from './types'

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)
  const adapter = getAuthAdapter()

  useEffect(() => {
    let active = true
    const refresh = async () => {
      const current = await adapter.getSession()
      if (active) {
        setSession(current)
        setLoading(false)
      }
    }
    refresh()

    const client = getSupabaseClient()
    let unsubscribe: (() => void) | undefined
    if (client) {
      const { data } = client.auth.onAuthStateChange((_event, next) => {
        if (!active) return
        setSession(next ? {
          accessToken: next.access_token,
          userId: next.user.id,
          email: next.user.email,
          role: (next.user.app_metadata as Record<string, string>)?.role as AuthSession['role'] || 'staff',
          tenantId: (next.user.app_metadata as Record<string, string>)?.tenant_id || '',
          provider: 'supabase',
        } : null)
      })
      unsubscribe = () => data.subscription.unsubscribe()
    }
    return () => {
      active = false
      unsubscribe?.()
    }
  }, [adapter])

  const signOut = useCallback(async () => {
    await adapter.signOut()
    setSession(null)
  }, [adapter])

  return { session, loading, provider: adapter.name, signOut }
}
