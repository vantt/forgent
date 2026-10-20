# Step 5 seam 5 — batch 5: review closure and judgment throughput (Doer brief)

Status: Lead brief for the next Doer turn (records only).

You are Doer for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. Batch 4 (31791c7eb) closed 42 root-neutral and 30 judgment files; 404 remain. Five independent window reviews of the 33 judgment files closed so far are in review-a38-step-05-s5-j-p0{1..5}.md (most findings are admission-only labels). All rules of the seam 5 briefs (R17–R23, L12-76..L12-78) still apply. Same write scope and prohibitions as before: records only under plans/260925-documentation-authority-unification/reports/phase-08/, never a git write, never the fgos CLI, never the .fgos directory or the secrets env file, python -B, scratch /tmp/fgos-work/, tests with env -u CLAUDE_CODE_SESSION_ID, progress.md early and at the end.

## Part A — review closure (record as L12-80; verify each against the pinned source first)

- p05 ok. p02: App.test.tsx reference-000201 comment -> docs/ui-spec/screens/S01-sign-in.md: docs/ui-spec is RETAINED (authoring request seam 6: retain unless a separately reviewed contract requires a change); move-set entries under docs/ui-spec are Phase 6 proposals, kept in the move set only to keep neutrality proofs conservative. Disposition: ADMIT/preserve with witness "docs/ui-spec retained (seam 6 rule)". Comment pointers into docs/history in batch-4 files: ADMIT/preserve per R16 (label-level, R10). architecture.test.mjs L2 comment vs L24 read: align per R16.
- p03: all preserve; admission-only (R10): D1 in-memory fixture strings -> reject uniformly (R5); D2 doc-link-pass 032663/032664/032666 one admission; D3 comment pointers 003953/003954 (docs/history) and 003959/003960 (docs/architect, tree-retires witness) admit/preserve. Q1 tmp-root path joins -> reject (R21). Q2 docs/architect/doing-coordination-redesign.md comment pointers: docs/platform/proposals/** carriers are self-declared non-canonical (L12-74 p20 precedent) -> preserve as dated provenance, reason names the carrier.
- p01 dead-vocabulary-guard: D1 dynamic-023891 (roots array incl docs/specs) -> ADMIT/park with the same gateway-root blocker as 004371/023892 (R7; disposition change). D2 reference-004372 test title: admit/preserve (test titles are baseline keys; it moves only with the parked P5 scan patch, record that dependency in reason). 004374 docs/history comment admit (R16). Diagnostics printing ${rel} from fixed doc-root file lists (023831/023880/023897/023899/023869) -> admit/preserve (R16, label-level). 004371 resolverWitness treeRetires true.
- p04: dispatch-worker-session reference-004380 comment -> docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/: identical live holder under docs/platform/ -> ADMIT/PATCH (R8; source-only forward/inverse diff). Q1 candidate decision holders (docs/platform/<area>/decisions/h-*.md, promoted in Phase 9; L12-30(3)) ARE valid patch targets; docs/platform/proposals/** self-declared non-canonical carriers are NOT (L12-74). Q2 decisions-corpus-retired 004035 real read of root docs/architecture-map.md: Phase 6 draft proposes moving it to docs/platform/architecture-map.md which lacks ### 0010/0015/0017 -> change preserve to PARK with that exact dependency (retention decision + heading carriage), Step 7 composition. Notes: domain-fields.test.mjs L1-3 retired decision citation -> add item + successorNote; 018736 0000-index.md probe successorNote (p07 precedent); fix copied reason texts; docs/history comment pointers admit uniformly (R16).

Then sweep ALL seam 5 judgment records for the same classes (R16 comment pointers into docs/history admitted uniformly; in-memory fixture strings and tmp-root joins rejected; one admission per call/expression; successorNote on retired-decision basenames) and fix every hit.

## Part B — continue authoring

Close at least 40 judgment files this turn in the existing priority order (more if they fit), applying R21 neutrality first to any newly provable file. Per file: full records, receipts, passage-specific park dependencies, patch specs with co-cut grep evidence; replay only for patch files (R22).

## Close

Checker 0 failures, all probes reject; update continuation and the review list (list the judgment files changed or added this turn separately so the Lead reviews only those).

Final message: FIRST line a conventional commit subject (at most 100 chars, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em): review items closed, sweep hits, judgment files closed, neutral files closed, remaining, checker/probes.
