# Git one-door scanner: a default re-export must not hide callers (Doer brief, code slice)

Status: Lead brief under L13-32. Read `reviews/w45-g4-rework-review.{md,json}`, item W45-2. Plan HEAD now includes the final main import F (`eb161da46`).

**Finding (high).** `export { g as default } from './read.mjs'` hides callers. The named re-export handling added in 2fa7fe921 records the wrapper under the alias `default`, and the scan never follows `import h from './barrel.mjs'; h(['reset','--hard'])`. A declared wrapper therefore passes with only its own caller. This was already a hole at `129cbb127`. The local forms of the same export are refused, and spec §17 says this shape is refused. The same route also hides a git caller of a configured adapter.

1. When a named re-export's alias is `default`, refuse it as "exported as default", the same way the local `export { g as default }` is refused. Reuse the existing escape machinery.
2. Add the shape to the re-export test matrix in `test/scripts/git-one-door-declarations.test.mjs`, with and without a configured adapter. The new cases must fail against the scanner at `f4324b27d`.
3. On the real tree, `node scripts/git-one-door-scan.mjs --root .` must still report 0 undeclared, with class counts equal to the scan at `f4324b27d`.
4. **Low, optional, W45-7.** Callers written as `import('./m.mjs').then(m => m.g(...))` are invisible. Do not fix this; record it as a follow-up in the receipt.

Proofs, all exit 0:
- `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node --test test/scripts/git-one-door-declarations.test.mjs`;
- the real-tree scan above, without `--write-census`; the Lead writes the census.

Write `reports/phase-09/git-one-door/scanner-default-reexport/receipt.md` and `receipt.json` with every command and its exit code.

Writable (exact):
- scripts/git-one-door-scan.mjs
- test/scripts/git-one-door-declarations.test.mjs
- test/fixtures/git-one-door/**
- plans/260925-documentation-authority-unification/reports/phase-09/git-one-door/scanner-default-reexport/**

Do not edit docs/ or records. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test, and never load native addons. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
