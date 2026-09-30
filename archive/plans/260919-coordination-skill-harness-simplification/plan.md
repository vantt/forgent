---
status: completed
---

# Coordination Skill and Harness Simplification

Status: **CLOSED** (2026-09-28) — all 7 phases integrated, Unit I35 (final
unit) merged at `main@9dfb5b8f4`. See "Track Closure Summary" below for the
phase-by-phase breakdown. Full history: Phase 2 integrated at `main@5a02e81a`; Units I02/I03 integrated at `main@4362bfec`; Unit I04 integrated at `main@7472bd74`; Unit I06 integrated at `main@3bab9b99` (evaluated candidate `d75d311d`); Unit I09 verified at `main@1ca4023c` (REV-15 fix `60132825`; post-merge baseline verified at `main@f63f7e7d`); Unit I07 integrated at `main@261ed7ea`; Unit I08b integrated at `main@ba8f6a9d`; Unit I10 integrated and verified at `main@605d26fe` (carried through `main@26a1038e` and `main@ac19f6d1`); Unit I08 VERIFIED at `main@ac19f6d1` (RV-01/RV-02 remediation candidate `132d3777` + `ac19f6d1` integrated; acceptance gate verified: full suite 7647 pass exit 0, 10/10 isolated coord, 10/10 isolated dispatch, 60/60 parallel load pass; timing instability recorded as LOW debt); Unit I11 VERIFIED at `main@7d7dc2750f9fb80716a7cffae03d67605629cf9a` (candidate code `9cf843b6`, approved tip `3a67a1b9`, synchronized merge `3d706b89`; post-merge verification satisfied: 155/155 focused rerun pass, full suite 7652 pass exit 0; candidate regressions = 0); Unit I12 VERIFIED/integrated at `main@c782a08dfcae89279dcb1ca9fb59aa73fb58c515`; Unit I13 VERIFIED/integrated at `main@dc05f7586b78483d569bc25b929b988dc56a374c`; Unit I14 VERIFIED/integrated at `main@3cb80c91c` (candidate `f857eaeab`; review APPROVE at `7d01a12e2`; remediation `c03a959c7`; focused matrix 210 pass / 0 fail, full suite 7684 pass / 0 fail; Phase 4 entry gate satisfied); Unit I15 (Phase 4) VERIFIED/integrated at `main@8e8a3f1aa` (candidate `38e552bb9`; approved tip `c343304b3`; focused matrix 192 pass / 0 fail, full suite 7693 pass / 0 fail; Phase 5 open / ready); Unit I16 VERIFIED/integrated at `main@a48ce987c` (candidate `6d75b54e1`; focused matrix 12 pass / 0 fail, skills matrix 29 pass / 0 fail; Phase 5 open / ready); Unit I17 VERIFIED/integrated at `main@d6c0d9033` (candidate `37833e331`; review APPROVE at `8864ea596`/`37833e331`; 40/40 doctrine pass, 124/124 matrix pass; Unit I19 unblocked); Unit I19 VERIFIED/integrated at `main@525a641a` (candidate `352200cde`; full suite 7781 pass / 0 fail; Phase 5 work item 2 / Unit I21 unblocked); Unit I18 VERIFIED/integrated at `main@8ece3bbdc` (candidate `8306c36d1`; 3 fix rounds; full suite 7813 pass / 0 fail via fresh worktree); Unit I20 VERIFIED/integrated at `main@09db1fad4` (candidate `027636e4e`; 1 fix round); Unit I21 VERIFIED/integrated at `main@9d1fbc99d` (candidate `ed4de649c`; 3 fix rounds — closed a real executor-pin bypass, a CLI-override regression, a live confinement regression on architecture-advisory-panel, and an idempotent-start regression; full suite 7803 pass / 0 fail; Phase 5 work item 2 satisfied); Unit I22 VERIFIED/integrated at `main@387570ed3` (candidate `0076ba66f`; 3 fix rounds — closed a HIGH content-loss finding, a repo-wide constraints-rendering bug, 2 MEDIUM content-loss findings, and a scope-wording issue; full suite 7906 pass / 1 fail confirmed pre-existing flake; Phase 5 work item 1 satisfied); Unit I23 VERIFIED/integrated at `main@94c2aaf49` (candidate `0e936aa89`; 1 fix round — closed 2 real test-coverage gaps plus stale skill prose and a pre-existing untested gate-refusal path; full suite 7923 pass / 0 fail; Phase 5 work item 3 satisfied); Unit I24a VERIFIED/integrated at `main@35be2c10d` (candidate `6b0420295`; 1 fix round — closed a real idempotency gap, a DAG-mode ref-edge gap, and corrected H3's "ONLY run --file" wording to cover all raw request doors; full suite 7929 pass / 0 fail; Phase 5 work item 4 part 1 satisfied, I24b unblocked); Unit I24b VERIFIED/integrated at `main@5c63ac40d` (candidate `88691f646`; 1 fix round — closed 2 HIGH findings (missing idempotent-retry branch, action-view/kernel exhausted-flag mismatch) and an invocation-count key mismatch; full suite 7937 pass / 0 fail; Phase 5 work item 4 fully satisfied); Unit I25 VERIFIED/integrated at `main@165bae767` (candidate `04811fb3e`; 0 fix rounds, no HIGH/MEDIUM findings; full suite 7939 pass / 0 fail; Phase 5 work items 5/6 satisfied); Unit I26 VERIFIED/integrated at `main@63ac08f5f` (candidate `933b32b87`; 2 decomposition-review rounds before implementation, 1 fix round after — closed a real disposition-vocabulary/kernel-classifier contradiction plus 3 other MEDIUM findings; full suite 7938 pass / 0 fail; Phase 5 work items 7/8 satisfied, Phase 5 fully done pending only the 3 already-deferred Exit-criteria measurements — see Phase 5's own note); Unit I28 VERIFIED/integrated at `main@5eea48c3b` (fix-round-1 closed a missing capability allowlist, a vacuous plan-lint gate, and 5 other findings; full suite 150/150 targeted pass; Phase 6 creation half satisfied); Unit I29 VERIFIED/integrated at `main@4fc1756e8` (0 fix rounds; stubbed fgos-plan-loop/fgos-code-panel to 73/90 words; Phase 6 fully done); Unit I27 VERIFIED/integrated at `main@1abad5857` (29 real LLM-backed dispatches, real blind-scored 3-case comparison, genuine mixed result — dissent/content retention favors full protocol, factual accuracy split direction across cases; Phase 5's panel-depth Exit criterion closed); Unit I30 VERIFIED/integrated at `main@638cf1332` (contractVersion added to show/chain, PolicyPatch canonical/legacy doc drift fixed; 68/68 pass); Unit I32 CLOSED (2026-09-28, investigation-only, 0 commits — readOnlyRedirects vs capability.prefer confirmed genuinely orthogonal, no migration); Unit I31 VERIFIED/integrated at `main@2dbc7c8de` (capability.undeclared promoted to hard refusal at plan-lint's real emission site; 41/41 pass); Unit I33 VERIFIED/integrated at `main@5f4ed37b8` (group-thinking pack reclassified via per-member kind field, not a physical split; all 6 members confirmed resolving); Unit I34 VERIFIED/integrated at `main@baed9b22e` (drift-test suite completed; found and allowlisted a real 9-of-13-protocols-missing-templates gap; full suite 7982/0 fail); Unit I35 VERIFIED/integrated at `main@9dfb5b8f4` (final unit — before/after report using the real Phase-0 baseline, replay-corpus comparison 10/10 pass, track-wide CHANGELOG close; Phase 7 fully done, TRACK CLOSED)
Created: 2026-09-19
Last Updated: 2026-09-28
Mode: high-risk
Primary assessment:
`plans/reports/coordination-skill-harness-architecture-audit-260919-report.md`

## Track Closure Summary (2026-09-28)

All 7 phases integrated and verified. Per-phase status:

| Phase | Status | Key units | Note |
|---|---|---|---|
| **Phase 0** — Baseline, drift inventory, contract reconciliation | CLOSED | I00-I01 | Established the `coordination-baseline.v1` measurement harness and the reproducible before-numbers Unit I35 later cited directly (no reconstruction needed). |
| **Phase 1** — Typed coordination action view | CLOSED | I02-I03 | Integrated `main@4362bfec`. |
| **Phase 2** — Semantic request composers and CLI surface | CLOSED | (Phase 2 candidate) | Integrated `main@5a02e81a`. |
| **Phase 2A** — Post-Phase-2 integration baseline and result truth | CLOSED | I04-I05 | Integrated `main@7472bd74`. |
| **Phase 3** — Operation prompt-template registry and resolver | CLOSED | I06-I08b | Integrated across `main@3bab9b99`/`main@ac19f6d1`/`main@ba8f6a9d`. |
| **Phase 3A** — Dispatch governance and operability completion | CLOSED | I07-I08 | Full suite 7647 pass at acceptance gate. |
| **Phase 3B** — Cold-resumable coordination DAG forward-port | CLOSED | I09-I10 | Integrated `main@1ca4023c`/`main@605d26fe`. |
| **Phase 3C** — Combined integration gate | CLOSED | I11 | Integrated `main@7d7dc2750f`; 0 candidate regressions. |
| **Phase 3D** — Dispatch boundary simplification | CLOSED | I12-I14 | Integrated `main@3cb80c91c`; Phase 4 entry gate satisfied. |
| **Phase 4** — Extract shared driver discipline, prove via plan-loop | CLOSED | I15 | Integrated `main@8e8a3f1aa`. First proof the driver-discipline-fragment pattern removes duplicated kernel-rule prose without losing safety content. |
| **Phase 5** — Rewrite architecture-panel and generic panel surfaces | CLOSED | I16-I27 (12 units) | Last merged: I27 at `main@1abad5857`. All 3 originally-deferred Exit-criteria measurements now resolved: architecture-panel word budget superseded (7,969-word baseline accepted, documented reason); panel-depth experiment run for real (I27, genuine mixed result, not a clean win either way); the ≥60% Lead-instruction-token-reduction measurement remains explicitly DEFERRED, not measured — this track never built that specific before/after methodology, left open and non-blocking per its own original disposition. |
| **Phase 6** — Merge plan-loop and code-panel into `fgos-code-change` | CLOSED | I28-I29 | I28 `main@5eea48c3b`, I29 `main@4fc1756e8`. `fgos-plan-loop`/`fgos-code-panel` are now 73/90-word deprecated stubs; all real operational content verified carried into `fgos-code-change`. |
| **Phase 7** — Contract, migration, distribution, and closeout | CLOSED | I30-I35 (6 units) | Last merged: I35 at `main@9dfb5b8f4`. See below for what shipped vs. what was explicitly deferred. |

### Phase 7 detail (what shipped)

