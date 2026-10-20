# Review a38 step-03 wave5g part 03

Pin ae141550c2e022310de7a0efea757580c0b2479f (sources), worktree 9117e9cb6 (targets). Method: Python per-edge extraction, whole pinned source read, committed targets read. No checker/probe run.

## Verdicts

| # | Set | Consumer | Stratum | Edges | Verdict |
|---|---|---|---|---:|---|
| 1 | batch-120 | docs/platform/ui-spec/operations/F02-approve-a-merge.md | unpatched-seeded | 2 | ok |
| 2 | batch-119 | docs/platform/terminal-control/spec.md | patched-seeded | 2 | ok |
| 3 | batch-118 | docs/platform/system-overview/spec.md | patched-seeded | 21 | ok |
| 4 | batch-117 | docs/platform/system-architecture/architecture/architecture-intent.md | patched-seeded | 14 | ok |
| 5 | batch-117 | docs/platform/system-architecture/architecture/workspace-topology-audit.md | unpatched-seeded | 5 | ok |
| 6 | batch-117 | docs/platform/system-architecture/history/architect-readme.md | open-lead-ruling whole-file supplement | 18 | ok (one record migration, see notes) |

Edges reviewed 62 of 62; outcome defects: none.

Per set and stratum (reviewed / rework):
- batch-120 unpatched: 1 / 0
- batch-119 patched: 1 / 0
- batch-118 patched: 1 / 0
- batch-117 patched: 1 / 0
- batch-117 unpatched: 1 / 0
- batch-117 Lead supplement: 1 / 0
- Part total: 6 files / 0 rework.

## Per-file evidence

1. F02 (07863, 07864): both preserve. `docs/ui-spec/flows/F02-approve-a-merge.md` exists at the pin and in the worktree, and docs/ui-spec survives. L21 is a Provenance line and L29 is a Related entry naming a retained path, so neither needs a patch. ok.

2. terminal-control/spec.md
   - 07814 (L178) patches to `docs/reading-map.md`. The file exists. It is the operative first-read map, and the adjacent "then this spec; contracts; measurement report" is unchanged.
   - 07815 (L183, `docs/decisions/`) parks as step5-parity. The sentence prescribes writing repo-wide decisions into the decisions directory, whose corpus was removed. The park is correct.
   - The rest of the file has no other legacy path.

3. system-overview/spec.md. All 21 edges read against the whole source and diff.
   - Preserve: 07803 (Provenance), 07810/07811 (history heading and framing of retired docs/decisions), 07812/07813 (`repo/docs/backlog.md` inside decision narrative, retained root), L6C32 (carriage declaration).
   - Row flip 07804 (L11) and the self Related park 07805 (description-rewrite) are correct.
   - Patches checked against the committed targets:
     - 07806: heading `### Cổng duyệt PR nội bộ (approval gate) — review/approve/reject` is at runner/operations/h-51f5cd7279fd.md:234. Its review/approve/reject, runner/pull/legacy sources, `→done` human role and `→blocked` reason match the adjacent L78 text.
     - 07807: `## 7. Pull Door Take And Return` slugs to `7-pull-door-take-and-return`. It covers take from the frontier, return measuring a clean tree plus advanced HEAD plus verify, and headAtTake/headAtReturn. This matches the 07807 locator flag (Vietnamese title mapped to the English heading).
     - 07808 and L46 (runner/spec.md): the spec carries the startup-reap-skips-pull-claim edge cases at L125/L126, so the whole-spec target is true.
     - L43 (`../work-state/spec.md`) and L50 (`../distillery/spec.md`): consumer-relative forms resolve correctly. The distillery gloss "partial, porting lifecycle only" matches its Purpose.
     - 07809 (`#purpose`): the Purpose text excludes source discovery, cross-source comparison and candidate ranking, matching L90.
     - L49 (`#spec-decision-citation-drift-check`): the H1 is "Spec: Decision Citation Drift Check", and the detect-only gloss matches the target intro.
   - Parks: L42 platform-foundations is GAP-02 (decision narrative held only in the retiring spec). L44 and L45 are GAP-02 (no live holder for the enduser-docs specs; grep of docs/platform confirms only the 0032 narrative and verification logs mention them). L47 (fgos-plugin) is description-rewrite because the "12 verb wrappers" claim conflicts with claude-plugin/spec.md R1 ("more than the original 12 verbs"). L48 (distribution) is description-rewrite because the "npm install via GitHub" scope is stale.
   - No missed reference. Decision-narrative bare names (`platform-foundations.md` at L110) sit in a preserved history body and are not required edges (L12-38).

