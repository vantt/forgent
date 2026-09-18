# Cell P03.2 — Protocol And Artifact Envelope (Doer Report)

Phase: `plans/260905-architecture-advisory-panel/phase-03-minimal-hard-shell-and-protocol.md`
Status: **Implementation complete, tests green.** Written before independent
Review/Red-Team, matching this track's own convention for a Doer report.

## What Was Built

1. `core/coordination-protocols/architecture-advisory-panel-v1.yaml` —
   registers `core.coordination-protocol.architecture-advisory-panel-v1`,
   1.0.0.
2. `core/protocol-packs/group-thinking.json` — added the pack entry (fifth
   member, alongside the three group-thinking-lite protocols and
   `standalone-master-coordination-loop`).
3. `test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`
   — 12 tests, all passing.
4. `test/verbs/coordination-group-thinking-pack-registration.test.mjs` —
   updated the two exact-membership assertions (4 → 5 members) that this
   registration necessarily changes; no other edit to that file.
5. No new definition-schema field, therefore no new focused
   definition-schema test (see "Artifact Envelope Decision" below).

No kernel file (`src/runner/**`) was touched. This is additive
registration only, as phase-03 requires for this cell.

## Minimum-Graph Reasoning (Requirement → Graph Node)

Read `architecture-advisory-role-doctrine.md`'s own "Shape Of The Panel"
diagram and all nine role sections, `P02.1.md`'s placement matrix, and
`P01.2.md`/`P01.3.md`'s real 8-phase advisory traces before designing this
graph. Every requirement in phase-03's own bullet list maps to a specific,
named graph element — none were added speculatively:

| Phase-03 requirement | Graph element | Why this shape |
|---|---|---|
| Independent work | `phase-framing` (interpret-request + investigate-context, both `required`, no contextRef naming the other) | Role doctrine: "the lead advisor... [is] blind to Phase 3" (interpretation must not depend on scout evidence) — neither op's dispatch can legally read the other's output by construction; nothing auto-grants it |
| Independent work (Phase 5) | `phase-shaping` (three shapers, `required`) | Same shape `independent-research-fan-out-fan-in-gated.yaml`'s own `independent-research` cohort uses — no auto-grant exists for a `required` binding's context, so nothing lets one shaper see another's real output |
| Controlled reveal | `phase-critique`'s three bindings (critique, assess-constraints, specialist) are `driver-authorized`, gated by `post-shaping-open` (opens only once ALL THREE Phase-5 ops have a qualifying linked result) | Exactly `independent-research-fan-out-fan-in-gated.yaml`'s own `post-independent-pass` window, applied to three distinct single-actor operations instead of one cohort — proven by this cell's own "premature reveal" test |
| Typed deliberation | `contributions.allowedTypes` on shape-*(proposal), critique-proposals/assess-constraints (objection), synthesize-recommendation (response) | Reuses the closed MVP8 enum exactly; no new type |
| Synthesis after ALL Phase-5 + critique | `synthesize-recommendation`, `driver-authorized`, gated by `post-critique-open` (opens after critique-proposals AND assess-constraints, which are themselves gated on all three shapers) | A real, transitive graph dependency — proven by the "hidden dissent" test (synthesis is refused outright while critique/assess-constraints are unsettled) |
| Recheck | `revise-synthesis`/`revise-explanation`, distinct operation ids from their originals, `driver-authorized` | Same "new Assignment under a distinct operation id, never a retry" shape `standalone-master-coordination-loop.yaml`'s own `revise-candidate` proves live (`coordination-run-live-proof.test.mjs`) |
| Specialists | `answer-specialist-question` via `specialistSlotRef: specialist-answer-slot` | Reuses Phase 09 MVP9's existing mechanism unchanged — see the named gap below |
| Park/resume | (no graph element) | Falls out of using `fgos coordination run`/the pack gate correctly — proven by this cell's own 7-call full-chain test |
| Bounded dialogue reopen | `revise-synthesis`/`revise-explanation` (`activation.maxInvocations: 2`) + `close-dialogue` (see below) | See "The close-dialogue Correction" |

## The close-dialogue Correction (found during test construction, not assumed)

