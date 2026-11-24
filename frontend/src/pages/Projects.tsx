'use client'

import React, { useState } from 'react'
import { FeatureGate } from '../components/FeatureGate'
import { RoleGuard } from '../features/auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { ProjectsList, BatchImport, JobPhotoTimeline, WhsSwmsPanel } from '../features/projects'
import { useProjects } from '../features/projects'

export default function Projects() {
  const { projects } = useProjects()
  const [tab, setTab] = useState('all')
  const [photoProjectId, setPhotoProjectId] = useState<string>("")

  const selectedPhotoProject = photoProjectId || (projects[0]?.id ?? "demo-project");

  return (
    <FeatureGate moduleKey="CRM_QUOTING">
      <RoleGuard permission="projects:read">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Guided project creation, full CRUD, audit trail and CSV batch imports.
            </p>
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All Projects</TabsTrigger>
              <TabsTrigger value="import">Batch Import</TabsTrigger>
              <TabsTrigger value="photos">Photo Timeline</TabsTrigger>
              <TabsTrigger value="whs">WHS & SWMS</TabsTrigger>
            </TabsList>
            <TabsContent value="all"><ProjectsList /></TabsContent>
            <TabsContent value="import"><BatchImport /></TabsContent>
            <TabsContent value="photos">
              <div className="space-y-3">
                {projects.length > 0 && (
                  <select
                    value={selectedPhotoProject}
                    onChange={(e) => setPhotoProjectId(e.target.value)}
                    className="h-9 rounded-md border border-[#334155] bg-[#0F172A] px-3 text-sm text-[#F8FAFC]"
                  >
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
                <JobPhotoTimeline projectId={selectedPhotoProject} />
              </div>
            </TabsContent>
            <TabsContent value="whs">
              <div className="space-y-3">
                {projects.length > 0 && (
                  <select
                    value={selectedPhotoProject}
                    onChange={(e) => setPhotoProjectId(e.target.value)}
                    className="h-9 rounded-md border border-[#334155] bg-[#0F172A] px-3 text-sm text-[#F8FAFC]"
                  >
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
                <WhsSwmsPanel projectId={selectedPhotoProject} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </RoleGuard>
    </FeatureGate>
  )
}
