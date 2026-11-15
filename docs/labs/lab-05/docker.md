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

## C-03 fresh-clone evidence, 15 November 2026

Tested committed application source **`54fd6603594a7a2e0327aad93624796b61903cc5`** from a **new remote clone**, not the earlier working tree. The source was clean before setup and after verification, with no host dependencies, build output, secret files or existing database volume copied in.

Evidence index: [C-03 commands, results and reproduction steps](evidence/c03-20261115-54fd660/README.md). Full [command/output transcript](evidence/c03-20261115-54fd660/transcript.log) and [manifest with tested SHA, image ID, hashes and exit codes](evidence/c03-20261115-54fd660/manifest.json) are retained in the repository. These links replace the previous unsupported working-tree PASS summary as evidence for C-03 (R-01/R-02).

| Check | Observed result and evidence |
| --- | --- |
| Fresh remote clone | Correct tested SHA; empty git status; no node_modules, dist or local environment artifacts |
| Configuration | New private values generated for exactly the committed .env.docker.example keys; only ports/project/release ID overridden |
| Fresh image build | PASS: `build --no-cache --pull server client`; npm ci, Prisma generation and client/server compilation logged |
| Run with new DB | PASS: isolated new volume, DB/server healthy, migration exited 0, nginx running |
| Runtime source identification | Health/readiness returned the tested SHA through nginx (5195) and direct API (3025) |
| Working application | PASS: login, event creation/publish, registration, anonymous rejection and duplicate rejection |
| Container recreation | PASS: original event `ae47cf66-3b83-4e0c-a4a9-8babff8962ec` and one active registration still present after down/up |
| Cleanup/source integrity | Only test containers/network stopped; volume retained; tracked source remained clean |

All recorded commands exited 0. This run did not repeat the earlier unit/checks-target suite or production proxy-cookie test; those earlier working-tree observations are not presented as fresh-clone evidence. C-03 application/build behavior was tested at the exact source SHA above; this follow-up only adds documentation and captured evidence.

Before closing #15, link the reviewed PR/evidence in the final PDF index. Teammate review into lab5-staging is still required. Public GCP deployment, GCP restart/redeploy C-05 and release-pipeline evidence remain later work.
