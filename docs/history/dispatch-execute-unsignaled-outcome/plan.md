# Plan — tsk-4oq: dispatch.mjs execute's [DONE]/[BLOCKED] contract not enforced in code

Mode: standard

Flags counted (per `fgos-routing`'s Mode gate): **public contracts** (the
CLI `execute` subcommand's stdout JSON is a documented invocation path —
AGENTS.md's Dispatch section, several skills' own SKILL.md prose — so its
return shape is an external contract even though this change is
additive-only), **existing covered behavior** (`executeExecutorCli` and
the out-of-process return-shape build already have real test coverage in
`test/runner/dispatch.test.mjs`). 2 flags → standard, no hard-gate flag
(auth/data-loss/audit-security/external-provider/removing-validation)
present.

No `CONTEXT.md` exists for this item — discovery's verdict was `clear`
(`fgos discover tsk-4oq --verdict clear`), which skips `exploring`
entirely, so no locked-decisions doc was ever created. This plan cites
`docs/history/dispatch-execute-unsignaled-outcome/RESEARCH.md` (Round 1)
as its evidence base instead.

## Approach

**Chosen path.** In `executeExecutorCli`
(`src/runner/dispatch/cli.mjs:501-511`, right around the existing):

```js
const result = await adapterFn({ command, args }, { cwd, timeoutMs, idleTimeoutMs, maxBuffer, onChunk, workId: executorId, tier, model });
const base = { mechanism, ...result, provider, command };
return resolvedByPurpose ? { ...base, executorId } : base;
```

1. Capture `git rev-parse HEAD` in `cwd` (already in scope — the
   worktree path `spawnWorker`'s own convention threads in, `cli.mjs:766`
   `cwd: wtPath`) immediately BEFORE the `await adapterFn(...)` call, and
   again immediately after it resolves.
2. After `adapterFn` resolves (only the `resolve()` path reaches this
   line at all — `worker-timeout`/`maxBuffer`-exceeded both `reject()`
   earlier per RESEARCH.md Round 1, so this only fires on a real worker
   exit), scan `result.stdout` for the literal substrings `[DONE]` and
   `[BLOCKED]`. If neither is present, add `outcome: 'unsignaled'` plus
   the two HEAD shas (field names: `headBefore`/`headAfter`) to `base`.
   If either token IS present, `base` is unchanged from today — this is
   purely additive on the one path that currently has no signal at all.
3. Scope is `stdout` only, matching the item's own description
   ("dispatch.mjs execute tu scan stdout tail") — `stderr` is not
   scanned; a worker's completion signal is a `stdout` convention
   (`plugins/fgOS/skills/_shared/coding-worker-contract.md`), never
   `stderr`.

**Alternatives rejected.**

- Enforce the scan inside `cliSpawnAdapter` (`transport.mjs`) instead —
  rejected: that function has no notion of a work item's `cwd`-as-
  worktree semantics or git access concerns; it is the generic
  command-spawn primitive reused by both `spawnWorker` and
  `executeExecutorCli`, and HEAD-sha capture is specifically about *this*
  dispatch's own before/after state, not a generic adapter concern.
- Strengthen the worker-contract prose instead of adding code — rejected:
  the existing `[DONE]`/`[BLOCKED]` convention is ALREADY prose-only
  (`plugins/fgOS/skills/_shared/coding-worker-contract.md`,
  RESEARCH.md Round 1) and has already failed to guarantee compliance 3x
  (item description) — the whole point of this item is that prose alone
  is not enforcement.
- Also flag `mechanism === 'in-process'` results (`cli.mjs:424-430`) —
  rejected: that branch never spawns a worker subprocess at all (it hands
  a `spawn_instruction` back to the caller's own live Agent/Task tool),
  so there is no stdout to scan and no worker exit to signal on. Matches
  the item's own scope note ("chi sua o dispatch.mjs execute's own
  return-shape build").

**Impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` shows GitNexus registered and
`present`, but its indexed copy of this repo
(`/home/vantt/projects/forgentX`) is **1001 commits behind HEAD**
(`gitnexus list_repos`). A `gitnexus impact` call on `executeExecutorCli`
returned `"Target 'executeExecutorCli' not found"` — consistent with
staleness (the function's home file was split from a 2204-line
`dispatch.mjs` into `src/runner/dispatch/{cli,transport,...}.mjs` under
tsk-2uf-1, almost certainly after this index was built) rather than the
symbol genuinely not existing. Per CLAUDE.md's impact-analysis gate, this
is named as a real gap rather than trusted at face value: the blast-radius
evidence below instead rests on a direct grep/read cross-check (already
performed and recorded in RESEARCH.md Round 1) — `executeExecutorCli`'s
own result has exactly two real consumers in `src/`
(`cli.mjs`'s own `case 'execute':` CLI branch, and
`fanoutBatchExecutorCli` reading only `.status`/`.signal`/`.errorClass`),
neither of which reads or collides with a new `outcome` field.

**Files touched, in order:** `src/runner/dispatch/cli.mjs` only
(`executeExecutorCli`) — one file, one function, no sequencing needed.
`fgos graph tsk-4oq --json` confirms this item is its own isolated
component (size 1, not on `criticalPath`, empty `topUnblock`) — no other
in-flight item's ordering constrains this one.

## Risk map

| Component | Risk | Proof point |
| --- | --- | --- |
| `executeExecutorCli`'s return-shape build | light | existing tests (`test/runner/dispatch.test.mjs:3056+`, "executeExecutorCli resolves...", "...falls back to the global executor...", "...honors a caller-supplied model override...") stay green unmodified; a new test asserts `outcome: 'unsignaled'` appears when a mocked/faked `stdout` carries neither token, and is absent when it carries `[DONE]`/`[BLOCKED]` |
| CLI `execute` subcommand's stdout JSON contract (AGENTS.md's Dispatch section) | light | additive-only field, no existing key removed/renamed — a scripted caller doing `JSON.parse(stdout)` is unaffected by one new key |
| New `git rev-parse HEAD` calls in `cwd` | light | every out-of-process `executeExecutorCli` call's `cwd` is already a worktree path by `spawnWorker`'s own convention (`cli.mjs:766`, `wtPath`), so the call target is always a real git working tree — confirm at `fgos-coding-validating` by running `git rev-parse HEAD` manually in a worktree path |

## Outstanding questions

None
