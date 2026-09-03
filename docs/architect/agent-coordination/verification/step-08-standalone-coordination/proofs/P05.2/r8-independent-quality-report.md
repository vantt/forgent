# R8 Independent Quality Report — P05.2 (mdview editor-screen case)

Evaluator: independent, first exposure to this case. Read only: case-lock.md,
all files under `r6-single-agent-baseline/` (excluding `driver.mjs`), and all
`run-result-*.json` / `agent-report-*.md` / `session-manifest.json` /
`session-events.json` under `r7-live-framework-proof/` plus a scoped read of
`r7-live-framework-proof/run.log` (phase wall-time and retry summary lines
only) to resolve ordering/quota-cause ambiguity the JSON left open. No other
file was read. No file was edited.

## Objective-constraint check (both modes)

The locked objective requires a **new, separate editor screen**, never inline
editing on the existing view route, and requires any answer proposing inline
editing to be flagged as non-responsive rather than silently accepted.

- **R6 (single-agent baseline)**: HONORED. The agent-report explicitly scopes
  itself to a separate screen throughout (§1, route `/p/{project-id}/{path}/_edit`),
  and in §4 ("Alternatives considered") explicitly lists "Inline editing on the
  existing view screen" and labels it "*not recommended, and flagged as
  non-responsive* ... Any answer proposing it has not answered the question
  asked." This matches case-lock's own instruction verbatim.
