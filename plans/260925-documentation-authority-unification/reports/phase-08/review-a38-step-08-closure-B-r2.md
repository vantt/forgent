# Phase 8 closure review B, round 2: Land race fix, regression repair, lease CLI

Pin: `/home/vantt/projects/forgentX-s8-review` at `1eae797d8` (confirmed with `git rev-parse HEAD`; the only untracked entry is `target-review/`). I made no git writes, ran no fgos CLI against any real repository, and did not touch `.fgos/` or secrets. All scratch files are under `/tmp/fgos-work/review-B/`.

Reviewed commits: `a9aee1663`, `22e5b322c`, `bf264d8f2`, `4821f0a4a`. Host: `FGOS_HOST_BIN=<releasePath>/bin/fgos` with releasePath `sha256:94e26894…`.

## Verdict: REWORK (small)

All four requested behaviours hold, and earlier F1 is fixed: I re-ran my original slot-wait race 3 times and got 3/3 refusals, with nothing published.

Two defects remain in what these commits claim. Each is a one-line fix:
- **M1:** git spec §9 still states the reverted "always pass target" rule, which contradicts §7.
- **M2:** the CHANGELOG claim "a refused non-holder `fgos run` writes nothing" is false for prompt runs that pass `--provider`. I reproduced this.

Neither lets frozen documentation scope be published.

## Checks

| # | Check | Result | Evidence |
|---|---|---|---|
| 1a | Runner Land refuses a non-holder when the lease is acquired between admission and publish | PASS | `src/runner/merge.mjs:866-871` (first admission), `:903-904` (after checkpoint), `:945` (actual prepared pair), `:972` (after verify, before publish). The `:1013-1018` stale path reports the lease refusal. `merge-land.test.mjs:98` covers 3 timings. My `repro/race.mjs` (child holds slot 20, acquire happens during the wait) now gives `documentation-cutover-lease` with `main:docs/new.md = null`, 3/3 runs (it published at `373695db0`). |
| 1b | Workflow Land refuses the same way | PASS | `src/workflow/runner.mjs:607-619`, `:632-636` (actual prepared pair), `:642-650` (stale path becomes lease refusal). `units-runner.test.mjs` race test (3 timings) passes. |
| 1c | A sequential second Land onto a legitimately advanced target still merges | PASS | `merge.mjs:927-929` passes `target` only when files are declared. Workflow passes no target (`runner.mjs:626-631`). `land-vs-manual-commit.test.mjs:38` ("second merges onto the first one's result") passes, 8/8 in the file. The Workflow unrelated-advance test passes. |
| 1d | A red repo-invariant check still classifies as verify-fail | PASS | `merge.mjs:960-962` returns before the final admission at `:972`. `merge.test.mjs` "a red repo-invariant check blocks the merge…" passes, 85/85 with addon bootstrap. |
| 2 | A refused non-holder `fgos run` writes no bindings sentinel | PASS for the sentinel, FAIL for "writes nothing" (M2) | Admission now runs before port construction (`bin/fgos.mjs:2952-2964`). The `run-case-admission` named test passes, including the CLI child and the absent `.fgos/workflow-runs/.bindings/.root`. |
| 3 | Human-mode docs-lease acquire/status/release/abandon exit 0 with a string; token never printed | PASS | `bin/fgos.mjs:3866-3890` returns strings and `:5241-5242` writes them raw. JSON branches are unchanged. Only `tokenHash` is printed, never the token or tokenPath. The e2e hooks file passes 35/35, including the 4 human-mode cases. |
| 4 | Earlier closure-B findings | F1 fixed. F2 partly addressed. F3 fixed. | F1: see above. F2: `step-08-lease-rehearsal-rerun.md` uses `npm run fgos:dev`, but at `44ca64559`, which predates `22e5b322c`/`4821f0a4a`; its holder-Land step failed on worktree size (see R1). F3: registry rank-10 note lists `documentation-cutover` (`lock-registry.v1.json:5`), §7 hook order starts with `addedEventPathRefusal`, and the 18/18 count is corrected. |
| — | Workflow ledger repair runs before admission (`bf264d8f2`) | PASS | `src/workflow/case-verbs.mjs:192-203` (`takeAndRecord`: lock, then repair, then admit, then record) and `:297-306` / `:326-335`. The advance-lock and tail-repair writes precede admission by design; they are `.fgos` ledger writes, not lease scope. |

### Test runs (single files, scratch state 0700, no suite launcher)

| File | Result |
|---|---|
| `test/runner/merge-land.test.mjs` | 22/22, exit 0 |
| `test/runner/documentation-cutover-lease.test.mjs` | 15/15, exit 0 |
| `test/runner/merge.test.mjs` (with `--import` bootstrap) | 85/85, exit 0. Without the bootstrap, 73 fail with `git-addon-not-shipped`; that is the known environment limit. |
| `test/runner/land-vs-manual-commit.test.mjs` (with bootstrap) | 8/8, exit 0. The scorecard L113/L122 says "9/9"; the file has 8 tests at the pin. |
| `test/workflow/units-runner.test.mjs` | 10/30. All 3 lease/Land tests pass. The 20 failures are worker `execution-failure` (bwrap/nested confinement) in this sandbox, not lease-related. |
| `test/runner/execution/run-case-admission.test.mjs`, name pattern `documentation lease admission` | 1/1, exit 0 |
| `test/e2e/documentation-cutover-lease-hooks.test.mjs` | 35/35, exit 0 |

Not run: the full `run-case-admission` file and `case-verbs` (worker-dependent failures in this sandbox are already recorded in L12-126/127), and anything that needs a real worker.

## New defects

