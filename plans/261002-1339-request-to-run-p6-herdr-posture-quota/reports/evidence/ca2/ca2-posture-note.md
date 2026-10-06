# Read-only posture (reviewer)

- Source: `BUILTIN_POLICIES['host-write-denied']` in `src/runner/dispatch/confinement/policies.mjs`.
- Control `hostWrite: 'deny'` — the repository/host is not writable; `hostRead: 'allow'` so the reviewer can read everything.
- Only write grants: `run-output` (the run outbox), plus `private-home` and read-only `executor-credentials`.
- Contrast `workspace-write`: same denies, but adds `workspace` and `workspace-git-metadata` read-write grants, which read-only lacks.
- Reviewer expectation: writes to the repo (e.g. `touch`, `>>` into `src/`) are refused; only the outbox accepts writes.
