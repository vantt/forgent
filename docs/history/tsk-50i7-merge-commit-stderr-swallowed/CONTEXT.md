# CONTEXT: approve/merge swallows git commit's stderr, against the file's own convention

## Feature boundary

`src/runner/merge.mjs`'s `mergeRunnerItem` has two catch branches around its
`git(repoRoot, ['commit', '--no-edit'])` call (currently lines 948-960) that
throw a `MergeError` carrying only `err.message` — the generic `execFileSync`
wrapper text (`Command failed: git commit --no-edit`), never the real git
reason (hook rejection, nothing to commit, missing identity, ...) that lives
on `err.stderr`. This diverges from the file's own established convention:
the `git()` helper (lines 79-87) already captures stderr on every subprocess
call via `stdio: ['ignore', 'pipe', 'pipe']`, and a sibling catch in the same
file (the merge-call failure branch, currently line 917) already surfaces
`{ message: err.message, stderr: err.stderr ?? null, status: err.status ?? null }`.
Scope is exactly these two catch branches — attach `err.stderr`/`err.status`
to the thrown `MergeError`'s details, matching the line-917 shape, with a
pinning test. No control-flow change (rollback/abort stays identical); no
stderr printed to the verb's own stdout (would corrupt JSON output, per
tsk-mgb precedent already documented in the item).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix targets exactly the two `git commit` catch branches (currently `src/runner/merge.mjs:954-957` and `:959`), matching the item's own explicit "VIỆC CẦN LÀM" scope — not a sweep of every `err.message`-only throw in the file. |
| D2 | Shape to match: `{ branch, stderr: err.stderr ?? null, status: err.status ?? null }` passed as `MergeError`'s `details`, mirroring the existing line-917 precedent (`error: { message, stderr, status }` on the returned outcome object) — the closest existing convention in the same file for exactly this data. |

`fgos decision` calls recording D1/D2 below (both directly derivable from
the item's own text — no person input needed, so no `ask`/`answer` round
trip was used).

## Scope note (deferred, not silently expanded)

The same `err.message`-only gap exists at other throw sites in this file —
`src/runner/merge.mjs:372` (changed-files diff failure), `:744` (already-
merged check failure), `:909` (merge-abort-itself-failed), `:930-931`
(fgos-write-staged abort-itself-failed), `:943` (post-merge-verify abort-
itself-failed). The item's own description scopes only to the two commit-
failed branches (D1) — widening to these other sites is explicitly **out of
scope for this item**, deferred as a possible follow-up if a future incident
makes one of them diagnostically necessary the same way tsk-50i7's own
incident did for the commit-failed branches.

## Scout evidence

- `src/runner/merge.mjs:79-87` — `git()` helper, `stdio: ['ignore', 'pipe', 'pipe']`, confirms stderr is always captured on every subprocess call in this file.
- `src/runner/merge.mjs:917` — existing correct precedent: `error: { message: err.message, stderr: err.stderr ?? null, status: err.status ?? null }`.
- `src/runner/merge.mjs:948-960` — the two commit-failed catch branches, confirmed still swallowing `err.stderr` (line numbers drifted from the item's cited 910/914 to 955/959 since the item was written; code shape unchanged).
- `bin/fgos.mjs` — a third precedent, slightly more defensive: `stderr: typeof err.stderr === 'string' ? err.stderr : (err.stderr?.toString() ?? null)`. Not adopted here — D2 matches the same-file (`merge.mjs:917`) precedent instead, the closer and more directly comparable convention.
- `src/runner/loop.mjs:847`, `src/runner/github-adapter.mjs:50/59` — further repo-wide precedent that `err.stderr` is the established way to surface subprocess failure detail.
- `docs/history/tsk-18a-merge-conflict-misclassification/plan.md` — independent prior confirmation that `err.stderr` on `execFileSync`'s thrown error is assumed to be a string across this codebase.
- `docs/backlog.md` (item `p-b91d487a`) and `docs/history/merge-already-merged-idempotent/` — a **related but distinct** historical issue (opaque `MergeError` on a *no-op* re-commit after an already-landed merge). That issue is already resolved: `mergeRunnerItem` now checks `isAlreadyMerged(repoRoot, branch, 'HEAD')` before attempting the merge (`merge.mjs:860`). Not this item's concern — noted here only so a future reader doesn't conflate the two.
- Full text of the file re-read to confirm no other `git commit` call site exists that this fix would need to also touch.

## Pinned terms

- **"commit-failed branches"** = the two `catch` blocks wrapping `git(repoRoot, ['commit', '--no-edit'])` in `mergeRunnerItem` (today: `merge.mjs:948-960`) — not any other catch block in the file.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` returns
GitNexus `present` — posture is **full** per `CLAUDE.md`'s gate. `MergeError`
is confirmed called only by `reviewDiff`, `changedFiles`, `renumberDecisionFile`
per GitNexus — none of which touch the commit-failed branches this item
targets, consistent with this being a narrow, low-blast-radius change
(adding fields to a thrown error's details, not changing control flow or
the error's `message`/`name`/`errorClass`/`category`).

## Outstanding questions

None
