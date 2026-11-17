'use client'

import React, { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useToast } from '../../components/Toast'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { nextStatus } from './tasks'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  dueDate?: string
  completedAt?: string
}

export function SubTasks() {
  const toast = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')

  const load = () => api.request<Task[]>('/operations/tasks').then(setTasks).catch(() => setTasks([]))
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!title.trim()) { toast.showToast('warning', 'Enter a task title'); return }
    try {
      await api.request('/operations/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, dueDate: dueDate || null }),
      })
      setTitle(''); setDueDate('')
      load()
      toast.showToast('success', 'Sub-task created')
    } catch (err: any) {
      toast.showToast('error', err.message || 'Failed to create task')
    }
  }

  const cycle = async (task: Task) => {
    const next = nextStatus(task.status)
    try {
      await api.request(`/operations/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      })
      load()
    } catch (err: any) {
      toast.showToast('error', err.message || 'Failed to update task')
    }
  }

  const open = tasks.filter((t) => t.status !== 'COMPLETED').length

  return (
    <Card>
      <CardHeader><CardTitle>Sub-tasks ({open} open)</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label htmlFor="task-title">Task</Label>
            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Order materials" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="task-due">Due date</Label>
            <Input id="task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="flex items-end"><Button onClick={add} className="w-full">Add Task</Button></div>
        </div>
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-2 rounded-md border border-[var(--border)]">
              <div>
                <p className="text-sm font-medium">{t.title}</p>
                {t.dueDate && <p className="text-xs text-[var(--muted-foreground)]">Due {t.dueDate.slice(0, 10)}</p>}
              </div>
              <button onClick={() => cycle(t)} className="shrink-0">
                <Badge variant={t.status === 'COMPLETED' ? 'success' : t.status === 'IN_PROGRESS' ? 'warning' : 'secondary'}>
                  {t.status}
                </Badge>
              </button>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">No sub-tasks yet.</p>}
        </div>
      </CardContent>
    </Card>
  )
}