While writing the full-chain conformance test I found a real design defect
in my own first draft: per the CoordinationSession contract's own
Multi-Operation Quorum Completion rule, a binding gates an actor's quorum
completion only when `required`, or `driver-authorized` AND it declares
`contextAccess.visibilityWindowRef`. `revise-synthesis`/`revise-explanation`
declare neither a window on purpose (see "grantedContextRefs Decision"
below) — so without a further fix, `lead-advisor-actor` would become
quorum-complete the instant `explain-recommendation` settles, and
`closeSessionByQuorum` (called unconditionally at the end of every
`runCoordinationUseCase` call) would close the session in that SAME call —
before a genuinely later, separate call could ever record the person's real
response. A closed session refuses `human-turn`/`authorize` outright
("session is not active").

Fix: added `close-dialogue` (role: lead-advisor, `driver-authorized`, gated
by a new `post-explanation-open` window that opens once
`explain-recommendation` settles) as lead-advisor's own THIRD gating
binding. The driver authorizes it only once satisfied no further reopen is
needed — this is the graph's own answer to "who decides the dialogue is
over": never automatic, always one explicit, bounded, driver-authorized
step. Proven by the full-chain test (`call5`/`call6` stay `closed: false`
after explanation and after one reopen; only `call7`'s `close-dialogue`
authorization brings quorum, and the session, to completion).

## grantedContextRefs / human-turn: Decision

`assertRefsOwnedBySession` (session-engine.mjs) explicitly refuses the
reserved `contribution:` namespace, but has no equivalent recognition for
`human-turn:` — a `human-turn:<id>` ref passed into an `authorize` step's
`grantedContextRefs` would pass through UNCHECKED, unlike
`assertDispositionRefOwnedBySession` (store.mjs), which genuinely validates
that namespace. Per phase-03's own "no speculative kernel work" instruction
and the team-lead's explicit preference, I did not extend
`assertRefsOwnedBySession` here. Instead, the intended sequence relies
entirely on the already-hardened path: an `authorize` step's free-text
`reason` field documents which human turn/disposition authorizes a reopen
(unenforced prose, exactly like every other `authorize` step's `reason` in
every sibling protocol) — never a `grantedContextRefs` entry naming the
human-turn ref itself.

**A second, previously-undisclosed gap found while building this, not
merely the one anticipated above:** `src/verbs/coordination/schema.mjs`'s
`assertSafeRefOrId` (the request-schema boundary a `disposition` step's
`targetRef`/`evidenceRefs` go through) has NO exception for either reserved
prefix (`contribution:` or `human-turn:`) at all — a colon fails the
charset check before the request ever reaches the store door's real
`assertDispositionRefOwnedBySession` logic. This means a `disposition`
step citing a `human-turn:<id>` ref is refused by ALL `fgos coordination
run`/pack-gate requests today, for ANY protocol, not just this one — even
though the underlying store-layer door fully supports and validates it (and
even has its own regression test,
`test/verbs/coordination-run-driver-steps.test.mjs`'s
"show marks a bare turnId disposition ref as NOT owned..." test, which
reaches it only by bypassing `validateCoordinationRequest` via a raw
`appendEvent` call). Consequence for this cell's design: the full-chain
conformance test's Phase-9 dialogue does NOT include a `disposition` step
citing the human turn (it would fail at the charset check, not prove
anything) — it relies solely on the `authorize` step's free-text `reason`,
which is legal today. The "human-authority impersonation" conformance test
is split into two parts for the same reason: Part 1 proves the guarantee
through this protocol's own real pack-gate dispatch path (a driver-attributed
human-turn step is refused); Part 2 proves the underlying kernel guarantee
(a never-recorded `human-turn:` ref is refused) via a **direct**
`recordDriverDisposition` call, because the pack-gate path cannot reach that
specific check today. Not fixed here — filed as a real gap for whoever owns
`src/verbs/coordination/schema.mjs` next, matching this track's own
disclosure convention (parallel to `tsk-5qj`/`tsk-1o4`).

## Artifact Envelope Decision

No new registry, no new schema field. `task.contractTemplate`
(`src/runner/definitions/schema.mjs`'s existing `OPERATION_TASK_FIELDS`,
already used identically by every sibling group-thinking-lite protocol) is
the existing artifact-envelope mechanism this document reuses — one inline
template id per operation (e.g.
`architecture-advisory-panel-v1-interpretation`). Identity comes from the
template id string plus the operation id; type from
`result.kind`/`contributions.allowedTypes`; provenance and revision are the
kernel's own, already-universal Assignment/RunResult/PolicyPatch-provenance
shape — no per-artifact additions needed. Consequently phase-03's item 5
("any focused definition-schema test required by the selected envelope")
does not apply: no new field was introduced, so there is nothing new to
test at the schema layer.

