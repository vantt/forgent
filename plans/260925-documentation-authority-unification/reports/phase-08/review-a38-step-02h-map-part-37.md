# review-a38-step-02h-map-part-37

- Reviewer: reviewer:sonnet-session:a3eb64b43c5583184@2026-10-19
- Commits: reviewed tree `b3d2c2ebd4be66848520e3f3f797c6219a610dee` (accounting), author `6c415d7ce`; input source commit `f5033e20a`
- Part: 37 (mechanical-target-failures), 19 entries; rules applied: A50, L12-7, L12-10, L12-19..L12-24
- Method: every entry resolved from `step-02h-census-maps-portals-prose.json` via the index's id list; source block read at the committed tree; target existence/anchors checked with `git ls-tree`/`git cat-file`.

| Entry | Source | Verdict | Rationale |
|---|---|---|---|
| maps-h-00240 | ADR-008 L47 `canonical-concepts.md#coordinationsession` | ok | Anchor failure real: new `docs/platform/agent-coordination/vocabulary/canonical-concepts.md` has no CoordinationSession heading (old file has `### CoordinationSession` L141). Parked preserve-pending-target for Step 3 is right. |
| maps-h-00419 | intent-preservation-ledger L102 `vision.md#v-009-...` | ok | Anchor failure real: new vision.md has no V-009 heading (old L235 has it; new only mentions V-003/V-009 as historical L337). Parked, right. |
| maps-h-00457 | harness playbook L121 `verification/<track>/` (Create: layout) | ok | Real writer (`Create:` trace layout). `<track>` placeholder makes missing-target a real placeholder artifact; Step 5 destination+checks together, no executable new. Right. |
| maps-h-00459 | harness playbook L413 `proofs/<cell-id>/` | ok | Real writer (proof artifact path convention). Same treatment, right. |
| maps-h-00492 | master-coordinator prompt L158 `<REPO_ROOT>/.../<TRACK>/` (PERSISTENT STATE) | ok | Real writer (persistent state path). Right. |
| maps-h-00585 | step-08 proposal L939 `canonical-concepts.md#sessionactor` | ok | Anchor failure real (new file mentions SessionActor only in prose, no heading). Parked, right. |
| maps-h-00697 | deprecated-and-reserved L24 `canonical-concepts.md#sessionactor` | ok | Anchor failure real. Parked, right. |
| maps-h-00799 | documentation-system-discussion L50 `docs/ui-spec/generated/*` | ok | Glob token, not a path, hence missing-target; docs/ui-spec and docs/ui-spec/generated exist and are not retiring (L12-24 fix 5). Preserve right. |
| maps-h-00801 | same file L57 `ui-spec-tools/build.mjs writes docs/ui-spec/generated/*` | ok | Describes a generator writing into non-retiring tree; preserve right. |
| maps-h-00807 | same file L160 table cell `docs/ui-spec/generated/*` | ok | Preserve right. |
| maps-h-01645 | docs/generated/README L31 `docs/ui-spec/generated/**` | ok | Glob; non-retiring; preserve right. |
| maps-h-01646 | how-to author-a-plan-loop-track L151 `verification/<track>/<cell>.md` (checkpoint record destination) | ok | Real writer instruction ("Record it in the cell trace"). Step 5, right. |
| maps-h-01647 | same file L195 (Lead records mechanical-trigger determination in cell trace) | ok | Real writer instruction. Right. |
| maps-h-01648 | same file L249 (cell trace format) | ok | Real writer instruction/format. Right. |
| maps-h-03892 | carriage copy of discussion L74 `docs/ui-spec/generated/*` | ok | Explicit current-file carriage region plus non-retiring tree; preserve right. |
| maps-h-03894 | carriage copy L81 | ok | Right. |
| maps-h-03900 | carriage copy L184 | ok | Right. |
| maps-h-04018 | candidate switchboard L66 `docs/ui-spec/**` (UI specification row) | ok | Glob over non-retiring tree; preserve right. Twin row in transitional-switchboard (05378) is a Phase 9 row flip; both are non-patching, so the difference is rationale only. |
| maps-h-05378 | transitional-switchboard L67 `docs/ui-spec/**` | ok | Migration-state row, whole-row flip per L12-21; no path substitution. Right. |

## Totals

- Entries 19: ok 19, rework 0, needs-Lead-judgment 0.
- Mechanical failures confirmed real: 4 anchor failures (00240, 00419, 00585, 00697); the rest are placeholder (`<track>`, `<TRACK>`, `<cell>`) or glob tokens, correctly parked or preserved.
- Writers 00457/00459/00492/01646-01648 verified as real writers in the source blocks and carry destination and checks together to Step 5.
- Defect classes: none.
