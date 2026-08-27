---
type: how-to
title: How to add a drift guard for CLI registry help prose
tags: []
timestamp: 2026-08-15T07:35:00.000Z
source_capture_ids: [tsk-2so]
framework: diataxis
mode: how-to
---
# How to add a drift guard for CLI registry help prose

Use this when a verb's entry in `src/cli/command-registry.mjs` describes
its own precondition or an internal mechanism in hand-written English —
that prose is a real user surface (`fgos --help`, `fgos --help --json`,
and any agent reading it to decide which verb to call), and hand-written
English does not get updated automatically when the code it describes is
renamed or retired.

## The mistake this guards against

The `discover` verb's registry entry described its precondition as "an
item at stage clarify" and referenced "the judgeDiscovery subprocess
judge" for skipping the `--verdict` flag. Both were wrong by the time
anyone read them again: `clarify` had been fully retired as a stage for
the coding domain, and `judgeDiscovery` had been removed from `src/`
entirely.

> "(1) description viết 'Run context-discovery for an item at stage
> clarify' và 'Errors if the item is not at stage clarify' — sai cả hai
> vế: stage clarify đã retire hoàn toàn, còn điều kiện thật do
> discoverableStages quyết định là discovery hoặc exploring... (2) cùng
> description gọi 'the judgeDiscovery subprocess judge', và (3)
> description của cờ verdict cũng gọi 'the normal judgeDiscovery
> subprocess judge' — nhưng grep toàn bộ src/ không còn định nghĩa
> judgeDiscovery nào, hàm đó đã bị gỡ."
> — real item description, `tsk-2so`

The `plan` verb's entry had the matching problem: it pointed callers at
`discover` for "a clarify-stage item" and described skipping "the retired
subprocess judge" — the same two stale names, in a second location.

This is exactly the failure mode a stale doc has, except the reader here
is often another agent choosing a verb from `fgos --help --json`, not a
person skimming a markdown file — a wrong precondition or a reference to
a function that no longer exists can misroute an automated caller with no
human in the loop to notice the prose was wrong.

## Steps

1. Fix the prose itself to match the real, current behavior — read the
   real precondition from the code that enforces it, not from memory of
   what it used to be:

   > "The real precondition is computed by discoverableStages and yields
   > discovery/exploring" — corrected description, quoting
   > `bin/fgos.mjs` lines 1191-1197 as the source of truth,
   > `src/cli/command-registry.mjs` (commit `cefb0d6f`)

   The corrected text also stopped promising a subprocess judge that no
   longer exists, spelling out the real trust-signal path instead:

   > "'Omit it only when the item already carries a committed, non-empty
   > CONTEXT.md under its docsRef -- that readLockedContext trust signal
   > advances the item without a verdict. With neither, the call refuses:
   > no subprocess judge stands behind this verb anymore.'"
   > — corrected `--verdict` flag description, same commit

2. Add a drift guard test *derived from live sources*, not one that
   hardcodes today's retired names — a hardcoded list of "known-bad"
   names only catches names that are already known to be bad, and does
   nothing for the next rename. `test/cli/command-registry.test.mjs`
   built two such guards:

   - A judge-name guard that scans every `.mjs` file under `src/` for
     actual `judge*` declarations, then asserts no registry description
     names a `judge*` identifier outside that live set:

     ```js
     const declaration = /(?:export\s+)?(?:async\s+)?(?:function|const|let|class)\s+(judge[A-Za-z0-9_]*)\b/g;
     ```

   - A retired-stage guard that reads the domain's own `stages` array and
     `transitions` list (`DOMAINS[DEFAULT_DOMAIN]`,
     `src/state/workflow-stage-graphs.mjs`), computes which stage names
     appear in a transition but are no longer in `stages` (i.e. retired),
     and asserts no registry description names one of those.

   Both guards assert their own source set is non-empty first
   (`assert.ok(defined.size > 0, ...)` / `assert.ok(retired.size > 0,
   ...)`) — a guard that silently passes because its source query
   returned nothing is worse than no guard at all, since it looks green
   while checking nothing.

3. Add a third, verb-specific guard when the precondition itself is worth
   pinning directly, not just "no retired name appears": `command-registry.test.mjs`
   also asserts `discover`'s description literally contains each stage
   name `discoverableStages` currently returns, so the description can
   never silently fall behind that function's real output either.

## Why derive from live sources instead of a fixed list

A fixed list of "retired names to reject" is itself a second copy of
information the codebase already has canonically (`stages`, the set of
declared `judge*` functions) — it will drift the same way the prose it is
meant to guard against drifted, just one level removed. Deriving the
guard's own expectation from the same live source the precondition check
itself reads (`discoverableStages`, `DOMAINS[...].stages`) means the next
rename updates the guard's behavior automatically, with nothing left to
remember to also update by hand.

## Related

- `src/cli/command-registry.mjs` — the registry whose `description`
  fields are the guarded prose.
- `test/cli/command-registry.test.mjs` — the drift guards themselves.
- `src/intake/discovery.mjs`'s `discoverableStages` and
  `src/state/workflow-stage-graphs.mjs`'s `DOMAINS` — the live sources
  both the real precondition checks and the guard tests read from.

## Document history (compound-learn capture linkage)

This doc's path
(`docs/how-to/add-a-drift-guard-for-cli-registry-help-prose.md`) is
linked to a real compound-learn capture, gathered via `fgos doc-sources
docs/how-to/add-a-drift-guard-for-cli-registry-help-prose.md`:

> ```json
> {
>   "id": "tsk-2so",
>   "predicted": {"tier": "standard", "deps": 0, "priorVisits": 0, "role": "session", "branchHeadAtTake": "27153c24cd821b36e5e6c05e11b79d0c62eac41b"},
>   "actual": {"outcome": "awaiting-approval", "passed": true, "attempts": 1, "errorClass": null, "aheadCount": 1},
>   "docType": "how-to",
>   "docPath": "docs/how-to/add-a-drift-guard-for-cli-registry-help-prose.md"
> }
> ```
> — real `work.outcome` capture, id `tsk-2so`

If a later capture links to this same docPath, the export skill
accumulates it here too, additively, without losing this section or
anything above it.
