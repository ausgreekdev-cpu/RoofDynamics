'use client'

import { useCallback, useEffect, useState } from 'react'
import { projectsApi } from './api'
import type { Project, ProjectDraft } from './types'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setProjects(await projectsApi.list())
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load projects')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const create = async (draft: ProjectDraft) => {
    const created = await projectsApi.create(draft)
    setProjects((prev) => [created, ...prev])
    return created
  }

  const update = async (id: string, patch: Partial<ProjectDraft>) => {
    const updated = await projectsApi.update(id, patch)
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)))
    return updated
  }

  const remove = async (id: string) => {
    await projectsApi.remove(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  return { projects, loading, error, refresh, create, update, remove }
}
