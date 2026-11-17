# RoofDynamics — Disaster Recovery & Backup Procedures

> Owner: DevOps (human). This document describes the recovery runbook for the
> production PostgreSQL 16 + PostGIS database and object storage.

---

## 1. System Inventory

| Component | Location | Notes |
|-----------|----------|-------|
| Primary DB | PostgreSQL 16 + PostGIS (managed) | All tenant data; Prisma + Drizzle schemas |
| Prisma migrations | `prisma/migrations/` | Authoritative local history |
| Drizzle migrations | `backend/drizzle/` | PostGIS spatial tables (needs PostGIS) |
| Object storage | Cloudflare R2 bucket | Generated PDFs, roof photos |
| Frontend | Netlify (`roofdynamics.netlify.app`) | Static build from `frontend/dist` |
| Backend | Node/Express server | API + Socket.io + Inngest endpoint |

---

## 2. Backup Policy

- **Automatic PITR**: enable point-in-time recovery on the managed PostgreSQL instance (7-day window minimum).
- **Nightly logical backup**: `pg_dump` to an R2/S3 bucket with 30-day retention.

```bash
# Nightly logical backup (cron)
DATABASE_URL='postgresql://...' pg_dump \
  --format=custom --no-owner --no-privileges \
  --file="roofdynamics-$(date +%F).dump" \
  "$DATABASE_URL"
# Upload to object storage using the configured client
```

- **Object storage versioning**: enable R2 bucket versioning for PDFs/photos.

---

## 3. Restoration Runbook

### 3.1 Full restore to a point in time
1. Provision a **new** PostgreSQL 16 instance with **PostGIS** enabled.
2. Restore from PITR to the target timestamp (provider console / CLI).
3. Verify integrity: `SELECT count(*) FROM tenants; SELECT count(*) FROM projects;`
4. Run `npm --prefix backend run prisma:migrate deploy` (idempotent).
5. Run `npm --prefix backend run db:migrate` for Drizzle spatial tables (requires PostGIS).
6. Restart backend; confirm `GET /api/health` returns 200.
7. Re-point the backend `DATABASE_URL` and restart.

### 3.2 Logical restore from pg_dump
```bash
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" roofdynamics-YYYY-MM-DD.dump
```

### 3.3 Object storage restore
- Restore from R2 versioning or replica bucket; verify public URLs resolve.

---

## 4. Failure Scenarios

| Scenario | Recovery |
|----------|----------|
| DB corruption | PITR restore to pre-corruption timestamp |
| Accidental DELETE | PITR or logical restore; audit logs in `audit_logs` help identify scope |
| Bad deploy | Redeploy previous Netlify deploy ID; roll back backend image |
| Storage loss | Restore from R2 versioning |
| Lost `.env` | Re-provision from secret manager using `.env.example` as the key checklist |

---

## 5. Verification Checklist (after any restore)

- [ ] `GET /api/health` → 200
- [ ] Tenant switcher lists both tenants with entitlements
- [ ] Login works (JWT + Supabase when configured)
- [ ] Projects/CRM/WHS/Billing pages render with data
- [ ] `GET /api/system/status` reports expected adapters
- [ ] Backups resume on schedule
- [ ] No TODO/stub markers in core paths

---

## 6. Contacts

- Database/hosting provider: on-call rotation
- Domain/DNS: registrar account owner
- Cloudflare R2: account owner
