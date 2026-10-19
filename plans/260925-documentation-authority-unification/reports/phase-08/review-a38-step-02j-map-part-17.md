# Review a38 step-02j map part 17

- Reviewer: reviewer:sonnet-session:a0ab036d5de033b59@2026-10-19
- Commits: reviewed tree `6235d0151` (accounting), author `9650bdee6`; read-only worktree `/home/vantt/projects/forgentX-s8-review` verified detached at `6235d01516e5`
- Part: 17 (seeded-semantic-edge-sample, 60 entries, `step-02j-census-maps-portals-prose.json`)
- Rule set: L12-26 classes 1-10, L12-7, L12-10, L12-19..L12-27; Lead rulings applied (doc-registry lookup data preserved; desiredOwner on preserved rows non-actionable; non-doc relative command paths not edges)

## Totals

- ok 50 / rework 6 / needs-Lead-judgment 4 of 60
- rework rate: 10.0% (limit 3%); rework + judgment: 16.7%
- rework ids: maps-j-06509, maps-j-06519, maps-j-06577, maps-j-06629, maps-j-06634, maps-j-06683
- needs-Lead-judgment ids: maps-j-06408, maps-j-06452, maps-j-06469, maps-j-06485

## Rows

| # | edge | consumer:line | action / status | verdict | defect class | rationale |
|---|---|---|---|---|---|---|
| 1 | maps-j-06408 | `agent-coordination/history/retired-engine/intent-preservation-ledger.md:432` | preserve / preserved | needs-Lead-judgment | class 10 findable successor | Action preserve is correct (retained ledger table, relocation-broken relative link). Successor note is null/"unresolved" but an exact same-name copy exists at `history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md`; class 10 says findable successors are recorded. |
| 2 | maps-j-06421 | `agent-coordination/history/retired-engine/legacy/architecture/system-context.md:9` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 3 | maps-j-06428 | `agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md:17` | cutover-patch-only / proposed-only | ok |  | Patch target/anchor and form verified against committed tree; consumer is live wrapper/navigation. |
| 4 | maps-j-06432 | `agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md:321` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 5 | maps-j-06434 | `agent-coordination/history/retired-engine/proposals/semantic-cli-surface.md:18` | preserve / preserved | ok |  | Preserve (self/lineage/provenance) correct. |
| 6 | maps-j-06435 | `agent-coordination/history/retired-engine/proposals/semantic-cli-surface.md:39` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 7 | maps-j-06438 | `agent-coordination/history/retired-engine/spec.md:45` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 8 | maps-j-06452 | `agent-coordination/history/retired-engine/spec.md:148` | preserve / preserved | needs-Lead-judgment | class 10 findable successor | Preserve correct. Note null although `history/retired-engine/files/contracts/flow-definition.md` exists (same basename; intended referent docs/architect/.../flow-definition.md also still present). |
| 9 | maps-j-06469 | `agent-coordination/history/retired-engine/subcomponents/README.md:55` | preserve / preserved | needs-Lead-judgment | class 10 findable successor | Preserve correct. Note null although live `docs/platform/agent-coordination/contracts/workflow-stage-operation.md` and `history/retired-engine/files/contracts/workflow-stage-operation.md` exist. |
| 10 | maps-j-06482 | `agent-coordination/history/retired-engine/verification/implementation-alignment.md:9` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 11 | maps-j-06485 | `agent-coordination/history/retired-engine/verification/implementation-alignment.md:54` | preserve / preserved | needs-Lead-judgment | class 10 findable successor | Preserve correct. Note null although live `docs/platform/agent-coordination/architecture/work-integration.md` and a `files/architecture/` copy exist. |
| 12 | maps-j-06503 | `agent-coordination/playbooks/coordination-operating-harness.md:125` | preserve-pending-behavioral-proof / blocked | ok |  | Parked with explicit blocked status; reason fits (behavioral Step 5 / target pending). |
| 13 | maps-j-06509 | `agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md:40` | cutover-patch-only / proposed-only | rework | class 1 (not fully fixed) | Sentence reads "decision 0062 in `docs/specs/runner.md`" (wrapped over lines 39-40; locator on the line before the matched token was missed). Locator citation must map to `runner/decisions/h-36d872fbb0e5.md` (decision 0062 heading at line 1716), not the area README. |
| 14 | maps-j-06512 | `agent-coordination/playbooks/prompts/master-coordinator.md:159` | preserve-pending-behavioral-proof / blocked | ok |  | Parked with explicit blocked status; reason fits (behavioral Step 5 / target pending). |
| 15 | maps-j-06519 | `agent-coordination/proposals/dispatch-control-plane-redesign.md:832` | cutover-patch-only / proposed-only | rework | class 1 (not fully fixed) | "`docs/specs/runner.md` sections for Native-First Dispatch Doctrine and executor/capability rename" names sections; Native-First Dispatch Doctrine is decision 0026 at `runner/decisions/h-36d872fbb0e5.md` line 583. Whole-file README patch drops the locator. |
| 16 | maps-j-06524 | `agent-coordination/proposals/dispatch-control-plane-redesign.md:847` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 17 | maps-j-06527 | `agent-coordination/proposals/dispatch-control-plane-redesign.md:857` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 18 | maps-j-06529 | `agent-coordination/proposals/dispatch-control-plane-redesign.md:873` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 19 | maps-j-06535 | `agent-coordination/proposals/dispatch-control-plane-redesign.md:879` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 20 | maps-j-06545 | `agent-coordination/spec.md:17` | cutover-patch-only / proposed-only | ok |  | Patch target/anchor and form verified against committed tree; consumer is live wrapper/navigation. |
| 21 | maps-j-06548 | `agent-coordination/spec.md:100` | cutover-patch-only / proposed-only | ok |  | Patch target/anchor and form verified against committed tree; consumer is live wrapper/navigation. |
| 22 | maps-j-06550 | `agent-coordination/verification/README.md:31` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 23 | maps-j-06557 | `agent-coordination/verification/README.md:38` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 24 | maps-j-06563 | `agent-coordination/verification/README.md:44` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 25 | maps-j-06577 | `architecture-map.md:29` | preserve / preserved | rework | class 6 (not fully fixed) | Wrapper section 1 (line 29, before carriage at line 80): "The legacy full map remains at `docs/architecture-map.md` during migration" is migration-state text; must be a Phase 9 row flip, not a retained-reference preserve. |
| 26 | maps-j-06583 | `architecture-map.md:446` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 27 | maps-j-06593 | `architecture-map.md:653` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 28 | maps-j-06601 | `architecture-map.md:753` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 29 | maps-j-06611 | `claude-plugin/README.md:9` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 30 | maps-j-06619 | `coexistence/spec.md:25` | preserve-pending-target / blocked | ok |  | Parked with explicit blocked status; reason fits (behavioral Step 5 / target pending). |
| 31 | maps-j-06620 | `coexistence/spec.md:43` | cutover-patch-only / proposed-only | ok |  | Patch target/anchor and form verified against committed tree; consumer is live wrapper/navigation. |
| 32 | maps-j-06626 | `component-boundary.md:13` | preserve / preserved | ok |  | Preserve (self/lineage/provenance) correct. |
| 33 | maps-j-06629 | `component-boundary.md:44` | preserve / preserved | rework | class 6 (not fully fixed) | Line 44 sits in wrapper section "2. Current Source During Migration" ("The current detailed source remains ... Until this anchor is fully promoted"). Migration-state table must be a row flip; "No self-link patch" preserve is the self-reference form class 6 forbids. |
| 34 | maps-j-06634 | `component-boundary.md:69` | preserve-pending-target / blocked | rework | successor note loosely matched (class 1/2 not fully fixed) | Parking is right (workflow.md carry pending) but successorNote points to `history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md#2-core-principle`, an unrelated brainstorm matched only by the bare "§2" token. "§2/§4" in the sentence cite decisions 0048/0049, not workflow.md. Successor must be null/unresolved. |
| 35 | maps-j-06638 | `component-boundary.md:70` | cutover-patch-only / proposed-only | ok |  | Patch target/anchor and form verified against committed tree; consumer is live wrapper/navigation. |
| 36 | maps-j-06651 | `component-boundary.md:272` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 37 | maps-j-06654 | `component-boundary.md:273` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 38 | maps-j-06659 | `component-boundary.md:1212` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 39 | maps-j-06666 | `decision-citation-drift/README.md:9` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 40 | maps-j-06668 | `decision-citation-drift/spec.md:17` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 41 | maps-j-06671 | `decision-citation-drift/spec.md:39` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 42 | maps-j-06674 | `decision-citation-drift/spec.md:49` | preserve-pending-behavioral-proof / blocked | ok |  | Parked with explicit blocked status; reason fits (behavioral Step 5 / target pending). |
| 43 | maps-j-06678 | `decision-citation-drift/spec.md:85` | preserve-pending-behavioral-proof / blocked | ok |  | Parked with explicit blocked status; reason fits (behavioral Step 5 / target pending). |
| 44 | maps-j-06679 | `decision-citation-drift/spec.md:92` | preserve-pending-behavioral-proof / blocked | ok |  | Parked with explicit blocked status; reason fits (behavioral Step 5 / target pending). |
| 45 | maps-j-06683 | `decision-citation-drift/spec.md:132` | preserve-pending-target / blocked | rework | class 5 / class 9 (not fully fixed) | Line 131-134 is a dated retirement note ("Retired against the real repo (tsk-1lv-4/review-fix F9) ... was retired for good"): historical text, preserve. Row is instead parked `preserve-pending-target` "No unique exact mapping" although the glob resolves to the existing directory `docs/decisions`. |
| 46 | maps-j-06692 | `documentation/architecture/documentation-system-design.md:17` | preserve / preserved | ok |  | Preserve (self/lineage/provenance) correct. |
| 47 | maps-j-06698 | `documentation/architecture/documentation-system-design.md:165` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 48 | maps-j-06705 | `documentation/history/id-systems-audit.md:22` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 49 | maps-j-06707 | `documentation/history/id-systems-audit.md:27` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 50 | maps-j-06709 | `documentation/history/id-systems-audit.md:43` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 51 | maps-j-06714 | `documentation/history/id-systems-audit.md:68` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 52 | maps-j-06715 | `documentation/history/id-systems-audit.md:118` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 53 | maps-j-06728 | `documentation/history/proposals-redesigns/documentation-system-discussion.md:9` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 54 | maps-j-06731 | `documentation/history/proposals-redesigns/documentation-system-discussion.md:61` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 55 | maps-j-06732 | `documentation/history/proposals-redesigns/documentation-system-discussion.md:64` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 56 | maps-j-06746 | `documentation/history/proposals-redesigns/documentation-system-discussion.md:183` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 57 | maps-j-06769 | `documentation/history/proposals-redesigns/documentation-system-discussion.md:271` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 58 | maps-j-06774 | `documentation/history/proposals-redesigns/documentation-system-discussion.md:352` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 59 | maps-j-06775 | `documentation/history/proposals-redesigns/documentation-system-discussion.md:391` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 60 | maps-j-06791 | `documentation/history/proposals-redesigns/documentation-system-discussion.md:1260` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
