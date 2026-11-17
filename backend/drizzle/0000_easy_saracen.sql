CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
CREATE TABLE "audit_logs_drizzle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "measurements_drizzle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"label" text DEFAULT 'Roof plane' NOT NULL,
	"polygon_wkt" text NOT NULL,
	"centroid" geometry(point),
	"pitch_degrees" numeric(6, 2) DEFAULT '0' NOT NULL,
	"plan_area_sqm" numeric(12, 2) DEFAULT '0' NOT NULL,
	"true_area_sqm" numeric(12, 2) DEFAULT '0' NOT NULL,
	"waste_percent" numeric(5, 2) DEFAULT '7' NOT NULL,
	"is_cyclonic" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects_drizzle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"customer_name" text NOT NULL,
	"address" text,
	"suburb" text,
	"state" text DEFAULT 'WA' NOT NULL,
	"postcode" text,
	"status" text DEFAULT 'NEW' NOT NULL,
	"coastal_zone" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants_drizzle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan" text DEFAULT 'STARTER' NOT NULL,
	"is_white_label" boolean DEFAULT false NOT NULL,
	"primary_colour" text DEFAULT '#0EA5E9' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_drizzle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'staff' NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs_drizzle" ADD CONSTRAINT "audit_logs_drizzle_tenant_id_tenants_drizzle_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_drizzle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurements_drizzle" ADD CONSTRAINT "measurements_drizzle_tenant_id_tenants_drizzle_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_drizzle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurements_drizzle" ADD CONSTRAINT "measurements_drizzle_project_id_projects_drizzle_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects_drizzle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects_drizzle" ADD CONSTRAINT "projects_drizzle_tenant_id_tenants_drizzle_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_drizzle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_drizzle" ADD CONSTRAINT "users_drizzle_tenant_id_tenants_drizzle_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_drizzle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_drizzle_tenant_idx" ON "audit_logs_drizzle" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_logs_drizzle_created_idx" ON "audit_logs_drizzle" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "measurements_drizzle_tenant_idx" ON "measurements_drizzle" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "measurements_drizzle_project_idx" ON "measurements_drizzle" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "projects_drizzle_tenant_idx" ON "projects_drizzle" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "projects_drizzle_status_idx" ON "projects_drizzle" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_drizzle_slug_idx" ON "tenants_drizzle" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_drizzle_tenant_email_idx" ON "users_drizzle" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "users_drizzle_tenant_idx" ON "users_drizzle" USING btree ("tenant_id");