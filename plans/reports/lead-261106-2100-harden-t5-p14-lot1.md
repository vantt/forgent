# HARDEN T5 phase 14, lot 1: confinement authority cut and run test split

Branch `harden/t5-p14-lot1` from `origin/main` `7055cf874`, worktree
`/home/vantt/projects/forgent-worktrees/harden-t5-p14-lot1`. Not pushed. Owner decision 69. S-4 left out as told.

## Commits

| Commit | What |
|---|---|
| `b648147f3` | refactor(confinement): the three long authority functions split along their steps; census regenerated |
| `ce72cfb39` | test(runner): `run.test.mjs` split into four files; shared helpers moved to `test/helpers/run-unit-repo-fixture.mjs` |
| `7197486ce` | docs(git): `docs/platform/git/spec.md` names the new proof files in place of the deleted one (2 lines) |
| (this commit) | `test/suite-baseline.json` regenerated, this report |

## What changed

**`src/runner/dispatch/confinement/authority.mjs`** (1 314 → 984 lines). Refactor only:

- `buildConfinementAttestation`: the observed controls come from `observedControls` (the driver's claims, else the hand-written bwrap argv, else nothing). `observeBwrapArgv` reads both bind spellings in one pass: a joined string `"--bind a b"` and a flag followed by its two arguments. The two sandbox channels share one maker. Evidence entries come from one `observation(ref)` maker.
- `assessAndPrepare`: each refusal goes through `refuseLaunch` (build the refused attestation, apply the plan, push the mismatch or evidence, save, throw), keeping the old order. The confined path moves to `prepareBackend`. The claims-vs-plan check moves to `claimsMatchCoverage`. The three bypass-pairing flags are built by one `declares` helper. The driver-lookup site keeps `saveAttestationRecordThenThrow`.
- `prepareConfinementForLaunch`: the context checks moved to `requireLaunchContext`, in the same order, with `mkdir protected/ 0700` still before the launchCommandId check. The resource bindings moved to `bindPlanResources`. The prepared-invocation publish moved to `publishPreparedInvocation`, which publishes once per launch command and keeps the published digest on resume. `preparedAttestationDigest` reuses `attestationPlanDigest`, which is the same `computeSha256Digest(backendPlan)` with no mutation in between. The duplicate path variable is gone.
- Removed dead code: the `isRequired && (!backendInstance || !driver)` refusal. It could never be reached: `backendInstance` was already refused when null, and `getBackendDriver` returns a registered driver or throws (`backend-registry.mjs:23-45`). Also removed: the unused locals `adapterPort` and `adapterName` in `assessAndPrepare`.
- Comment groups removed or cut to the invariant they still state:
  - Header "Phase 02 R1-R7".
  - H11 env allow-list story, kept as 2 lines.
  - L9 save-then-throw story, kept as 1 line.
  - LOW-2 legacy-grant target, kept as 2 lines.
  - M8 permissionMode, kept as 1 line.
  - "observe mode (this phase)", kept as 1 line.
  - H11 0700 directory note, kept as 2 lines.
  - F1 and H11 resume digest story, kept as 4 lines on `publishPreparedInvocation`.
  - Corrupt-record fallback, kept as 1 line.
- Exports, signatures, error codes, messages, `details` key order and persisted shapes are unchanged.

**Test split.** `test/runner/execution/run.test.mjs` (2 207 lines, 78 tests) was deleted. Its tests moved whole into four files. The table gives the summed test durations from one focused run.

| File | Lines | Tests | Summed test time | CPU in the full run |
|---|---|---|---|---|
| `run-gate.test.mjs` | 379 | 20 | 9.7 s | 10.4 s |
| `run-roles.test.mjs` | 524 | 15 | 70.3 s | 54.8 s |
| `run-summary-resume.test.mjs` | 569 | 21 | 37.5 s | 23.1 s |
| `run-verify-pin.test.mjs` | 634 | 22 | 60.1 s | 40.5 s |
| total | 2 106 | **78** | 177.6 s | 128.8 s |

- **Old figures:** 156.3 s wall in the closing report, and 109 s CPU in the previous `suite-baseline.json`.
- **Longest file:** now `run-roles.test.mjs`, at about 70 s.
- **Range boundaries:** the plan's ranges were kept, with one exception. The workspace-persona test (old `:1564`) went to summary-resume, which is where the plan's table lists it.
- **Helpers moved to `test/helpers/run-unit-repo-fixture.mjs`** (existing file, no new helper file): `writeSettlingWorker`, `reviewedConfig`, `recordedUnitFixture`, `writeScopedWorker`, `gitIn`, `headOf`, `producerSpawns`. Each is used by two or more of the new files.
- **File-local helpers:** they stay in the one file that uses them.
- **Registry seed:** each file calls `seedFileLocalBwrapRegistry()` itself.
- **Move check:** a script checked that the non-blank lines of the four bodies plus the moved helpers equal the old file's lines 31 to the end, as a multiset. Result: 0 missing, 0 extra.
- **Duplicate titles:** `--duplicates` reports no duplicate title that involves the new files.

**`test/suite-baseline.json`**:
- Regenerated with `node scripts/test-proof-inventory.mjs --write-baseline` on `ce72cfb39`, the commit the full run recorded, through a detached checkout of that commit. It was not hand-edited.
- Result: 614 files, 8 007 test() calls, 5 540 s CPU, 0 known clones.
- The `run.test.mjs` row is gone, and the four new rows are listed above.

## Proof

- **Authority behaviour, differential:** before the commit, the old and new `buildConfinementAttestation` ran side by side on 40 000 generated requests. The inputs covered both bind spellings, `--setenv HOME`, `--unshare-*`, non-string args, driver claims, legacy confinement, herdr spawn, blind policy and each requirement mode. Result: 0 differences in `JSON.stringify` output, so key order is the same too. The temporary script files were deleted.
- **Security review:** a code-reviewer subagent on opus ran read-only over `b648147f3`. It found no behaviour difference and no security regression. It confirmed refusal codes, messages, details key order, save-then-throw order, side-effect order, bwrap parser results and digest fields, and that the removed refusal was unreachable.
- **Focused, before the change (`7055cf874`):** all `dispatch-confinement-*` files, `provider-credential-renewal`, `cli-spawn-reconciliation`, `run-supervisor/sweep` and `architecture`: 314/314.
- **Focused, after the authority commit:** the same set, 314/314.
- **Focused, after the split:** the four new files, `run-provider-failover`, `run-pre-admission` and `architecture`: 135/135.
- **Docs:** `doc-health` and `check-decision-citation-drift`: 36/36, after the spec fix.
- **One-door census:** `git-one-door-scan --root .` reports 0 undeclared. The census was regenerated in the authority commit, because the `verifyRequiredProbe` spawn site moved lines.
- **Full suite, one run on `ce72cfb39`** (`/dev/shm/p14l1-full.log`, `HERDR_*`/`CLAUDE*` unset, private cargo dir):
  - 8 597 tests, 8 563 pass, 2 fail, 621 s wall. No `run-tests: ERROR` lines.
  - "frozen V7n addendum" failed. It is a known pre-existing failure.
  - doc-health "live self-check" failed on two dead references to `test/runner/execution/run.test.mjs` in `docs/platform/git/spec.md:278,963`. My deletion caused them. They are fixed in `7197486ce`, and doc-health is green after it (36/36 above).
  - Suite line: `+78 -78 test() calls, 0 new CLI/host spawn site(s)`.
- **Red→green:** none. This is a refactor phase, and phase 01 has no rows for it.

## Size against the phase budget

| Measure | Before | After | Target |
|---|---|---|---|
| `authority.mjs` | 1 314 | **984** | ≤ 1 270 |
| `src/runner/dispatch/confinement/` (all .mjs) | 5 972 | **5 642** | ≤ 5 950 (aim 5 930) |
| `buildConfinementAttestation` | 343 | 178 | ≤ 300 (aim 280) |
| `assessAndPrepare` | 389 | 72 (+ `prepareBackend` 103) | ≤ 300 |
| `prepareConfinementForLaunch` | 302 | 169 | ≤ 300 |
| Node src net | | **-330** | lot 1 asked -44 |
| Tests net | | +58: four headers plus fixture exports, no test added or retired | about 0 |
| Rust | | 0 | 0 |

**Function scan:** with this lot, `src/runner/execution` and `src/runner/dispatch` have 4 functions over 300 lines left, all in lot 3: `resolveCollaboration` 515, `compileDispatchPlan` 421, `checkCatalog` 374 and `settleRunOutcome` 338. The three functions watched in the plan did not move: 293, 277 and 277.

## Tests retired

None. Every one of the 78 tests moved unchanged; `run.test.mjs` is deleted only as a file.

## Deviations from the phase file

1. **I edited `docs/platform/git/spec.md`**, 2 lines, path names only. The phase says lots do not edit docs. But deleting `run.test.mjs` left two dead references, which the doc-health test turned red. L10 asks to move every caller in the same change. The new names are: `run-pre-admission` for the main-checkout refusal and the no-repository refusal, `run-summary-resume` for the live cwd holder, and `run-verify-pin` for the pending ScopedCommit resume. The no-repository proof had already moved to `run-pre-admission` in an earlier change. No count or prose was touched.
2. **I edited `test/suite-baseline.json`**, as the prompt told me to. The phase default was report-only.
3. **The authority cut went well past its line target** (-330 against -44). The extra comes from removing the duplicated refusal blocks and the dated comments.

## Items for other phases and the big lead

- **`adapterPort` is never read.** `assignment-runner.mjs:950` passes it into `prepareConfinementForLaunch`, which passes it on to `assessAndPrepare`, which never reads it. That is a dead parameter path. `assignment-runner.mjs` is outside every lot, so both signatures are unchanged here. Removing it is a small follow-up for whoever owns that file.
- **Lot 2's run tests are now the four new files.** Its launch-bound run tests should run `run-gate`, `run-roles`, `run-summary-resume` and `run-verify-pin` once this lot lands.
- **Shared files are rebase-only.** `packages/git/contracts/mutation-census.v1.json` and `test/suite-baseline.json` both change here. Whichever lot lands second regenerates them.

Status: DONE
Summary: The three authority functions are cut to 178, 72 and 169 lines; `authority.mjs` went from 1 314 to 984 lines and `confinement/` to 5 642, with behaviour unchanged (40 000-case differential, security review, 314/314 focused). `run.test.mjs` is now four files with 78 tests in total, and the full suite is green except the known V7n red; the doc-health red it found was fixed.
Concerns/Blockers: I edited two lines of path names in `docs/platform/git/spec.md`; that was outside the lot's docs rule but needed to keep doc-health green.
