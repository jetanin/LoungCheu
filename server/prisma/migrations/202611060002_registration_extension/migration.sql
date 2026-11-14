-- Additive to staging's auth migration: users/sessions are preserved.
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');
CREATE TYPE "RegistrationStatus" AS ENUM ('ACTIVE', 'CANCELLED');
CREATE TABLE "events" (
  "id" UUID NOT NULL PRIMARY KEY,
  "organizer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "title" TEXT NOT NULL, "description" TEXT NOT NULL, "location" TEXT NOT NULL,
  "starts_at" TIMESTAMPTZ(3) NOT NULL, "ends_at" TIMESTAMPTZ(3) NOT NULL,
  "registration_closes_at" TIMESTAMPTZ(3) NOT NULL,
  "capacity" INTEGER NOT NULL, "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "events_capacity_check" CHECK ("capacity" BETWEEN 1 AND 1000),
  CONSTRAINT "events_time_order_check" CHECK ("registration_closes_at" <= "starts_at" AND "starts_at" < "ends_at")
);
CREATE INDEX "events_status_starts_at_idx" ON "events"("status", "starts_at");
CREATE INDEX "events_organizer_id_idx" ON "events"("organizer_id");
CREATE TABLE "registrations" (
  "id" UUID NOT NULL PRIMARY KEY,
  "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "participant_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "status" "RegistrationStatus" NOT NULL DEFAULT 'ACTIVE',
  "registered_at" TIMESTAMPTZ(3) NOT NULL
);
CREATE UNIQUE INDEX "registrations_event_id_participant_id_key" ON "registrations"("event_id", "participant_id");
CREATE INDEX "registrations_participant_id_registered_at_idx" ON "registrations"("participant_id", "registered_at");
CREATE INDEX "registrations_event_id_status_idx" ON "registrations"("event_id", "status");
