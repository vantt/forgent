# W5 suite fix review (commit 53b2b718f, record L13-7)

Verdicts: **3 APPROVE, 1 REWORK**. Reviewer is independent and read-only; the only files written are this report and its JSON twin.

## 1. Lease-race mocks: APPROVE

The native `GitLand.prepare` returns a promise on both paths. With held locks, `answer()` resolves a deferred. Without them, `spawn()` resolves it from the `fgos-land` thread (`packages/git/node-addon/src/git/land.rs:59-62, 76-81, 129-175`). The port forwards that promise (`src/git/land.mjs`), and both production callers await it: `src/runner/merge.mjs:920` and `src/workflow/runner.mjs:626`. The mock change (`async function` plus `await prepare.call(...)`) therefore matches the real contract.

Every assertion, the timing of `acquire()`, and the `publish` mock are unchanged, so nothing was weakened. The test now forwards a promise, as production does, so there is no test-only branch. Before the fix the proof failed rather than passing vacuously: `result.candidate` was undefined, which threw a TypeError.

## 2. Registry re-pin: APPROVE (not runner-only, but reproducible)

The change is **not limited to runner entries**. The single-source carry refuses an edited heading, so the author used the repo-wide carry. That carry moves the pin from 1bd5df87f to a1fae5356 and also records:

- 7 new documents
- 952 added units
- 151 new gaps
- 134 removed-pending-disposition units

The receipt states this, and it follows the L12-125 precedent. The runner stays at 517 units, and only `business-rules` and `unheaded-block-93` change.

I reran `scripts/generate-doc-inventory.mjs --carry-forward-identity-registry --identity-registry <53b2b718f^ registry> --commit a1fae5356` into scratch (exit 0, 6 s). The output is not byte-equal, and only for expected reasons:

- **Random new IDs.** `randomOpaqueId` mints fresh IDs for new units and documents: 952 new unit claim IDs and 7 new document `sourceId`s. None of them collides with an old ID.
- **Input path.** `_binding.path` records the path of the input file. Its sha256 and byte count are identical.

Everything else matches the committed file:

- All non-ID content of units, gaps, retired units and retired documents is identical.
- All 92,935 carried unit claim IDs are identical.
- All gap and retired IDs are identical.
- The counts are identical: 4,508 documents, 93,887 units, 6,276 gaps, 2,500 retired units.

The repin did not change the D-class failure. `doc-rationale-reproduction` "documented ownership" still fails 0/2 on `noNewDoubleOwnership`, as before.

## 3. L13-7 classification: REWORK (one overclaim)

The 83 titles reproduce: the branch-only set from `/tmp/fgos-work/p9-suite1.log` minus `main-suite2.log` (8,587 tests / 369 fail) is 81 unique titles, plus 2 lease-race parent titles. Counts A6/B71/C3/D3 match the table.

I spot-checked 16 B titles in the rerun logs (`.../scratchpad/pa/rerun-{p8,main}-suite/`):

| Result | Count | Titles |
|---|---:|---|
| ✔ alone in both clones | 15 | including sync, session listSessions, merge tsk-52p, fgos-move, cwd-mutex, dev-host, both download-sources titles, crash-matrix, terminal-cutover, worktree custody, fgctl-stage R6/R9, commit-parent-death, one-door, and others |
| ✔ alone on the branch, ✖ alone in main | 1 | help `--json`; the attribution table says so |

The suite failure text shows load signatures:

- git-timeout: 23 on the branch vs 2 on main
- containment-unproven: 14 vs 0
- 17 whole files killed at the 600 s watchdog
- sync test: 141 s in the suite vs 8 s alone

The pass-alone part of "load" is therefore evidenced. The cause is inferred: no load-average measurement exists in any artifact, and the attribution's Unresolved (2) admits this. The branch also runs 361 more tests than main.

C and D titles:

| Class | Title | Evidence |
|---|---|---|
| C | Holder workflow | Fails alone in the /tmp clone. In my run from W outside /tmp it passes (units-runner 30/30), which corroborates C. |
| C | Run-case lease admission | 24 ERR_MODULE_NOT_FOUND on the branch vs 21 in the main clone. |
| C | Symlink audit | Fails alone; the cause is the hard-coded `/tmp/fgos-work` allowlist. |
| D | Dead-vocabulary guard | Fails on the branch, passes on main. Lead-authorized GAP-05 red, so the class holds. |
| D | Two ownership recipes | Fail on `noNewDoubleOwnership`. They are tracked by `w5-rebind-brief.md`, not "allowed". |

The D findings also cite only lines 1313 and 1444, but the log also flags line 1456 of `docs/platform/component-boundary.md`.

**Overclaim.** L13-7 says "B 71 (load: all pass alone in both clones)". That is false for 3 rows:

- `test/e2e/pr-gate.test.mjs` and `test/e2e/runner-loop.test.mjs` still fail alone in **both** clones. The attribution's own rows call the residual C.
- The help `--json` title fails alone in the main clone.

**Fix:** change L13-7 to "B 71 (load: watchdog/git-timeout signatures; 68 pass alone in both clones; pr-gate and runner-loop residual failures are shared with main (C-like); host help --json flaky alone in main)".

## 4. Touched files run: APPROVE

Both files ran in W, from a checkout outside /tmp, with:

- `env -u CLAUDE_CODE_SESSION_ID`
- `FGOS_HOST_BIN=<release a970a7e6…>/bin/fgos`
- staged addon cache hit `.fgos/runtime/git-addon/9181583a2b89d38b` (source digest matches), so nothing was built

| File | Exit | Result | Lease-race subtests (before prepare, after prepare, before publish) |
|---|---:|---|---|
| `test/runner/merge-land.test.mjs` | 0 | 22/22 | all ✔ |
| `test/workflow/units-runner.test.mjs` | 0 | 30/30 | all ✔ |

Neither file logged an unhandledRejection or land-session-closed message. There were no YAML-addon failures. My runs created no git changes in W; the only untracked files there belong to another reviewer.

## Notes (non-blocking)

- 53b2b718f adds 16 paths, including two `test/` files. The round5/sync4d check A needs them pair-accounted after the rebind turns `noNewDoubleOwnership` green. That check cannot be observed while it is red.
