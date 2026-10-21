# Step 6 — verifier consumer-drift fix after re-review (Doer brief, code slice)

Status: Lead brief for the next Doer turn (code slice authorized under L12-92).

You are Doer for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. The bounded re-review review-a38-step-06-evidence-verifier-r2.md (this directory) returned ok on 636dfefef with one new Medium (N1) and two Low record slips. Read that report fully first. Fix all of them; nothing else.

Write scope: scripts/check-evidence-relocation.mjs, test/scripts/check-evidence-relocation.test.mjs, plans/260925-documentation-authority-unification/reports/phase-08/** (only step-06-evidence-consumer-table.json, step-06-evidence-receipt.json, owner-answers.md, progress.md; nothing else). Never a git write, never the fgos CLI, never the .fgos directory or secrets; no other code, docs, gates, baselines or tests. Tests with env -u CLAUDE_CODE_SESSION_ID; scratch in the OS temp dir, cleaned up.

Required:
- N1: each consumer-table row records a content digest of its matching lines (sha256 over the sorted, exact lines of the file that contain any match token; name the field e.g. `matchLinesSha256`). `--before` reports `consumer-drift` when the regenerated digest differs from the table. Regenerate the committed consumer table with the new field (44 rows expected; paths and match sets must stay identical). Add one owning test that reproduces the re-review's case K2 (a classified row gains a real legacy read without changing its match set → `--before` exits 1 with `consumer-drift`), extending the existing consumer-table test rather than duplicating cases. Keep the schema validation strict for the new field.
- L-a: in owner-answers.md L12-95 and progress (wherever "25" is claimed caught), state the truth: 15 of the 25 caught, the other 10 correctly excluded (4 synthetic tests, 3 area-history files, 3 fixtures); the 40 result is unchanged. Use an appended correction line, never rewrite history in place.
- L-b: the receipt's broadConsumerMeasurements.method names the exclusion of the two verification/README.md files (214/197/185/21; docs/architect 23; without the exclusion 215/…/22 and 24).
- L12-93 was rewritten in place by the previous turn: restore its original wording where the git history shows it changed and add a separate dated correction note pointing to L12-95 instead (`git log -p` on owner-answers.md is read-only and allowed).
- Record L12-97 in owner-answers.md: N1 closure with the digest field, test count, live `--before` result (must pass, 867 entries, 0 violations, 44 rows) and live `--after` result (expected exit 1, 867 + 40 unchanged); update the receipt's verificationLimits/proofs accordingly.

Then run live --before (must pass), the test file (must pass), and live --after (expected fail, same 867 + 40).

Final message: FIRST line a conventional commit subject (at most 100 chars, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em): fix, test count, --before/--after results.