### M1 (Medium, docs authority drift): git spec §9 still says the consumer always passes `target`

- **Locator:** `docs/platform/git/spec.md:393`. The phase 07 unit 11 entry says: "The consumer now always passes that admitted `target`, including when declarations are empty, to preserve lease admission across slot waits (§7)". `a9aee1663` wrote this sentence. `22e5b322c` reverted the code (`merge.mjs:927-929`), and `bf264d8f2` rewrote §7 to "Only Work's declared resolution files require an explicit target OID".
- **Failure scenario:** the spec is the state layer for this plan, and §9 now contradicts both §7 and the code. A Phase 9 operator or a later maintainer reading §9 will believe slot-wait protection comes from target pinning. It actually comes from re-admitting the actual prepared pair. They might then "restore" the pin and re-break sequential lands, which is the regression L12-126 fixed.
- **Fix:** replace that sentence with the §7 wording (target only with declared files; otherwise Land selects under its slot and both doors re-admit the prepared pair).

### M2 (Medium, contract claim false): a refused non-holder prompt run with `--provider` rewrites `.fgos/config.json` before admission

- **Locator:** `bin/fgos.mjs:2920` calls `adhocUnitFromPrompt`, which at `:532` calls `ensureRunnerConfigForDir(mainRoot)`. That function writes the file at `src/runner/dispatch/config.mjs:453` (missing default keys) or `:468` (no config). The new admission at `:2955` runs after this.
- **Reproduction:** `/tmp/fgos-work/review-B/cfg/probe.mjs`. In a fixture repo with the lease held by a linked worktree and a minimal valid project config, run `bin/fgos.mjs run hello --provider x-agent --dir <repo> --json` from main. Result: exit 4, stderr `documentation cutover lease is held; non-holder operations are refused`, and `.fgos/config.json` changed from 81 to 1263 bytes ("added missing default config keys"). The bindings sentinel is absent.
- **Impact:** no lease-scope path is written, so frozen docs are safe. But the CHANGELOG line ("a refused non-holder `fgos run` writes nothing") and the L12-127 statement "Admit before even that write" are both false for this input. The case-admission test only exercises `--resume` and skips this branch. The write occurs whenever a release adds a new runner default key, so it is not hypothetical after an upgrade.
- **Fix:** either move `admitDocumentationExecution` above `adhocUnitFromPrompt`, or narrow the CHANGELOG wording. Moving it is better: `repoRoot`/`worktree` are already known at `:2918-2919`, so this costs about two lines and needs no new mechanism. Admission needs neither the unit nor the config.

### L1 (Low): a lease refusal after prepare leaves a prepared Land candidate with no settlement

- **Locator:** `merge.mjs:945` and `:972` throw `MergeError` after `port.prepare`, and `:982` rethrows it unsettled. The Workflow door does the same at `runner.mjs:636`.
- **Scenario:** the lease is acquired during the slot wait or during verification. The refusal is correct, but approve's next attempt sees the prior operation at phase Prepared (not `target-attempt`/`land-verified`, `approve.mjs:170`) and mints a new operation id. The old candidate worktree, pins and WAL stay until Land recovery collects them.
- **Assessment:** this matches the documented "rethrown error keeps its candidate" rule (git spec L399), so it is not a regression of the contract. It is new accumulation that did not exist when refusal happened only before prepare. Acceptable if git-land-recovery collects Prepared operations; worth a one-line note in §7.

### L2 (Low, pre-existing, adjacent): human `docs-lease status` on a corrupt sidecar prints garbage

- **Locator:** `bin/fgos.mjs:3874-3876`. `inspectDocumentationCutoverLease` returns `{state:'corrupt', held:true, sidecar:null}` for a corrupt sidecar, so the held branch prints `age: NaNs, kernel lock: undefined`, `holder token hash: undefined`, `worktree: undefined`. Exit is 0.
- **Fix:** branch on `res.state === 'corrupt'` before the held branch. The new human-mode cases do not cover corrupt state.

## Residual (Lead-owned, not a defect in these commits)

- **R1:** Holder-Land publication on a real-size clone is still unproven at the final code. The rehearsal rerun is at `44ca64559` (before `22e5b322c`/`4821f0a4a`) and its holder Land hit `borrow-deadline` on the 4.4 GB tree. Re-run it after the L12-128 prune, on the closure pin.
- **R2:** The activated release (`94e26894…`) routes no `docs-lease` verb (L12-126 item 3: `unknown verb`). The Phase 9 cutover must run from a release staged after the L12-125 route regeneration.

## Recommended actions

1. Fix M1: one sentence in `docs/platform/git/spec.md:393`.
2. Fix M2: move `admitDocumentationExecution` above `adhocUnitFromPrompt` in `bin/fgos.mjs` (around line 2918). Extend the existing `run-case-admission` CLI probe with one prompt+`--provider` invocation that asserts `.fgos/config.json` is byte-identical.
3. Optional: L2 corrupt-status branch; one §7 note for L1.
4. Correct the scorecard's land-vs-manual-commit count (9/9 to 8/8) unless a ninth case exists elsewhere.

Status: DONE_WITH_CONCERNS
Summary: Both Land doors now refuse a lease acquired mid-Land (earlier F1 race 3/3 refused), sequential lands and invariant verify-fail still work, human-mode docs-lease output and the sentinel ordering are fixed, and all owning lease/Land files pass. Small rework remains: git spec §9 still states the reverted always-pin-target rule (M1), and a non-holder `fgos run "<prompt>" --provider` rewrites `.fgos/config.json` before admission, which falsifies the "writes nothing" CHANGELOG claim (M2, reproduced).
