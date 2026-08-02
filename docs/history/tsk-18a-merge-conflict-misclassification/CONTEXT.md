# tsk-18a-merge-conflict-misclassification — locked decisions

Item: `tsk-18a` (light, dep: `tsk-2j9`, delivered). Source ticket (raw,
untrusted per RUL45): a live `fgos merge next` picking `fgw/tsk-3tk`
reported `conflict`, then its own recovery `git merge --abort` crashed
(`fatal: There is no merge to abort (MERGE_HEAD missing)`, exit 9,
unstructured — no `fgos.v1` envelope). The item's own decision log already
recorded an empirical retest that DISPROVED "real git conflict": manually
re-running `git merge --no-commit --no-ff` at the exact same HEAD, in
isolation, succeeded cleanly with zero conflict. Timing correlated with
concurrent sessions doing real git ops on the same shared checkout at the
same time. Same failure signature as `tsk-2j9`'s abort-crash family
(no `MERGE_HEAD` created → abort fails), triggered via a different path.

## Feature boundary

`mergeRunnerItemLocked`'s catch block for the initial
`git merge --no-commit --no-ff <branch>` call
(`src/runner/merge.mjs:820-840`) treats every failure of that call as a
genuine textual conflict — it calls `abortMergeIfPossible` (which itself
now correctly no-ops when `MERGE_HEAD` doesn't exist, per `tsk-2j9`) and
then unconditionally returns `{outcome: 'conflict', branch}`, discarding
the real stderr/exit code entirely. `bin/fgos.mjs` then records the
item as `blocked` with the static reason `merge-conflict` and a canned
message (`bin/fgos.mjs:2253-2263`, `:2346-2359`) that says nothing about
what actually failed.

The fix: distinguish a genuine conflict (git creates `MERGE_HEAD` and
stages conflict markers) from any other failure of that same call (git
exits nonzero but never creates `MERGE_HEAD`) using the exact signal
`tsk-2j9`'s own `mergeHeadExists()` already computes for the abort guard.
A non-genuine failure gets a new, distinct blocked reason (D1) carrying
the real captured stderr/exit code, and `fgos catchup` is extended to
accept and recover it (D1) — never silently folded into `merge-conflict`.

Scope excludes: `tsk-2j9`'s already-delivered abort-crash guard,
`tsk-2eq`'s already-delivered lock-scope fix, and any further redesign of
the Merge Conductor (`plans/reports/internal-research-260801-1823-...`,
`internal-design-260802-0907-...`) beyond this one classification gap.

## Locked decisions

### D1 — New blocked reason for a non-genuine conflict, not folded into `merge-conflict`
A merge failure where `git merge --no-commit --no-ff` exits nonzero but
`mergeHeadExists(repoRoot)` is false afterward is NOT a real conflict —
it gets its own blocked reason (name TBD by planning, e.g.
`merge-failed-unclassified`), carrying the captured stderr and exit code
in the friction detail, instead of reusing `merge-conflict`.

Consequence this decision obligates: `bin/fgos.mjs:2511`'s
`CATCHUP_REASONS` set (currently `{'merge-conflict',
'verify-fail-post-merge', 'integration-drift'}`) must add the new reason,
and `docs/specs/runner.md`'s hardcoded accepted-reason list for `fgos
catchup` must be updated to match in the same change — a new reason not
recognized there would strand an item blocked this way with no recovery
path. Retrying via `catchup` is actually a *more* natural recovery for
this class than for a genuine conflict: an unclassified git failure
(not a real textual conflict) may simply succeed once whatever transient
condition caused it (e.g. a concurrent-session race) has passed, whereas
a genuine conflict needs a human's real content resolution.

Rejected alternative: keep reason `merge-conflict` unchanged and only
enrich the diagnostic detail. Lower blast radius (no `CATCHUP_REASONS`/
docs change) but blurs "needs human conflict resolution" and "may just
work on retry" into one signal — user chose the clearer split.

### D2 — Proof of done requires a live/simulated concurrent-race reproduction, not code-only
Before or alongside the D1 code fix, this item must produce an actual
attempt to reproduce the original race live or simulated (two processes
contending on the same real git checkout, replicating the
`tsk-3wr-1`-retry-loop / `tsk-37u`-holding-the-lock timing pattern the
item's own decision log names) — to determine empirically whether
`tsk-2j9` (abort-crash guard) and `tsk-2eq` (lock now held for the whole
merge window, already delivered on `main`) already closed the
misclassification, or whether it still reproduces post-fix.

The D1 code fix proceeds regardless of that repro's outcome — even if the
original race is now closed, a future *unrelated* git failure on this
same call site (disk, permissions, a different race) must still not be
silently mislabeled `merge-conflict`. But the repro attempt's result
(reproduced / not reproduced, and why) must be recorded in this item's
decision log before it is returned — not skipped for expedience.

Rejected alternative: code fix + a deterministic unit test only, no live
repro attempt. Faster, and the `MERGE_HEAD`-based fix is correct
regardless of root cause — but leaves "did `tsk-2eq` actually close this
specific incident's race" as a permanently unconfirmed inference. User
chose the stronger empirical bar.

## Pinned terms

- **Genuine conflict** — `git merge --no-commit --no-ff` exits nonzero
  AND `mergeHeadExists(repoRoot)` (`src/runner/merge.mjs:773-780`) is
  true afterward.
- **Non-genuine (unclassified) merge failure** — same call exits nonzero
  but `mergeHeadExists(repoRoot)` is false afterward. This is the class
  `tsk-18a`'s original incident belongs to.

## Scout evidence cited

- `src/runner/merge.mjs:762-780` — `tsk-2j9`'s own comment and
  `mergeHeadExists()`/`abortMergeIfPossible()`: proves the abort-crash
  itself is already fixed, and supplies the exact signal D1's
  classification reuses.
- `src/runner/merge.mjs:820-840` — the actual bug: `abortMergeIfPossible`
  is called unconditionally on any catch, then the outcome is
  unconditionally `'conflict'` regardless of whether `MERGE_HEAD` ever
  existed. No stderr/exit code from the failed `git()` call is captured
  anywhere on this path.
- `src/runner/merge.mjs:619-678` (`mergeRunnerItem`) — `tsk-2eq`'s
  already-delivered fix: the real `main-checkout.lock` (keyed off
  `lockRoot`, not the ephemeral worktree) is now held BEFORE the first
  `git merge` call, closing the "leaf lock never actually contends" gap
  the item's own description names as correlated with the original
  incident.
- `bin/fgos.mjs:2253-2263`, `:2346-2359` — the two `approve` call sites
  (leaf→root, root→main) that turn `result.outcome === 'conflict'` into
  `moveWork(..., reason: 'merge-conflict')` with a static, non-diagnostic
  message.
- `bin/fgos.mjs:2511` (`CATCHUP_REASONS`) and `docs/specs/runner.md`'s
  catchup precondition line — the closed accepted-reason set D1 must
  extend; confirms a new unrecognized reason would strand an item.
- `fgos list --id tsk-2j9` / `--id tsk-2eq` → both `status: "delivered"`
  — confirms both prerequisite fixes named in the item's own dep and the
  merge-harness-v2 sequencing report are already on `main`, not still
  pending.
- `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md`
  §Family 3, §Sequencing item 3 — the report `tsk-18a` was scoped out of;
  explicitly names "re-investigate ... with `tsk-2j9`'s fix in place;
  capture real stderr/exit-code" as this item's own next step.
- `fgos tool query --capability impact-analysis --status present` →
  `gitnexus` provider, `status: "present"` — impact-analysis posture is
  **full** for this item; `CLAUDE.md`'s gate applies the MUST rules as
  written for planning/validating/executing (run `impact` on
  `mergeRunnerItemLocked`/`abortMergeIfPossible` before editing either).

## Outstanding questions deferred to planning

- Exact name of the new blocked reason (D1 names
  `merge-failed-unclassified` as an example only).
- Exact mechanism for the D2 live/simulated repro (a throwaway script
  spinning up two real concurrent git processes against a shared
  checkout vs. some lighter simulation) — implementer-level, not a
  product decision.
- Whether the new reason's friction `detail` string format should mirror
  the existing `merge-conflict`/`verify-fail-post-merge` templates
  exactly or is free-form, since it now needs to embed real stderr —
  implementer-level.
