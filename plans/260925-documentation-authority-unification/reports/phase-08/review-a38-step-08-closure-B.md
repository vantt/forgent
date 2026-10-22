# Phase 8 closure review B: Step 6 evidence tooling and Step 6b lease

Pin: `/home/vantt/projects/forgentX-s8-review` at `373695db0c01c0f12f6fbccdf4469ab8760e6bc8`, confirmed. I made no writes there. The only untracked entry is `target-review/`, and it did not change during my runs. Scratch: this directory (`repro/`, `fast/`, `chan/`, `*.log`).

## Verdict: rework (small)

Step 6 holds. The Step 6b lease shows no regression from the T1 holder-lock merge or the identity merge. But one documented Land guarantee is false under an interleaving I reproduced (F1). It was missed by every earlier review because it already existed at `2fbf9f018`/`ba1d05d55`. The rehearsal evidence also predates T1 and uses a channel T1 made unsupported (F2).

## Re-verified (holds at 373695db0)

| Claim | Result |
|---|---|
| Verifier `--before` | exit 0, `checkedCount 867`, 0 violations |
| Verifier `--after` | exit 1, 907 violations = 867 `remaining-legacy-file` + 40 `maintained-text-legacy-mention` (40 distinct paths). Matches scorecard L57 |
| Manifest | source `38bddcdd7`, 867 entries, 17,176,516 bytes, 12 entries with mode 100755. Consumer table has 43 rows |
| `test/scripts/check-evidence-relocation.test.mjs` | 41/41 |
| `test/runner/documentation-cutover-lease.test.mjs` | 15/15, including the 20-trial two-process single-winner acquire |
| `test/e2e/documentation-cutover-lease-hooks.test.mjs` | 31/31: raw main move refused while held, non-holder commit refused, transitions borrower-gated |
| `test/runner/merge-land.test.mjs` | 18/18: foreign/non-Git caller refused, holder land admitted, code-only admitted. Scorecard says 19/19; the dropped test is `decision-id collision…`, removed by identity commit `63b777873`, not a lease test |
| `run-case-admission` 15/15, `case-admission-port` 12/12, `holder-lock/registry-contract` 19/19 | pass |
| T1 merge `ad98c3882` | Registry row `documentation-cutover` is fence-free with keys {kind,name,note,owner,rank,scope,v3Path}. Schema enums include `lease` and `documentation`. Rank 10 kinds are `[lease]`. Doctor row is still registered (`src/setup/registrations.mjs:2155`). The `merge.mjs:866` `leaseScopePaths` rename is a pure rename. The hook borrower check still uses `checkBorrowedDescription`, which goes through the surviving `--borrowed-check` route (`src/holder-lock/index.mjs:634`). |
| Fast path | Unrelated ref update: about 15 ms (sh only). Main update with no lease: about 220 ms (Node plus the full pre-commit import graph), against about 7 ms with no hooks. This matches the git spec §7 statement that main updates always load the policy. |
| Docs vs code | holder-lock spec §19 lease section and git spec §7 match the code for lock order 10→50, scope list, token path, stray-main rules, doctor conditions and registry table row L177 |

## Findings

### F1 (High): a non-holder scoped Land admitted just before acquire publishes into frozen scope

The problem:
- `src/runner/merge.mjs:866-868` reads lease authority once, before the Land.
- `port.prepare` (`:919-931`) passes `target: pinned` only when `files.length > 0`. Docs-only branches have no store files, so `files` is `[]`.
- With no target, native Land pins the destination itself after it acquires slot 20 (`packages/git/rust/src/land.rs:16,427-432`).
- Acquire takes locks 10 and 50, never slot 20. So any acquire that commits between admission and Land's pin lands underneath the Land, and the Land publishes on top of the held sidecar.
- Typed Land runs with hooks disabled, so the reference-transaction hook never sees it.
- `src/workflow/runner.mjs:615-628` (`mergeWorkflowBranch`, also `files: []` and no target) has the same window. It is narrower there because prepare does not wait.

Reproduction: `repro/race.mjs`.
1. A child process holds `merge-slot--refs%2Fheads%2Fmain` for 8 s.
2. A non-holder calls `landRunnerItem(branch 'scoped' adding docs/new.md, callerCheckout = main, lockWaitMs 30000)`. It is admitted (lease absent) and blocks on the slot.
3. 1.5 s later a second child acquires the lease from the `holder` worktree.

