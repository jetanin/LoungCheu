# Issue #4: own registrations and organizer roster

Participants can follow registration success/recovery links to their persisted list and detail, including after reload/re-login. Organizers can open an owned event's roster and refresh ACTIVE count and participant names. Queries enforce session ownership and return only contract fields; private screens discard data across account changes and access failures.

Implements F-04/F-05, AC-18–23. Adds protected GETs for `/api/my/registrations`, `/api/my/registrations/{id}`, and `/api/organizer/events/{id}/registrations`. No database migration or Sprint2/3 controls. Restores the optional database connection limit needed by existing concurrency tests and typecheck.

Validation: full Vitest159 PASS and typecheck/build PASS on Node22.23.2 and Node24.15.0. Four new API/database cases use PostgreSQL. Compiled smoke3 PASS on Node24; Node22 smoke blocked by localhost listen EACCES. Chromium attempts failed before feature assertions due to local network denial loading React. See [actual verification and limits](views-verification.md). Browser journey, teammate review and release remain pending.

Suggested PR base while the events PR is pending: `feature/events`; head: `feature/registration-views`. This file is a draft description only; no PR has been opened. Retarget to the team's integration branch after events is merged. Reference `Closes #4` only when the acceptance/review gates are satisfied.

Commands for the user, after reviewing changes:

```powershell
git add README.md client/src/app/App.tsx client/src/features/events/EventPage.tsx client/src/features/registrations/RegistrationViews.tsx client/src/features/registrations/RegistrationViews.test.tsx server/src/app.ts server/src/db/client.ts server/src/modules/registrations/queries.ts server/src/modules/registrations/read-router.ts server/tests/unit/registration-queries.test.ts server/tests/integration/registration-views.test.ts tests/e2e/registration-views.spec.ts docs/changelog.md docs/features.md docs/system-sds.md docs/traceability.md docs/sprints/sprint-1/README.md docs/sprints/sprint-1/contracts.md docs/sprints/sprint-1/sts.md docs/registration/views-verification.md docs/registration/views-pr.md
git commit -m "feat(registrations): add own records and organizer roster"
git push -u origin feature/registration-views
```

Branch creation/switch was executed after the user explicitly requested it. Commit/push commands above have not been run.
