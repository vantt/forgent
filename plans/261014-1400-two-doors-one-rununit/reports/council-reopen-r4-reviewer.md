{
  "packet": "final-packet-review",
  "reviewedPacket": "/home/vantt/projects/forgentX/.fgos/assignments/unit-run-1791959166509-17455425/producer/2/runs/01/outbox/report-1.md",
  "revision": "r4",
  "role": "reviewer",
  "verdict": "findings",
  "approvalStatus": "Not approved; surviving findings are not consensus or implementation authorization.",
  "scope": "Reviewed the revised final RAW JSON packet against the three supplied parent reports and the verbatim owner request. Targeted read-only code checks only; no git-diff review, blind seats, probe rerun, or implementation.",
  "evidence": [
    "/home/vantt/projects/forgentX/.fgos/assignments/unit-run-1791959166509-17455425/producer/2/runs/01/outbox/report-1.md",
    "All three parent report paths supplied in brief-1.md",
    "docs/specs/reading-map.md",
    "docs/specs/runner.md:1048",
    "src/runner/execution/commit-unit-work.mjs:43-66",
    "src/runner/execution/run.mjs:497-507",
    "src/runner/dispatch/evidence-attribution.mjs:49-127",
    "src/runner/dispatch/settlement.mjs:207-227,571-581,646-697",
    "src/runner/dispatch/assignment-runner.mjs:1531-1541",
    "src/runner/execution/unit-summary.mjs:90-169"
  ],
  "attributedFindings": [
    {
      "id": "F1",
      "severity": "high",
      "by": "reviewer/2 of r4",
      "claim": "D.rule and D.R3_gate treat an empty import allowlist plus D7/D8 migration as proof that dispatch no longer knows Work.",
      "evidence": [
        "src/runner/dispatch/assignment-runner.mjs:1531-1541 reads effectiveAssignment.workId and opts.work.docsRef, resolves the Work content root and hashes its plan.md.",
        "assignment-runner.mjs:1798 and :2680 also pass opts.work downstream. The import of resolveContentRoot is from paths.mjs:57, so the proposed state/work-*.mjs import guard does not catch it."
      ],
      "finding": "The R3 gate can pass while dispatch still interprets Work structure. This is a concrete unaccounted dependency under owner decision (5), not just an opaque provenance id.",
      "disposition": "Unresolved. Include this existing behavior in the separation inventory and acceptance gate; Work-specific plan identity must be supplied by the consuming tier through a generic contract. Do not claim completed separation from the import guard alone."
    },
    {
      "id": "F2",
      "severity": "medium",
      "by": "reviewer/2 of r4",
      "claim": "R0.1 expects commit.sha in unit-summary and R0.5 expects commit.outOfScope there using the existing commit record.",
      "evidence": [
        "src/runner/execution/run.mjs:497-507 attaches commit to result and the attempt record.",
        "src/runner/execution/unit-summary.mjs:90-169 constructs final/attempt seat projections and the returned summary without a commit field."
      ],
      "finding": "Persistence on an execution attempt is not projection into unit-summary. The revised packet names an acceptance surface that the current projection cannot provide, but omits the required projection change.",
      "disposition": "Unresolved. Name the summary projection/read-contract work, or explicitly choose the durable unit/attempt record as the acceptance surface. No claim-v2 or RunResult-v3 migration is implied by this finding."
    },
    {
      "id": "F3",
      "severity": "medium",
      "by": "reviewer/2 of r4",
      "claim": "R0.5 reports outside edits using settlement changedFiles; residual risks say outside edits show up in commit.outOfScope.",
      "evidence": [
        "src/runner/dispatch/settlement.mjs:207-227 computes changedFiles from paths newly dirty after launch plus committed changes.",
        "settlement.mjs:579 computes mutatedDirtyBeforeFiles only for read-only assignments.",
        "Read-only direct invocation computeChangedFiles(process.cwd(), null, null, [outside.txt], [outside.txt]) returned changedFiles=[] and changedFileReasons={}."
      ],
      "finding": "A mutating worker changing an already-dirty outside path can be absent from changedFiles and therefore absent from commit.outOfScope. R0.3 acknowledges this limitation for attribution, but R0.5 and the outside-edit warning claims are not similarly bounded. The observation does not yet cover all outside edits promised by the packet.",
      "disposition": "Unresolved. Either bound R0.5 and its realization claim to the observable cases and retain the explicit gap, or include baseline-change observation and its regression in acceptance. Preserve warning-only attribution; this does not authorize rejection or new write-time tooling."
    }
  ],
  "dispositions": [
    {
      "item": "Required missing expertise key",
      "verdict": "pass",
      "reason": "Exact lowercase key with a space; array contains six nonempty expertise names."
    },
    {
      "item": "Owner decisions and authority",
      "verdict": "pass",
      "reason": "Two doors, soft provider preference with governance/failover, deletion decisions and no af132275b merge remain settled inputs. Writes-only landing and R3 timing remain recommendations, not fabricated owner approval."
    },
    {
      "item": "Parent dissent preservation",
      "verdict": "pass",
      "reason": "All three parent dissent topics and their attributed sides are restored. Wrapper measurement is overruled rather than refuted; confinement ordering is superseded rather than erased; docs-only alternatives stay open."
    },
    {
      "item": "Prior scope-commit and coverage findings",
      "verdict": "pass with bounded acceptance",
      "reason": "r4 corrects pre-staged-index handling, literal pathspec intent and declaredCoverage object shape. Proposed rename/deletion/index semantics remain untested; no implementation pass is asserted."
    },
    {
      "item": "Revised completeness and evidence",
      "verdict": "findings",
      "reason": "F1-F3 remain unresolved."
    }
  ],
  "alternatives": [
    {
      "option": "Accept r4 unchanged",
      "disposition": "rejected",
      "reason": "Its separation gate and scope-warning acceptance overstate what the identified artifacts establish."
    },
    {
      "option": "Resolve or explicitly bound F1-F3 before implementation handoff",
      "disposition": "recommended",
      "reason": "Corrects the reviewed packet without reopening locked owner decisions or rerunning seats."
    }
  ],
  "unchangedDecisions": [
    "Two mechanical doors on runUnit; dispatch is lower tier and Work is a consumer.",
    "Runner commit is the existing mechanism; retain git metadata confinement.",
    "Unit preference is soft; human override remains hard pin; failover cannot be withdrawn by a reversal trigger.",
    "Lane A closed; lane B retained; lane C stays within RUL65b; lane D backend provenance is distinct from authorship; #8 remains warning."
  ],
  "unresolvedDissent": [
    {
      "topic": "Measure before building the short door",
      "sides": "r2: framing, panelist-1, panelist-3 wanted to build the shortcut; panelist-2 (adopted by r2) wanted doctrine first, measure, then build only if needed.",
      "status": "Overruled by owner decision (4) plus the 19-turn demand evidence, NOT refuted on the merits. The 19 files show demand, not external caller coverage. Panelist-2's residual risk survives: no ingress count of external callers of D1/D3. Mitigation: a clear error pointing to the new syntax."
    },
    {
      "topic": "Docs-only confinement shape",
      "sides": "framing/panelist-1: a third named posture via bind(). panelist-2: a capability-specific allowlist, fail closed. panelist-3: no subpath bwrap, worktree + scope-check.",
      "status": "Open, all three positions kept. R0.2/R0.5 implement panelist-3's observe-and-land variant with existing tools. That does not answer panelist-2 (fail closed at write time) or framing/panelist-1 (a bind posture), and none of the three is proven."
    },
    {
      "topic": "Order of the confinement fix",
      "sides": "panelist-1: before the wrapper; panelist-3: inside step 0; panelist-2: after af132275b.",
      "status": "Superseded by the new rollout, not refuted. The owner removed the wrapper and the af132275b merge (4), so two anchors are gone; the fix is R0.4, before R1. The underlying r2 reason, that #8 rejection depends on attestation, is unchanged."
    },
    {
      "topic": "Commit scope: writes-only + fail closed on a foreign index (r4) vs `add -A` (current 5cd01e884)",
      "sides": "producer r3/r4 recommends writes-only. The counter-argument (producer r3, reviewer, red-team): a worker that legitimately creates extra files outside writes sees them left behind, so writes must be complete.",
      "status": "A producer recommendation, not a seat consensus; needs Lead/owner confirmation."
    },
    {
      "topic": "D7/D8 timing",
      "sides": "producer r3/r4: defer to a bounded R3. red-team RT4: acceptable only with a gate and without claiming separation done.",
      "status": "A rollout default under owner question (D) 'now or later'; separation is not achieved until D.R3_gate passes."
    }
  ],
  "namedDefaults": [
    "Review verdict is findings; no approval inferred.",
    "Keep owner decisions and attributed parent evidence intact.",
    "Keep R3 Work separation explicitly incomplete until a gate covering behavioral dependencies passes."
  ],
  "residualRisks": [
    "No implementation tests or mutating probe were run; scoped landing, confinement labeling and failover remain proposed acceptance work.",
    "Import-only guards do not establish semantic independence from Work.",
    "Existing dirty paths lack complete run-change observation.",
    "Concurrent staging between an index preflight and commit remains an index-isolation risk; no claim of concurrency safety is established."
  ],
  "reversalTriggers": [
    "F1-F3 receive concrete packet dispositions and matching acceptance artifacts -> review their revised claims; this is not automatic approval.",
    "Any proposal reverses owner governance/failover or Work boundary -> escalate rather than decide it in review."
  ],
  "whatChangedAndWhy": [
    "This review targets r4, not r3 or the earlier parent proposal. Prior F1-F4/RT corrections are acknowledged only within their stated evidence bounds.",
    "New findings identify existing Work-specific behavior, a missing summary projection, and a scope-observation gap not closed by the revised packet."
  ],
  "missing expertise": [
    "Git index isolation and scoped commit semantics (staged entries, renames, deletions, pathspec magic)",
    "bwrap / Linux namespace sandbox policy (subpath write binds, git directory handling)",
    "provider CLI output formats for usage-limit signals (Codex/OpenAI, xai) and herdr provider-limit classification",
    "caller inventory of D1/D3 across external project installations (migration of deleted doors)",
    "run-specific filesystem write attribution and concurrency isolation",
    "Workflow/Work dependency architecture and migration acceptance",
    "Unit summary projection and durable evidence read-contract compatibility"
  ]
}
