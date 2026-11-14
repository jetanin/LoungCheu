CREATE TYPE "Role" AS ENUM ('PARTICIPANT', 'ORGANIZER');
CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "username" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- connect-pg-simple's infrastructure schema, owned by versioned migrations.
CREATE TABLE "sessions" (
  "sid" VARCHAR NOT NULL PRIMARY KEY,
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL
);
CREATE INDEX "sessions_expire_idx" ON "sessions"("expire");
