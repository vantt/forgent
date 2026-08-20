# Plan: tsk-43z — dispatch execute worktree cwd

Mode: standard

Lane decided directly (this item's discovery verdict was `clear`, skipping
`exploring`, so no `fgos-routing` Orient lane was handed off). Applying
`fgos-routing`'s own Mode-gate table (`.agents/skills/fgos-routing/SKILL.md`
§ "Mode gate") directly: flags counted — **public contracts** (`execute`'s
CLI flag surface is used by every skill/driver in this repo that manually
dispatches out-of-process, per `core/skills/_shared/executor-dispatch-
fallback.md` Step B) and **existing covered behavior** (`test/runner/
dispatch.test.mjs` already has ~40 references exercising
`executeExecutorCli`'s self-execute/fallback branches). 2 flags, no
hard-gate flag (no auth/data-loss/audit/external-provider/validation-
removal) → **standard**.

## Approach

**Root cause (confirmed, RESEARCH.md round 1):** `src/runner/dispatch/
cli.mjs`'s `runDispatchCli`, `execute` case (lines 869-877), wires only
`--cwd`/`--dir` into `executeExecutorCli`. That single value both resolves
the main-checkout config root (`cli.mjs:383`, via `resolveMainCheckoutRoot`
when no `repoRoot` override is given) AND becomes the spawned executor's
own process cwd (`cli.mjs:519`, the literal `adapterFn({ command, args },
{ cwd, ... })` call). `executeExecutorCli` already accepts an optional
`repoRoot` parameter (`cli.mjs:353`) that decouples the two — used
correctly today by `fanoutBatchExecutorCli` (`cli.mjs:790`) — but the CLI's
own `execute` subcommand never wires any flag to it, so `repoRoot` stays
permanently `undefined` for every CLI-level `execute` call.

**Chosen fix:** wire a new `--repo-root <path>` flag into the `execute`
CLI case (mirroring the existing `--cwd`/`--dir` line immediately above
it), passed straight through to `executeExecutorCli`'s already-existing
`repoRoot` parameter — pure plumbing onto a primitive already proven
correct by `fanoutBatchExecutorCli`'s own use of it. Pair this with
correcting the two docs that told a driver session to pass the MAIN
CHECKOUT as `--dir` for a manual out-of-process dispatch
(`AGENTS.md`'s Dispatch section, `core/skills/_shared/executor-dispatch-
fallback.md`): for a worktree-backed item's Implement dispatch, the
correct call passes `--cwd <item's own fgw/<id> worktree path>` (so the
executor spawns/commits in the right place) and `--repo-root <main
checkout path>` (so config still loads correctly) as two separate,
explicit flags — never collapsing both into one `--dir` value again.

**Alternatives considered, rejected:**
1. **The full `--work <id>`-based auto-resolution** the item's own
   "Suggested fix" text and tsk-fli's decision log both float (resolve
   the work item, derive its worktree path AND repoRoot automatically).
   Rejected for *this* item's scope: tsk-fli (status `todo`, stage
   `discovery`) already owns adding a `--work <id>` flag to `execute` for
   its own reason (template-consistent prompt building via `buildPrompt`).
   Landing an overlapping `--work` flag here risks two items independently
   reinventing the same flag surface. The `--repo-root` plumbing chosen
   above is forward-compatible with that: whenever tsk-fli lands its own
   `--work` resolution, it can simply set `repoRoot`/`cwd` internally using
   this same already-existing parameter — no rework of this item's change.
2. **Doc-only fix, no code change.** Rejected: the *current* documented
   pattern (`executor-dispatch-fallback.md` Step B) already never passes
   `--dir` at all, relying on the calling shell's own cwd — and the
   incident still happened, because the driving session in tsk-5dnt
   explicitly added `--dir /home/vantt/projects/forgentX` anyway (a
   plausible habit-transfer from `bin/fgos.mjs`'s own *strict*, always-
   pass-`--dir` CLI contract, which has different semantics). A caller
   that *does* pass `--cwd`/`--dir` (a normal, already-used calling shape —
   `decide` already accepts `--work`/`--stage` the same way) needs a real
   flag to decouple correctly, not just a doc that says not to.
