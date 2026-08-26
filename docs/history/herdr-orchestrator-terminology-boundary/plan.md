---
type: plan
title: tsk-10n — Herdr runtime boundary and orchestrator terminology
tags: []
source_capture_ids: [tsk-10n]
---

# tsk-10n — Herdr runtime boundary and orchestrator terminology

Mode: tiny (0 flags: no auth/authorization/data-model/audit-security/
external-system/public-contract/cross-platform/existing-covered-behavior/
weak-proof/multi-domain concern applies — this is a single-file docs
addition with zero code-behavior change, per fgos-routing's own Mode-gate
table applied directly since no lane was handed off before this session
reached `planning`).

No `CONTEXT.md` exists for this item — discovery's own verdict was `clear`
(this session, `RESEARCH.md` round 1), which skips `exploring` outright;
the shape below is dictated by evidence already gathered there, not a
product decision that needed Socratic locking.

## Problem

The item's own acceptance criteria ask for three things:

1. State plainly that Herdr = runtime/visibility/process control.
2. State plainly that fgOS's event log/state transition = task authority.
3. Allowlist `PaneOrchestrator` as a legitimate Rust port term, never
   blindly renamed to match fgOS's own "orchestrator" vocabulary.

`RESEARCH.md` round 1 already found (2) below trivially — (1) and (2)
already exist, near-verbatim, in
`docs/architect/dispatch-control-plane-redesign.md` §12.1 "Herdr Runtime
Role" (Herdr is runtime/orchestration/visibility; is not the authority for
whether a work item is done/blocker resolved/review passed/artifacts
accepted; those facts come from runner state, structured agent events,
artifact refs, and verification) — and the same file's own glossary
already defines fgOS's sense of "orchestrator" (line 123: "T0 composition
layer that manages N units of work and stays attached"). Only (3) is
genuinely missing anywhere in the repo.

## Approach

Add one new subsection to `docs/architect/dispatch-control-plane-redesign.md`,
immediately after §12.1 ("Herdr Runtime Role"), naming the Rust-side
`PaneOrchestrator`-family identifiers as a distinct, intentional vocabulary
from fgOS's own "orchestrator" glossary entry two sections earlier in the
same file — never touching that existing glossary entry itself.

Rejected alternative: a brand-new standalone glossary/boundary doc (e.g.
under `docs/explanation/`). Rejected because §12.1 already carries 2 of the
3 acceptance points and a fresh file would either duplicate that prose or
force a cross-reference two files apart for one coherent boundary
statement — one doc reads cleaner than two, and the item's own scope note
names this exact file as the primary target ("có thể chạm
docs/architect/dispatch-control-plane-redesign.md").

Rejected alternative: a doc-comment inside `herdr-plugin/src/ports.rs`
next to `pub trait PaneOrchestrator`. Would likely prevent "blind
renaming" more effectively than prose in a markdown file, but the item's
own scope line restricts this task to docs files only — honored as given,
not reopened (`RESEARCH.md` round 1, point 6).

Files touched: `docs/architect/dispatch-control-plane-redesign.md` only.
No split — one honest, small piece of work. Not on `fgos graph`'s own
`criticalPath` and blocks nothing (`topUnblock` empty for this item) — no
ordering dependency on other in-flight work.

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| New subsection contradicts or duplicates the existing "orchestrator" glossary entry (line ~123) | low | verify command's second clause re-asserts that exact string still reads unchanged |
| Naming only `PaneOrchestrator` misses its sibling Rust identifiers (`OrchestratorSettings`, `HerdrOrchestratorToggles`, same `herdr-orchestrator`/`herdrOrchestrator` naming family, confirmed real in `herdr-plugin/src/settings.rs`/`main.rs` — `RESEARCH.md` round 1, point 2) | low | the new subsection explicitly names the whole family, not just the one literal string the acceptance text quotes |
| Manual judgment needed on whether "every hit has a clear meaning" (993 raw `rg` hits) | low | `RESEARCH.md` round 1, point 1: the volume is concentrated in a small number of documented senses (product name / fgOS glossary entry / Rust identifier family), not per-occurrence ambiguity — the new subsection is what makes every sense resolvable, not a per-line audit |

Impact-analysis capability gate: checked live at validating
(`fgos tool query --capability impact-analysis --status present`) —
`gitnexus` is registered and `present`, so the posture is `full`, not
`inactive` (corrected after `fgos-coding-validating`'s reality gate caught
the earlier mislabel — `full` only means the MUST rules apply when a proof
point actually leans on blast-radius evidence; this plan's risk map has no
such row, since the change is prose-only with no call graph or renamed
identifier involved, so no MUST rule is triggered despite the `full`
posture).

## Shape

In `docs/architect/dispatch-control-plane-redesign.md`, directly after
§12.1 "Herdr Runtime Role" (after the line "Those facts come from runner
state, structured agent events, artifact refs, and verification."), add:

```markdown
### 12.1a Herdr's Own Rust Vocabulary Is a Separate Namespace

Herdr's Rust implementation (`herdr-plugin/src/`) names several of its own
types with "orchestrator" in Rust-identifier casing: the `PaneOrchestrator`
trait (`ports.rs`) governing pane open/reuse/focus, and the
`OrchestratorSettings`/`HerdrOrchestratorToggles` structs (`settings.rs`,
`main.rs`) governing the `herdrOrchestrator` auto-launch config section
(auto-discover/auto-merge/auto-retro/auto-cleanup pane launching). These
are Rust port terms describing Herdr's own pane-lifecycle and toggle
mechanics — a different vocabulary from this document's own "orchestrator"
glossary entry above (§2/wherever the term glossary lives: the T0
composition layer that manages N units of work and stays attached). Do not
rename `PaneOrchestrator` or its sibling identifiers to align with that
glossary sense, and do not read a `PaneOrchestrator`/`OrchestratorSettings`
citation elsewhere in the repo as evidence fgOS's own dispatch layer is
being described.
```

(Exact glossary section reference resolved against the live line number
when writing, not hardcoded here — the line 123 citation above is
`RESEARCH.md` round 1's own evidence, subject to drift as the file is
edited.)

## Outstanding questions

None