- **R7 (framework run), real content that exists**: HONORED at the explorer
  level. `agent-report-explorer-a-attempt-01.md` opens with a "Constraint
  compliance" section: "Proposal is a distinct route ... never a toggle on
  the existing read-only view route. Does not fall into the 'inline editing'
  trap." The supplement-codex clusterer report explicitly re-checks this
  ("The available report does **not** propose inline editing... This check is
  incomplete for op_003/op_004 because their reports are absent"). The
  critic's report explicitly and correctly refuses to certify the constraint
  as passed, given it had nothing to check: "**Verdict: not evaluable. The
  check did not run.** This must not be read downstream as 'no violation
  found'."
- **R7, systemic gap**: the framework's own designated verification point for
  this exact constraint — the critical-challenge stage, whose job is to
  flag any clustered candidate that violates it — never actually ran against
  real content, because its sole input (`op_005`, the clusterer) failed
  before producing any clusters (provider quota exhaustion). The two
  downstream synthesis stages (`op_008` convergent-synthesis, `op_009`
  recommend-with-dissent) also both settled `failed` with zero artifacts. So
  while every piece of real R7 content that exists honors the constraint,
  the framework as a system never produced a converged, verified final
  answer that carries that clearance — the pipeline's own gate for this
  exact check is honestly recorded as "not evaluable," not "passed."

## Per-dimension scores

Scale used (case-lock defines no numeric scale): **Strong / Adequate / Weak /
None**, plus N/A where the rubric itself marks a dimension N/A.

| # | Dimension | R6 | R7 | Evidence |
|---|---|---|---|---|
| 1 | Evidence coverage | **Strong** | **Adequate** | R6 cites §3.2, §7.1, §7.2, §7.4, §7.5 throughout and is the only mode to engage the MCP/CLI client surface explicitly (§4: "Write via a new MCP tool ... Fits the existing MCP adapter"). R7's only full-content explorer (explorer-a) engages §7.4 ports, §7.2 routes, §3.2 non-goals, §7.1 daemon, §7.5 desktop invariant, and the critic's checklist adds §7.4's `comrak` render engine — but neither ever mentions the MCP/CLI adapter surface at all. |
| 2 | Unsupported claims | **Adequate** (self-audited, none independently caught) | **Weak** (one caught, contradicted) | R6 carries its own "§5 Unsupported assumptions" (A1–A9), all self-flagged, none independently reviewed by any other agent in this proof. R7's evidence-reviewer independently audited the critic's report and found 4 of 22 claims unsupported/speculative, one of them (PROC-2, "the inline-editing constraint has no independent enforcement point ... enforced only at the critic stage") **directly contradicted** by evidence the critic admits it chose not to read: `op_002/op_003/op_004`'s own `assignment.json` files each carry the identical constraint paragraph. Note: R6 was never subjected to an equivalent independent audit in this proof, so "0 caught" for R6 reflects absence of an auditor, not a proven absence of unsupported claims — see Unresolved/evidence gaps. |
| 3 | Unique valid alternatives/risks | **Strong** (6 named, reasoned) | **Weak** (1 alternative; risk checklist not independently validated as findings) | R6 §4 names and reasons about 6 distinct approaches (separate screen [primary], hand off to `$EDITOR`, separate daemon/process, desktop-only editor, MCP write tool, CRDT/OT), each with an explicit accept/reject rationale. R7's divergent-exploration phase was supposed to produce 3 independent explorer perspectives but 2 of 3 (`explorer-b`, `explorer-c`) produced zero content (both failed with `"dispatch for cwd ... is already in flight"` — lock contention), leaving only explorer-a's single approach. The clusterer/critic layers add an 8-item risk checklist, but the clusterer itself labels this "single-source, uncorroborated," and 2 of the 8 risk items (write-back safety, path traversal) were independently flagged by the evidence-reviewer as "generic ... not traceable to any line in the frozen PRD brief," i.e., imported domain knowledge rather than case-grounded findings. |
| 4 | Decision-criteria coverage | **Strong** | **None** | R6 §3 is an explicit, ordered 7-item decision-criteria list (e.g., "Is §3.2's 'not an authoring tool' load-bearing or positioning? ... a gate, answerable in one sentence"), directly matching the rubric's own example criteria (write-path safety, desktop-vs-web parity, scope of the new screen). No R7 artifact produces an equivalent decision-criteria list; explorer-a ends in "Unresolved questions" (2 items) and the critic's "claims that need evidence" section functions as an internal verification checklist for critiquing content, not decision criteria for a maintainer choosing whether/how to build. |
| 5 | Dissent preservation | N/A | **Weak** (honest, but undemonstrated) | The mechanism behaved honestly when it had nothing to preserve: the clusterer labels `op_003`/`op_004` "Operational outlier ... cannot be treated as agreement/disagreement" rather than fabricating a minority view, and the critic explicitly flags "PROC-4 ... the R3 minority-preservation requirement is now unverifiable ... no record of whether a minority position existed." But since 2 of 3 explorers never produced content and the `recommend-with-dissent` stage (`op_009`) itself settled `failed` with zero artifacts, the framework's actual dissent-preservation capability was never exercised end-to-end in this run — there was no real minority position to test it against, and no final dissent-carrying synthesis was ever produced to check. |
| 6 | Actionability | **Strong** | **Weak** | R6 is a single, complete document an engineer could act on directly: named risk, ranked runner-up, ordered decision gates, named alternatives with rejection reasons, named assumptions. No R7 artifact reaches this state — a reader would need to assemble a picture from explorer-a's report, the critic's "BLOCKED" notice, and the evidence-reviewer's audit, then would still find no final recommendation, since both synthesis stages produced nothing. |
| 7 | Operator time | Not reported for R6 (no "Operator intervention" line present in `run.log`; nothing observed suggesting intervention) | **"None"**, explicitly recorded | R7's `run.log` states: `"Operator intervention: None. This driver ran unattended end to end; no manual retry, no manual config edit mid-run, no manual result correction."` R6's `run.log` contains no equivalent explicit line; absence of intervention is inferred, not stated. |
| 8 | Wall time | **224213 ms** (~3m44s) | **516631 ms** (~8m37s, sum of 6 phase wall-times incl. one already-collapsed 122231ms concurrent 3-branch batch) | Both figures are directly quoted from each run's own `run.log`/`run-result.json`. R7 took ~2.3x R6's wall time and settled with no completed final deliverable. |
| 9 | Retries | **"unknown"**, explicitly recorded; 1 of 1 dispatches failed, none retried | **"unknown"** for all 9 actor slots, explicitly recorded; 8 of 9 dispatches settled `failed`, only 1 (`evidence-reviewer-actor`, `op_007`) settled `done`; none were retried within this proof | Neither mode fabricates a retry count — both explicitly record "unknown" (R6: `run.log` line 65; R7: `run.log`'s per-actor retries block, all "unknown"). The dispatch-level failure counts (from `status` fields in each `run-result*.json`) are directly countable: R6 = 1 failed / 1 dispatch; R7 = 8 failed / 9 dispatches (facilitator, explorer-b, explorer-c, clusterer, critic\*, synthesizer-draft, synthesizer-final all `failed`; \*critic and explorer-a and supplement-clusterer are schema-validation "failed" but carry real content). The R7 supplement-codex clusterer dispatch is a new assignment on a different executor/provider (`codex-pi`/`openai-codex`), not a same-assignment retry of `op_005` — it should not be counted as a "retry" under this dimension. |
| 10 | Available cost | **"unknown"**, explicitly recorded | **"unknown"** (no cost/token field present in any `run-result-*.json`; no cost line in `run.log`) | Neither run surfaces a real cost/token figure; both are correctly left unguessed per case-lock's own instruction. |

## Overall comparative verdict

**No demonstrated quality gain from the framework run over the single-agent
baseline in this proof; on the evidence produced, R6 outperforms R7 for
practical purposes, and the framework's own distinguishing cognitive
mechanisms (multi-explorer divergence, clustering, critique, dissent-
preserving synthesis) cannot be judged on their merits because most of the
pipeline never executed successfully.**

Justification, strictly from the artifacts:

- R6 produced one complete, self-contained answer covering all five requested
  elements (simplicity judgment, single largest risk with a ranked runner-up,
  ordered decision criteria, six alternatives with reasoning, nine explicitly
  labeled unsupported assumptions) in a single dispatch, in 224213 ms.
- R7 spent 516631 ms across 9 dispatches and never produced an equivalent
  single deliverable. Two of three parallel explorers (`explorer-b`,
  `explorer-c`) produced zero content (lock contention — "dispatch for cwd
  ... is already in flight"). The clusterer produced zero content (provider
  quota exhaustion, `agy-cli`/`gemini-3.1-pro-low`). The critic could not
  critique anything (its sole authorized input, the clusterer, was empty) and
  correctly reported itself `BLOCKED`. Both synthesis stages
  (`convergent-synthesis`, `recommend-with-dissent`) settled `failed` with
  zero artifacts and only the uninformative claim `"Settled"` recorded as
  their outcome. The framework's own end-of-run summary line — `"All 6
  phases (9 real dispatches across 8 actors) completed: yes"` — is misleading
  if read as "produced usable output": it reflects that every dispatch
  *settled* (reached a terminal state), not that the pipeline converged to a
  deliverable. This gap between "settled" and "produced content" is worth
  flagging explicitly per case-lock's own instruction to check for real
  content regardless of the settled status field.
- The one clear, verifiable positive the framework run demonstrates is a
  genuine multi-agent audit catching a real error: the evidence-reviewer
  independently re-read the three explorer `assignment.json` files the
  critic admitted it skipped, and correctly disproved the critic's claim
  that the inline-editing constraint had "no independent enforcement point."
  This is a real quality mechanism working as intended. But it is a
  self-referential correction internal to the pipeline's own process claims,
  not a quality improvement on the substantive mdview architecture question,
  and it occurred inside a pipeline that never converged to a usable final
  answer.
- Because 8 of 9 R7 dispatches failed for infrastructure/dispatch-layer
  reasons (lock contention, provider quota exhaustion, schema validation)
  rather than for reasons related to the framework's cognitive design, this
  proof cannot distinguish "the group-cognition mechanism underperforms a
  single agent" from "the dispatch/session-engine layer under this run's
  conditions could not keep the pipeline alive long enough to test the
  mechanism." Per case-lock's explicit instruction, this is recorded as a
  genuine null/negative result rather than a manufactured positive — the
  proof closes here, and the appropriate next step is a documented product
  reassessment of dispatch reliability (lock contention on concurrent
  same-cwd dispatches; provider-quota headroom for the required tiers) before
  a second live attempt could produce evidence usable for a real efficacy
  comparison.

## Unresolved / evidence gaps

1. **R6 was never independently audited within this proof.** Its "0
   unsupported claims independently caught" (dimension 2) reflects that no
   red-team/evidence-review stage was ever run against it, not a proven
   absence of unsupported claims. I did not have the mdview repository
   available to verify R6's claims against source myself; my read is limited
   to internal consistency and correct citation of the frozen brief's quoted
   text, same as R7's own evidence-reviewer methodology.
2. **Root cause of `explorer-b`/`explorer-c`'s "already in flight" failure**
   is stated only as a lock-contention message
   (`dispatch for cwd "/tmp/fgos-p052-r7-live-proof-wsycE3" is already in
   flight (held for 0s)`) in the `run-result-explorers.json` file; nothing in
   the files I read explains why two concurrent dispatches to the same
   working directory were attempted in a way that collided, or why the
   held-for time is reported as 0s. Not speculated on further.
3. **Root cause of the facilitator (`op_001`, dispatch-exploration) and both
   synthesizer (`op_008`, `op_009`) failures is not recorded** in the
   `run-result-*.json` files beyond `exitCode: 1` and the uninformative
   `agentClaim.summary: "Settled"`. No stderr/stdout content was available to
   me under the files I was permitted to read (the referenced
   `stdoutLog`/`stderrLog` paths point inside `.fgos/assignments/...`,
   outside the `proofs/P05.2/` directory this review was scoped to).
4. **Whether the supplement-codex clusterer dispatch was authorized by, or
   deviates from, the frozen budget/bounds in case-lock.md's "Budgets"
   section** is not something I can confirm — case-lock's own Amendment log
   is empty, and I was instructed not to read `driver.mjs`, so I cannot see
   whether this supplement dispatch was pre-declared as an allowed
   compensating action or is itself an undocumented deviation. This is worth
   the coordinator's attention before treating this run as a clean proof of
   budget adherence.
5. **Second-provider-family feasibility question** (case-lock's "Required
   tiers / provider families" section, P05.2's declared first empirical
   question) is not cleanly resolved by this run: `gemini` appears across
   multiple `creative`/`analytical`/`critical` tier slots but 3 of its
   dispatches (facilitator, clusterer, both synthesis stages — 4 of the 5
   `gemini`-routed dispatches) failed, one of them explicitly for quota
   reasons. Whether `gemini` genuinely "supports" the required tiers under
   real load, or only nominally routes to them before failing, is not
   something this proof can answer either way from the files provided.

Status: DONE
Summary: R6 (single-agent baseline) produced a complete, well-hedged, actionable answer honoring the locked no-inline-editing constraint in one 224s dispatch; R7 (framework run) never produced a completed final synthesis — 8 of 9 dispatches failed (lock contention, provider-quota exhaustion, schema validation), both synthesis phases settled with zero content, and only the evidence-reviewer stage fully succeeded — so this proof is a genuine null/negative result for the framework, not a demonstrated quality gain, and cannot separately validate or invalidate the framework's cognitive mechanism because most of the pipeline never ran.
Concerns/Blockers: See "Unresolved / evidence gaps" — root causes of the facilitator/synthesizer/lock-contention failures are not recorded in the files I was scoped to read, and the supplement-codex dispatch's budget provenance could not be confirmed without reading driver.mjs, which was out of scope.
