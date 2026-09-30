# Context-investigator report — D00-D06 dispatch operability

## Scope and method

Read-only audit of all seven phase briefs; D00-D05 accepted artifacts; D06
reviews, lock, handoff, and promotion manifest; the traceability and incident
matrices; the requested runner, reading-map, Assignment/Run/RunResult, platform
foundations, and routing-handoff documents. I also checked the current worktree
status, D06 commit contents, and whether the named operations already occur in
source/command registration. This is evidence, not an architecture recommendation.

## Evidence supporting design-readiness (not shipment)

1. The track consistently separates design readiness from runtime shipment. The
   plan defines `READY` as permission to create a separate implementation plan,
   expressly not a shipped runtime capability (`plan.md` §Completion Meaning,
   lines 160-165). The lock repeats that it grants no source-mutation authority
   (`architecture-decision-lock.md` §D06 Verdict, lines 41-48). The canonical
   runner spec says the track is design authority only and a future track may
   implement it (`docs/specs/runner.md` §Dispatch operability planned design,
   lines 1182-1204); the canonical Assignment/Run contract has the same
   planned/not-shipped qualifier (`assignment-run-runresult.md` §Planned Dispatch
   Operability Addendum, lines 240-265). No sampled canonical text promotes the
   capabilities as shipped.

2. The central terminal-authority separation is internally consistent. D01 names
   RunResult as the only terminal Run truth and limits RunObservation,
   ProviderOutcome, and the worker claim to distinct roles
   (`contracts/run-result-and-observation.md` §One Truth, Three Layers and
   §Entity Authority, lines 8-36). D02 and D04 preserve that split by making
   inspection read-only (`phase-designs/inspection-surface-and-routing.md` §Ports,
   lines 144-158) and by rejecting retries, admission, resume, reassignment,
   takeover, and process kills from reconciliation
   (`phase-designs/guard-reconciliation.md` §Refusals, lines 57-68).

3. Attribution intentionally avoids causal overclaim. Git state is capped at
   correlation, while `proven` requires positively covering adapter/confinement
   evidence (`phase-designs/evidence-attribution.md` §Attribution Levels and
   §Evidence Sources, lines 38-61). This matches the incident matrix gap register
   (`incident-evidence-matrix.md` §Gap Register, lines 75-83) and the D03 brief's
   stated adversarial condition (`phase-03-evidence-attribution.md` §Adversarial
   Checks, lines 39-43).

4. The expected ownership boundary is compatible with the existing contract:
   Assignment/Run/RunResult do not move Work state or merge
   (`assignment-run-runresult.md` §Work Boundary, lines 290-293), and the
   routing-handoff contract says worker containment is instruction plus a
   disposable branch rather than an OS sandbox (`docs/routing-handoff-contract.md`
   §Ranh giới tin cậy, lines 54-75). D05 explicitly requires the effective
   execution contract to be honest about unenforced permissions
   (`phase-designs/executor-contract-and-production-proof.md` §Effective Execution
   Contract, lines 84-94).

5. There is no hidden tracked implementation edit in the current worktree. `git
   status --short` shows only the untracked supplemental `architecture-panel/`
   directory; `git diff --name-only HEAD` is empty. The recorded D06 commit
   `31fe37e3` changes only the three expected canonical Markdown files plus D06
   design artifacts; it changes no `src/`, `test/`, `bin/`, config, or package
   path. `git diff --check HEAD` passes. This is consistent with the track-wide
   fence (`plan.md` §Track-Wide Prohibitions, lines 140-146).

## Contradictions, missing traceability, and unowned/insufficient evidence

### F1 — D06 required architecture-panel evidence is absent from the accepted D06 record

Severity: material process/readiness gap.

The D06 brief requires a real registered panel with session ID, replay/trace,
role outputs, recommendation, dissent, and confidence
(`phase-06-cross-design-review-promotion.md` §Work and §Required Shape, lines
25-58). The accepted review packet instead records an earlier user waiver and
lists only inline Codex review artifacts (`reviews/d06-review-packet.md` §Panel
Waiver, lines 19-30); the decision lock and closeout repeat that waiver
(`architecture-decision-lock.md` lines 41-44; `reports/track-closeout.md`
§Cell Commits, line 19).

The current untracked supplemental panel request contains no completed session,
replay, role output, or finding disposition; it only defines four initial
operations (`architecture-panel/requests/01-open-framing-shaping.json`). Thus it
does not satisfy the D06 required-shape evidence. The assignment's own requested
report is not, by itself, evidence that the panel completed.

### F2 — The promotion manifest does not cover all D06-required promotion evaluations

Severity: material traceability gap.

D06 requires evaluation of the runner spec, canonical Assignment/Run contracts,
host operation catalog, operator/CLI documentation, and reading map
(`phase-06-cross-design-review-promotion.md` §Promotion Rules, lines 60-66).
The manifest names only the Assignment/Run contract, runner spec, and reading
map (`promotion-manifest.md` table, lines 6-10). It has no target, section,
collision check, or explicit evaluated/no-change rationale for the host operation
catalog or operator/CLI docs, despite introducing planned
`dispatch.runtime.inspect` and `dispatch.runtime.reconcile`.

