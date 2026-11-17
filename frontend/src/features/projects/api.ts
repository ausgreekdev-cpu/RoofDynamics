import { api } from '../../services/api'
import type { AuditEntry, Project, ProjectDraft } from './types'

/** Typed projects API client. */
export const projectsApi = {
  list: (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.search) q.set('search', params.search)
    return api.request<Project[]>(`/projects?${q.toString()}`)
  },
  get: (id: string) => api.request<Project>(`/projects/${id}`),
  create: (draft: ProjectDraft) => api.request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(draft),
  }),
  update: (id: string, patch: Partial<ProjectDraft>) => api.request<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  }),
  remove: (id: string) => api.request<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' }),
  audit: (id: string) => api.request<AuditEntry[]>(`/projects/${id}/audit`),
  allAudit: () => api.request<AuditEntry[]>('/projects/audit/all'),
}
