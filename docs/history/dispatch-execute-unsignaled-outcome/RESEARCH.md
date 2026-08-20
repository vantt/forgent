# RESEARCH — tsk-4oq: dispatch.mjs execute's [DONE]/[BLOCKED] contract not enforced in code

## Round 1 (2026-08-20, discovery)

**Asked:** Where exactly does `dispatch.mjs execute` build its return
shape after a worker process exits, is the worker's full stdout/stderr
available at that point (not truncated), does `cwd`/git access already
exist in that scope to capture HEAD sha before/after, is the "only one
comment mention of [DONE]/[BLOCKED] in src/" claim still current, and is
`outcome` genuinely unused elsewhere on this specific result shape (so
adding it is additive/safe)?

**Checked:**

- `src/runner/dispatch.mjs` (barrel re-export, tsk-2uf-1 split) — confirms
  the real `execute` CLI subcommand logic now lives at
  `src/runner/dispatch/cli.mjs`, not in the barrel file itself.
- `src/runner/dispatch/cli.mjs:335-512` (`executeExecutorCli`) — the
  out-of-process return-shape build.
- `src/runner/dispatch/transport.mjs:241-397` (`cliSpawnAdapter`).
- `src/runner/dispatch/cli.mjs:800-880` (`runDispatchCli`, the `case
  'execute':` CLI entrypoint branch).
- `grep -rn '\[DONE\]\|\[BLOCKED\]' src bin domains plugins`
- `grep -rn "outcome" src/runner/` and `executeExecutorCli` callers.

**Found:**

- **Exact target location confirmed.** `executeExecutorCli`
  (`src/runner/dispatch/cli.mjs:505-507`):
  ```js
  const result = await adapterFn({ command, args }, { cwd, timeoutMs, idleTimeoutMs, maxBuffer, onChunk, workId: executorId, tier, model });
  const base = { mechanism, ...result, provider, command };
  return resolvedByPurpose ? { ...base, executorId } : base;
  ```
  This is the one place the out-of-process return object is assembled —
  the natural spot to scan `result.stdout`/`result.stderr` for the two
  tokens and add `outcome`.
- **Full stdout/stderr is available, not truncated, on a normal exit.**
  `cliSpawnAdapter` (`transport.mjs:241-397`) accumulates `stdout`/`stderr`
  in closures over the whole child lifetime and resolves
  `{ status: code, signal, stdout, stderr, tier, model }` at
  `transport.mjs:393` on the `'exit'` event — the only two paths that
  short-circuit this (`worker-timeout`, `maxBuffer` exceeded) both
  `reject()` instead of `resolve()`, so they never reach the `base`-build
  line above at all. A worker that exits normally (even with a non-zero
  status, e.g. the tsk-4oq description's own "exit code 1, empty stdout,
  stderr only 'Error: timeout waiting for response'" case) DOES reach
  this line with its full output intact.
- **`cwd`/git access already in scope, no new plumbing needed for HEAD
  sha.** `cwd` is already a parameter available at the `executeExecutorCli`
  call site (`cli.mjs:505`, threaded in from `spawnWorker`'s own
  worktree-path convention at `cli.mjs:766`, `cwd: wtPath`) — capturing
  `git rev-parse HEAD` in that same `cwd` before and after the
  `await adapterFn(...)` call is a same-scope addition, not a new
  dependency.
- **`[DONE]`/`[BLOCKED]` enforcement claim re-confirmed current** (repo
  state as of this round, not just the description's earlier-dated
  claim): `grep -rn '\[DONE\]\|\[BLOCKED\]' src bin domains plugins`
  returns exactly one hit inside `src/` — `src/setup/registrations.mjs:1269`
  — and it is a `//` comment, not executable code (line number shifted
  from the description's `:1091` because other items landed on that file
  since the description was written; the substance — comment-only, no
  enforcement — is unchanged). Every other repo hit
  (`domains/coding/skills/fgos-coding-implement/references/...md`,
  `plugins/fgOS/skills/_shared/coding-worker-contract.md`,
  `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md`) is prose
  in a skill/worker-contract doc — instructions telling a worker what to
  print, never JS code that parses the tokens back out.
- **`outcome` is additive-safe on this specific result shape.** The word
  `outcome` is used pervasively elsewhere in this codebase
  (`src/runner/loop.mjs`, `merge.mjs`, `promote-engine.mjs`,
  `github-adapter.mjs`, `bin/fgos.mjs`) — but always on different result
  objects from different functions/verbs. The only two places that read
  `executeExecutorCli`'s own return value are (a) the CLI `execute`
  branch (`cli.mjs:846-869`), which just `JSON.stringify`s the whole
  object to stdout as the one final line — the exact invocation path
  AGENTS.md's Dispatch section documents — and (b)
  `fanoutBatchExecutorCli` (`cli.mjs:754-786`), which reads only
  `execRes.status`/`.signal`/`.errorClass`, never `.outcome`. Neither
  reads or would collide with a new `outcome` field.

**Still open (for planning):** exact token-scan implementation (substring
match vs. anchored/last-line match, whether to scan `stdout` only or also
`stderr`), and whether `outcome:"unsignaled"` should also cover the
in-process (`mechanism === 'in-process'`) branch (`cli.mjs:424-430`) —
description's own scope note says "only `dispatch.mjs execute`'s own
return-shape build", and the in-process branch never runs a worker
subprocess at all (it hands a spawn instruction back to the caller), so
this looks out of scope by construction, not an open discovery question.

**Verdict:** `clear`. Verify (real, runnable, proves the target line and
baseline behavior are unchanged going in):

```bash
grep -n "const base = { mechanism, ...result, provider, command };" src/runner/dispatch/cli.mjs && npm test
```
