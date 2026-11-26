---
id: capability-routing-rules
kind: procedure
owner: core
scope: repo
mode: append
specificity: 10
title: Capability Routing Rules
description: Default to inline execution, the five reasons that justify an executor, plans never pin infrastructure (an ad-hoc Unit may prefer softly), a capability is a routing signal, and research is a workflow
lifecycle: live
valid_from: 2026-11-26
related:
  - "[[dispatch-decide-door]]"
  - "[[run-door-contract]]"
when:
  sessionType:
    - head
    - hand-opened
---

# Capability Routing Rules

## Default inline and the five dispatch reasons

Executing inline within the current session is the platform default: when no executor is configured for a capability, `decide` answers `unavailable` and the unit executes inline in the live session.

Five valid reasons justify configuring an executor for a capability in project configuration (or passing an ad-hoc refinement):

1. **Cheaper model:** A lightweight tier is sufficient for a well-bounded, routine task.
2. **Stronger model:** The unit's required rigor exceeds the current session's model capability (tied to `rigor`, never to `size`).
3. **Different provider:** Provider diversity, credential isolation, or quota management mandates another engine (e.g. Gemini, OpenAI, Claude).
4. **Confinement & isolation:** Hard filesystem sandboxing, read-only guarantees, or clean worktree isolation is required.
5. **Parallel execution:** Running independent units concurrently to shorten wall-clock time (Ship Faster, priority #1 in `AGENTS.md`).

## Never pin infrastructure

Plans, patterns, driver prompts and non-ad-hoc Units never pin an executor, provider, model, tier, invocation or override. They declare canonical capability names only; which executor serves a capability is a live-config, execution-time concern that `bind()` resolves through `decide`. A plan that pins an executor has leaked an execution-time decision into a planning-time document.

The one exception is an ad-hoc Unit (the one-liner's `--provider`, `prefer` in a `--units` file): it may carry a soft preference that `bind()` tries first and fails over from, never a pin, and only for one of the five reasons above. Otherwise leave it out and `bind()` takes the capability's pool. Only a human `--override` pins.

## A capability is a routing signal

A capability is a stable behavior promise or purpose — never a task instance, a Work item, a lifecycle stage, a skill name, or an executor name. Capability annotation is a planning-time signal, never a Work-schema field, and never itself a reason to create, split, or transition a Work item.

## Research is a workflow, not a capability

`fgos-researching` is a skill/workflow — it turns an unresolved question into a grounded finding. It is never itself a capability name, never a valid `decide --for` argument, and no catalog entry called `research` (or similar) should ever be registered. When a research question genuinely needs a dispatched capability (for example a code-graph blast-radius lookup), it asks `decide` for the concrete capability that answers it — `impact-analysis` today; browser/web lookups and repository search stay primitive tool calls (`WebSearch`/`WebFetch`/`Grep`) made inline inside the research unit, which per the activation doctrine are never themselves independently executable units and never trigger a `decide` call on their own.
