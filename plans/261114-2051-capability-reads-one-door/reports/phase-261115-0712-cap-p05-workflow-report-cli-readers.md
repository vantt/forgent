# Workflow proposal, plan-lint report and CLI plan-lint read the catalog through the port

Branch `capability-reads-p05`, base `74d5f296f`.

## What changed

- `src/workflow/propose.mjs`: the gate-command check reads `capabilityVerifyOf(runnerConfig, 'code:implement')`; same truthy test as before.
- `src/report/capability-plan-lint.mjs`: the object branch of the local declared check uses the port (exact, `<prefix>:*`, alias); the list/Set branch is kept. `runner = config?.runner ?? config`; the raw-catalog branch is deleted. Registered names come from `capabilityNamesOf`.
- `bin/fgos.mjs` `plan-lint`: `await import()` of the port inside the case (no new static import); names from `capabilityNamesOf`, unit `description` from `capabilityDescriptionOf`. The `catalog` local is gone. Three line-local edits.
- `docs/architecture-manifest.json`: debt entries removed for `bin/fgos.mjs`, `src/report/capability-plan-lint.mjs` and `src/workflow/propose.mjs` (the last was also in the row's debt list; the stale check failed until it was dropped).

## Intended differences

- `{runner:{}}` (a runner with no catalog) now flags every unit as unregistered instead of skipping the check. No caller passes it.
- A config that was itself a bare `{name: entry}` catalog is no longer read as a catalog (no caller passes one).

## Evidence

- Gate tests (propose, propose-validate, propose-classify, propose-frame, capability-plan-lint, cli plan-lint, verb-exit, architecture): 207 pass, 0 fail.
- `test/scripts/doc-health.test.mjs` 8 pass; `check-decision-citation-drift` exit 0; one-door scan 0 undeclared sites.
- `fgos plan-lint plans/261001-0327-request-to-run-p2-runnable-plans --json` equals the base run except `generated_at`, and the path-dependent `path` and `data_hash` (base ran from a sibling worktree).
- Final `doors` row `read runner.capabilities`: `allowed` unchanged; the three entries above are out of `debt`.
- CHANGELOG: no user-visible line.

## Lessons

- A debt entry can exist for a file the phase file does not list (`propose.mjs`); run the architecture test before assuming the phase list is complete.
- Removing the last element of a JSON array needs the comma of the previous one fixed too.
