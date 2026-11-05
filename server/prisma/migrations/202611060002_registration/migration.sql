CREATE TYPE "RegistrationStatus" AS ENUM ('ACTIVE', 'CANCELLED');
CREATE TABLE "Registration" (
  "id" UUID NOT NULL PRIMARY KEY,
  "event_id" UUID NOT NULL REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "participant_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "status" "RegistrationStatus" NOT NULL DEFAULT 'ACTIVE',
  "registered_at" TIMESTAMPTZ(3) NOT NULL
);
CREATE UNIQUE INDEX "Registration_event_id_participant_id_key" ON "Registration"("event_id", "participant_id");
CREATE INDEX "Registration_participant_id_registered_at_idx" ON "Registration"("participant_id", "registered_at");
CREATE INDEX "Registration_event_id_status_idx" ON "Registration"("event_id", "status");
