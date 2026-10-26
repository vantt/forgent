# Git one-door scanner fixes from the HARDEN review (Doer brief, code slice)

Status: Lead brief under L13-30 and L13-31. HARDEN reviewed G4 on `origin/review/doc-git-one-door` (`eb744281d`). The verdict is **CHANGES, scanner only**: all 25 declarations pass, 21/21 tests pass, and the scan finds 0 undeclared. The verdict text is on origin/main: board log line `2026-10-26 11:06 HARDEN` in `plans/261017-1313-fgos-platform-program-board/log.md`, and the review `plans/261017-1313-fgos-platform-program-board/reports/review-261026-1059-doc-g4-git-declarations.md`. Read both with `git show origin/main:<path>`, then read `docs/platform/git/spec.md` §17.

Fix these in `scripts/git-one-door-scan.mjs`. HARDEN reproduced each one.

1. **High (`:2531`, `:2539`).** `configured-binary` is checked only by `site.family === 'unresolved-binary'`, and it is exempt from escape refusal. So a callback wrapper reached with a fixed `'git'` can be declared configured-binary, and an escaping caller such as `run.call(null,'git',['push','--force'])` is then accepted. Spec §17 says never a fixed Git program.
   - Refuse the declaration when any resolved caller passes a literal `git` program.
   - Keep escape refusal unless the program is proven to come from configuration.
2. **Medium.** `declared-tooling-exemption` has no read-verb check, and an `update-ref` site was accepted.
   - Require the observed literal verbs to be in the read set, as `hook-read-context` already does.
   - Refuse a non-literal verb.
3. **Medium.** An aliased export (`export { g as alias }`, `export { g as default }`) is not followed, and an undeclared `reset --hard` caller passed with 0 undeclared. Refuse a declaration whose wrapper has an aliased export; do not leave this gap documented. No declared wrapper is aliased today.
4. **Low, optional.** Rows 19 and 22 (`rev-parse <sha>^{tree}`) could use `readObjects` for the tree OID. Rows 9–18 `retireWhen` names no phase or date. Do these only if small; otherwise record them as follow-ups in the receipt.

For each fix, add a negative case to the owning test, `test/scripts/git-one-door-declarations.test.mjs`. Add it there, not in a new file, and use HARDEN's reproduced shape. Each new case must fail without the fix.

Proofs, all exit 0:
- `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node --test test/scripts/git-one-door-declarations.test.mjs`;
- `node scripts/git-one-door-scan.mjs` with the flags its receipt uses, giving 0 undeclared on the real tree;
- `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node --test test/git/one-door.test.mjs`. If it needs a native addon, report it as not run; the Lead runs it.

Write `reports/phase-09/git-one-door/scanner-fixes/receipt.md` and `receipt.json` with each fix, the new test names, and every command with its exit code.

Writable (exact):
- scripts/git-one-door-scan.mjs
- scripts/lib/git-one-door-declarations.v1.json
- test/scripts/git-one-door-declarations.test.mjs
- test/fixtures/git-one-door/**
- plans/260925-documentation-authority-unification/reports/phase-09/git-one-door/scanner-fixes/**

Do not edit docs/, ledgers or other records. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test, never `phase-08/audit-report.py`, and never load native addons. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
