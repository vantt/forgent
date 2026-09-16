# C00 - Integration Closeout

**Capability:** `docs:update`, `code:review`
**Status:** complete in branch closeout commit; pending merge to `main`

## Goal

Close the implementation track with integrated docs, changelog, full test
evidence, and independent review/red-team disposition.

## File Lease

Primary lease:

- `docs/specs/runner.md`
- `docs/architect/agent-coordination/contracts/assignment-run-runresult.md`
- `docs/how-to/`
- `CHANGELOG.md`
- `plans/260915-dispatch-operability-implementation/reports/`

## Work

1. Update canonical docs only for behavior that is implemented and proven.
2. Add CLI/operator guidance for:
   - `fgos dispatch inspect --run|--assignment|--cwd`;
   - reconcile plan/apply usage and exact refusal meanings;
   - recovery-authority hints and why they are not grants.
3. Add `CHANGELOG.md` Unreleased entry for user-visible CLI/schema changes.
4. Run focused tests from every phase plus `npm test`.
5. Run `git diff --check`.
6. Run GitNexus `detect_changes` or record exact failure plus manual fallback
   audit.
7. Write `reports/track-closeout.md`.

## Acceptance

- Every product gate row in `plan.md` is updated with final status and merge
  commit.
- Every deferred capability remains named as deferred; none is implied shipped.
- Every negative capability has either a production proof or an explicit
  non-shipping note.
- No docs claim cross-provider independent review.
- A stranger agent can answer what changed, what remains unsupported, what
  command proves it, and what files own the behavior.

## Required Commands

```sh
npm test
git diff --check
node .gitnexus/run.cjs detect-changes
```

If GitNexus is still unhealthy, record the exact CLI error and attach a manual
symbol/file impact table in the closeout report.
