# Panel-depth experiment (Unit I27) design research

Read-only research, no files written by the fork. Produced to draft Unit
I27 in `plans/260919-coordination-skill-harness-simplification/plan.md`.

## 1. Current protocol structure

`core/coordination-protocols/architecture-advisory-panel-v1.yaml` (556
lines): 9 roles — `lead-advisor`, `context-investigator`, `system-shaper`,
`alternative-shaper`, `constraint-advocate`, `architecture-critic`,
`synthesizer`, `red-team`, `specialist` (optional slot, not a named
actor). Graph:

- `phase-framing` — `interpret-request` + `investigate-context`, parallel,
  unrestricted.
- `phase-shaping` — 3 shapers, parallel, `framing-shaping-open` vacuous
  window.
- `phase-critique` — `critique-proposals` + `assess-constraints`, both
  driver-authorized, gated by `post-shaping-open` (all 3 shapers settled);
  plus the optional specialist slot.
- `phase-synthesis` — `synthesize-recommendation`, gated by
  `post-critique-open` (both critique ops settled).
- `phase-redteam` — `red-team-packet`, gated by `post-synthesis-open`,
  `minTier: flagship`, `distinctProviderFrom: [synthesizer]` preferred.
- `phase-explanation` — `explain-recommendation`, gated by
  `post-redteam-open`.
- `phase-dialogue-reopen` — optional `revise-synthesis`/`revise-explanation`
  (`maxInvocations: 2` each); required `close-dialogue`.

Minimum required happy-path dispatch count with no reopen/specialist: 11
real operations (2+3+2+1+1+1+1).

## 2. Reduction candidates (evidence-based)

- **(a) Drop `phase-redteam` entirely** for a standard/low-risk profile —
  removes 1 full node, 1 actor (`red-team-actor`), the `flagship`-tier
  dispatch, and the `distinctProviderFrom` requirement. Cleanest,
  most defensible: red-team is its own structurally-separable post-synthesis
  phase, and the doctrine frames it as optional adversarial depth, not
  correctness-required for a low-materiality decision. **Selected as the
  standard variant's shape.**
- **(b) Merge `critique-proposals` + `assess-constraints`** into one op —
  both currently AND-gate `post-critique-open` together; a standard
  variant could route both through the architecture-critic alone, saving 1
  dispatch, but requires a new merged `contractTemplate` and changes the
  visibility-window AND-gate shape — more invasive than (a).
- **(c) Cap `phase-dialogue-reopen` at `maxInvocations: 1` (or 0)** instead
  of 2 — reduces worst-case dispatch count but doesn't shrink the *typical*
  happy-path critical path, since reopen is already optional/on-demand
  today. Weakest candidate.

## 3. Evaluation-corpus/proof precedent

No reusable "run N real cases, record outcomes" harness exists in this
repo. What exists is per-phase-cell **proof logs** (e.g.
`docs/architect/agent-coordination/verification/step-08-standalone-coordination/proofs/P04.2b/r8-live-proof-driver.mjs`
+ its own log output, and similar one-off driver scripts under
`step-08-standalone-coordination/proofs/P0*.*`, plus
`architecture-advisory-panel/proofs/P05.1/crash-proof-log.txt`) — each is a
bespoke, single-purpose script proving ONE mechanism once, not a reusable
multi-case corpus runner. Unit I27 must build the corpus/runner from
scratch, borrowing the PATTERN (a driver `.mjs` script + a logged
`.md`/`.log` proof artifact), not any code directly.

## 4. Cost estimate

Existing conformance tests
(`test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`,
15 tests) use fake/node executors and run in ~0.9-4.7s per test — synthetic
dispatch with no real model reasoning, useless for measuring decision
quality/dissent retention/factual error. A genuine experiment needs REAL
LLM-backed executors for both profiles. Minimum defensible corpus: 3-5 real
cases × 2 profiles (full vs. standard) = 6-10 real sessions, each with
8-11 real model calls across mixed tiers (including `flagship`/`frontier`)
— realistically several minutes of wall time per session, so **total
experiment wall time likely 1-5+ hours, plus real API spend across dozens
of frontier/flagship-tier calls.** Not a cheap or quick unit. User
explicitly confirmed proceeding at this cost (2026-09-28) after being shown
this estimate.

## 5. Registration mechanics

A new "standard" variant needs its own FlowDefinition YAML (new
`metadata.id`, e.g.
`core.coordination-protocol.architecture-advisory-panel-standard-v1`),
added as a new member entry in `core/protocol-packs/group-thinking.json`'s
`members` array (currently 5 flat `{id, version}` entries), and a new row
(or an extended existing row) in
`docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md`'s
"Surface Taxonomy" table with its own selection trigger (today's
`architecture-panel` row would need a second, distinguishable trigger
condition, e.g. keyed on a materiality/risk signal from the request).

## Unresolved (left to the implementer, not guessed here)

Whether the standard variant should be a genuinely new FlowDefinition file
(selected) or a documented "sub-mode" was a real design choice — Phase 5's
own wording ("must remain a separate registered protocol/preset") points
to the new-file approach, which is what Unit I27's scope requires.
