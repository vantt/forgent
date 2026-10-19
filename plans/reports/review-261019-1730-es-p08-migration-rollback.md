# Review: Event Store phase 08 (legacy migration and rollback, dormant)

Diff reviewed: `27a180c8d..10bf3e375` in `.claude/worktrees/es-p08-review`. I read the phase file, the lead report, the spec delta, all changed source and tests, and Git 05's `scoped_commit.rs` and `scoped-commit.mjs` on `git/p05-commit-sync` (tip ea616e0b6) to check the adapter against the real interface. This was a read-only review. I ran no builds or tests, because they write `target/` and fixtures.

**Verdict:** I found no Critical findings. There are three High findings: two in the cutover adapter's failure and retry handling, and one in doctor semantics. All three must be fixed before the Git 05 gate and the phase 09 registration. The import core is sound: determinism, byte preservation, the seal, ensure-clean under event-seal, and parity through an independent reader.

## What holds

- **Import determinism and byte preservation.** The legacy commit uses a fixed identity and date 0 with no parent. `mktree` sorts the entries. Work names lose only `.fgos/`, and porting lives under `porting/<path>`. The test checks the bytes with `git show`, checks the parentless count, and checks that an equal ref is reused while a differing ref is refused.
- **The seal authenticates the data tree.** `verify_legacy_tree` compares every recursive path, mode and OID of the commit, without `seal.json`, against `treeOfFgosEvents`. The listing is `ls-tree -r -t`, so an extra blob or tree is caught.
- **Ordering inside the import.** The import validates the records, HEAD and cleanliness under event-seal before Publication. The seal guard is dropped on return, before `scoped.commit`.
- **Parity.** The legacy fold uses the JS reader (`readAllEventsFromDir`) over the same bytes, while the imported side uses Rust order. Parity compares entity, serialization and revision against the baseline and the anchored cache. Non-check runs repeat parity through the published reader.
- **Hygiene.** The adapter starts no Git subprocess. There is no new config, the architecture manifest has the new entries, CHANGELOG has a line, and nothing is mocked or switched by an environment variable.
- **Check-only mode.** It writes no objects, ref or commit. The three setup fixes still run in check mode, which plan item 1 requires and the spec documents.

## Critical

None.

## High

**H1. The adapter restores the work tree on uncertain Git outcomes.**
- Where: `src/verbs/events/migrate.mjs:120-131`.
- Problem: the catch block restores whenever `readLegacyFromHead` shows HEAD unchanged, whatever the error class. On Git 05 (`packages/git/rust/src/scoped_commit.rs` on `git/p05-commit-sync`), HEAD stays at the baseline for these recovery-class errors:
  - `commit-effect-unknown`: the commit exited with success, but HEAD did not move.
  - `commit-unstage-recovery-required`: the `reset` failed, so the index still holds staged deletions.
  - `commit-attempt-recovery-required`: an earlier attempt has no settled outcome.
- Effect: the adapter writes into a work tree that Git's recovery owns. In the unstage case, it leaves staged deletions next to restored files. This contradicts "uncertain outcomes left to Git".
- Fix: restore only after Git's ordinary refusals, which are the pre-attempt `failure(...)` codes and `commit-rejected` after Git's own snapshot restore. Discriminate on the error code or class. On any recovery-class error, leave the tree untouched and surface `operationId`.

**H2. A rejected cutover cannot be retried.**
- Where: `migrate.mjs:72` and `packages/event-store/rust/src/legacy_import.rs:315-335`.
- Problem: the operation id `event-store-cutover-<fromCommit>` is deterministic. After a hook rejection, Git 05 records `CommitRejected`, and its code says "Retrying uses a new id after a fresh preflight". A rerun with the same id hits `known_id` and gets `commit-attempt-recovery-required`, and H1 then restores the tree. Moving HEAD does not help: the computed import differs from the existing `refs/fgos/legacy`, so the import refuses with `EventStoreLegacyMismatch`, and the unfenced read path refuses too ("unfenced import does not match HEAD").
- The same wedge follows spec §18's "before step 5 is pushed, rollback is reverting the commit", which leaves an unfenced legacy ref behind.
- The only way out is a manual `git update-ref -d refs/fgos/legacy`, and nothing documents it.
- Fix:
  - Use a per-attempt id with a stable prefix, for example `event-store-cutover-<fromCommit>-<attempt>`, chosen after inspecting the WAL for earlier settled-rejected attempts.
  - Give an unfenced stale legacy ref an explicit owned path. Either migrate replaces it under event-seal with CAS from the observed OID when no fence exists, or the spec and runbook name the recovery step.
  - Add a test for rejected-then-retried.

**H3. The legacy-layout doctor fails before cutover and in repositories that never had legacy data.**
- Where: `legacy_import.rs:434-488`. The test at `test/event-store/migrate.test.mjs:114-118` codifies the behaviour.
- Problem: with no fence, it always pushes "tracked legacy fence missing" and lists every tracked file. Spec §21 (line 605) scopes this check to "after cutover". After phase 09 registers it, every not-yet-migrated project and every fresh project would fail doctor.
- Fix:
  - No fence and no retired paths: pass.
  - Retired paths and no fence: warn `event-store-migration-required` and name the command.
  - Fail only when a fence is present and something disagrees, or when retired paths or `.fgos/events/` coexist with a fence.

