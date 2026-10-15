# Proposals and redesigns: carriage audit and next-turn handoff

Date: 2026-10-15. Assignment: `unit-run-1792034226117-40d90d09/producer/1`. Author: `codex-session:unit-run-1792034226117-40d90d09@2026-10-15`. Input source tree: `fb046210539cbcbe8ca1dab254763f5e78c573d2`. Output commit is the actual runner settlement after this turn; no SHA is fabricated. Step 6 is closed under owner A38. This report describes authoring only; Step 7 remains open.

## Result

[Author triage](step7-triage.md) decides all **20 sources** from the frozen map: **15 place verbatim**, **5 archive-with-reason**, **0 delete**. The 27-file estimate is superseded by the frozen map/baseline. All 20 current source blobs equal their frozen map blobs. The author did not treat [Lead evidence](step7-triage-evidence.md) as a verdict. Six proposed archives are retained as candidates instead: dispatch pointer, advisory panel, capability envelope, dispatch contract, group-thinking substrate and visibility/herdr. Live references, implementation/use-case continuity and unfulfilled alternative intent protect these under A17/A19. Most notably `docs/specs/runner.md:999` directly cites visibility/herdr; the input evidence missed that direct reference.

The five history carriers use the existing area history pattern: the documentation scratchpad under `docs/platform/documentation/history/proposals-redesigns/`, and the probe contract, dated chat progress, retired plan loop and handoff prompt under `docs/platform/system-architecture/history/proposals-redesigns/`. Each override names its exact old map target, actual history carrier, source evidence and Q3 reason in [triage JSON](step7-triage.json) and every affected row rationale. All original source paths remain untouched. No component-boundary change.

## Row accounting

**1,815 source rows authored; 0 author rows remaining; 1,815 pending independent review; 0 reviewed.** This is one producer authoring session, with extractor/line-conservation assistance, not 1,815 claimed deep content reviews. Every row has a non-script author, its own source/target anchors, full digests, disposition and rationale. No author approval or native candidate ID is invented.

- Native exact-carry classifications: **1,291 Unit-exact / 440 Weak-exact / 84 Judgment**. All are explicit pending rows; no script review is asserted before committed native proof.
- **84 differing source/target digests**, each explicitly listed per shard in [A36 review-input lists](step7-differing-digests.json). The whole Weak-exact/Judgment denominator is 524; the future reviewer selects the random sample per bounded pack and must deep-read every differing-digest row. This file is not a diff pack, seeded pack, review request or author-selected sample.
- Row dispositions: **846 move / 870 supersede / 99 archive-with-reason**. The five archival source files contain 313 source rows; the 15 candidate source files contain 1502. The scratchpad’s maintained-authority class legally uses move-to-history (A15/A16 precedent); the four retained-source histories use archive-with-reason. Ten retained-source live proposal/index files use whole-unit supersede because the unchanged vocabulary permits move only for maintained-authority. These representations do not drop text or promote authority.

| # | Source | Carrier | Source rows | Differing digest rows |
|---|---|---|---:|---:|
| 1 | `docs/architect/dispatch-control-plane-redesign.md` | `docs/platform/proposals/dispatch-control-plane-redesign.md` | 7 | 1 |
| 2 | `docs/architect/documentation-system-design.md` | `docs/platform/documentation/architecture/documentation-system-design.md` | 129 | 1 |
| 3 | `docs/architect/documentation-system-discussion.md` | `docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md` | 214 | 1 |
| 4 | `docs/architect/doing-coordination-redesign.md` | `docs/platform/proposals/doing-coordination-redesign.md` | 233 | 1 |
| 5 | `docs/architect/domainization/README.md` | `docs/platform/domainization/architecture/domainization.md` | 66 | 4 |
| 6 | `docs/architect/knowledge-registry-redesign.md` | `docs/platform/proposals/knowledge-registry-redesign.md` | 197 | 1 |
| 7 | `docs/architect/proposals/architecture-advisory-panel.md` | `docs/platform/proposals/architecture-advisory-panel.md` | 119 | 5 |
| 8 | `docs/architect/proposals/component-authority-boundary-map.md` | `docs/platform/proposals/component-authority-boundary-map.md` | 99 | 6 |
| 9 | `docs/architect/proposals/coordination-capability-envelope.md` | `docs/platform/proposals/coordination-capability-envelope.md` | 92 | 9 |
| 10 | `docs/architect/proposals/coordination-dispatch-contract.md` | `docs/platform/proposals/coordination-dispatch-contract.md` | 49 | 2 |
| 11 | `docs/architect/proposals/coordination-envelope-probe-contract.md` | `docs/platform/system-architecture/history/proposals-redesigns/coordination-envelope-probe-contract.md` | 28 | 6 |
| 12 | `docs/architect/proposals/coordination-envelope-progress.md` | `docs/platform/system-architecture/history/proposals-redesigns/coordination-envelope-progress.md` | 27 | 6 |
| 13 | `docs/architect/proposals/coordination-worker-provider-boundary.md` | `docs/platform/proposals/coordination-worker-provider-boundary.md` | 37 | 4 |
| 14 | `docs/architect/proposals/group-thinking-plan-loop.md` | `docs/platform/system-architecture/history/proposals-redesigns/group-thinking-plan-loop.md` | 40 | 3 |
| 15 | `docs/architect/proposals/README.md` | `docs/platform/proposals/README.md` | 8 | 5 |
| 16 | `docs/architect/proposals/step-09-group-thinking-substrate.md` | `docs/platform/proposals/step-09-group-thinking-substrate.md` | 93 | 10 |
| 17 | `docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md` | `docs/platform/system-architecture/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md` | 4 | 1 |
| 18 | `docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md` | `docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md` | 154 | 2 |
| 19 | `docs/architect/proposals/step-10-coding-domain-adoption.md` | `docs/platform/proposals/step-10-coding-domain-adoption.md` | 96 | 12 |
| 20 | `docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md` | `docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md` | 123 | 4 |

