# Main import re-sync — scope blocker

Status: **blocked; stopped at the brief's exact writable boundary**. No completion, gate acceptance or authority cutover claimed.

Input HEAD: `dac65ad8ba135e8acf33438c8790efc222133e37`.
Read first: [brief](../w3-import2-brief.md), execution plan §§1–2, owner answers L13, W1 review notes and carries/resync receipts. Machine evidence: [receipt.json](receipt.json).

## Required scope correction

`needsWrites: ["docs/reading-map.md"]`

Merge `bc5589ed7` changes three navigation entries in `docs/specs/reading-map.md`: Terminal Control, Git and YAML Document. Their existing detailed-navigation holder is **`docs/reading-map.md` section 5, lines 185–187**, outside the exact writable list. It still says the Node YAML door is unimplemented, lacks the revised Terminal setup/check description and lacks the new Git remote/doctor description. The source now records the native YAML door as complete and RUL108 superseding RUL101.

The receipt records both whole-file hashes and all three complete source/successor lines. Updating only ledger digests would not carry this content. Duplicating those entries under `docs/platform/README.md` would create another holder rather than update the existing one. Neither workaround was used. No out-of-scope file was written. The brief explicitly requires stopping and reporting `needsWrites` when another path is needed.

## Work performed before stopping

- Acknowledged the assignment atomically; inspected the clean initial tree, merge parents and imported legacy diffs.
- Ran the unchanged owning `late-areas/scan-legacy-drift.mjs` at HEAD, writing its permitted `legacy-drift.json` output.
- Replayed `--check`: exit **0**; `git diff --check`: exit **0**.

| Source with missing carriage | Missing current/changed units |
|---|---:|
| component-boundary advisory | 2 |
| distribution | 9 |
| Observe | 2 |
| reading-map | 2 |
| runner | 2 |
| **Total** | **17** |

The advisory's two units are not new legacy-source edits in this import; its existing candidate binding was invalidated by candidate changes. All 17 remain explicitly unproven. No fake binding, disposition or zero-missing claim was added.

## Not completed / resume

After the scope is corrected, resume the whole brief: merge/conflict/census accounting; Step 0 content-and-neighbour binding checks for every incoming candidate; incoming-path obligations; all legacy carries and fresh rebinds; zero-missing replay; evidence relocation `--before`; ratchet accounting and its owning test. None of these uncompleted checks is represented as passing.

Only the permitted drift output and this receipt pair changed. No repository Git write, fgOS CLI/lifecycle call, broad test, native bootstrap, `.fgos`/secret inspection, pair accounting, owner-answer/progress/gate-status edit or preview service occurred. `impact-analysis: degraded/unqueried` under the no-CLI boundary; no production symbol edited. No focused tests ran before the stop. Report filenames are brief-prescribed.