3. **Force `executeExecutorCli` to always auto-derive `repoRoot` from
   `resolveMainCheckoutRoot(cwd)` regardless of the `repoRoot` param.**
   Rejected: `repoRoot` is already an intentional override, exercised
   correctly by `fanoutBatchExecutorCli`; changing that primitive's own
   default behavior risks an unannounced behavior change for every
   existing internal caller — violates "preserve public contracts."

**Impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` reports GitNexus registered and
`present` (`mcp:gitnexus`), but its indexed snapshot of this repo
(`/home/vantt/projects/forgentX`) is **1047 commits behind HEAD**
(`list_repos`). A direct `impact` query for `executeExecutorCli` against
that repo returned `"error": "Target 'executeExecutorCli' not found"` /
`impactedCount: 0` — a suspicious zero-result per `CLAUDE.md`'s own gate
guidance, cross-checked with `rg`: the symbol demonstrably exists (83
matches, `src/runner/dispatch/cli.mjs:348` and friends). Blast radius
below is therefore sourced from the `rg` cross-check, not GitNexus.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `execute` CLI flag parsing (`src/runner/dispatch/cli.mjs`, `runDispatchCli`) | standard — additive-only change (one new optional flag, existing `repoRoot` param untouched in shape), but the function it feeds (`executeExecutorCli`) is real production infra with 2 non-test callers (`runDispatchCli`'s `execute` case itself, `fanoutBatchExecutorCli`) and ~40 references across `test/runner/dispatch.test.mjs` (rg cross-check, impact-analysis degraded — see above) | `node --test test/runner/dispatch.test.mjs` green, plus one new test: `--repo-root` flag wires to `executeExecutorCli`'s `repoRoot`, and omitting it leaves `repoRoot` `undefined` exactly as today (byte-identical default behavior) |
| `AGENTS.md` Dispatch section + `core/skills/_shared/executor-dispatch-fallback.md` (canonical source; `assembleSkills`/`mirrorDevSkillsIntoPlugin` in `src/setup/skill-wrappers.mjs` copy it into `.agents/skills/_shared/` and `plugins/fgOS/skills/_shared/` via `npm run build:skills` / `scripts/build-skill-wrappers.mjs` — confirmed by direct read: `.claude/skills/_shared/` is never generated at all, every `.claude/skills/<name>/SKILL.md` wrapper resolves a `_shared` reference straight to `.agents/skills/_shared/` instead, per `skill-wrappers.mjs:80-84`) | light — doc-only, no runtime behavior change | manual re-read: corrected guidance must not contradict Step B's existing "cwd defaults, no `--dir` passed" pattern — it only adds the explicit `--cwd`/`--repo-root` pair for a caller that does pass `--dir` for a worktree-backed item |

## Files touched, in order

`fgos graph tsk-43z --json`: tsk-43z is its own isolated size-1 graph
component (no `deps`, nothing depends on it) — not on the repo's own
`criticalPath`, `topUnblock` not computed this run. No cross-item
ordering constraint; order below is purely code-before-docs-before-tests-
last-verified:

1. `src/runner/dispatch/cli.mjs` — in `runDispatchCli`'s `execute` case,
   add `repoRoot: flagValue('--repo-root')` to the `executeExecutorCli(...)`
   call options, next to the existing `cwd: flagValue('--cwd') ??
   flagValue('--dir')` line.
2. `test/runner/dispatch.test.mjs` — add a case proving `--repo-root`
   reaches `executeExecutorCli` as `repoRoot`, and a case proving the spawn
   `cwd` and the config `root` genuinely diverge when `--cwd` names one
   directory and `--repo-root` names another (the actual regression shape
   from tsk-5dnt).
3. `AGENTS.md` (Dispatch section) and `core/skills/_shared/executor-
   dispatch-fallback.md` — correct the manual-dispatch guidance for a
   worktree-backed item, per Approach above.
4. `npm run build:skills` (`scripts/build-skill-wrappers.mjs`) — regenerate
   the mirrored copies (`.agents/skills/_shared/`, `plugins/fgOS/skills/
   _shared/`) from the corrected canonical source.

## Split

None. One honest piece: a single additive CLI flag plus its paired doc
correction, contained to `src/runner/dispatch/cli.mjs` + its own test file
+ two doc files. No candidate sub-piece is independently workable on its
own (the flag without the doc fix leaves the footgun live; the doc fix
without the flag has nothing new to point callers at) — proceeds as
itself, no child specs.

## Outstanding questions

None
