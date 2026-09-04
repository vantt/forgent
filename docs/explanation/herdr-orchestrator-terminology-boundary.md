---
authoritative_for: the boundary between Herdr's own Rust "orchestrator" vocabulary (PaneOrchestrator, OrchestratorSettings, HerdrOrchestratorToggles — pane lifecycle/toggle mechanics in herdr-plugin/src/) and fgOS dispatch's own "orchestrator" glossary sense (the T0 composition layer that manages N units of work and stays attached, per docs/architect's own dispatch-control-plane-redesign.md §5.1) — two unrelated meanings sharing one English word, never to be conflated or renamed toward each other
---

# Herdr's `PaneOrchestrator` and fgOS's "orchestrator" are two different words that happen to be spelled the same

`tsk-10n` wrote a boundary/glossary note so a reader (or an agent doing a
find-and-replace) never confuses Herdr's pane-lifecycle Rust types with
fgOS's own dispatch-layer vocabulary — both use the word "orchestrator",
for unrelated reasons.

## The two senses

- **Herdr's `PaneOrchestrator`** (`herdr-plugin/src/ports.rs`) is a Rust
  trait governing pane open/reuse/focus — pure terminal-pane lifecycle.
  Its siblings `OrchestratorSettings`/`HerdrOrchestratorToggles`
  (`settings.rs`, `main.rs`) govern the `herdrOrchestrator` auto-launch
  config section (auto-discover/auto-merge/auto-retro/auto-cleanup pane
  launching). These are Rust port terms about **process visibility and
  control** — Herdr never holds task truth.
- **fgOS's "orchestrator"** (per `docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md`
  §5.1, and the current-vocabulary table added by `tsk-4he` — see
  [`d0026-native-first-dispatch-narrative-reconciliation`](d0026-native-first-dispatch-narrative-reconciliation.md))
  names the T0 composition layer that manages N units of work and stays
  engaged (ADR 0029's re-assignment of the word after `0028` retired its
  earlier "launcher"-adjacent sense). fgOS's own task authority always
  lives in the event log / state transitions, never in Herdr.

## What shipped

A new subsection ("Herdr Own Rust Vocabulary Is a Separate Namespace") was
added to the dispatch-control-plane-redesign doc — docs-only, no code
change — stating explicitly:

1. Herdr = runtime/visibility/process control only.
2. fgOS's event log / state transitions = the sole task authority.
3. `PaneOrchestrator` and its siblings are allowlisted as Rust port terms
   — never to be renamed to align with fgOS's glossary sense, and never to
   be read elsewhere in the repo as evidence that fgOS's own dispatch
   layer is being described.

Acceptance was verified live: `rg -n "orchestrator|PaneOrchestrator|Herdr"
docs herdr-plugin src` — every hit has a clear/allowlisted meaning.

## Where the doc lives now

The target file was later moved during an unrelated reorganization
("docs: organize agent coordination architecture", commit `ba7b62ac`) from
`docs/architect/dispatch-control-plane-redesign.md` to
`docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md`.
The subsection this item added survived that move intact — confirmed live
by reading the file's current content, not assumed from the item's own
merge record.

## Explicitly out of scope

No renaming, no code change to `herdr-plugin/src/` — this item is a pure
documentation boundary note. It does not relitigate ADR 0029's own
reassignment of "orchestrator" for fgOS, only prevents that reassignment
from bleeding into Herdr's unrelated Rust vocabulary.
