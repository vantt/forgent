# Composition rework: GAP-05 body overlays and seven gloss lines (Doer brief, records slice)

Status: Lead brief under L12-137. It follows `reviews/w9-composition-fix-review.{md,json}` (17 resolved / 2 REWORK) of 63c3db9c6; read it first.

1. **GAP-05 `dynamic-023895` body blocks.** The move also orphans 171 body-block bindings in `ledger/decisions/s14-resync-b.json`: 162 `bindingRefresh` rows and 9 `unitCarries` rows, all with `unheaded-block-*` anchors. Their text now lives only in `docs/platform/system-architecture/history/component-boundary-source-carriage.md`, under new anchors.
   - Find them with the ledger's own resolver (`ledgerfix/bindings.py`) run on the moved tree in scratch.
   - Add one overlay per row that points at the history-file anchor with the same `textDigest`.
   - Re-resolve every binding on the moved tree, and prove that 0 moved units are left unresolved.
   - Mark the 44 lookup-only overlay rows so that G0 does not count them as separate bindings.
2. **Seven gloss lines** read badly ("the the", "rule rule", "decision the", "plan the", "Lead the"): witnesses #3 (agent-protocol:101), #9 and #15 (event-store:158, :876), #33 (git:933), #86 and #87 (process:119, :121), and #96 (terminal-control:206).
   - Reword each line in the `w8:gloss:*` specs so it reads naturally and stays true.
   - Regenerate the diffs and witnesses, and replay with `patch --fuzz=0`, forward and rollback byte-exact.
   - Show that the citation-drift scan reports 0 findings with the glosses applied.
3. **The workflow action's path** (`actions/4`): make the recorded path match the holder file it hashes (`effectivePath`), so no consumer has to special-case it.
4. Update `composition/receipt.md` with counts and the exit code of every command.

Writable (exact): plans/260925-documentation-authority-unification/reports/phase-09/composition/**, plans/260925-documentation-authority-unification/ledger/decisions/**. Do not edit docs/. No pair accounting. Never a git write (the runner commits), never the fgos CLI, never .fgos/ or secrets, never code or tests, never scripts/run-tests.mjs or npm test (single test files are allowed with `env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN=<releasePath>/bin/fgos node --test <file>`). Always `python3 -B`. Scratch /tmp/fgos-work/w9-comp-rework/ only.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
