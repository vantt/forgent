---
authoritative_for: fgOS dispatch's cross-provider governance gate (resolve.mjs) inspecting only executor.command against CLAUDE_CLI_COMMANDS and being blind to an env-override route to a different provider (glm's command:"claude" secretly routing to OpenRouter); replaced with a declared-egress check (providerFamily + egress kind/target/content) reusing the existing EXECUTOR_CARRIES vocabulary — cross-provider stays first-class, only undeclared or self-contradicting egress fails; glm's own egress declaration shipped in the same commit as the gate tightening
---

# The gate checked the command name, not where the data actually went

`tsk-5x7-2` is the second of `tsk-5x7`'s three dependency-free children —
the governance-egress fix, kept deliberately dependency-free from the
DispatchPlan piece.

## The gap

The cross-provider governance gate (`resolve.mjs:322`) inspected only
`executor.command` against `CLAUDE_CLI_COMMANDS` — blind to an env
override. `glm`, the executor `tsk-gb3` added, keeps
`command: "claude"` while routing to OpenRouter's GLM 5.2 entirely
through an env override. Real egress was cross-provider; the old gate
never saw it.

## Deliberately dependency-free, not a vocabulary refactor

This item's own framing is explicit: this is a live policy hole, not a
vocabulary refactor — it must not sit behind a structural redesign. The
fix uses only fields that already existed:
`executor.providerModel`, `invocations[].command`, `invocations[].env`,
`allowCrossProvider`, `carries`. It reuses the ALREADY-BUILT
`EXECUTOR_CARRIES` enum (`config.mjs:364`, already enforced at
`resolve.mjs:243-258`) as the egress content vocabulary, rather than
inventing a parallel one.

## What shipped

A declared-egress check — `providerFamily` + an `egress` descriptor
(`kind`, `target`, `content`) — replaces the old command-name gate.
`plan.governance` is populated with the resolved egress descriptor so it
reaches the dispatch audit event. This piece deliberately does NOT edit
`cli.mjs` — the event-writing half was hoisted into the sibling
`DispatchPlan` piece (`tsk-5x7-1`) at the footprint-overlap gate, which
writes `plan.governance` through generically. That kept this piece
dependency-free with zero footprint overlap, and kept the audit-event
concern in the one piece that already owns `cli.mjs`.

The governance intent stays consistent with the item's own reframing:
cross-provider is supported first-class. The gate only fails on egress
that's undeclared or self-contradicting (e.g. `command: "claude"` with an
env route to OpenRouter and no egress declaration) — never on
cross-provider dispatch itself.

## The gate-decision that shipped in the same commit

A person made the call (2026-08-25): ship `glm`'s own egress declaration
IN THE SAME CHANGE as the gate tightening, so the tightened gate lands
fail-closed with zero breakage. Measured blast radius was confirmed
exactly one executor: `agy`/`codex`/`pi` already declared
`allowCrossProvider: true` (their commands were never `"claude"`, so the
old gate already caught them), and no executor declared `carries` before
this — `glm` was the only entry carrying an env override with no
declaration. The instruction locked into this item's own action: never
tighten the gate without that declaration landing in the same commit.

## Landing note

First return attempt hit a `verify-fail`; a human actor resolved it and
the second attempt returned green. Merged into `fgw/tsk-5x7` (the
parent's own integration branch) — a decomposed child, carried to main via
the parent's own `sync-root`.
