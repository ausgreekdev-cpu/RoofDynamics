'use client'

import React, { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import * as THREE from 'three'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { buildGableMesh, sceneScale, type RoofMeshData } from './geometry3d'
import type { LonLat } from './area'

interface Roof3DViewerProps {
  vertices: LonLat[]
  pitchDegrees: number
  onPitchChange?: (pitch: number) => void
}

function RoofMesh({ data }: { data: RoofMeshData }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3))
    geo.computeVertexNormals()
    return geo
  }, [data.positions])

  return (
    <mesh geometry={geometry} scale={sceneScale(data.width)}>
      <meshStandardMaterial color="#0EA5E9" side={THREE.DoubleSide} roughness={0.7} metalness={0.1} />
    </mesh>
  )
}

export function Roof3DViewer({ vertices, pitchDegrees, onPitchChange }: Roof3DViewerProps) {
  const span = useMemo(() => {
    if (vertices.length === 0) return 10
    const lons = vertices.map((v) => v.lon)
    const lats = vertices.map((v) => v.lat)
    return Math.max((Math.max(...lons) - Math.min(...lons)) * 95_000, (Math.max(...lats) - Math.min(...lats)) * 111_320, 1)
  }, [vertices])

  const depth = useMemo(() => {
    if (vertices.length === 0) return 8
    const lats = vertices.map((v) => v.lat)
    return Math.max((Math.max(...lats) - Math.min(...lats)) * 111_320, 1)
  }, [vertices])

  const mesh = useMemo(() => buildGableMesh(span, depth, pitchDegrees), [span, depth, pitchDegrees])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>3D Roof Preview</CardTitle>
          <Badge variant="secondary">Three.js</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="pitch-3d">Pitch override (°)</Label>
          <Input
            id="pitch-3d"
            type="number"
            min={0}
            max={60}
            value={pitchDegrees}
            onChange={(e) => onPitchChange?.(Number(e.target.value))}
          />
        </div>
        <div className="h-64 rounded-md overflow-hidden border border-[var(--border)] bg-[#0A192F]">
          <Canvas camera={{ position: [12, 10, 14], fov: 45 }}>
            <color attach="background" args={['#0A192F']} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 15, 5]} intensity={1.2} />
            <RoofMesh data={mesh} />
            <Grid args={[30, 30]} cellColor="#1E293B" sectionColor="#334155" />
            <OrbitControls enablePan enableZoom enableRotate />
          </Canvas>
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          Ridge height {mesh.ridgeHeight.toFixed(2)} m · Span {span.toFixed(1)} m · Depth {depth.toFixed(1)} m
        </p>
      </CardContent>
    </Card>
  )
}
