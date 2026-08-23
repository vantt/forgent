# tsk-4bq — plan.md

Mode: standard

No CONTEXT.md exists — discovery's own `clear` verdict skipped
`exploring`: no repo-groundable ambiguity remained (the exact gap, the
exact fix shape, and proof that the fix shape actually works were all
already gathered first-hand, this same investigation, via a real live
test — `docs/history/tsk-u87-worktree-isolation-pinned-agent-existing-
path-test/RESEARCH.md`'s Step 4 section). The product decision itself
(fgos-fanout should dispatch out-of-process candidates for real, not
just detect and defer them) was locked directly by the user in that same
conversation, before this item was even claimed.

Lane: `standard` (fgos-routing's own Mode gate, applied directly — no
lane was handed off, since discovery→planning skipped exploring/routing).
2 flags counted: **public contracts** (`dispatch.mjs execute`'s CLI
surface is documented and cited by `../_shared/executor-dispatch-
fallback.md`; the change is additive/backward-compatible but still a
real contract surface) and **existing covered behavior** (`dispatch/
cli.mjs` has real test coverage, `test/runner/dispatch.test.mjs`). Not
`high-risk`: no hard-gate flag (auth/data-loss/audit/external-
provider/removing-validation) applies — this is dispatch mechanics, not
those.

## Approach

**Chosen path**, directly reusing the exact mechanism `tsk-u87` Step 4
already proved live (3/3 real candidates, zero collision):

1. **Add `--cwd <path>` to `dispatch.mjs execute`'s CLI subcommand**
   (`src/runner/dispatch/cli.mjs`'s CLI arg-parsing branch for
   `subcommand === 'execute'`). `executeExecutorCli` already accepts
   `cwd` as a real function parameter (defaulting to `process.cwd()`) —
   confirmed by direct read, `src/runner/dispatch/cli.mjs:229`. Today
   only the bare CLI wrapper never wires a flag for it. This is a small,
   additive, backward-compatible change: omitting `--cwd` keeps every
   existing caller's behavior byte-identical (still defaults to
   `process.cwd()`).

2. **Give `fgos-fanout` a real out-of-process firing path**
   (`.agents/skills/fgos-fanout/SKILL.md` + its
   `references/wave-dispatch-mechanics.md`, mirrored to `.claude/skills/`
   and `plugins/fgOS/skills/`). Today, Step 3 item 4's own branch reads:
   "If `decided.mechanism` is NOT `in-process`: report `id` back to the
   caller as needing a person... this skill has no out-of-process firing
   path of its own." That branch splits into two real cases instead of
   one blanket refusal:
   - `mechanism === "out-of-process"`: claim the candidate via plain CLI
     (`fgos pick "<id>" --dir "$root"` — no `EnterWorktree` tool
     involved, confirmed safe by `tsk-u87` Step 3/4 both), read the
     worktree path from the claim's own JSON, build the prompt the same
     way `fgos-coding-implement`'s own dispatch step already does
     (`buildPrompt`), then fire `node "$root/src/runner/dispatch.mjs"
     execute "<executorId>" --cwd "<worktree-path>" --prompt "<prompt>"
     --has-live-task-access` for the whole batch's out-of-process subset
     CONCURRENTLY via ordinary bash job control (`( ... ) & ... wait`) —
     never a Task/Agent tool for this branch; it is real OS subprocesses,
     the same shape `tsk-u87`'s own test script used, just expressed as
     bash instead of a one-off Node script. After each one exits, call
     `fgos return "<id>" --dir "$root"` (re-verifies independently, per
     the coding-worker-contract's driver-owns-return rule — the worker
     itself never calls `fgos return`).
   - `mechanism === "unavailable"` (unchanged): still reported back as
     needing a person — no dispatch surface exists for it at all, native
     or otherwise; nothing here changes that case.

