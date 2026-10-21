# Step 7 — assembler fix: rejected-row class and output size (Doer brief)

Status: Lead brief for the next Doer turn (records tooling; non-docs).

You are Doer for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. Lead verified fdbde60fa: the assembler is deterministic (in-place rerun at 9f708a7eb is byte-identical) and conserves 46,404 rows, but two things are wrong.

Lead ruling L12-100 (record it in owner-answers.md, Lead under A42):
1. **No row is applied-safe in Phase 8.** Phase 8 changed no consumer byte (L12-9); `applied-safe` means a consumer edit already applied on the branch and must be 0 at this pin. The 36,191 rows that are REJECT + preserve are census references that are not consumers. Give them their own explicit class `rejected-not-consumer`, each carrying its non-document use or prior custody (`nonDocumentUseOrCustody` must be non-null for every such row; any null is a stop to report). The Step 7 reviewer joins every ADMIT row to the four consumer classes; REJECT rows are counted and checked separately. Keep `applied-safe` in the vocabulary (it stays 0 unless a branch edit is ever applied) and fail the assembler if an applied-safe row has no applied-edit evidence.
2. **Outputs must be compact.** fdbde60fa committed ~41 MB (matrix 33.8 MB, readiness 7.2 MB). Rows must reference their record (`record`, `recordLine`, `referenceId`, `rowId`) and not copy data the records already hold (source spans, diffs, long text). Readiness must list per-row only rows that carry a blocker, plus counts. Target: all step-07 outputs together under 6 MB; if that is impossible, say why with the measured sizes. Keep determinism and the rerun command.

Writable: plans/260925-documentation-authority-unification/reports/phase-08/** only. Never a git write except read-only git show/log/diff, never the fgos CLI, never the .fgos directory or secrets; no code, docs, tests, gates, baselines, switchboard or ledger edits. Scratch /tmp/fgos-work/; commit only final result files.

Then rerun at current HEAD, prove determinism (two runs byte-identical), update step-07-preassembly-report.md counts and add a correction line under L12-99 (do not rewrite it) pointing to L12-100.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em) with counts and sizes.
