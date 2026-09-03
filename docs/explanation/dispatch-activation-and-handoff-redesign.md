---
authoritative_for: dispatch activation and handoff redesign, driver/worker split, prepareDispatch builder, worker contract D3/D4, lifecycle-bearing vs ephemeral dispatch units
---

# Why dispatch activation and handoff got redesigned (tsk-2uf)

## The problem, measured

Pushing a task piece out to a cheaper provider is the right call — the
strong-model-plans / cheap-model-executes split (D1) was never in
question. What was actually broken was measured on three real dispatches
(`tsk-3kl`, `tsk-38w`, `tsk-679`):

1. **Activation wasn't sensitive.** Exactly one dispatch point was
   machine-enforced (the `PreToolUse` hook matching `Agent|Task` →
   `scripts/dispatch-decide-hook.mjs`). Every other dispatch point was
   prose-only, honor-system.
2. **Nothing was enforceable outside that one hook.** The hook also
   fails open and runs `decide` *instead of* the caller — it never checks
   whether the caller already called it.
3. **The handoff self-contradicted.** `worker-prompt-skill-pointer.txt`
   told the worker to load `{skillPath}` and swore "Never call fgos
   yourself" — but the skill it pointed to (`fgos-coding-implement/
   SKILL.md`) told the worker to call `dispatch.mjs decide` and `fgos
   return` itself. The template's promise that "the runner runs it itself
   after you finish" is true on the automatic `loop.mjs` path and false on
   the manual path — there is no runner watching a live session.

The root cause traced to a real asymmetry in `dispatch.mjs`: `decide` had
a `--work <id>` door, but `executeExecutorCli` had none — only raw
`--prompt`. Because that door was missing, a manual dispatch couldn't call
the already-existing `buildPrompt`, so the live session had to hand-build
the prompt package into a scratchpad file — and built it incomplete (no
skill pointer). `tsk-3kl` cost ~25 tool calls and 12m52s of wall-clock to
insert 19 lines of prose the session had *already written verbatim* —
none of the four legitimate reasons to dispatch (cheaper model, different
provider, resource isolation, parallelism) were being served, because the
handoff was too expensive to pay back.

A secondary finding: `footprintDiffHits` (`frozen-judge.mjs`) exempts an
empty `footprint` from its file-boundary check (by design, D5) — but both
`tsk-3kl` and `tsk-38w` had empty footprints, so the boundary check was
silently inert exactly when dispatch was happening. And `.fgos/config.json`
had a completely empty `capabilities` map, so the already-built `decide
--for <purpose>` door had no one registered behind it.

## Terminology locked by this item

- **driver** — the session owning the item's lifecycle: claim, decide,
  dispatch, verify, return, Iron Law.
- **worker** — whoever actually does the work, in-process (the driver
  itself) or out-of-process (another agent provider). Not a `roleGraph`
  role — a **contract**, not an identity.
- **ticket** — the claimed work item itself, not a separately-built prompt
  package.
- **cold-pickup refusal** — the worker judges for itself whether the
  prompt is sufficient; if not, it returns `[BLOCKED]` naming exactly
  what's missing, never guesses.
- **seam** — a registry field following the per-domain opt-in shape
  `roleGraph` already uses: absent means that domain doesn't dispatch a
  worker.
- **lifecycle-bearing unit** (D5) — work + child-work: has claim/worktree/
  verify/footprint, goes through merge.
- **ephemeral unit** (D5) — ad-hoc task `<scope>#p<n>` + a research
  fan-out branch: no claim, no state, returns a digest to the parent. The
  `#` in its id is structurally invalid against `ID_PATTERN`
  (`src/state/work.mjs`) on purpose, so it can never be confused for a
  lifecycle id.
- **builder** (D6) — the one place that generates a dispatch payload,
  aware of the unit's `kind`, shared across every transport. Distinct from
  the **guard** (the hook): the guard handles calls with *no unit*; the
  builder handles calls *with* one.

## What shipped

Three children, sequenced by a real footprint dependency (not priority —
`tsk-2uf-2` needs `tsk-2uf-1`'s payload-builder to exist before there's
anything to point a worker contract at):

