# tsk-1p9 — plan

## Mode

Flags counted against the mode gate:
- auth / authorization / data model / audit-security / external systems /
  cross-platform / multi-domain: none apply.
- existing covered behavior: YES — `cleanupMergedBranch` (`src/runner/merge.mjs`),
  `checkMergeStillResolves` (`src/state/cleanup-harness.mjs`), and `approve`'s
  merge paths (`bin/fgos.mjs`) are all exercised today by
  `test/runner/merge.test.mjs`, `test/runner/worktree.test.mjs`,
  `test/state/cleanup-harness.test.mjs`, and `test/cli/fgos.test.mjs`.
- **hard-gate flag — removing a validation**: D8 (CONTEXT.md) replaces
  `git branch -d` (git's own local "is this branch actually merged"
  safety check) with `git branch -D` (force, no check). This is a
  deliberate, evidence-backed replacement (D7 supplies the correct check
  in its place), but it is still, literally, the mode gate's own
  "removing a validation" case.

1 hard-gate flag → **high-risk**, regardless of the otherwise-small file
count (3 files). A smaller mode would not honestly cover the git
plumbing risk in D7/D8 — this is not story-sized behavior, it is a
safety-check replacement on an irreversible operation (branch deletion).

## Approach

Per CONTEXT.md D1-D8: stop deleting a merged item's branch/worktree
synchronously inside `approve` (D1), make the `cleanup` verb the sole
teardown point (D2), and fix that verb's own git-context bug for leaf
items so the deferred teardown actually works (D7/D8) instead of merely
moving today's already-broken-for-leaves behavior to a later call site.

Rejected alternative: defer only the two `approve` call sites (D1/D2)
without fixing D7/D8. Rejected because CONTEXT.md's own mid-planning
scout (a live, disposable-repo git test run this session) proved this
would ship an item that looks done but silently fails for every leaf —
the majority shape of real work in this repo, decomposed roots being the
norm, not the exception (`tsk-1q1` itself, this item's own parent, is a
decomposed root).

Rejected alternative (within D8): keep `git branch -d` and instead
checkout an ephemeral worktree on the root's branch just to run the
delete (mirroring `withMergeEphemeralWorktree`'s existing approve-time
pattern). Rejected as unnecessary complexity — CONTEXT.md's own scout
already proved `git merge-base --is-ancestor <sha> <ref-name>` needs no
checkout, and once that ancestry check (D7) has independently verified
the branch is safe to delete, `-D` needs no checkout either. An ephemeral
worktree would add a second git-operations code path to test and
maintain for a check `-D` + D7 already covers.

### Files touched, in order

1. `src/runner/root-affinity.mjs` — NOT edited; `resolveRoot(view, id)`
   already exists, exported, pure. Only imported by the two files below.
2. `src/state/cleanup-harness.mjs` — `checkMergeStillResolves` (D7):
   accepts `view`/`id` (already has `view` in scope via
   `assessCleanupReadiness`'s own signature — needs to thread `id`
   through, which `assessCleanupReadiness` already receives). Resolves
   `rootId = resolveRoot(view, id)`; when `rootId !== id`, checks
   `git merge-base --is-ancestor <sha> fgw/<rootId>` instead of
   `... <sha> HEAD`. Proof point: unit test with a leaf merged into an
   UNMERGED-to-main root branch, asserting `ok: true` against the correct
   ref where checking `HEAD` would give `ok: false` (CONTEXT.md's own
   test-plan row) — this is the risk-bearing row of this plan (existing
   covered behavior AND the hard-gate flag both land here first).
3. `src/runner/merge.mjs` — `cleanupMergedBranch` (D8): `git branch -d`
   becomes `git branch -D`. Proof point: an end-to-end test deleting a
   leaf's branch (root branch present, unmerged into main) and asserting
   it actually disappears — today's behavior would either silently warn
   (never delete) or, before this item, never reach this state at all
   (branch was already gone at merge time).
4. `bin/fgos.mjs` — remove the two `cleanupMergedBranch` calls (D1) at
   the leaf-into-root (`'merged'` outcome, ~line 2632) and root-into-main
   (`'merged'` outcome, ~line 2743) branches of `case 'approve'`; drop
   the now-unused `cleanupWarnings` field from those two return shapes
   (a `approve`-response contract change — the "public contract" flag
   this plan's mode gate would ALSO have counted, subsumed by the
   hard-gate classification above). Proof point: the e2e test in the
   item's own test plan (`delivered -> retrospective -> cleanup -> done`,
   branch/worktree alive at `cleanup`, gone at `done`).

### Risk map

| Component | Risk | Proof point |
|---|---|---|
| `checkMergeStillResolves` root-aware ref (D7) | **high** — a false `ok:true` here would let `cleanupMergedBranch` (D8) force-delete a branch whose work is NOT actually safe; a false `ok:false` would falsely park a healthy item `blocked` forever | unit test: leaf-merged-into-unmerged-root must resolve `ok:true` against the root ref, `ok:false` against literal `HEAD` (proves the bug existed and is fixed) |
| `git branch -D` replacing `-d` (D8) | **high** — force-delete has no local git safety net; correctness depends entirely on D7's check running first and being right | e2e test: a leaf's branch genuinely disappears after `cleanup`, only after D7's check passes; a root/standalone item's existing behavior (checked against `HEAD`) is unchanged — same test file kept green |
| `approve`'s two call-site removals (D1) | medium — mechanical, but touches the merge path directly on `main` (root-into-main) and the ephemeral-worktree merge path (leaf-into-root) | existing `test/runner/merge.test.mjs`/`test/cli/fgos.test.mjs` approve-path tests stay green; new e2e proves the deferred behavior |
| `cleanupWarnings` field removal from approve's two return shapes | low — response-shape change, no known external consumer inside this repo (`fgos approve`'s own test assertions are the only readers found by scout) | grep/rg confirms no other reader; existing approve tests updated to match |

Impact-analysis capability gate (`fgos tool query --capability
impact-analysis --status present`, re-checked at planning time): GitNexus
registered and `present`, index still behind HEAD (`lastCommit: 251d0b5`)
→ **impact-analysis: degraded** (unchanged from clarify and from the
sibling item). `impact` runs on `checkMergeStillResolves`,
`cleanupMergedBranch`, and the two `approve`-path call sites before any
edit, cross-checked with `rg` given the stale-index gap — required, not
optional, for this plan's two high-risk rows above.

## Split decision

No split. This is one honest piece of work: D1/D2 (defer the call) and
D7/D8 (make the deferred call actually correct) are not independently
shippable — shipping D1/D2 alone would ship a regression for every leaf
item (branches silently leaking forever), which is worse than today's
behavior, not better. `plan.md`'s own mode (`high-risk`) already reflects
the real size; splitting would only hide the coupling, not remove it.

## Assumptions (not material enough to reopen CONTEXT.md)

- `checkMergeStillResolves`'s exact new parameter shape (whether `view`/
  `id` are threaded as new named params or the call is restructured) is
  an implementation detail, not locked here — as long as the leaf/root
  ref resolution behavior (D7) holds.
- No other caller of `checkMergeStillResolves` exists outside
  `assessCleanupReadiness` (confirmed by the sibling item `tsk-4jf`'s own
  scout, unchanged since) — the signature change has exactly one call
  site to update.

## Verify (this item, whole)

```
node --test test/state/cleanup-harness.test.mjs test/runner/merge.test.mjs test/runner/worktree.test.mjs test/cli/fgos.test.mjs
```
