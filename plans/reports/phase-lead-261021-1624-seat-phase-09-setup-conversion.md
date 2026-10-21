# Seat Binding setup conversion, drain row, fence proof: phase lead report

Branch `seat-p09` (from `22d02f15c`). Nothing pushed, merged or activated. The real config of this repo and `~/.fgos/config.json` were never edited; conversion is proved on fixtures and temp HOMEs.

## 1. What changed

- **`fgos setup` order**: `convertProjectConfigFile` runs first (project file only), then the existing fill-missing. It reads the project and global runner sections, converts, copies the file to `.fgos/config.json.pre-seat-binding-<UTC time>` (exclusive copy), writes the result and returns `{status, backupPath, changes, reports}`. Setup prints the backup path, every change and every report line (bare-verb copies, `maxTier` additions, unit-rigor / `rigorFloor` behaviour changes). A project with no runner section is left to the fill-missing writer, which already starts it in the new schema. The global file takes only its usual fill-missing defaults; the test asserts no `seatBinding`, `$comment`, `defaults` and an untouched `rigorToTier` and `patterns`.
- **Converted configs**: `convertRunnerConfig` now refreshes a `$comment` that differs from the ladder (nothing else); a missing `$comment` is not drift. `ladderCommentLines` renders the crate ladder (one source) into the `$comment` text; `registeredCapabilitiesOf` replaces the inline copy in tests.
- **Doctor rows** (new module `src/setup/seat-binding-checks.mjs`): `seat-binding-config` fails an unconverted project runner (`rigorToTier`, no marker, unknown marker) with a message naming `fgos setup`, the backup file and the rollback pair (previous release plus that backup); a differing `$comment` is reported on a passing row. `seat-binding-drain` fails only while a pre-seat `unit.json` (no `seatSchema`) has a live controller, whatever its `execution` status or lack of it, listing path, unit run, age and controller id; dead, unsummarised pre-seat records and open workflow runs (parked or running) are info lines naming `record-predates-seat-binding` and the legacy read path. It reads records only. Live forgentX: 729 ms, 1 live (another session), 83 dead listed.
- **Fence proof** (`test/setup/seat-binding-fence.test.mjs`): a real extraction (`git archive` of `105c73726`, `src` and `package.json`) loaded in a child with a temp HOME whose global file is real-shaped (carries `rigorToTier`). For forgentX-, mdview- and mcp-skill-hub-shaped configs: the old loader refuses the converted file and leaves its bytes alone; the old fill-missing writer adds only keys from its own defaults (including `rigorToTier`) and still refuses; new setup converts again, the config row passes, a second setup is a no-op. Separately, the marker alone is refused with `unknown key "seatBinding"` for each shape. The old tree is pinned by commit (a merge-base would move once this lands).
- **Big-lead decision: `policy.fallbackExecutors` removed** with its validation (`registrations.mjs`, `POLICY_PATCH_FIELDS`), the freeze in `assignment.mjs` and `enrich-and-validate-contract.mjs`, and the `executorPreference` list it built. Readers moved to `policy.executorId` (`plan.mjs` x3, `assignment-runner.mjs`). A workflow YAML that still declares the key is now refused as a disallowed policy key. Old records keep their `executorPreference` field and read as before (no reader exists).
- **Big-lead decision: typed lease conflict**: a lease refused on the named account settles as failure code `provider-capacity-lease-conflict` (constant in `run-result.mjs`); `run.mjs` recognises it by code, not by message text; history maps it to `provider-limit` like `provider-capacity-refused`, which old records keep.

## 2. Tests retired or moved

- `mergeHarnessPolicy freezes a fallbackExecutors array`: behaviour removed. `findWorkflowStageOperationProblems` fallback shape/name cases: replaced by one assertion that the key is a disallowed policy key (same test, owned by `registrations.test`). `executorPreference` assertions in `dispatch-plan-policy`, `dispatch` and the golden fixture now assert `executorId`; the fallback-list case asserts the field no longer exists.
- Lease-conflict assertions in `assignment-dispatch.test` now expect the new code (it is their owning proof); `unit-run-outcome.test` gained the history mapping case.
- The conversion tests' CLI level (`seat-binding-conversion.test`): backup + diff + global untouched, idempotent, `$comment` refresh, fresh project. Doctor rows: `seat-binding-checks.test` (config and drain, 9 tests) instead of `checks-doctor-config.test`, because it owns the new module.

## 3. Delta lines vs `22d02f15c` (whole phase, both big-lead decisions included)

| Part | Added | Removed |
|---|---|---|
| Node src (src, bin, domains) | 237 | 48 |
| Rust | 0 | 0 |
| Tests (incl. fixtures) | 457 | 36 |

Net Node src +189: the new rows and the setup step (about 230 lines) outweigh the removal; the two removals are about -40.

## 4. Behaviour a reviewer must know

- A setup run converts and writes a backup on any change to a converted file's `$comment` too (one rule: any write by conversion is backed up).
- A YAML operation with `policy.fallbackExecutors` now fails the workflow-operations doctor row (none in the repo declares it).
- `architecture-manifest.json` lists the new module as use-case; the registry doc lists both rows.

## 5. Verification

- 90 files under `test/setup`, `test/seat-binding`, `test/runner/execution` each run alone: all pass except `active-release-drift-check.test` (1 fail, needs a release workspace build; red on the base). Also run alone and green: the dispatch, enrich, contract, registrations, provider-capacity, run-provider-failover, architecture and checks files.
- `assignment-dispatch.test`: 3 failures (`M12 lock`, `genuinely mutating assignment`, `read-only ... gains a commit`) reproduce on the track's main checkout without these changes (git evidence and an installed release host speaking protocol 2); no failure is from this work.
- No Rust change, so no cargo test. Full `npm test` not run. GitNexus not used (stale index).

## 6. Concerns

- The two big-lead changes landed in one commit pair with the shared file `assignment-runner.mjs` in the first.
- `fgos setup` now needs the host binary (one ladder exec) whenever the project has a runner section.
