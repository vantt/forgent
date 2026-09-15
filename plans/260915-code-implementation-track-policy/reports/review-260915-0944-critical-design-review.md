# Critical Design Review — Code Implementation Track Policy

**Reviewed:** `plans/260915-code-implementation-track-policy/plan.md` (draft 2026-09-15)
**Reviewer posture:** adversarial on boundaries; every claim below is checked
against the live repo, not the plan's own description of it.
**Verdict up front:** **NO-GO as written; GO for a much smaller cut** (see
"Recommended MVP scope"). The plan solves a real symptom with the wrong
diagnosis and, in three of seven MVPs, rebuilds seams the repo already has.

## 0. The diagnosis is wrong — and that changes everything downstream

The plan's "Current Problem" says test policy is "loose prose such as *run the
target project's real test command*" and that agents therefore run the full
suite every cell. Evidence says otherwise:

| Claim in plan | What the repo actually says |
|---|---|
| plan-loop encourages full suite per cell | `core/skills/fgos-plan-loop/SKILL.md:564-565` — "run the phase's **focused** test in the worktree yourself"; `:575-576` — "Phases the plan marks as **full-suite gates** run the full suite before the merge"; `:444` close = "re-run the **phase's stated** test command". Targeted-per-cell + full-at-gate is already the skill's contract. |
| No checkpoint concept exists | `plans/260910-1700-rust-host-r1-kernel/plan.md:148-168` Product Gates marks P07/P09/P13/P15/P16 **"Full-suite gate."** and cell traces under `docs/architect/agent-coordination/verification/rust-host-r1-kernel/p07,p09,p13,p15.md` record it. This convention is dogfooded across a 17-cell track. |
| Wording is the cause of full-suite-every-cell | `plans/260915-0455-test-suite-feedback-cost/phase-0[0-8]-*.md` — **all nine** phase files put `npm test` in their own `## Verification`, and `plan.md` Track-Wide Invariant #2 says "each implementation cell runs the full suite once … before close". The plan author chose it (high-risk track editing the proof harness itself). That is a plan decision, not a skill defect. |
| "run the target project's real test command" is the generic wording | That string exists only in `domains/coding/skills/fgos-code-panel/SKILL.md:79,196,281,307` — a **single-change** skill where "the real test command" is the honest answer (one change, no track, no gates). |

Consequence: MVP2's premise ("stop the prompt templates from encouraging full
suite") targets text that already says the opposite; MVP1 "applied to the
already-running plan" would silently reverse an explicit plan invariant (#2),
which review rules forbid doing without surfacing it to the owner.

The real gaps, restated:

1. **No authoring template** for Work-independent tracks tells a planner to
   write a targeted Verification per phase and mark full-suite gates in Product
   Gates. Agents default to `npm test` when nothing tells them otherwise.
2. **Routing/naming drift**: the user says "code panel" for a multi-cell plan
   (the test-suite plan's own status line reads `READY FOR CODE PANEL` while
   its Execution Model says `fgos-plan-loop`). This is a description/routing
   problem, not an orchestration-layer problem.
3. **No baseline rule** in plan-loop. `master-coordinator.md:255-260` (TEST
   BASELINE: full run once before cell 1, record known failures) did not
   survive the distillation into `fgos-plan-loop`. Without it the plan's own
   checkpoint triage ("pre-existing vs patch-related") has nothing to compare
   against.

## 1. Accepted decisions

- **A1. Engine stays domain-neutral; no `npm test` in CoordinationSession or
  plan-loop core.** Correct, and already law: `test/architecture.test.mjs:10`
  (D12 domain-siloing — `core/`, `src/`, `bin/` cannot couple to a named
  domain) and ADR-007 §1 (one pure seam per domain). Keep.
- **A2. Targeted proof per cell, full proof at declared checkpoints and at
  final close before any main merge.** Correct — it is the existing
  master-coordinator/plan-loop/Product-Gates contract. Accept as a
  *restatement*, not a new policy.
- **A3. Reviewer/Red-Team evaluate proof sufficiency, not just correctness.**
  Good, cheap, and expressible today in the `review-candidate` /
  `red-team-candidate` objective text. Accept.
- **A4. Convention-first, no runtime schema in the first cut.** Accept — but
  the convention must be the *existing* one (Product Gates + per-phase
  Verification + Execution Inputs), not a new YAML vocabulary (see R1).
