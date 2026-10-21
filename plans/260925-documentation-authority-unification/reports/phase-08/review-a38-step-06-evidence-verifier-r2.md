# Review A38 Step 6, re-review round 2: evidence relocation verifier

This round reviews the rework commit `636dfefef`, whose parent is `38bddcdd7`. Both are in the read-only worktree `/home/vantt/projects/forgentX-s8-review`, which has no untracked or ignored files. The rework does not change `docs/**`. The manifest was regenerated at `sourceCommit 38bddcdd7`.

## Verdict: ok

Every High, Medium and Low finding from round 1 is fixed or reduced to a documented residual. I checked each one with my own reproduction, not the Doer's tests.

The rework introduces one new Medium defect, N1: the consumer-table drift check is too coarse. It does not make anything false-green on the current tree. It must be fixed, or at least named in the receipt's `verificationLimits`, before Phase 9 readiness. It does not block this step.

## Commands run

- **Live `--before`:** exit 0, 867 entries, 0 violations.
- **Test file:** exit 0, 40/40 tests pass (14 top-level tests).
- **Live `--after --json`:** exit 1 with 907 violations. 867 are `remaining-legacy-file` and 40 are `maintained-text-legacy-mention`. There are no read errors.
- **Independent manifest recompute** (`recompute.mjs`, same script as round 1): 0 errors.
  - 867/867 entries: sha256, bytes, git blob ids, index and filesystem modes on both sides, `after` path, relation and collection all match.
  - 12 entries have mode 100755.
  - The entries are now sorted in codepoint order (they were not in round 1).

## Status of round-1 findings

| ID | Status | Evidence |
|---|---|---|
| H1 `--after` missed directory and template mentions | **Fixed** | `legacyRoots` (`check-evidence-relocation.mjs:231-243`) now matches the `…/verification` root and each `…/verification/<collection>` prefix, with and without `docs/`. In scratch, a directory mention (`docs/architect/agent-coordination/verification/c1/`) now exits 1, and so does the template `../../architect/…/verification/<track>/x.md`. Live: all 15 of the 25 round-1 misses that are real maintained text are now flagged (the 3 `src/runner/dispatch/*` comments, the 3 dispatch test comments, `author-a-plan-loop-track.md`, the composite-reopen example, `docs/knowledge/...`, `docs/platform/proposals/visibility...`, and the 5 `docs/architect` documents). The other 10 are correctly excluded: 4 synthetic tests, 3 files under area history and 3 fixtures. Residual, unchanged: encoded or dot-segment spellings (`%2F`, `/./`) and runtime-joined path parts still get through. Policy §7 already marks dynamic references as unproven. |
| H2 hand-written history exclusion | **Fixed** | `excludedMaintainedText` (`:245-252`) calls `classifyPath(rel, constitution)` at `:250` and excludes the `history` and `evidence-payload` kinds. The other exclusions are exact or explicit, and the receipt's `classificationPolicy` lists them: the alias-table path, `CHANGELOG.md`, `archive/`, `plans/`, `.fgos/`, `test/fixtures/`, and exact rows classified `synthetic-test`. Live: none of the 23 area-history files, 7 fixtures or `CHANGELOG.md` is flagged. My own scan (`scan2.mjs`) found 0 files that are flagged but should have been excluded, and 0 real maintained files that are missed. |
| H3 no consumer regeneration in `--before` | **Partially fixed** (see N1) | `scanConsumerTable` and `verifyConsumers` (`:166-224`) scan git-tracked files under the code, test and hook roots plus the AGENTS.md, CLAUDE.md and SKILL.md files, for the legacy root and every collection name. The run fails on an unclassified hit, a `runtime-reader` row, a changed match set, a stale row or a read error. In scratch, a new reader file (case K3) fails with `unclassified-consumer`. My independent rebuild (`consumers.mjs`) gives 44 rows, the same paths and identical match sets as the committed table. No tracked code outside the scanned roots hits. None of the 11 `test-reference` rows contains `verification/` (no payload reads). |
| M1 unlisted legacy payload accepted | **Fixed** | `:345`. In scratch (case A), a tracked legacy-only payload exits 1 with `unlisted-payload` on the legacy side. |
| M2 false `classifyPath` claim | **Fixed** | Every call site cited in the receipt is real (each line checked): `normalizePosix` at :44 and :267; `computeSha256` at :299 and :315; `isEvidenceMirrorPath` at :56, :116, :184 and :288; `classifyPath` at :250; shared `isMainModule` at :425. The local copy of `isMainModule` is gone. There are no unused imports. L12-93 and progress.md now say the original claim was false. |
| M3 test gaps | **Fixed** | The tests now cover: generator determinism, codepoint order and the moved-payload case; changed bytes, a missing file and an unlisted payload on both sides; filesystem mode, git mode, blob and symlink drift; every `--after` integrity branch; read errors; consumer-table enforcement; the schema; the relative manifest base; and CLI exit 2 without a stack trace. |
| M4 receipt said no blockers | **Fixed** | `blockers` now lists `standing-verifier-run` and `retirement-gate-evidence-digests`. The broad counts reproduce with the policy's own method (excluding the two `verification/README.md` files): 214 total, 197 legacy, 185 full path, 21 platform; groups docs/architect 23 and test 15. The receipt's `method` string does not mention the README exclusion; without it I get 215/…/22 and docs/architect 24 (see L-b). |
| R1 manifest exclusion base | **Fixed** | `:267` resolves against `repoRoot`. Scratch case S (relative manifest inside the repo, run from another directory) passes. |
| R2 broad exclusions, swallowed read errors | **Fixed** | A file named `alias-table-notes.md` and a file under `docs/guide/target/` are now flagged (cases D and L). Read errors are now violations (`:277-279`, `:189-191`). |
| R3 filesystem walk | **Fixed** | All scans use `git ls-files -z`. |
| R4 validation and exit codes | **Fixed** | `validateManifest` (`:92-142`) enforces exact keys, safe paths, payload shape, the mirror path, sha256 and blob format, the mode enum, the relation, uniqueness and codepoint order. In scratch, a bad version, an escaping path, both modes at once, an unknown flag and a missing consumer table each exit 2 with an `ERROR:` line and no stack trace. |
| R5 git mode, blob and symlink | **Fixed** | `verifyFile` (`:306-330`) checks the git index mode and blob and refuses symlinks. Scratch case H exits 1 with `symlink-payload`. |
| L1 locale sort | **Fixed** | `codepointCompare` is used everywhere, and the manifest is in codepoint order. |
| L2 raw `git` spawns | **Not fixed (informational, as before)** | `:29-35` still spawns `git` directly, the same as the sibling `check-doc-*` scripts. Moving to Inspect remains a family-wide item. |

