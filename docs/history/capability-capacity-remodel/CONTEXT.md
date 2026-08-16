---
item: tsk-34n
---

# CONTEXT.md — capability-capacity-remodel

## Feature boundary

Model `.fgos/config.json`'s `runner.capabilities`/`capacities` so a
purpose (e.g. `fgos-coding-implement`, the capacity id
`capacityIdForWork` resolves for the coding domain's `executing` stage)
resolves through the existing `for`/capability mechanism instead of
requiring a duplicate `capacities.<id>` entry with the same shape as the
real backend serving it. Add a shallow, field-limited override layer
(`capabilities.<name>.overrides`) for the case where the purpose needs a
different model/tier than the shared capacity's own default, without
duplicating the whole capacity object. Migrate the one real live case
(`fgos-coding-implement`) onto the new model.

This CONTEXT.md transcribes a converged live design discussion — see
`docs/history/capability-capacity-remodel/DISCUSSION.md` for the full
scout evidence, the Socratic back-and-forth (5 rounds), and every D-ID's
own reasoning. Every decision below was reached and confirmed there; this
doc is the locked, stable-shaped record `fgos-coding-planning` reads from.

## Locked decisions

| D-ID | Decision |
|---|---|
| D1 | Literal-key capacity lookup (`cfg.capacities[capacityId]`) always wins first — unchanged from today. `for`/`prefer` resolution is a purely additive fallback, only consulted when no literal key exists. |
| D2 | `capabilities.<name>` gains two new optional fields: `prefer` (a capacity id — that capacity **must** itself declare `for` including this capability name; symmetry required, no ungrounded assignment) and `overrides` (shallow-merged onto the resolved capacity, limited to exactly `rigorOverrides`/`providerModel`/`tier`/`model` — never `command`/`args`/`adapter`/`invocations`). |
| D3 | Migrate `fgos-coding-implement`: delete the duplicate `capacities.fgos-coding-implement` entry, add `"for": ["fgos-coding-implement"]` to the existing `agy` entry, register `capabilities["fgos-coding-implement"] = {description, prefer: "agy"}`. No `overrides` needed today — `agy`'s current tuning already matches what this purpose needs. |
| D4 | One shared resolution function must apply the full order (literal → `prefer`/`for` → native-default) and any `overrides` merge — both `spawnWorker`'s own separate `cfg.capacities[capacityId]` lookup (`dispatch.mjs:1577-1579`, used for model resolution) and `resolveExecutorConfig`'s internal lookup (used for command/args) must call it, never keep their own direct lookups. Found live: fixing only one would leave `model` and `command` resolving inconsistently after the duplicate entry is removed. |

## Pinned terms

- **capability** — a named purpose/job (`runner.capabilities.<name>`), e.g.
  `"fgos-coding-implement"`. Describes *what* work needs doing, never *who*
  does it.
- **capacity** — a concrete registered backend (`runner.capacities.<id>`),
  e.g. `"agy"`. Declares `for: [...]` naming which capability names it
  serves.
- **symmetry** (D2) — a capacity named by `capabilities.<name>.prefer`
  must itself declare `for` including `<name>` — `prefer` is a
  tie-breaker among self-declared servers, never a way to assign serving
  status a capacity never opted into.

## Scout evidence (cited, from DISCUSSION.md's live rounds)

- `src/runner/dispatch.mjs:1512-1515` (`capacityIdForWork`) always
  resolves the coding domain's `executing` stage to the literal string
  `"fgos-coding-implement"`.
- `src/runner/dispatch.mjs:1023-1029` (`resolveCapacityIdForPurpose`) —
  existing `for`-based lookup, first-match, no ambiguity handling — the
  `prefer` field (D2) is the fix for that gap.
- `src/runner/dispatch.mjs:695-699` — `capacity.for` is already validated
  as a non-empty string array; "one capacity serves several capabilities"
  needs no new mechanism.
- `src/runner/dispatch.mjs:787-805` (`validateCapabilitiesShape`) — today
  only allows `{description?, aliases?}`; `prefer`/`overrides` are real
  new fields needing new validation.
- `src/runner/dispatch.mjs:482-495` (`DEFAULT_TIER_TO_POLICY`,
  `MODEL_POLICY_TIERS`) and `agy`'s live `rigorOverrides` — grounds why
  `overrides` needs to exist (a purpose may want a different rigor
  mapping than the shared capacity's own default).
- `src/runner/dispatch.mjs:1577-1579` (`spawnWorker`'s own separate
  model-resolution lookup) — the real gap D4 closes; live-proved this
  matters via `tsk-1m8`'s own end-to-end `agy` dispatch run.
- `.agents/skills/fgos-fanout/SKILL.md` (~line 105-120) and a live
  `decide --work tsk-49o --has-live-task-access` run against this repo's
  real config — confirmed `fgos-fanout` is currently non-functional for
  every coding candidate as a side effect of `tsk-1m8`+`tsk-pdg`; the
  person confirmed this is not urgent (the team has never used
  `fgos-fanout` in a real plan) and self-resolves once this item's
  migration (D3) lands.
- Impact-analysis posture: **degraded** — GitNexus registered/present but
  this session's own index was flagged stale at session start; every
  citation above was cross-checked by direct source read, not blast-radius
  tooling alone.

## Outstanding questions

None
