-- F-08 / TEST-65: additive attendance storage. Existing registration and
-- lifecycle history rows are retained; old attendance values start as NULL.
BEGIN;

ALTER TABLE "registrations"
  ADD COLUMN "checked_in_at" TIMESTAMPTZ(3),
  ADD COLUMN "checked_in_by_id" UUID,
  ADD CONSTRAINT "registrations_checked_in_pair_check"
    CHECK (("checked_in_at" IS NULL) = ("checked_in_by_id" IS NULL)),
  ADD CONSTRAINT "registrations_checked_in_active_check"
    CHECK ("checked_in_at" IS NULL OR "status" = 'ACTIVE'),
  ADD CONSTRAINT "registrations_checked_in_by_id_fkey"
    FOREIGN KEY ("checked_in_by_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