**Alternatives rejected:**
- Writing a bespoke Node orchestration script (what `tsk-u87`'s own test
  used) as the shipped mechanism, instead of plain bash `&`/`wait` job
  control. Rejected: `fgos-fanout`'s entire Workflow today is expressed
  as CLI-call prose, no embedded scripts; introducing one script file
  just for this branch breaks that convention for no real gain — bash
  job control does the identical thing (N real OS processes, no tool
  running through Claude Code's own EnterWorktree/Bash-cwd guard) with
  no new file.
- Making `execute`'s `--cwd` REQUIRED. Rejected: every existing
  out-of-process caller (`fgos-coding-implement`'s own driver, this
  investigation's own tsk-8v1/tsk-u87 dispatches) calls it from inside
  the item's own already-`EnterWorktree`'d worktree, where
  `process.cwd()` is already correct — making `--cwd` mandatory would be
  a breaking change to every existing call site for zero benefit.

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| `dispatch/cli.mjs`'s `execute` subcommand (`--cwd` flag) | light | Purely additive optional flag; every existing call site (no `--cwd`) is byte-identical to today. `test/runner/dispatch.test.mjs`'s existing coverage on `executeExecutorCli`/`decideExecutorCli` stays green; a new case adds `--cwd` explicitly and asserts the resolved `cwd` reaches the adapter call. |
| `fgos-fanout`'s new out-of-process branch (SKILL.md + reference, 3 mirrors) | standard | Prose + bash-shape change, no new runtime module — `npm test` stays green (nothing code-level lives in these files); a real, disposable-candidate dispatch (same shape `tsk-u87` Step 4 already ran, just invoked through the new prose path instead of a one-off script) is the actual proof this holds end to end. |
| Concurrent out-of-process batch via bash `&`/`wait` | standard | `tsk-u87` Step 4 already proved 3 real concurrent out-of-process dispatches complete cleanly with zero collision, at the `executeExecutorCli`-function level — the bash `&`/`wait` shape around the SAME calls is a mechanical translation, not new behavior, but still worth one live disposable-candidate rehearsal at validating/implement to confirm the bash form doesn't introduce its own race (e.g. two candidates writing to the same stdout-capture path). |

**Impact-analysis posture:** GitNexus registered and reachable
(`present`), BUT its own live query for `executeExecutorCli` returned
"not found" — matching `CLAUDE.md`'s own named caveat for a stale/
non-fresh index (last indexed `7bb3231`, older than this session's HEAD).
Cross-checked via grep instead (6 real files: `dispatch/cli.mjs`,
`config.mjs`, `transport.mjs`, `resolve.mjs`, `prepare.mjs`,
`dispatch.mjs`, plus `test/runner/dispatch.test.mjs`) — confirms a small,
contained caller set, not a hub symbol. Posture recorded as **degraded**:
proceed, but the blast-radius evidence above is grep-based, not
graph-based: `fgos-coding-validating`'s own feasibility matrix should
treat this row's evidence as real but weaker than a fresh GitNexus query
would give.

**Files likely touched, in order** (no `fgos graph --json` critical-path
ordering applies — `tsk-4bq` is a standalone node, no `deps`, nothing
else in the backlog waits on its internal file order):
1. `src/runner/dispatch/cli.mjs` (add `--cwd` flag to `execute`
   subcommand) + `test/runner/dispatch.test.mjs` (new coverage for it).
2. `.agents/skills/fgos-fanout/SKILL.md` +
   `.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md`
   (the real source, per this repo's own skill-mirroring convention).
3. `.claude/skills/fgos-fanout/SKILL.md` (regenerated via `npm run
   build:skills`) + `plugins/fgOS/skills/fgos-fanout/SKILL.md` (kept
   byte-identical to the `.agents/` source, same pattern `tsk-8v1`
   already used).

## Shape

Concrete cases worth proving against, at `standard`-mode depth:

- **All-native batch** (today's only working case): unaffected — the
  `in-process` branch is untouched, byte-for-byte.
- **All-out-of-process batch**: every candidate claims via plain CLI,
  fires concurrently via bash `&`/`wait`, each returns independently.
  This is the case `tsk-4bq` exists to fix; `tsk-u87` Step 4 already
  proved the underlying mechanism (3/3, zero collision) — this item
  wires that proof into the real skill path instead of a one-off script.
- **Mixed batch** (some candidates `in-process`, some
  `out-of-process`, in the SAME wave): both branches fire within the
  same Step 3 iteration — native via the existing Task-tool Agent
  dispatch, out-of-process via the new bash job-control branch,
  concurrently with EACH OTHER too (no reason the two mechanisms need to
  serialize against one another; neither touches the other's state
  until Step 4's gather-and-approve, which already reads fresh state
  regardless of which mechanism produced it).
- **A worker fails mid-run** (non-zero exit, `[BLOCKED]`, or a real
  crash): report that one id back to the caller as failed for this
  iteration (same as today's `blocked`-status handling in Step 4) —
  never treat one out-of-process failure as a whole-batch failure; this
  branch fires each candidate as an independent OS process precisely so
  one failing has zero effect on its siblings (the same isolation
  property that made `tsk-u87` Step 4's own 3/3 result possible).
- **`unavailable` candidate inside an otherwise-dispatchable batch**:
  unchanged — reported back as needing a person, added to
  `dispatchUnavailable`, exactly as today.

## Outstanding questions

None
