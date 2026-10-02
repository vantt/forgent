1. `runUnit` (src/runner/execution/run.mjs) is the single headless entrypoint `fgos run` uses to execute a Unit.
2. `resolveGitRoots` finds the worktree root and main checkout root via git; it throws `RunnerConfigError` outside a git repo.
3. A fresh run loads the unit from `unitData`, `unitPath` or stdin (`-`), parsing JSON first and YAML as fallback, then calls `validateUnit`.
4. It allocates `unitRunId` (`unit-run-<ts>-<hex>`) and writes `unit.json` under `<mainRoot>/.fgos/assignments/<unitRunId>/`.
5. `unit.json` holds the unit, overrides, the `snapshotRunnerConfig` result (sha256 hash + runner config) and the worktree path.
6. With `resumeUnitRunId`, it reloads `unit.json` and refuses if a live PID holds the `dispatch--<worktree>.lock` file.
7. `runRole` calls `bind`; a `refused` result becomes `policy-refusal`.
8. An `inline` binding is allowed for the producer role only: it writes `pending-inline.json` with a nonce and returns `blocked`. `recordInlineRun` later consumes the nonce and requires evidenceRefs that exist on disk.
9. Other bindings build an assignment (`mutating` unless `readOnly`) and run it via `executeAssignment`; the result category maps to `pass`, `findings`, `blocked`, `policy-refusal`, `provider-limit` or `execution-failure`.
10. `runUnit` hands `runRole`, `verify` (the unit or capability verify command via `execSync`, 60s timeout) and `history` to `runPattern` (default `solo`), and returns `{unitRunId, outcome, rounds, results, findings}`.
