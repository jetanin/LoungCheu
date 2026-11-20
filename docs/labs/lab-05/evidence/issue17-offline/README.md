# Issue #17 offline preparation evidence

- Result: PASS, 19 standard-library Python tests.
- [Commands and actual output](transcript.log).
- [Working-tree baseline, source hashes and command exit codes](manifest.json).
- Validated default preview without any subprocess, mocked gcloud ordering/failure guards, configuration validation, HTTPS origin handling, secret-output suppression, and read-only HTTP/version checks with mocked responses.
- Preview and Python syntax checks also exited 0. Preview used the baseline SHA solely as a display input, not as a tested deployed commit.
- This is an uncommitted working-tree check identified by hashes. No cloud commands, real HTTP smoke, IAM/database/secret mutations, public URL, C-04 success or GitHub CI run is claimed.

Re-run from the repository root:

```text
python -m unittest discover -s deploy/tests -v
python -m py_compile deploy/first_deploy.py deploy/smoke_test.py
```