## Conservation proof and limits

[Complete accounting](step7-carriage-accounting.json) records every original source line’s target line, every unit binding, source/target file hashes, all 98 physical relative-link rebases, and six literal source units. The latter preserve inherited missing references (five body units) and original pre-H1 YAML (one unit) without substituting a current design. Reversing only the documented link rebases reconstructs **every source line byte for byte**; all original H1s, body wording, metadata, stale Not started headers, constraints, open questions and negative findings survive. Candidate headers and notes are explicitly labelled Added in candidate, separate from original source metadata. Current truth is not certified by conservation.

The existing [section-level liveness scan](liveness-proposals-redesigns.json) ran before candidate placement using the full source pin. Its original direct/symbol/path hits and live-input hashes are retained, with pending author adjudication. Ratchet paths are inventories, unrelated README basenames are collisions, generic symbol hits are not implementation of a specific dated experiment or chat. Current reusable dispatch/worker/provider intent stays in candidate carriers; the historical probe and chat do not become current merely by sharing Assignment/Run vocabulary. No blanket engine-retirement inference is applied to all proposals.

The [machine audit](audit-261015-1024-proposals-redesigns-carriage.json) contains the reproduction source and exact measured results: 20 original blobs unchanged; 1,815 unique source decisions with full source/target extractor bindings; all rows pending; all 84 differing-digest IDs exactly equal their submitted per-shard lists; one H1 per target; 20 candidate statuses; 20 actual unambiguous constitution placements; **0 candidate metadata/link findings** using explicit working-tree target files. This is not the tracked-only whole-tree H check or native D/E.

The actual path classification of `docs/platform/proposals/README.md` is **proposal**, despite the frozen map’s collection-index label; its mapped target, original index text and Collection index metadata remain. This discrepancy is disclosed, not masked by a new placement rule, marker, gate or baseline. The documentation navigation owner owes its independent settlement before cutover. The original index’s active list remains a source snapshot.

The generated `.agents/skills/fgos-coding-knowledge/SKILL.md:9,45` names `domains/coding/skills/fgos-coding-knowledge/SKILL.md` as its authoring source (citation at :44). The input’s `core/skills/fgos-coding-knowledge` source is absent. [Existing obligation list](owner-queue.md#proposalsredesigns-carriage-obligations--2026-10-15) records both the requested consumer and this evidence-based correction, plus all requested code/bin/runner/how-to repoints and done conditions. No generated skills or consumer bytes are edited.

The persisted registry is unchanged: **60,277,528 bytes**, SHA256 `1ec13215600551ffdb9cb2f3a6e1260fdbd0cf0e829171d95f42309221384d02`. Local source extraction uses only those already-known source identities; no full native sync, carry-forward, new candidate identity graft or registry persistence is performed. Main has zero commits beyond the last sync `69dd3ee7f`; no merge is needed.

## Verification and next action

`env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-review-format.test.mjs test/scripts/doc-decision-review.test.mjs`: **39/39 pass**, zero fail/cancel/skip/todo. Ratchet clean: 995 legacy files, 26 existing accounted edits, one existing accounted new file. Original sources, frozen maps, checkers, vocabulary, extractor, baselines, switchboard and working registry are unchanged. Repository writes are only the 20 candidate/history files, 20 decision shards and plan reports/obligations/progress. No git write, lifecycle verb, secret read, manual workspace `.fgos/` access, code-symbol edit, promotion, push or Step 8 work. The external result claim is the required exception.

Scratch helpers and intermediate logs stay in `/tmp/fgos-work/`; the audit embeds its exact reproduction code as evidence. The conventional report name was returned by the existing Rust `fgos convention name` door; its path command rejects this plan’s older non-timestamp directory name, so the report uses the already-prescribed report directory. No convention/tool change. MDView MCP is not exposed; a CLI preview could write outside the authorized file scope, so no preview or registration is claimed. GitNexus MCP is not exposed; there are no code-symbol edits and this worker performs no commit.

**Next turn:** bind this turn’s actual runner commit; run the native sync **once** from the persisted working registry; prove D against both prior registries, scoped E and complete known/native/reverse tuple equality; persist the registry. Then package bounded independent ordinary review requests (source/target full text and all A36 differing-digest lists). Do not claim source review or closure from these local checks. Apply only subsequent committed independent verdicts. Step 7’s own hostile review, truth/block samples, fresh readers and owner token-total reporting remain owed. No owner token total is guessed. Preserve all prior holds, A34 digest-bound partial carries, native gaps, CTR010/navigation gaps and current-truth/promotion/consumer/cutover obligations.

**Owner queue:** zero new intent-choice questions, zero delete requests. Outstanding index kind/navigation settlement and later repoints are recorded obligations, not a reason to change rules now. No unexplained technical blocker remains for this authoring turn; native proof and independent review are explicitly not completed here.
