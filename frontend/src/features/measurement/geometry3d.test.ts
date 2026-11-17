import { describe, it, expect } from 'vitest'
import { ridgeHeight, buildGableMesh, toLocalMetres, sceneScale, type LonLat } from './geometry3d'

describe('3D roof geometry', () => {
  it('computes ridge height from span and pitch', () => {
    expect(ridgeHeight(10, 45)).toBeCloseTo(5, 5)
    expect(ridgeHeight(10, 0)).toBe(0)
    expect(ridgeHeight(20, 30)).toBeCloseTo(20 / 2 * Math.tan(Math.PI / 6), 5)
  })

  it('builds a gable mesh with 36 position floats (12 triangles)', () => {
    const mesh = buildGableMesh(10, 8, 30)
    expect(mesh.positions).toHaveLength(36)
    expect(mesh.width).toBe(10)
    expect(mesh.depth).toBe(8)
    expect(mesh.ridgeHeight).toBeGreaterThan(0)
  })

  it('spaces vertices correctly', () => {
    const mesh = buildGableMesh(10, 8, 30)
    // left slope start at -5,0,-4; ridge at 0,h,-4
    expect(mesh.positions[0]).toBe(-5)
    expect(mesh.positions[4]).toBeCloseTo(mesh.ridgeHeight, 5)
    expect(mesh.positions[2]).toBe(-4)
  })

  it('centres lon/lat vertices around the bounding box', () => {
    const verts: LonLat[] = [
      { lon: 115.75, lat: -32.05 },
      { lon: 115.751, lat: -32.051 },
    ]
    const local = toLocalMetres(verts)
    expect(local).toHaveLength(2)
    expect(local[0].x).toBeLessThan(0)
    expect(local[1].x).toBeGreaterThan(0)
  })

  it('returns a sane scene scale', () => {
    expect(sceneScale(0)).toBe(1)
    expect(sceneScale(20)).toBe(0.5)
    expect(sceneScale(5)).toBe(2)
  })
})