## The receipt's live `--after` set ("867 + 40")

The receipt is accurate: 867 `remaining-legacy-file` violations plus the same 40 paths listed in `afterComparison.remainingRepointOrDeleteSet`. None of the 40 is history or a fixture:

- **20 delete targets:** non-payload legacy documents under `docs/architect/**`, which policy §3 says are deleted at cutover.
- **1 rebaseline target:** `scripts/check-legacy-docs-ratchet.baseline.json`, a gate record retired or rebaselined at cutover per policy §6.3.
- **19 real repoint targets:**
  - 9 under `docs/how-to/**` (`author-a-plan-loop-track`, `use-fgos-architecture-panel` and 7 architecture-advisory-panel examples)
  - 1 under `docs/knowledge/**`
  - 3 platform documents: `proposals/step-09...`, `proposals/visibility...` and `system-architecture/.../architecture-intent.md`
  - 3 `src/runner/dispatch/*` comments
  - 3 `test/runner/dispatch-*` test comments

The wording around these numbers is slightly off (L-a below), but the counts and the path list are right.

## New defects from the rework

### N1: drift check compares match sets only (Medium)

- **Location:** `verifyConsumers`, `check-evidence-relocation.mjs:214-216`.
- **Problem:** drift is detected only when a file's set of match tokens changes. A file already classified with `legacy-root` can gain a real runtime read of the legacy copy without any change to that set.
- **Scratch reproduction (case K2):**
  1. A classified `code-comment` row exists for `src/r.mjs`, with matches `collection:c1` and `legacy-root`.
  2. Append `fs.readFileSync("docs/platform/agent-coordination/verification/c1/p.md")` to that file.
  3. `--before` still exits 0.
- **Live exposure:** the same applies to the six live rows that already carry `legacy-root` in code and tests (`src/runner/dispatch/{config,trust-store,worker-home}.mjs` and `test/runner/dispatch-{executor-profile,worker-home,worker-session}.test.mjs`), and to every collection-only row.
- **Why it matters:** this is exactly the "newly found runtime reader" stop condition in Step 6. A `synthetic-test` row also keeps its `--after` exemption forever once a real legacy link is added to it.
- **Fix:** record a digest or count of the matching lines for each row (for example a sha256 of the sorted lines that contain a match) and report `consumer-drift` when it changes. At minimum, name this limit in the receipt's `verificationLimits` before Phase 9.

### Minor record inaccuracies (Low, non-blocking)

- **L-a:** L12-95 and progress.md say the rework "catches the 25 missed legacy-form files while excluding 28". In fact it catches 15 of the 25 and correctly excludes the other 10 (synthetic tests, area history, fixtures). The resulting 40 is correct.
- **L-b:** the receipt's `broadConsumerMeasurements.method` leaves out the exclusion of the two `verification/README.md` files. Without it the count is not 214/21; `docs/architect/agent-coordination/verification/README.md` is the extra platform-form file.
- **L-c:** L12-93 was rewritten in place. The original false text and counts (9/9, 57, the four-primitive claim) were replaced with a corrected paragraph that mentions the earlier false claim. The brief asked to state the correction without deleting history. The original numbers now survive only in git.

### Informational (by design, not defects)

- Untracked files are ignored, as round-1 R3 asked. An untracked platform payload (case A2) and an untracked maintained mention (case U) both pass. Neither can land without becoming tracked, at which point they are caught.
- A tracked file deleted from the worktree but not staged gives a `maintained-text-read-error`, which fails closed (case W).
- A reader that builds the platform root with a dynamic collection name is not detected (case K4). That reader does not use the legacy copy, so this is outside the policy §4.6 purpose.

## Scratch artifacts

Scripts: `recompute.mjs`, `scan2.mjs`, `consumers.mjs`, `probe3.sh`, `probe4.sh`; live output in `after-live.json`. The fixture repositories (`fx3`) were removed.

Status: DONE_WITH_CONCERNS
Summary: The rework fixes every round-1 High/Medium/Low except the informational raw-git note, and live `--before` passes with a consumer table that reproduces exactly (44 rows). The receipt's 867 + 40 `--after` set is accurate and contains no history or fixture paths. One new Medium (N1): the drift check compares match sets only, so a runtime read added to an already-classified file passes `--before`; fix it or record it in `verificationLimits` before Phase 9. Three Low record-wording inaccuracies.
