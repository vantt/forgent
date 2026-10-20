# Step 5 seam 5 — real-file tests and byte-exact prompt goldens (Doer brief)

Status: Lead brief for the next Doer turn (records only).

You are Doer for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. Seams 1–4 are authored and reviewed. Author seam 5 now, applying from the FIRST pass every rule the seam 1–4 reviews established, so the review finds no systemic defects: owner-answers L12-58, L12-60, L12-62, L12-69, L12-71, L12-72 (R1–R9) and L12-74 (R10–R16), and the current Step 5 checker rules a–e, R11, R12. Read step-05-authoring-request.md seam 5, step-05-preparation.md, step-05-authoring-batches.json, step-05-population-*.jsonl, and the seam 4 records/checker as the schema and convention reference.

This turn runs under fgos run: you only write files; the runner commits them; never run a git write. RECORDS ONLY (L12-58): never edit code, docs/**, README.md, AGENTS.md, CLAUDE.md, core/**, domains/**, .agents/**, plugins/**, apps/**, src/**, bin/**, packages/**, test/**, code under scripts/, skills, the switchboard, gates, generators, tests or baselines; no build, no process start, no cargo. Do not read the secrets env file, do not touch the .fgos directory. Never run the fgos CLI. Write only under plans/260925-documentation-authority-unification/reports/phase-08/, plus (task 0 only) plans/260925-documentation-authority-unification/ledger/decisions/ and the data file scripts/check-legacy-docs-ratchet.exceptions.json. PYTHONDONTWRITEBYTECODE=1, python -B. Scratch /tmp/fgos-work/. Tests with env -u CLAUDE_CODE_SESSION_ID. Write progress.md early and before you finish.

## Seam 5 scope (from the authoring request)

Real-file tests and byte-exact prompt goldens. Source prompt pointers and test/runner/prompt-templates.test.mjs (about 198/215 cases) are one atomic patch unit; preserved recorded outcomes require source pin/mode/hash provenance. No assertion weakening, no test-only bypass. A test that reads a real document file is a behavioral consumer; a test fixture string that only names a path is not, unless an assertion compares it to emitted output.

## Must-hold rules (summary; the owner-answers entries are authoritative)

- Admission: admit only operands that read, write, probe, emit or compare a document path under a census root (R6, R16); reject with a true nonDocumentUse otherwise (R5); plans/** is not a census root (R11); bare basenames are outside the census.
- Disposition: patch only to a verified live holder (exact anchor, whole-file diff over pinned bytes, inverse rollback, co-cut test grep evidence); park only with a passage-specific dependency (R4, R12 — no templated blockers); preserve with a true witness (no "retained" witness for docs/specs or docs/architect targets; dated provenance says "tree retires"); retired decision citations carry a successorNote (R8); generated copies render-join their source owner (R2).
- One outcome per same passage/expression (R7, R16); inherit Step 3/4 dispositions for joined ids; carry Step 3/4 parks with their original specific blockers.
- A golden test asserting a prompt string and the source prompt it mirrors form one atomic patch unit: the source patch and the golden patch land together, both in the cutover spec and the receipt.

## Work

0. Merge accounting first, exactly in the L12-65..L12-73 format, recorded as L12-75: Lead merged LOCAL main at e83ca379c (main commits: git log --oneline e83ca379c^1..e83ca379c^2; docs/backlog.md and the program board). Confirm the ratchet exits 0 (refresh an exception only if required) and its test passes; Step 0 binding check on changed candidate files; list Step 3/4/5 records whose consumer file main changed. docs/backlog.md carries Step 3 and Step 5 slots: state whether any pinned currentPassage moved (records stay pinned; drift is Step 7 work per L12-58(1)).
1. Author seam 5 in full in the record schema, one JSONL per sub-batch under step-05-records/ (e.g. tests-real-file.jsonl, tests-prompt-goldens.jsonl), with the per-seam parity receipt and cutover specs.
2. Run the full Step 5 checker (0 failures) and every probe (all reject).
3. Write step-05-seam5-review-list.json (source files and generated files of seam 5) so the Lead packs window reviews with step-05-seam4-window-review/pack.py; report measured counts (files, references, admitted, rejected, parks, patches, preserves) and elapsed time.

Final message: FIRST line a conventional commit subject (at most 100 chars, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
