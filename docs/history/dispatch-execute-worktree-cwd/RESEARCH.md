# Research: dispatch execute worktree cwd (tsk-43z)

## Round 1 — 2026-08-20

**Asked:** Verify the code evidence behind tsk-43z's bug report on current
HEAD (does `src/runner/dispatch/cli.mjs` really pass the same `cwd` to both
config resolution and the executor spawn; does `executeExecutorCli` already
support a `repoRoot` override; does the `execute` CLI subcommand wire any
flag to it), what flags `execute` accepts today, and whether it already has
a `--work <id>` flag.

**Checked:**
- `src/runner/dispatch/cli.mjs:348-527` (`executeExecutorCli` body) — read
  directly.
- `src/runner/dispatch/cli.mjs:833-916` (`runDispatchCli`, `execute` case).
- `src/runner/paths.mjs:25-92` (`resolveRepoRoot`, `resolveMainCheckoutRoot`).
- `fgos list --id tsk-fli --json` — the sibling item's own decision log.

**Found:**
1. **CONFIRMED** — `src/runner/dispatch/cli.mjs:519`:
   `const result = await adapterFn({ command, args }, { cwd, timeoutMs, ... })`.
   `cwd` here is the raw function-argument default `cwd = process.cwd()`
   (`cli.mjs:352`), i.e. exactly whatever `--cwd`/`--dir` the CLI caller
   passed (`cli.mjs:875`: `cwd: flagValue('--cwd') ?? flagValue('--dir')`).
2. **CONFIRMED** — `executeExecutorCli` already accepts an optional
   `repoRoot` parameter (`cli.mjs:353`) and, when given, uses it instead of
   deriving root from `cwd` for config/`.fgos` resolution:
   `cli.mjs:383`: `const root = repoRoot ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd);`.
   This decoupling primitive already exists and is exercised internally
   (`cli.mjs:790`, `fanoutBatchExecutorCli` passes `repoRoot: root`).
3. **CONFIRMED** — the CLI's `execute` subcommand (`runDispatchCli`,
   `cli.mjs:869-877`) never wires any flag to `repoRoot` — its call to
   `executeExecutorCli` passes `cwd` only, so `repoRoot` stays `undefined`
   for every CLI-level `execute` invocation today.
4. **`execute`'s full current flag set** (`cli.mjs:855-877`): `--prompt`,
   `--prompt-file`, `--model`, `--tier`, `--carries`, `--for`,
   `--cwd`/`--dir`, `--has-live-task-access`. **No `--work <id>` flag exists
   today** — confirmed absent, matching tsk-fli's own premise.
5. **Additional finding, not asked but load-bearing:**
   `resolveMainCheckoutRoot(cwd)` (`paths.mjs:72-85`) resolves via
   `git rev-parse --git-common-dir`, which — per its own doc comment —
   "always points at the main checkout's `.git` regardless of which
   worktree `cwd` is inside". So if a caller passed the item's own
   **worktree path** as `--dir` (instead of the main checkout), `root`
   inside `executeExecutorCli` would *already* resolve correctly to the
   real main checkout for config, while `cwd` (used for the spawn at
   line 519) would correctly stay the worktree. The single shared `--dir`
   flag is not structurally incapable of correctness — the live incident
   (tsk-5dnt) passed the main checkout explicitly, not the worktree.
   `bin/fgos.mjs`'s own CLI is `strict` (`paths.mjs:25-26`, no git
   resolution) and unconditionally needs `--dir` = root, which is a
   plausible source of the habit being carried over to `dispatch.mjs
   execute`, whose `--dir` has different (git-aware) semantics.
6. **tsk-fli relationship** — `fgos list --id tsk-fli` decision log:
   tsk-43z was deliberately **split out of tsk-fli** (2026-08-20 decision)
   "since its severity (silent corruption of shared main) warrants separate
   triage priority from this item's own DX-friction framing... Same root
   fix (a `--work <id>` resolution path) would likely close both." No
   formal `deps` link exists between the two items (`tsk-43z.deps == []`).
   They are siblings sharing one likely root fix, not a hard blocker
   relationship.

**Still open:** none for this round's own question — all three code claims
confirmed, flag inventory confirmed, tsk-fli relationship confirmed as
non-blocking sibling.

## Verdict

`clear`. The reported root cause and code citations hold exactly as
described on current HEAD. Whether the eventual fix is (a) the `--work
<id>`-based `repoRoot`+`cwd` auto-resolution the item's own "Suggested fix"
proposes (same root fix as tsk-fli), or (b) a smaller fix that only
corrects/documents the correct `--dir` value for a worktree-backed item's
out-of-process dispatch (finding 5 above shows the existing `repoRoot`
decoupling primitive already makes that work with zero code change) is a
"smallest honest plan" implementation-approach call, not an open product
ambiguity — squarely `fgos-coding-planning`'s job, not a reason to route to
a person at `exploring`.

**Verify:** `node --test test/runner/dispatch.test.mjs` (existing suite
already covers `executeExecutorCli`'s self-execute/fallback branches per
its own in-code comment at `cli.mjs:407`; a fix here needs a new case
in this same file asserting spawn `cwd` and config `root` diverge
correctly for a worktree-backed item, not a new command).
