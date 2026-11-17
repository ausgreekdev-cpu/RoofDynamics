import { PgDialect } from 'drizzle-orm/pg-core'
import {
  pointWkt,
  polygonWkt,
  areaSqm,
  trueAreaSqm,
  distanceMeters,
  centroidWkt,
  pointInPolygon,
  createPostGISExtension,
  isCoastalExpression,
  PERTH_COASTAL_POINTS,
} from './geo'

const dialect = new PgDialect()
const render = (expression: ReturnType<typeof areaSqm>) => dialect.sqlToQuery(expression).sql

describe('PostGIS geometry helpers', () => {
  describe('WKT builders', () => {
    it('builds a WGS84 point', () => {
      expect(pointWkt({ lon: 115.75, lat: -32.05 })).toBe('SRID=4326;POINT(115.75 -32.05)')
    })

    it('rejects non-finite coordinates', () => {
      expect(() => pointWkt({ lon: NaN, lat: -32 })).toThrow(/finite/)
    })

    it('builds a closed polygon from an open ring', () => {
      const polygon = polygonWkt([
        { lon: 115.75, lat: -32.05 },
        { lon: 115.76, lat: -32.05 },
        { lon: 115.76, lat: -32.06 },
      ])
      expect(polygon).toContain('POLYGON((115.75 -32.05, 115.76 -32.05, 115.76 -32.06, 115.75 -32.05))')
    })

    it('does not duplicate the closing vertex when already closed', () => {
      const pts = [
        { lon: 0, lat: 0 }, { lon: 1, lat: 0 }, { lon: 1, lat: 1 }, { lon: 0, lat: 0 },
      ]
      expect((polygonWkt(pts).match(/0 0/g) || []).length).toBe(2)
    })

    it('rejects polygons with fewer than 3 vertices', () => {
      expect(() => polygonWkt([{ lon: 0, lat: 0 }, { lon: 1, lat: 1 }])).toThrow(/3 vertices/)
    })
  })

  describe('SQL expressions', () => {
    it('computes plan area with geography cast', () => {
      const sql = render(areaSqm('SRID=4326;POLYGON((0 0,1 0,1 1,0 0))'))
      expect(sql).toContain('ST_Area')
      expect(sql).toContain('::geography')
      expect(sql).toContain('ST_GeomFromText')
    })

    it('computes true area with pitch and waste factors', () => {
      const sql = render(trueAreaSqm('SRID=4326;POINT(0 0)', 22, 0.07))
      expect(sql).toContain('COS(RADIANS(')
      expect(sql).toContain('ST_Area')
    })

    it('computes geodesic distance between points', () => {
      const sql = render(distanceMeters('SRID=4326;POINT(0 0)', 'SRID=4326;POINT(1 1)'))
      expect(sql).toContain('ST_Distance')
      expect(sql).toContain('::geography')
    })

    it('computes centroid and containment', () => {
      expect(render(centroidWkt('SRID=4326;POLYGON((0 0,1 0,1 1,0 0))'))).toContain('ST_Centroid')
      expect(render(pointInPolygon('SRID=4326;POINT(0 0)', 'SRID=4326;POLYGON((0 0,1 0,1 1,0 0))'))).toContain('ST_Within')
    })

    it('emits the PostGIS extension statement', () => {
      expect(render(createPostGISExtension())).toContain('CREATE EXTENSION IF NOT EXISTS postgis')
    })

    it('builds a coastal-zone OR expression for all 5 Perth suburbs', () => {
      const sql = render(isCoastalExpression('SRID=4326;POINT(115.75 -32.05)'))
      expect((sql.match(/ST_Distance/g) || []).length).toBe(5)
      expect(sql).toContain('<= 1000')
    })
  })

  it('exposes 5 coastal reference points', () => {
    expect(Object.keys(PERTH_COASTAL_POINTS)).toHaveLength(5)
    expect(Object.keys(PERTH_COASTAL_POINTS)).toEqual(
      expect.arrayContaining(['Fremantle', 'Scarborough', 'Cottesloe', 'Hillarys', 'Rockingham'])
    )
  })
})