## Specialist Step-Type Gap (pre-existing, named, not fixed)

`src/verbs/coordination/run.mjs`'s own request-step vocabulary
(`operation | authorize | disposition | contribution | human-turn |
fan-out`) has no `specialist-authorize` step — a specialist slot can only be
authorized via a direct `authorizeSpecialistSlot` engine call today, never
through `fgos coordination run --file`/the pack gate. Same class of gap
P10.10 named and later closed for the `contribution` step (the underlying
door already exists and is fully proven; only the request-vocabulary
channel reaching it is missing). Per phase-03's own "no speculative kernel
work" instruction for this cell, not fixed here. Consequence: the
"unauthorized specialist" conformance test uses direct
`authorizeSpecialistSlot`/`authorizeDeclaredOperation`/
`dispatchDeclaredOperation` calls, not the pack gate.

## Tests

### New: `test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`

12/12 passing (`architecture-advisory-panel-conformance-run.log`):

1. Full chain across seven separate `runGroupThinkingRequest` calls —
   independent framing/shaping, gated critique/synthesis/red-team/
   explanation, a real human turn, one bounded reopen, and the driver's own
   `close-dialogue` — reconstructed from `replaySession` alone. Covers park/
   resume and crash/replay (nothing assumes one continuous process) and
   Work isolation implicitly (see below).
2. Premature reveal — `post-shaping-open` refuses authorization with only 2
   of 3 shapers settled; succeeds once all 3 have.