This is not a claim that those docs must advertise unimplemented commands. It is
an absence of the required audit trail explaining their deliberately unchanged
state. The requirement traceability document likewise lists a future
"operation-catalog" proof (`requirements-traceability.md`, line 15), without
linking a catalog target or implementation handoff owner.

### F3 — D00 status conflicts with the accepted-cell record

Severity: medium documentation-state contradiction.

The plan and closeout report D00 as PASS at merge `a3414717`
(`plan.md` §Cell Status, lines 167-177; `reports/track-closeout.md` §Cell
Commits, lines 11-19). However, the D00 artifact itself remains labeled
`**Status:** D00 drafted` (`incident-evidence-matrix.md`, line 3). D01-D05
design artifacts explicitly say accepted design, while D00 does not. The D06
brief says it reads "all accepted D00-D05 artifacts"
(`phase-06-cross-design-review-promotion.md`, lines 12-16), so this status label
leaves the baseline's acceptance state internally inconsistent.

### F4 — D00 does not supply its required direct source anchors

Severity: medium traceability gap.

D00 requires stable incident IDs and direct source anchors
(`phase-00-incident-normalization.md` §Required Shape, lines 36-40). Its matrix
has stable IDs and one document-level source link, but individual rows contain no
incident-report section, line, artifact, or quoted anchor
(`incident-evidence-matrix.md` rows 35-54). This limits independent checking of
each row's asserted cause and its `already-resolved`, `supporting`, or `external`
disposition. The matrix does correctly reconcile the total to twenty (lines
56-70), but that is count traceability, not source traceability.

### F5 — `collect-result` blurs the stated reconciliation/recovery authority boundary

Severity: medium authority-boundary ambiguity.

DOEA-07 says inspection never receives standalone or Coordination recovery
authority, and DOEA-10 confines reconciliation to proven-stale guards/projections
(`architecture-decision-lock.md`, lines 17-21). D04 nevertheless lists
`collect-result` as a mutating reconciliation action that can "Link or collect"
an already-written normalized result, but delegates it "through the owning
authority" (`phase-designs/guard-reconciliation.md` §Supported Actions, lines
34-44). Its preconditions say that the owning recovery authority permits the
link/collection step (lines 46-55).

No request schema, exact owner operation, or structural dependency rule shows how
the reconcile writer invokes that owner without becoming a recovery proxy. This
matters because the already-existing CLI has distinct standalone `dispatch
recover` and session `coordination recover` doors, while D02's inspect hints name
those separate doors (`phase-designs/inspection-surface-and-routing.md`
§Recovery Authority Hints, lines 160-172). The documents state the intended
boundary but do not yet trace `collect-result` through it.

### F6 — Some phase-specific acceptance shapes are not evidenced in their artifact

Severity: medium completeness gap.

D02 requires request/response schemas and examples for all selectors, resolution
pseudocode and ambiguity/conflict truth tables, a port authority table, and host
projection parity (`phase-02-inspection-surface-routing.md` §Required Shape,
lines 33-39). The accepted design has CLI selector examples, resolution tables,
an output example, and a ports table, but no explicit resolution pseudocode,
per-selector response examples, redaction rules, or host-projection parity table
(`phase-designs/inspection-surface-and-routing.md` §§Public Surface, Selector
Resolution, Output Contract, and Ports, lines 10-158). The D02 brief also calls
for redaction in its Work section (lines 24-31), but the design does not specify
a redaction policy.

This is an absence in the design packet, not proof that no future implementation
can define it.

## Could not determine

- Whether the untracked supplemental panel request will produce the session/replay
  and role evidence demanded by D06. No outcome artifacts exist in its directory.
- Whether the listed D00-D05 merge commits had independent reviewer/red-team
  evidence. The repository log confirms their commits and the closeout says PASS,
  but this design directory does not contain per-cell review/recheck reports.
- Whether every planned liveness proof is implementable for every configured
  adapter. The design correctly profile-gates unsupported actions
  (`phase-designs/guard-reconciliation.md`, lines 43-44), but offers no adapter
  capability inventory or live proof because implementation is explicitly future
  work.

## Deferred items and ownership

The handoff explicitly lists unified recovery, provider/OOM prevention,
cross-session authority, same-key semantics, BL1, and Git-history protection as
deferred (`implementation-handoff.md` §Deferred, lines 30-37). The incident
matrix gives owners or scope boundaries for most of these (`incident-evidence-
matrix.md` rows 37-53 and §Gap Register). However, the implementation handoff
does not name an owning future track/person or a trigger for each deferred item.
That falls short of D06's stated disposition form for a deferred finding: owner
and trigger (`phase-06-cross-design-review-promotion.md` §Work, lines 31-34).

## Bottom line

Evidence supports a coherent planned design and a clean design-only path fence.
Evidence does not fully support the claimed D06 process/readiness closure until
the panel/evaluation/traceability and authority-boundary gaps above are resolved
or explicitly dispositioned with durable evidence.
