/**
 * Drizzle ORM schema for the enterprise transformation.
 * Workspace mapping: target /src/server/db -> backend/src/server/db
 * Every domain table is scoped by tenantId (multi-tenant SaaS requirement).
 * Prisma schema remains intact until phase 1.4 verification passes (Guardrail #6).
 */
import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  timestamp,
  boolean,
  geometry,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core'

export const tenants = pgTable('tenants_drizzle', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  plan: text('plan').notNull().default('STARTER'),
  isWhiteLabel: boolean('is_white_label').notNull().default(false),
  primaryColour: text('primary_colour').notNull().default('#0EA5E9'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('tenants_drizzle_slug_idx').on(t.slug)])

export const users = pgTable('users_drizzle', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('staff'),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('users_drizzle_tenant_email_idx').on(t.tenantId, t.email),
  index('users_drizzle_tenant_idx').on(t.tenantId),
])

/** A roofing project / job site. */
export const projects = pgTable('projects_drizzle', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  customerName: text('customer_name').notNull(),
  address: text('address'),
  suburb: text('suburb'),
  state: text('state').notNull().default('WA'),
  postcode: text('postcode'),
  status: text('status').notNull().default('NEW'),
  // Coastal zone flag drives Colorbond Ultra material upgrades
  coastalZone: boolean('coastal_zone').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('projects_drizzle_tenant_idx').on(t.tenantId),
  index('projects_drizzle_status_idx').on(t.status),
])

/**
 * Aerial roof measurement. Polygon stored as WKT text (PostGIS ST_GeomFromText),
 * centroid stored as a native PostGIS point geometry (SRID 4326).
 */
export const measurements = pgTable('measurements_drizzle', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  label: text('label').notNull().default('Roof plane'),
  /** WKT polygon, e.g. SRID=4326;POLYGON((lon lat,...)) */
  polygonWkt: text('polygon_wkt').notNull(),
  /** Native PostGIS point for spatial indexing/queries */
  centroid: geometry('centroid', { type: 'point', srid: 4326 }),
  pitchDegrees: numeric('pitch_degrees', { precision: 6, scale: 2 }).notNull().default('0'),
  planAreaSqm: numeric('plan_area_sqm', { precision: 12, scale: 2 }).notNull().default('0'),
  trueAreaSqm: numeric('true_area_sqm', { precision: 12, scale: 2 }).notNull().default('0'),
  wastePercent: numeric('waste_percent', { precision: 5, scale: 2 }).notNull().default('7'),
  isCyclonic: boolean('is_cyclonic').notNull().default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('measurements_drizzle_tenant_idx').on(t.tenantId),
  index('measurements_drizzle_project_idx').on(t.projectId),
])

/** Append-only audit trail for every mutation. */
export const auditLogs = pgTable('audit_logs_drizzle', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('audit_logs_drizzle_tenant_idx').on(t.tenantId),
  index('audit_logs_drizzle_created_idx').on(t.createdAt),
])

export type Tenant = typeof tenants.$inferSelect
export type NewTenant = typeof tenants.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type Measurement = typeof measurements.$inferSelect
export type NewMeasurement = typeof measurements.$inferInsert
