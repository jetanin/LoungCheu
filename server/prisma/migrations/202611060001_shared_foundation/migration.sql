-- Shared prerequisite schema only. No authentication or event-management behavior.
CREATE TYPE "Role" AS ENUM ('PARTICIPANT', 'ORGANIZER');
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');
CREATE TABLE "User" (
  "id" UUID NOT NULL PRIMARY KEY,
  "username" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE TABLE "Event" (
  "id" UUID NOT NULL PRIMARY KEY,
  "organizer_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "starts_at" TIMESTAMPTZ(3) NOT NULL,
  "ends_at" TIMESTAMPTZ(3) NOT NULL,
  "registration_closes_at" TIMESTAMPTZ(3) NOT NULL,
  "capacity" INTEGER NOT NULL,
  "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Event_capacity_check" CHECK ("capacity" BETWEEN 1 AND 1000),
  CONSTRAINT "Event_time_order_check" CHECK ("registration_closes_at" <= "starts_at" AND "starts_at" < "ends_at")
);
CREATE INDEX "Event_status_starts_at_idx" ON "Event"("status", "starts_at");
CREATE INDEX "Event_organizer_id_idx" ON "Event"("organizer_id");
