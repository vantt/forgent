---
type: explanation
title: "tsk-23z — fgos-coding-driving shows the claimed item's title/description before working it"
timestamp: 2026-08-11T05:20:00.000Z
---

# tsk-23z — fgos-coding-driving shows the claimed item's title/description before working it

## Feature boundary

`/fgOS:pick` already prints a claimed work item's `title`/`description` to
the user before starting work on it (tsk-62x, tsk-62x-2, done). This item
generalizes that same display to every OTHER interactive fgOS launcher
that drives a coding-domain item through its lifecycle — `/fgOS:discover`,
`/fgOS:plan`, `/fgOS:discover-next`, and `/fgOS:cook` — so a person
watching any of them sees what's about to be worked on, the same way
`/fgOS:pick` already lets them.

Scope is display only: no new gate, no confirmation, no blocking step —
this is observability for a human who is watching a live session, never a
capability or mechanism change (see D3 below for why that framing matters
against the interactive/headless transparency law).

## Locked decisions

**D1 — Single insertion point inside `fgos-coding-driving`'s own loop, not
duplicated per wrapper skill.** `fgos-coding-driving` is the one shared
loop every interactive coding-domain caller (`/fgOS:pick`, `/fgOS:discover`,
`/fgOS:plan`, `/fgOS:discover-next`, `/fgOS:cook`) already drives
through. Adding the display there means every one of those five callers
gets it automatically, with zero duplication, and `/fgOS:pick`'s own
already-shipped step 3 (tsk-62x-2) gets simplified to drop its now-
redundant title/description print, keeping only the `/fgOS:terminal`
pane-rename call. Scout confirmed `fgos-coding-driving` is exercised
exclusively by interactive/live sessions today — `src/runner/loop.mjs`
(the headless `--watch`/`--once` engine) dispatches through a completely
separate mechanism (`spawnWorker`/`createDispatchWorktree` + direct
`resolveDecompose`/`resolveDiscovery` calls), never through this skill or
any `SKILL.md` at all. Rejected alternative: adding the same 3-line
display separately into `discover`/`decompose`/`discover-next`'s own
`SKILL.md` files — leaves `pick` untouched but triples the duplication
this item exists to avoid (DRY, matches this repo's own `_shared/`
convention for reusable skill-prose logic).

**D2 — Print once per `fgos-coding-driving` invocation, never once per
loop iteration/stage.** A straight `/fgOS:cook` run that drives an item
through `clarify -> decompose -> executing` in one continuous call must
print the title/description exactly once, right after the loop's
pre-flight checks (park/anchor/ceiling) pass for the first actionable
iteration of that call — before any claim/`EnterWorktree` step, matching
`/fgOS:pick`'s own existing pre-switch placement exactly, so the position
is identical whether the first actionable stage is `clarify`/`decompose`
(no worktree involved) or `executing` (claim + worktree happens right
after). A local flag scoped to that one loop run (never persisted state)
suppresses the print on every subsequent iteration of the same call. If
the loop later stops (ceiling, human question, anchor) and something
re-invokes `fgos-coding-driving` on the same id later — a fresh
`/fgOS:pick`, or `/fgOS:cook` resuming after a parked question gets
answered — that is a NEW invocation, so it prints again: this matches the
actual intent (re-orient a human arriving at an item) rather than
narrating every internal stage hop.

**D3 — This is display-only, not a mechanism/capability fork, so it does
not implicate the interactive/headless transparency law.** That law
(mechanism and capability must be identical between an interactive session
and a headless launcher; the only legitimate difference is the launch
trigger and the stop/ceiling point) governs decisions and stage
transitions, not terminal output aimed at a human who happens to be
watching. A headless daemon has no human present to read a print
statement, so scoping this step to `fgos-coding-driving`'s own callers
(all interactive today, confirmed by D1's scout) is not a capability gap —
it is the same "decoration, never a gate" category `/fgOS:pick`'s own
`/fgOS:terminal` pane-rename call already occupies (its own `SKILL.md`
states this explicitly). Verified, not assumed: `src/state/
workflow-stage-graphs.mjs`'s `skillMap` comment (D5) confirms `cleanup`
is deliberately skill-less ("pure harness, no skill ever loads for it"),
and `/fgOS:cook`'s own hard rules confirm merge/approve is always
mechanical + human-gated, never skill-driven — so `cleanup-next` and
`merge-next` are correctly out of scope, not an oversight.

**D4 — `retro-next` is explicitly out of scope for this item.**
`retro-next` resolves its synthesis skill through the same registry
`fgos-coding-driving` reads (`skillMap.retrospective`), but hand-rolls its
own inline invoke/move/classify sequencing afterward instead of
delegating to a shared driving primitive — a real, separate architectural
gap, tracked as its own item (tsk-3cx) rather than folded in here. Once
tsk-3cx lands, this item's display step should reach `retro-next` too, but
that is tsk-3cx's own footprint to claim, not this item's.

## Footprint

- `.claude/skills/fgos-coding-driving/SKILL.md`
- `.agents/skills/fgos-coding-driving/SKILL.md` (verified byte-identical
  mirror of the file above as of this item; both must change together)
- `plugins/fgOS/skills/pick/SKILL.md` (simplify step 3: drop the
  title/description print, keep the `/fgOS:terminal` rename call)

No changes needed to `discover`/`decompose`/`discover-next`/`cook`'s own
`SKILL.md` files — they inherit the display purely by already invoking
`fgos-coding-driving` (D1).

## Scout evidence

- `plugins/fgOS/skills/pick/SKILL.md` step 3 (current, pre-refactor):
  reads the claimed item via `fgos list --id "<id>" --json` and prints
  `data.work["<id>"].title`/`.description`, treating both as untrusted
  text (never executed or interpreted) — the exact mechanism this item
  reuses.
- `.claude/skills/fgos-coding-driving/SKILL.md`'s own "Which existing
  loops are this loop" table lists `/fgOS:cook`, `/fgOS:pick`, a
  clarify-only sweep, a planning-only sweep, and an execution-only sweep
  as its five callers — all interactive/live-session callers, never the
  headless runner.
- `docs/specs/runner.md`'s "Một vòng --once" behavior section confirms
  the headless engine's own dispatch path (`spawnWorker` + a rendered
  prompt template) is structurally separate from any `SKILL.md`.
- `fgos tool query --capability impact-analysis --status present`:
  `gitnexus` present. Not applicable in practice — this item edits only
  `SKILL.md` prose, no code symbols for GitNexus's own impact graph to
  cover.

## Pinned terms

- **Interactive launcher** — any of `/fgOS:pick`, `/fgOS:discover`,
  `/fgOS:plan`, `/fgOS:discover-next`, `/fgOS:cook`: a command
  invoked inside a live, visible Claude Code session that drives a
  coding-domain item through `fgos-coding-driving`. Distinct from the
  headless `fgos-runner --watch`/`--once` daemon, which never invokes
  `fgos-coding-driving` or any `SKILL.md`.

## Canonical references

- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  (launcher/rootTask vocabulary)
- `src/state/workflow-stage-graphs.mjs` (`skillMap`, D5 comment on
  `cleanup`'s deliberate skill-less status)
- `docs/history/execution-fanout/CONTEXT.md` (precedent for the
  "caller contract" shape this item's D1 follows)

## Outstanding questions

None
