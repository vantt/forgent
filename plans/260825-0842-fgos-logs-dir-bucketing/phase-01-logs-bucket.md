# Phase 1 — move 4 diagnostic jsonl files into `.fgos/logs/`

## Files to move (all currently git-tracked at `.fgos/` root)
- `approve-post-success-faults.jsonl`
- `main-checkout-guard-warnings.jsonl`
- `changelog-nag-history.jsonl`
- `entropy-history.jsonl`

`invocation-faults.jsonl` was already gitignored (untracked) — move its
writer path too for consistency with the new bucket, no `git rm --cached`
needed.

## Path resolvers to change
- `src/cli/approve-fault-log.mjs` — approve-post-success-faults.jsonl path
- `src/state/main-checkout-guard-warnings.mjs` — main-checkout-guard-warnings.jsonl path
- `bin/fgos.mjs` — changelog-nag-history.jsonl path helper (~line 696), entropy-history.jsonl path
- `src/cli/invocation-fault-log.mjs` — invocation-faults.jsonl path
- `src/setup/registrations.mjs` — doctor/setup registration referencing main-checkout-guard-warnings.jsonl (install/setup/doctor gate, AGENTS.md)

## Tests to update (path assertions)
- test/runner/merge.test.mjs
- test/runner/claim-port.test.mjs
- test/state/events-jsonl-truncation-guard.test.mjs
- test/cli/fgos-return.test.mjs
- test/setup/checks.test.mjs
- test/cli/fgos-read-4.test.mjs
- test/cli/fgos-post-merge-2.test.mjs
- test/cli/fgos-faults.test.mjs
- test/cli/invocation-fault-log.test.mjs

## Living docs to update (current-state docs only — never docs/history/*, those are frozen records)
- docs/explanation/why-approve-logs-post-success-movework-faults-outside-events-lock.md
- docs/explanation/events-jsonl-lost-update-race-under-concurrent-session-writes.md
- docs/explanation/cli-invocation-fault-provenance.md
- docs/explanation/worktree-dispatch-attestation-level-1-advisory-only.md
- docs/how-to/add-a-changelog-entry-for-a-user-visible-change.md
- docs/how-to/fix-fgos-write-rejected-merge-block.md
- docs/how-to/safely-reset-the-main-checkout.md
- docs/specs/runner.md (entropy-history.jsonl mention)
- docs/backlog.md (entropy-history.jsonl mention, if describing current path)

## Steps
1. `git mv` the 4 tracked files to `.fgos/logs/<name>` (preserves history,
   equivalent to `rm --cached` + re-add at new path in one step).
2. Move `invocation-faults.jsonl` on disk to `.fgos/logs/` (plain `mv`,
   was never tracked).
3. Update each path resolver above to `path.join(dir, 'logs', '<name>')`
   (create `.fgos/logs/` via `fs.mkdirSync(..., {recursive:true})` at
   first write, same pattern `resolveWriterLogPath` already uses for
   `.fgos/events/`).
4. Update `.gitignore`: drop the now-redundant explicit
   `.fgos/invocation-faults.jsonl` line (covered by existing
   `.fgos/logs/` rule).
5. Update the 9 test files' path expectations.
6. Update the living docs listed above.
7. Add a `CHANGELOG.md` `[Unreleased]` line (path change is user-visible
   per AGENTS.md's install/setup/doctor gate).
8. Run `npm test`; fix regressions.
9. `git status` sanity check — the 4 old root-level paths must not
   reappear as untracked/modified.

## Risks / rollback
Low risk: each resolver has 1-3 call sites, all simple `fs.appendFileSync`
writers with no lock sharing (self-contained by design, per their own
code comments). Rollback = revert the commit; `git mv` keeps prior
history reachable either way.
