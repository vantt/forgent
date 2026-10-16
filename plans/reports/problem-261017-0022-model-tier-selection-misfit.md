# Problem: model/tier selection picks expensive models for work that does not need them

Brief for an agent that will design a better selection mechanism. This file
describes the problem, the evidence and the constraints. It does not propose a
design.

## 1. What happened (2026-10-16)

On 2026-10-16 two 5-hour Claude subscription windows each ran out in under an hour:
13:30–13:53 and 18:30–19:07. All four in-flight leads (holder-lock 4.2,
lock-followups 4.4a/4.3, terminal-control 6.5, run-supervisor 6.2) stopped
mid-wave. About 8 of 11 frontier-tier worker runs died without a result, so
most of the spend produced nothing.

Where the spend went, from the session investigation:

| Source | Share / count | Mechanism |
|---|---|---|
| Leads passing `fgos run --override '{"tier":"frontier"}'` | lead 4.2: 9×, 6.2: 5×, followups: 4× | `frontier` → `modelPolicies.claude.frontier = fable`, for code **and** docs phases |
| 4–6 concurrent Opus in-process agents (leads) | lead terminal: 190 calls in 37 min | each relay or idle wake-up re-reads about 200k of context |
| Controller session context | about 440k per turn, about 21% of window 2 | long-running orchestrator never consolidates |
| Peer session on the same account | about 44% of W1, 18% of W2 | sonnet reviewers of another plan, with no shared budget view |

The owner judges that Sonnet is enough for coding; Opus and Fable are a misfit
for implementation work.

## 2. How tier and model are chosen today

There are three separate doors, and each one picks the model its own way.

### 2.1 `fgos run` / workflow units: `bind()` in `src/runner/execution/bind.mjs`

`bind()` picks the model in this order (around lines 385–432):

1. `effectiveRigor` = stronger of unit `rigor` and the capability's `rigor`. The
   default is `standard`.
2. `rigorToTier` maps it: low→nano, standard→standard, high→flagship,
   critical→frontier.
3. An `--override` tier is merged with `resolveStrongerTier(derived, override)`.
   **An override can only raise the tier, never lower it**, and nothing
   validates *who* may raise it or *why*.
4. `runner.maxTier` clamps the result if set. This key exists only here. It is
   not in the `fgos setup` config-merge, not checked by `fgos doctor`, and not
   in any spec, so it was undiscoverable. Until 2026-10-17 it was unset.
5. `resolveTierModel(runnerConfig, tier, providerFamily)` reads
   `runner.modelPolicies.<family>.<tier>`.

### 2.2 Assignment / work-item path: `src/runner/dispatch/assignment-policy.mjs`

This path has its own tier resolution, "strongest required tier, cannot be
weakened", and its own `rigorToTier` read. It does **not** read `maxTier`. So
the same project can get a different ceiling depending on the door.

### 2.3 In-process agents (Agent/Task tool)

These are not governed by fgOS config at all. The model comes from:

- the agent definition's frontmatter (`.claude/agents/*.md`: `planner`,
  `code-reviewer`, `brainstormer` = opus; `kongming`, `advisor` = fable;
  `fullstack-developer`, `debugger` = sonnet; `general-purpose` inherits the
  session model), or
- the caller's `model` argument.

The leads were `general-purpose` agents spawned from an Opus controller, so
they ran on Opus by inheritance. Nobody chose that on purpose.
`fgos dispatch decide --needs-soul` answers *where* the agent runs, not *which
model* it uses.

## 3. Why the current shape fails

1. **Tier says nothing about the kind of work.** One scalar (`nano…frontier`)
   is used for code edits, docs edits, design review and panels. A lead that
   wants "be careful" for a hard phase has only one knob, and it also raises
   cost for a docs phase in the same plan.
2. **Override is a one-way ratchet with no authority model.** Any caller,
   including a sub-lead agent, can raise to frontier. The config cannot say
   "workers on Sonnet; Opus only after two failed rounds; Fable only for design
   review". `maxTier` is a single global ceiling across every provider family,
   so it cannot express "cap claude at sonnet but allow gpt-6.1-sol".
3. **No per-capability tier ceiling.** The tier ladder is fine; what is missing
   is "code capabilities resolve to `advanced` at most". The only ceiling is the
   global `maxTier`, which also caps reviews and panels and every provider
   family.
4. **No escalation rule exists in code.** The intent "retry on a stronger model
   after N failures" lives only in prose and lead judgment. With no mechanism,
   leads pre-escalate to the top tier "to be safe".
