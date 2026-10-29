---
title: "Rule delivery for one-shot and long-lived agents"
description: "How domain rules should reach an agent at the seat, by hook, brief or pull, for agents that run once and agents that keep receiving work. TEST and HARDEN agreed proposal for RULE (Agent Context Engine owner)."
status: proposal
created: 2026-10-29
---

# Rule delivery for one-shot and long-lived agents

Authors: TEST (`claude-tt7r@fg-server2`) and HARDEN (`claude-p74h@fg-server2`). Read-only. Addressed to `lead:RULE`, owner of the Agent Context Engine (ACE, RUL102). Nothing here is built. The mailbox part waits for MAIL to close.

## 1. Owner direction (2026-10-29)

- Upper layers (`fgos run`, the conductor) only operate: route work stably, cheaply, to the right role. Domain, business and persona rules are injected at the seat that actually runs, not spread over every surface.
- Some frameworks inject rules through hooks. Use that if it fits.
- Agents run in two modes. In **one-shot** mode an agent starts, runs and exits; this is common today. In **long-lived** mode an agent keeps receiving work; this is rare today. Rule injection is understood for one-shot. Long-lived needs a clear answer, so that each new prompt does not re-inject every rule.
- Alternatively, an agent that knows its role could fetch rules itself, or be given them, when it needs them.

## 2. Facts (origin/main, 10-29)

| Fact | Source |
|---|---|
| Coding-domain instructions are discovered and validated but delivered to no agent. The repo projection keeps only platform units, and nothing passes a domain target. | `src/setup/instruction-composition.mjs:149` `unitBelongsToTarget`; only caller `instruction-projections.mjs:240` (target `'repo'`) |
| The one place text is injected at the seat at run time is persona text, pinned per seat after binding, when domain, capability and persona are known | `src/runner/execution/run.mjs` `pinnedPersonaFor` and persona read |
| Bind-time `unit.skills` only filters executors; it injects nothing | `bind.mjs:287` |
| fgOS owns two Claude Code hooks: SessionStart (`scripts/fgos-session-start-hook.mjs`, paths) and PreToolUse (`fgos hook dispatch-decide`). AgentKit's `dev-rules-reminder.cjs` re-injects rules on every UserPromptSubmit. | `.claude/settings.json` |
| Mailbox reaches a running agent only through the host's checkpoint hook: `begin` → `render_reply` (fgOS composes the text and writes it to the hook output) → `finish`, which marks a mail offered only after the write. Adapter facts exist for Linux claude, codex, omp and pi. | `packages/mailbox/rust/store/src/hook/drain.rs` |
| Hook safety already exists in mailbox: time budget (`mailbox.hook.budgetMs` 8000), circuit breaker, outcome log | `hook/limits.rs`, `hook/breaker.rs`, `hook/outcome_log.rs` |
| Hook cost: a host spawn is about 1.4 ms; a hook that read git and config before doing nothing cost 12–29 ms per call on macOS (mailbox audit, M-3) | HARDEN ledger, T1 measurement |
| ACE's planned scope already includes a package manifest with source ids and digests, and dedup against the set already delivered | `plans/reports/kongming-261021-1325-rule-engine-component-boundary.md` §3 |

## 3. Proposal

**One selector.** ACE takes role, capability, domain, persona and injection point, and returns a rule package with one digest per unit. Push and pull both call it; nothing else chooses rules.

**Delivery per mode.**

| | One-shot | Long-lived |
|---|---|---|
| At start | Full package in the seat brief, on the same path as persona text | Same |
| Later | — | Only the **delta**: units whose digest the session has not received |
| Triggers for a delta | — | (1) a new task with a different role or domain; (2) compaction or resume, which clears what the agent holds; (3) optional, later: a work-shaped event such as an edit to a test file adding the test procedure |
| Carrier | Brief or persona text | The host's hook. Where fgOS already owns the hook, the delta rides that call: the mailbox `render_reply` composition, so rules and mail share one hook call and one write. A host with no hook gets rules only at spawn or after a restart, never mid-session. |

**Pull as a complement.** A verb such as `fgos rules --for <capability>` returns the same package through the same selector, and a pulled unit counts as delivered. Binding rules (laws, boundaries) are always pushed at spawn and on resume, never left to pull or to a path trigger, because agent-followed prose is the path that fails (example: the routing skill's instruction to read `domains/<domain>/AGENTS.md`).

**Hooks are one adapter, not the mechanism.** Hooks are per host CLI (principle 3). They carry the delta for hosts that have them; the selector and the delivered set do not depend on them.

## 4. Constraints (HARDEN ledger)

- **No new hook process per event.** Every PreToolUse hook is paid on every tool call. Ride the entries fgOS already owns (mailbox checkpoint, `fgos hook dispatch-decide`). The no-op path reads no git, config or Event Store (the mailbox M-3 shape). A path trigger decides from the tool input path against globs compiled into the package, in process. AgentKit's every-prompt reminder is the anti-pattern to measure against.
- **Never block the session.** Exit 0 always, within a time budget and behind a circuit breaker. Reuse mailbox's budget and breaker; do not write a second one.
- **Write first, then record.** Mark a digest delivered only after the hook output was written; a failed write leaves it undelivered so it is offered again.
- **The delivered set dies with the context.** Compaction and resume clear it. A subagent has its own context and its own set; it does not inherit its parent's.
- **One door for the state.** The per-session delivered set is keyed by session identity (Identity component) and written through durable-file. No new store and no per-adapter file format.

## 5. Order

1. ACE selector and package with digests (RULE).
2. One-shot delivery through the seat brief or persona path. This alone unblocks the coding-domain rules, including the TEST standard (`domains/coding/instructions/test-discipline.md`, drafted, not landed).
3. In the same change as 2: retire the copies that the seat now receives, starting with the `fgos-run` §4 checklist. Then, once DOC lifts the AGENTS.md freeze, fold L5 q5 into a pointer to principle 8.
4. Long-lived delta through the mailbox checkpoint hook, after MAIL closes.
5. Pull verb; path triggers only if role, domain and compaction triggers prove too coarse.

## 6. Questions for RULE

1. Is the selector plus one-shot delivery (steps 1–2) ACE's first slice, and when?
2. Does ACE own the delivered-set state, or does the delivery adapter own it with ACE computing the delta?
3. Is extending the persona path the accepted interim carrier for domain rules, or does RULE want a separate brief section?
