# Step 3 pilot semantic review, g03: batch-041, docs/specs/runner.md

Author pin: ae141550c2e022310de7a0efea757580c0b2479f. The review is read-only. The mechanical checker was not run, as instructed.

Regions read at the pin (file is 3452 lines, 636 KB; digest 8287db54...):
- The full heading outline.
- Every edge line with surrounding context. This covers live Business Rules (L959-1148), Edge Cases/Open Gaps, Pointers (L1236-1290), vocabulary (L1290-1322), CoordinationSession history (L1387-1440), the dispatch operability slice (L1441-1636), and the decision-history section (L1642-EOF).
- The candidate targets, read at the pin:
  - docs/platform/agent-confinement/{spec,contracts/confinement-authority-v1,history/rollout-and-settled-facts}.md
  - docs/platform/packaging-distribution/spec.md
  - docs/platform/agent-coordination/{architecture/work-integration,architecture/dispatch-control-plane,decisions/ADR-011}.md
  - docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md
  - docs/doc-registry.json aliases and docs/knowledge/**

## docs/specs/runner.md

- Set: batch-041
- Verdict: **rework**
- Edges reviewed: 113 (2 patch, 96 preserve, 15 parked)
- Also checked: both hunks are well-formed. The 08243 patch is correct: the target spec.md exists, covers the npm github-install path and install-git-hooks (L88, L808), and keeps the backticks and "xem" form.
- Preserve edges: 96 reviewed, none defective. They fall into these groups, each consistent with L12-26:
  - docs/history/**, docs/decisions/**, docs/explanation/** and docs/how-to/** citations inside the decision-history section (L1642 to EOF).
  - Placeholders and globs.
  - Retained root and registry paths: docs/backlog.md, docs/architecture-manifest.json, docs/routing-handoff-contract.md, docs/platform-foundations.md, docs/decisions/index.md, docs/io-contract.md, docs/platform/component-boundary.md, docs/operator-runbook-herdr-cockpit.md and docs/how-to/operate-dispatch-runtime-inspection-and-reconciliation.md.
  - Self-references of runner.md inside decision bodies.
  - The distillery upstream citation (L1729).
  - The L1387 CoordinationSession region.

### Defects

Wrong target (patch):

1. **maps-j-08232 (L1100, RUL77), wrong target.**
   - Rule: L12-26(1), "specific claims map to the contracts file that states them".
   - Problem: the patch sends `docs/specs/confinement-authority.md` to `docs/platform/agent-confinement/spec.md`. The cited claim ("a direct executor call must carry a capability anchor, never infer the minimum from executor.for") is absent from spec.md. It exists only at `contracts/confinement-authority-v1.md:148-149`.
   - Correction: replace the destination with `docs/platform/agent-confinement/contracts/confinement-authority-v1.md`. Recompute the check records (anchors, relativeResolution, labelForm) and the diff hunk.

Parked edges that should be patches, because a live target exists:

2. **maps-j-08223 (L1001, RUL37, `docs/explanation/iron-law-evidence-contract-stays-human-gated.md`).**
   - Rule: L12-26(2). The successor is in doc-registry aliases.
   - Problem: the claim "no verified committed live target" is false.
   - Correction: patch to `docs/knowledge/why-the-iron-law-evidence-contract-gathers-proof-but-never-a/iron-law-evidence-contract-stays-human-gated.md`. The citation is operative text in a live rule.
3. **maps-j-08224 (L1002, RUL64, `docs/explanation/gate-bypass-design.md`).**
   - Same rule and problem as 08223.
   - Correction: patch to `docs/knowledge/why-gate-bypass-is-shaped-the-way-it-is/gate-bypass-design.md`.
4. **maps-j-08231 (L1044, `docs/reference/forgentx-tool-registry-configuration.md`).**
   - Same rule and problem as 08223.
   - Correction: patch to `docs/knowledge/forgentx-repo-s-tool-registry-configuration/forgentx-tool-registry-configuration.md`.
5. **maps-j-08227 (L1006, RUL40, ADR-011 path).**
   - Rule: L12-21 operative read, exact file.
   - Problem: `docs/platform/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md` exists as a live restored file. It has no locator. The park reason is wrong.
   - Correction: patch to that path.
6. **maps-j-08228 (L1006, RUL40, proposals file with §3.3, §4, §14 H1).**
   - Rule: L12-26(1).
   - Problem: `docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md` exists and has sections 3.3, 4 and 14 with H1. Its own header says "cited by docs/specs/runner.md:1008 RUL40, sections 3.3, 4 and 14 H1". It is a candidate carrier of a whole file, the same status as the spec.md targets of 08232 and 08243, so under the Lead's candidate-status ruling it is not carriage.
   - Correction: patch the path and keep the §3.3, §4, §14 H1 locator text.
   - Judgment: see gap (c).
7. **maps-j-08248 (L1319, `[Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md)`).**
   - Rule: L12-26(7).
   - Problem: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md` is live and restored ("current subject"). The park reason (P8-DOC-GAP-02 / workflow carry) is unrelated.
   - Correction: patch to `../platform/agent-coordination/architecture/dispatch-control-plane.md`, keeping the label.
8. **maps-j-08255 (L1525, `docs/specs/confinement-authority.md` §9.2, blind).**
   - Rule: L12-26(1).
   - Problem: agent-confinement/spec.md has `### 9.2 hostRead: blind` at L454, with original section numbers retained.
   - Correction: patch the path to `docs/platform/agent-confinement/spec.md` and keep the text "§9.2".
9. **maps-j-08256 (L1533, dispatch-control-plane.md plain pointer).**
   - Rule: L12-26(1), same as 08248.
   - Problem: it is a plain pointer with no locator, and the live target exists.
   - Correction: patch to `docs/platform/agent-coordination/architecture/dispatch-control-plane.md`.
10. **maps-j-08260 (L1611, work-integration.md).**
    - Rule: L12-26(1).
    - Problem: `docs/platform/agent-coordination/architecture/work-integration.md` is live ("restored, current subject"). The park reason is wrong.
    - Correction: patch to that path.

Parked edges that should be preserves, because the target is a retained path:

11. **maps-j-08258 (L1603, `docs/how-to/coordination-examples/*.json`).**
    - Rule: L12-26(3) and (9), "a glob resolves to its directory".
    - Problem: the directory `docs/how-to/coordination-examples/` exists at the pin and is not retired. The park reason is "no live target".
    - Correction: disposition preserve, retained path, original glob spelling.
12. **maps-j-08259 (L1604, `docs/how-to/run-a-coordination-session.md`).**
    - Rule: L12-26(3).
    - Problem: the file exists at the pin, and the registry has no retirement alias for it. The sibling 08253 (`docs/how-to/operate-dispatch-...`) is already a preserve.
    - Correction: disposition preserve, retained path.

Parks verified as correct:
- 08230: the §13.1 / `confined-pane-accounts` holder is only history/rollout-and-settled-facts.md, so L12-26(1) says park.
- 08254: workflow has no candidate target (workflow carry dependency).
- 08257: the coordination-session contract exists only under retired-engine files.
- 08261: ADR-010 exists only under retired-engine files.

### Authoring-rule gaps for Lead judgment (kept separate from the defects)

- **(a) Park reasons are generic.** The 15 parked edges use three boilerplate blockedReason/dependency strings. The justified parks (08230, 08257, 08261) do not name the smallest real missing item, for example "sole holder is the retired-engine/history file". The author should state that per edge.
- **(b) Workflow links are dispositioned inconsistently.** 08254 (L1498, `[workflow.md](workflow.md)` in a live pointer) is parked on workflow carry. 08329 and 08330 (L3439 and L3449, D-ADR0070 `[workflow.md](workflow.md)` and `workflow.md §14`) are preserved as decision provenance.
  - If Phase 9 deletes docs/specs/workflow.md without a carry, the two preserved links dangle.
  - The preserve reason on both says "retired CoordinationSession narrative", which is wrong for D-ADR0070. They are decision provenance.
- **(c) Carrier status of whole-file candidate copies.** 08228 relies on `docs/platform/proposals/...` (header "Source snapshot retained"). If Lead reads "Source snapshot retained" or "Full source retained" copies as non-patch targets, 08228 becomes a legitimate park with the dependency named. Defect 6 stands only under the "candidate status is not carriage" ruling.
- **(d) The L1387 CoordinationSession region is preserved as history.** Its framing says only "Mục dưới đây giữ bối cảnh thiết kế lịch sử". There is no explicit "retained verbatim, non-authority" declaration. The heading is "Lịch sử — đã thu hồi".
  - I accept the preserves (08249 to 08252) as retired-decision narrative under L12-26(5).
  - Lead should confirm that reading, because 08250 (work-integration.md) has a live target.
- **(e) Preserve reason labels.** Several retained-path preserves in the decision section (for example 08327 and 08328) carry the (5) decision-provenance label where (3) retained-path fits. This is cosmetic.

## Per-set accounting (my slice of batch-041)

| Set | Files reviewed | Rework |
|---|---|---|
| batch-041 (g03: runner.md only; set has 4 files) | 1 | 1 |

Edge-level defects in runner.md: 12 of 113 (1 wrong target, 9 parked-should-be-patch, 2 parked-should-be-preserve).

Status: DONE
Summary: runner.md is rework: 12 of 113 edges are defective. One patch has the wrong target, 9 parked edges have live candidate or knowledge targets, and 2 parked edges are retained paths that should be preserves. The 96 preserves and the 08243 patch are sound.