5. **Cost is invisible at decision time.** `decide` and `bind` return
   `tier/model/tierSource` but no cost class, no remaining-quota signal and no
   per-account budget. Two sessions on one account cannot see each other's
   spend. A quota-exhausted window shows up only as dead runs (no stream
   output, killed after the idle timeout or an abrupt exit).
6. **In-process model choice sits outside the one door.** It breaks principle 7
   (single authority). Agent frontmatter, inheritance and caller arguments are
   three sources nobody reconciles with `modelPolicies`.
7. **Failures are expensive, not just runs.** A frontier run that dies at
   minute 40 spends the tokens and leaves nothing, because `claude -p` emits no
   progress until done. Without streaming (`--output-format stream-json`),
   neither the idle timeout nor the lead can tell "thinking" from "dead".
8. **Silent config traps make this worse.** For headless claude,
   per-invocation `args` are ignored in favor of `runner.executor.args`. Project
   config fully replaces global for some keys and merges others, so an operator
   cannot predict the effective model without running `bind()`.

## 4. Stop-gap applied on 2026-10-17 (not the design)

The owner clarified the rule.

- **The tier ladder is correct as configured:** advanced = Sonnet,
  flagship = Opus, frontier = Fable.
- **The fault is choosing a tier above `advanced` for coding.** Coding work
  belongs at `advanced`.

Final project `.fgos/config.json` state (commits `404b5c43b`, `d95da7c25`,
then the revert of the ladder change):

- `runner.modelPolicies.claude` is unchanged (`flagship: opus`).
- `runner.maxTier: "advanced"` is a **global** ceiling, used only because no
  per-capability ceiling exists.

Effect: every override above advanced is clamped. This was verified by calling
`bind()` with the committed config: no override → standard → sonnet;
`{tier:frontier}` → advanced → sonnet.

Known flaws of the stop-gap:

- It also caps non-code work (panels, reviews, other families such as
  gpt-6.1-sol) at advanced. It must be raised by hand before such a run.
- It does not touch the assignment-policy path or in-process agents.

## 5. Requirements for the new mechanism (from owner statements and the 7 principles)

- **Per-work-kind tier.** Code implement/fix resolves to `advanced` (Sonnet on
  claude). Design/architecture review may use flagship or frontier. Docs use a
  cheap tier. Express this as a per-capability default **and ceiling** in
  config. The family ladders stay as they are.
- **Escalation as a rule, not a caller whim.** For example: start at the
  capability's default; after N failed rounds on the same unit, step up one
  tier, capped by a per-capability ceiling. Record the reason in the unit's
  provenance.
- **Override authority.** Say who may raise a tier (owner/controller, not a
  sub-lead) and how far. A refused raise must be visible (a reason code), not
  silently clamped.
- **One authority for every door.** `bind()`, assignment-policy and the
  in-process `decide --needs-soul` answer must resolve the model from the same
  policy. In-process agents get a recommended model the caller passes to the
  Agent tool.
- **Discoverable.** Every new key goes through `fgos setup` config-merge and a
  `fgos doctor` check, and a spec section in `docs/specs/runner.md`. Global vs
  project precedence must be explicit.
- **Budget awareness (stretch).** Use a cost class per model and, if feasible,
  an account-level spend signal so concurrent sessions do not both burn the same
  window. At minimum, a concurrency cap per expensive tier.
- **Observability.** Streaming progress for headless claude, so a dead
  expensive run is detected in minutes, not at the idle timeout.

## 6. Constraints

- **Single user, no backward compatibility:** delete old surfaces in the same
  change (no aliases).
- **One Door:** `fgos run` / `workflow start` stay the only execution doors.
- **Do not edit other people's tooling** (ak/ck/rtk, Claude Code itself).
  Design around them.
- **No test-only switches.** Proof is real `bind()` resolution tests against
  the committed config.

## 7. Evidence pointers

- Tier logic: `src/runner/execution/bind.mjs:385-432`;
  `src/runner/dispatch/assignment-policy.mjs:11,107-115,253,314`;
  `src/runner/work-dispatch.mjs:346`.
- Config: `.fgos/config.json` `runner.{modelPolicies,rigorToTier,maxTier,executor}`;
  `~/.fgos/config.json` (global ladder differs: `claude.flagship=sonnet`,
  `frontier=opus`).
- Agent frontmatter: `.claude/agents/*.md` (`model:` lines).
- Quota investigation: session memory
  `project_low_level_standardization_round_2026_10_15.md`.

## Unresolved questions

- Which capabilities get which ceiling (code → advanced is decided by the
  owner; review/advise/panel → ?).
- Is an account-level spend signal obtainable from the providers at all, or
  only estimable from local run logs?
- Should leads (in-process orchestrators) be capped by the same policy, or by a
  separate "orchestrator" capability?
