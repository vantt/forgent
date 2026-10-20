# Git phase 07, unit 14: Land-cluster leftovers

All three steps are done. No raw Git read is left in `src/runner/merge.mjs` or `src/verbs/merge/*`. Red, conflicted and promoted Land candidates are now released through the same acknowledgement door as delivered ones. The three baseline failures were traced: the Refs code had drifted from the spec, and the legacy-event failure is environmental. Branch tip under test: `7d931a0a2` plus this working tree. Nothing was committed.

## 1. Readers → Inspect (spec §3 first)

**Spec.** §3's Inspect row and a dated unit-14 paragraph describe the new facts. Everything is bounded, typed and runs through the driver with optional locks off.

| Fact | Git underneath | Notes |
|---|---|---|
| `mergeTree({target, source})` | `merge-tree --write-tree -z --name-only --no-messages` | Two commits in. Returns the tree plus the deduplicated conflicted paths. Exit 1 is the conflicted answer; any other non-zero exit is an error. Like the command, it may add unreferenced objects, and it changes no ref, index or checkout. |
| `attributes({revision, attribute, paths})` | `check-attr -z --stdin --source=<oid>` | Paths go over stdin, up to 4096. The attribute name is validated. Records are checked against the request. |
| `diff` (extended) | — | Accepts a commit or a tree on either side. Takes an optional literal `prefix` (`:(literal)` pathspec, canonical path) and `renames`. With `renames`, a rename is reported once under its new path, with `from` naming the old one. Default behaviour is unchanged. |
| `firstAncestryMerge({ancestor, descendant})` | `rev-list --merges --ancestry-path --reverse` | Returns the earliest merge commit, or null. |
| `listTree({revision, prefix})` | the driver's existing `Inspect::list_tree` | Prior art, reused rather than duplicated. `TreeCursor::resume`/`after` let the addon carry the cursor as the last returned path. The driver still refuses a cursor from another revision or prefix. |

**Moved off raw Git** (old census lines):

| Old line(s) | Read | Now |
|---|---|---|
| merge.mjs 542 | `nextFreeDecisionId` | `listTree` |
| merge.mjs 768, 796 | `branchContentMismatch` | `firstAncestryMerge`; rename-detecting `diff` |
| merge.mjs 1030 | `readMergeTree` | `mergeTree` |
| merge.mjs 1041 | `changedStorePaths` | `diff` with `prefix: '.fgos'` |
| merge.mjs 1043 | `isUnionAt` | Now `unionPathsAt`: one batched `attributes` call per set instead of one spawn per path |
| merge.mjs 1105, 1106 | decision listings | `listTree` |
| approve.mjs:482, sync-root.mjs:219 | ancestry checks | The existing `isAlreadyMerged` (Inspect `ancestry`), now exported |

- The private `git()` helper and every `child_process` import are deleted from these files.
- The three hand-rolled paging loops became one `diffPaths` helper.

## 2. M4 for results that published nothing

`landRunnerItem` now attaches Work's settlement identity to every result whose operation Land journalled:
- `delivered` on publication.
- `abandoned` on a red verify, a candidate conflict, `main-checkout-dirty-mid-merge`, or an unclassified failure.

The identity comes from one helper, `landSettlementFor`. When Land journalled nothing under the id (a refusal before its intent), no identity is attached, so nothing is released.

Each verb acknowledges through `acknowledgeLand`, i.e. `Land.recover`, only after its durable record exists:

| Verb | Durable record | Acknowledgement |
|---|---|---|
| approve | the move to `blocked` | `work-blocked:<id>:<seq>` (`moveBlockedOrConflict` takes the settlement). Delivered keeps `work-delivered:…` through the same `releaseLand` helper. |
| sync-root | an engine decision ("Land operation … published nothing (<reason>)") for each unpublished result, then the same release as the synced path | `work-decision:<id>:<seq>` |
| promote-to-component | the one summary decision | `retargetMember` returns `landSettlement`; the verb acknowledges every member, merged, blocked or parent-rejected, with `work-decision:<root>:<seq>`. Settlements are stripped from the verb's output. |

