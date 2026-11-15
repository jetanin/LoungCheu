# Issue #15: Docker packaging

Branch `build/15-lab5-docker` starts at Issue #14 commit `175b94b`. This is a stacked branch as requested: review its Docker changes against `refactor/14-lab5-cloud-ready`, and target `lab5-staging` after #14 is merged there. PR description: `Part of #15`. A teammate must review it before merging. This document describes local packaging, not GCP deployment or the final cloud C-05 proof.

## Files and adaptation from Guide Episode 3

- Root `Dockerfile`: shared npm-workspace installation from `package-lock.json`; Prisma generation; client/server builds; final unified Express + SPA image for CI/Cloud Run. It uses Node 22 as required by this repository. No host `node_modules`, build output or secret is used.
- Target `client`: nginx serves the built SPA and proxies `/api/` to `server:3000`. Target `checks`: typecheck plus unit tests using the same locked dependencies.
- `server/docker-entrypoint.sh`: `exec` only; application startup never migrates or seeds. `.gitattributes` keeps shell scripts LF on Windows. Runtime runs as the non-root `node` user.
- `compose.docker.yaml`: independent local project `loungcheu-lab5`, with `db`, one-shot `migrate`, `server`, `client`. Server waits for successful migrations/seed, then nginx waits for server readiness. The database has a named volume and no published host port. Existing `compose.yaml` and local databases are separate.
- `.dockerignore`: excludes all `.env` variants, dependencies, local output, keys, Git and logs. Runtime COPY paths are explicit; tests are used only by the optional checks target.
- `.env.docker.example`: placeholders for Compose configuration; `.env.docker` is private and ignored. `scripts/setup-docker-env.mjs` creates random values without displaying them and never overwrites an existing file.

The example kit has separate server/client Dockerfiles. Here a single root Dockerfile with named targets avoids duplicating workspace installation and uses the exact same application image for local migration and server. The image intentionally keeps locked Prisma CLI and tsx tooling for the separate migration/seed job; it is not a runtime-dependency-only image.

## Configuration

| Variable | Purpose | Secret? |
| --- | --- | --- |
| `DOCKER_DB_PASSWORD` | New local PostgreSQL volume password. Use random hex so it is safe in a URL. Changing the file does not rotate an existing database user's password. | Yes |
| `DOCKER_SESSION_SECRET` | Stable session signing secret, at least 32 random characters; retained across down/up. | Yes |
| `DOCKER_DEMO_PASSWORD` | Password for newly seeded accounts. Existing accounts are never reset. | Yes |
| `DOCKER_WEB_PORT` | Loopback frontend port; default 5173. `APP_ORIGIN` is derived from `http://127.0.0.1:<port>`. | No |
| `DOCKER_API_PORT` | Loopback API port; default 3000. | No |
| `APP_VERSION` | Local image/release identifier; default `local-docker`. | No |
| `HOST` | App bind address; Compose injects `0.0.0.0` so nginx can reach the API. | No |

Compose maps these into the application's `DATABASE_URL`, `SESSION_SECRET`, `DEMO_SEED_PASSWORD`, origin and port settings. It does not load `server/.env` or connect to the existing host DB. Credentials never enter build arguments or image environment defaults. Avoid printing resolved `docker compose config`, container environment or `.env.docker` in evidence.

Local Compose uses **development mode over HTTP** with compiled backend code, nginx and non-secure local cookies. Production image defaults remain `NODE_ENV=production`, all-interface binding and PORT 3000; deployment must provide HTTPS `APP_ORIGIN`, `SESSION_COOKIE_SECURE=true`, a stable secret, actual DB URL and release SHA. The production configuration still rejects insecure HTTP. No production validation was weakened to accommodate local Docker.

## Reproduce from a clean checkout

Prerequisites: Docker Desktop with Linux containers, Compose, and Node 22 for the credential/smoke helper scripts. Host npm installation and a host PostgreSQL instance are not needed. Run from the repository root. The following commands work in CMD or PowerShell:

```text
node scripts/setup-docker-env.mjs
docker compose --env-file .env.docker -f compose.docker.yaml config --quiet
docker compose --env-file .env.docker -f compose.docker.yaml up --build -d
docker compose --env-file .env.docker -f compose.docker.yaml ps -a
```

If ports are occupied, edit only `DOCKER_WEB_PORT`/`DOCKER_API_PORT` in the private file before starting. The verification run used 5185/3015; the defaults are 5173/3000. Open `http://127.0.0.1:<DOCKER_WEB_PORT>/login` (not localhost, because the origin must match). Read the demo password privately from `.env.docker`; accounts include `organizer.a` and `participant.a`.

Expected: db healthy, migrate exited 0, server healthy, client running. Readiness is available both through nginx and through the published API port.

```text
node scripts/smoke-docker.mjs create
docker compose --env-file .env.docker -f compose.docker.yaml down
docker compose --env-file .env.docker -f compose.docker.yaml up -d --wait
node scripts/smoke-docker.mjs verify
```

`create` logs in through nginx, creates/publishes an event and registers a participant. It verifies anonymous access rejection and duplicate-registration rejection. `verify` logs in again and checks the **same** event and seat count; duplicate registration remains rejected. `.local/docker-smoke.json` contains only record identifiers/title, not cookies/passwords, and is ignored. Rerun `verify` against an existing smoke record; `create` refuses to overwrite its record index. No test fixture reset or reseed is used to reconstruct the record.

`down` preserves the named volume. Do not add `-v`: that deletes the local data. Keep `.env.docker` unchanged so the existing DB password and session signing secret continue to work.

Standalone build and checks (no DB required):

```text
docker build -t loungcheu-lab5-app .
docker build --target checks -t loungcheu-lab5-checks .
```

## Verification, 15 November 2026

Tested the Issue #15 working tree based on `175b94b`, with no host npm dependencies, prebuilt client/server output or secret files copied into the image. These results are local observations, not a GCP release or a claim that a reviewed commit has been deployed.

| Check | Observed result |
| --- | --- |
| Root Docker build | PASS: npm ci, Prisma 7 generation, client/server compilation and final image |
| Checks target | PASS: typecheck and 90 unit tests across 11 files |
| Compose config | PASS, validated without printing resolved secrets |
| First startup | PASS: db healthy, migrate exit 0, server healthy, nginx running |
| HTTP journey | PASS through nginx: SPA/login, health/readiness, organizer event creation/publish, participant registration, 401 anonymous rejection and 409 duplicate rejection |
| Container recreation | PASS: down/up without deleting volume; original event `be809a56-d5f3-4ba5-80f6-3b51d7182cc4` and one active registration remain |
| Unified production image | PASS using a temporary Compose run: built SPA `/login`, real DB readiness and `Secure` session cookie with forwarded HTTPS; this checks the container/proxy configuration, not public GCP TLS |
| Git hygiene | PASS: diff whitespace check; private `.env.docker` and `.local/docker-smoke.json` are ignored |

Before closing #15: add the reviewed commit and PR links to the evidence index, and retain the build/test output for C-03. This stacked branch needs teammate review and a PR into `lab5-staging`. Cloud HTTPS, GCP revision identification and restart/redeploy persistence remain work for later issues.
