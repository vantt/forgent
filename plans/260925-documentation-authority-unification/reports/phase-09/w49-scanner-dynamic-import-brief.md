# Git one-door scanner: dynamic imports must not hide callers (Doer brief, code slice)

Status: Lead brief under L13-32. HARDEN must re-review the scanner before Land, and HARDEN's re-review of `2ad5fecf4` returned CHANGES with one Medium. Read it on origin/main with `git show origin/main:plans/reports/review-261026-1404-doc-g4-scanner-rereview.md`; the board log line is `2026-10-26 14:05`.

**Finding (Medium).** Two dynamic-import shapes are neither followed nor recorded as escapes:
- `(await import('./w.mjs')).runGit([...])`. The repo uses this shape at `scripts/git/e3-bench.mjs:703`.
- `import('./w.mjs').then((m) => m.runGit([...]))`.

HARDEN's negative fixture shows a read-only tooling declaration that is still accepted while it hides a `push`.

1. Treat every `import()` that targets the declared wrapper's file as an escape, except the forms already followed: `const X = await import(...)` and its destructuring. Do this inside the existing caller-resolution and escape machinery, not in a parallel walker.
2. Add one negative case per shape to `test/scripts/git-one-door-declarations.test.mjs`, using HARDEN's fixture shape. Each case must fail against the scanner at plan HEAD. Keep the existing positive `const X = await import` case passing.
3. On the real tree, `node scripts/git-one-door-scan.mjs --root .` must report 0 undeclared sites, with class counts identical to the scan at plan HEAD. If `scripts/git/e3-bench.mjs` now escapes, a declaration fix is needed; report which one and why. Do not edit declarations yourself.
4. Do not touch `readConfig` trust. That Low item belongs to OPC.

Proofs, all exit 0:
- `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node --test test/scripts/git-one-door-declarations.test.mjs`;
- the real-tree scan, without `--write-census`; if it cannot run without an addon, report it, and the Lead runs it.

Write `reports/phase-09/git-one-door/scanner-dynamic-import/receipt.md` and `receipt.json` with every command and its exit code.

Writable (exact):
- scripts/git-one-door-scan.mjs
- test/scripts/git-one-door-declarations.test.mjs
- test/fixtures/git-one-door/**
- plans/260925-documentation-authority-unification/reports/phase-09/git-one-door/scanner-dynamic-import/**

Do not edit docs/, declarations or records. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test, and never load native addons. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