Recovery closes the pre-attempt chain as `abandonedBeforeAttempt`, and the existing cleanup removes the candidate, the pins and the journal. Spec §9 has a dated unit-14 paragraph.

**Residual.** When the verb rethrows a Land error, it records no Work result, so that candidate is kept. The case is a lock refusal at publication. It is named in §9 and in the ideas section below.

## 3. The three baseline failures

**`test/git/refs` ×2: the code drifted.**
- Unit 5 (`54f365861`) made the shared `acquire_worktree_admin` adopt a caller-held worktree-admin, for the waiting `addWorktree` door.
- Refs, Land and Remote inherited that adoption. Spec §5's Refs row says a held 40 is `lock-order-violation`.
- Fix: `adopt_worktree_admin` is used by Worktree only, and `acquire_worktree_admin` is strict again.
- The §5 Worktree rows now record the lent 40 that production relies on.
- The test is unchanged and passes.

**`test/git/legacy-event-adapter`: neither the code nor the test drifted. The failure is environmental.**
- This session inherits `FGOS_HOST_BIN` pointing at the installed release.
- `scripts/run-tests.mjs` `ensureGitAddon` copies that host in as the "checkout-owned" staged host. The fast path in `test/helpers/git-addon.mjs` then keeps reusing it, because `gitAddonSourceDigest` does not cover the host's own sources (`apps/fgos`, `packages/distribution`).
- The release host predates the legacy-event branch of `git-grant-check`, so it answers `cutover-grant-missing`.
- With a host built from the checkout (unset `FGOS_HOST_BIN`, delete the staged manifest), the test passes unchanged.
- Unit 13's "baseline" run very likely hit the same stale host.

## Changed assertions (none weakened)

| File:line | Old | New | Spec |
|---|---|---|---|
| `test/runner/promote-engine.test.mjs:76`, `:160` | `assert.deepEqual(result, { id: 'member-a', outcome: 'merged' })` | `const { landSettlement, ...result } = …`; same `deepEqual`; plus `assert.equal(landSettlement.settlementKind, 'delivered')` | §9, unit 14 paragraph |
| `test/runner/land-vs-manual-commit.test.mjs:256` | `assert.deepEqual(await promoting, { id: 'member-a', outcome: 'merged' })` | same destructuring, same `deepEqual`, plus the `settlementKind` check | §9, unit 14 paragraph |

`land-vs-manual-commit` is not in this lane's named test list. It is the one other direct `retargetMember` caller, so it is listed here as a judgment call.

## New tests

**Rust:** `packages/git/rust/tests/inspect.rs` `inspect_merge_facts_for_land_consumers`, covering:
- a clean and a conflicted `mergeTree`;
- `attributes` (union / unspecified, and a bad name);
- `diff` with a prefix, against a tree, split and folded renames;
- `listTree` cursor resume, and refusal of a cursor from another revision;
- `firstAncestryMerge` before and after a `-s ours` merge.

**Node:** `test/direct/merge-gate.test.mjs`:
- red approve, red sync-root (with its decision) and a promote of one merged plus one red member each leave no candidate and no `refs/fgos/git-operations` pin;
- `approvableRootRepo` gained an optional `verify` (default unchanged).

**Mutation check:** with the blocked-path release disabled, the red-approve test fails on "no candidate is left".

## Verification

**Node.** Every Node command ran as `node <scratch wrapper> <files>`. The wrapper:
- sets umask 077;
- unsets `FGOS_HOST_BIN`;
- calls `ensureGitAddon(env)`;
- sets `FGOS_STATE_ROOT=/tmp/fgos-work/u14/state` and `FGOS_TEST_FIXTURE_ROOT=/tmp/fgos-work/u14/fixtures`, both mode 0700;
- runs `node --test`.

**Rust:**
- `cargo clippy --locked -p fgos-node-addon -p fgos-git -p fgos-event-store --all-targets -- -D warnings`: clean.
- `cargo test --locked -p fgos-node-addon -p fgos-git -p fgos-event-store`: every suite ok.

