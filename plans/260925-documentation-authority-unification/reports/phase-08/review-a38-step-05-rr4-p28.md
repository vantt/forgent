# Review a38 step-05 rr4 p28

Scope: 5 source files, no diffs, no parks. Counts: 1 admitted literal (preserve), 143 rejected dynamic tuples (preserve) = 144 items reviewed (test-select-promote 21, test-select-run-plan 3, test-select 59, test-timing 44, verify-fanout-overlap 7 incl. the literal; 21+3+59+44+7 = 134... see per-file counts below).

Note on count: per-file item counts from payload: promote 21, run-plan 3, select 59, timing 44, fanout 7 = 134 items (133 dynamic REJECT + 1 literal ADMIT).

## Per-file

- scripts/test-select-promote.mjs: ok, 21 items. All REJECT: message formatting of counts/rates/set (caller-data), `directTests || []` guards, regex template builders, fixed `test/test-ownership.mjs` and `ledger.json` resolves (test manifest and ledger data, not documents). No document path read.
- scripts/test-select-run-plan.mjs: ok, 3 items. Error/info message formatting and `path.resolve(cwd, f)` over plan.selectedFiles (test files to run). All truthful rejects.
- scripts/test-select.mjs: ok, 59 items. Rule patterns/direct/boundary tests resolve against repoRoot are test-ownership paths (test files / source patterns), not docs; messages print caller data with no fixed doc root; finding `path:` fields, root defaults, execPath, `global:false`, accumulators, `join('/')` all R5 rejects. No docs literal in the file (only prose "CONTEXT.md" term at L377, not a path operation, not itemized, fine).
- scripts/test-timing.mjs: ok, 44 items. tmpdir/log-dir/junit/stdout paths, run-tests.mjs script path, argv `--log-dir` parsing, directory accumulators, count message: all non-document. L233 comment mentions `plans/reports/artifacts/...junit.xml` as prose, not an item; plans/ is not a legacy docs root.
- scripts/verify-fanout-overlap.mjs: ok, 7 items. Literal 003635 `docs/history/execution-fanout/CONTEXT.md` (L2 header comment): ADMIT/preserve is right, docs/history is a retained convention (existsAtPin true, not docs/specs|architect), no relocation claimed. Dynamic: git-common-dir probe (L32), repoRoot (L40), `.fgos` event-store path (L41, rejected as state-event-store, correct), PASS message formatting (L148-149, counts/ids/ms). L140 `.fgos/events.jsonl` text is state, not a doc.

## OUTCOME defects
None.

## Record-text notes
- dynamic-009110 (verify-fanout-overlap L32, `git rev-parse --git-common-dir`) is labelled `scalar-pass-through`; the R5 category `.git` probe would be the true use. Label only.
- dynamic-008999/009000 (test-select-promote L452-453) carry `scalar-pass-through` for a fixed literal `plans/reports/promotion-ledger.json` and its dirname; it is really a fixed-path JSON report write (data ledger, not a document). Label is imprecise, outcome right (see Lead question).
- Several `config-or-metadata` / `scalar-pass-through` pairs on the same line are consistent in outcome; fine.
- pathOperand is null for all rejects and nonDocumentUse is set for all; no successorNote needed (no retired decision citation in these files).

## Lead-judgment questions
- test-select-promote L452-455 writes `plans/reports/promotion-ledger.json` (fixed plans/ path, mkdir + write). It is rejected as non-document. If the census treats plans/reports outputs as an admitted document family (as p08 treats fixed plans/ gate inputs), this would need ADMIT/preserve. The JSON is machine data and plans/ is not a retiring root, so I judge reject acceptable. Lead to confirm the plans/ boundary.

## Counts
Files 5; items 134 (1 ADMIT preserve, 133 REJECT preserve); parks 0; diffs 0; OUTCOME defects 0.
