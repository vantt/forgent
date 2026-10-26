# Git one-door scanner: re-exports must not hide callers (Doer brief, code slice)

Status: Lead brief under L13-32. HARDEN re-reviews the scanner before Land. Read `reviews/w42-g4-fixes-review.{md,json}`, item "re-exports can still hide a caller", and `git-one-door/scanner-fixes/receipt.md`.

**Finding (medium, from w42).** The following forms let an undeclared `reset --hard` caller through: `export * from './w.mjs'`, `export * as ns from './w.mjs'`, and a namespace import passed on with `export const ns = r`. The scan reports 0 undeclared on both the old and the new scanner. `findCallers`, at about `scripts/git-one-door-scan.mjs:1313`, claims to follow `export *`, but stops early because the re-exporting file has no `export ... g` text of its own. Spec §17 no longer names an open alias gap, so the code must close it.

1. Choose one of two fixes:
   - follow these re-export forms to their callers; or
   - refuse a declaration whose wrapper is reachable through any of them, the same way aliased and default exports are refused today.

   Refusing is acceptable and simpler. Use the existing value-flow and escape machinery, and do not add a parallel walker. No declared wrapper is re-exported today, so neither fix changes the real census.
2. Add the three reproduced shapes as negative cases to `test/scripts/git-one-door-declarations.test.mjs`. Each case must fail against the scanner at `129cbb127`; show this in scratch, the way the earlier receipt did.
3. **Low items from w42, optional.**
   - Trailing spreads after a read verb (`['diff', ...x]`) are accepted. Refuse a spread after verbs whose options can write a file (`diff`, `log`, `show` with `--output`), or leave it and record the reason.
   - An unresolved program with no escapes can still be declared `configured-binary`. Leave it unless the fix is a few lines.

Proofs, all exit 0:
- `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node --test test/scripts/git-one-door-declarations.test.mjs`;
- `node --check scripts/git-one-door-scan.mjs`.

The Lead regenerates the census and runs native-backed tests.

Write `reports/phase-09/git-one-door/scanner-reexport/receipt.md` and `receipt.json`, with every command and its exit code.

Writable (exact):
- scripts/git-one-door-scan.mjs
- test/scripts/git-one-door-declarations.test.mjs
- test/fixtures/git-one-door/**
- plans/260925-documentation-authority-unification/reports/phase-09/git-one-door/scanner-reexport/**

Do not edit docs/ or records; the Lead updates the spec. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test, and never load native addons. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
