---
authoritative_for: dispatch semantic control plane redesign — a canonical DispatchPlan routing contract, protocol abstraction beyond prompt-stdout, AgentMessage schema, and Herdr-as-transport (separating caller from worker process); scope deliberately narrowed from an original 8-phase design to 3 dependency-free children after D6 superseded D2, once "see the agent running in a real pane" and "long-term structured protocol" were recognized as two separable needs, not one
---

# An 8-phase redesign, deliberately cut to 3 shippable pieces before any code landed

`tsk-5x7` (docs/history/dispatch-plan-protocol-redesign/) diagnosed real
gaps in fgOS's dispatch mechanism and drafted a comprehensive redesign
around five conceptual layers: **DispatchPlan** (the route/execute
decision), **AgentMessage** (control message between agents),
**Artifact** (large data/work product), **State store** (the task's real
source of truth), and **Transport** (CLI/stdout, HTTP, MCP, mailbox,
Herdr, RPC).

## Seven real findings that motivated the redesign

1. `decide --for` didn't read `capabilities.<name>.prefer` —
   `decide --for fgos-coding-implement` returned `unavailable` even
   though `.fgos/config.json` configured `"fgos-coding-implement": {
   "prefer": "agy" }`, because `decide --for` only called
   `resolveExecutorIdForPurpose`, never `resolveExecutorAndOverrides`.
2. The `via: "api"` adapter port existed (validator + `httpAdapter`) but
   production `resolve.mjs` only ever selected `via: "cli"` — API
   invocation was test-level precedent, not a real first-class dispatch
   target.
3. Cross-provider governance looked at the wrong thing — the gate keyed
   on `command !== "claude"`, but the `glm` executor uses
   `command: "claude"` with an env override routing to OpenRouter. Real
   egress was cross-provider; the gate couldn't see it.
4. External tools (MCP like `gitnexus`) were only ever a handback, never
   a peer dispatch target — the dispatch layer has no MCP adapter/client
   of its own.
5. The worker contract leaned entirely on prose prompt + stdout tokens
   (`[DONE]`/`[BLOCKED]`) — a lowest-common-denominator protocol, with no
   structured path for providers that support JSON mode or event streams.
6. Two orchestration paths (the runner loop and `fanoutBatchExecutorCli`)
   shared resolve/transport partially but had no single "dispatch
   transaction" abstraction.
7. Decision-path speed (`decide`, ~0.09-0.13s) was already fine — the
   real bottleneck was subprocess/git/worktree/pick-return overhead, not
   the decision itself.

## Six locked design decisions, ending in a scope cut

- **D1** — `DispatchPlan.mechanism` is the canonical output of the
  Native-First Dispatch Doctrine (D-ADR0026), not a new decision next to
  it. `selector.type` uses `work` (matching decision 0029's
  root/child-task → work/child-work rename), and `capacity` is never a
  primary field (D-ADR0034 already renamed it to `executor` everywhere).
- **D2** (later superseded) — original scope: "Dispatch semantic control
  plane + Herdr-ready orchestration," 8 phases, not narrowed to the two
  live-confirmed bugs.
- **D3** — Herdr-as-transport's real consumer is a human wanting to watch
  a live agent in a real pane instead of blind stdin/stdout — a concrete
  architectural consequence, not YAGNI-deferred: once Herdr spawns a pane,
  the caller is no longer the worker's direct parent process, which is
  exactly why `AgentMessage` needs to be decoupled from the
  spawn-then-read-stdout assumption in the first place.
- **D4** — renamed toward a from-scratch redesign, accepting zero
  backward compatibility debt: "exec packet" → `DispatchAssignment`,
  message type `TASK` → `ASSIGN` (avoiding collision with work-item `tsk-`
  ids), typed id prefixes (`tsk_`/`asgn_`/`msg_`/`run_`), mandatory
  artifact handoff via `ArtifactRef`, and the prompt contract becomes a
  *rendering* of `DispatchAssignment`, not the protocol itself.
- **D5** — V1 is **structured-first + degradation-aware**, never
  structured-only. Every dispatch result carries a three-rung confidence
  ladder: structured `RESULT`/`BLOCKER` → `confidence: 'reported'`; stdout
  token `[DONE]`/`[BLOCKED]` → `confidence: 'legacy-signal'`; git-state/
  artifact-delta/exit-code inference → `confidence: 'inferred'`, with
  status reported as genuinely `UNKNOWN` rather than assumed `SUCCESS`.
- **D6 (supersedes D2)** — recognized two genuinely separate needs that
  had been wrongly merged into one: (a) the real immediate need — see an
  agent running in a real Herdr pane; (b) the long-term protocol —
  AgentMessage/mailbox/artifact-store/structured RESULT. These don't need
  to ship together. Scope cut from 7 planned children down to **3,
  all dependency-free**: (0) fix `decide --for` + a minimal canonical
  `DispatchPlan`; (1) dependency-free governance egress declaration; (2)
  a `herdr-spawn` adapter. A design misconception was also corrected here:
  `transport.mjs:148` shows the adapter axis is genuinely separate from
  `via`, so Herdr pane-spawn was never actually blocked by the protocol
  registry the way the earlier plan draft assumed.

## What this root item itself carried through

This root item's own drive stopped deliberately at the user-set ceiling
(plan written, not driven into validating/executing) on its first pass,
then — after decompose reached `need-human` on a footprint conflict and a
person confirmed shipping the `glm` egress declaration in the same commit
as one executor's blast radius — successfully decomposed into 3 real
children, each dependency-free with its own verify command: `tsk-5x7-1`
(fix `decide --for` + minimal `DispatchPlan` + a hoisted audit-event),
`tsk-5x7-2` (governance egress, including the `glm` declaration per the
gate decision), `tsk-5x7-3` (`herdr-spawn` adapter, carrying constraint C1:
never reuse a pane). Each child is synthesized separately by this same
retro-loop.

## Landing note

`sync-root` merged `fgw/tsk-5x7` into main at `81c16e26`, full suite green
(327+ tests). A stale session claim from the originating session (gone,
but under the 24h automatic-reclaim threshold) was manually released once
the real work was confirmed safely landed on main.
