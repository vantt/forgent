# dispatch-execute-cwd-repo-root-guard — RESEARCH

## Round 1 — 2026-08-26 (tsk-322 discovery)

**Asked:** tsk-322 reports `dispatch.mjs execute` called with `--repo-root
<main checkout>` and no `--cwd` from inside a worktree can make a
successful out-of-process worker commit its real implementation directly
onto `main` instead of the caller's own worktree branch. Root cause was
explicitly unconfirmed in the original report. Goal: pin the mechanism
well enough to write a real fix and a real regression test.

**Checked — CLI flag parsing (`src/runner/dispatch/cli.mjs:826-834`):**
The `execute` verb builds its options as `cwd: flagValue('--cwd') ??
flagValue('--dir')`, `repoRoot: flagValue('--repo-root')`. When only
`--repo-root` is passed, `cwd` is `undefined`, which triggers
`executeExecutorCli`'s own default parameter `cwd = process.cwd()`
(`cli.mjs:335`) — `repoRoot` is used ONLY to resolve `root` for config
loading (`cli.mjs:366`: `const root = repoRoot ?? resolveMainCheckoutRoot(cwd)
?? resolveRepoRoot(cwd)`), never substituted for `cwd` itself anywhere in
this file. `cwd` then flows unchanged through to the adapter dispatch
(`cli.mjs:503`: `adapterFn({...}, { cwd, ... })`) and into
`captureDispatchAttestation`'s own git attestation call
(`transport.mjs:115-120`, `attestRoot ?? path.dirname(fgosDir)`, and
`spawnWorker`/`executeExecutorCli` both pass their own `cwd` as
`attestRoot`).

**Live synthetic repro (throwaway script, not committed — pattern mirrors
`test/runner/dispatch.test.mjs`'s own `mkTempGitRepo`/fake-executor
helpers):** built a fake main checkout (`repoRoot`) and a SEPARATE `wtRoot`
simulating a worktree cwd, then ran `node dispatch.mjs execute probe
--repo-root <repoRoot>` (no `--cwd`) with the spawning process's own `cwd`
set to `wtRoot`. The git attestation subprocess
(`captureDispatchAttestation`) genuinely ran against `wtRoot` (it failed
with "fatal: not a git repository" only because the synthetic `wtRoot`
was never `git init`-ed — the path itself was correctly `wtRoot`, not
`repoRoot`). **This confirms `cwd` really does default to the calling
process's own `process.cwd()` at the Node level, unaffected by
`--repo-root`** — the CLI/adapter code path itself does not silently
substitute `repoRoot` for `cwd` anywhere traced.

**Reconciling with the real incident:** tsk-322's own description, and a
same-day corroborating repro with a different provider (`claude`
cli-spawn, logged against tsk-2tr — the dispatched worker "self-detected
the wrong worktree and refused to commit instead of landing on main"),
both show the ACTUAL spawned worker executing with the main checkout as
its real working directory, not the worktree — contradicting the clean
Node-level default found above. The gap is therefore not inside
`dispatch.mjs`'s own cwd-resolution code (which resolves correctly given
whatever `process.cwd()` the Node process itself launched with); it is in
whatever `process.cwd()` actually WAS at the moment the real `execute`
call ran — i.e., something upstream of this file (the calling session's
own shell/tool state) supplied the wrong starting directory. That upstream
mechanism is outside this repo's own source (a Claude Code CLI harness
concern, not `src/`), and is not this item's to fix — but the FAILURE
MODE it enables (a silent wrong-cwd default with no complaint) is: **the
existing docs (`AGENTS.md`'s Dispatch section, `executor-dispatch-
fallback.md:117`) already tell every caller to always pass `--cwd`
alongside `--repo-root`, but nothing in `dispatch.mjs`'s own code enforces
or even warns about the omission** — exactly tsk-322's own suggested
direction (a): "`dispatch.mjs execute`'s CLI should require `--cwd`
whenever `--repo-root` is passed and they differ."

## Verdict

`clear`. Scope: add a CLI-level guard to `execute` (and, for the same
reason, `decide` — same `flagValue('--cwd') ?? flagValue('--dir')` /
`--repo-root` pairing appears at `cli.mjs:856-863` too) that refuses (or
at minimum loudly warns, matching this repo's existing fail-closed
conventions elsewhere — e.g. `main-checkout-reset`'s own `--confirm`
refusal shape) when `--repo-root` is passed but `--cwd`/`--dir` is not,
rather than silently defaulting `cwd` to `process.cwd()` with no signal
at all. This does not fix the upstream harness-level cwd issue (out of
this repo's control) but closes the silent-failure gap: a caller that
forgets `--cwd` gets a clear, immediate refusal instead of a worker that
might land its commit somewhere unexpected with no warning.

**Verify:** `node --test test/runner/dispatch.test.mjs` — extend with a
new test asserting `execute`/`decide` refuse with a clear, actionable
error when `--repo-root` is given without `--cwd`/`--dir`, and continue
to work unchanged when both are given (or neither, the existing
process.cwd()-only default path) — full existing suite must stay green.
