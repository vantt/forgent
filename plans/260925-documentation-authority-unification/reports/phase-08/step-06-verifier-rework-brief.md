# Step 6 — verifier rework after independent review (Doer brief, code slice)

Status: Lead brief for the next Doer turn (code slice authorized under L12-92).

You are Doer for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. The independent review review-a38-step-06-evidence-verifier.md (this directory) returned REWORK on commit 00eaad96d. The manifest data is correct (867/867 recomputed); the verifier is not. Fix every High, Medium and Low finding in that report. Read it fully first, then the contract: phase-08 "Step 6" and evidence-payload-relocation-policy.md §2–§6.

Same write scope as the Step 6 brief: scripts/check-evidence-relocation.mjs, test/scripts/check-evidence-relocation.test.mjs, plans/260925-documentation-authority-unification/reports/phase-08/**. Never a git write, never the fgos CLI, never the .fgos directory or secrets; no other code, docs, gates, baselines or tests. Tests with env -u CLAUDE_CODE_SESSION_ID; scratch in the OS temp dir, cleaned up.

Required, in short (the report is authoritative):
- H1: --after must catch directory-form and template mentions of the legacy payload roots/collections, not only full file paths; prove it on the 25 currently missed files.
- H2: --after exclusions must come from the real classification door (call the existing classifier, e.g. classifyPath, and use it), covering docs/platform/<area>/history/**, <area>/reports/**, test fixtures and CHANGELOG.md per policy; no hand-written broad globs (*alias-table*, any dir named target); read errors are violations, not silently skipped. Report the live --after hit count before and after, with the remaining hits listed as the real Phase 8/9 repoint set.
- H3: --before regenerates the §4.6 consumer table (full legacy path plus collection names in code, tests and instruction files, from git-tracked files) and fails on a runtime reader or unclassified consumer; the receipt lists the table and it must reproduce.
- M1: --before fails on a legacy payload absent from the manifest.
- M2: every reuse claim must be real: for each reused primitive, cite file:line of the CALL site in the verifier. Remove any unused import. Use scripts/lib/is-main-module.mjs instead of a local copy.
- M3: tests for generateManifest determinism, changed byte in either side, every --after failure branch, unlisted legacy file, bad manifest (distinct exit code from violations, no stack trace).
- M4: receipt states real blockers (standing verifier run missing; retirement gate evidence-digests still blocked until registered in Phase 9) and reproducible counts at HEAD.
- Low: correct exclusion base path, walk git-tracked files (git ls-files) for scans, verify gitBlob, codepoint sort, validate manifest schema.
Then run live --before (must pass), the test file (must pass), and live --after (expected to fail; record the exact remaining repoint set). Record L12-95 in owner-answers.md (review closure with counts) and correct the false classifyPath claim in L12-93/progress.md/receipt (state it was corrected, do not delete history).

Final message: FIRST line a conventional commit subject (at most 100 chars, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em): findings fixed, test count, --before/--after results.
