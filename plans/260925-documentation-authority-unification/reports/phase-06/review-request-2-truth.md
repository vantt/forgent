# Independent current-truth review request

**Ready for review. This is the A19 truth pass, not another carriage pass, a tooling review, batch closure or authority promotion.** The author stops after publishing this request. No pending row is author-approved.

## Authority and pins

- Owner authorization: af6c116f0e2af1f31f5e1d57830dc60de0c65411, owner-answers.md A19.
- Independent preceding review: 0b9414d8c214f8ea2885eac5a168431f1f3fb1d9. Its carriage acceptance remains intact.
- Current-text commit: 96a13ab21670e1f5d9748c02cd615ea5598b53f5.
- Accounting/receipt commit: f7adbc425808460da17f3b2c5386e1b05bbe6103. Current candidate/source text is unchanged from the current-text commit.
- Code/consumer evidence pin: af6c116f0e2af1f31f5e1d57830dc60de0c65411; the cited implementations are unchanged afterward.
- Author of all newly pending truth judgments, current-content receipts and the 335 changed successor rows: `codex-session:1@2026-10-10`.
- Work only in `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`, branch `plan/260925-documentation-authority-unification`. Do not write or check out main, alter a gate or restore per-batch seeds.

## Read first

All report links below are relative to this directory. The plan root is `plans/260925-documentation-authority-unification`.

1. [Owner answers](owner-answers.md), A19; the phase file's frozen rules and ordinary/checkpoint distinction.
2. [Rejected-file review](review-2-liveness-files.md) and [runner conflicts](review-2-liveness-conflicts.md).
3. [Section truth ledger](truth-ledger-agent-coordination.json): every current section, actual source excerpts, code/CLI evidence, open boundaries and author-caused link restoration.
4. [Native ordinary full-text/diff pack](review-pack-2-truth.md). Its `.md.json` sidecar records the exact native source/target digests and pinned text; it is not a sensitivity pack.
5. [Exact accounting and changed-row lists](truth-accounting-agent-coordination.json), [executed verification](truth-pass-verification.json), [owner queue](owner-queue.md) and [promoted edits](promoted-edits.md).

## Exact content scope

Only the following files under `docs/platform/agent-coordination/` are corrected. The missing current `fgos dispatch recover` description is included in the existing runtime-recovery document, not a new area/file.

- `architecture/dispatch-control-plane.md`
- `architecture/evidence-and-results.md`
- `architecture/work-integration.md`
- `architecture/executor-health-and-fallback.md`
- `architecture/runtime-recovery-design.md`
- `contracts/assignment-run-runresult.md`
- `decisions/ADR-001-work-lifecycle-authority.md`
- `decisions/ADR-002-stage-operation-compatibility.md`
- `decisions/ADR-006-assignment-provenance-and-contract-snapshot.md`
- `decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md`
- `decisions/README.md`
- `proposals/dispatch-control-plane-redesign.md`
- `architecture/group-thinking-trigger-surface.md`
- `architecture/protocol-model.md`
- `architecture/README.md`
- `proposals/README.md`
- `proposals/team-communication-protocol-v1.md`
- `vision.md`
- `vocabulary/canonical-concepts.md`
- `vocabulary/concept-relationships.md`
- `vocabulary/deprecated-and-reserved.md`
- `verification/README.md`
- `spec.md`
- `playbooks/architecture-advisory-artifact-templates.md`
- `playbooks/architecture-advisory-evaluation-rubric.md`
- `playbooks/architecture-advisory-role-doctrine.md`
- `playbooks/README.md`
- `playbooks/coordination-operating-harness.md`
- `playbooks/prompts/master-coordinator.md`

Accepted other current files, the area README, all history, payloads, legacy roots and AGENTS.md are untouched. No new history move, archive/delete, baseline, vocabulary, extractor or checker change occurs.

## What to review

Review **current truth against implementation and concept-level consumers**, not merely link liveness or whether wording sounds plausible. Read every current-state sentence in the scoped files, including examples, tables and diagrams. The section ledger covers 454 sections: 388 author-verified implementation/current-boundary checks, 66 explicitly open design/proof sections and 201 changed displayed sections. Author-verified does not mean independently approved. For an open section, check that the published text honestly says manual, proposed, historical or unexecuted; do not infer implementation from a diagram or invent a runtime proof.

Important checks:

- Recover is a read-only recommendation/planned administrative action boundary. Apply fences, record/claim clearing and legal resume/reassign conditions do not imply automatic worker launch, pane termination or session closure. Compare `src/runner/dispatch/recovery-planner.mjs` and its actual consumers.
- Work authority, primary operation, workflowStep, synchronous role evidence versus asynchronous handoff, compiled assignment provenance and result versions agree with actual code. There is no new Work.stage or surviving coordination-engine CLI contract.
- Bind/assignment/domain harness ownership and Herdr interactive completion agree with the current code, not retired runtime profiles, sentinels or invented execution entrypoints. `fgos-code-change` is not described as a registered implementation executor.
- Dispatch selector and PolicyPatch text describes the implementation while the runner-spec conflicts remain explicitly queued, not silently resolved in runner.md.
- Registered architecture-advisory/coding graph, actual blind steps, expertise/missing-expertise fields, report format and owner-input closure are distinguished from manual cognitive companions, model/roster policy and approval authority.
- Reserved/proposed concepts and rollout/dataset guidance are not presented as implemented APIs, verified results or new binding policy. Participant's JSONL read/append codec is cited; live non-Node append/subscription is not claimed.
- Filled headings and current navigation, including the proposals README, point at surviving physical stage-bearing files.