4. architecture-intent.md (14 edges)
   - Preserve and row-flip: 07752, 07753. Self Related 07754 parks as description-rewrite.
   - Patches 07756 (team-communication-protocol-v1), 07761 (P05.2) and 07764 (master-coordinator) go to exact same-path live candidates. The first and third are coauthored "current contract, not retired engine authority" files. P05.2 holds the live null result and infrastructure failure narrative, matching the L789 gloss.
   - Parks 07757, 07758, 07759 (proposals mirrors are explicit non-canonical conservation carriers) and 07755 plus author-added L61 (the system-vision carrier) are phase9-carry, consistent with each other.
   - Parks 07760, 07762, 07763 (intent-preservation-ledger, coordination-session, flow-definition) are phase9-carry. These files exist only under agent-coordination/history/retired-engine (or, for the ledger, an unrelated platform ledger), which supports the park.
   - The already-rebased links at L411 and L700 do not name retiring paths and are not edges.

5. workspace-topology-audit.md (5 edges)
   - 07776 preserve, 07777 row flip, 07778 self Related park.
   - The L29 label and the link destination `workspace-topology.md` are parked together with the same category (phase9-carry). This matches L12-51(5): both halves of the link are one reference.
   - The document has no other legacy references. Its `src/...` and `.fgos` paths are not retiring doc paths.

6. architect-readme.md (18 edges)
   - The 15 rebased `../../../architect/*` link destinations (07788 to 07802), plus L9 (07785) and L26 (07787), all preserve inside the declared source carriage. The whole-link label plus destination is one reference.
   - 07786 (L17, wrapper Related to its own source) is still parked with category lead-ruling. See the notes below.
   - Backticked `agent-coordination/` and `component-boundary/` at L37/L38 are prose area names inside carriage, not link targets or legacy-root paths, so no edge is required (L12-38).

## Record-text notes (not rework)
- 07786: Lead ruling (b) now settles this as a duplicate Related to the consumer's own source, which parks as description-rewrite/duplicate. The record still carries `blockedCategory/dependencyCategory: lead-ruling` and "Decide the boundary" prose. The category and prose need migrating to the ruled outcome. The disposition (parked) is unchanged.
- 07785 reason cites "inside literal carriage" for the L9 Provenance line, which is wrapper metadata under ruling (b). The preserve outcome is right (L12-47); the cited basis should be the Provenance rule.
- workspace-topology-audit L29C16 and L29C39: the reason text says "Related names the complete system vision ... live vision holder". It is copied from the vision edge and should say workspace topology contract. The outcome (park, phase9-carry) is correct.

## Lead-judgment questions
- system-overview/spec.md L52 carries `spec: \`../platform/convention/spec.md\``. Relative to the consumer directory it resolves to docs/platform/platform/convention/spec.md, which does not exist. The sibling is docs/platform/convention/spec.md. It is not a retiring-path reference, so no step-03 edge covers it. It is a rebasing defect of the carriage that predates this wave. Decide whether it is handled at Phase 9 or tracked separately.

Status: DONE
Summary: All 6 assigned files (62 edges) review ok with no outcome defects. Three record-text notes (07786 category migration, two reason-text slips) and one dead-link observation (system-overview L52) are listed for the Lead.
