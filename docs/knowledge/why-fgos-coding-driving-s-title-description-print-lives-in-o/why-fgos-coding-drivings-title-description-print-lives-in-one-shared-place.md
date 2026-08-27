---
type: explanation
title: Why fgos-coding-driving's title/description print lives in one shared place
tags: [fgos-coding-driving, pick, interactive, transparency-law]
source_capture_ids: [tsk-23z]
framework: diataxis
mode: explanation
---
# Why `fgos-coding-driving`'s title/description print lives in one shared place

`/fgOS:pick` already printed a claimed item's `title`/`description` to
the user before starting work on it. This item generalized that same
display to every other interactive fgOS launcher that drives a
coding-domain item through its lifecycle — `/fgOS:discover`,
`/fgOS:plan`, `/fgOS:discover-next`, and `/fgOS:cook` — so a person
watching any of them sees what is about to be worked on, the way
`/fgOS:pick`'s users already could.

## Why one insertion point, not five

`fgos-coding-driving` is the one shared loop every interactive
coding-domain caller already drives through. Adding the display inside
that shared loop means all five callers get it automatically, with zero
duplication, and `/fgOS:pick`'s own step 3 could be simplified to drop
its now-redundant print, keeping only its `/fgOS:terminal` pane-rename
call. A scout pass confirmed `fgos-coding-driving` is exercised
exclusively by interactive/live sessions: the headless `--watch`/`--once`
runner (`src/runner/loop.mjs`) dispatches through a completely separate
mechanism (`spawnWorker`/`createDispatchWorktree` + direct
`resolveDecompose`/`resolveDiscovery` calls), never through this skill or
any `SKILL.md` at all. The rejected alternative — adding the same 3-line
display separately into each of `discover`/`decompose`/`discover-next`'s
own `SKILL.md` files — would have tripled the duplication this item
existed to avoid.

## Why once per invocation, not once per stage hop

A straight `/fgOS:cook` run driving an item through
`clarify -> decompose -> executing` in one continuous call prints the
title/description exactly once — right after the loop's pre-flight
checks pass for the first actionable iteration, before any
claim/`EnterWorktree` step, matching `/fgOS:pick`'s own existing
pre-switch placement. A local flag scoped to that one loop run (never
persisted state) suppresses the print on every later iteration of the
same call. If the loop later stops and something re-invokes
`fgos-coding-driving` on the same item later — a fresh `/fgOS:pick`, or
`/fgOS:cook` resuming after a parked question is answered — that counts
as a new invocation and prints again. This matches the real intent
(re-orient a human arriving at an item) rather than narrating every
internal stage transition.

## Why this doesn't implicate the interactive/headless transparency law

fgOS's own platform law requires mechanism and capability to stay
identical between an interactive session and a headless launcher — the
only legitimate difference is the launch trigger and the stop/ceiling
point. That law governs decisions and stage transitions, not terminal
output aimed at a human who happens to be watching. A headless daemon has
no human present to read a print statement, so scoping this display to
`fgos-coding-driving`'s interactive callers is not a capability gap — it
sits in the same "decoration, never a gate" category `/fgOS:pick`'s own
`/fgOS:terminal` pane-rename call already occupied.

## What stayed explicitly out of scope

`retro-next` was excluded on purpose, not by oversight: it resolves its
synthesis skill through the same registry `fgos-coding-driving` reads,
but hand-rolls its own inline invoke/move/classify sequencing afterward
instead of delegating to a shared driving primitive — a separate
architectural gap tracked as its own item (`tsk-3cx`). Once that item
lands, this display step should reach `retro-next` too, but that is
`tsk-3cx`'s footprint to claim, not this item's.

## Related

- `docs/history/fgos-coding-driving-item-display/CONTEXT.md` — the full
  decision record (D1: single shared insertion point; D2: once per
  invocation; D3: not a transparency-law fork; D4: `retro-next` deferred
  to `tsk-3cx`).
