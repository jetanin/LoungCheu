# C-03: fresh remote clone build and database run

| Field | Verified value |
| --- | --- |
| Check / requirements | C-03 / R-01, R-02 |
| Date | 15 November 2026 (Asia/Bangkok) |
| Source | https://github.com/jetanin/LoungCheu.git |
| Tested source commit | `54fd6603594a7a2e0327aad93624796b61903cc5` |
| Branch at clone time | `build/15-lab5-docker` |
| Result | PASS |
| Evidence | [Command/output transcript](transcript.log), [machine-readable manifest](manifest.json) |

This run cloned the remote repository into a new separate directory. `git status --porcelain=v1 --untracked-files=all` was empty before setup and after verification. Preflight confirmed no node_modules, server/client build output, server/.env, .env.docker or earlier smoke state. No files, credentials, database volumes or dependencies were copied from the development checkout.

The committed helper generated a new private .env.docker with exactly the keys in .env.docker.example. Only non-secret ports (5195/3025), the isolated Compose project and runtime APP_VERSION were overridden through process environment. Runtime APP_VERSION matched the full tested SHA on health/readiness requests through both nginx and the direct API port. Secrets and cookie/token values are not included in these evidence files.

## Commands and observations

The transcript records every executed command, stdout/stderr and exit code. All commands exited 0. Important entries:

| Command/check | Observed result |
| --- | --- |
| `git clone --single-branch --branch build/15-lab5-docker` | Fresh remote clone created; complete URL and destination are recorded in the transcript |
| `git rev-parse HEAD` | `54fd6603594a7a2e0327aad93624796b61903cc5` |
| Fresh-clone preflight | Source clean; all checked local artifact paths absent |
| `node scripts/setup-docker-env.mjs` | New private configuration generated; template keys matched |
| Compose `config --quiet` | Valid; no resolved environment values printed |
| Compose `build --no-cache --pull server client` | npm ci, Prisma generation, frontend/backend compilation and image export completed |
| Compose `up --no-build -d --wait` and `ps -a` | New isolated DB volume; DB/server healthy, migrate exit 0, nginx running |
| HTTP GET /api/ready and /api/health | 200; version equals the tested source SHA, through nginx and directly to API |
| `node scripts/smoke-docker.mjs create` | PASS: SPA, login, event publish, registration, anonymous denial and duplicate rejection |
| Compose down / up, then `node scripts/smoke-docker.mjs verify` | PASS: same event `ae47cf66-3b83-4e0c-a4a9-8babff8962ec` and one active registration remain |
| Final cleanup | Only this test project's containers/network stopped; volume retained |

The complete manifest includes image ID, source file hashes, command exit codes, record identifiers and the SHA-256 of the transcript. The host used Node 24.15.0 only for the built-in helper scripts; the application and all npm installation/build steps ran inside the committed Node 22 Docker image. No host npm install or prebuilt output was used.

## Reproduce at the tested commit (CMD)

Choose a new directory and free local ports. The following pins the application source even if the branch moves later. Do not copy an existing .env file or database volume.

```cmd
git clone --single-branch --branch build/15-lab5-docker https://github.com/jetanin/LoungCheu.git loungcheu-c03
cd loungcheu-c03
git checkout --detach 54fd6603594a7a2e0327aad93624796b61903cc5
git status --porcelain=v1 --untracked-files=all
set DOCKER_WEB_PORT=5195
set DOCKER_API_PORT=3025
set APP_VERSION=54fd6603594a7a2e0327aad93624796b61903cc5
node scripts/setup-docker-env.mjs
docker compose -p c03-reproduce --env-file .env.docker -f compose.docker.yaml config --quiet
docker compose -p c03-reproduce --env-file .env.docker -f compose.docker.yaml build --no-cache --pull server client
docker compose -p c03-reproduce --env-file .env.docker -f compose.docker.yaml up --no-build -d --wait
docker compose -p c03-reproduce --env-file .env.docker -f compose.docker.yaml ps -a
node scripts/smoke-docker.mjs create
docker compose -p c03-reproduce --env-file .env.docker -f compose.docker.yaml down
docker compose -p c03-reproduce --env-file .env.docker -f compose.docker.yaml up --no-build -d --wait
node scripts/smoke-docker.mjs verify
docker compose -p c03-reproduce --env-file .env.docker -f compose.docker.yaml down
```

This proves local C-03. It does not claim public GCP deployment, GCP persistence C-05 or deployment-pipeline C-06. Application source was tested at the SHA above; the follow-up adding these evidence documents changes no application or Docker source.