- **I30**: data-level `contractVersion` on `show`/`chain`; canonical/legacy `flow-definition.md` PolicyPatch doc-drift fixed (`capability`, `distinctProviderFrom`, and I32's `readOnlyRedirects` clarification, all ported and byte-verified identical across both copies).
- **I32**: investigated `placementPolicy.readOnlyRedirects` vs. `capabilities.code:review.prefer` — confirmed genuinely orthogonal (layered primary + dispatch-time safety net), no config migration needed.
- **I31**: `capability.undeclared` promoted to a hard `plan-lint` refusal at its one real emission site (the `--cell` no-match branch) — closes the capability-declaration compat window at cell-open time.
- **I33**: `group-thinking` protocol pack reclassified via a per-member `kind` field (not a physical split — verified a split would have broken `fgos-architecture-panel`'s live dispatch); stale `fgos:code-panel` distribution-doc label fixed.
- **I34**: drift-test suite completed — 6 of 9 named checks confirmed already covered, 3 genuine gaps closed with new tests. Found and allowlisted (not fixed) a real, significant gap: 9 of 13 registered CoordinationProtocols have zero authored prompt templates, silently falling back to a legacy prompt path.
- **I35**: `/fgos:code-change` distribution row added; before/after report published using the real checked-in Phase-0 baseline (no reconstruction) — `fgos-plan-loop`+`fgos-code-panel` combined 12,209 words → `fgos-code-change` 2,314 words (**-81.05%**); `fgos-architecture-panel` 9,006 → 7,969 words (**-11.51%**); no token-count claim made (`inputTokens: null` in both measurements); replay-corpus comparison 10/10 pass, `semanticDigest` identical to Phase 0's; track-wide CHANGELOG entry closes `[Unreleased]`.

### Explicitly deferred, not silently dropped (real follow-up candidates)

1. **Protocol-id rename** (`standalone-master-coordination-loop` → `produce-review-revise`, phase's original item 4a): deferred entirely. `protocol-loader.mjs` has no alias mechanism (duplicate ids within a tier are hard-rejected), the id has ~29 code/test references plus ~120 doc references, and `launch-master-loop.mjs` hardcodes the old id. Doing this safely needs either accepted YAML-body duplication or new engine alias-support — disproportionate for a closeout phase. Recorded in I33's own decision block.
2. **Stub removal** (`fgos-plan-loop`/`fgos-code-panel`, kept loadable for the "Phase 7 compatibility window"): deferred, with an explicit trigger recorded — safe once (a) the protocol-id question above is resolved and (b) a replay-compatibility check confirms no committed session/replay artifact still needs either stub's presence.
3. **9-of-13 protocols missing prompt templates** (found by I34): `declared-consult`, `deliberation-delphi-chain`, `deliberation-nominal-group-chain`, `deliberation-rfc-chain`, `group-cognition-framework`, `group-thinking-delphi-feedback-lite`, `group-thinking-nominal-group-lite`, `independent-research-fan-out-fan-in`, `independent-research-fan-out-fan-in-gated`. Real content gap needing domain authorship this closeout unit had no authority to invent; allowlisted with a regression-catching companion test.
4. **`distinctProviderFrom` doctor check**: confirmed no dedicated `fgos doctor` check exists (I35); accepted as a documented known gap (the limitation is already named in `binding.mjs`'s own comments), not invented as new scope.
5. **`≥60% Lead instruction-token reduction`** (Phase 5's own third originally-deferred Exit criterion): never measured — no before/after Lead-prompt-size methodology was built this track. Left open, non-blocking, per its original disposition.
6. **`preferInvocation`/`repeatMode` PolicyPatch fields** (found by I30): undocumented in both the canonical and legacy `flow-definition.md` copies — out of I30's declared `capability`/`distinctProviderFrom`-only charter.
7. **`fgos:code-change` command-registry slash-command visibility**: `pack list --json` still strips the `kind` field I33 added to `group-thinking.json` (source-of-truth in the file, not yet CLI-visible) — a `group-thinking-pack.mjs` change, out of I33's file-ownership scope.

None of the 7 items above block this track's own Exit criterion (a cold agent operating `fgos-code-change`/`fgos-architecture-panel` from thin skills, typed status, and operation-local prompt packets — verified true for the 4 protocols that DO have real templates and the two facades this track rebuilt). All 7 are real, named, evidence-backed candidates for future work, not silent gaps.

Detailed Phase 0 design:
`plans/260919-coordination-skill-harness-simplification/phase-00-baseline-and-action-contract.md`

Detailed Phase 2 design:
`plans/260919-coordination-skill-harness-simplification/phase-02-semantic-request-composers.md`

Phase 2 readiness audit:
`plans/260919-coordination-skill-harness-simplification/reports/phase-02-readiness-audit.md`

Integrated-track sources:

- `plans/260917-cold-resumable-coordination-dag/plan.md`
  (`implementation-track--cold-resumable-coordination-dag`, reference tip
  `fc259498`; forward-port required, not a merge-ready branch);
- `plans/260920-2217-dispatch-engine-hardening/plan.md` (Phases 05/08/09 plus
  the still-unmerged Phase 01 result-truth remainder).

## Execution model

This track is intentionally **not** executed through `fgos-plan-loop`, a
coordination cell chain, or any review/advisory panel. Those mechanisms are
part of the subject being simplified and would add cost before the shared
control boundary is proved.

The Lead owns audit and design inline. Implementation is handed to a cheaper
executor later as small, sequential units. Each unit must name one canonical
capability, exact files/symbols, invariants, tests, verification commands, and
stop conditions. The executor must run `dispatch decide` for that capability
immediately before execution; the plan never pins an executor, provider,
model, or tier.

No implementation unit may begin while the repository baseline is ambiguous.
The dirty-checkout reconciliation gate in the Phase 0 design is therefore the
first executable unit, not administrative cleanup.

The owner has required this track's planning/audit work to remain inline: no
panel, coordination cell, `fgos-plan-loop`, or external executor is used to
author this plan. The capability annotations below still govern later
independently executable implementation/review/test units; each executing
session runs `dispatch decide` immediately before its own unit.

## Track-local lean verification policy

Approved 2026-09-26. This is an execution-policy correction for this track,
not a change to CoordinationSession, FlowDefinition, Work lifecycle, or the
fgOS runtime being built.

The active I12 implementation/review chain was already running under the older
prompts when this policy was approved. It is grandfathered: do not interrupt,
restart, invalidate, or ask those live sessions to discard evidence merely
because this policy changed. Apply this policy to the next newly issued
fix/re-review/integration prompt and to later units. Evidence already produced
under the stronger old policy remains valid.

### Evidence ownership

- **Doer:** implementation correctness, reversible cell commits, cell-local
  focused proof, and one durable candidate evidence manifest/report.
- **Independent Reviewer:** aggregate semantic/adversarial review, risk-based
  mutation probes, and one full-suite run on the exact reviewed candidate.
- **Track Manager:** SHA/ancestry/dependency truth, evidence completeness,
  relevant-drift assessment, integration authorization, and post-merge truth.

A later role does not rerun a prior role's valid evidence by default. Rerun
only when the candidate SHA changed, relevant main/environment drift exists,
the evidence/log is missing or non-reproducible, or a new finding puts the
covered invariant in doubt.

### Proof tiers

- Every reversible cell runs its focused behavior, boundary/import, and
  compatibility tests plus `git diff --check`; it does **not** automatically
  run `npm test`.
- Authority/result-truth checkpoint cells run the broader affected matrix.
- A long multi-cell unit runs `npm test` at named checkpoints and at final
  candidate, not after every structural commit.
- Independent review runs one full suite on the exact candidate. Mutation
  proof is mandatory for high-risk authority/result-truth/cache boundaries;
  structural cells may rely on a mutation-sensitive static/focused test when
  that test directly locks the boundary.
- Track Manager spot-checks only unresolved/high-risk evidence before review
  or integration, then runs one post-merge full suite. It does not repeat the
  reviewer's whole matrix without a named reason.

For I12 specifically: targeted proof for every R; broader settlement/
confinement/Herdr checkpoint after R5; final focused matrix plus full suite
after R9; reviewer full suite once; Track Manager post-merge full suite once.

## Integration ownership and baseline rule

This track is now the coordination point for the remaining work from the two
adjacent tracks above. It does **not** absorb their old branches wholesale or
rewrite their settled contracts:

- Phase 2 remains the semantic-composer implementation and must first land as
  one independently reviewed, clean commit range on current `main`.
- Dispatch hardening already merged through `main@a5b1535c` is baseline, not
  work to repeat. Remaining result-truth, Phase 05, Phase 08, and Phase 09 work
  is reconciled forward from post-Phase-2 `main`.
- The DAG branch is evidence and a porting source. Its worktree has been
  observed in an unfinished merge with kernel conflicts; no integration unit
  may resolve or merge that worktree. DAG capability is forward-ported onto a
  fresh branch from the shared integration baseline.
- Phase 3, dispatch-hardening completion, and DAG forward-port may execute on
  separate branches from the same baseline where their file sets permit it.
  None is declared complete until the combined integration gate passes.
- Dispatch-hardening Phase 09 is deliberately last: it moves the same
  Assignment/Run/Herdr boundaries Phase 3 and DAG consume, so doing it earlier
  would create avoidable semantic and merge churn.

## Cross-plan status accounting contract

The three related plans remain the durable human-readable execution record:

- this parent integration plan;
- `plans/260917-cold-resumable-coordination-dag/plan.md`;
- `plans/260920-2217-dispatch-engine-hardening/plan.md` and each affected
  `phase-NN-*.md` file.

No unit that implements, verifies, reviews, integrates, supersedes, or defers
work from one of these plans is complete until the same candidate updates every
affected plan/phase status. Status documentation is part of the unit's commit,
not a later cleanup task and not a separate track ledger.

Every affected status update must record, in a consistent visible section:

1. one explicit state: `not-started`, `in-progress`, `implemented`,
   `verified`, `integrated`, `superseded`, `deferred`, or `blocked`;
2. the exact unit/requirement covered (for example I02, DAG P05, or dispatch
   Phase 05 R6), without marking an entire phase complete for a partial result;
3. source branch, candidate SHA, base/integration SHA when known, and whether
   the change is merely implemented, independently reviewed, or merged;
4. direct verification evidence: commands, pass/fail/skip counts, report path,
   and any environmental limitation;
5. disposition of every remaining requirement: next unit, explicit deferment,
   superseding current-source evidence, or blocker/owner decision;
6. the exact next eligible action and dependency gate;
7. `last verified` date and the source revision against which the statement was
   checked.

Rules:

- Never use a bare `DONE`, `CLOSED`, or `PASS` when only a subset is complete.
- Historical evidence is preserved; append/correct current status rather than
  rewriting old verification as if it ran on the new baseline.
- A forward-port updates both the receiving integration plan and the source
  plan whose requirement it consumes, with a pointer between them.
- A superseded requirement needs direct current-source/test evidence; silence
  or branch age is not a disposition.
- A merged commit without synchronized plan status is integration-incomplete
  and does not unlock its dependent unit.
- Within a multi-cell unit, do not copy the same SHA/count/status into every
  affected plan after every cell. Synchronize cross-plan accounting at three
  milestones only: candidate ready, independent-review verdict, and
  integrated/post-merge verified. A blocker that stops the unit is recorded
  immediately as an exception.
- Reviewers must compare plan statuses with Git ancestry, current source, and
  independently run tests; implementer narration alone is not proof.
- Status remains documentation projected from Git/source/test truth. Do not add
  a status database, event log, scheduler, daemon, or track-state file.

## Goal

Replace oversized, drift-prone coordination skills with thin judgment
surfaces over a shared protocol-aware control layer, without weakening
CoordinationSession authority, FlowDefinition legality, evidence provenance,
provider diversity, or cold resume.

Deliver in this order:

1. shared control contracts and measurement;
2. semantic composers and a clean post-Phase-2 integration baseline;
3. result-truth reconciliation, prompt-template resolution, dispatch
   governance/operability completion, and cold-resumable DAG forward-port;
4. combined authority/replay/concurrency verification, then dispatch boundary
   simplification;
5. the shared driver discipline, proved through plan-loop as the first
   implementation-track consumer;
6. architecture-panel and generic panel surfaces as the second, unlike
   consumer of that same discipline;
7. one coding facade (`fgos-code-change`) replacing plan-loop and code-panel
   after the shared coding-cell boundary has been proved.

Plan-loop is not the universal core and never becomes it. The generic loop is
the driver discipline (see Architecture), a shared doctrine fragment every
coordination facade loads; plan-loop is only its first consumer. Coding-only
mechanics stay out of that discipline and out of architecture advisory.

## Locked architectural direction

- Skills own judgment and user-facing intent interpretation.
- A shared control layer owns deterministic coordination mechanics.
- CoordinationSession and FlowDefinition remain the only authority for legal
  execution, evidence, visibility, and close.
- Semantic commands are request composers over the existing use cases, never a
  second engine or state store.
- No raw request JSON is required in normal plan-loop/panel operation.
- No autonomous command may accept/reject a finding, authorize optional work,
  or close a session without an explicit driver action.
- Prompt/doctrine content is loaded per operation, not wholesale per skill.
- Coding worktree/test/merge rules remain outside the domain-neutral core.
- Existing session replay and legacy raw-request compatibility remain valid.

## Non-goals

- No new Work lifecycle or Mission/track persistence entity.
- No daemon, mailbox, peer-chat service, general-purpose scheduler, or second
  event log. The bounded request-scoped, read-only DAG ready-frontier scheduler
  already proved by the adjacent DAG track is the sole scheduler exception and
  must reuse the current Assignment/dispatch doors.
- No arbitrary dynamic mutation of a session's FlowDefinition graph.
- No provider/model selection ontology in skills.
- No redesign of Assignment, Run, or RunResult.
- No attempt to make every protocol use the same cognitive role roster.
- No deletion of deep doctrine or historical verification; only remove it from
  always-loaded runtime instructions.
- No code-panel rewrite before plan-loop and architecture-panel prove the
  shared seams.

## Success measures

### Correctness

- A session's actionable status is derived from replay plus its immutable
  definition snapshot.
- Every state-changing semantic command reaches the existing validated
  run/close use cases.
- A caller cannot provide a target or binding that disagrees with the action
  token/status snapshot without a loud stale/conflict refusal.
- Explicit close is the sole normal close action; stale auto-close claims are
  removed from runtime skills and current contract docs.
- Legacy raw request sessions replay identically before and after the change.

### Skill quality

- `fgos-plan-loop` fits within 1,500 words (target 800–1,200) — VERIFIED at
  1,233 words (Phase 4/I15).
- `fgos-architecture-panel`'s original "≤1,500 words, target 800-1,200"
  ceiling is SUPERSEDED (Lead decision, user-confirmed 2026-09-28, do not
  reopen): that target was set before this skill's actual final scope was
  known — it assumed the same shape as `fgos-plan-loop` (a pure
  router/facade), but `fgos-architecture-panel` is a different kind of
  skill: it holds the real orchestration doctrine a Lead needs to safely
  run a 9-role protocol (Driver Disposition vocabulary, Executor Roster,
  Bounded Reopen Scope, Fresh-Session Resume), not just dispatch/routing
  logic. I22 already extracted every per-role/actor-facing packet into
  templates (970→736 lines, 9006→6866 words at integration, since grown to
  7,969 words post-I26's own hook-table addition) — what remains is
  Lead-only content with no further safe extraction target identified.
  New baseline: `fgos-architecture-panel` at 7,969 words (measured
  `main@63ac08f5f`, post-I26) is the accepted current state; no further
  unit is required to chase the original 1,500-word number.
- Neither skill embeds full request JSON, field-by-field schema copies,
  source-line citations, or executor incident history.
- A cold Lead can resume from one status command plus the task/plan artifact,
  without prior chat narration.

### Performance

- Record baseline and post-change prompt bytes/tokens, dispatch count,
  sequential waves, retries, no-evidence outcomes, and wall time.
- Reduce Lead-side coordination instruction tokens by at least 60% for both
  plan-loop and architecture-panel.
- Do not increase dispatch count or sequential-wave count for an equivalent
  protocol execution.
- Operation workers receive only their own prompt packet and granted task
  context, not the full coordinator doctrine.

## Architecture

```text
fgos-panel / fgos-plan-loop / fgos-architecture-panel / fgos-code-panel
                         |
                         v
              coordination control layer
              - projectActionView()
              - semantic request composers
              - prompt template resolver
                         |
                         v
        runCoordinationUseCase / closeCoordinationUseCase
                         |
                         v
       CoordinationSession + FlowDefinition + Dispatch runtime
```

The names above are illustrative until implementation impact analysis. The
boundary is the commitment; exact module and symbol names are implementation
details.

### Layering above the control layer

Decided 2026-09-26 (owner discussion; advisory record
`plans/reports/architecture-advisory-260926-1322-phase4-loop-driver-layering-report.md`).
The kernel, control layer, and protocols above are already correctly layered;
the drift is in the skill layer, where four concerns were fused.

```text
Facades (skills: intent, unit selection, delivery)
  fgos-panel (router) · fgos-architecture-panel · fgos-code-change
        |                        |                      |
        |                        |            coding-cell policy (domain: coding)
        v                        v                      v
Driver discipline — shared doctrine fragment, no code, no state:
  observe(status) -> choose one legal action -> dispatch -> verify evidence
  -> disposition -> adapt (revise / recheck / retry / ask human)
  -> explicit close or continue -> continuity artifact
        | reads action view                 | writes via semantic commands
        v                                   v
Coordination control layer -> CoordinationSession + FlowDefinition + Dispatch
        ^
Interaction protocols (declared FlowDefinition data, not a decision layer)
```

| Concern | Owner | Never owns |
|---|---|---|
| Legality, authority, mutation gating, evidence, quorum | kernel + control layer | judgment |
| Interaction shape: roles, graph, activation, visibility/reveal windows, contribution types, dissent/ranking, reopen bounds | protocol (FlowDefinition) | which legal action to take, disposition, when to ask a person, when to close |
| Loop judgment: which legal action, independent verification, disposition, revise/recheck/retry, human escalation batching, explicit close, cold resume from status + artifact | driver discipline fragment | domain vocabulary (`git`, worktree, merge, tests, phase, `plan.md`), any persisted state |
| Unit selection, hook values, delivery | facade | restating kernel, protocol, or discipline rules |
| Worktree, proof tiers, independent doer verification, merge after explicit close, tested/integrated identity | coding-cell policy (coding domain) | track/plan assumptions |

The driver discipline names hook slots each facade fills: unit of iteration,
open inputs, evidence verification, disposition criteria, adaptation bounds,
human-escalation triggers, close criteria, after-close action, continuity
artifact. It is generic only when two unlike facades (plan-loop, then
architecture-panel) consume it unchanged.

Naming decisions (owner, 2026-09-26):

- `core.coordination-protocol.standalone-master-coordination-loop` is a
  protocol for one work product: produce, independent review + red-team,
  driver-authorized revise, recheck. Target id:
  `core.coordination-protocol.produce-review-revise`. Renamed in Phase 7 only,
  with the old id still loadable for existing session replay.
- `fgos-plan-loop` and `fgos-code-panel` merge into one coding facade,
  `fgos-code-change`, in the coding domain: a single change is a plan with one
  cell. Plan mode is a reference file loaded only when the execution target is
  a plan/track. Old skill names remain deprecated stubs until the Phase 7
  compatibility window closes. (`fgos-code-implement` was rejected: it collides
  with the Work-stage skill `fgos-coding-implement`.)
- `fgos-group-thinking` is a protocol-pack gate, not a discussion skill; it is
  folded into `fgos-panel` in Phase 5 while the gate itself stays in code.
- "Panel" means advisory, never mutation; "change" means mutation.

## Phase 0 — Baseline, drift inventory, and contract reconciliation

### Objective

Establish a measurable baseline and remove false assumptions before building a
new facade.

### Work

1. Inventory current public coordination commands, request step types, and
   engine use cases from the command registry and source.
2. Identify every current-source claim that `run` always auto-closes or that
   no explicit close door exists. Classify each as current contract,
   historical verification, or stale runtime guidance; update only current
   sources.
3. Reconcile CLI help/error strings with the registered `close` command.
4. Capture baselines for representative runs:
   - one clean plan-loop cell;
   - one plan-loop cell with accepted finding, revision, and recheck;
   - one clear architecture-panel case;
   - one architecture-panel dialogue reopen;
   - one generic RFC/NGT/Delphi protocol.
5. Record prompt bytes, skill words, dispatch count, sequential waves,
   durations, retries, and evidence outcome. Record token usage when the
   provider returns it; otherwise mark it unavailable and retain prompt bytes
   as the reproducible denominator.

### Proof

- focused CLI/use-case tests for explicit close and help registry;
- a checked-in measurement report and reproducible measurement command;
- a zero-behavior-change replay comparison over the legacy session corpus.

### Exit

No current runtime skill or current contract tells a caller that close is
implicit when it is not. Baseline metrics exist before optimization begins.

### Detailed handoff

The evidence already established, remaining measurements, proposed
`coordination-actions.v1` boundary, and implementation-ready units are in
`phase-00-baseline-and-action-contract.md`. That document is authoritative for
Phase 0 execution details; this plan remains the cross-phase architecture and
ordering contract.

## Phase 1 — Typed coordination action view

### Objective

Give machines a single replay-derived answer to “what is legal next?” without
letting the projection make a driver judgment.

### Contract

Add a versioned read model resembling:

```json
{
  "contractVersion": "coordination-actions.v1",
  "coordinationId": "...",
  "phase": "...",
  "readyToClose": false,
  "blockers": [],
  "actions": [
    {
      "kind": "authorize-and-dispatch",
      "actionKey": "sha256:...",
      "nodeId": "phase-revision",
      "operationId": "revise-candidate",
      "targetActorId": "fixer",
      "requiredInputs": ["reason", "contextRefs"]
    }
  ]
}
```

Rules:

- derived only from current replay, definition snapshot, and existing pure
  evaluators;
- `actionKey` binds the projection to the session event sequence/definition
  digest so stale actions refuse;
- describes legal choices but never chooses one;
- distinguishes “legal”, “required”, “optional”, and “blocked”;
- returns protocol-owned disposition vocabulary and close blockers;
- exposes compact output by default and replay detail only on request;
- shared by `status`, `chain`, and later facades—no second derivation.

### Cases

- fresh session;
- required operation not dispatched;
- failed finding awaiting disposition;
- accepted finding awaiting remediation;
- remediation awaiting one or both rechecks;
- visibility window closed/open;
- specialist slot available/unauthorized/exhausted;
- human-turn recorded with reopen budget available/exhausted;
- ready-to-close and close-refused states;
- corrupt or schema-version-mismatched session;
- stale action after a concurrent event append.

### Exit

A cold caller can select an exact legal action without parsing prose or
guessing ids. No write path is added in this phase.

## Phase 2 — Semantic request composers and CLI surface

### Objective

Replace hand-authored request JSON for normal operation while preserving the
raw `run --file` compatibility/power-user door.

### Commands

Implement only verbs backed by real kernel actions:

- `coordination start`
- `coordination operation`
- `coordination authorize-and-dispatch`
- `coordination fan-out`
- `coordination contribution`
- `coordination human-turn`
- `coordination disposition`
- `coordination close`
- `coordination recover` (retain/currently implemented)
- `coordination status`

Do not add a standalone `reveal` write verb. Visibility windows open from
persisted evidence and are reported by `status`; a request cannot declare a
derived window open.

### Safety

- Every write command requires session driver identity through the existing
  authority checks.
- Mutating operation/fan-out paths require explicit `--cwd` and retain the
  existing worktree/mutation rules.
- Commands consume an `actionKey` or equivalent event-sequence precondition
  from the action view when selecting a replay-dependent target.
- The composer generates deterministic command/authorization/invocation ids;
  callers may supply stable ids for retry but may not silently change payload.
- Same id + same normalized payload is idempotent; same id + different payload
  is an explicit conflict.
- The composer calls the existing request validator and use case; it does not
  invoke store/session-engine mutation functions directly.

### Exit

All representative Phase 0 sessions can be operated without request files,
with byte-equivalent session semantics and explicit close.

## Phase 2A — Post-Phase-2 integration baseline and result truth

### Objective

Turn the independently approved Phase 2 candidate into the single baseline
from which Phase 3, dispatch completion, and DAG forward-port branch. Close the
remaining RunResult truth gap before any new consumer depends on quorum or
replay evidence.

### Gates

- **Satisfied:** independent review approved exact Phase 2 candidate
  `43fdd378` for Phase 3 readiness: current local `main` is its ancestor,
  focused verification reported 138 pass / 0 fail, and no unresolved
  contract/authority/atomicity finding remains. The only dirty tracked path is
  this concurrent planning update, not Phase 2 implementation drift.
- **Satisfied:** approved Phase 2 candidate `43fdd378` merged without conflict
  into `main` at `5a02e81a` (first parent `a5b1535c`), with a tree
  byte-identical to the approved candidate, then pushed to `origin/main`.
- **Satisfied (Unit I02):** Re-evaluated commit `9049e611` from branch
  `dispatch-hardening-phase01-r1r4` against post-Phase-2 source. Forward-ported
  evaluator `interpretRunResult` routing (R1) and dynamic artifact path
  resolution `resolveWorkerArtifactPath` in `aggregationSourceFrom` (R4 / M14).
- **Satisfied (Unit I02):** Implemented Phase 01 R5: late normalized output of
  superseded controllers is preserved as non-authoritative
  `result.superseded.json`, protecting authoritative `result.json` and refusing
  authoritative settlement without discarding completed worker work product.

### Invariants

- `interpretRunResult` remains the only acceptance interpretation for linked
  RunResult evidence.
- Corrupt or internally inconsistent RunResult evidence fails closed and
  cannot satisfy quorum, close readiness, DAG dependency settlement, or
  reviewer/red-team success.
- Report/artifact paths resolve through current provenance helpers, never a
  hardcoded filename.
- No result-truth repair weakens Phase 2 driver identity, action-key atomicity,
  explicit-close, or schema 1/2/3 replay compatibility.
- `result.superseded.json` is strictly non-authoritative: it is never consumed by
  `classifySessionQuorum`, `closeSessionByQuorum`, or `replaySession`.

### Exit

Post-Phase-2 `main` baseline reconciled with Phase 01 result truth;
focused coordination, RunResult, replay, stale-action, and concurrency tests
pass (11 suites, 312 tests passing, 0 failing); all following branches start
from this verified integration baseline. Detailed integration report:
[integration-i02-result-truth.md](reports/integration-i02-result-truth.md).

## Phase 3 — Operation prompt-template registry and resolver

### Objective

Make FlowDefinition's existing `task.contractTemplate` reference useful so
role doctrine no longer has to live in the coordinator skill.

### Design

1. Define a registry/discovery model for template ids at project, domain, and
   core scopes, following existing precedence without allowing a lower-trust
   project template to widen organization policy.
2. Resolve one template for the exact operation at dispatch time.
3. Render only bounded variables supplied by the validated semantic action:
   objective, artifact/context refs, expected outputs, role, constraints, and
   evidence contract.
4. Persist template identity, version/digest, and rendered prompt digest in the
   Assignment/dispatch provenance already available for prompt templates; do
   not invent a second event log.
5. Snapshot or otherwise pin enough content to make retry/replay attribution
   deterministic when a template changes.
6. Treat missing/ambiguous templates as loud configuration faults with setup /
   doctor registration if new installed assets or config are introduced.

### Guardrails

- Template text cannot grant authority, mutation, context, budget, or
  visibility beyond the engine contract.
- Portable FlowDefinitions continue to name requirements, not executor/model
  pins.
- A template may refine cognitive instructions and artifact shape; it cannot
  alter graph legality.
- Existing definitions with no resolvable template retain an explicit legacy
  objective path during migration.

### Exit

At least one plan-loop operation and two unlike advisory operations resolve
real templates through the same mechanism, proving the seam is not
coding-specific.

## Phase 3A — Dispatch governance and operability completion

### Objective

Finish the still-relevant work from dispatch-hardening Phase 05 and Phase 08
without folding dispatch policy into coordination composers or prompt
templates.

### Phase 05 reconciliation

1. Revalidate R5 against current provider/model resolution. Design a distinct
   model lookup from provider-family governance only if current source still
   conflates them; do not introduce an abstraction solely to satisfy stale
   prose.
2. Complete R6's cross-provider redirect contract: schema, validation,
   provenance, refusal behavior, and compatibility for pool entries must be
   explicit before accepting `crossProvider:true`.
3. Resolve R7 with the settled `executor-policy-dispatch-seams` authority:
   retain a used PlacementPolicy binder or delete genuinely dead shadow
   machinery and its obsolete tests/docs. Do not create two selection
   authorities.
4. Complete R8 by moving the adapter registry to a leaf only after impact
   analysis proves the import-cycle cut preserves adapter registration and
   setup/doctor discovery.

### Phase 08 reconciliation

- Add typed dispatch refusal reason codes and the public dispatch
  decide/execute/log surface while retaining the documented Node entry alias.
- Normalize `--run`/`--run-id`, validation exits, watch/inspection vocabulary,
  and not-found behavior without changing coordination CLI contracts.
- Register every new public command and any config/env/tool assumption in the
  command registry, setup merge, and doctor checks.
- Measure polling/backoff changes; do not merge a latency regression hidden as
  an operability cleanup.

### Ordering

Phase 08 begins only after Phase 2 is integrated because both modify
`bin/fgos.mjs`, `src/cli/command-registry.mjs`, changelog, and registries.
Phase 05 remainder may run alongside Phase 3 after the common baseline, but
any change to Assignment policy/provenance must be included in Phase 3's
template-provenance integration tests.

### Exit

There is one provider-family/governance vocabulary, one redirect authority,
discoverable public dispatch operations, and setup/doctor coverage for every
new operational dependency. No coordination action or template can bypass the
resolved dispatch policy.

## Phase 3B — Cold-resumable coordination DAG forward-port

### Objective

Recover the useful, previously completed DAG capability onto current source
without merging the stale/conflicted branch or restoring an obsolete kernel
execution path.

### Source and scope

- Use committed reference tip `fc259498` and its P00–P07 verification as
  evidence/porting input, not merge authority.
- Forward-port immutable DAG declaration/fingerprint, request equivalence,
  replay-derived node state, dynamic ready frontier, show/chain projection,
  recovery, and migration proof.
- Retain the locked scope: read-only individual operation nodes only. No
  mutating DAG node, fan-out DAG node, daemon, new lifecycle, or new store.

### Required adaptation

- Every node executes through the post-Phase-2 validated execution seam and
  current Assignment/dispatch runtime.
- Scheduler code may determine admission order only; it cannot decide driver
  authorization, kernel legality, action-key freshness, mutation authority,
  template authority, or close readiness.
- DAG-created Assignments use Phase 3 template resolution and current dispatch
  governance/provenance; they do not render prompts through a parallel path.
- Reconcile schema, store, replay, `run`, `show`, `chain`, and recovery changes
  semantically. Never select conflict sides mechanically.
- Legacy schema 1/2 sessions replay unchanged; schema-new sessions fail safely
  under an older binary; corrupt DAG/RunResult evidence fails closed.

### Exit

The fixed proof graph `produce -> {review, red-team}` runs with real concurrent
read-only dispatch, survives cold resume, exposes deterministic derived state,
and cannot settle descendants or close on corrupt/refused evidence.

## Phase 3C — Combined integration gate

### Objective

Prove Phase 2, result truth, Phase 3 templates, dispatch completion, and DAG are
one coherent runtime before moving boundaries or rewriting consumers.

### Proof matrix

- semantic command -> action key -> composer -> validator -> kernel ->
  Assignment -> template resolution -> dispatch policy -> RunResult;
- DAG node follows the same path, with no alternate mutation/dispatch door;
- identical retry is idempotent; changed action/event/definition/target/input
  refuses before mutation or external dispatch;
- two OS writers serialize deterministically for every state-changing semantic
  family; DAG concurrency affects only independent read-only nodes;
- explicit close remains required and refuses while any DAG dependency,
  finding, recheck, or evidence requirement is unsettled;
- raw `run --file`, `close --file`, legacy replay, `show`, `chain`, and retained
  aliases remain compatible;
- setup/doctor, command registry, architecture manifest, generated projections,
  focused suites, replay corpus, and full-suite baseline all agree.

### Exit

One recorded integration SHA passes the matrix with no unresolved
contract/authority/atomicity/replay blocker. Phase 4 and Phase 3D branch only
from this SHA.

## Phase 3D — Dispatch boundary simplification

### Objective

Execute dispatch-hardening Phase 09 only after behavior and consumers are
locked, preserving behavior while moving code to its documented owner.

### Work

- Move Work lifecycle behavior out of dispatch core.
- Separate Assignment settlement, CLI-spawn reconciliation, confinement
  authority, and Herdr reconciliation behind compatibility exports.
- Unify brief/result paths and carry the already-resolved template/provenance
  contract rather than inventing a second prompt path.
- Update component-boundary documentation and import-graph tests for every
  moved responsibility.
- Keep each Phase 09 requirement independently revertible; no large-bang file
  split.

### Exit

The combined Phase 3C behavior and test results remain unchanged across the
refactor, and dispatch core no longer owns Work-stage judgment or duplicated
settlement/prompt mechanics.

## Phase 4 — Extract the shared driver discipline and prove it through plan-loop

### Objective

Prove the shared control layer on the most operationally demanding current
consumer **and** separate the three concerns now fused in plan-loop:

1. a domain-neutral driver discipline shared by every coordination facade;
2. plan-driven track sequencing (choose the next cell, cell-status table as a
   query, closeout), owned by the plan facade;
3. coding-cell policy owned by the coding domain and reusable for a single
   cell with no plan.

Plan-loop is a facade over (1)+(3) plus its own (2); it is never the universal
loop engine. No code, schema, persisted entity, or runtime is added for (1).
Plan-loop keeps its name in this phase; the merge/rename into
`fgos-code-change` happens once, in Phase 6.

### Entry gate

Unit I14 is integrated: a DAG-declared request no longer closes a session
unless the request carries an explicit close. The driver discipline states
"explicit close is the sole close action" with no exception (owner decision
2026-09-26).

### Gates

- **Satisfied (Entry):** Unit I14 integrated at `main@3cb80c91c` (plan/status commit `6bad420a0`).
- **Satisfied (Phase 4 / Unit I15):** Unit I15 integrated at `main@8e8a3f1aa` (candidate `38e552bb9`, approved tip `c343304b3`). Implemented canonical driver discipline fragment `core/skills/_shared/coordination-driver.md` with zero coding/track vocabulary; implemented coding-cell policy fragment `domains/coding/skills/_shared/coding-cell-policy.md` referencing `private-cell-worktree.md` without plan/track assumptions; rewrote `fgos-plan-loop` to 1,233 words (within 1,500-word ceiling); synced mirrors byte-identically via `npm run build:skills`. Independent review APPROVED at `c343304b3` (`plans/reports/independent-review-phase-04-driver-discipline.md`); full suite 7693 pass / 0 fail; Phase 5 open.
- **Satisfied (Unit I16):** Unit I16 integrated at `main@a48ce987c` (candidate `6d75b54e1`). Amended open-inputs definition and responsibility in driver discipline fragment; updated plan-loop hook value and transitional entry-node binding note in fgos-plan-loop and author-a-plan-loop-track; projections byte-identical; Lead word load 3,240 words (<= 3,300 ceiling); focused suites 12/12 pass, full skills matrix 29/29 pass; Phase 5 open / ready.


### Work

1. Author one driver-discipline fragment, canonical under
   `core/skills/_shared/` (rendered through `npm run build:skills`, never hand
   edited in `.agents/` or `plugins/`), distilled from plan-loop sections 2–5,
   architecture-panel Driver Disposition / Fresh-Session Resume / Bounds, and
   `master-coordinator.md`. It defines the cycle, its invariants, and the hook
   slots listed under Architecture.
2. Author one coding-cell policy fragment, owned by the coding domain:
   isolated worktree, proof tiers, independent verification of the doer's real
   commit and focused tests, merge and cleanup only after explicit close,
   tested/integrated identity. No plan/track assumptions.
3. Rewrite plan-loop as track sequencing plus hook values, loading 1 and 2.
   Correct its "domain-agnostic" self-description: track sequencing is
   domain-neutral, cell policy is coding.

### Remove from plan-loop

- raw open/fix/close JSON;
- schema field copies and source-line citations;
- manual generation of authorization/invocation ids;
- manual target-assignment lookup;
- copied quorum, visibility, recheck, and close rules;
- repeated actor roster in each request;
- generic recovery mechanics;
- volatile executor/model/confinement history;
- every rule now owned by the driver-discipline or coding-cell fragment.

It must not create a second track ledger. Track status remains a query over
sessions plus the plan artifact.

### Exit

- facade `fgos-plan-loop/SKILL.md` is at least 60% smaller than the Phase 0 baseline of 5,160 words;
- combined Lead load (`facade + coordination-driver.md + coding-cell-policy.md`) is at most 3,300 words;
- combined load is re-measured after Phase 5, once `architecture-panel` and `panel` also consume the driver fragment;
- clean, fix/recheck, crash/resume, stale-action, and explicit-close cases pass;
- no weaker evidence or extra dispatch wave;
- the driver-discipline fragment contains no coding/track vocabulary (drift
  test: `git`, `worktree`, `merge`, `npm test`, `phase`, `plan.md` absent);
- the coding-cell fragment is usable for one cell with no plan or track
  (walk-through against the current code-panel direct-mode scenario; the
  code-panel rewrite itself stays Phase 6);
- plan-loop restates no rule owned by either fragment.

## Phase 5 — Rewrite architecture-panel and generic panel surfaces

### Entry gate

Unit I16 integrated (`main@a48ce987c`). Work item 2 additionally waits for
Unit I19 (catalog `serves` schema); work items 7 and 8 consume the I17
fragment and the I20 `capability match` door instead of keyword-matched
skill descriptions. I17 and I18 may run in parallel with work items 1, 3, 4,
5 and 6. Design record:
`plans/reports/architecture-investigation-260927-1154-capability-aware-dispatch-gate-phase4-decisions.md`.

### Gates

- **Satisfied (Entry):** Unit I16 integrated at `main@a48ce987c`.
- **Satisfied (Unit I17):** Unit I17 integrated at `main@d6c0d9033` (candidate `37833e331`). Demand doctrine fragment `core/skills/_shared/capability-matching.md` (862 words), serves column in `capability-catalog.md`, generic `review` capability slot, and reversed skill triggers in `fgos-capability-dispatching` and `fgos-code-panel` integrated; mirrors byte-identical; 40/40 doctrine tests pass, 124/124 matrix tests pass; Unit I19 unblocked.

### Objective

Prove the same control/template layer **and the Phase 4 driver discipline**
work for a structurally unlike, read-only, human-dialogue consumer.

### Work

1. Move per-role packets out of the runtime skill into operation templates.
2. Move executor/confinement registration facts into dispatch config,
   setup/doctor checks, and a focused operator runbook. Concretely: a
   per-node binding step in the request composers that reads each
   operation's capability `serves`/`prefer` (I19) and binds every node, not
   only the entry node (I16 finding: `start --actors` binds the entry node
   only; later `authorize-and-dispatch` carries no actors, so provider
   diversity across roles is not reachable from the facade today); a
   hand-written roster stays a trusted override with provenance. Design
   settled 2026-09-27 (design record §12); executed as Unit I21.
3. Replace internal `node -e` pack invocation with a public semantic CLI
   surface.
4. Add a real public specialist-authorization composer if the kernel action is
   retained; eliminate the direct engine escape hatch.
5. Make human-turn and bounded-reopen actions appear in the typed action view.
6. Keep architecture judgment, turn classification, and disposition authority
   in the Lead/role packets—not in the action projector.
7. architecture-panel and the generic presets driven by `fgos-panel` load the
   Phase 4 driver-discipline fragment and fill its hooks; they do not restate
   it.
8. Fold `fgos-group-thinking` into `fgos-panel`: `fgos-panel` stays the
   natural-language preset router; the pack-membership gate stays in code
   behind the public CLI. `fgos-group-thinking` remains a deprecated stub
   until the Phase 7 compatibility window closes. Remove its stale
   "always auto-closes / no close step" claim.

### Panel depth experiment

Do not silently reduce the nine-role protocol for speed. Measure two explicit
profiles/cases first:

- current deep/full protocol;
- a candidate standard protocol with a smaller critical path.

Compare decision quality, dissent retention, factual error, dispatch/wave
count, wall time, and prompt tokens on a fixed evaluation corpus. A standard
profile may ship only if it remains a separate registered protocol/preset with
clear selection triggers; it must not conditionally skip required bindings in
the full protocol through skill prose.

### Exit

- architecture-panel skill within budget;
- every actor receives only its own packet and granted evidence;
- specialist/human-turn/reopen/close operate through public doors;
- adversarial tests preserve premature-reveal, authority, dissent, and reopen
  caps;
- at least 60% Lead instruction-token reduction without a quality regression;
- architecture-panel and `fgos-panel` consume the driver-discipline fragment
  **unchanged**; any required change edits the fragment and re-verifies
  plan-loop (two-unlike-consumer proof, Vision V-012).

## Phase 6 — Merge plan-loop and code-panel into `fgos-code-change`

### Entry gate

Phase 5 work items 2 (I21) and 7/8 integrated; I18 (`fgos plan-lint`) and
I20 (`fgos capability match`) integrated so the single coding facade can
fill its open-inputs hook from real doors instead of prose.

### Objective

Replace the two overlapping coding facades with one coding-domain facade,
`fgos-code-change`: a single change is a plan with one cell. It loads the
driver-discipline and coding-cell fragments; plan mode (cell selection,
cell-status table, closeout) is a reference file loaded only when the
execution target is a plan/phase path or a named track.

### Work

- create `fgos-code-change` in the coding domain from the Phase 4 plan-loop
  rewrite plus code-panel's single-change path;
- replace code-panel's mode-selection rule set and recursive-dispatch guard
  with one rule: plan mode only when a run/implement/resume verb targets a
  plan/phase path or a uniquely resolvable track; otherwise one cell; ask one
  question when ambiguous;
- delete duplicated open/fix/close JSON, worktree recipe, roster, and recovery
  prose;
- keep explicit implementation authority distinct from advisory
  `coding-design-panel` routing;
- turn `fgos-plan-loop` and `fgos-code-panel` into deprecated stubs pointing
  at `fgos-code-change` until the Phase 7 compatibility window closes;
- fill the driver-discipline `open inputs` hook from doors, not prose: in
  plan mode run `fgos plan-lint <phase file> --cell <id>` (I18) and refuse
  to open on a hard finding; in single-change mode declare `DemandFacts`
  and run `fgos capability match --demand` (I20); an `inline` match means
  no cell is opened at all (the facade must not capture work that the
  match sends back to the live session);
- the facade supplies no roster by default: per-node binding comes from
  I21; a hand roster is an explicit override with provenance.

### Exit

- one coding facade, within budget; no second copy of loop orchestration;
- the facade opens a cell only after `plan-lint`/`capability match` return
  a non-inline, non-hard result; a docs-only or advisory request is sent
  back inline (dogfood case from I15 must not reproduce);
- single-change and multi-cell plan scenarios both pass through the same
  skill, including crash/resume and explicit close;
- advisory-only coding requests are not captured.

## Phase 7 — Contract, migration, distribution, and closeout

### Work

1. Version the action/status contract and semantic CLI output.
2. Preserve raw `run --file` and legacy replay behavior for the documented
   compatibility window.
3. Update current platform spec/contracts, how-to docs, skill canonical
   sources, generated projections, and `CHANGELOG.md` for user-visible CLI /
   skill behavior.
4. Register new installed assets/config with setup merge and doctor if Phase 3
   introduces them; confirm the Phase 5 additions (`serves`, `review` slot,
   `policy.capability`, `policy.distinctProviderFrom`, doctor checks from
   I19/I21) are covered by `config-not-stale` and the doctor registry.
4b. Version the FlowDefinition contract for the optional operation fields
   `policy.capability` and `policy.distinctProviderFrom` (added in I21 as
   additive, portable-scope requirements); update
   `docs/architect/agent-coordination/contracts/flow-definition.md` PolicyPatch
   section and the runner spec vocabulary table.
4c. Decide which of `placementPolicy.readOnlyRedirects` (keyed by operation id)
   and `capabilities.code:review.prefer` (keyed by capability) remains the
   read-only binding source; keep exactly one, migrate the live config, and
   keep the other loadable for the compatibility window.
4d. Close the capability-declaration compatibility window: a plan or phase
   file with no declared unit capability (neither `- unit:` blocks nor a
   Product Gates `Capability` column) moves from `plan-lint` warning to hard
   refusal at cell open; `Execution Inputs: Roster` is removed from
   `docs/how-to/author-a-plan-loop-track.md` (binding from config since I21,
   roster only as override).
4a. Rename `core.coordination-protocol.standalone-master-coordination-loop`
   to `core.coordination-protocol.produce-review-revise`; the old id stays
   loadable so every existing session replays identically. Reclassify the
   `group-thinking` protocol pack as gated registered protocols (it also
   holds non-discussion protocols) and decide its id. Remove the deprecated
   `fgos-plan-loop`, `fgos-code-panel`, and `fgos-group-thinking` stubs when
   the compatibility window closes.
5. Add drift tests:
   - documented commands equal command registry;
   - runtime skills contain no raw request JSON;
   - semantic action kinds map to real kernel actions;
   - every referenced contract template resolves;
   - generated skill projections are byte-identical to canonical sources;
   - stale auto-close language is absent from current sources;
   - facades restate no rule owned by the driver-discipline fragment, and
     the fragment carries no domain vocabulary;
   - every registered capability declares a valid `serves` set and no two
     declare the same set; every protocol operation's `policy.capability`
     resolves against the catalog;
   - no portable FlowDefinition carries an executor pin through
     `policy.capability`/`policy.distinctProviderFrom` (red-team case from
     I21);
   - runtime skills that dispatch link `capability-matching.md` and none
     triggers on keyword matching of "implement"/"code" (I17 trigger reversal).
6. Run focused coordination suites, protocol conformance suites, projection /
   packaging tests, replay corpus, and full `npm test`.
7. Publish before/after performance and quality results.

### Exit

A cold agent can operate `fgos-code-change` and architecture-panel from thin skills,
typed status, and operation-local prompt packets. No required operational truth
depends on copying a large JSON payload or remembering chat history.

## Integrated implementation units and capabilities

Each block is independently executable and has exactly one canonical capability.
Executor/provider/model/tier selection remains an execution-time decision.

- unit: I00 — independently review Phase 2 candidate `43fdd378` (complete)
  capability: code:review
  depends-on: current local `main` known
  stop: candidate drift, dirty worktree, or unresolved BLOCKER/HIGH
- unit: I01 — integrate approved Phase 2 and record the shared baseline (complete)
  capability: execute
  depends-on: I00 approved
  stop: `main` changes during integration or tree is not clean
- unit: I02 — reconcile Phase 01 result-truth commit `9049e611` and R5 (integrated at `main@4362bfec`, candidate branch tip `510f35f5`, code fix `f835c215` at `72894c98`)
  capability: code:implement
  depends-on: I01
  status: integrated
  candidate-sha: `510f35f5` (code fix `f835c215`; status-recording lineage `0c17bd62` -> `2681b389` -> `f835c215` -> `46e09c30` -> `81c56e11` -> `510f35f5`)
  integrated-sha: `4362bfec` (clean integration of candidate branch tip `510f35f5`; code integration at `72894c98`)
  origin-status: `origin/main` at `ad8dbaf0` (not pushed; 10 commits ahead)
  findings-resolved: I02-REV-01, I02-REV-02, I02-REV-03, I02-REV-04, F-01 (Settlement Authority / Alternate Writers), F-02 / F-02-REOPEN / F-02-REOPEN-2 (Cross-Plan Status Synchronization)
  stop: current RunResult path contradicts the old patch or authority is ambiguous
- unit: I03 — verify result truth, replay, quorum, and stale-action compatibility (integrated at `main@4362bfec`)
  capability: code:test
  depends-on: I02
  status: integrated
  integrated-sha: `4362bfec` (code integration at `72894c98`)
  origin-status: `origin/main` at `ad8dbaf0` (not pushed; 10 commits ahead)
  verification: 11 suites, 317 tests pass / 0 fail (post-fix matrix; 315 in historical matrix); 75 pass in assignment-dispatch.test.mjs smoke rerun
  stop: corrupt evidence can settle or close
- unit: I04 — implement Phase 3 template registry/resolver/provenance (integrated at `main@7472bd74`, candidate SHA `f0919405`)
  capability: code:implement
  depends-on: I01
  status: integrated
  candidate-sha: `f0919405`
  integrated-sha: `7472bd74`
  branch: coordination-skill-harness-i04-template-registry
  base-sha: `15e4048503ca1ee02dae23263dee84b9c983386d`
  findings-resolved: I04-REV-01, I04-REV-02, I04-REV-03
  verification: 32 pass / 0 fail in test/runner/operation-prompt-templates.test.mjs; 13 pass / 0 fail in test/runner/effective-execution-contract.test.mjs; 75 pass / 0 fail in test/runner/assignment-dispatch.test.mjs; 83 pass / 0 fail in assignment suite; 4 pass / 0 fail in test/runner/coordination-group-thinking-rfc-review-lite.test.mjs; 13 pass / 0 fail in test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs; 29 pass / 0 fail in test/runner/coordination-declared-consult.test.mjs; 18 pass / 0 fail in test/verbs/coordination-group-thinking-pack.test.mjs; 112 pass / 0 fail in test/setup/checks.test.mjs; doctor check operation-prompt-templates-valid registered and passing; post-merge verification: 418 pass / 0 fail across focused matrix; GitNexus detect-changes verified.
  report: plans/260919-coordination-skill-harness-simplification/reports/phase-03-i04-template-registry-implementation.md
  stop: a template can widen authority or requires an unresolved setup contract
- unit: I05 — independently review Phase 3 trust boundary and migration (complete in I04 integration cycle)
  capability: code:review
  depends-on: I04
  status: integrated
  findings-resolved: I04-REV-01, I04-REV-02, I04-REV-03
  stop: unresolved template authority/provenance finding
- unit: I06 — complete dispatch-hardening Phase 05 remainder (integrated at `main@3bab9b99`, evaluated candidate `d75d311d`, status-recording tip `dec142a5`)
  capability: code:implement
  depends-on: I01
  status: integrated
  candidate-branch: `coordination-skill-harness-i06-dispatch-governance`
  base-sha: `15e4048503ca1ee02dae23263dee84b9c983386d`
  candidate-sha: `d75d311d1b7a853bfede60c4bf52e10b0a41c82f` (code fix `2e210796`; lineage `b67f3794` -> `2e210796` -> `d6dc386f` -> `d75d311d` -> `dec142a5`)
  status-recording-sha: `dec142a5e0b4417690fd2018333fecc490a3f9b7`
  integrated-sha: `3bab9b99`
  last-verified: 2026-09-23 at candidate `d75d311d`
  next-dependency-gate: I08 (requires I06 and I07), I09 (requires I02, I04, and I06)
  findings-resolved: I06-REV-01, I06-REV-02, I06-TM-01, I06-REREVIEW-01, I06-REREVIEW-02
  candidate-verification: 101 pass / 0 fail on focused architecture/redirect/PlacementPolicy smoke; 75 pass / 0 fail in assignment-dispatch.test.mjs; 560 pass / 0 fail on full dispatch matrix; 317 pass / 0 fail on 11-suite coordination matrix; git diff --check exits 0
  post-merge-verification: 548+ pass / 0 fail across post-merge matrix (13 architecture, 88 placement/redirect/role-tiers, 32 templates, 75 assignment-dispatch, 125 contracts/checks, 215 coordination); git diff --check exits 0
  historical-verification: 529 tests from initial Phase 05 exploration (2026-09-22 morning)
  requirements-completed:
    - R5 (provider-family vs model lookup decoupling verified and preserved)
    - R6 (cross-provider redirect contract: schema, typed refusal redirect.cross-provider-not-permitted, full provenance)
    - R7 (PlacementPolicy authority reconciled as active binder, stablePoolIndex deduplicated)
    - R8 (adapter registry leaf module src/runner/dispatch/adapters.mjs cycle cut)
  report: `plans/260919-coordination-skill-harness-simplification/reports/phase-03a-i06-dispatch-governance-implementation.md`
  review-report: `plans/260919-coordination-skill-harness-simplification/reports/phase-03a-i06-dispatch-governance-review.md`
  stop: provider/placement authority decision is not settled
- unit: I07 — implement dispatch-hardening Phase 08 operability/doctor
  capability: code:implement
  depends-on: I01
  status: integrated, post-merge verification complete
  branch: `dispatch-hardening-i07-origin-sync`
  worktree: `/home/vantt/projects/forgentX/.claude/worktrees/dispatch-hardening-i07-origin-sync`
  base-sha: `cc687d92b94c6652f1cb738b74d1cfa0c72571d2`
  integration-baseline: `origin/main@c386e9f30b1ac60d78675f688e8d10146f5e8949`
  evaluated-candidate-sha: `439a1fb078418edff7628555c4b6cb9f4015e4e6` (approved in independent review: 0 blocker, 0 high)
  synchronized-candidate-sha: `261ed7ea01765db6c9fa87afddfa8f3e259be1ea` (merges local main@210a8256 into origin/main@c386e9f3; approved for integration)
  integrated-sha: `261ed7ea01765db6c9fa87afddfa8f3e259be1ea` (fast-forward local main -> 261ed7ea; preserved user dirty AGENTS.md/CLAUDE.md)
  integration-status: integrated at 261ed7ea; post-merge verification complete (178/178 focused pass, 559/560 dispatch/herdr pass, 0 regressions; awaiting Track Manager confirmation to unblock I08)
  report: `plans/260920-2217-dispatch-engine-hardening/reports/phase-08-operability-cli-doctor-implementation.md`
  stop: command/setup/doctor contract cannot be made consistent
- unit: I08 — verify dispatch governance, CLI, doctor, and performance gates
  capability: code:test
  depends-on: I06 and I07
  status: VERIFIED at main@ac19f6d1
  stop-condition: CLEARED (base defects F4/F5 remediated in I08b; RV-01/RV-02 remediated in candidate 132d3777 + docs tip ac19f6d1)
  branch: `coordination-skill-harness-i08-dispatch-verification`
  worktree: `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i08-dispatch-verification`
  base-sha: `6f3fb9038fd66cd9943972a321eed2ba98587fab`
  remediation-shas: `ba8f6a9dca8c84ba1561ab5802e2c89a2010446c` (I08b base remediation) + `132d377794ee02da702ff12d91cfa1c1545bb275` (RV-01/RV-02 governance fix) + `ac19f6d1e868c53b2bc59a2c9642ee0e37e7eb08` (docs/accounting tip)
  acceptance-gate-reverification:
    - full-repository-suite: Run 3 reached exit code 0 (7647 pass, 0 fail, 8 skipped, 68 todo; duration 364s). Runs 1 and 2 encountered load-sensitive concurrency timing contention (dispatch test line 5904 and fan-out rejection delay threshold 3637ms vs 2500ms limit), classified as timing instability (LOW debt).
    - isolated-stress-testing: 10/10 pass on coordination-phase2-concurrency.test.mjs (160/160 pass, 0 fail); 10/10 pass on dispatch.test.mjs (3870/3870 pass, 0 fail).
    - parallel-load-stress-testing: 10/10 iterations pass with 6 suites running concurrently (60/60 suite executions exit 0, 0 fail).
    - baseline-comparison: verified on exact base 26a1038e worktree (dispatch.test.mjs exit 0, 387 pass; coordination-phase2-concurrency.test.mjs exit 0, 16 pass).
    - evidence-inventory: 85 logs total on disk (83 manifest-hashed verification logs on ac19f6d1 + 2 baseline comparison logs on 26a1038e) in scratch/i08-reverification/.
    - durable-artifacts: `plans/260920-2217-dispatch-engine-hardening/reports/phase-08-i08-acceptance-gate-reverification-manifest.json` and `phase-08-i08-acceptance-gate-reverification-summary.md`.
    - known-low-follow-up-debts: Set<string> canonicalization in checkProviderDisallowed helper, PlacementPolicy shadow gate raw providerModel comparison, test cleanup finally blocks, N10 adapter selection disentanglement.
  benchmark: 40 trials, median 38ms, p95 47ms vs baseline 46ms (threshold <= 146ms; pass)
  measurement-artifact: `plans/260920-2217-dispatch-engine-hardening/reports/i08-receipt-latency-measurement.json`
  report: `plans/260920-2217-dispatch-engine-hardening/reports/phase-08-i08-dispatch-verification-report.md`
  stop: redirect/governance bypass or measured latency regression
- unit: I08b — remediation of I08 base defects F4, F5, F6, F7, F10
  capability: code:implement
  depends-on: I08
  status: integrated at main@ba8f6a9d (post-landing verified: 486/486 pass)
  integration-sha: `ba8f6a9dca8c84ba1561ab5802e2c89a2010446c`
  candidate-merge-sha: `98f501be41756dc80d691cbf63ffeb4cd617fb30`
  candidate-sha: `d4e052a6e0e80ffe2add08a0f4661433b2e80582`
  branch: `coordination-skill-harness-i08b-remediation`
  worktree: `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i08b-remediation`
  base-sha: `4e9de19541f2acde2380ff4f78147e389385e95c` + evaluated `0617c6e41ebec1aa8e73065eac69cd5eb9684343` + `origin/main@4ad0b8ca6576252be01159fcf5853c966ba54743` (synchronized candidate `d4e052a6`, merge `355f9dbd`)
  remediation-scope: F4 (HIGH fail-closed explicit unregistered executor with DispatchError), F5 (HIGH canonicalize provider family with declared vendor precedence), F6 (MEDIUM whitespace trim / option precedence for resolveHerdrBin), F7 (MEDIUM expectedRunId/non-standard status validation across intake doors), F10 (MEDIUM validate --action before checking cwd lock in reconcile plan with --run/--assignment)
  follow-up-ledger: N10 (LOW-MEDIUM: disentangle vendor boundary from adapter selection in ProviderAdapter before expanding beyond Claude harness)
  verification: 5/5 dedicated regression tests pass (`test/runner/dispatch-i08b-remediation.test.mjs`); 184 pass across 10 focused tests (189 with regression); root dispatch suite: 387 pass; affected matrix (53 files): 1456 pass, 0 fail, 1 skip; full repository suite (`npm test`): 7603 pass, 0 fail, 8 skip, 65 todo; post-merge candidate regressions: exactly 0; git diff --check origin/main...HEAD clean (0 errors/warnings)
  report: `plans/260920-2217-dispatch-engine-hardening/reports/phase-08-i08b-base-remediation-report.md`
- unit: I09 — forward-port DAG declaration, replay, scheduler, and projections
  capability: code:implement
  depends-on: I02, I04, and I06
  status: verified
  branch: `coordination-skill-harness-i09-dag-forward-port`
  worktree: `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i09-dag-forward-port`
  base-sha: `16a7900d9eacf1c1dfa6d0c77ff489c21080305e`
  integration-baseline: `main@cc687d92b94c6652f1cb738b74d1cfa0c72571d2`
  evaluated-candidate-sha: `a208bf555927b508ddfa0523009ce87aac1dd0af` (approved in independent review: 0 blocker, 0 high)
  synchronized-candidate-sha: `c624fe583fe089cb177c44df315dc451ba1d8e1f` (merges `main@cc687d92`; CHANGELOG.md conflict resolved preserving both groups)
  status-recording-sha: `dd4fb2e54f95afe5a68b6bcc092bd3d929de96d8` (lineage `524579b4` -> `dd4fb2e5`)
  integrated-sha: `1ca4023c98c2f449cb58cba481e82cab49ba51ba` (merges `cc687d92` + `dd4fb2e5`; verified topology and preserved local state)
  integration-status: verified (integrated at 1ca4023c; post-merge verification satisfied following REV-15 timing fix at 60132825; verified at main@f63f7e7d: 538/538 pass across 16-suite matrix; 3 consecutive timing reruns 129/129 pass; candidate regressions = 0; D2/D3 in fgos-approve.test.mjs confirmed pre-existing baseline defect)
  findings-resolved: I09-REV-01 through I09-REV-11, I09-REV-15 (MEDIUM, candidate test timing regression resolved by restoring 1000ms/1050ms margins and stripping Phase 04 H-2 test labels). Baseline defect note: D2/D3 in fgos-approve.test.mjs is pre-existing on main@cc687d92, not an I09 regression.
  blast-radius: CRITICAL (189 symbols, 35 processes; GitNexus index degraded/stale per REV-14)
  rev05-policy: locked (shared-cwd read-only DAG caveat cannot be discharged in original session; original session must be cancelled; recheck runs in separate session; no adjudication event/lifecycle/store added)
  queued-for-i10-i11: I09-REV-12 (deferred outcome taxonomy), I09-REV-13 (disposition on caveated findings), I09-REV-14 (GitNexus index refresh), cwd helper consolidation
  next-dependency-gate: I10 dependency gate SATISFIED (Unit I10 integrated and verified at main@605d26fe, carried forward through main@26a1038e and main@ac19f6d1; production fix at `3c49cf4205060fea998abfb2e9ef5df7b816a252` resolves defect; test candidate at `97420638c7c0360823b64a4a4b74d05eeee8723d` with 38 pass, 3 todo, 0 fail; Unit I10 VERIFIED)
  verification: 14 targeted suites (538 tests pass / 0 fail: 3 skill contract, 51 schema, 35 replay, 47 store, 43 hard budgets, 7 headless adapter, 16 migration/adversarial, 16 chain, 20 recovery, 86 run driver steps, 73 session engine / cli / declared-vs-agent-led, 16 master loop, 13 architecture manifest, 112 setup/checks); git diff --check clean
  report: plans/260919-coordination-skill-harness-simplification/reports/phase-03c-i09-dag-forward-port-implementation.md
  stop: port requires an alternate engine/store or weakens action/driver authority
- unit: I10 — test DAG migration, cold resume, concurrency, and corrupt evidence
  capability: code:test
  depends-on: I09 (SATISFIED)
  status: integrated and verified at main@605d26fe (carried through main@26a1038e and main@ac19f6d1)
  branch: `coordination-skill-harness-i10-dag-verification`
  implementation-base: `c386e9f30b1ac60d78675f688e8d10146f5e8949` (descendant containing 1ca4023c and 60132825)
  production-fix-commit: `3c49cf4205060fea998abfb2e9ef5df7b816a252`
  candidate-test-commit: `97420638c7c0360823b64a4a4b74d05eeee8723d`
  evaluated-candidate-sha: `27ffb3767f1bec58f48ef611fb8a6353f8cdb76a` (approved in independent review: 0 blocker, 0 high)
  pre-i08b-synchronized-sha: `d1b52e44f65e013fda61c4a0376d7bd2b6a6ed72` (merges `origin/main@4ad0b8ca` into evaluated candidate `27ffb376`)
  i08b-candidate-baseline-sha: `c6262fb1d86c78af141032dace09011c847715be` (branch `coordination-skill-harness-i08b-integration`, contains candidate merge `98f501be`)
  post-i08b-synchronized-candidate-sha: `949887407919ca8581cb7e800ef9142eba91c90b` (exact evaluated tip `e516e9750b81eb12b2db7fdff9280b8ee00d3abc`)
  integrated-sha: `605d26fea5a67f61c7d40214f17b16eb09264b3f`
  verification: 41 tests across 5 test suites (38 passed, 3 todo, 0 failed; 10 matrix, 9 cold-resume, 9 concurrency, 9 corrupt evidence, 4 deferred findings probes); 538/538 pass across 16-suite focused matrix; coordination-wide suites: 1040 pass, 3 todo, 0 fail; dependency matrix: 37 pass, root dispatch 387 pass; full suite: 7775 pass, 3 todo, 0 fail (exit code 0); candidate regressions = 0
  deferred-findings: I09-REV-12 (OPEN, queued for I11: unlinked/retried node on resume uses deferred outcome taxonomy without concurrency-cap error), I09-REV-13 (OPEN, queued for I11: store-level recordDriverDisposition accepts caveated findings), store-scan (OPEN: manifest.assignmentRefs scan without dagNodeId filtering causes cross-node cwd attribution), replay-evidence-unification (OPEN, Track Manager ghi nhận dời việc thống nhất replaySession().dag.settled sang I11: replaySession dag.nodes[].settled is an event-log-only projection, while run and show execution doors inspect on-disk RunResult validity via readLinkedRunResultFromDisk)
  resolved-findings: F1 (RESOLVED: missing/corrupt RunResult on disk fails closed; sets settled: false and blocks descendant admission; verified live in test 8)
  report: plans/260919-coordination-skill-harness-simplification/reports/phase-03c-i10-dag-verification-report.md
  stop: schema 1/2 replay changes or corrupt evidence settles a node
- unit: I11 — independently review combined Phase 2/3/dispatch/DAG runtime
  capability: code:review
  depends-on: I03, I05, I08, and I10
  status: VERIFIED at main@7d7dc2750f9fb80716a7cffae03d67605629cf9a (candidate code `9cf843b6fbb786923992f9deb2f70deb447620a2`, approved tip `3a67a1b9df4cf51391f4abffc13fd988df727cf4`, synchronized merge tip `3d706b8901bb8787f8c6c9b35641b9a4acaeea3b`; reviewer APPROVE ratified; post-merge verification satisfied: 155/155 focused rerun pass, full suite 7652 pass exit 0; candidate regressions = 0; F01, F02, F03, I11R2-01 resolved; Track Manager verified)
  remediation-candidate-sha: `9cf843b6fbb786923992f9deb2f70deb447620a2`
  synchronized-merge-sha: `3d706b8901bb8787f8c6c9b35641b9a4acaeea3b`
  remediation-report: plans/260919-coordination-skill-harness-simplification/reports/phase-03d-i11-runtime-remediation-report.md
  stop: any contract/authority/atomicity/replay blocker remains
- unit: I12 — refactor dispatch boundaries in small reversible Phase 09 cells
  capability: code:refactor
  depends-on: I11 approved
  status: VERIFIED/integrated at `main@c782a08dfcae89279dcb1ca9fb59aa73fb58c515`
  approved-candidate-sha: `1089eb347455c10164ec03ffbcbf54ae35cd2097`
  integrated-sha: `c782a08dfcae89279dcb1ca9fb59aa73fb58c515` (merge commit `merge: integrate Unit I12 boundary simplification`; approved candidate is ancestor; `src/` tree hash matches approved candidate `29d4ef7f88f136d97ca69cb75c012a09594d7a5f`)
  review-report: `plans/reports/independent-re-review-260926-1300-unit-i12-remediation-round5-report.md` (APPROVE for exact `1089eb347`)
  post-merge-verification: `env -u CLAUDE_CODE_SESSION_ID npm test` with workspace activation temporarily disabled so `resolveFgosBin()` selects the integrated dev-checkout `bin/fgos.mjs`: 7750 tests, 7677 pass / 0 fail / 8 skipped / 65 todo, exit 0; `git diff --check` clean. A control run with the active workspace installation release restored failed one R1 call-site test because `fanoutBatchExecutorCli` resolved the older installed `fgos`; isolated rerun with dev-checkout bin passed 20/20, classifying this as a local activation/precondition mismatch rather than an I12 source regression.
  residual-low-debt: F-R5-1 static R2 lock evasions, F13 rollback-only reverse order, F14 probe-cache trust.
  track-manager-decisions:
    r2-work-lookups: "OPTION A RATIFIED & IMPLEMENTED — Relocated Work capability lookup implementations (executorIdForWork, resolveCapabilityIdentityDetails, resolveCapabilityIdentity, buildPrompt) out of dispatch core into dedicated leaf compatibility module src/runner/work-compat.mjs (registered as infra in architecture manifest) with zero imports into dispatch core. Dispatch core contains no Work lookup implementation; resolve.mjs and prepare.mjs re-export these helpers for backward compatibility, consumed by pre-existing callers (plan.mjs for compileDispatchPlan({work}) and cli.mjs for spawnWorker). Enforced by boundary test test/runner/dispatch-reconciliation-import-graph.test.mjs forbidding strict core modules from importing Work lookup symbols or work-compat.mjs (killing mutation ME)."
    r4-argv-parser: "ACCEPTED AS DEFENSIVE FALLBACK — Confinement authority's argv/bwrap parser is preserved as a defensive fallback behind driver claims when driver claims are absent (as documented in CHANGELOG.md and docs)."
  stop: CLEARED — behavior/test projection matches I11 baseline plus accepted LOW debt; I13 may proceed.
- unit: I13 — verify import graph, compatibility, performance, and full suite
  capability: code:test
  depends-on: I12
  status: VERIFIED/integrated at `main@dc05f7586b78483d569bc25b929b988dc56a374c`
  stop: consumer behavior or full-suite baseline regresses
- unit: I14 — remove automatic close from DAG-declared coordination requests
  capability: code:implement
  depends-on: I13
  status: VERIFIED/integrated at `main@3cb80c91c` (candidate `f857eaeab`; review APPROVE at `7d01a12e2`; remediation `c03a959c7`; focused matrix 210 pass / 0 fail; full suite 7684 pass / 0 fail; Phase 4 entry gate satisfied)
  scope: `runCoordinationUseCase` in `src/verbs/coordination/run.mjs` attempts
    `closeSessionByQuorum` for any DAG-declared request with no partial outcome
    or caveat, even without `request.close`/a `close` step; the non-DAG path
    already closes only on explicit request. Align the DAG path with the
    locked direction "Explicit close is the sole normal close action", keep
    the caveat refusal reason reported, and update DAG tests/docs that expect
    implicit close.
  stop: legacy session replay changes, or any consumer depends on implicit DAG
    close without an explicit-close replacement
- unit: I15 — extract shared driver discipline and prove on plan-loop
  capability: code:implement
  depends-on: I14
  status: VERIFIED/integrated at `main@8e8a3f1aa` (candidate `38e552bb9`; approved tip `c343304b3`; focused matrix 192 pass / 0 fail; full suite 7693 pass / 0 fail; Phase 5 entry gate satisfied)
  branch: `coordination-skill-harness-phase4-driver-discipline`
  worktree: `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-phase4-driver-discipline`
  base-sha: `2085d88fea9b6aae2b629b3cd4fcd4eec397fcbb`
  scope: Create canonical domain-neutral driver discipline fragment `core/skills/_shared/coordination-driver.md`
    (0 coding/track vocabulary: `git`, `worktree`, `merge`, `npm test`, `phase`, `plan.md` absent);
    create coding-domain cell policy fragment `domains/coding/skills/_shared/coding-cell-policy.md`
    (referencing `private-cell-worktree.md`, proof tiers, independent verification, post-close merge/cleanup, tested/integrated identity,
    reusable for single cell with no plan); rewrite `core/skills/fgos-plan-loop/SKILL.md` into track sequencing
    over semantic coordination commands (`start`, `status`, `operation`, `authorize-and-dispatch`, `disposition`, `close`, `chain`),
    removing raw request JSON, manual ID generation, and copied kernel rules; synchronize generated projections byte-identically;
    maintain explicit-close invariants; verify zero regressions.
  verification: 9/9 dedicated regression/contract tests pass (`test/skills/coordination-phase4-driver-discipline.test.mjs`,
    including CLI flag contract guard against real bin/fgos.mjs without spawning agents); 192 pass across focused suites;
    full repository suite (`npm test`): 7693 pass, 0 fail, 8 skip, 65 todo; git diff --check clean (0 errors/warnings).
  word-budget: `fgos-plan-loop` at 1,233 words (within 1,500-word ceiling and 800–1,200 target; 76.1% facade reduction vs 5,160 Phase 0 baseline).
  review-status: APPROVE at `c343304b3` (`plans/reports/independent-review-phase-04-driver-discipline.md`); integrated at `main@8e8a3f1aa`.
  report: plans/260919-coordination-skill-harness-simplification/reports/phase-04-driver-discipline-implementation-report.md
  stop: Phase 4 requires changing CoordinationSession legality/kernel authority, any close behavior regresses from explicit-close,
    plan-loop needs a new persisted ledger, driver discipline needs coding/track vocabulary, skill projections cannot be rebuilt cleanly,
    or full suite regresses.
- unit: I16 — amend driver-discipline open-inputs slot and plan-loop hook value before Phase 5 consumes the fragment
  capability: execute
  depends-on: I15
  status: VERIFIED/integrated at `main@a48ce987c` (candidate `6d75b54e1`; focused suites 12/12 pass; skills matrix 29/29 pass; Phase 5 unblocked); Phase 5 units I17–I21 planned 2026-09-27 (design record `plans/reports/architecture-investigation-260927-1154-capability-aware-dispatch-gate-phase4-decisions.md`); Unit I17 integrated at `main@d6c0d9033`
  candidate-sha: `6d75b54e1`
  integrated-sha: `a48ce987c`
  branch: `coordination-skill-harness-i16-open-inputs`
  base-sha: `13f95df4d6416a0ff55f309af2a5f8b6392b7cd1`
  review-status: APPROVE at `6d75b54e1` (track manager and independent review spot-check ratified; entry-node binding scope corrected)
  scope: Prose-only amendment; no code, schema, persisted entity, or runtime change.
    (1) `core/skills/_shared/coordination-driver.md`, hook-slot table row `open inputs`:
        Definition: "The source specifications and parameters used to initialize the session:
          (a) the iteration's declared result kind, work-product or advisory;
          (b) exactly one primary canonical capability;
          (c) any binding inputs the control layer requires, when the facade has them."
        Responsibility: "Facade supplies (a)–(c). The discipline reads (a) to select
          evidence and close rules, treats (b) and (c) as pass-through data, never derives
          or chooses them itself, and never names an executor, model, tier, or persona."
        Vocabulary constraint: no `git`, `worktree`, `merge`, `npm test`, `phase`, `plan.md`
        (drift test); "capability", "executor", "binding" are platform vocabulary and allowed.
    (2) `core/skills/fgos-plan-loop/SKILL.md`, hook-value table row `open inputs`:
        "Extracted from plans/<track>/phase-NN-<name>.md: objective, verification commands,
         result kind (work-product for a produce cell), the phase's primary capability from
         the plan.md Product Gates table, and any actor binding the Lead supplies."
    (3) `core/skills/fgos-plan-loop/SKILL.md`, section "1. Open a Cell", one transitional
        sentence after the `start` command block:
        "Until binding resolves from config (Phase 5), `--actors '<json>'` on `start` binds
         only the entry node; later `authorize-and-dispatch` requests carry no actors, so
         reviewer and red-team bind to the default executor plus placementPolicy read-only
         redirects. Provider diversity across roles is not yet achievable from the facade."
        (Amended after review: `composeCoordinationActionRequest` hard-codes `actors: []`
         and `--actors` is a `start`-only flag, so the original "pass it for provider
         diversity" wording overstated what `start` binds.)
    (4) `docs/how-to/author-a-plan-loop-track.md`, Execution Inputs "Roster" bullet: add
        "(only the entry node is bound, via `fgos coordination start --actors`; full roster
         binding lands in Phase 5)".
    (5) `npm run build:skills`; confirm `.agents/` and `plugins/fgOS/` mirrors byte-identical.
    Nothing else changes: no decide call added to the fragment, no plan-lint reference,
    no roster rule declared permanent, no Phase 4 exit criterion reopened.
  verification: 12/12 pass across focused suites (test/skills/coordination-phase4-driver-discipline.test.mjs 9/9, test/skills/coordination-dag-driver-skill-contract.test.mjs 3/3); 29/29 pass across test/skills/**/*.test.mjs; word count 3,240 <= 3,300 ceiling (driver 1,192, plan-loop 1,319, policy 729); git diff --check clean.
  evidence: plans/reports/architecture-investigation-260927-1154-capability-aware-dispatch-gate-phase4-decisions.md §6.2, §6.4, §10
  stop: CLEARED — integrated at `main@a48ce987c`; Phase 5 unblocked.
- unit: I17 — demand doctrine: `capability-matching.md` fragment, spec fact, trigger reversal
  capability: execute
  depends-on: I16
  status: VERIFIED/integrated at `main@d6c0d9033` (candidate `37833e331`; review APPROVE at `8864ea596`/`37833e331`; focused suites 40/40 pass, secondary matrix 124/124 pass; Phase 5 Unit I19 unblocked)
  candidate-sha: `37833e331`
  integrated-sha: `d6c0d9033`
  branch: `coordination-skill-harness-i17-demand-doctrine`
  base-sha: `6e2bc83095aa6391d37e0cce28929e74246fe43a`
  review-status: APPROVE at `8864ea596` (re-verified at clean candidate `37833e331`; F1 inline default ratified via Option A, F2 impact-analysis serves set to explicit-only)
  scope: see `phase-05-unit-i17-demand-doctrine.md`. Prose only: new shared fragment
    (DemandFacts, serves-based matching, default inline, five dispatch reasons, promotion
    trigger for domain capabilities), `serves` column + `review` row in
    `capability-catalog.md`, fifth dispatch reason in `executor-dispatch-fallback.md`,
    trigger of `fgos-capability-dispatching` and `fgos-code-panel` description switched
    from keyword matching to declared facts, one spec line in `docs/specs/runner.md`.
  design-record: plans/reports/architecture-investigation-260927-1154-capability-aware-dispatch-gate-phase4-decisions.md §11
  verification: node --test test/setup/capability-catalog-doctrine.test.mjs test/skills/*.test.mjs (40/40 pass); node --test test/report/capability-plan-lint.test.mjs test/runner/dispatch-coordination-role-tiers.test.mjs test/setup/skill-wrappers.test.mjs (124/124 pass); npm run build:skills mirrors byte-identical; git diff --check clean
  stop: CLEARED — integrated at `main@d6c0d9033`; Unit I19 unblocked.
- unit: I18 — plan lint hardening and `fgos plan-lint` verb
  capability: code:implement
  depends-on: I16 (satisfied)
  status: integrated at `main@8ece3bbdc`
  branch: `unit/I18` (Claude-only parallel execution runbook)
  candidate-sha: `8306c36d1204c6460ba9cbff204f711cab22a1f0`
  integrated-sha: `8ece3bbdcc3d30b6488e5cc4473628261e70f268` (merge --no-ff from main
    checkout onto post-I19 `main@e1dab2dfa`; ort strategy; only CHANGELOG.md
    auto-merged, no other conflicts)
  scope: see `phase-05-unit-i18-plan-lint-door.md`. Fixed confirmed lint gaps (hedged
    parenthetical, duplicate `capability:`, pin keys `executor|provider|model|tier|
    prefer|invocation|actors`, Product Gates table rows, `--cell` filter, severity
    hard|warn); read-only verb `fgos plan-lint <path> [--cell] [--json]` (exit 0/1/2);
    moved `report-capability-plan-lint`'s boundary test coverage in
    `test/test-ownership.mjs` (status correctly left `shadow` — see fix-round-1 below).
  fix-round-1: Lead-rejected the phase text's literal "move off shadow" as an
    unearned `status: 'live'` promotion — `scripts/test-select-promote.mjs` gates
    that state behind mutation-testing evidence never produced here, and it was the
    only `'live'` entry among 36 manifest rows. Reverted to `'shadow'`, kept the new
    real `directTests`/`boundaryTests` coverage (which is what "has a real caller"
    actually required).
  fix-round-2: independent review + tester found the verb violated its own
    `touchesState: false` claim (`ensureRunnerConfigForDir` creates/rewrites
    `.fgos/config.json`) — switched to read-only `loadRunnerConfigFromDir`, exit 2
    on missing config; Product Gates row parser silently truncated on a literal `|`
    inside a cell (confirmed on `plans/260910-1700-rust-host-r1-kernel/plan.md`,
    6/17 rows dropped) — fixed to tolerate embedded pipes; backtick-wrapped
    Capability/Cell cells were false hard findings on 2 of 4 real Product-Gates
    plans — fixed by stripping surrounding backticks before validation/matching;
    plus an addendum bundled into the same round: adding the verb raised
    `COMMAND_REGISTRY` from 73 to 74 entries, requiring regeneration of
    `packages/host-runtime/contracts/command-routes.json` and
    `test/rust-host/vectors/envelope/version.json` (via their own generator
    scripts) and updating the two JS test files' hardcoded counts; the unit-block/
    table parser didn't end at a markdown heading or skip fenced code, producing
    false pins/phantom Product-Gates units (confirmed on
    `docs/how-to/author-a-plan-loop-track.md`'s fenced example); `--cell`'s exit
    code and the pin-key regex's case/whitespace/bullet tolerance were also fixed;
    test names and one CHANGELOG bullet had "gap N"/"(Unit I18)" labels removed per
    the Stable Code Artifacts rule.
  fix-round-3 (final, 3-round cap reached): a second independent recheck found the
    73->74 registry bump also broke 3 Rust-side tests embedding the same count
    (`packages/distribution/rust/src/lib.rs` x2, `apps/fgos/tests/cli_tests.rs`) —
    fixed by deriving the expected count from `command-routes.json` at test time
    instead of a literal, so the next verb added doesn't repeat this; the new fence
    logic itself had two CommonMark-incorrect escape hatches (a fence-closing line
    that also carries an info string didn't count as closing; a backtick opener
    whose info string itself contains a backtick was wrongly treated as an open
    fence, swallowing the rest of the file) — both fixed and covered by tests.
  deferred (named, not proof-gaps, out of this unit's Requirements): fence
    indentation not capped at 0-3 spaces and no `warn` finding for an unclosed
    fence; stale "73 selectors" prose in `test/rust-host/harness.mjs`'s comment and
    `docs/platform/host-invocation-routing/*` (outside this unit's Files); cross-repo
    capability resolution (`registered` resolves from the linting session's own
    repo, not the target plan file's repo) — no cross-repo linting requirement in
    the phase file.
  verification: node --test test/report/capability-plan-lint.test.mjs
    test/cli/plan-lint.test.mjs (41/41 pass); node --test test/rust-host/
    command-routes.test.mjs test/rust-host/envelope-contract.test.mjs
    test/rust-host/harness.test.mjs (50/50 pass); CARGO_TARGET_DIR=<isolated>
    cargo test -p fgos-distribution --lib (43/43 pass) and -p fgos --test
    cli_tests native_version (2/2 pass); node bin/fgos.mjs plan-lint
    plans/260919-coordination-skill-harness-simplification/plan.md --json
    (ok:true, 23 units, 0 findings — real HOME, no isolation needed once merged
    onto post-I19 main); git diff --check clean. Full
    `env -u CLAUDE_CODE_SESSION_ID npm test` at integrated SHA `8ece3bbdc`, run in
    a fresh disposable worktree: 7813 tests, 7813 pass, 0 fail, 8 skip, 65 todo,
    exit 0 (run twice, isolated `test/runner/dispatch-production-call-sites.test.mjs`
    also run twice standalone at the same SHA: 20/20 both times). See the unit
    report for a false-positive the Lead independently chased and ruled out: the
    identical SHA run directly IN the main checkout (not a worktree) showed one
    deterministic failure in that same fanout test across 6 separate runs over
    two sessions, conclusively isolated to a main-checkout-specific environmental
    factor (not code — a stale `.fgos/main-checkout.lock` was one ruled-out
    theory; root mechanism undetermined) since the exact same tree content passes
    cleanly in every disposable worktree tested, including a fresh one cut from
    the exact integrated SHA. Not a regression; no fix applied; no plan/code
    changed as a result.
  report: plans/260919-coordination-skill-harness-simplification/reports/unit-I18-claude-only-execution-report.md
  stop: CLEARED — verb never reads config or calls `decide` on its state-changing
    door; confirmed read-only via `loadRunnerConfigFromDir` and a probe against an
    empty directory (exit 2, no file created).
- unit: I19 — catalog `serves` schema, `review` slot, orphan executor `for`, doctor check
  capability: code:implement
  depends-on: I17 (satisfied, integrated at `main@d6c0d9033`)
  status: integrated at `main@525a641a`
  branch: `unit/I19` (Claude-only parallel execution runbook, no fgos dispatch/coordination)
  candidate-sha: `352200cde5d3b8a1d8520e7c96c7284d3f1389de`
  integrated-sha: `525a641a1a5e7c452070bf3da79d02c6921c133b` (merge --no-ff from main checkout, ort strategy, no conflicts)
  scope: see `phase-05-unit-i19-catalog-serves.md`. Config-only: `serves` key in
    `ALLOWED_CAPABILITY_ENTRY_KEYS` + `validateCapabilitiesShape`; `serves` on every
    `DEFAULT_CAPABILITY_SLOTS` entry; new slot `review` (no prefer/overrides); doctor
    check `capability-serves-valid` that every `serves` is valid and no two entries
    declare the same set; live `.fgos/config.json` (separate commit, additive only:
    `serves`, `review`, `for` on glm/xai/deepseek — existing `prefer` unchanged).
  fix-round-1: Lead independently ran `## Verification` before merge (per runbook
    invariant 3) and found `config-not-stale` failing — the new `review` slot's live
    config entry had no `confinement` key. Fixed by matching `code:review`'s *live*
    confinement value (`{mode:"required", policy:"host-write-denied"}`), not the
    stale `unconfined` source default in `registrations.mjs` — a pre-existing,
    out-of-scope source/live drift on `code:review` itself, left untouched.
  verification: node --test test/setup/capability-catalog-doctrine.test.mjs
    test/setup/checks.test.mjs (138/138 pass); node --test test/runner/dispatch.test.mjs
    (387/387 pass); node bin/fgos.mjs doctor --dir <worktree> (config-not-stale passes;
    only pre-existing unrelated repo debt remains, e.g. shell-integration-sourced,
    root-drift, events-jsonl-not-truncated); node src/runner/dispatch.mjs decide --for
    review --dir <worktree> (`executorId":"xai"`, no `selector.unregistered`); Lead-run
    `env -u CLAUDE_CODE_SESSION_ID npm test` at candidate `352200cde` on the exact
    tested tree: 7781 tests, 7708 pass, 0 fail, 8 skip, 65 todo, exit 0 (a first run
    without the worktree's `target/` Rust binaries symlinked showed 51 unrelated
    rust-host failures — root-caused to a worktree-provisioning gap, not this unit;
    resolved by symlinking `target/` from the main checkout, same pattern as
    `node_modules`, then reran clean). `git diff --check` clean.
  report: plans/260919-coordination-skill-harness-simplification/reports/unit-I19-claude-only-execution-report.md
  gate: **Phase 5 work item 2 (binding resolver, Unit I21) may not start before I19 is integrated — SATISFIED.**
  stop: CLEARED — a config without `serves` still loads (regression test passes); `decide --for review` now resolves via `for`, no unregistered-selector change for existing registered names.
- unit: I20 — `capability-match.mjs`, `fgos capability match` verb, match log, `capability.unknown` reason code
  capability: code:implement
  depends-on: I19 (satisfied, integrated at `main@525a641a`)
  status: integrated at `main@09db1fad4`
  branch: `unit/I20` (Claude-only parallel execution runbook)
  candidate-sha: `027636e4ee91fc868deac223fef8fa12af7a58b1`
  integrated-sha: `09db1fad444a15a49efb4ee68537e3ac35a89b45` (merge --no-ff from
    main checkout onto post-I18 `main@03cc7245e`; ort strategy, no conflicts)
  scope: see `phase-05-unit-i20-capability-match-module.md`. Pure
    `matchCapability(demandFacts, catalog)` in `src/runner/capability-match.mjs`
    (imports nothing from `dispatch/` at all — stricter than the required
    bar; `RIGOR_VALUES` is a drift-tested local copy of `MIN_RIGOR_VALUES`);
    verb `fgos capability match --demand <json> [--override --reason] [--json]`;
    one `appendWorkerLog` line per call (`source: match|override|miss`);
    `compileDispatchPlan` adds `capability.unknown` for an unregistered `--for`
    name without `--needs-soul`; manifest + test-ownership entries; rust-host
    artifact regeneration for the 74->75 verb count (registry drift lesson
    carried over from I18: `command-routes.json`/envelope vectors regenerated,
    hardcoded counts converted to derive-from-routes so the next verb added
    doesn't repeat this class of break).
  design-fork: the phase text ("`form` từ `needsIndependentReview`,
    `hasPlanOrTrack`, `size`") never pins an exact `facade`/`protocol`/`inline`
    formula. Implementer consulted an advisory session and initially shipped
    `facade` gated on `hasPlanOrTrack && size==='heavy'`; independent review
    and test both found this contradicts the design record's own text
    ("hasPlanOrTrack quyết plan mode" — decides plan mode on its own). Lead
    verified the source text directly and ruled: `facade` triggers on
    `hasPlanOrTrack` alone, `size` gate removed (fix-round-1).
  fix-round-1: two MEDIUM findings from independent review — `--override`
    on a natural miss kept the forced `inline` form even for a real
    overridden capability (form now recomputed from the override); the
    `facade` threshold correction above. Plus three LOW: `--reason` without
    `--override` is now a usage error; an alias override resolves to its
    canonical capability key; a newline in `--reason` is stripped before
    logging. The fixer additionally adopted the tester's own untracked
    adversarial test files into the tracked suite (real regression coverage
    for the exact behaviors just fixed) — Lead reviewed and kept them.
  deferred (named, not proof-gaps): an extra/misspelled optional demand-fact
    key is silently ignored rather than rejected; `serves: {}` (empty but
    present) is a zero-specificity catch-all that matches any demand,
    against the spirit of "no serves = never auto-match"; the override log
    line doesn't record what the natural match would have been; a miss log
    line doesn't include the candidates array despite the doctrine text
    saying it should.
  verification: node --test test/runner/capability-match.test.mjs
    test/cli/capability-match.test.mjs (43/43 pass); test/runner/
    capability-match-adversarial.test.mjs test/cli/capability-match-
    adversarial.test.mjs (24/24 pass); test/runner/dispatch.test.mjs
    test/runner/dispatch-reconciliation-import-graph.test.mjs (413/413
    pass); test/architecture.test.mjs (13/13 pass); `capability match`
    demo confirms `form: "facade"` for a light-size plan/track unit;
    `decide --for code:implment` confirms `capability.unknown` fires
    without changing `mechanism`/`configured`; rust-host command-routes/
    envelope-contract/harness (50/50 pass); Lead-run full
    `env -u CLAUDE_CODE_SESSION_ID npm test` at candidate `027636e4e`:
    7883 tests, 1 fail — the expected pre-merge stale-shared-binary
    `release-tree.test.mjs` R3 case (same class as I18's, resolved by a
    `cargo build --release --workspace` after merge; confirmed 3/3 pass
    post-merge), 0 other failures. `git diff --check` clean.
  report: plans/260919-coordination-skill-harness-simplification/reports/unit-I20-claude-only-execution-report.md
  stop: CLEARED — module never calls `decide` or reads `.prefer` directly
    (only through `resolveExecutorAndOverrides` at a strictly later, separate
    step outside this module's own scope); `decide`'s `mechanism` field is
    unchanged, only `reasonCodes` gains the additive `capability.unknown`.
- unit: I21 — per-node binding in the request composers (Phase 5 work item 2)
  capability: code:implement
  depends-on: I19 (satisfied, integrated at `main@525a641a`), I17 (satisfied)
  status: integrated at `main@9d1fbc99d`
  branch: `unit/I21` (Claude-only parallel execution runbook)
  candidate-sha: `ed4de649ca0159747959d500e7e06ec8c48a7450`
  integrated-sha: `9d1fbc99d59b4e993173e26ccb66af9f42711371` (merge --no-ff from
    main checkout onto post-I20 `main@67bd9fb63`; ort strategy; CHANGELOG.md and
    docs/architecture-manifest.json auto-merged, no manual conflict resolution)
  scope: see `phase-05-unit-i21-per-node-binding.md`. New pure `bindOperations`
    (`src/verbs/coordination/binding.mjs`) computing one binding per actor
    (override > `policy.capability` -> `capabilities.<cap>.prefer` > `minTier`
    raise-only > `readOnlyRedirects` safety net), wired into `composeStartRequest`/
    `composeCoordinationActionRequest` and the necessary thin pass-throughs in
    `start.mjs`/`actions.mjs` (Lead-approved file-list extensions — without
    these the binding logic would be correct but never actually invoked); two
    new optional, portable-scope FlowDefinition `policy` fields
    (`capability`, `distinctProviderFrom`); new `operation-capability-resolves`
    doctor check.
  design-forks (Lead-adjudicated, phase file's Decisions section left open):
    provenance-in-`fgos coordination status` surfacing stays deferred to a
    dedicated Phase 6/7 design pass (folding dispatch-history data into the
    Phase 1 action-view read model is itself a scoped design question, not a
    thin addition); the round-3 idempotent-start fix required a design
    decision on what "did the caller ask for something different" should
    durably compare against (resolved via an advisory consultation with full
    evidence — compare only caller-declared roster identity/persona, never
    per-request dispatch policy, since the manifest never durably stores the
    latter for any session, before or after this unit).
  independent-review-history: this is the most heavily red-teamed unit in the
    track to date — an initial review found 4 HIGH + 3 MEDIUM findings before
    any fix; two subsequent recheck passes each found one MORE genuine HIGH
    that the prior round's own fix-and-test cycle had missed. Three fix
    rounds (the full cap) were used; every round's fix was independently
    re-verified by Lead directly reading/running the code, not only trusting
    agent reports.
  fix-round-1 (86b3cd546): H1 — a portable FlowDefinition's `policy.capability`
    could name a literal registered executor id (e.g. `"claude"`) and
    `resolveExecutorAndOverrides` would treat that as a valid resolution
    (`bindingSource: 'executor-id'`), bypassing `assertNoPortableExecutorPin`
    entirely (the exact "smuggle preferExecutor under policy.capability"
    attack the phase file's own red-team item names, via a different literal
    string) — fixed by refusing that branch. H2 — a Lead-supplied CLI
    `--executor`/`--tier` flag was silently outranked by the newly-computed
    per-actor binding (`actorPolicyFields`'s `actorEntry?.executor ??
    globalExecutor` in run.mjs now had a real value to prefer, inverting
    Decision 1 step 1's precedence) — fixed by threading `cliExecutor` through
    to suppress computed additions when present. M3 (opPolicy.preferExecutor
    outranked) was attempted, reverted after breaking an already-passing
    red-team test, and root-caused to session-engine.mjs's pre-existing
    `cli`-scope-outranks-`assignment`-scope precedence — confirmed
    out-of-boundary and pre-existing (session-engine.mjs untouched by this
    unit's diff); deferred, not blocking.
  fix-round-2 (a138e4353, 6d55adb94): H4 — a live confinement/security
    regression, independently reproduced by Lead: the generic `review`
    capability (deliberately declared with no `.prefer` by I19) fell through
    to the executor-reverse-mapping `capability.for` branch, silently pinning
    all 8 `architecture-advisory-panel-v1` actors onto an unconfined
    `xai`/`pi-cli-vantt` executor (write/edit/bash, no sandbox) instead of the
    pre-I21 `readOnlyRedirects` safety net (a confined, read-only path) —
    fixed by restricting accepted resolutions to exactly
    `bindingSource === 'capability.prefer'`. Plus: a tier-only roster entry
    was silently suppressing its actor's capability-computed executor
    entirely (fixed, the two now layer correctly); a CHANGELOG regression
    from round 1 (accidentally replaced the I17 entry instead of adding
    alongside it, fixed); SKILL.md's `--actors` override claim corrected to
    state the entry-node-only limitation honestly (H3/item-2, the start-time
    roster override never reaching later `authorize-and-dispatch` nodes, was
    investigated in full and confirmed a genuine PRE-EXISTING gap — the
    persisted manifest/session actor shape, `ACTOR_FIELDS` in
    `runner/coordination/schema.mjs` plus `store.mjs`'s object literals, never
    had an executor/tier field at all, predating this unit entirely, per
    run.mjs's own "the roster is per-request, not per-session" comment;
    deferred, needs a real schema/store change outside this unit's boundary).
  fix-round-3 (1edef28f4, ed4de649c, FINAL — 3-round cap reached): a second
    independent recheck found ANOTHER HIGH neither prior round caught: retrying
    `coordination start` on an existing session failed with `payload-conflict`
    whenever any actor received a capability-computed binding, because the
    idempotency check (`start.mjs` step 8) compared the fully-merged
    `requestObject.actors` (which now always carries synthetic `{id, executor}`
    additions with no `role`) against `existingManifest.actors` (which always
    has a real `role`) — a real reliability regression hitting the live
    `standalone-master-coordination-loop` config on every retried/resumed
    `start`. Root-caused (with a correction to Lead's own initial diagnosis:
    `role` is schema-forbidden on every request actor entry, not merely absent
    on computed ones) and fixed by comparing only the caller's raw
    `options.actors` against what the manifest durably owns (actor identity +
    `persona` — the only two properties a declared-protocol actor's manifest
    entry ever carries, copied verbatim from the protocol's own `spec.actors[]`
    and never touched by any request). This defect is confirmed pre-existing
    since the commit that introduced the check (`232ef31e1`, well before I21)
    — it simply never fired before because non-empty `actors[]` on a `start`
    retry was rare until this unit made computed bindings the default. Also
    fixed: the new doctor check accepted the same loose resolution branches
    `binding.mjs` itself refuses (same root cause as H1/H4, in a file the
    first two rounds never touched — now requires `bindingSource ===
    'capability.prefer'` too); SKILL.md and `author-a-plan-loop-track.md` both
    corrected to name `--executor <id>`/`--tier` as the actual per-step lever
    instead of vaguely "repeat the override" (`--actors` does not exist on
    `authorize-and-dispatch`/`operation` at all).
  deferred (named, confirmed pre-existing/structural, not proof-gaps against
    this unit's own Requirements):
    - a start-time roster override does not durably persist and therefore
      cannot be forwarded to a later `authorize-and-dispatch` node for the
      same actor (needs an `ACTOR_FIELDS`/store.mjs schema change, outside
      this unit's file boundary; the I16 finding this unit exists to close
      was specifically about capability-computed bindings reaching later
      nodes, which now works — explicit roster overrides reaching later
      nodes was never separately promised and remains the pre-existing gap);
    - `bindingSource` never survives to the persisted `dispatch-plan.json` as
      the literal string `"capability.prefer"` — binding.mjs resolves a
      capability to a literal executor id once, and the second, real-dispatch
      resolution legitimately re-hits the `executor-id` branch for that
      now-literal id (same family as the already-deferred status-surfacing
      gap, confirmed via a real live-proof run, not inferred);
    - `facts` (the DemandFacts advisory-fallback context) is never supplied
      by any production caller (`start.mjs`/`actions.mjs`), so
      `deriveOperationCapability`'s `facade-primary`/`<domain>:review`
      fallback branches are unreachable in production and a future
      `strength: 'required'` diversity refusal would have no CLI-reachable
      `allowDiversityUnsatisfiable` escape — latent, no shipped protocol uses
      `required` yet;
    - a roster entry supplying `invocation` without `executor` now has that
      invocation silently overwritten by the capability-computed executor's
      own invocation choice — narrow, no shipped protocol does this today.
  verification: node --test test/verbs/coordination-binding.test.mjs
    test/runner/coordination-request-composers.test.mjs (25/25 pass);
    test/runner/flow-definition-schema.test.mjs test/runner/
    flow-definition-standalone-master-coordination-loop.test.mjs test/verbs/
    coordination-architecture-advisory-panel-conformance.test.mjs (100/100
    pass); test/runner/cohort-planner.test.mjs test/runner/
    cohort-planner-purity.test.mjs (28/28 pass); test/skills/
    coordination-phase4-driver-discipline.test.mjs (9/9 pass); test/setup/
    checks.test.mjs (120/120 pass); `node bin/fgos.mjs doctor`:
    `operation-capability-resolves` passes ("6 declared operation.policy.capability
    value(s) resolve; 2 distinct provider families reachable ([gemini, openai])");
    live proof (real `bindOperations` call against the committed config and the
    real `standalone-master-coordination-loop`/`architecture-advisory-panel-v1`
    protocols, independently reproduced by Lead): doer/fixer bind
    `code:implement.prefer`, reviewer/red-team bind `code:review.prefer`, all 8
    advisory-panel `review`-capability actors correctly `unbound` (falling
    through to `readOnlyRedirects`, confined); Lead-run full
    `env -u CLAUDE_CODE_SESSION_ID npm test` at candidate `ed4de649c`: 7803
    tests, 7730 pass, 0 fail, 8 skip, 65 todo, exit 0; `git diff --check` clean.
    Post-merge full suite on the main checkout showed the same 3
    `fanoutBatchExecutorCli` failures already documented in Unit I18's
    report as a main-checkout-specific test-environment anomaly (not
    reproducible in a fresh worktree at the same integrated SHA, confirmed
    again here: 20/20 pass); not a regression from this unit.
  report: plans/260919-coordination-skill-harness-simplification/reports/unit-I21-claude-only-execution-report.md
  stop: CLEARED — `session-engine.mjs` untouched by this unit's diff (no
    binding decision moved into the kernel); `assertNoPortableExecutorPin`
    confirmed still refuses `preferExecutor` at every portable scope, and the
    round-1 H1 fix closes the equivalent bypass through `policy.capability`
    naming a literal executor id; replay of an existing session's derived
    state is unaffected (only the request-compose-time `actors[]` shape
    changed, not anything schema/store persists).
- unit: I22 — migrate architecture-panel per-role packets into prompt templates (Phase 5 work item 1)
  capability: code:implement
  depends-on: none (Phase 3/I04 template wiring already satisfied)
  status: VERIFIED/integrated at `main@387570ed3` (candidate `0076ba66f`;
    3 fix rounds closed a HIGH content-loss finding (Context Investigator
    guidance deleted with no replacement), a repo-wide constraints-rendering
    bug (every dispatched prompt through this path rendered "no constraints"
    regardless of real content — no Assignment builder ever promotes
    constraints to a top-level field, only nested under provenance; fixed
    with the same fallback chain `legality-facts.mjs` already uses), 2 real
    MEDIUM content-loss findings (Lead Advisor's PROJECT_ROOT/private-notes
    lane rule, the "becoming the panel" avoid), and a scope-wording issue in
    3 templates that implied evidence access beyond `{contextRefs}`; full
    suite 7906 pass / 1 fail (confirmed pre-existing flake in
    `test/runner/dispatch.test.mjs`, unrelated file, 390/390 pass in
    isolation, not a regression); Lead independently re-verified every
    finding and fix by reading the diffs directly, not solely on the
    fixer's self-report)
  design-record: plans/reports/fork-260927-2024-phase5-items-1-3-4-5-6-decomposition-research-report.md §Item 1
  scope: `core/coordination-protocols/architecture-advisory-panel-v1.yaml`
    already declares `task.contractTemplate` across its 14 operations (14
    `contractTemplate` references resolving to 12 unique template ids —
    independent decomposition review corrected the earlier "13 operations"
    count); only `architecture-advisory-panel-v1-scout-report.md` exists.
    Author the 11 missing `core/prompt-templates/
    architecture-advisory-panel-v1-*.md` files (interpretation,
    system-proposal, alternative-proposal, constraint-proposal, critique,
    constraint-findings, specialist-answer, synthesis, redteam, explanation,
    close-dialogue), each following the existing `scout-report` template's
    exact placeholder convention (`{role}`, `{objective}`, `{contextRefs}`,
    `{expectedOutputs}`, `{constraints}`, `{evidenceContract}`), absorbing
    the matching role's packet content from `core/skills/fgos-architecture-panel/
    SKILL.md`'s "Per-Role Task Packets" section (lines 324-594; the design
    record cites the exact operation-id -> role mapping) — preserve the
    existing `Task-spec:` line the current assignment path renders
    (`assignment.mjs` ~L738-755) rather than silently dropping it, and never
    cite a role-doctrine file path inside a template (bounded variables
    only reach the rendered prompt; a path reference would break across the
    dispatch boundary — this is an already-known gap, not new to this
    unit). Once every operation resolves a real template, trim SKILL.md's
    packet prose to a short pointer (same pattern Phase 3/I04 used
    elsewhere), and resync `.claude/skills`/`.agents/skills`/
    `plugins/fgOS/skills` mirrors via `npm run build:skills`. Do NOT touch
    the FlowDefinition YAML — its `contractTemplate` refs are already
    correct; do not widen a template's authority beyond cognitive
    instructions/artifact shape (Phase 3's own guardrail: a template can
    refine judgment prose, never graph legality). This unit does NOT claim
    Phase 5's Exit-level "fixed-case quality eval" / "≥60% Lead-token
    reduction without quality regression" measurement — that is a
    track-wide Phase 5 exit gate evaluated once every applicable work item
    (1, 7, 8) has landed, not a per-unit deliverable; this unit only
    confirms its own word-count delta (I15/I16 pattern) and that nothing
    regresses conformance. Note for whoever measures the Exit gate later:
    this migration changes who reads the content (Lead-read packets become
    actor-read rendered templates) — factor that into the quality eval, not
    just the word count.
  verification: node --test test/runner/operation-prompt-templates.test.mjs
    (extend with one case per new template resolving/rendering with bounded
    variables only); node --test test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs
    (must stay green — confirms no legality change); word-count check on the
    trimmed SKILL.md (same pattern as I15/I16); npm run build:skills mirrors
    byte-identical; env -u CLAUDE_CODE_SESSION_ID npm test.
  stop: a template widens authority beyond cognitive instructions/artifact
    shape; graph legality changes; a mirror fails to stay byte-identical.
- unit: I23 — public CLI surface for group-thinking pack dispatch (Phase 5 work item 3)
  capability: code:implement
  depends-on: none
  status: VERIFIED/integrated at `main@94c2aaf49` (candidate `0e936aa89`; 1
    fix round closed 2 real MEDIUM test-coverage gaps (a resume test that
    would pass even if resumption silently opened a second session — fixed
    by replaying the session's real on-disk ledger and checking both
    calls' operation stamps; missing `--tier` forwarding coverage), plus an
    addendum fixing stale skill prose (wrong step-kind count, wrong
    implicit-close claim) and adding a test for a pre-existing,
    previously-uncovered gate-refusal path (resuming an `agent-led` session
    under a pack protocol) that this unit's own diff touches; full suite
    7923 pass / 0 fail; `COMMAND_REGISTRY.length` unchanged at 75, no
    rust-host regeneration needed; Phase 5 work item 3 satisfied)
  design-record: plans/reports/fork-260927-2024-phase5-items-1-3-4-5-6-decomposition-research-report.md §Item 3; independent decomposition review (Track Manager) folded into this revision.
  decision (Lead, locked, do not reopen — REVISED after independent review's
    M4/M5 findings): drop the earlier "new top-level `fgos group-thinking`
    verb" call. Reasons: (1) the pack code already lives in
    `src/verbs/coordination/`, and `coordination` already has an extensible
    per-kind subverb mechanism (`bin/fgos.mjs`'s `KNOWN_COORDINATION_SUBVERBS`,
    `command-registry.mjs`'s subverb enum) that does NOT touch
    `COMMAND_REGISTRY.length`/`command-routes.json` — a top-level verb would
    have required the full I18/I20-style rust-host regeneration for no
    reason; (2) naming a durable public CLI door after a skill
    (`fgos-group-thinking`) that Phase 5 work item 8 turns into a deprecated
    stub is an avoidable inconsistency. New shape: `fgos coordination pack
    list` (wraps `loadProtocolPack`, replaces step 1's `node -e` block);
    `fgos coordination pack show-protocol <id>` (wraps
    `loadCoordinationProtocol` — confirmed no existing verb exposes raw
    protocol-shape inspection by id: `coordination show` is session-replay
    only, `workflow operations` is stage ops; this is a genuinely new
    sub-door, replaces step 2's block); `fgos coordination pack run
    --protocol <id> --file <path>` (wraps `runGroupThinkingRequest`'s
    pack-membership gate, replaces step 4's block; size with the same care
    as I20's `capability match` verb, not a thin pass-through; forward
    `--executor`/`--tier`/`--model` the same way plain `coordination run`
    already does via `cliOverride`). Do NOT add a `--resume <coordinationId>`
    flag — `runGroupThinkingRequest` has no resume parameter; "resume" is
    just resubmitting a request file whose `coordinationId` already exists
    (`group-thinking-pack.mjs` L234-238, L328), and the skill text already
    says this mechanism needs no separate flag. Steps 3 (compose) and 5
    (replay) already use real public doors and are NOT part of this unit.
  scope: `bin/fgos.mjs`, `src/cli/command-registry.mjs` (new `pack` subverb
    entries under the existing `coordination` verb — no top-level registry
    growth, no rust-host regeneration needed); `src/verbs/coordination/
    group-thinking-pack.mjs` (read-only — the new subverb(s) call its
    existing exports, never reimplement them); `core/skills/
    fgos-group-thinking/SKILL.md` (+ mirrors) to replace all three `node -e`
    blocks with the new CLI invocations; `docs/how-to/
    use-fgos-group-thinking.md` (also has a `node -e` block, L25 — same
    replacement); `docs/architecture-manifest.json`; `test/test-ownership.mjs`;
    `CHANGELOG.md` (user-visible new CLI surface, own sub-heading).
  verification: existing `test/verbs/coordination-group-thinking-pack.test.mjs`,
    `test/runner/coordination-group-thinking-rfc-review-lite.test.mjs`,
    `test/verbs/coordination-group-thinking-pack-registration.test.mjs`
    (bypass-invariant coverage — must stay green, confirms this unit doesn't
    accidentally touch pack-gate behavior) all stay green; new
    `test/cli/coordination-pack.test.mjs` covering list/show-protocol/run
    against real fixtures, including the `--executor`/`--tier`/`--model`
    forwarding; env -u CLAUDE_CODE_SESSION_ID npm test.
  stop: the new subverb(s) reimplement pack-membership/dispatch logic instead
    of calling `group-thinking-pack.mjs`'s existing exports; a duplicate
    protocol-shape-inspection door is created where one already existed; any
    change to `COMMAND_REGISTRY.length` sneaks in (this unit should not need
    rust-host regeneration at all — if it turns out to, stop and report why).
- unit: I24a — specialist-authorize request-step door, unlocked path only (Phase 5 work item 4, part 1)
  capability: code:implement
  depends-on: none
  status: VERIFIED/integrated at `main@35be2c10d` (candidate `6b0420295`; 1
    fix round closed: a real idempotency gap (a retry reusing the same
    `specialistAuthorizationId` with different content was silently echoed
    as authorizing whatever the caller claimed — `store.mjs`'s
    `recordSpecialistAuthorization` now matches every sibling
    driver-authored door's canonical-payload-compare-and-refuse pattern); a
    DAG-mode gap (`triggerEvidenceRefs`/`allowedContextRefs` on this step
    type created no dependency edge — `dag-request-compiler.mjs` fixed);
    and doc wording across 5 files/mirrors that inaccurately claimed only
    `run --file` could reach this step type, when `coordination
    start --steps` and the headless adapter already could too by design
    (not a privilege escalation — both already passed every OTHER step
    type unfiltered before this unit; H3's real invariant, the pack gate's
    own refusal, was confirmed solid and is unchanged). H3 decision text
    below revised in place to match the corrected scope; the original
    literal "ONLY `run --file`" wording is superseded by this same status
    line, not silently edited. Full suite 7929 pass / 0 fail. Composers.mjs
    correctly NOT touched (deliberate, independently reviewer-verified: no
    other non-locked step type has one either); I24b inherits the FULL
    composer-case build (a new action kind, the `Locked` engine twin, the
    subverb) as its own scope, corrected from an earlier misreading that
    assumed I24a would partially cover it. Filed for separate attention,
    not fixed here (pre-existing, out of this unit's diff): `store.mjs`'s
    `authorizeOperationLocked` has the same weak-idempotency pattern this
    unit's fix closed for `recordSpecialistAuthorization` — worth its own
    work item.
  design-record: plans/reports/fork-260927-2024-phase5-items-1-3-4-5-6-decomposition-research-report.md §Item 4; independent decomposition review (Track Manager) found the original single I24 unimplementable as scoped (H1-H3) — split into I24a/I24b per that review's M3, this is I24a.
  decision (Lead, locked, do not reopen — H3 from the decomposition review;
    REVISED post-merge after independent test+review found the original
    "ONLY `run --file`" wording factually incomplete — see fix-round
    finding below):
    "authorize a specialist" is registered as group-thinking pack-gate
    bypass #4 (`docs/architect/agent-coordination/contracts/
    coordination-session.md`'s "Group-Thinking Protocol Pack" § "Five
    bypasses, verified structurally impossible"; pinned by
    `test/verbs/coordination-group-thinking-pack-registration.test.mjs`'s
    header/assert ~L399). This unit does NOT reopen that invariant. The new
    `specialist-authorize` request-step type is added to `run.mjs`'s public
    request vocabulary, reachable through any raw coordination request door
    (`coordination run --file`, `coordination start --steps`, the headless
    adapter — confirmed live: `start --steps` and the headless adapter
    already passed every OTHER step type through unfiltered before this
    unit, so this is not a new escalation, just corrected documentation);
    the group-thinking pack gate must continue to REFUSE this step type
    exactly as it refuses every other bypass today (option (b) from the
    review, not (a) — do not amend the bypass list or the pack gate's own
    refusal behavior; a pack-registered protocol still cannot reach
    specialist authorization through `runGroupThinkingRequest`, confirmed
    by an explicit new gate-level check added in the fix round since the
    gate previously relied only on `run.mjs`'s vocabulary lacking the step,
    not a check of its own). The driver-authenticated typed-action path (a
    real, tested door once I24b lands) is the intended route for
    group-thinking-adjacent flows; this unit only closes the RAW
    direct-engine-call escape hatch, nothing more.
  scope: `authorizeSpecialistSlot` (`src/runner/coordination/
    session-engine.mjs:1586`) has no composer/request-step wrapper today
    (confirmed: the only non-test caller is a historical one-off script, not
    live code) — the direct-call escape hatch `fgos-architecture-panel/
    SKILL.md`'s "Never Reimplements The Kernel" section names as `tsk-3xk`.
    Add a `specialist-authorize` request-step type
    (`src/verbs/coordination/schema.mjs`, following the exact validation
    shape of the existing step types) and a composer in
    `src/verbs/coordination/composers.mjs` that calls
    `authorizeSpecialistSlot` the same way every other composer calls its
    own session-engine function, wired into `run.mjs`'s request-kind
    dispatch switch for the UNLOCKED (`coordination run --file`) path only
    — I24b covers the locked/typed-action path, which needs a `Locked`
    engine twin this unit does not build. Update SKILL.md's "Never
    Reimplements The Kernel" section to name the new door and retire
    `tsk-3xk` from Known Gaps (but do NOT claim the typed-action/subverb
    path exists yet — that's I24b). Update the YAML header comment
    (`architecture-advisory-panel-v1.yaml` ~L70-82, comment only, never the
    graph) and `fgos-architecture-panel/SKILL.md`'s Executor Roster section
    (~L285) to stop pointing at the retired direct-call path. Explicitly
    confirm (add a test) the group-thinking pack gate still refuses this new
    step type — the H3 decision above is not self-enforcing without one.
  files: src/verbs/coordination/schema.mjs, src/verbs/coordination/composers.mjs,
    src/verbs/coordination/run.mjs, core/skills/fgos-architecture-panel/SKILL.md
    (+ mirrors), core/coordination-protocols/architecture-advisory-panel-v1.yaml
    (header comment only), docs/architect/agent-coordination/contracts/
    coordination-session.md (confirm bypass-#4 wording still accurate — do
    not weaken it), CHANGELOG.md. Do NOT touch `session-engine.mjs`'s
    `authorizeSpecialistSlot` itself, `store.mjs`, `bin/fgos.mjs`,
    `command-registry.mjs`, or `actions.mjs` — those belong to I24b.
  verification: node --test test/runner/coordination-specialist-binding.test.mjs
    (existing — extend to exercise the new request-step path via
    `coordination run --file` alongside/instead of the direct call);
    node --test test/verbs/coordination-group-thinking-pack-registration.test.mjs
    (must still assert bypass #4 refused — this unit adds a NEW refused-step
    case, doesn't remove the old one); node --test test/verbs/
    coordination-architecture-advisory-panel-conformance.test.mjs;
    env -u CLAUDE_CODE_SESSION_ID npm test.
  stop: the group-thinking pack gate stops refusing `specialist-authorize`
    (that would silently flip the H3 decision); `specialist-authorize`
    becomes reachable through a pack-gated protocol (via `runGroupThinkingRequest`)
    before I24b lands — reachability through any OTHER raw request door is
    within the corrected H3 scope above, not a stop condition.
- unit: I24b — typed `specialist` action-view case and locked/typed-action door (Phase 5 work items 4 part 2, 5, 6)
  capability: code:implement
  depends-on: I24a
  status: VERIFIED/integrated at `main@5c63ac40d` (candidate `88691f646`; 1
    fix round closed 2 HIGH findings and 2 MEDIUM findings. HIGH-1: `specialist`
    was the ONLY action kind missing an idempotent-retry branch in
    `action-precondition.mjs`'s reconstruction chain (confirmed by Lead: all
    7 other kinds — close/dispatch-operation/authorize-and-dispatch/
    record-disposition/link-contribution/record-human-turn/fan-out — have
    one), silently violating the module's own documented general contract;
    two tests titled "stays idempotent on retry" actually asserted the
    refusal, locking the bug in. HIGH-2: the `specialist` action-view's
    `exhausted` field disagreed with the kernel's real authorization rule
    (re-authorizing an already-recruited specialist actor is unconditionally
    legal regardless of its own expiry/spent maxAssignments; only a NEW
    distinct actor is capped) — two independent red-team agents disagreed on
    this finding's severity (LOW vs HIGH); Lead settled it via direct code
    read and live-probe cross-check, sided with HIGH, fixed the projector
    (not the kernel) to match real kernel behavior. MEDIUM: an invocation-count
    key mismatch (re-keyed to the kernel's real per-actor-cap granularity,
    which surfaced and required fixing 2 MORE pre-existing tests sharing the
    same wrong assumption) and 5 stale "not built yet" doc references. Full
    suite 7937 pass / 0 fail (1 pre-existing timing flake confirmed
    reproducing on unmodified baseline code, not a regression). Phase 5 work
    item 4 (I24a+I24b) fully satisfied.
  design-record: plans/reports/fork-260927-2024-phase5-items-1-3-4-5-6-decomposition-research-report.md §Items 4, 5, 6; independent decomposition review (Track Manager) H1, H2, M1, M2.
  scope: (H1) the typed-action execution path
    (`actions.mjs`'s `executeCoordinationActionUseCase` -> `run.mjs`
    ~L520-553) runs every step while HOLDING the events lock
    (`events.mjs:325`, a non-reentrant pid lock) — every existing door has a
    `*Locked` twin (`authorizeDeclaredOperationLocked`,
    `recordHumanTurnLocked`, `recordDriverDispositionLocked`, etc.).
    `authorizeSpecialistSlot` -> `store.mjs`'s `recordSpecialistAuthorization`
    (~L1289) calls `withEventsLock` itself and has NO `Locked` twin — calling
    it from the already-locked typed-action path would self-deadlock (wait
    until the lock's own timeout). Add `recordSpecialistAuthorizationLocked`
    (`store.mjs`) and `authorizeSpecialistSlotLocked`
    (`session-engine.mjs`) as siblings of the existing function (never
    modify the existing unlocked ones I24a already wired). (H2) typed
    actions can only be executed through per-kind `fgos coordination
    <subverb>` verbs (`bin/fgos.mjs`'s `KNOWN_COORDINATION_SUBVERBS`,
    `command-registry.mjs`'s subverb enum, `actions.mjs`'s own use case) —
    add the `specialist-authorize` subverb the same way, wired to call the
    new Locked composer/action path; this does NOT touch
    `command-routes.json`/rust-host regeneration (subverbs are
    `coordination`-internal, confirmed by I24a/I23's own research). This
    unit owns the FULL new `composers.mjs` case for this kind (a per-kind
    `compose*Request` entry, matching `authorize-and-dispatch`/
    `record-disposition`/`record-human-turn`/`link-contribution`'s existing
    shape) — I24a's independent review confirmed those 4 kinds already have
    composer entries (an earlier "no step type has a composer" reading was
    wrong; I24a correctly built the unlocked path inline in `run.mjs`
    instead, matching every OTHER non-locked step type, and correctly left
    the composer to this unit since it only feeds the locked path). Add a
    `specialist`-kind action to `src/runner/coordination/
    actions-projector.mjs`'s `projectCoordinationActions` (Phase 1's own
    Cases list requires the typed action view to distinguish "specialist
    slot available/unauthorized/exhausted") built on the EXISTING
    `specialistSlots` fact `evaluateSpecialistSlots` already computes
    (`legality-facts.mjs:550`/`1091` — the projector already imports
    `legality-facts.mjs` at line 11 but never uses this fact; reuse it,
    don't build a parallel computation) — mechanical legality data only (is
    a slot authorizable, is it authorized, is it exhausted), never a
    judgment field. (M2) `evaluateSpecialistSlots` only returns `bound`
    today, not enough to derive "exhausted" — extend `legality-facts.mjs`
    to also account for the slot's `maxBindings`, a binding's
    `maxAssignments`, and `expiresAfterRound`/round liveness
    (`resolveLiveSpecialistBindings`, `session-engine.mjs:~1128`) rather
    than inventing separate logic in the projector. (M1) before treating
    bounded-reopen visibility (item 5's other half) as already-solved,
    directly confirm via a real/test probe against a `phase-dialogue-reopen`
    session covering BOTH invocations of a `maxInvocations: 2` reopen
    operation (`revise-synthesis`/`revise-explanation`,
    `architecture-advisory-panel-v1.yaml` L531-540) — `evaluateDriverAuthorizedBindings`
    (`legality-facts.mjs:533-545`) keys pending state by
    `nodeId::operationId` and ignores `maxInvocations`, so the SECOND
    invocation likely never appears as legal in the action view today; if
    confirmed, fix `legality-facts.mjs` so both invocations are visible
    within their declared bound, and add a test covering invocation #2
    specifically (a test that only exercises invocation #1 would pass
    against the bug). Work item 6: add a regression test asserting the new
    `specialist`-kind action (and, for good measure, the existing kinds)
    carry only mechanical legality fields, consistent with Phase 1's locked
    contract ("describes legal choices but never chooses one").
  files: src/runner/coordination/session-engine.mjs (new `Locked` sibling
    export only — do not modify `authorizeSpecialistSlot` itself),
    src/runner/coordination/store.mjs (new `Locked` sibling export only),
    src/runner/coordination/legality-facts.mjs, src/runner/coordination/
    actions-projector.mjs, src/verbs/coordination/actions.mjs, bin/fgos.mjs,
    src/cli/command-registry.mjs (new `coordination specialist-authorize`
    subverb — coordinate with I23 if still in flight on this same file;
    sequential is safer than parallel here), CHANGELOG.md.
  verification: node --test test/runner/coordination-specialist-binding.test.mjs
    (extend for the Locked path); node --test test/runner/
    coordination-legality-facts.test.mjs (existing — extend for the
    exhausted-derivation and maxInvocations fixes); node --test test/verbs/
    coordination-architecture-advisory-panel-conformance.test.mjs; new test
    proving BOTH invocations of a maxInvocations:2 reopen operation appear
    as legal actions within bound (not just the first); new regression test
    for work item 6's mechanical-only-fields invariant; new CLI test for the
    `specialist-authorize` subverb; env -u CLAUDE_CODE_SESSION_ID npm test.
  stop: the typed-action path deadlocks under the events lock (a `Locked`
    twin was skipped or miswired); the projector's `specialist` action (or
    any other action kind) carries a judgment field instead of mechanical
    legality data; the second invocation of a bounded-reopen operation is
    still invisible to the action view after this unit claims it's fixed;
    the H3 decision (pack gate still refuses `specialist-authorize`) is
    weakened by anything in this unit.
- unit: I25 — real-protocol conformance for human-turn/bounded-reopen visibility, allowlist hardening (Phase 5 work items 5, 6, narrow remainder)
  capability: code:implement
  depends-on: none (I24a/I24b already closed)
  status: VERIFIED/integrated at `main@165bae767` (candidate `04811fb3e`; 0 fix
    rounds — no HIGH/MEDIUM findings from either independent test or review;
    mutation testing (10 injected-field probes across all 8 action kinds)
    confirmed the new allowlist test genuinely detects regressions, 9/10
    caught immediately, 1 flagged a real but separately-tracked coverage
    gap (no fixture repo-wide exercises `record-disposition`'s conditional
    `allowedValues` branch); full suite 7939 pass / 0 fail; Phase 5 work
    items 5/6 fully satisfied)
  design-record: plans/reports/fork-260928-0024-phase5-items-5-6-7-8-decomposition-research-report.md §Items 5, 6; independent decomposition review (`review-decompose-i25-i26`) M1-M3 folded into this revision.
  scope: work items 5 and 6 were substantially closed as a side effect of
    I24b's own M1 fix (`evaluateDriverAuthorizedBindings` now correctly
    keeps a `maxInvocations:2` bounded-reopen operation like
    `revise-synthesis`/`revise-explanation` pending across both
    invocations) and its work-item-6 mechanical-fields test
    (`test/runner/coordination-actions-v1.test.mjs`). The decomposition
    review confirmed `coordination-architecture-advisory-panel-conformance.test.mjs:717`
    ("bounded-reopen visibility (M1)") ALREADY asserts, against the real
    `architecture-advisory-panel-v1` protocol, that `revise-synthesis` is
    visible before any reopen, after invocation #1, and gone after
    invocation #2 — do not duplicate this. The genuine remaining gaps: (a)
    `revise-explanation`'s own action-view visibility across invocations #1
    and #2 (today only its door-level over-cap REFUSAL is tested, ~L806 —
    add the same before/#1/#2 visibility assertions L717 already uses for
    `revise-synthesis`, applied to `revise-explanation`); (b)
    `record-human-turn`'s presence in the real protocol's typed action view
    (not just the generic unit-level tests already covering it). Work item
    6: the mechanical-fields test (`coordination-actions-v1.test.mjs:119`)
    checks every kind OTHER than `specialist` against only an 8-name
    denylist, while `specialist` alone gets a strict allowlist — harden to
    an allowlist for every action kind the projector actually emits. The
    review found the real fixture only emits `dispatch-operation`,
    `authorize-and-dispatch`, `record-human-turn`, and `specialist` — the
    other kinds (`fan-out`, `record-disposition`, `link-contribution`,
    `close`) never appear in it, so achieving true per-kind allowlist
    coverage needs either new per-kind fixtures or a sweep over whichever
    OTHER test files already exercise those kinds' own real projections
    (grep `actions-projector.mjs`'s kind-specific field additions — e.g.
    `fan-out` adds `allowedActorIds`/`allowedValues`; `record-disposition`/
    `link-contribution` add a conditional `allowedValues`) — allowlist ONLY
    the top-level keys the projector emits per kind, never recurse into
    field VALUES (`rationale` is itself a legitimate `requiredInputs` value
    name for `record-disposition` and would false-fail a value-level scan).
    State explicitly whether `target`'s own sub-keys (e.g.
    `dispatch-operation`'s optional `target.authorizationId`) are in scope
    for the same allowlist treatment — they are, for the same reason.
  files: test/runner/coordination-actions-v1.test.mjs,
    test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs,
    src/runner/coordination/actions-projector.mjs (read-only reference for
    the per-kind field allowlist — do not modify the projector itself, this
    unit only hardens tests against its existing, correct output). Grepped
    and confirmed clean: no stale "human-turn/bounded-reopen not yet in the
    typed view" claim exists anywhere today, so no doc sweep is needed —
    `fgos-architecture-panel/SKILL.md` is NOT touched by this unit (I26
    edits that file; keeping this unit's files list disjoint from I26's is
    what makes the two safely parallel). No CHANGELOG.md entry — this is a
    test-only change with no user-visible behavior.
  verification: node --test test/runner/coordination-actions-v1.test.mjs;
    node --test test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs;
    env -u CLAUDE_CODE_SESSION_ID npm test.
  stop: this is test-only — the allowlist hardening cannot break a real
    caller (nothing calls a test file), so the real risk is only an
    overly-narrow allowlist making CI fail on the projector's genuine,
    existing output; if that happens, widen the allowlist to match reality,
    never narrow the projector; the real-protocol conformance test can't be
    made to pass without a code change beyond this unit's stated scope
    (that would mean I24b's M1 fix was incomplete — escalate, don't
    silently patch around it here).
- unit: I26 — architecture-panel/fgos-panel consume the driver-discipline fragment (Phase 5 work items 7, 8)
  capability: code:implement
  depends-on: none (I17 fragment and I20 capability-match door already integrated per Phase 5's own entry gate)
  status: VERIFIED/integrated at `main@63ac08f5f` (candidate `933b32b87`; 1
    fix round closed 4 real MEDIUM findings independently confirmed by both
    test and review agents: a disposition-vocabulary mapping that silently
    contradicted the kernel's real accept/reject classifier (Lead
    independently confirmed by reading `recordDriverDispositionLocked`'s
    hardcoded 5-item denylist directly — the literal strings "answered"/
    "invalidated-by-evidence" would have been ACCEPTED by the real kernel
    despite the hook table claiming they map to fragment "rejected"; fixed
    by naming the exact literal `--disposition` CLI value for every one of
    the six vocabulary words and remapping `unresolved` from `accepted` to
    `deferred` since it can never satisfy the accepted-finding recheck
    requirement); a false claim that `fgos-code-panel` has its own hook
    table (it doesn't — restated as a known Phase 5 gap); a capability
    attribution contradicting `fgos-panel`'s own stated scope boundary
    (architecture-panel now calls `fgos capability match` itself rather
    than assuming a caller pre-resolved it); and a self-contradictory,
    incomplete close-mechanism specification (added the required explicit
    close instruction). Full suite 7938 pass / 0 fail (1 pre-existing
    DAG-concurrency flake confirmed 9/9 in isolation, not a regression).
    This unit's own decomposition needed 2 review rounds before
    implementation began — the first found the original "fold
    fgos-group-thinking into a stub" wording unimplementable (would have
    relocated correct, single-source-of-truth documentation into a file
    whose own Boundaries forbid holding that detail) and the fragment/
    disposition-vocabulary reconciliation genuinely unspecified; both
    resolved via dedicated investigation (reading `fgos-plan-loop`'s own
    hook-table precedent, the fragment's real Step 5/6 requirements, and
    architecture-panel's actual disposition/resume sections) before any
    implementer touched the unit. Phase 5 work items 7/8 fully satisfied.
  design-record: plans/reports/fork-260928-0024-phase5-items-5-6-7-8-decomposition-research-report.md §Items 7, 8; independent decomposition review (`review-decompose-i25-i26`) H1/H2/M4/M5/M6/L1 — H1 resolved by a Lead decision REVERSING item 8's literal wording (below), H2 resolved by a concrete reconciliation pattern (below), M4/M5/M6/L1 folded directly into this revision.
  decision (Lead, locked, do not reopen — item 8's literal "fold into a
    stub" wording is superseded by direct evidence, not silently dropped):
    read in full, `core/skills/fgos-group-thinking/SKILL.md` (225 lines) is
    NOT stale dead weight duplicating `fgos-panel` — it is already exactly
    the "core-facing selection gate" the plan's own prose describes
    elsewhere ("the pack-membership gate stays in code behind the public
    CLI"): `user-invocable: false`, holds the ONLY documented proof of all
    5 group-thinking-pack bypasses (including bypass #4's current, accurate
    status post-I24a/I24b), and is the ONLY place documenting the exact
    request-composition mechanics (`actors[]` shape, `$ref` per-call
    scoping, resume-by-coordinationId) that BOTH `fgos-panel` (step 5) and
    `fgos-architecture-panel` (its own dispatch section) correctly point TO
    rather than duplicate. Item 8's "fold into fgos-panel... deprecated
    stub" wording was written before I23 built the real `pack
    list/show-protocol/run` CLI door and before this file reached its
    current, accurate, single-source-of-truth shape — converting it into a
    stub now would relocate real, correct documentation into `fgos-panel`,
    whose own Boundaries section explicitly forbids holding this level of
    detail ("this is selection and request filling, not... an execution
    engine"; "never invent protocol semantics... in task prose"). This
    unit does NOT stub `fgos-group-thinking`. The two literal sub-claims in
    item 8 that DO need action are already independently confirmed
    complete by two separate reviews: the pack-membership gate already
    lives in code behind the public CLI (I23), and the stale "always
    auto-closes / no close step" claim is already gone (confirmed via grep
    — a side effect of I23's own fix round, re-confirmed again here). Item
    8 requires no further code or doc work; this decision note is the
    record of that closure.
  decision (Lead, locked, do not reopen — H2, the fragment/architecture-
    panel reconciliation): read `core/skills/_shared/coordination-driver.md`
    in full and `fgos-plan-loop/SKILL.md`'s own "Facade Hook Values" table
    (~L45-58) as the working precedent. Confirmed: a hook value is NOT a
    thin pass-through placeholder — `fgos-plan-loop`'s own `disposition
    criteria` hook already carries a full, real, domain-specific policy
    sentence ("Proof-gap findings... cannot be deferred; must be `accepted`
    ... or evidence-backed `rejected`"), not a restatement of the fragment's
    generic 3-state model. This is exactly how `fgos-architecture-panel`
    must consume the fragment too: its existing six-value, driver-authored
    disposition vocabulary and its existing "Fresh-Session Resume" section
    are NOT deleted or reconciled away — they BECOME the fragment's
    `disposition criteria`/`human-escalation triggers`/`continuity
    artifact` hook values verbatim (each of the six values still resolves
    to exactly one of the fragment's generic accepted/rejected/deferred
    states for driver-discipline purposes; the fragment's Step 6 recheck
    rule applies to architecture-panel's own advisory result kind the same
    way it applies to plan-loop's work-product kind — an accepted advisory
    finding still needs an independent recheck operation before being
    discharged, which `architecture-advisory-panel-v1.yaml`'s own
    `phase-dialogue-reopen` node already provides via `revise-synthesis`/
    `revise-explanation`, whether or not the FlowDefinition also declares
    separate `rechecks` metadata). No fragment edit is needed and none is
    authorized by this unit — the "consume unchanged" Exit criterion holds
    exactly as the plan-loop precedent already proves it can.
  scope: add the fragment-load + hook-fill to both `core/skills/fgos-panel/
    SKILL.md` and `core/skills/fgos-architecture-panel/SKILL.md`, following
    the identical pattern `fgos-plan-loop` already uses (link the fragment,
    add a "Facade Hook Values" table with all 9 slots filled from each
    skill's OWN existing content per the reconciliation decision above —
    never restate the fragment's rules inline, per Phase 4's own "facades
    restate no rule owned by the driver-discipline fragment" requirement).
    `fgos-panel`'s own hook table governs ONLY its step-5 generic-preset
    path (the one case where `fgos-panel` itself observes/dispatches/
    dispositions across turns) — NOT the delegated `architecture-panel`
    (step 3) or `code-change-panel` (step 4) routes, which keep their own
    hook tables entirely; state this scope boundary explicitly in
    `fgos-panel/SKILL.md` itself so a future reader does not assume one
    hook table governs all five routes. Per Phase 5's own entry gate
    ("consume the I17 fragment and the I20 `capability match` door instead
    of keyword-matched skill descriptions"), `fgos-panel`'s `open inputs`
    hook must resolve its own "exactly one primary canonical capability"
    via `fgos capability match --demand` (`core/skills/_shared/
    capability-matching.md`) — follow `fgos-plan-loop`'s/Phase 6's own
    cited pattern for invoking this door, not a keyword-matched guess.
    Add the drift check M4 flagged as missing: extend
    `test/skills/coordination-phase4-driver-discipline.test.mjs` (whose
    own L156 comment already anticipates a Phase 5 re-measurement) with
    assertions that `fgos-panel` and `fgos-architecture-panel` both link
    `../_shared/coordination-driver.md`, each has a 9-slot hook table, the
    fragment itself is byte-unchanged (digest-pinned), and its mirrors stay
    byte-identical (alongside the existing L293 check) — do not invent a
    general Phase 7 drift-test suite; this is a narrow, in-unit check
    scoped exactly to this unit's own Exit-criterion claim. Preserve
    `test/setup/skill-wrappers.test.mjs`'s existing constraint that
    `fgos-panel` never path-links `fgos-code-panel` (backtick-mention only)
    — do not violate it while adding the fragment link. Resync
    `.agents/skills`/`.claude/skills`/`plugins/fgOS/skills` mirrors via
    `npm run build:skills` for every touched skill file.
  files: core/skills/fgos-panel/SKILL.md (+ mirrors),
    core/skills/fgos-architecture-panel/SKILL.md (+ mirrors),
    core/skills/_shared/coordination-driver.md (read-only reference, do not
    modify — Phase 4's own fragment, shared with `fgos-plan-loop`),
    core/skills/_shared/capability-matching.md (read-only reference for the
    capability-match wiring pattern),
    test/skills/coordination-phase4-driver-discipline.test.mjs, CHANGELOG.md.
    Do NOT touch `core/skills/fgos-group-thinking/SKILL.md` or its
    mirrors, `docs/how-to/use-fgos-group-thinking.md`, or any of the
    "inbound references still describing group-thinking as the live gate"
    (`docs/architect/agent-coordination/architecture/
    group-thinking-trigger-surface.md`, `docs/specs/runner.md`,
    `core/skills/_shared/capability-catalog.md`, the YAML header comment)
    — under the reversed item-8 decision above, all of these are ACCURATE
    descriptions of the current, correct architecture, not stale claims;
    touching any of them would be executing the superseded plan, not this
    unit's actual scope.
  verification: node --test test/setup/skill-wrappers.test.mjs (mirrors
    byte-identical, `fgos-panel`/`fgos-code-panel` path-link constraint
    still holds); node --test test/skills/
    coordination-phase4-driver-discipline.test.mjs (extended per scope
    above); a live CLI probe that `fgos-panel`'s `open inputs` hook
    genuinely resolves via `fgos capability match --demand`, not a
    hardcoded string (grep the skill file for the literal command, don't
    just trust prose); env -u CLAUDE_CODE_SESSION_ID npm test.
  stop: `fgos-panel` or `fgos-architecture-panel` restate driver-discipline
    rules inline instead of loading the fragment (the two-unlike-consumer
    proof requires the fragment stay unchanged and un-duplicated);
    `fgos-panel`'s hook table is written as if it governs the delegated
    `architecture-panel`/`code-change-panel` routes too; `fgos-group-thinking/
    SKILL.md` or any of the listed "do not touch" doc references are
    modified by this unit (that would silently re-execute the superseded
    item-8 wording); the pack-membership gate's actual refusal behavior is
    touched by anything in this unit (it is settled, I23/I24a/I24b
    territory, not this unit's job).
- unit: I27 — panel-depth experiment: standard protocol variant, evaluation corpus, real comparison (Phase 5 Exit criterion, runs in parallel with Phase 6)
  status: MERGED (2026-09-28). integratedSha 1abad5857511cec1302b092208202ead8a303acb,
    testedSha e5684cba3df9838dfc24856a2e19f9c26521f96f (unit/I27 tip), clean
    --no-ff auto-merge (ort; auto-merged both trigger-surface doc copies, no
    conflicts). Key suites rerun on merged tree: 46/46 pass. Real result:
    genuine, mixed (not smoothed) -- dissent/content retention favors the
    full protocol in every case showing a difference; ground-truth factual
    accuracy split direction across the two core cases. Phase 5's
    panel-depth Exit criterion is now closed. See
    plans/260919-coordination-skill-harness-simplification/reports/unit-I27-panel-depth-experiment-real-comparison-report.md.
  capability: code:implement
  depends-on: none (runs in parallel with Phase 6; user-confirmed 2026-09-28
    this unit's benefit is scoped to the architecture-panel/group-thinking
    domain only and shares no files with Phase 6)
  status: not-started
  design-record: plans/reports/fork-260928-1017-panel-depth-experiment-design-research-report.md;
    independent decomposition review (`review-decompose-i27`) found the
    original methodology would have wasted the real API spend on an
    unattributable result (3 HIGH findings) — all folded into this revision.
    The review's own memory note on real-executor cost discipline is a
    second source an implementer should read before starting.
  decision (Lead, locked, do not reopen — cost, REVISED 2026-09-28 after
    review): the paired design below is CHEAPER than the original unpaired
    plan, not more expensive — per case: 1 full-protocol session (as
    before) + 1 extra cheap explanation-only dispatch (withholding
    red-team) instead of a whole second independent session. Plus ONE real
    standalone standard-protocol session (any one case) to prove the
    variant runs end-to-end and to get a real wall-time/dispatch-count
    reading. For a 4-case corpus: 4 full sessions + 4 extra explanation
    dispatches + 1 standalone standard session = 5 real sessions total,
    not 8-10. Still real LLM-backed executors, still real cost — the user's
    2026-09-28 confirmation to proceed at real cost still holds — but the
    revised design is both cheaper AND the only one that isolates the
    variable (see the paired-design decision below). Do not silently
    shrink further without asking again.
  decision (Lead, locked, do not reopen — reduction candidate, wording
    CORRECTED 2026-09-28 after review): of 3 evidence-based reduction
    candidates investigated (dropping `phase-redteam` entirely; merging
    `critique-proposals`+`assess-constraints`; capping
    `phase-dialogue-reopen` at `maxInvocations: 1`), dropping
    `phase-redteam` is the standard variant's shape — it is the cleanest,
    most structurally separable cut (1 full graph node, 1 actor, the
    `flagship`-tier dispatch, and the `distinctProviderFrom` requirement
    all removed together; confirmed nothing else reads `red-team-packet`
    except `phase-explanation`'s own gate). CORRECTION: the original
    rationale's claim that red-team is "framed as optional" in the doctrine
    is FALSE and is retracted — `docs/architect/agent-coordination/
    playbooks/architecture-advisory-role-doctrine.md` (~L1151-1170) frames
    it as MANDATORY falsification of the packet and the panel, deliberately
    on a distinct provider, with no materiality exemption anywhere in that
    file; prior real evidence (P05.2, both the "clear" and "unclear" case)
    shows red-team dissent materially shaped the final explanation in BOTH
    cases. The honest prior is: a quality regression from dropping
    red-team is PLAUSIBLE, not unlikely. This unit still tests the
    candidate — a documented regression is a valid, complete outcome, not
    a failure of the unit — but must not misstate the doctrine to justify
    the choice. Do NOT silently skip red-team via skill prose or a
    conditional — per Phase 5's own wording, "a standard profile may ship
    only if it remains a separate registered protocol/preset with clear
    selection triggers".
  decision (Lead, locked, do not reopen — paired measurement design, NEW
    2026-09-28 per review HIGH-1): an unpaired design (one independent
    session per profile per case) cannot isolate the variable — 9 of the
    10 upstream dispatches are identical in both profiles, so two
    independent LLM-sampled runs differ mostly in upstream sampling noise,
    swamping the only real signal (whether `explain-recommendation` saw
    `redteam.md`). Fix: for each case, run the FULL protocol once, then
    produce a SECOND explanation from the SAME synthesis/redteam context
    with red-team's finding withheld (one extra `architecture-advisory-panel-v1-explanation`-template
    dispatch, same synthesis input, minus the redteam.md evidence ref).
    Compare the two explanations from the SAME upstream chain. Separately,
    run ONE real standalone standard-protocol session (any single case)
    end-to-end to prove the new FlowDefinition actually dispatches/closes
    correctly and to get one real wall-time/dispatch-count data point for
    the variant as actually deployed (not just the paired-explanation
    proxy).
  decision (Lead, locked, do not reopen — scoring methodology, NEW
    2026-09-28 per review HIGH-2): (a) the scoring rubric must be
    committed to the experiment's own directory BEFORE the first real
    call, with its git SHA cited in the final report — never written or
    adjusted after seeing results. (b) explanations are stripped of any
    profile-identifying text and scored BLIND, by an executor on a
    DIFFERENT provider than the panel's own synthesizer/lead-advisor
    executors, plus a human spot-check of at least one case — the Lead
    (who knows which explanation is which) must never self-score. (c)
    "dissent retention" is mechanical, not impressionistic: enumerate
    every distinct material finding in the full run's own `redteam.md`,
    then mark present/absent BY SUBSTANCE in each of the two explanations;
    also track whether critique/constraint objections (which exist in
    both profiles) survive, as a control. (d) factual error is scored ONLY
    against independently VERIFIED ground truth (see corpus decision
    below) — never scorer opinion where no ground truth exists.
  decision (Lead, locked, do not reopen — corpus, CHANGED 2026-09-28 per
    review MEDIUM-4): use `docs/platform/agent-coordination/verification/architecture-advisory-panel/P05.2.md`'s
    two real herdr-gateway cases (one "clear", one "unclear" — their
    frozen `intake.md`/`synthesis.md`/`redteam.md` are already on disk) as
    the CORE corpus, not invented cases — they are the only cases in this
    repo with INDEPENDENTLY VERIFIED ground truth from real subsequent
    implementation (the 30.8% false-wrap rate reproduced by a real test
    run; the Codex cursor-glyph finding confirmed live — see P05.2.md
    ~L170-200), making them the only cases where factual-error rate can be
    scored objectively rather than by scorer opinion. Add 1-2 more cases
    from this track's own real decisions (e.g. I18's rust-host-regen
    question, I21's executor-pin bypass, I24a's H3 wording, I26's H1/H2
    reconciliation) for extra materiality spread — these lack independent
    ground truth, so score decision-quality/dissent-retention on them but
    do NOT claim a factual-error rate without ground truth to check
    against.
  decision (Lead, locked, do not reopen — real-executor cost/safety
    discipline, NEW 2026-09-28 per review HIGH-3): before any real-cost
    session: (1) a fake-executor smoke run of the standard variant through
    the SAME public door the experiment will use (`fgos coordination pack
    run` or `coordination run`), proving the explanation re-gate and
    quorum/close actually work end-to-end — the structural YAML-diff test
    alone does NOT prove dispatch; (2) ONE real cheap-tier canary
    operation (e.g. `investigate-context` alone) to confirm the real
    executor path itself works before committing to the batch. Only after
    both pass does the real batch run. Driver rules for every real
    session: use a FIXED, deterministic `coordinationId` per (case,
    profile), recorded in a run manifest before dispatch — a retry MUST
    resume the same id (the kernel's idempotent resume,
    `src/runner/coordination/session-engine.mjs` ~L416, reads the linked
    RunResult instead of re-executing; a freshly-minted id on retry
    silently re-spends real cost); run `fgos coordination show` before
    each call to confirm current state; run sessions strictly SERIALLY,
    never concurrently (this track has a confirmed assignment-id allocator
    race across concurrent `coordination run` processes); dispatch from a
    QUIESCENT checkout/worktree that no other session (including Phase 6's
    own parallel work) is editing — a concurrent git-tree change gets
    misattributed to the dispatched executor as a false failure, which
    would re-spend cost on a retry; be aware `aggregateBounds.wallTimeMs`
    (default 3h, `session-engine.mjs` ~L1996) is a PERMANENT refusal once
    elapsed — a session that isn't finished within 3 real hours cannot be
    resumed the next day, so size the corpus/schedule accordingly. Pin
    identical driver policy across both profiles for every shared step
    (same objective/contextRefs text, no human turn, no specialist
    authorization, no reopen, immediate `close-dialogue`) so driver
    variance is never a second confound alongside the profile itself.
  scope: (1) Author a new FlowDefinition YAML,
    `core/coordination-protocols/architecture-advisory-panel-standard-v1.yaml`
    — the full `architecture-advisory-panel-v1.yaml` (556 lines) with
    EXACTLY this allowlisted delta, nothing else (this exact list is the
    stop-condition allowlist below, not a starting suggestion): remove
    `phase-redteam`'s node, `red-team-actor` (decide whether to also drop
    it from `spec.roles` — legal either way, pick one and state it in the
    report), the `red-team-packet` operation, and the `post-redteam-open`
    window definition (it references `red-team-packet` and schema
    validation rejects an orphaned reference); change
    `phase-synthesis.transitions` from `[phase-redteam]` to
    `[phase-explanation]`; re-gate `phase-explanation` on
    `post-synthesis-open` directly; update `metadata.id` to
    `core.coordination-protocol.architecture-advisory-panel-standard-v1`;
    rewrite the header comment to describe the standard variant honestly
    (do not leave stale prose narrating red-team/I21 `distinctProviderFrom`
    for a variant that no longer has it). Every other node/operation/actor
    byte-identical to the full protocol — never invent new judgment
    content. (2) Register it in `core/protocol-packs/group-thinking.json`'s
    `members` array (currently 5 flat `{id, version}` entries — add a
    6th). (3) Add a new row (or extend the existing `architecture-panel`
    row) in `docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md`
    (the CANONICAL copy — NOT `docs/architect/...`, which is a legacy
    source per that file's own header; edit the legacy copy too only if
    needed to avoid divergence) with a concrete, evidence-checkable
    selection trigger. (4) Build an evaluation-corpus driver from scratch
    (no reusable multi-case runner exists in this repo — confirmed via
    the design record) — borrow the PATTERN existing single-mechanism
    proofs use (a driver `.mjs` script + a logged `.md`/`.log` artifact),
    not any code directly. Corpus: the P05.2 clear + unclear cases (frozen
    verbatim) plus 1-2 track-decision cases, per the corpus decision above.
    (5) Follow the pre-flight/safety discipline decision above exactly
    (smoke → canary → batch; fixed coordinationIds; serial; quiescent
    checkout; wall-time awareness) before any real-cost batch session. (6)
    Run the paired design decision above (full session + withheld-redteam
    explanation per case, plus one standalone standard-protocol session)
    — never the original unpaired independent-session design. (7) Score
    per the scoring-methodology decision above (committed rubric, blind
    cross-provider scoring + human spot-check, mechanical dissent-retention
    checklist, factual error only against verified ground truth — prompt
    BYTES and wall time in place of "prompt tokens", which no field in
    this codebase records: grep confirms nothing under `src/` tracks
    input/prompt token counts). (8) Write up the comparison as a report
    under `plans/260919-coordination-skill-harness-simplification/reports/`,
    citing every run's raw evidence (coordination ids, `fgos coordination
    show` output, timing, the rubric's own git SHA) — never only summary
    conclusions. Do NOT ship the standard variant as the DEFAULT preset
    regardless of results — it ships only as a separate, explicitly-
    selected preset (confirmed: no skill currently routes to it, since
    I26's own scope forbids editing `fgos-architecture-panel`/`fgos-panel`
    to add that routing — acceptable for this unit, the driver dispatches
    both profiles directly via the CLI door, not through a skill); if the
    comparison shows a real quality regression (plausible per the
    corrected doctrine reading above), the finding itself, documented, is
    a valid, complete outcome — this unit is not required to make the
    standard variant look good.
  files: core/coordination-protocols/architecture-advisory-panel-standard-v1.yaml
    (new), core/protocol-packs/group-thinking.json,
    docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md
    (canonical; + `docs/architect/...` legacy copy only if needed),
    test/verbs/coordination-group-thinking-pack-registration.test.mjs
    (asserts an exact 5-member set/length today — MUST be updated to 6, it
    will fail otherwise, not just "still pass"),
    test/cli/coordination-pack.test.mjs (its `REAL_PACK_MEMBER_IDS` +
    `deepEqual` assertion needs the same update),
    test/runner/flow-definition-protocol-loader.test.mjs (its exact
    discovered-id list needs the same update), a new corpus/driver script
    under a dedicated
    `plans/260919-coordination-skill-harness-simplification/panel-depth-experiment/`
    subdirectory (keep experiment artifacts out of `core/`/`test/` since
    they are not permanent product code), the comparison report,
    CHANGELOG.md. Do NOT touch `architecture-advisory-panel-v1.yaml`
    itself (the full protocol stays byte-identical), and do NOT touch
    anything in I26's already-closed scope
    (`fgos-panel`/`fgos-architecture-panel`/the driver-discipline
    fragment) or anything in I28/I29's Phase 6 scope.
  verification: `node --test test/verbs/coordination-group-thinking-pack-registration.test.mjs
    test/cli/coordination-pack.test.mjs test/runner/flow-definition-protocol-loader.test.mjs`
    (all 3 updated for the 6th member, then passing); a new structural
    diff-based test confirming the standard variant equals the full
    protocol minus EXACTLY the allowlisted delta above, nothing else
    (parse both YAMLs, diff the parsed structures, assert the delta set);
    the fake-executor smoke run (before any real spend); the one real
    cheap-tier canary call (before the batch); the real paired-design
    experiment runs themselves (not a `npm test` assertion — empirical
    measurement, the report is the deliverable); `env -u
    CLAUDE_CODE_SESSION_ID npm test` for the full suite.
  stop: the standard variant's YAML diverges from the full protocol
    anywhere OTHER than the exact allowlisted delta above (would
    invalidate the whole comparison's validity — this is now a precise
    allowlist, not a vague "just red-team" statement); the standard
    profile becomes reachable as a default or fallback without an
    explicit, clear selection trigger; the comparison is run with
    fake/test executors instead of real LLM-backed ones for the actual
    measurement; an UNPAIRED independent-session design is used instead of
    the paired design (would waste real spend on an unattributable
    result); scoring is done by the Lead itself or without blinding;
    factual-error is claimed for a case with no independently verified
    ground truth; the fake-executor smoke test or the real cheap-tier
    canary fails — stop and fix before spending on the batch, do not
    proceed hoping the batch works anyway; any real session needs a freshly-
    minted `coordinationId` on retry — stop, report the spend already
    incurred, and get explicit confirmation before continuing rather than
    silently re-spending; the report omits raw per-run evidence or the
    rubric's own git SHA in favor of only summary claims.
  decision (Lead, 2026-09-28, real-spend incident during the batch):
    implementer correctly paused per the stop condition above rather than
    silently re-spending, after the first real paired-design dispatch
    (P05.2 clear case, withheld-redteam) surfaced two problems. Lead
    independently confirmed both directly (`git show --stat` on commits
    `cee081d6f`/`2e1251c87`): (1) a likely false "failed" status from the
    implementer's own concurrent file writes into the same worktree cwd
    during an in-flight dispatch (same class as `tsk-3yo`) -- accepted;
    (2) a real, structural contamination pathway: `red-team-packet.md` for
    both P05.2 cases was committed into this worktree's checked-out tree
    in `cee081d6f`, BEFORE the withheld-redteam dispatch ran in
    `2e1251c87` -- bwrap confinement mounts the whole checkout read-only,
    so that file was physically present and readable by the dispatched
    agent regardless of any "don't read X" instruction. An
    instruction-only mitigation is rejected as insufficient: the file
    stays present for every future dispatch on this worktree, and the
    experiment is specifically measuring behavior under withheld
    information, so relying on the dispatched agent's own restraint
    defeats the point. Ruling: (a) the tainted P05.2-clear withheld-explain
    result is INVALIDATED -- do not score it, mark it
    `invalidated-methodology` in the manifest, and redo it cleanly once (b)
    below is in place; (b) structural fix, not instructional: for every
    remaining case, commit only pre-reveal corpus content (framing through
    synthesis) durably up front; commit each case's reveal-only content
    (`red-team-packet.md`, `explain-recommendation.md` -- ground truth
    needed for scoring, never as dispatch input) ONLY AFTER that case's
    full-protocol AND withheld-redteam dispatches have both already run.
    SUPERSEDED same-day: the "separate disposable worktree" idea above is
    WRONG and was never executed for real isolation -- implementer
    independently verified the actual confinement driver
    (`src/runner/dispatch/confinement/drivers/bwrap.mjs:356`, confirmed by
    Lead reading the same line directly) mounts `--ro-bind '/' '/'`: the
    ENTIRE host filesystem root, read-only, for every dispatch, with
    `plan.resources` layering only WRITABLE exceptions on top. This
    confinement model bounds writes, never reads -- any absolute host path
    (including the primary worktree's already-committed corpus) stays
    fully readable by a confined dispatch regardless of which worktree its
    own `--dir`/repoRoot points to. No worktree-boundary trick provides
    real read isolation here; true blinding would require a genuinely
    separate host/filesystem, disproportionate new infrastructure for this
    unit's scope. Revised ruling: (a) for the 2 already-contaminated P05.2
    cases, redo the withheld probe directly in the primary `unit/I27`
    worktree (no disposable worktree) with a maximally self-sufficient
    inline objective (embed everything needed, give no reason to explore
    beyond the prompt) -- score it, but state plainly in the report that
    this is risk-reduced, not hard-isolated, given the real confinement
    read boundary; (b) for the new track-decision case, use the same
    tight-prompt approach AND keep the reveal-content-commit-after-dispatch
    ordering from the original fix (still a real, if partial, mitigation --
    no memorable breadcrumb file exists yet at dispatch time) for the best
    practical blinding available in this environment; (c) report language
    must state the confinement-model finding plainly, never imply a
    stronger isolation guarantee than what's real. Discipline going forward
    (implementer's own fix, confirmed correct): never touch the dispatch
    worktree's files while a real dispatch is in flight. Explicitly
    confirmed: proceed with the remaining real batch under this corrected
    methodology -- previously-granted real-cost authorization stands; this
    is an implementation-level integrity fix within that authorization, not
    a new cost decision requiring a fresh user round-trip.
  decision (Lead, 2026-09-28, rubric-ordering violation, real but disclosed):
    implementer self-reported going straight into the canary/batch
    dispatches without first committing the scoring rubric, violating
    decision (a) of the locked scoring-methodology block above
    ("committed BEFORE the first real call ... never written or adjusted
    after seeing results"). Not silently buried -- flagged proactively
    before any scoring happened. Ruling: irreversible (the real outputs
    are already read), but NOT fatal -- the actual protection that matters
    is that whoever operationalizes the rubric's concrete checklist has
    not been exposed to the real run content, since the implementer
    dispatching/monitoring the real sessions has necessarily already seen
    raw output (needed to catch the real codex-OAuth failure, the earlier
    contamination self-disclosure, etc.). Mitigation, not a paperwork fix:
    a FRESH agent with zero exposure to any of I27's real run output
    writes the operational rubric, using ONLY the scoring-methodology
    decision text above (already locked before any real call existed) as
    source -- never shown any real corpus/run file. That rubric then
    still goes to the separately blinded, different-provider scorer per
    decision (b), unchanged. Re-running the whole real batch to restore a
    clean before/after ordering was considered and rejected as
    disproportionate real spend for a rigor nicety, not a correctness bug
    -- the paired-design/blinding/ground-truth safeguards that actually
    protect the comparison's validity are untouched by this. Report must
    state this violation and mitigation plainly, never omit it.
    Also confirmed correct, no objection: (1) the `req3b` redteam retry
    (`codex` OAuth dead -- genuine infra failure, not a false-fail; retried
    under the SAME coordinationId per the driver-safety decision, switched
    to a distinct-provider fallback executor; kept the resulting real
    INSUFFICIENT-EVIDENCE verdict as honest evidence rather than re-spending
    for a cleaner-looking result); (2) the `coordination show`/close
    snapshot-path cosmetic resolution bug (main-checkout `.fgos/` resolved
    even with `--dir` set) is correctly filed as a known gap, not fixed --
    out of I27's file-ownership scope, and the underlying on-disk session
    state is independently confirmed correct regardless.
  rubric approved (Lead, 2026-09-28): `rubric-writer-i27` committed
    `panel-depth-experiment/scoring-rubric.md` at SHA
    `7421a5e612984082713defd3e3fe43946f42c39e` on `unit/I27`, alone in that
    commit -- confirmed directly (`git show --stat`). Lead read the full
    rubric before approving. It operationalizes spec (a)-(d) mechanically
    (role table with a provider-mismatch check for the blind scorer;
    itemized redaction list plus a zero-hit grep self-check; a frozen,
    quote-cited RT/CX/CY finding-enumeration procedure with no partial
    credit; a GT-1/GT-2-only factual-error procedure explicitly forbidding
    any factual-error claim on the non-core cases; unblinding-key commit
    ordered strictly after every mark) and adds no dimension beyond
    (a)-(d). Its one open question -- narrowing the corpus note's undefined
    "decision-quality" to PRESENT-finding disposition (DISPOSED vs.
    MENTIONED-ONLY) rather than a new impressionistic scale -- is approved
    as the correct, conservative reading: it stays mechanical and ties
    back to the already-frozen finding lists rather than inventing new
    scorer judgment calls. This SHA is what the final report must cite per
    the rubric-ordering-violation decision above.
  process incident (Lead, 2026-09-28, worktree write collision): the
    rubric commit above landed in the shared `unit/I27` worktree while
    implementer's own `op_023` standalone-session `critique` dispatch was
    still in flight there -- same class as this track's own established
    "never git-write in a shared cell worktree while in-flight" lesson,
    this time from the Lead/dispatcher side rather than a peer session.
    Lead did not check implementer's live-dispatch status before
    dispatching the rubric-writer. Consequence: mutation-detection marked
    `op_023` `failed` despite genuinely substantive, valid content
    (`"status": "done"` inside the real result). Disposition: kept as
    documented evidence with the caveat noted, not re-spent -- consistent
    with this unit's own established precedent (the `req3b` retry, the
    earlier false-fail) of preserving honest real evidence over re-spending
    for a cleaner-looking result. Going forward: Lead will check
    implementer's dispatch status before any further write into this
    worktree, and implementer will do the same in reverse.
  open dependency (Lead, 2026-09-28, human spot-check): the rubric's spec
    (b) requires a human spot-check on at least one case, and explicitly
    forbids the Lead from being that human. Implementer correctly flagged
    this as a real dependency it cannot close itself. RESOLVED same day:
    all 3 cases are now real blind-scored (commit `9c411dc16`), packets
    exist -- Lead independently verified the packet structure matches the
    rubric exactly, the redaction self-check genuinely caught and fixed 3
    real leaks before a clean second pass (not a rubber-stamped claim),
    and the provider check correctly reasons `xai` is a legal blind-scorer
    choice (rubric excludes only synthesizer/lead-advisor providers, and
    `xai`'s separate use as case-3's red-team fallback doesn't disqualify
    it). `unblinding-key.md` confirmed still uncommitted on disk, per the
    rubric's own ordering. Lead is now asking the user directly whether
    they can spot-check case-1 (a core case, so it also gets factual-error
    marks) -- USER DECLINED (2026-09-28): "Bỏ qua, ghi nhận là gap" --
    skip the spot-check, record it as a known limitation. Report must
    state this plainly: the rubric's spec (b) human-spot-check requirement
    was not satisfied, by explicit user choice, not silently dropped. This
    does not block closing I27 -- the scorer-mark data and its blinding
    remain valid on their own; only the second-rater cross-check is
    missing.
  decision (Lead, 2026-09-28, standalone standard-protocol session --
    accept partial): implementer hit a real `claude` CLI session-quota
    exhaustion (reset ~3pm local, unknown distance) on the standalone
    session's synthesis dispatch, 7/9-ish real ops already done
    (interpret, investigate, 3 shapers, critique, assess) across multiple
    phases/actors -- confirmed via `evidence.json` (gitBefore==gitAfter,
    changedFiles: []) that this is a clean quota gate, not a content or
    process failure. Ruling: accept as PARTIAL, do not wait for the reset
    or switch provider mid-session. Reasoning: this session's sole purpose
    is proving the new FlowDefinition dispatches end-to-end through the
    real `fgos coordination` door "as actually deployed" -- a structural
    plumbing proof, not part of the actual paired-comparison measurement,
    which is already fully collected and scored across all 3 cases.
    7 real ops spanning 5 distinct phases/actors already discharges that
    proof; waiting an unknown amount of time or switching provider
    mid-run (contaminating the "as actually deployed" reading with a
    mixed-provider session) both cost more than the marginal proof value
    justifies. Report must state this plainly as a documented partial,
    never imply the standalone session completed.

Update (2026-09-28, user-confirmed): the 3 Phase 5 Exit criteria the
decomposition review's L4 finding flagged as unowned are now resolved:
- "architecture-panel skill within budget" — CLOSED. See the "Skill
  quality" section above (~line 245): the original 1,500-word ceiling is
  superseded with a documented reason; 7,969 words is the accepted new
  baseline.
- "≥60% Lead instruction-token reduction without quality regression" —
  DEFERRED, not measured (this specific measurement was never separately
  actioned; it requires a real before/after Lead-prompt-size comparison
  methodology this track hasn't built). Left open, not blocking.
- "panel-depth experiment" (deep vs. standard protocol comparison) —
  CLOSED 2026-09-28. Unit I27 merged (integratedSha `1abad5857511`): the
  standard variant built, registered, and structurally tested; a real,
  blind-scored 3-case comparison run (2 reused P05.2 cases + 1 new I21-H4
  case, 29 real LLM-backed dispatches). Genuine, mixed result reported
  without smoothing — see the unit's own report for the full finding; not
  a clean "drop red-team" mandate either way. Two open items (human
  spot-check, standalone-session completion) resolved as documented,
  non-blocking gaps, not silently dropped.

## Phase 6 units

- unit: I28 — build `fgos-code-change`, the merged coding-domain facade (Phase 6 creation half)
  status: MERGED (2026-09-28). integratedSha 5eea48c3bc83c8a6af46c29bd07b7763a7e74d12,
    testedSha 4006782dd (unit/I28 fix-round-1 tip), treeIdentical: clean
    --no-ff auto-merge (ort), no conflicts. Key suites rerun on merged tree:
    150/150 pass. See
    plans/260919-coordination-skill-harness-simplification/reports/unit-I28-claude-only-execution-report.md.
  capability: code:implement
  depends-on: none (Phase 6 entry gate satisfied: I21/I26 integrated for
    Phase 5 items 2/7/8; I18 `fgos plan-lint` and I20 `fgos capability
    match` already integrated)
  status: not-started
  design-record: plans/reports/fork-260928-1022-phase6-code-change-merge-design-research-report.md;
    independent decomposition review (`review-decompose-i28-i29`) found 3
    HIGH findings (a false premise about an existing fragment's content, a
    locked word-budget test collision, and an unscoped hard test-migration
    dependency) plus 7 MEDIUM/LOW — all folded into this revision. Lead
    independently re-verified H1 and H2 by reading the actual fragment and
    test files directly before accepting the review.
  decision (Lead, locked, do not reopen — unit split): mirrors the
    I24a/I24b and I25/I26 precedent. This unit (I28) only CREATES the new
    facade — it does not touch or delete `fgos-plan-loop`/`fgos-code-panel`.
    `fgos-code-panel` alone is 977 lines of real operational doctrine that
    must be proven to land safely in the new facade BEFORE the old files
    can become stubs. I29 (dependent) only starts after I28 is merged and
    verified — and per the H3 fix below, this is now a HARD technical
    dependency, not just safety ordering: I29's own verification cannot
    pass unless I28 carries forward specific content this unit names
    explicitly.
  decision (Lead, locked, do not reopen — policy-fragment path and content,
    CORRECTED 2026-09-28 after review H1): the original premise was
    factually wrong on two counts, both independently re-verified by Lead:
    (a) the real, existing fragment is at
    `domains/coding/skills/_shared/coding-cell-policy.md` (a domain-owned
    path — NOT `core/skills/_shared/...`, which does not exist); (b) its
    §2 ALREADY has the exact 3-tier proof table (Focused/Affected/
    Full-Suite Gate) — it was never "thinner" or unpromoted, and there is
    nothing to "supersede." What `fgos-code-panel` actually adds beyond
    the existing fragment is a named DELTA, confirmed by direct review:
    the Test-selection/DECISION block + `FULL_TRIGGERS` list; the "full
    never twice per (tree, env)" rule; the proof key with environment
    fingerprint; reviewer inspect-by-default + judge-sufficiency (R3); the
    post-merge-verification commit + HEAD re-assert. EXTEND §2/§5 with
    this delta, written as tersely as the existing fragment's own style —
    do not verbatim-copy code-panel's ~1,892 words of prose. Also
    reconcile a real, pre-existing contradiction while extending: the
    fragment's own §5 says gate proof "must be re-executed against
    integratedSha" while code-panel's own text (its "run AFFECTED_TESTS...
    escalate to FULL_TEST if a FULL_TRIGGERS category fired" rule) is a
    DIFFERENT policy — state explicitly which one is authoritative for
    the merged facade (the escalation-trigger rule is more precise;
    prefer it, and correct §5's wording to match, rather than silently
    keeping both). §1/§3/§4 and every heading `coordination-phase4-driver-discipline.test.mjs`
    pins verbatim (confirmed at test ~L252-276, which also forbids `plan.md`
    and "track status" appearing in the fragment) MUST survive unchanged.
  decision (Lead, locked, do not reopen — word budget, NEW 2026-09-28 per
    review H2): Lead independently confirmed
    `test/skills/coordination-phase4-driver-discipline.test.mjs` (~L171-181)
    hard-asserts `planLoopWords + driverWords + policyWords <= 3300`,
    currently measured at 1,347+1,192+729=3,268 words — only 32 words of
    headroom, nowhere near enough for the delta above even written
    tersely. Do NOT silently blow through 3,300 and let the test fail, and
    do NOT silently edit the assertion's number without a documented
    reason. Sequence: write the delta as tersely as possible first,
    measure the REAL new combined count, THEN decide — if it fits within
    3,300, no further decision needed; if it doesn't, this is a Phase 4
    Exit-criterion-superseding decision (the same class of decision this
    plan already made once for `fgos-architecture-panel`'s own word
    budget) — record the real new number as the accepted ceiling with the
    same evidence-based reasoning (a facade covering two merged lifecycles'
    worth of real safety policy is not the same shape as plan-loop alone
    was when 3,300 was set), update the test's own assertion, and name
    this decision in the unit's own report. Do not guess the number now;
    measure first.
  decision (Lead, locked, do not reopen — placement path, CORRECTED per
    review M1): Phase 6's own Work section says "coding domain"; repo
    precedent (`skill-wrappers.test.mjs` ~L385-397) already asserts
    `fgos-code-panel` lives under `domains/coding/skills/`, not `core/`.
    Place the new skill at
    `domains/coding/skills/fgos-code-change/SKILL.md` — NOT
    `core/skills/...`.
  decision (Lead, locked, do not reopen — 5 concrete design choices, NEW
    2026-09-28 per review M2, replacing the vague "one merged lifecycle"
    instruction): (1) **Doors**: semantic doors throughout
    (`fgos coordination start/operation/authorize-and-dispatch/disposition/close`),
    matching `fgos-plan-loop`'s own pattern — never code-panel's raw
    `open.json`/`fix-N.json`/`close.json` request-file pattern (the Phase
    4 test already bans raw request JSON for the semantic-door facade
    shape). (2) **Cell identity/worktree**: single-change cells use a
    NEW, distinct branch/worktree prefix, `code-change--<slug>` (never
    reuse `code-panel--<slug>` or a bare `<track>--<cell-id>` scheme) —
    `chain.mjs` (~L27,49-51) groups every `<prefix>--<x>` session as cells
    of one track, so a deliberately distinct prefix is required to avoid
    every single-change cell showing up conflated as one fake "track" in
    `chain`/resume. (3) **Fix-round cap**: adopt `fgos-plan-loop`'s own
    3-round cap with proof-gap escalation uniformly for BOTH single-cell
    and plan-mode paths (matches this track's own runbook discipline of a
    3-round cap everywhere else in this session) — never code-panel's
    unbounded "repeat with fix-N.json" pattern. (4) **Post-merge
    verification**: the post-merge-verification-commit + HEAD-re-assert
    step becomes POLICY content (part of the `coding-cell-policy.md` §5
    extension above), not facade-local prose, so both single-cell and
    plan-mode paths get it from the one shared source. (5) **Plan-mode
    reference file**: add `domains/coding/skills/fgos-code-change/references/plan-mode.md`,
    loaded only when the execution target is a plan/phase path or a named
    track, per Phase 6's own Objective wording ("plan mode... is a
    reference file loaded only when...") — do not inline plan-mode's own
    cell-selection/status-table/closeout content directly in SKILL.md.
  decision (Lead, locked, do not reopen — capability-match contract,
    CORRECTED per review M3): Lead independently read
    `src/runner/capability-match.mjs` (~L35,121-126) and live-probed it —
    the design record's own summary was wrong. The real 3-way contract:
    `form: "inline"` (null capability) → no cell opens, work returns to
    the live session; `form: "facade"` (triggers on `hasPlanOrTrack`
    alone) → plan mode; `form: "protocol"` (triggers on
    `needsIndependentReview`) → the single-cell path opens. In
    single-change mode, a `facade` result means the request was actually
    a plan/track request misclassified as single-change — re-route to
    plan mode, do not force-open a single cell. Only `inline` means "no
    cell at all."
  decision (Lead, locked, do not reopen — mode-selection rule survival,
    NEW 2026-09-28 per review M4): Phase 6's own single rule (plan mode
    only when a run/implement/resume verb targets a plan/phase path or a
    uniquely resolvable track; otherwise one cell; ask one question when
    ambiguous) is authoritative and SUBSUMES code-panel's own
    M1/A1/A2/CE1-5 named sub-rules — CE2 (negation)/CE3 (phase-path vs.
    chain mismatch)/CE5 (plans outside `plans/`) are not kept as
    separately-named rules; their real effect folds into "ask one question
    when ambiguous" under the single rule. The R2 recursive-dispatch guard
    DOES survive, explicitly: an in-cell worker that is already executing
    inside an active cell dispatch and encounters what looks like a
    plan/phase path must still refuse/ask rather than recursively opening
    a nested track — Phase 6's own single rule does not waive this, and
    dropping it would be a real regression. The ~78 fixtures in
    `test/setup/skill-wrappers.test.mjs`'s `classifyCodePanelRequest`
    (~L1512, R2 at ~L1515-1530) must be retargeted at the new facade's own
    mode-detection function, not left as phantom tests of a stub skill
    nobody calls anymore.
  scope: create `domains/coding/skills/fgos-code-change/SKILL.md` (see
    placement decision above) from `fgos-plan-loop`'s own cell-operation
    structure (~L61-181) plus `fgos-code-panel`'s single-change path — ONE
    merged open/fix/close/worktree lifecycle per the 5 concrete design
    choices above, covering both single-cell and plan-mode execution, not
    two independent copies. Link the Phase 4/I15 driver-discipline
    fragment (`../_shared/coordination-driver.md`) + a 9-slot Facade Hook
    Values table, following the exact `fgos-plan-loop`/`fgos-panel`/
    `fgos-architecture-panel` precedent pattern (link, never restate
    inline). Fill the `open inputs` hook from real doors, not prose: in
    plan mode, run `fgos plan-lint <phase file> --cell <id>` and refuse to
    open on `ok: false`; in single-change mode, declare `DemandFacts` and
    run `fgos capability match --demand` per the corrected 3-way contract
    above. No default roster: per-node binding comes from I21; a hand
    roster is an explicit override with provenance. Keep the existing
    `coding-design-panel` advisory route (inside `fgos-panel/SKILL.md`
    Route step 3 / Surface Taxonomy row 74 — NOT a separate file) fully
    untouched and structurally distinct from this facade's own Route step
    4 / row 75 (which DOES need retargeting — see I29's files list below;
    I28 itself does not edit `fgos-panel`, only avoids swallowing its
    step-3 route). For the H3 test-migration dependency: this unit's own
    new facade must carry forward, with equivalent real content (not just
    "we thought about it" prose) — the "caveat blocks close" invariant
    (Architecture Invariant 7 in code-panel, ~L754,812: a shared-cwd
    caveat must block a close disposition), the resume-state
    classification with its refused-vs-pending safety rule (code-panel
    ~L191-214), the projection-gaps note, and the two-request DAG pattern
    (code-panel ~L700-746) — OR explicitly document, as a named Lead
    decision in this unit's own report, that one of these is deliberately
    dropped and why. Do not silently omit any of them.
  files: domains/coding/skills/fgos-code-change/SKILL.md (new, + `.agents`/
    `.claude`/`plugins/fgOS` mirrors via `npm run build:skills`),
    domains/coding/skills/fgos-code-change/references/plan-mode.md (new),
    domains/coding/skills/_shared/coding-cell-policy.md (extend §2/§5 per
    the decision above — this is an EXTENSION, not a replacement),
    test/setup/skill-wrappers.test.mjs (retarget the ~78
    `classifyCodePanelRequest` fixtures at the new facade's own
    mode-detection function; confirm new-skill placement/mirror-identity
    assertions), test/skills/coordination-phase4-driver-discipline.test.mjs
    (update the 3,300-word assertion per the word-budget decision above —
    measure first, then decide whether the number itself needs to change;
    add assertions for the fragment link + 9-slot hook table, mirroring
    I26's own pattern in this same file), a new or retargeted test proving
    the caveat-blocks-close/resume-state/two-request-DAG content survives
    with equivalent assertions (test/verbs/coordination-dag-driver-skill-contract.test.mjs
    is the existing home for these assertions against `fgos-code-panel` —
    coordinate directly with I29, which retargets this same file, so the
    two units don't clobber each other's edits; land this piece in
    whichever unit executes first and have the other build on it),
    CHANGELOG.md. Do NOT touch `fgos-plan-loop/SKILL.md` or
    `fgos-code-panel/SKILL.md` themselves (I29's job) — read them for
    reference only. Do NOT touch `fgos-panel/SKILL.md` (I29's job, since
    its Route-step-4/row-75 retarget only makes sense once code-panel is
    actually stubbed).
  verification: node --test test/setup/skill-wrappers.test.mjs
    test/skills/coordination-phase4-driver-discipline.test.mjs
    test/verbs/coordination-dag-driver-skill-contract.test.mjs; real CLI
    probes (not just grepping the skill file) for all 3 `fgos capability
    match` forms (`inline`/`facade`/`protocol`) proving each routes
    correctly; a real `fgos plan-lint` run against a fixture with a hard
    finding, proving the facade actually refuses to open on `ok: false`;
    at least one negative fixture proving an advisory-only coding request
    is never captured into a cell (Phase 6's own Exit criterion); env -u
    CLAUDE_CODE_SESSION_ID npm test.
  stop: the new facade restates driver-discipline-fragment or
    coding-cell-policy-fragment rules inline instead of loading them; the
    merged lifecycle is two parallel copies instead of one shared
    implementation; raw request-file JSON is used instead of semantic
    doors; the `coding-design-panel` route (step 3 / row 74) is touched or
    swallowed; the R2 recursive-dispatch guard is silently dropped; the
    combined word-budget test is left failing OR its number is changed
    without a documented reason; any of the caveat-blocks-close/
    resume-state/two-request-DAG content has no equivalent landing spot
    and isn't explicitly documented as a deliberate drop.
  fix-round-1 (2026-09-28, independent test + review, both confirmed by
    Lead reading the real code directly, not taken on report alone):
    MUST FIX -- 1. Step 0's single-cell gate branches on `form` alone and
    never checks the resolved `capability`; a live probe confirmed an
    advisory demand (`outputKind: decision, mutates: false`) returns
    `capability: "advise"`, `form: "protocol"` -- the same form value the
    gate treats as "proceed to Step 1", so an advisory-only request can
    open a mutating cell, contradicting Non-Goal 3 and swallowing
    `coding-design-panel` via the back door. Add a capability allowlist
    (`code:implement`/`code:refactor` only; anything else refuses and
    returns to the live session) plus the missing negative fixture this
    unit's own verification list already required. 2. The plan-mode
    plan-lint gate is vacuous as documented: `fgos plan-lint <phase file>
    --cell <id>` on a phase file with no matching unit block returns only
    a `severity: warn` `capability.undeclared` finding, so `ok: true`
    always -- confirmed live and via `src/report/capability-plan-lint.mjs`
    (`ok = !findings.some(hard)`). Lint `plan.md` (not the phase file) with
    `--cell <id>`, and in plan mode treat `capability.undeclared` as
    blocking. 3. `coding-cell-policy.md` L104 ("The gate proof must be
    re-executed against `integratedSha`", unconditional) still contradicts
    L105's conditional AFFECTED_TESTS/FULL_TEST escalation rule -- the
    CHANGELOG's claim that this was resolved is inaccurate; delete/rewrite
    L104. 4. Step 4's snippet jumps from `git merge --no-ff` straight to
    `git worktree remove`, omitting the mandatory post-merge record commit
    and pre-cleanup `HEAD` re-assert coding-cell-policy §5 requires --
    show them inline or drop the truncated snippet in favor of the prose
    pointer alone. 5. The R2 recursive-dispatch guard has no precedence
    over the `form: "facade"` re-route: an active R2 context told to
    "re-route to plan mode" would open exactly the nested track R2 exists
    to forbid -- add one line: under R2, `facade` means refuse, never
    re-route. 6. SKILL.md's Mode Selection prose disagrees with the actual
    tested classifier (verb set omits "implement"; a bare plan/phase path
    with no verb resolves plan mode though prose requires a verb; a
    partial negation resolves plan mode though prose says ask) -- reconcile
    prose and code to one behavior, and read the SKILL.md's own Mode
    Selection text into at least one test so a future prose change can
    fail it (today's classifier tests are self-contained JS and read no
    skill text). 7. The two-request DAG's auxiliary session ID
    (`<coordinationId>-inspections`) still starts with the literal
    `<track>--` prefix `chain.mjs`'s track-membership match uses
    (confirmed: any entry starting with `<track>--` is grouped) -- in plan
    mode this risks the read-only auxiliary session being miscounted as an
    extra cell of the real track during cold-resume cell selection. Rename
    the pattern so it does not start with `<track>--`, and add a
    regression test. Also fix the broken `.agents/skills/fgos-code-change/
    SKILL.md` relative link (4 levels up from `.agents/skills/x` exits the
    repo; canonical and plugins copies resolve correctly).
    ACCEPTED AS-IS, NOT FIX-ROUND SCOPE: the 13-fixture parity subset
    (vs. retargeting all ~78 `classifyCodePanelRequest` fixtures) is kept
    -- two independent agents confirmed live that both wrappers now call
    one shared classifier, so coverage is equivalent and duplicating all
    78 would test the identical branch twice; full retarget stays I29's
    job. The word-budget ceiling (`COMBINED_LEAD_LOAD_CEILING = 3597`)
    keeps measuring `fgos-plan-loop` for now -- correct today, since
    plan-loop is still real, live Lead load until I29 stubs it; I29 must
    update this same test to measure `fgos-code-change`'s own real word
    count once plan-loop is stubbed (added to I29's scope below). Cosmetic
    LOW items (worktree-dir single-dash vs. branch double-dash, R2 guard's
    slug-charset looseness, trailing-punctuation/imperative-phrase
    classifier edge cases, premature "deprecated stubs" frontmatter wording
    pending I29) are named here as known, non-blocking, and left for I29 or
    a later pass -- not re-litigated every round.
- unit: I29 — convert `fgos-plan-loop`/`fgos-code-panel` into deprecated stubs (Phase 6 stub half)
  status: MERGED (2026-09-28). integratedSha 4fc1756e88d56c8a6b87d41b6c96d273d69306c0,
    testedSha 8eff54d0f (unit/I29 tip), clean --no-ff auto-merge (ort), no
    conflicts. Key suites rerun on merged tree: 156/156 pass. Phase 6 is now
    fully closed (I28 + I29 both merged). See
    plans/260919-coordination-skill-harness-simplification/reports/unit-I29-claude-only-execution-report.md.
  capability: code:implement
  depends-on: I28 (HARD technical dependency, not just safety ordering —
    see the H3 fix below: I29's own tests cannot pass unless I28 carried
    forward specific pinned content first)
  status: not-started
  design-record: plans/reports/fork-260928-1022-phase6-code-change-merge-design-research-report.md;
    independent decomposition review (`review-decompose-i28-i29`) found
    I29 as originally scoped could not pass its own verification — folded
    into this revision.
  decision (Lead, locked, do not reopen — no repo precedent exists): I26's
    own investigation and this unit's own design-record both independently
    confirmed NO existing "deprecated stub" skill file exists anywhere in
    this repo today — this unit is the FIRST to establish the pattern, not
    copy one. Minimum shape for a stub: retain the skill's frontmatter
    (name/description, REWRITTEN to say "Deprecated: use fgos-code-change"
    and to DROP any `DemandFacts`/trigger-matching phrasing the old
    description used — per review LOW-2, a host's own routing must stop
    auto-selecting the stub once it's just a redirect, not treat its old
    trigger text as still live), a short redirect paragraph naming the
    replacement skill and the exact door(s) a caller should use instead,
    and nothing else — no operational content, no duplicated lifecycle
    prose. Kept loadable (not deleted) only for the Phase 7 compatibility
    window; Phase 7 owns actually removing the stubs when that window
    closes.
  decision (Lead, locked, do not reopen — 3-bucket content disposition,
    REPLACES the original blanket stop condition, NEW 2026-09-28 per
    review H3/M7): the original "ANY orphaned content stops the unit"
    instruction was miscalibrated in both directions — it would fire on
    content Phase 6's own Work section explicitly says to DELETE (the
    duplicated roster/recovery prose, the raw JSON templates, the herdr
    variant — none of these need a landing spot, they're intentionally
    retired), while giving no explicit list for content that genuinely
    needs one. Classify every real section of both old files into exactly
    one bucket before converting either to a stub: (a) **Carried forward**
    — must already exist with equivalent content in I28's new facade
    (caveat-blocks-close, resume-state classification + refused-vs-pending
    rule, projection gaps, two-request DAG pattern, the 3-tier proof
    policy content now in `coding-cell-policy.md`, the semantic-door
    lifecycle itself) — verify each is actually present, don't assume;
    (b) **Deliberately deleted per Phase 6's own Work section** — the
    duplicated open/fix/close JSON templates, the private-worktree recipe
    prose (now superseded by the shared policy fragment's own §1), the
    actor/model-tier roster (I21's own per-node binding replaces a
    hand-written default roster), historical incident/recovery narration
    — delete these with a one-line note in the unit's own report, no
    escalation needed. (c) **Unclassified/genuinely orphaned** — only
    THIS bucket triggers the stop condition below.
  scope: classify every section of `core/skills/fgos-plan-loop/SKILL.md`
    and `domains/coding/skills/fgos-code-panel/SKILL.md` per the 3-bucket
    decision above, then convert both into thin deprecated stubs. Update
    every real inbound reference: `fgos-panel/SKILL.md`'s own description
    line, its "known Phase 5 gap" paragraph, and Route step 4 (all three
    currently name `fgos-code-panel` — retarget to `fgos-code-change`;
    leave Route step 3 / the `coding-design-panel` route and Surface
    Taxonomy row 74 UNTOUCHED, since that's a different, still-live
    route — this distinction is itself a stop condition below); both
    copies of `group-thinking-trigger-surface.md`
    (`docs/platform/agent-coordination/architecture/...` canonical, and
    `docs/architect/agent-coordination/architecture/...` legacy) rows
    75/78. For the wider repo sweep: grep the WHOLE repo for both skill
    names, but EXEMPT `**/verification/**` paths and any `.log` file —
    these are historical proof/evidence records, not live references, and
    rewriting them would falsify the historical record (confirmed via a
    sample grep: ~69 of ~123 total hits are exactly this class of file).
    Of the remainder (~29 live references per the design record's own
    sweep): update `docs/specs/reading-map.md`, `docs/specs/runner.md`,
    relevant how-to docs, both trigger-surface copies, both
    master-coordinator/runtime-recovery-design docs, proposal docs, the
    intent-preservation ledger, the packaging-distribution rollout plan,
    and `scripts/measure-coordination-baseline.mjs` (note explicitly in
    the report that this script will measure the STUBS after conversion,
    not the real skill — either retarget it to `fgos-code-change` in this
    same unit if cheap, or file it as a named, accepted follow-up gap;
    don't leave it silently measuring the wrong thing without comment).
  files: core/skills/fgos-plan-loop/SKILL.md (+ mirrors),
    domains/coding/skills/fgos-code-panel/SKILL.md (+ mirrors),
    core/skills/fgos-panel/SKILL.md (description line, "known Phase 5 gap"
    paragraph, Route step 4 ONLY — step 3 untouched, + mirrors),
    docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md
    (canonical, row 75/78), docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md
    (legacy copy, same rows, only if needed to avoid divergence),
    test/verbs/coordination-dag-driver-skill-contract.test.mjs (retarget
    the pinned caveat-blocks-close/resume-contract/two-request-DAG
    assertions at `fgos-code-change` — coordinate with I28 per its own
    files-list note on this same file, so whichever unit lands second
    builds on the first's edit rather than reverting it),
    test/setup/skill-wrappers.test.mjs (the 6 pinned repo-root paths
    ~L399-428 that must appear inside code-panel's body — retarget or
    remove per what the stub actually keeps), the other live docs named in
    scope above, CHANGELOG.md. Do NOT touch anything under
    `**/verification/**` or any `.log` file (historical record, exempted
    per the decision above).
  verification: node --test test/setup/skill-wrappers.test.mjs
    test/skills/coordination-phase4-driver-discipline.test.mjs
    test/verbs/coordination-dag-driver-skill-contract.test.mjs (all
    retargeted at `fgos-code-change` where the content moved, and
    confirmed passing — not just "mirrors byte-identical for both stubs",
    the ORIGINAL verification claim, which was insufficient); a new test
    confirming both stubs are genuinely thin (a word-count ceiling well
    under their pre-stub size) and that both explicitly name
    `fgos-code-change` as the replacement, with no leftover
    `DemandFacts`/trigger phrasing; env -u CLAUDE_CODE_SESSION_ID npm test.
    Also retarget `coordination-phase4-driver-discipline.test.mjs`'s
    `COMBINED_LEAD_LOAD_CEILING` word-budget assertion itself (I28 fix
    round 1 decision, 2026-09-28): it still measures `fgos-plan-loop`'s
    word count, which is correct only until this unit stubs plan-loop —
    once stubbed, measure `fgos-code-change`'s own SKILL.md +
    `references/plan-mode.md` (plus the same driver/policy fragments) and
    set the ceiling to that real measured sum, with the same
    measure-first-then-decide rationale already used for I28's own number.
  stop: any bucket-(c) unclassified content has no landing spot in
    `fgos-code-change` (escalate, don't silently drop — but bucket (b)
    content is NOT a stop condition, it's an expected, reported deletion);
    either stub is deleted outright instead of kept loadable; a real
    inbound reference (outside the exempted `**/verification/**`/`.log`
    class) is left stale; the `coding-design-panel` route (step 3 / row
    74) is touched by this unit — that boundary is I28's job to preserve
    and this unit's job to leave alone; any test this unit retargets is
    weakened (a passing assertion made to pass by asserting less) rather
    than genuinely pointed at equivalent new-facade content.
  bucket-c resolution (Lead, 2026-09-28): implementer correctly escalated
    one genuine bucket-(c) orphan instead of silently dropping it --
    `fgos-code-panel/SKILL.md`'s "Known limits (not enforced by the
    engine)" section, first bullet (the coordination schema has no field
    for proof tier/`FULL_TRIGGERS`/environment fingerprint, and
    `disposition`/`rationale` accepts any non-empty string). Lead confirmed
    directly this has no landing spot anywhere in I28's carried-forward
    content (grepped `coding-cell-policy.md` and `fgos-code-change/
    SKILL.md`, both come back empty). Approved: add a short paragraph
    stating this specific engine gap to `coding-cell-policy.md` §2 (Proof
    Tiers), mirrored the normal way -- narrow, non-invasive, and the
    correct shared landing spot since both the old (stubbed) and new
    facade already point there for proof-tier doctrine. The second item
    the implementer flagged (`fgos-plan-loop`'s "Session IDs use safe
    characters" note) is correctly treated as safe-to-drop, not orphaned
    -- confirmed redundant with `assertSafeId`'s real engine enforcement,
    doc or no doc.

Parallelism is limited deliberately:

```text
I00 -> I01 -> I02 -> I03 -------------------------------+
          +-> I04 -> I05 -------------------------------+--> I11 -> I12 -> I13 -> I14 -> I15 -> I16 -> I17 -> I19 -> I21 (Phase 5 item 2) ; I19 -> I20 -> I26 (Phase 5 items 7/8)
                                                             I16 -> I18 (parallel with I17)
          +-> I06 -----+                                |
          +-> I07 -----+-> I08 -------------------------+
                       I02 + I04 + I06 -> I09 -> I10 ----+

I16 -> I22 (Phase 5 item 1) ‖ I23 (Phase 5 item 3, files disjoint from I22)
I22, I23 -> I24a (Phase 5 item 4 pt.1) -> I24b (Phase 5 items 4 pt.2/5/6)
I24b -> I25 (Phase 5 items 5/6 narrow remainder) ‖ I26 (Phase 5 items 7/8, files disjoint from I25)
I26 -> I28 (Phase 6 creation half) -> I29 (Phase 6 stub half, depends on I28)
I26 -> I27 (panel-depth experiment) ‖ I28/I29 (Phase 6, files disjoint from I27)
```

I25 and I26 are independent of each other (disjoint files: I25 touches
`actions-projector.mjs`/test files only, I26 touches `fgos-panel`/
`fgos-architecture-panel`/`fgos-group-thinking` skill files only) and may
run in parallel. Phase 6's own entry gate requires I26 (Phase 5 work items
7/8) integrated before it opens.

I27 (panel-depth experiment) and I28/I29 (Phase 6) are independent and may
run in parallel: I27 touches only `architecture-advisory-panel-standard-v1.yaml`
(new file), `group-thinking.json`, the trigger-surface doc, and its own
experiment/report artifacts; I28/I29 touch only `fgos-code-change`,
`fgos-plan-loop`, `fgos-code-panel`, and `coding-cell-policy.md` — fully
disjoint from I27's files. I29 is sequential after I28 (not parallel):
I29 deletes content I28 must first prove has a safe landing spot in the
new facade.

I22/I23 run in parallel (Files disjoint). I24a runs after I22/I23 close out —
sequential, not parallel, despite low measured textual-overlap risk on
`fgos-architecture-panel/SKILL.md` with I22, because this track's own history
(I18, I21) shows overlapping-worktree/overlapping-file races cost more than
the serialization they'd save. I24b depends on I24a's request-step door and
also touches `bin/fgos.mjs`/`command-registry.mjs`, the same files I23
touches — never run I24b concurrently with I23 either.

I04, I06, and I07 may proceed in parallel only from the identical I01
baseline. I09 waits for result truth, template resolution, and dispatch policy
because it consumes all three. Documentation-only preparation may proceed
earlier, but no unit may claim implementation completion before its dependency
gate.

I30 ‖ I31 (files disjoint: I30 touches the CLI status envelope and the
canonical `flow-definition.md`; I31 touches `capability-plan-lint.mjs` and
the how-to doc). I32 runs after both close (investigation-only, low risk,
but its conclusion — real migration vs. "no action, document why" — should
land before I33's rename touches adjacent config surface). I33 (protocol
rename) is highest blast radius in this phase and gets its own dedicated
decomposition review before any implementer touches it, same discipline as
I27 and I28/I29. I34 (drift-test completion) runs only after I30-I33 close,
since it audits the phase's own finished state. I35 (doc sweep + before/after
report) is last, depends on all of I30-I34.

## Phase 7 units

Design record for all 6 units below:
`plans/reports/fork-260928-1540-phase7-decomposition-research-report.md`
(read-only research fork) AND an independent decomposition review
(`review-decompose-i30-i35`, delivered via message 2026-09-28, not a
separate file — its 5 HIGH findings are folded into the decisions below).
ALL 5 HIGH findings were independently re-confirmed by Lead reading the
real source directly before this revision: a real Phase-0 baseline
artifact the research fork missed; the CLI envelope already partially
versioned; the wrong plan-lint line/path; no alias mechanism in
`protocol-loader.mjs`; a merged, tested raw-JSON carve-out in
`fgos-code-change`. This revision corrects all 5 plus the MEDIUM/LOW
findings worth fixing before dispatch — the exact "research fork alone is
not enough, an independent review still
finds real flaws" pattern this track has now hit on every multi-unit
decomposition (I22-I26, I27, I28-I29, and now I30-I35).

- unit: I30 — data-level contract version on `show`/`chain`; port BOTH missing PolicyPatch fields into the canonical FlowDefinition contract doc (Phase 7 items 1, 4b)
  status: MERGED (2026-09-28). integratedSha 638cf13320d26883ea053b4cbdb0e19d1b06ecf3,
    testedSha 51ce544f2 (unit/I30 tip, amended once to add I32's ported
    clarification sentence), clean --no-ff auto-merge (ort), no conflicts.
    Key suites rerun on merged tree: 68/68 pass. Minted new sibling contract
    versions (`coordination-show.v1`, `coordination-chain.v1`) rather than
    reusing `coordination-actions.v1` -- `status`'s own field untouched.
    Incidental finding, deliberately out of scope, not silently dropped:
    `preferInvocation`/`repeatMode` PolicyPatch fields are undocumented in
    BOTH the canonical and legacy contract docs -- flagged as a follow-up
    candidate. See
    plans/260919-coordination-skill-harness-simplification/reports/unit-I30-claude-only-execution-report.md.
  capability: code:implement
  depends-on: none (Phase 7 entry: Phase 5/6 both merged, I27 merged)
  decision (Lead, 2026-09-28, corrects review H2/M1): item 1 is ALREADY
    mostly done, confirmed live: every CLI `--json` output is wrapped in
    `{"contract":"fgos.v1",...}` (`src/state/envelope.mjs:6`), and `fgos
    coordination status <id> --json` already returns a data-level
    `contractVersion: "coordination-actions.v1"` (`src/verbs/coordination/
    status.mjs:28`, sourced from `actions-projector.mjs:521`). Only `show`
    and `chain`'s OWN data lack a data-level version marker — that is the
    ENTIRE remaining scope of item 1, not a full envelope-versioning
    project. Item 4b's original scope also undercounted the gap: the
    canonical `docs/platform/agent-coordination/contracts/flow-definition.md`
    is missing BOTH `policy.capability` AND `distinctProviderFrom` (0 hits
    for either, confirmed live) — the legacy copy documents both
    (`docs/architect/.../flow-definition.md` ~L579-580, 598, 607). Port
    both, not just one.
  scope: add a `contractVersion` field (reuse `"coordination-actions.v1"`
    if `show`/`chain`'s data shape is compatible with the actions
    projection's versioning intent, or mint a new sibling version string
    following the same naming convention if the data shapes genuinely
    differ — implementer's own judgment call, evidenced in the unit's
    report) to `show` and `chain`'s own top-level data envelope. Port both
    missing PolicyPatch fields into the canonical `flow-definition.md`, but
    verify the ported content against `src/runner/definitions/schema.mjs`'s
    real exported field definitions as the SOURCE OF TRUTH — not copied
    verbatim from the legacy doc's prose, which may itself have drifted
    from current code.
  files: `src/verbs/coordination/show.mjs`, `src/verbs/coordination/
    chain.mjs` (or wherever their data envelopes are assembled — confirm
    exact location before editing), `docs/platform/agent-coordination/
    contracts/flow-definition.md`, CHANGELOG.md (coordinate with I31's own
    CHANGELOG entry — trivial merge conflict expected if both land close
    together, resolve by keeping both entries).
  verification: a real CLI probe (`fgos coordination show`/`chain --json`)
    confirming the new version field is present; a drift test asserting
    the canonical `flow-definition.md`'s PolicyPatch section content
    matches `schema.mjs`'s real exported field list (not the legacy doc —
    that's an oracle-of-convenience, not the source of truth); env -u
    CLAUDE_CODE_SESSION_ID npm test.
  stop: the new version field is added somewhere that ALREADY has one
    (verify `status`'s own `contractVersion` isn't touched or duplicated —
    it's correct as-is); the ported doc content is copied from the legacy
    doc without checking it against current `schema.mjs` first.

- unit: I32 — read-only binding source: investigate before deciding (Phase 7 item 4c)
  status: CLOSED (2026-09-28), outcome (a) — genuinely orthogonal, NO config
    migration. Real evidence chain (Lead independently re-verified the two
    most load-bearing citations directly against source before accepting):
    `capability.prefer` resolves at bind time in `binding.mjs:bindOperations`
    and only counts through the `bindingSource === 'capability.prefer'`
    branch (H1 red-team fix, `binding.mjs:240-263`, confirmed direct read);
    `readOnlyRedirects` fires at real dispatch time in
    `assignment-runner.mjs:1388`'s `redirectAttempted` guard, which only
    engages when the resolved executor is STILL the literal default
    `'claude'` (confirmed direct read, exact line match) — the two are
    structurally mutually exclusive per dispatch, layered primary +
    dispatch-time safety net, not competing. Live config's identical target
    for both is intentional defense-in-depth, not a race. Zero commits on
    `unit/I32` (pure investigation, no code changed). Report:
    plans/reports/impl-i32-260928-1556-readonly-redirect-vs-capability-prefer-orthogonality.md.
    Deliverable applied by Lead: the proposed one-sentence clarification
    added to the LEGACY `flow-definition.md`'s `capability` bullet
    (~L598-606) directly on main. I30 must port this SAME sentence into the
    canonical copy alongside its own PolicyPatch port, to avoid introducing
    fresh canonical/legacy drift on day one of fixing the existing drift.
  capability: code:review
  depends-on: none (file-disjoint from I30 — may run in parallel; read-only,
    no conflict risk)
  status: not-started
  decision (Lead, 2026-09-28, corrects review M2/M3): the original draft's
    framing pre-biased toward "these two mechanisms are probably
    orthogonal" — struck. Investigate neutrally. Real, confirmed evidence
    both ways: `placementPolicy.readOnlyRedirects` is keyed by SOURCE
    EXECUTOR with operation-id sub-keys (live shape:
    `placementPolicy.readOnlyRedirects.claude.{default,
    operations.{review-candidate, red-team-candidate}}`), applied at
    dispatch time (`placement-policy.mjs:351,370`,
    `assignment-runner.mjs:263`) — NOT merely an "unbound actor safety
    net" as the first draft claimed. `capabilities.code:review.prefer` is
    a capability-keyed prefer binding. Both mechanisms currently map
    `review-candidate`/`red-team-candidate` to the SAME openai/codex
    target — real, observable overlap, not obviously orthogonal. Decide
    from the actual call sites, not from either draft's framing.
  scope: re-read both mechanisms' real call sites directly. Produce one of
    two outcomes: (a) genuinely orthogonal once fully understood — document
    why plainly (in `flow-definition.md` or wherever ambiguous), close with
    NO config migration; (b) real overlap/competition confirmed — do NOT
    execute the migration in this unit (see capability note below); instead
    produce a concrete migration DECISION (which mechanism wins, why, exact
    config diff) as this unit's own deliverable, and open it as a
    dependency for a follow-up `code:implement` unit.
  capability note (corrects review M3): this unit's own capability is
    `code:review` (investigation/decision only) because the live capability
    catalog confines `code:review` to `host-write-denied`/`mutates:false`.
    If outcome (b) is reached, the actual config migration is OUT OF SCOPE
    for this unit — it requires a separate `code:implement` unit consuming
    this one's decision, never a mid-unit capability escalation.
  files: read-only; writes only a decision record (this unit's own report,
    plus a `flow-definition.md` note if outcome (a)). No other file touched
    regardless of outcome.
  verification: a written decision record citing the real call sites read
    directly (file:line), not summarized from either research report.
  stop: uncertain which mechanism actually governs a real production
    binding path — escalate, don't guess; outcome (b) is declared without
    first ruling out outcome (a).

- unit: I31 — promote `capability.undeclared` to a hard `plan-lint` refusal, scoped to the `--cell` branch (Phase 7 item 4d)
  status: MERGED (2026-09-28). integratedSha 2dbc7c8de6b8b87ccb4011f8f1d44e123515f10b,
    testedSha 378d1df (unit/I31 tip, includes Lead's own trivial fix for a
    stale command-registry.mjs doc-string), clean --no-ff auto-merge (ort),
    no conflicts. Key suites rerun on merged tree: 41/41 pass. `--cell` miss
    now exit 1/ok:false (live-probed by Lead independently); `capability.
    unresolved` and the no-`--cell` path both confirmed untouched.
    fgos-code-change's Step 0 workaround correctly simplified (not just
    left redundant -- the old carve-out sentence became factually wrong
    once the engine itself enforces this). See
    plans/260919-coordination-skill-harness-simplification/reports/unit-I31-claude-only-execution-report.md.
  capability: code:implement
  depends-on: none (file-disjoint from I30/I32; may run after either closes
    to avoid a CHANGELOG merge conflict, not a hard technical dependency)
  status: not-started
  decision (Lead, 2026-09-28, corrects review H3 — a real wrong-line, wrong-path error in the first draft): `capability-plan-lint.mjs:~136` is
    `capability.unresolved` (an explicitly-marked `(unresolved)` capability
    — per `core/skills/_shared/planning-capability-awareness.md` ~L109,
    this is meant to stay `warn`/resolve-before-merge, NOT be hardened).
    `capability.undeclared` is emitted at exactly ONE site (~L324, the
    `--cell` no-match branch) — that is the ONLY code this unit touches.
    Also confirmed live: without `--cell`, a plan with zero declarations
    returns `ok: true` with an EMPTY findings list — there is no warn to
    promote on that path, so this unit's scope is inherently `--cell`-only,
    matching item 4d's own "at cell open" wording (cell open always passes
    `--cell`). The original stop condition ("any currently-passing plan
    fails") was miscalibrated: 20 of 33 `plans/*/plan.md` have no `- unit:`
    blocks or Product Gates and would trigger this immediately on a
    whole-file interpretation — that's expected/correct once scoped to
    `--cell`, not a bug.
  scope: change `capability.undeclared`'s severity from `warn` to `hard` at
    its one real emission site (`capability-plan-lint.mjs` ~L324) — leave
    `capability.unresolved` (~L136) untouched. Confirm `fgos-code-change`'s
    own Step 0 prose workaround (added in I28's fix-round-1, which
    special-cased this exact warn code at the skill-prose level) becomes
    redundant once this lands; simplify it or explicitly document why it
    stays as defense-in-depth — Lead's call during this unit's own
    execution, not pre-decided here.
  files: `src/report/capability-plan-lint.mjs`, `test/cli/plan-lint.test.mjs`
    (~L174-184 currently asserts the OLD warn/`ok:true`/exit-0 behavior for
    this exact code — must be updated, will otherwise break), CHANGELOG.md
    (user-visible behavior change), `domains/coding/skills/fgos-code-change/
    SKILL.md` (only if the Step 0 workaround is simplified).
  verification: a real `plan-lint --cell <id>` run against a fixture with
    an undeclared capability now returns `ok: false`/exit 1 (live CLI
    probe, not just a grep); every existing `--cell`-scoped fixture in the
    real test suite that previously relied on the warn-only behavior is
    checked and updated; a WITHOUT-`--cell` run against the same fixture is
    confirmed to still behave as before (this unit does not touch that
    path); env -u CLAUDE_CODE_SESSION_ID npm test.
  stop: `capability.unresolved` (~L136) is touched (locked distinction
    above); this unit hardens the no-`--cell` path (out of scope, item 4d
    is specifically about cell-open behavior); any `--cell`-scoped
    production plan/phase fixture that legitimately declares its
    capability through a path this unit didn't check (verify both `-
    unit:` blocks AND Product Gates `Capability` column) now fails.

- unit: I33 — reclassify the `group-thinking` protocol pack; defer the protocol-id rename and stub removal as documented, out-of-scope future work (Phase 7 item 4a, narrowed)
  status: MERGED (2026-09-28). integratedSha 5f4ed37b82445f3e50debe3e2a1d6ec7fc27432b,
    testedSha 045ec8150 (unit/I33 tip), clean --no-ff auto-merge (ort), no
    conflicts. Chose a per-member `kind` field on the SAME pack file over a
    physical split, evidenced against real consumer code
    (`group-thinking-pack.mjs`'s hardcoded single-pack-path, and
    `fgos-architecture-panel`'s genuine live dispatch through this exact
    gate) -- Lead independently reproduced all 6 members' CLI resolution
    (genuine full FlowDefinition data, not stub output) before merging.
    `fgos-group-thinking` confirmed untouched (empty diff). See
    plans/260919-coordination-skill-harness-simplification/reports/unit-I33-claude-only-execution-report.md.
  capability: code:implement
  depends-on: I32 (sequenced after the binding-source question settles;
    otherwise file-disjoint)
  status: not-started
  decision (Lead, locked, do not reopen — corrects a confirmed factual
    error in the phase text, 2026-09-28, independently re-confirmed by two
    separate passes: the research fork and the decomposition review, both
    citing I26's own unit report and a direct read of the live file): the
    phase text's own item 4a lists `fgos-group-thinking` among "the
    deprecated ... stubs" to remove. This is WRONG.
    `core/skills/fgos-group-thinking/SKILL.md` is 1,609 words of live,
    full operational content (the core-facing protocol-pack selection
    gate) — Unit I26 already settled this exact question and LOCKED the
    reversal ("do not stub"). Only `fgos-plan-loop` and `fgos-code-panel`
    (stubbed by I29, 73 and 90 words respectively) belong in any removal
    list. `fgos-group-thinking` is OUT of this unit's scope entirely,
    forward and backward — this is a non-negotiable, automatic stop
    condition if violated.
  decision (Lead, 2026-09-28, corrects review H4 — the rename as originally
    scoped is NOT SAFELY EXECUTABLE and is DEFERRED): independently
    confirmed `protocol-loader.mjs` has NO alias concept — duplicate
    `metadata.id`s within a tier are hard-rejected
    (`registerTierEntries`, throws `FlowDefinitionError('duplicate-id',
    ...)`), and `loadCoordinationProtocol` resolves exactly one id per
    lookup. The originally-proposed "additive alias" therefore means
    either (a) duplicating the ~220-line YAML body under a new id — two
    bodies that WILL drift over time, a real maintenance liability this
    track's own RUL11 doctrine ("tùm lum, không phải nặng" — gather
    scattered/duplicated things, don't create more) explicitly argues
    against — or (b) building genuine alias support in
    `protocol-loader.mjs`, a new engine capability entirely absent from
    the original file list. Compounding this: `launch-master-loop.mjs`
    hardcodes the OLD id (`MASTER_LOOP_PROTOCOL_ID`, consumed at ~L78,
    128) with no mechanism to also recognize a new one without its own
    edit; `fgos-code-change/SKILL.md` references the old id in 4 places,
    not 1 (the YAML path, two prose mentions, and inside the DAG-mode raw
    JSON block); and roughly 120 doc files across the repo reference the
    id with no unit currently owning that sweep. Ruling: the actual
    protocol-id rename to `produce-review-revise` is DEFERRED, out of this
    track's Phase 7 scope — not silently dropped, but explicitly recorded
    as a future initiative requiring either accepted YAML-body duplication
    or new `protocol-loader.mjs` alias-engine work, neither of which is
    proportionate to a closeout phase. Reasoning ties to this track's own
    product priority order (D-ADR0030): a rename that requires new engine
    capability and a ~120-file doc sweep is a much larger investment than
    "closeout" implies, and forcing it in now would be scope-creep against
    "Ship Faster"/DoD-over-polish. The OLD id
    (`standalone-master-coordination-loop`) remains canonical and fully
    supported; `fgos-code-change` keeps referencing it unchanged.
  decision (Lead, 2026-09-28, corrects review M4 — stub removal also
    deferred, with an explicit trigger recorded rather than silently
    dropped): `fgos-plan-loop`/`fgos-code-panel`'s actual removal (item
    4a's "remove ... when the compatibility window closes") is likewise
    deferred out of this unit's scope. Recorded trigger for a future unit:
    removal is safe once (1) the protocol-id question above is resolved
    (removing the stubs while old-id sessions might still reference them
    indirectly compounds the same risk), and (2) a replay-compatibility
    check confirms no committed session/replay artifact in this repo's own
    history still requires either stub's presence to replay correctly.
    Neither condition is evaluated by this unit — recording the trigger is
    the deliverable, not evaluating it.
  scope: (1) reclassify the `group-thinking` protocol pack per item 4a's
    own "gated registered protocols" wording (`core/protocol-packs/
    group-thinking.json` currently lists 6 members including
    non-discussion protocols like `standalone-master-coordination-loop`
    and both architecture-advisory-panel variants alongside the 3 genuine
    `group-thinking-*-lite` discussion protocols) — decide and implement
    a concrete classification scheme (e.g., splitting the pack, or adding
    a per-member `kind`/`gated` field) evidenced against real pack
    registration/consumption code, not guessed here; (2) fix the stale
    `skill-package-distribution.md` label — `fgos:code-panel` is still
    marked `implemented` in its adapter-mapping table (~L131) despite now
    being a deprecated stub; relabel accurately; (3) write the deferred-
    rename and deferred-stub-removal decisions above into a durable record
    (this unit's own report at minimum; a `docs/decisions/` entry if this
    repo's convention calls for one at this level).
  files: `core/protocol-packs/group-thinking.json` (or a split/new pack
    file, per the classification scheme chosen), `docs/platform/
    packaging-distribution/contracts/skill-package-distribution.md`
    (~L131 label fix only).
  verification: real CLI probe confirming pack registration/resolution
    still works for every existing member after reclassification; env -u
    CLAUDE_CODE_SESSION_ID npm test.
  stop: `fgos-group-thinking` is touched, stubbed, or removed (automatic,
    non-negotiable per the locked decision above); this unit attempts the
    actual protocol-id rename or stub removal despite both being
    explicitly deferred; the pack reclassification breaks any existing
    member's resolution.

- unit: I34 — complete the drift-test suite, allowlisting the accepted raw-JSON carve-out (Phase 7 item 5)
  status: MERGED (2026-09-28). integratedSha baed9b22e7295e87b7b7823b1427fc0abfd0646d,
    testedSha dc7d2bc9a (unit/I34 tip), clean --no-ff auto-merge (ort), no
    conflicts. Key suites rerun on merged tree: 45/45 pass. 6 of the 9 (+1)
    named drift checks confirmed already covered (verified directly, not
    inherited); 3 genuine gaps got new tests (raw-JSON allowlist,
    keyword-trigger reversal, contract-template resolution). Real,
    significant NEW finding: 9 of 13 registered CoordinationProtocols have
    zero authored prompt templates for any operation, silently falling
    back to a legacy prompt path -- allowlisted with an honesty companion
    test (catches regression on the 4 working protocols without masking
    the other 9), filed as a real follow-up candidate below, not silently
    dropped. See
    plans/260919-coordination-skill-harness-simplification/reports/unit-I34-claude-only-execution-report.md.
  capability: code:test
  depends-on: I30, I31, I32, I33 (audits the phase's own finished state;
    sequenced last among the code units on purpose)
  status: not-started
  decision (Lead, 2026-09-28, corrects review H5 — a real contradiction
    with already-merged, tested design): "runtime skills contain no raw
    request JSON" as a blanket, repo-wide check is FALSE against current
    reality and must not be written that way. `fgos-code-change/SKILL.md`
    (~L121-131) intentionally embeds raw `declared-protocol` JSON for its
    Optional Concurrent Read-Only Fan-Out (Two-Request DAG Mode) — this
    was a deliberate, reviewed design choice (I28), and
    `test/skills/coordination-phase4-driver-discipline.test.mjs` (~L326-330)
    already contains an explicit comment stating "forbid raw JSON entirely
    does not carry over" from `fgos-plan-loop`'s fully-semantic design to
    this merged facade. Write the drift test as an ALLOWLISTED check
    instead: no raw `declared-protocol`/request JSON appears ANYWHERE
    except inside that specific, already-documented DAG-mode block —
    catching new raw-JSON creep without contradicting accepted design.
  context: several of the phase text's 9 named drift checks are already
    covered — confirm with a fresh, direct check in THIS unit (don't just
    cite another unit's context secondhand, a chain-of-custody the review
    correctly flagged as unverified): "generated skill projections are
    byte-identical to canonical sources" (`test/install-packaging.test.mjs`,
    `coordination-schema.test.mjs`); "facades restate no rule owned by the
    driver-discipline fragment" (`test/skills/coordination-phase4-driver-
    discipline.test.mjs`); "every registered capability declares a valid
    `serves` set ... every protocol operation's `policy.capability`
    resolves" (`src/setup/registrations.mjs`'s `capability-serves-valid`
    and `operation-capability-resolves` doctor checks — verify these
    directly in this unit, not assumed from I30's context). The real guard
    for "no portable FlowDefinition carries an executor pin" is
    `binding.mjs`'s H1 guard (~L242-277), NOT `assertNoPortableExecutorPin`
    (which only inspects `preferExecutor` — a different, narrower check) —
    verify which one the phase text's intent actually needs before writing
    a test against the wrong guard. "None triggers on keyword matching of
    implement/code" has NO existing test with an actual keyword/trigger
    assertion despite 3 plausible-sounding files being cited by earlier
    research — confirm this is a genuine gap, don't assume coverage from a
    file name alone.
  scope: for each of the phase text's 9 named drift checks, directly
    verify existing coverage (or its absence) in THIS unit — don't inherit
    an unverified claim from another unit's context. Write new tests only
    for confirmed genuine gaps, respecting the raw-JSON allowlist decision
    above. Report which of the 9 were found already covered (cite the real
    test file directly checked) vs. genuinely new.
  files: whichever `test/` files result from the gap analysis (not guessed
    here — this unit's own first deliverable is the gap list).
  verification: env -u CLAUDE_CODE_SESSION_ID npm test with all new/
    confirmed drift tests passing.
  stop: a "new" test duplicates existing coverage under different
    vocabulary; a written test is weaker than the phase text's own stated
    check; the raw-JSON test contradicts the accepted DAG-mode carve-out
    instead of allowlisting it.

- unit: I35 — doc/CHANGELOG sweep, command-registry gap, and before/after report using the real Phase-0 baseline (Phase 7 items 3, 6, 7)
  status: MERGED (2026-09-28). integratedSha 9dfb5b8f4dde64e27c2d0599810f7fb3c0120649,
    testedSha 71f490979 (unit/I35 tip), clean --no-ff auto-merge (ort), no
    conflicts. **FINAL UNIT OF THE ENTIRE TRACK — Phase 7 and the whole
    `coordination-skill-harness-simplification` track are now CLOSED.**
    Real before/after numbers, both independently reproduced by Lead:
    fgos-plan-loop+fgos-code-panel combined 12,209 -> fgos-code-change
    2,314 words (-81.05%); fgos-architecture-panel 9,006 -> 7,969 words
    (-11.51%); inputTokens:null in both, no token claim made. Replay-corpus
    comparison 10/10 pass, semanticDigest identical to Phase 0's. See the
    "Track Closure Summary" section near the top of this file for the full
    phase-by-phase breakdown and the 7 explicitly-deferred follow-up items;
    implementer's own report at
    plans/260919-coordination-skill-harness-simplification/reports/unit-I35-claude-only-execution-report.md,
    Lead's own verification log at
    plans/260919-coordination-skill-harness-simplification/reports/unit-I35-lead-verification-and-track-closeout-report.md.
  capability: execute
  depends-on: I30, I31, I32, I33, I34 (last unit in the track — its own
    "after" measurement must reflect the finished phase)
  status: not-started
  decision (Lead, 2026-09-28, corrects review H1 — the original draft's
    "before" baseline decision rested on a false premise and is
    SUPERSEDED): a real, checked-in Phase-0 baseline artifact already
    exists — `plans/260919-coordination-skill-harness-simplification/
    reports/phase-00-unit-0c-baseline-replay-measurement.json`
    (`contractVersion: coordination-baseline.v1`, source commit
    `7853e4d7`, committed `ca854f443` on 2026-09-21) — the original
    research fork's "no stored before-baseline exists anywhere in plans/"
    claim was wrong; Phase 0's own stated job was exactly this
    ("Baseline metrics exist before optimization begins"). Its real
    numbers: `fgos-plan-loop` 5,160 words, `fgos-architecture-panel` 9,006
    words, `fgos-code-panel` 7,049 words. The original "reconstruct from a
    pre-Phase-4 git ref" plan was ALSO wrong on its own terms:
    `fgos-code-change` did not exist at any pre-Phase-4 ref, so the
    "after" skill it needs to compare against has no pre-Phase-4 baseline
    to reconstruct in the first place; anchoring at pre-Phase-4 was also
    the wrong point since Phases 0-3 were already part of the
    simplification effort. Corrected plan: use the checked-in Phase-0
    artifact (commit `7853e4d7`) as "before" directly — no reconstruction
    needed. Map old→new: before = `fgos-plan-loop` + `fgos-code-panel`
    (both now stubs, replaced); after = `fgos-code-change` (the facade
    that absorbed both), measured fresh on current main via
    `measure-coordination-baseline.mjs`. Note `inputTokens` is null in the
    Phase-0 artifact, so no token-reduction claim can be made from this
    data alone — report word counts only, and state the token-claim
    limitation plainly rather than omit it silently.
  context: item 3's remaining scope is narrower than the phase text
    implies — I29 already swept the wide majority of live inbound
    references. Its own report names ONE explicit remaining gap:
    `skill-package-distribution.md`'s intent-mapping table has no
    `/fgos:code-change` row. Note (corrects review M5): this table covers
    SKILL SLASH-COMMANDS (`/fgos:code-panel` etc.), a DIFFERENT surface
    from `src/cli/command-registry.mjs`'s CLI verbs — I34's "documented
    commands equal command registry" check is CLI-verb-only and does not
    cover this row; adding the row here does not retroactively satisfy or
    conflict with I34's own check. (I33 already fixes this same table's
    stale `fgos:code-panel` "implemented" label — coordinate, don't
    duplicate that edit if I33 lands first.)
  scope: add the `/fgos:code-change` row to `skill-package-distribution.md`'s
    intent-mapping table; run `measure-coordination-baseline.mjs` fresh
    against current main for the "after" `fgos-code-change` number; use
    the existing Phase-0 artifact (commit `7853e4d7`) as "before" per the
    decision above — no reconstruction; add one line to this unit's own
    verification confirming whether `distinctProviderFrom` has a doctor
    check (research/review found none in `registrations.mjs` — either
    accept as a documented known gap or add one, don't leave it
    unconfirmed); run the replay-corpus comparison explicitly (item 6);
    publish the before/after comparison report (a new file under
    `plans/260919-coordination-skill-harness-simplification/reports/`);
    final CHANGELOG.md entry closing out the track.
  files: `docs/platform/packaging-distribution/contracts/
    skill-package-distribution.md`, a new before/after report file,
    CHANGELOG.md.
  verification: the before/after report cites the exact git refs/commits
    for both measurements (`7853e4d7` for before, current `main` HEAD for
    after), the exact command run, and the raw numbers — not a summary
    claim; explicitly states the `inputTokens: null` limitation rather
    than implying a token measurement exists; a replay-corpus run is
    executed and its result cited; env -u CLAUDE_CODE_SESSION_ID npm test
    one final time on the fully-integrated tree.
  stop: the "before" number is anything other than the real checked-in
    Phase-0 artifact (no re-reconstruction — that path was already shown
    unworkable); the report claims a token-count reduction the data
    doesn't support; the report claims a qualitative improvement without
    the raw before/after numbers.

## Risk map

| Risk | Level | Proof point |
|---|---|---|
| Action projection becomes a second policy engine | high | property/negative tests compare every projected action against kernel refusal/acceptance; projector remains read-only |
| Stale action races with another writer | high | event-sequence/digest-bound action key and concurrency tests |
| Prompt resolver changes effective authority | high | template cannot modify execution contract; provenance/digest tests and malicious-template attacks |
| Legacy replay or session close changes | high | before/after corpus replay plus 583-session migration evidence where available |
| Plan-loop facade creates a second lifecycle ledger | high | status reconstructed only from plan + session logs; static and behavioral tests forbid new persisted track state |
| Skill shrink removes useful judgment | high | fixed-case quality eval and adversarial review of role outputs before deletion |
| Architecture “standard” profile launders a shallow panel as full | high | distinct protocol/preset identity and explicit selection rules; never dynamic omission from the full graph |
| Semantic verbs multiply maintenance surface | medium | one shared composer/action contract; registry-to-doc drift test |
| Template/project override becomes prompt injection | high | trust-tier/narrowing policy, immutable provenance, malicious override tests |
| Stale DAG branch restores an obsolete execution/store seam | high | forward-port from clean baseline; semantic conflict resolution; no merge of conflicted worktree |
| Dispatch provider/redirect policy diverges from Assignment provenance | high | one provider-family vocabulary, explicit cross-provider schema, combined dispatch-plan tests |
| plan-loop becomes the de facto universal loop engine | high | driver-discipline fragment carries zero domain vocabulary; architecture-panel consumes it unchanged in Phase 5; one coding facade in Phase 6 instead of code-panel importing plan-loop |
| Skill renames break existing callers or replay | medium | deprecated stubs for old skill names and old protocol id loadable until the Phase 7 compatibility window closes; replay corpus comparison |
| Phase 09 refactor races ahead of active consumers | high | Phase 3C/I11 gate before any boundary move; behavior projection must remain identical |
| Corrupt RunResult satisfies DAG/quorum/close | high | `interpretRunResult`-only acceptance plus corrupt-evidence replay and close-refusal tests |
| Metrics unavailable from some providers | medium | prompt bytes and wall time are mandatory fallback denominators; unavailable token/cost is explicit |

## Likely touch areas

Exact symbols require impact analysis before editing. Expected areas:

- `src/verbs/coordination/{schema,run,show,chain,close}.mjs`
- new or existing coordination action/status/composer modules
- `src/runner/coordination/{session-engine,replay,read-evaluators}.mjs`
- `src/runner/definitions/{schema,protocol-loader}.mjs`
- prompt-template registry/rendering and Assignment provenance paths
- `src/runner/dispatch/{assignment-runner,assignment-policy,resolve,plan,cli,config,transport}.mjs`
- dispatch runtime inspection, reconciliation, confinement, Herdr, provider
  capacity, setup/doctor, and component-boundary modules
- DAG declaration/compiler/scheduler plus coordination schema/store/replay,
  reconciled against current kernel rather than copied from the old branch
- `src/cli/command-registry.mjs` and `bin/fgos.mjs`
- `core/coordination-protocols/**`
- canonical `core/skills/fgos-{plan-loop,architecture-panel,panel,group-thinking}`
- `domains/coding/skills/fgos-code-panel`
- setup/doctor only if new config/assets are required
- coordination, CLI, protocol-conformance, projection, packaging, and replay
  tests
- platform Agent Coordination specs/contracts/how-to docs and changelog

## Verification strategy

Each phase receives focused positive, refusal, concurrency/idempotency, and
cold-resume tests. Final verification must include:

```sh
npm test
```

plus a version-controlled measurement command/report and the session replay
corpus comparison. Skill changes additionally require positive and negative
behavioral fixtures; word-count reduction alone is not proof of comprehension
or quality.

## Outstanding questions and explicit gates

- Phase 2 candidate `43fdd378` is independently approved. I01 must still stop
  if the candidate or current `main` changes before integration; a newer
  candidate requires a fresh review.
- Dispatch Phase 05 R5/R6/R7 are design gates, not mechanical leftovers:
  provider lookup separation, `crossProvider:true`, and PlacementPolicy
  ownership must be settled against current source before I06 edits them.
- Phase 01 R5 must be implemented or discharged with direct current-source
  evidence during I02; old plan narration is insufficient.
- Whether an architecture `standard` profile should ship remains an empirical
  Phase 5 consumer gate, not an assumption in this plan.
- No outstanding question permits Phase 09/I12 to start before combined review
  I11 approves the integrated runtime.