Output:
```
lease before land: absent
[acquirer.mjs] lease acquired
land result: {"outcome":"merged"}
main sidecar state: held | main:docs/new.md = "non-holder frozen-scope edit"
4e0de47 merge scoped into main
63dc4a8 chore(docs): acquired documentation cutover lease
```

Impact:
- In production the slot wait is real: another Land verifying holds slot 20 for minutes. A Work checkpoint wait on main-checkout opens the same window.
- This falsifies git spec §7 ("Scope-touching non-holder lands refuse") and holder-lock spec §19's door table.
- It also falsifies design §7's assumption that work arriving after acquire "is refused at commit". Land bypasses commit hooks.
- What limits the damage: release `drift` and the Phase 9 recompute of digests from Git detect the change, and design §3.4 precondition 3 (no unmerged scope branch) would refuse the acquire. But the code explicitly does not run precondition 3 (spec: "the cutover operator owns those checks"), and Known limits does not list this.

Fix (code, preferred):
1. In both doors, always pass the admitted `pinned` target to `port.prepare`. The publish CAS then refuses as stale if acquire moved main, and Work retries through a fresh admission.
2. Alternatively, after prepare, re-run admission against `candidate.target` (`readSidecarFromMain(repoRoot, …, { revision: candidate.target })`) and abandon the candidate when it is held, the paths are scoped and the caller is not the holder.

Add one owning proof in `merge-land.test.mjs` using the slot-holder interleaving above.

Minimum alternative: add a Known limits entry plus a mandatory operator step ("no in-flight Land/slot holder and no unmerged scope branch at acquire") to the cutover runbook. Even then, the scorecard 6b row must not claim Land refusal without that caveat.

### F2 (Medium): the 6b rehearsal is pre-T1 and its command channel is now unsupported

`step-06b-rehearsal.md` (commit `fdc84570c`, 2026-10-22 19:07) ran `node bin/fgos.mjs docs-lease …`. The T1 merge `ad98c3882` (2026-10-23 01:41) made the checkout channel unsupported for lock verbs (holder-lock spec §20, 2026-10-22 entry).

Reproduction (`chan/`, scratch repo): `node <pin>/bin/fgos.mjs docs-lease acquire`, with or without `FGOS_HOST_BIN`, gives `holder-lock (lock-driver-unavailable): git-addon-unavailable: addon not shipped on this channel`, and main is unchanged.

So the scorecard L16/L40 "disposable rehearsal all seven steps pass" is historical proof of pre-T1 code, not proof of `373695db0`. The unit/e2e suites do cover the transitions under the in-process door.

Fix: re-run the seven-step rehearsal on the closure pin through `npm run fgos:dev -- docs-lease …` or a staged release in a disposable clone. Record the source SHA, and correct the rehearsal's command column.

### F3 (Low)

- Scorecard L16 cites "19/19 Land". The current count is 18/18 because identity commit `63b777873` retired a non-lease test. Cite the current count or say so.
- `packages/holder-lock/contracts/lock-registry.v1.json` rank `"10"` note reads `"runner, gateway"` and omits `documentation-cutover`. The spec table L149 lists all three.
- git spec L331 hook ordering omits the first guard (`addedEventPathRefusal`, `.githooks/pre-commit:513`). This is outside lease scope; noting it only.

## Scorecard rows

- **Step 6 (L15, L38, L39, L57):** true as written.
- **Step 6b (L16, L40):**
  - "production … holder/foreign refusal proofs" is true for doors called after the lease is committed, but not for a Land already admitted (F1).
  - "rehearsal all seven steps pass" is stale against the pin (F2).
  - The test count needs the 18 correction (F3).

## Lead questions

1. For F1: is a code fix (always pin target, or re-admit at `candidate.target`) wanted before closure, or is a documented limit plus an operator precondition acceptable for Phase 9? I recommend the code fix. It is about two lines per door and closes the window structurally.
2. For F2: should the rehearsal re-run be part of Phase 8 closure, or carried into Phase 9's pre-freeze checks against the activated release that will actually run the cutover?

Status: DONE_WITH_CONCERNS
Summary: Step 6 verifier/manifest and the Step 6b lease survive the T1 and identity merges (all owning suites green, counts match). A reproduced race lets a non-holder Land admitted before acquire publish docs onto a held lease (F1), and the 6b rehearsal predates T1 and uses a now-unsupported channel (F2).
