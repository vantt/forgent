# Step 5 seam 5 — batch 4: root-anchored neutrality and judgment throughput (Doer brief)

Status: Lead brief for the next Doer turn (records only).

You are Doer for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. Batch 3 (bae464fdb) closed 194 neutral files; 476 remain: 103 literal/prefix-context, 72 constant/import-context and 301 open-constructor/template cases, and only one judgment file was authored. All rules of the seam 5 briefs (R17–R20, L12-76, L12-77) still apply, plus the rulings below. Same write scope and prohibitions as before: records only under plans/260925-documentation-authority-unification/reports/phase-08/, never a git write, never the fgos CLI, never the .fgos directory or the secrets env file, python -B, scratch /tmp/fgos-work/, tests with env -u CLAUDE_CODE_SESSION_ID, progress.md early and at the end.

## Lead rulings (record as L12-78 with your counts)

- R21 Root-anchored neutrality: an open constructor or template is cutover-neutral when its base operand is proved to be a non-document root: os.tmpdir()/mkdtemp results and their descendants, fixture or scratch directories created by the test, test/** and fixture roots, .fgos/** state, node_modules, target/cargo dirs, home/config dirs, or a caller value that the same file only ever binds to one of these. Trace path constants across in-repo modules (named, namespace and CommonJS imports of repo files; Rust const/static in the same crate) instead of failing closed; fail closed only on a truly dynamic external value. Keep a rejecting probe for a constructor whose base traces to the repository root or a docs root.
- R22 Replay only for patches: in seam 5, current-vs-candidate test replay is required only for files that carry a Phase 9 patch. Parks and preserves need no per-file replay; the Phase 9 full-suite run owns their parity. Record the owning test name and assertion lines for each park/preserve instead.
- R23 Throughput: close at least 30 judgment files this turn (more if they fit), in the existing priority order (dead-vocabulary-guard and architecture first). Per file: full records, receipts, park dependencies, patch specs with co-cut grep evidence; no prose beyond what the record schema needs.

## Work

1. Implement R21 in the checker with probes; re-triage the 476 files; close every newly neutral file.
2. Author judgment files under R22/R23.
3. Checker 0 failures, all probes reject; update continuation and the review list (judgment files only; neutral/mechanical counts separately).

Final message: FIRST line a conventional commit subject (at most 100 chars, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em): files closed neutral, judgment files closed, remaining, checker/probes.
