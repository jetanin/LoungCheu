-- Validate before the explicit write transaction: if this guard raises inside
-- BEGIN, Prisma's error recording can mask the reconciliation message with
-- "current transaction is aborted". This precondition does not change data.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "registrations" WHERE "status" = 'CANCELLED') THEN
    RAISE EXCEPTION 'Legacy CANCELLED registrations require data reconciliation before lifecycle migration';
  END IF;
END $$;

-- Keep all schema changes and the backfill atomic after validation succeeds.
BEGIN;
ALTER TABLE "registrations" ADD COLUMN "cancelled_at" TIMESTAMPTZ(3);
CREATE TYPE "RegistrationAction" AS ENUM ('REGISTERED', 'CANCELLED', 'REACTIVATED');
CREATE TABLE "registration_history" (
  "id" UUID NOT NULL PRIMARY KEY,
  "registration_id" UUID NOT NULL REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "actor_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "action" "RegistrationAction" NOT NULL,
  "occurred_at" TIMESTAMPTZ(3) NOT NULL
);
CREATE INDEX "registration_history_registration_id_occurred_at_id_idx"
  ON "registration_history"("registration_id", "occurred_at", "id");

-- uuid() is a Prisma client default, not a database-side default.
INSERT INTO "registration_history" ("id", "registration_id", "actor_id", "action", "occurred_at")
SELECT gen_random_uuid(), "id", "participant_id", 'REGISTERED', "registered_at"
FROM "registrations";
COMMIT;
