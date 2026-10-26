# Scanner re-export fix regressed a configured executor site (Doer brief, code slice)

Status: Lead brief under L13-32. Read `git-one-door/scanner-reexport/receipt.md` first.

**Regression.** At plan HEAD `9fd202707`, which merges 2fa7fe921, the real-tree scan reports one undeclared site:

```
unresolved-binary  src/runner/dispatch/transport.mjs:408  spawn  param invocation (no caller found for cliSpawnAdapter)
```

At `fbcb8e016`, before 2fa7fe921, the same scan reports 0 undeclared. In that run the site was classified `configured-binary` through `registerExecutorAdapter(DEFAULT_ADAPTER, cliSpawnAdapter, …)`, `cliSpawnAdapter.execute = cliSpawnAdapter`, and the dispatch stack down to parsed configuration. Spec §17, "Configured executors (`cliSpawnAdapter`)", describes that path. `src/runner/dispatch.mjs:50` re-exports names from `./dispatch/transport.mjs` with a named list that does not include `cliSpawnAdapter`.

The receipt claimed that neither fix changes the real census. That claim is false; reproduce the regression with `node scripts/git-one-door-scan.mjs --root .`, which needs no addon.

1. Find which part of 2fa7fe921 lost the caller path of `cliSpawnAdapter`, and fix it. The three re-export shapes (`export *`, `export * as ns`, a namespace passed on as a value) must still refuse a declaration that hides a caller, and the real-tree scan must report 0 undeclared with the same class counts as at `fbcb8e016`. Compare per class: `configured-binary` was 89 at HEAD, so check the pre-change count as well.
2. Add a positive regression case to `test/scripts/git-one-door-declarations.test.mjs`. It covers a function-valued adapter that is registered by value, has a `.execute` self-assignment, and is named in a named re-export list that does not include it. The case must stay classified, not undeclared.
3. Correct the receipt's census claim.

Proofs, all exit 0:
- `node scripts/git-one-door-scan.mjs --root .` reports 0 undeclared, with class counts listed against `fbcb8e016`;
- `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node --test test/scripts/git-one-door-declarations.test.mjs`;
- the new re-export negative cases still fail against `129cbb127`'s scanner.

Do not write the census; the Lead does it.

Writable (exact):
- scripts/git-one-door-scan.mjs
- test/scripts/git-one-door-declarations.test.mjs
- test/fixtures/git-one-door/**
- plans/260925-documentation-authority-unification/reports/phase-09/git-one-door/scanner-reexport/**

Do not edit docs/ or records. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test, and never load native addons. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
