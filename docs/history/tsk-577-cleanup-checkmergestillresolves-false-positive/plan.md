# tsk-577 — plan

## Mode gate

**Lane: standard** (2 flags counted per `fgos-routing`'s Orient step
criteria: **existing covered behavior** — `checkMergeStillResolves` and
`startupReap`'s prune step both already have passing tests this change must
not regress; **weak proof around the area** — the interaction between
`loop.mjs`'s prune and `cleanup-harness.mjs`'s ref check has no existing
test coverage at all, which is exactly the gap that produced this bug).
Not `high-risk`: no auth/authorization/data-loss/audit/external-provider
flag applies — this only tightens an internal git-ref-lifetime invariant
already enforced elsewhere in this same codebase. Not `spike`: the fix
shape is already clear from D1-D3, no open feasibility question remains.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → GitNexus
registered and `present`. **Degraded**, not full: the index (`forgentX`,
last indexed `251d0b5`) is 224 commits behind current HEAD (surfaced by the
post-commit hook during clarify). Ran `impact()` anyway as weak
corroborating evidence, cross-checked against a direct `grep`/`rg` sweep
(more trustworthy here given the stale index) already done during
`fgos-coding-exploring`'s scouting (see `CONTEXT.md`'s Scout evidence — confirmed
`loop.mjs:393` and `merge.mjs:948` are the ONLY two `git branch -D` call
sites in `src/`, `merge.mjs:948`'s self-scoped/pre-guarded).

`impact(startupReap, upstream)`: risk **LOW**, 1 direct caller (`runOnce`),
feeds `runWatch`'s process — small, well-contained blast radius, consistent
with the grep sweep finding no other branch-delete path.
`impact(checkMergeStillResolves, upstream)` (surfaced automatically by the
tool-use hook during scouting): 1 caller, `assessCleanupReadiness` — same
low/contained shape.

## Approach

Two independent code fixes (D1: both source and symptom), landed as one
item (no split — see Shape below), plus an operational remediation phase
(D2).