### Judgment and successor review sets

| Input | Requested current-truth work |
|---|---|
| `ledger/decisions/s2-agent-coordination-truth-judgment.json` | All 431 pending current-target source rows, shown in the native ordinary pack. This includes 298 changed manual bindings and 84 invalidated script-exact entries now authored pending supersedes. Remaining rows retain the preceding rework/hold context and require a truth verdict, not silent approval carry. |
| `ledger/retired-unit-decisions.json` | Only the 335 IDs in accounting `newRetiredSuccessors` (86) and `changedOlderRetiredBindings` (249). Check successor text, rationale, shown target binding and preservation of the old claim. All are authored by the current truth author and remain pending. Do not re-review or invent replacement approvals for the unchanged retired population. |
| `ledger/candidate-classifications-agent-coordination-truth.json` and `ledger/decisions/s2-agent-coordination-truth-classifications.json` | All 511 pending candidate-native-content receipts, including the seven filled headings. Check every displayed current unit against the supplied code citations and its verified/open section boundary. |
| Accounting `retiredLocatorOnly` | 171 preserved-identity locator updates: traceability/digest equality only, not a changed disposition or fresh content decision. |

The 431 current rows are regrouped without content/digest/disposition changes from the eight preceding source shards. Their original shard is recorded. This makes the native `--apply-review` exact pending-set requirement match this truth-only request. The 46 history-target pending rows remain in the old shards and outside this correction; do not author-clear or expand their carriage scope.

The native current-target witness check proves all 335 successor target digests and displayed target hashes. It also verifies 241 stored old source-text witnesses. The other 94 older source rows retain their accepted original source/carriage pin; this additional truth script does not replay them or claim a new source audit. Use the recorded sourceCommit/old committed source review for provenance where needed; hold any genuinely unverifiable binding rather than inventing source text.

The carriage pass and its exact-copy checks are already accepted. This request does not ask to repeat an evidence-payload sampling/carriage pass. It does require truth checks for every current section even when a sentence was previously script-exact. Ordinary sensitivity controls are zero; checkpoint sensitivity/released-key paths remain unchanged.

## Required independent reports

Use your **actual different session identity**. Never use `codex-session:1`, including a changed date suffix. Record your reading method and code evidence. Commit the reports before any ok verdict is applied. Do not stamp this review into the authoring data yourself or infer approval from the author's ledger.

Suggested scoped report names are `review-2-truth-files.md`, `review-2-truth-current.md`, `review-2-truth-retired-unit.md` and `review-2-truth-classifications.md`. They are ordinary reports, not checkpoint reports.

For the source judgment report, use the unchanged headers:

- Reviewer: your actual `reviewer:<provider>-session:<session-id>@<review-date>` identity.
- Author session: `codex-session:1@2026-10-10`.
- Review mode: `ordinary`.
- Pack commit: `f7adbc425808460da17f3b2c5386e1b05bbe6103` (traceability; no ordinary seed/pack score is required).

Exactly one row for each of the 431 pending source claims, with the five native columns **Claim | Verdict | Note | Source digest | Target digest**. Verdicts are ok, rework or hold, with an own substantive note. Copy the full native conservation digests from the genuine sidecar's `sourceUnitDigest` and `targetUnitDigest`; do not substitute a naive raw hash of `source.text`, a short primitive hash or a digest from an edited apply-time unit. The pack displays `sectionText` where present; the verification report separately records raw hashes of that full displayed text.

For the 335 changed successor IDs, use the same ordinary current-author headers and one substantive verdict per requested ID. Use the stored shown-source binding and freshly proved current target binding, explicitly identifying any retained inherited source pin. The global retired file retains its older header for unchanged rows; the changed subset's actual authoredBy is the current truth author, not invented historical authorship.

For the 511 native-content receipts, use current-author/independent-reviewer ordinary headers and **Receipt commit: f7adbc425808460da17f3b2c5386e1b05bbe6103**. The unchanged gate requires seven columns in this order:

**Claim | Class | Verdict | Unit digest | Shown text digest | Note | Evidence digest**

Class is candidate-native-content. Copy each receipt's actual unitDigest and shownTextDigest. Evidence digest is SHA256 of **JSON.stringify(receipt.currentEvidence)** with its existing property order, not sorted JSON or the whole receipt. The note must state the reviewer's own code/behavior finding; citations must actually justify the current claim or honest manual/proposal/unexecuted boundary. Six-column native-content approvals do not close units. A stale/false current claim stays open until corrected.