## Medium

**M1. Unfenced reads trust a legacy ref over HEAD.**
- Where: `packages/event-store/rust/src/read.rs`, unfenced branch of `read_legacy`.
- Problem: plan item 7 says reads before migration come from HEAD. The new branch reads `refs.values().next()`, the local ref or any mirror, whenever its seal's `fromCommit` equals HEAD. It checks only the seal's internal consistency. It does not check that the content equals HEAD's tracked files, or that local and mirror refs agree. Previously this branch refused any unfenced legacy ref.
- Fix: unfenced reads always come from HEAD. Migrate's post-publication parity reads the ref explicitly, or compares the ref's data-tree OID with the tree computed from HEAD. Require every listed ref to be equal, for example with `validate_refs(Some(first), ...)`.

**M2. The full-tree inventory runs on hot paths.**
- Problem: `inventory` pages `list_tree(..., b"", ..., 1024)`. Each page re-runs `git ls-tree -r -t --full-tree` over the whole repository (`packages/git/rust/src/driver.rs:1873-1883`). HEAD has 11,355 entries, so that is about 12 full listings plus one blob read per legacy file.
- Where it runs: at every `open_store` (`write_readiness`), every unfenced `read()`, the doctor, and twice per migrate run. Before this change, the read listed only `.fgos/` and the porting prefix.
- Fix: use `max_entries` 100_000 (the driver's maximum) for one page. Restrict admission and read to `.fgos/` plus the discovered porting path. Keep the whole-tree porting discovery only in migrate.

**M3. The rollback export's porting layout is not restorable as written.**
- Where: `packages/event-store/rust/src/export.rs`, around lines 207-230, with `src/verbs/events/export.mjs`.
- Problem: v4 porting records go to `porting/events.jsonl`, but the historical log is written at `porting/docs/distillery/state/porting/events.jsonl`. An old release reads only the original path. The parity report folds "nested logs, then root records", but the exported files do not contain that concatenation. Copying the export back loses the v4 porting moves without the report showing it.
- Fix: when exactly one historical porting log exists, append the v4 porting lines to it. This is already done when the root log is the historical one. The exported files then are the restorable layout, and parity measures them. Document the mapping from `porting/<path>` back to the original path in the §18 rollback steps.

**M4. The gated real-hook test can stay skipped forever.**
- Where: `test/event-store/migrate-cutover-grant.test.mjs:34`, which skips dynamically when quiesce is not clean, and `:18-23`, where the check test passes through its refusal branch.
- Problem: in the lead's environment the scan always refuses. So even after Git 05 merges, the real-hook proof never runs, and the suite stays green. The self-enabling condition on `createGitScopedCommit` is correct (no mock, no environment switch). The quiesce escape defeats it.
- Fix: once the Git 05 export exists, make a quiesce refusal a failure that names the host requirement, not a skip. Alternatively, put "zero skips in migrate-cutover-grant" into the cutover gate checklist.

## Low

- **L1.** `migrate.mjs:118` accepts `status === 'unchanged'` as success although nothing was committed and the files were already deleted. It is unreachable today because of the fence guard, but becomes reachable when that guard is lifted. Require `committed` and a moved HEAD.
- **L2.** `--check` does not detect an existing, differing `refs/fgos/legacy`, and does not report the would-be legacy OID. Plan item 6 says "import is computed". A check that passes can therefore precede a refused real run. Read the ref in check mode and report reuse or mismatch.
- **L3.** `migrate.mjs:66-70` runs the quiesce scan and the three setup fixes before checking that cwd is the trusted main root. Check main first.
- **L4.** `migrate.mjs:22-24, 90-92`: when the events `merge=union` line is the only line, `.gitattributes` is written empty instead of deleted. The plan keeps the file only when other lines remain. The `includes('events')` heuristic, shared with the Rust doctor, can also strip an unrelated union line.
- **L5.** `src/setup/event-store-checks.mjs:56` calls `prepareStore` without `config`. That gives the default remote `origin` and a second prepared store. Pass `config: { eventStore: config }`, as `status()` does.
- **L6.** In `legacy_import.rs:460`, `verify_legacy_tree(...)?` turns a missing legacy object into a raw error instead of the "legacy ref missing or differs" problem. Also, the fence's `sealDigest` and `fromCommit` are never compared with the pinned commit's seal.
- **L7.** A crash between `compare_and_swap` and `release_pin_and_compact` (`legacy_import.rs:318-327`) leaves the WAL pin in place. The reuse path does not release it. Confirm that Git recovery compacts it, or release it on reuse.
- **L8.** `export::allowed` (`export.rs:130-138`) is relaxed to any segment without control characters or backslashes, and export writes those names to disk. Consider refusing `:` and Windows-reserved names, given the Windows lane.

## Layering and configuration

No violations found. `migrate.mjs` reaches Git only through `src/git/index.mjs`. The Rust module uses only the Inspect and Publication ports. No new configuration key, environment variable or infrastructure dependency was added; `remote` comes from the existing Event Store config.

## Unresolved questions

- Does the coordinator want H2's stale-legacy-ref recovery to be an owned migrate behaviour, or a documented manual step in the §18 runbook?
- Should M1's change, reading from HEAD when unfenced, wait for an explicit "read the published import" option on the reader, or should migrate compare data-tree OIDs instead?