**Node, batch A** (`test/git/*`, runner merge / merge-land / merge-quoted-paths / merge-target-slot-multiprocess / promote-engine / land-vs-manual-commit / worktree / worktree-ports / worktree-callsite-wrapper / worktree-admin-multiprocess / repo-locks-multiprocess / session / claim-port / loop / execution commit-unit-work, direct merge-gate, architecture): 618 tests, 75 fails.

| Failures | Cause | Status |
|---|---|---|
| 72 in `test/runner/loop.test.mjs` | Environmental. The runner halts on `nested-write-from-confined-worker`, or bwrap namespaces are refused, in this confined session. | Needs the outer host. |
| 2 timing assertions (merge-target-slot "no wait fails at once", merge-gate approve `--no-wait` < 5 s) | Machine load | Pass when rerun alone (30/30, together with land-vs-manual-commit). |
| 1 `retargetMember` shape assertion | Lane change | Fixed above. |

**Node, batch B** (CLI approve 1–7, gate-approve, iron-law-gate, decision-kind, merge*, post-merge 1–4, return*): 278/278 pass.

**Also:**
- `git diff --check` is clean.
- Impact analysis: not run (GitNexus not queried in this confined session; the cross-check was `rg` over callers).
- Not run: full `npm test`, E3, lifecycle verbs.
- Needs the outer host: loop.test, plus anything that launches a confined Unit.

## Census rows

| Path | State | Why |
|---|---|---|
| `src/runner/merge.mjs` (85, 86, 542, 768, 796, 1030, 1041, 1043, 1105, 1106, 1161) | closed | Helper deleted, reads on Inspect. Line 1161 was the Work Checkpoint adapter call, not a spawn. |
| `src/runner/promote-engine.mjs` (30) | closed | A comment line; the code goes through Refs (`createBranchRef`). |
| `src/runner/github-adapter.mjs` (40, 49) | closed for Git | Spawns `gh`, not Git; this is the dormant GitHub contract. |
| `src/verbs/merge/approve.mjs:482`, `sync-root.mjs:219` | closed | Inspect `ancestry`. |
| `bin/fgos.mjs` merge/approve/sync-root/promote call sites | closed | No raw Git at those sites. The file's other rows belong to other verbs' lanes. |

## Extension points for the readers/scripts lanes

- A new read is one `GitDriver` method in `packages/git/rust/src/inspect.rs`, one arm in the addon's `GitInspect::call`, and one name in `src/git/inspect.mjs`'s method list.
- `listTree` is now reachable from Node.
- Nothing speculative was added.

## needsWrites

`scripts/run-tests.mjs` (gate tooling, reserved). Two changes are needed:
- `ensureGitAddon` should stage a host built from the checkout, never an inherited `FGOS_HOST_BIN`;
- `gitAddonSourceDigest` should include the host's sources (`apps/fgos`, `packages/distribution`), so that `test/helpers/git-addon.mjs`'s fast path cannot reuse a stale host.

Without these, `legacy-event-adapter` fails in any session that exports a release `FGOS_HOST_BIN`.

## Ideas (owner choice, not done; RUL104)

**Release candidates of superseded operations.** When `landOperationFor` records a fresh operation id because the prior one never attempted publication, it could acknowledge the prior operation under the new decision's sequence number.
- Problem: a lock refusal at publication, or a crash between prepare and the verb's record, leaves a pre-attempt candidate that nothing releases.
- Evidence: §9's admission closes such chains as `abandonedBeforeAttempt` but retains the candidate.
- Benefit: no orphaned candidate directories or pins, using the existing door only.

Status: DONE_WITH_CONCERNS
Summary: Land's merge reads and the verbs' ancestry checks now go through typed Inspect facts (`mergeTree`, `attributes`, extended `diff`, `firstAncestryMerge`, existing `listTree`). Red, conflicted and promote Land candidates are acknowledged and cleaned like delivered ones. Refs again refuses a held worktree-admin per spec §5, and the legacy-event failure is traced to a stale staged host.
Concerns/Blockers: `scripts/run-tests.mjs` (reserved) stages an inherited release host, so it needs the fix above. loop.test needs the outer host (bwrap / nested-write). A Land error rethrown before Work records anything still keeps its candidate.