- **A5. Non-goals** (no test selection/caching/tiering here; do not make
  test-suite track a prerequisite). Accept.
- **A6. MVP4 manual prompt pack** — accept only as a *section* of the authoring
  template, not a separate deliverable (RUL11: one shape, not five files).

## 2. Rejected or risky decisions

- **R1. REJECT the `trackKind` / `executionPolicy` YAML contract.**
  It is a second, parallel machine-readable proof contract next to the Work
  path's `verify` field (`core/skills/_shared/coding-worker-contract.md:84-86`,
  the item's own `verify` command is the only thing that decides done) and next
  to the already-used Product Gates convention. Nothing reads it (schema
  `TOP_LEVEL_ALLOWED_KEYS` has no policy channel — `schema.mjs:509-512`), so it
  is a convention wearing a schema's costume: it invites a validator (MVP5),
  the validator invites a parser for `plan.md`, and plans become authority —
  which `documentation-management.md` explicitly says they are not ("Plans,
  reports … are stateful records. They do not become evergreen product
  authority"). Use the prose surfaces that already exist:
  - per-phase `## Verification` = `defaultCellProof: targeted`
  - Product Gates `**Full-suite gate.**` marker = `checkpoints`
  - plan.md Execution Inputs (track branch, cell branch convention, roster)
    = `merge` / `sync` / roster
- **R2. REJECT MVP6 as specified ("plan-loop injects code policy when
  `trackKind: code-implementation`").** A `core/` skill branching on a
  code-domain kind is exactly the coupling D12/ADR-007 forbid, just in prose
  instead of an import. The generic, legal version: plan-loop's objective
  composition always says *"run exactly the Verification this cell's phase
  file declares; run the track's full proof command only if plan.md marks
  this phase a full-suite gate"* — domain-neutral text, content owned by the
  plan. That is a ~4-line edit, not an MVP.
- **R3. REJECT MVP7 (code-panel as a two-mode facade).**
  `fgos-code-panel`'s entire contract is "self-contained … reading
  `fgos-plan-loop` is not required" (`SKILL.md:9-12,41-45`) and "a change big
  enough to need its own design discussion is a `fgos-plan-loop` track, not
  this skill" (`:62-65`). A facade that delegates to plan-loop's section-5
  loop either duplicates that loop (two documents that drift — the R1-kernel
  track already had to sync `claude` vs `claude-reviewer` roster wording
  between the two skills) or becomes a thin pointer — and a thin pointer is a
  one-paragraph routing fix, not a skill redesign. Naming answer to Q2:
  **neither** a facade nor a new skill. Fix routing: add "run / execute this
  code implementation plan / track" to `fgos-plan-loop`'s description; add an
  explicit "multi-cell plan → `fgos-plan-loop`" line to code-panel's
  description. The user keeps saying "code panel"; the router sends it to the
  right place.
- **R4. RISKY: `merge.trackToMain: finalOnly` as the default.** Real practice
  is per-cell / per-pair landings on main (`git log --merges`: `bc989a66`
  R2-P1+P2, `f6849be3`, `3cfa9a5d` P7, `13757075` …). Final-only merges
  maximise integration debt and block sibling tracks from catching up.
  Merge cadence must stay a per-plan choice in Execution Inputs; do not bake
  a default the repo's own history contradicts.
- **R5. RISKY: `sync.mainIntoTrack: atCheckpoints` + "sync-induced" triage.**
  This adds a new git step with its own failure class to a plan that says it
  is "about orchestration design". It is legitimate, but it is git policy,
  not test policy, and plan-loop's Non-Goals put every merge outside the
  session (`SKILL.md:64-70`). Move it to the authoring template as an
  optional Execution Input, out of the "verification policy" story.
- **R6. RISKY: MVP1 "can be applied to an already-running plan".** For the
  test-suite track this reverses Invariant #2 and nine phase files' stated
  Verification. Per review rules: present original decision / concern /
  trade-off / options to the owner; do not apply an addendum over it. (For
  that track specifically, full-per-cell is arguably *right*: it is editing
  the harness that judges everything else.)
- **R7. REJECT MVP5 in its stated form.** A validator that "only verifies the
  plan has a declared policy" is a YAML-presence lint — agents will emit the
  block and behaviour will not change. The failure mode you actually have is
  a phase file whose Verification says `npm test`. That is caught by a
  reviewer checklist line and the template, not by a script. Postpone until a
  second real consumer shows a script earns its keep (ADR-007 §4's own bar).

## 3. Missing design seams

- **S1. Instruction fragments (`domains/<domain>/instructions/`).** The repo
  already composes domain `law/boundary/procedure` fragments into host
  projections (`src/setup/instruction-registry.mjs:4-13`;
  `domains/coding/instructions/worktree-safety.md` is a live `kind: boundary`
  example). A `kind: procedure` fragment "coding verification discipline:
  run the verification your unit declares; the full suite belongs to the
  track's gates and the lifecycle's own verify/reverify, never to every
  doer/fixer round" is the canonical home for the rule. **Correction after
  checking the live path:** delivery is not automatic today. Only the `repo`
  target is ever rendered (`instruction-projections.mjs:240` `target ??
  'repo'`), so a `domain`-scoped fragment composes into `domain-coding` but
  nothing renders it; and this checkout has no materialized managed block in
  `AGENTS.md` at all (`inspectInstructionProjection` → `materialized: false`,
  effective set = `platform-operating-laws` only). So: put the rule in the
  fragment as the single source, and have the plan-loop/code-panel objective
  sentences (MVP-B) cite it — that is how it reaches workers until domain
  projection rendering lands under packaging-distribution's own track.
- **S2. Test baseline.** Master-coordinator's TEST BASELINE step
  (`master-coordinator.md:255-260`) is absent from plan-loop and from this
  plan. Checkpoint triage without a recorded baseline is guesswork. Add it as
  the first Execution Input of the template and step 0 of plan-loop §5.
- **S3. Blast-radius escalation rule (answers Open Question 4).** Reviewer /
  Red-Team dispatches are `result.kind: advisory` and can never mutate or
  expand their own step; only the Lead authors the next request. So: reviewer
  / red-team **report** "proof insufficient: targeted set does not cover
  <contract>" as a severity-tagged finding; if the Lead dispositions it
  `accepted`, the cell becomes a full-suite gate before close, recorded in the
  trace. Never "force". Add a *mechanical* trigger too: a cell whose diff
  touches the paths master-coordinator already lists as isolation-breaking
  (`:241-243` — dispatch/self-host hooks, session/replay/schema core, shared
  invariants, migrations, **test harness foundations**) or `package.json`
  scripts is a full-suite gate regardless of what Product Gates says.
- **S4. Trace field for proof mode.** The cell trace
  (`docs/architect/agent-coordination/verification/<track>/<cell>.md`) must
  record `Proof: targeted | full-suite-gate | escalated-to-full` + exact
  command + outcome. It is the only resumable record; MVP6's "close-cell
  wording" is the wrong place (a request `rationale` is not where a fresh Lead
  looks first).
- **S5. Relationship to the Work path.** Work items already have per-item
  `verify`, `fgos return` runs it, and `approve` does post-merge reverify
  (`work-state.md:1984` verify-fail-post-merge edge). The plan should state
  in one sentence that the Work-independent track mirrors that split
  (cell verify = item verify; checkpoint/final full = lifecycle
  verify/reverify) so the two proof models cannot diverge in vocabulary.

## 4. Recommended MVP scope

Cut seven MVPs to **two**, both docs-only, both landable in one cell:

**MVP-A — Authoring template + coding procedure fragment (replaces MVP1, MVP3,
MVP4, MVP5)**

- `docs/how-to/author-a-plan-loop-track.md` (or the location the docs nav
  already reserves): required sections = Execution Inputs (track/cell
  branch, roster, **baseline command + recorded baseline**, merge cadence,
  optional main-sync), Product Gates table with `**Full-suite gate.**`
  markers, per-phase `## Verification` that names targeted commands and
  **never** the full suite unless the phase is a gate, cell-trace `Proof:`
  field, and the five manual prompts from MVP4 as a "Lead checklist" section.
- `domains/coding/instructions/verification-discipline.md`, `kind:
  procedure`, projected to all coding workers (S1).
- A "living example" = a **new** Execution-Inputs block for the test-suite
  track presented to its owner as an *option*, not applied (R6).

**MVP-B — Routing + generic wording (replaces MVP2, MVP6, MVP7)**

- `core/skills/fgos-plan-loop/SKILL.md`: add baseline step to §5; put the
  domain-neutral verification sentence into the `produce` / `revise`
  objective templates and the proof-sufficiency sentence into `review` /
  `red-team`; add "run/execute this code implementation plan/track" to the
  description. No `trackKind`, no domain branch.
- `domains/coding/skills/fgos-code-panel/SKILL.md`: description gains one
  line "a multi-cell plan is a `fgos-plan-loop` track — this skill is one
  cell"; body unchanged.
- `npm run build:skills` + wrapper/projection tests.

Postponed (not rejected forever): validator script, CLI conveniences,
persisted checkpoint status, runtime refusal at close — each waits for a
second real consumer.

## 5. Concrete wording (answers Q7)

Doer / Fixer objective (plan-loop §1 and §3 templates; domain-neutral):

> Run exactly the Verification commands the phase file declares for this
> cell and report each command's real outcome. Do not run the repository's
> full proof command unless plan.md marks this phase a full-suite gate or the
> Lead's objective for this round says so explicitly.

Reviewer / Red-Team objective (§1 and §3):

> Judge proof sufficiency, not only correctness: if the declared targeted
> verification does not exercise a contract this diff changes, report it as
> a finding (HIGH if the gap is on a public or shared contract) and name the
> missing test or the reason a full-suite gate is needed. You cannot run or
> request the full suite yourself; the Lead decides on your finding.

Lead close rule (§4 / §5 step 5):

> Close with `Proof: targeted` only when no accepted finding named a coverage
> gap and the diff touches none of the isolation-breaking paths. Otherwise
> the cell is a full-suite gate: run the track's full proof command in the
> cell worktree, compare against the recorded baseline, triage every new
> failure as patch-related / pre-existing / environmental, and record
> `Proof: full-suite-gate` (or `escalated-to-full`) with the command and
> outcome in the trace before `close.json`.

Coding procedure fragment (one paragraph, S1):

> Verification discipline: a coding worker runs the verification its unit
> declares (a Work item's `verify`, a cell's phase Verification) and reports
> the real outcome. The full test suite belongs to declared gates — full-suite
> gate phases, track close, Work verify/reverify — never to every implement
> or fix round. A reviewer or red-team who believes the declared verification
> is insufficient reports a coverage finding; it never expands its own run.

## 6. Answers to the eight questions, compressed

1. Seam: the three-layer picture is fine as a *description*, but layer 3
   ("Code Implementation Policy") already exists as (a) plan prose conventions
   and (b) domain instruction fragments. Do not give it a new artefact.
2. Facade: neither code-panel nor a new skill. Fix routing descriptions.
3. SOLID: MVP6/MVP7 as written leak a code `trackKind` into `core/`; MVP-B's
   generic sentence does not.
4. Order: wrong because the list is wrong. Two docs-only MVPs, A then B.
5. Convention-first is safe *because* the enforcement point is the Lead's
   close + trace, and the reviewer checklist catches a phase file that says
   `npm test`. Validator-first would validate the wrong thing.
6. DoD: preserved only with S2 (baseline), S3 (mechanical + finding-driven
   escalation) and S4 (trace field). Without those three, "targeted per cell"
   is a proof hole, not a policy.
7. Wording: §5 above.
8. Reject R1, R2 (as specified), R3, R7; defer R4/R5 to per-plan Execution
   Inputs; do not apply R6 to the running track without its owner's decision.

## 7. Go / No-Go

- **No-Go** on the plan as drafted (seven MVPs, YAML policy contract,
  code-panel facade, plan-loop trackKind branch).
- **Go** on MVP-A + MVP-B as one docs cell, with the three missing gates
  (baseline, escalation rule, trace field) written in, and the test-suite
  track's Invariant #2 left untouched pending its owner's call.

## Unresolved questions (for the owner)

1. Test-suite track: keep full-suite-per-cell (Invariant #2) as deliberately
   chosen for a harness-editing track, or convert P03–P06 to targeted with
   P02/P08 as gates? Options above; reviewer leans keep for P00–P02, targeted
   for P03–P06, gate at P08.
2. Where does the docs nav want the track-authoring how-to — `docs/how-to/`
   or next to `master-coordinator.md` under `docs/architect/agent-coordination/playbooks/`?