**Correctness argument for the symptom-side fallback** (grounds the whole
approach, worth stating explicitly since it is the crux of why this fix is
safe): `startupReap`'s prune (`loop.mjs:391-393`) only ever deletes a
`fgw/<id>` branch when `aheadCount === 0` — by construction this means the
branch tip is *already* a literal git ancestor of `main` at prune time (a
real merge/fast-forward, not a squash — a squash would leave the original
commits with `aheadCount > 0` forever, since squashed commits are never
themselves ancestors of the squash commit, and `loop.mjs` would then log
`keeping ... (N commit(s))` instead of pruning). `merge.mjs:948`
(`cleanupMergedBranch`), the only other delete site, is separately
self-guarded (deletes only after that item's own
`checkMergeStillResolves` already passed for that item's own branch). So:
**a missing `fgw/<id>` ref, in this codebase, is always provable evidence
the branch's content already resolved against `main` at some point** —
never evidence of a genuine loss. This is what makes the ancestry-only
fallback below sound without needing content/diff comparison (D3).

1. **Symptom fix — `src/state/cleanup-harness.mjs`
   (`checkMergeStillResolves`).** Distinguish "target ref does not exist"
   from "target ref exists, sha not an ancestor" (today both fall into one
   `catch`). Use `git rev-parse --verify --quiet <ref>` (or equivalent) to
   check ref existence before the `merge-base --is-ancestor` call. When the
   *named* `targetRef` (the `fgw/<rootId>` case only — `HEAD` always
   resolves, so this path is unreachable for a root/standalone item,
   matching `CONTEXT.md`'s pinned scope) does not exist, retry the same
   ancestry check once against literal `HEAD` before falling through to
   `ok:false`. Keep the existing `ok:false` message shape for every other
   failure (ref exists but sha unreachable — the genuine force-push case,
   already covered by the existing test at
   `test/state/cleanup-harness.test.mjs:49-58`, must keep failing).

2. **Source fix — `src/runner/loop.mjs` (`startupReap`'s prune step).**
   Before deleting a zero-ahead `fgw/<id>` branch, check whether `id` has
   any descendant still relying on this ref — i.e. any item with
   `parent === id` (transitively, same walk shape as `resolveRoot`) whose
   `status` is **not yet** `done` or `wontfix`. Note this is a
   **different, broader "still needed" set than `fgos-coding-driving`'s
   anchor check** (which excludes `delivered`/`retrospective`/`cleanup` as
   "not open" for dispatch purposes) — a leaf sitting in `cleanup` still
   needs `fgw/<rootId>` alive for its own `checkMergeStillResolves` call,
   so it must count as "still needed" here even though it would NOT count
   as an open dispatch-anchor elsewhere. Flag this distinction in the
   implementation's own code comment so a future reader does not reach for
   the wrong helper. When any such descendant exists, skip the delete for
   that branch this pass (log it the same way the existing `kept` branch
   already logs, with a reason distinguishing it from the
   commits-ahead case) — it will be reconsidered on a later `startupReap`
   pass once every descendant clears.

3. **Remediation — the 14 already-stranded items (D2).** Only possible
   once step 1 lands (their root branches are already gone; step 2 alone
   cannot undo a past deletion). After the code fix merges to `main`,
   rerun `fgos cleanup <id>` for each of: `tsk-47e`, `tsk-3go-1`,
   `tsk-5m7`, `tsk-50i`, `tsk-62y`, `tsk-2u0`, `tsk-3gx-1`, `tsk-3gx-2`,
   `tsk-3gx-3`, `tsk-19j-1`, `tsk-19j-2`, `tsk-19j-3`, `tsk-19j-4`,
   `tsk-1ni-1`, and confirm none reports the
   `"is no longer reachable from ..."` failure detail. This is an
   operational step, not a code change — its own proof is the rerun output
   itself, not the item's machine `verify` command.

### Order

Step 1 before step 3 (remediation needs the symptom fix landed). Step 2 has
no dependency on 1 or 3 (independent file, independent test) — done
alongside step 1, before step 3, so remediation happens once both code
fixes are in and the suite is green.

## Files touched

| File | Change |
|---|---|
| `src/state/cleanup-harness.mjs` | `checkMergeStillResolves`: ref-existence check + `HEAD` fallback |
| `src/runner/loop.mjs` | `startupReap`: skip zero-ahead prune when an open (non-`done`/`wontfix`) descendant exists |
| `test/state/cleanup-harness.test.mjs` | new fixture: root branch pruned (ref missing) + leaf content genuinely on `main` → `ok:true`; existing negative fixture (real force-push, ref present) stays `ok:false`, unchanged |
| `test/runner/loop.test.mjs` | new fixture: root branch with an open leaf descendant is kept at `aheadCount === 0`; existing fixture (`loop.test.mjs:1065`, no descendant) stays pruned, unchanged |

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `checkMergeStillResolves` `HEAD`-fallback | medium — a wrong fallback could mask a genuine loss | new positive fixture (ref-missing + content-present → `ok:true`) AND existing negative fixture (`ok:false` unchanged) both pass |
| `startupReap` prune-skip guard | medium — over-broad skip would leak branches forever; under-broad skip reintroduces this bug | new fixture (open descendant → kept) AND existing fixture (`loop.test.mjs:1065`, no descendant → pruned) both pass |
| 14-item remediation | low, operational | each `fgos cleanup <id>` rerun confirmed clear, no more false-positive detail |

## Shape

One honest piece of work, not split: both files are small, tightly-scoped
changes to one coordinated invariant (ref lifetime vs. ref-consumer
lifetime), and D2's remediation only makes sense run once, by whoever lands
the code fix, immediately after. Splitting into separate child items would
add claim/handoff overhead for no real parallelism gain (`fgos graph
--what-if` was not run — there is nothing to compare against; this is a
single-piece item, not a candidate for competing split orderings).

Concrete cases to prove against (both new fixtures):
- **Boundary — ref genuinely missing, content genuinely present**: root
  branch pruned via `aheadCount === 0`, leaf's recorded sha is still a real
  ancestor of `main` once falling back to `HEAD` → `ok:true`.
- **Regression guard — ref present, sha genuinely unreachable**: unchanged
  existing fixture, still `ok:false` (real force-push case, not touched by
  this fix).
- **Regression guard — no open descendant**: unchanged existing fixture,
  branch still pruned normally.
- **New — open descendant present**: root branch at `aheadCount === 0`
  with a leaf still in `cleanup` is NOT pruned this pass.

## Verify

Locked verify (`fgos discover --force`, clarify stage) was
`node --test test/state/cleanup-harness.test.mjs` — scoped to only one of
the two files this plan's Approach now identifies (the `loop.mjs`
source-side fix, decided as part of D1 "both", was not yet known to need
its own test file at clarify time). Broadening the verify command to
match D1's already-locked scope is not a new decision — D1 already
committed to fixing both source and symptom; this only corrects the
machine-checkable command to actually prove what D1 already locked. Not
material under the mid-planning-gap filter (scope/behavior/acceptance
unchanged), so pinned here rather than handed back to `fgos-coding-exploring`:

```
node --test test/state/cleanup-harness.test.mjs test/runner/loop.test.mjs
```

Applied via `fgos edit tsk-577 --verify "node --test
test/state/cleanup-harness.test.mjs test/runner/loop.test.mjs"` right
after this plan is approved.

## Assumptions

- The standalone/root-checked-against-`HEAD` squash-restructuring variant
  (`CONTEXT.md`'s pinned assumption) stays out of scope — confirmed again
  here: the correctness argument above shows `aheadCount === 0` pruning can
  only happen for a real, ancestry-preserving merge, so a squash-merge
  scenario would never even reach the zero-ahead prune step in the first
  place (it would show `aheadCount > 0` and be kept, logged as "a proposal,
  never auto-deleted").
- Remediation (step 3) is run by whoever lands the code fix, in the same
  session/PR — not delegated to a separate child item (Shape, above).

## Open questions

None outstanding — D1-D3 plus the verify broadening above cover every
decision this plan depends on.