1. **`tsk-2uf-1`** — regrouped `src/runner/dispatch.mjs` (2204 lines, six
   entangled concerns: prompt assembly / config+validators (36% of the
   file) / resolve / mechanism / transport / CLI doors) into
   `src/runner/dispatch/{config,resolve,mechanism,transport,prepare,cli}.mjs`,
   keeping `dispatch.mjs` as a barrel re-export so all 13 importers needed
   zero line changes. `prepareDispatch(unit, opts) → {payload, transport,
   economics, refusal?}` is the new named concept in the middle — it knows
   the unit's `kind` (D5), returns a typed, unbypassable refusal (not an
   exception) for an unclaimed item or an empty footprint, and every
   dispatch door (`execute --work`, the future `--task`, the automatic
   `spawnWorker` path, and the hook) is meant to converge on it.
2. **`tsk-2uf-2`** — split `fgos-coding-implement` into its driver half
   and worker half, added the provider-neutral worker contract
   (`.agents/skills/_shared/coding-worker-contract.md`) carrying the
   generic half (execution-only scope, footprint boundary, cold-pickup
   refusal, fixed status tokens, gate stays with a human) that applies to
   both lifecycle-bearing and ephemeral units, plus coding-specific
   content (git commit, worktree, shell verify) that applies only to
   lifecycle-bearing ones. Wired through a per-domain registry seam
   (`src/state/workflow-stage-graphs.mjs`) rather than hardcoded, so an
   absent seam is a no-op for the other three domain fixtures.
3. **`tsk-2uf-3`** — registered the `advise`/`execute` capability slots as
   a real `fgos setup` configDefault plus a `fgos doctor` check, so the
   empty `capabilities` map gets filled through the sanctioned door
   (`AGENTS.md`'s Install/setup/doctor gate) instead of a hand edit to
   `.fgos/config.json` — which would have been illegal anyway, since
   ADR0020 strips `.fgos/` from every worktree.

## What this borrowed from upstream, and what it didn't

Researched live against `beehive`/`beegog` v2.7.0
(`/home/vantt/projects/beegog`): `prepareDispatch` as a single pure
function called by both the hook *and* the builder (guard is the net,
prepare is the mold) is a direct structural borrow. The worker-contract
shape — a dedicated file, cold-pickup refusal, fixed return tokens
(`DONE`/`BLOCKED`/`HANDOFF`/`NOOP`), claim-ownership gating the payload —
is also borrowed. `beehive`'s `PINNED_AGENT_TYPE` was deliberately **not**
borrowed at first (it binds `tools:`/`model:` into Claude Code's native
subagent frontmatter, which doesn't fit `agy`'s cli-spawn shape) — a later
correction found `pi`'s `--tools read,grep,find,ls` flag proves a
cli-spawn-shaped worker *can* still get a capability allowlist enforced by
the process itself, just via `invocations[].args` instead of frontmatter.
That correction surfaced a real gap noted but deliberately **not** folded
into this item: `agy` currently runs with
`--dangerously-skip-permissions` — the opposite of an enforced allowlist —
tracked separately since it needs its own discovery (does `agy` even
expose an allowlist surface?).

## What is still open

- **D4's "provider-neutral" claim is asserted, not proven.** The worker
  contract is written to be provider-neutral, but only one provider
  (`agy`) has ever run it — `tsk-3kl` and `tsk-38w` both dispatched
  through `agy`, edited the right files, verified green, merged. `tsk-47r`
  (using `pi`, chosen because it reads `.agents/skills` directly from git
  root with no adapter) is D4's own test, deliberately sequenced after
  `tsk-2uf-2` so the contract exists first. A green run proves D4; a red
  run is equally valuable — it names exactly where the contract silently
  leans on one runtime, while there is still only one consumer to fix.
- **`economics` is a reserved slot, not implemented.** `prepareDispatch`'s
  return shape leaves room for it (for `tsk-492`), but this item computes
  nothing there — that needs `tsk-1xm`'s discovery first.
- **Step B.5 was declared superseded but the fragment was not edited.**
  `tsk-2uf-1`'s own description states that because `prepareDispatch`
  would call `logExecutorDispatch` itself, `.agents/skills/_shared/
  executor-dispatch-fallback.md`'s Step B.5 (added by `tsk-3kl`, telling a
  session to call `dispatch.mjs log` by hand) becomes redundant prose to
  remove. As of this synthesis, Step B.5 is still present in the fragment,
  and `execute --work`'s own code path (`src/runner/dispatch/cli.mjs`)
  does not call `logExecutorDispatch` automatically — only the manual
  `dispatch.mjs log` CLI subcommand does. Whether the auto-logging call
  landed under a different door (the dispatch system has grown an
  assignment/execution-contract layer since this item, `ADR-006`/`ADR-007`,
  outside this item's own scope to audit) was not checked here — a future
  reader relying on "Step B.5 is superseded" should verify the fragment
  and the live code match before removing the manual step.