The current-section report must state verified, rework or open with file:line/command evidence for each section, and distinguish legitimate declared proof/design gaps from false current-runtime statements. List held unknown-blocking claims in the owner queue. Existing history/design-vocabulary hold intent is not cleared by rephrasing a current section.

## Executed checks and reproducible commands

Exact argv arrays, observed exits, findings, count scripts and smoke outputs are committed in `truth-pass-verification.json`. At the accounting pin:

| Check | Actual outcome |
|---|---|
| Full D, two previous registries | Both exit 0; zero fatal conservation findings. Whole-plan open diagnostics remain recorded, not dismissed. |
| D scoped to the 937 batch legacy paths, two previous registries | Both exit 0; zero fatal findings. |
| Strict E on the same scope, two previous registries | Both exit 1: 477 unreviewed source rows, 342 identical-unit owner groups, 969 reverse-open units. Strict closure is **not green**. |
| Legacy ratchet | 995 legacy files, 25 unchanged accounted edits, one accounted addition; exit 0. |
| Constitution/placement | 17 dispositions, 12 claim kinds, 27 document kinds, 16 deferred; 504 files, 503 matches, one exception; zero leftover/ambiguous/evidence-without-index; exit 0. |
| Candidate routing H | 30 inherited findings, zero Agent Coordination, zero new tuples; exit 0. The known proposals-index dangling link is fixed under A19. |
| Existing explicit 51-file Node suite | 912/912 pass, zero fail/cancelled/skipped/todo. Actual invocation starts env -u CLAUDE_CODE_SESSION_ID node --test; a Node script counts the real runner footer. |
| Actual smokes | Pure recovery legality 10 checks; advisory/coding definition/projection/normalization 11 checks; real working-tree Node help descriptor 8 checks, 73 commands. |
| Section/content receipt bindings | 29 file hashes, all 454 sections, 46 excerpts across 33 pinned source/consumer files and all 511 current-content receipts verified. |
| Successor displayed target bindings | All 335 current targets; 241 stored source witnesses verified; 94 inherited source witnesses explicitly not replayed by this additional script. |
| Preservation | 74 historical witnesses and the history/payload tree outside the 29 authorized documents unchanged; five frozen source/import pins unchanged; allowlist checked with only the exact five A3 commit/path exceptions. |

Refresh inputs with the existing frozen command; keep all inventory parts outside Git:

```sh
node scripts/generate-doc-inventory.mjs --refresh --commit HEAD --identity-registry /tmp/phase06/review-identity-registry.json --json-out /tmp/phase06/review-doc-inventory.json --md-out /tmp/phase06/review-doc-inventory.md
```

Then run the exact recorded retiredProjection command to overlay the authored retired decisions into the scratch registry and bind its bytes/hash into the scratch inventory. It changes no extractor/import. Run the recorded full/scoped D and strict E commands separately against **both** `reports/identity-registry.json` and `reports/phase-02-identity-registry.json`, using the existing `--previous-registry` flag; do not change loadPreviousRegistries. The verification JSON's `accountingPinChecks` has all six actual commands, including the 937 repeated scope arguments. Reproducing those arrays with Node spawnSync avoids a guessed or narrowed scope.

Also run:

```sh
node scripts/check-legacy-docs-ratchet.mjs
node scripts/check-doc-constitution.mjs --no-ledger --check-placement
node scripts/check-doc-candidate-status.mjs --json
```

Reviewer approvals alone must not be reported as clearing the 342 identical-owner diagnostics or the outside-scope reverse units. Those findings require their real unchanged-gate closure; no waiver/baseline or hidden exception is proposed here.

## Owner queues, limits and next action

- Two runner.md conflicts remain for the separate main harness investigation: executors.*.for/PolicyPatch prefer* versus code, and architecture-advisory blind versus the registered YAML. Do not edit runner.md here.
- Eleven source holds, three candidate holds and eight retired-row holds retain their original notes and owner intent; exact lists are in the accounting report. The 46 history-target pending rows stay outside the truth correction.
- The 969 reverse-open count includes 511 pending truth receipts and 458 other units. Older six-column native-content reports and old pooled author/receipt mismatches are not silently treated as approvals. Their outside-scope closure remains UNPROVEN.
- No archive/delete/history move, new promoted area-portal edit, authority-status flip, main/legacy-root/AGENTS edit or external dispatch is requested.
- Live worker/provider/Herdr execution, mutating recovery apply and non-Node append/subscribe integration remain **UNPROVEN**. Manual/proposed/historical/dataset sections do not inherit runtime success from unit tests or static code citations.

**Next:** an independent session reviews current truth and the exact changed bindings, runs the unchanged gates and commits the scoped ordinary reports. Only afterward may the author apply ok verdicts from those committed pins, rework or retain holds, re-prove closure and request the next authorized action. The author does not continue to the next content batch or claim Agent Coordination/Phase 6 complete at this stop.