3. Foreign/stale refs — a grant citing a real Assignment from a DIFFERENT
   session is refused (`assertRefsOwnedBySession`'s cross-session check).
4. Hidden dissent — synthesis cannot be authorized while
   critique/assess-constraints are unsettled; the critique step is not
   skippable, by graph construction.
5. Missing actors — quorum reports the real, named missing actors and never
   closes early.
6. Unauthorized specialist — direct engine calls; refused with no prior
   `authorizeSpecialistSlot`, succeeds once authorized.
7. Over-cap reopen — `activation.maxInvocations: 2` admits exactly 2
   invocations and refuses the 3rd (the exact `authorizeOperation`
   lock-held mechanism P02.1's own N+1 probe confirmed live).
8. Wrong recheck revision (folded into #7's own assertions) — both reopens
   and the original synthesis Assignment remain distinct and readable; no
   supersession.
9. Terminal mutation — once closed, a further request is refused outright,
   zero new events.
10. Work isolation — a Work-lifecycle-shaped key (`approve`) is refused at
    the shared static request-schema boundary, exercised through this
    protocol's own dispatch path.
11. Human-authority impersonation — two parts (see the gap disclosure
    above): request-layer refusal of a driver-attributed human-turn step,
    and a direct-call refusal of a never-recorded `human-turn:` ref.
12. CLI/headless parity — the pack gate and a direct `runCoordinationUseCase`
    call produce identical step outcomes for the same protocol.
13. Heterogeneous actor bindings — two shaper roles resolve through
    genuinely different registered executors (`exec-family-a`/
    `exec-family-b`); the synthesizer's own higher tier resolves a
    genuinely different MODEL string on the SAME executor
    (`model-a-analytical` vs `model-a-critical`), read directly from the
    real `result.json` RunResult file — satisfying phase-03's own
    "a tier assertion counts only when the selected executor's model policy
    maps that tier to a distinct model" condition.

### Existing suites, unchanged in behavior

- Focused command
  (`test/runner/coordination-*.test.mjs`, `test/verbs/coordination-*.test.mjs`,
  `test/cli/coordination.test.mjs`, `test/architecture.test.mjs`):
  **756/756 pass** (`focused-suite-run.log`), including every existing
  RFC-Review-Lite/Nominal-Group-Lite/Delphi-Feedback-Lite/
  standalone-master-coordination-loop conformance test, run beside this
  cell's own new tests per phase-03's own instruction.
- `test/verbs/coordination-group-thinking-pack-registration.test.mjs`'s two
  exact-membership assertions were updated (4 → 5 registered protocols) —
  the only edit to a pre-existing test file, required by this registration
  itself, not a behavior change to anything else in that file.

## Impact Analysis / detect_changes

No kernel symbol was touched (pure YAML/JSON + new/edited test files), so
GitNexus impact analysis on a specific symbol does not apply to this cell's
own changes, per the process requirement's own carve-out ("Run GitNexus
impact analysis on any symbol you touch outside pure YAML/JSON/test
files").

`detect-changes` was run twice against the real, indexed repo
(`/home/vantt/projects/forgentX`, resolved via `gitnexus list` per this
repo's own multi-target-resolution rule — the index was stale relative to
this session's own commits, a pre-existing condition unrelated to this
cell):

- **Pre-commit, `--scope staged`, with ONLY this cell's 4 files staged**
  (the rest of this shared checkout's working tree carries substantial
  concurrent, unrelated work from other agents in this session — confirmed
  via `git status` before starting): `Changes: 4 files, 1 symbols... Risk
  level: low` (captured in this report's own terminal transcript at the time
  it ran, before the commit made the "staged" scope empty; not saved as a
  separate log file for that reason). The one "changed" symbol (`OUTPUTS`, a
  pre-existing constant in `coordination-group-thinking-pack-registration.test.mjs`)
  is incidental — GitNexus attributing a nearby unchanged declaration to the
  diff hunk, not a real behavior change.
- **Post-commit, `--scope compare --base-ref HEAD~2`**
  (`detect-changes-vs-head~2.log`): `Changes: 9 files, 11 symbols... Risk
  level: low`. Every symbol beyond this cell's own `OUTPUTS` line belongs to
  files this cell never touched (`docs/decisions/index.md`,
  `docs/history/**`, `docs/operator-runbook-herdr-cockpit.md`,
  `docs/specs/runner.md`) — the SAME concurrent, unrelated work already
  visible in `git status` before this cell began, picked up because
  `compare` diffs the whole working tree against the base ref, not just
  this cell's own two commits. Cross-checked against `git diff --stat
  HEAD~2..HEAD` (this cell's own two commits only touch the 4 files listed
  above) to rule out false attribution, per this repo's own
  `impact-analysis` capability-gate guidance.
- A plain `--scope compare --base-ref main` run was also attempted but is
  not useful evidence here: this branch (`group-thinking-plan-loop`) has
  diverged from `main` by many prior cells in this same track (285 files),
  so that comparison reports the whole branch's history, not this cell's
  own diff — disclosed rather than cited as if it were a clean signal.

## Real Gaps Found (filed, out of this cell's scope)

Two, both confirmed by direct source reading and empirical reproduction,
neither fixed here per phase-03's own "no speculative kernel work"
instruction:

- `src/verbs/coordination/schema.mjs`'s `assertSafeRefOrId` refuses every
  `contribution:`/`human-turn:`-prefixed `disposition.targetRef`/
  `evidenceRefs` entry at the request-schema charset check, for every
  protocol, even though the underlying store-layer door fully supports and
  validates both namespaces. Blocks a disposition from ever citing a real
  human turn or contribution through `fgos coordination run`/the pack gate.
- `src/verbs/coordination/run.mjs`'s request-step vocabulary has no
  `specialist-authorize` step, so specialist-slot authorization is
  unreachable through the pack gate for any protocol (same class as the
  pre-P10.10 `contribution` gap).

## Unresolved Questions

- Should the two gaps above be filed as tracked work items (`tsk-*`)
  the way `tsk-5qj`/`tsk-1o4` were for P03.1's own findings? Left for the
  Reviewer/Coordinator to decide, per this track's own escalation
  convention — not self-filed by this cell.
- Whether Phase 04's own role-doctrine projection needs the
  `disposition`-citing-`human-turn:` channel at all (versus the free-text
  `reason` channel this cell relies on) is a product judgment call left to
  Phase 04, not decided here.

Status: DONE
Summary: Registered `core.coordination-protocol.architecture-advisory-panel-v1`
(minimum graph: independent framing/shaping, window-gated critique/
synthesis/red-team/explanation, a specialist slot, and a bounded
driver-authorized dialogue-reopen gated shut by a new `close-dialogue` step
so quorum never auto-closes before a real human turn can arrive), added it
to the Group Thinking pack, and proved it with a 12-case conformance suite
(mostly through the real pack gate) plus the full existing 756-test focused
suite, all green.
Concerns/Blockers: Two previously-undisclosed, pre-existing request-schema
gaps found and disclosed above (human-turn/contribution refs illegal in a
disposition step; no specialist-authorize step type) — neither blocks this
cell's own correctness, both narrow what this protocol's "bounded dialogue
reopen"/"specialists" capabilities can prove through the pack gate today.
