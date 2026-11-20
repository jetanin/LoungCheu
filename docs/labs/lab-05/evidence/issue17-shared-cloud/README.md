# Issue #17: shared-course offline verification

Result: **28 tests PASS**. Read the [actual command/output transcript](transcript.log) and [baseline/source hashes/exit codes](manifest.json).

Verified the course-only scope, exact resource lookups, preservation of portal env/secret bindings, correct npm migration/seed names, session-secret reference restrictions, digest validation, clean-main guards, detached GitHub main support, migration failure stopping service update, rollback skipping build/migration/seed, version-aware read-only smoke and secret/driver-output suppression.

Both Bash wrappers passed separate syntax checks and ran successfully in DRY_RUN=1. Both workflow YAML files parsed with the host's PyYAML BaseLoader. This is syntax validation, not actionlint or a successful GitHub workflow run.

The preview and mocks made **zero gcloud, registry, DB, IAM or real HTTP calls**. Preview commands, SHA/digest and sample URL are printed placeholders. No shared resource was changed, no actual session secret was generated, and no public deployment/C-04, live rollback/C-06 or GCP persistence/C-05 success is claimed.

The tested source is an uncommitted working tree based on the commit in the manifest; hashes identify the exact code. Earlier owner-provisioned evidence remains historical. Repeat offline checks from the repository root:

```bash
python3 -m unittest discover -s deploy/tests -v
bash -n deploy/deploy.sh
bash -n deploy/release.sh
DRY_RUN=1 bash deploy/deploy.sh
IMAGE_TAG=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa DRY_RUN=1 bash deploy/release.sh
```
