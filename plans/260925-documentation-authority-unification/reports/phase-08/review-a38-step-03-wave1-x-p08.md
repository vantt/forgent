# Review p08: step-03 wave 1 expansion

Pin ae141550c2e022310de7a0efea757580c0b2479f. Read-only worktree forgentX-s8-review. I did not run any checker or probe script. For each file I read the whole source at the pin and every edge in the record (spans, disposition, unitId, target, anchor, timing, reason, categories, witness groups, legacyScan candidates and exclusions, author-added edges) and the diff. I read the target facts that the dispositions rest on. I confirmed at the pin that these exist: `docs/platform/{herdr-web-dashboard,observe}/spec.md`, `packaging-distribution/history/distribution-{baseline,vision}.md`, `docs/platform/governance.md`, `docs/reading-map.md`, `docs/history/setup-runs-registered-fixes/CONTEXT.md`, the retiring `docs/architect/packaging-distribution/{scope-map,workspace-runtime-model}.md`, and all 14 same-directory proposals leaves plus the two other live links in the proposals README.

## Per file

| File | Set | Verdict | Edges reviewed |
|---|---|---|---:|
| docs/platform/herdr-web-dashboard/README.md | batch-021 | ok | 2 |
| docs/platform/host-invocation-routing/README.md | batch-023 | ok | 2 |
| docs/platform/observe/README.md | batch-024 | ok | 2 |
| docs/platform/packaging-distribution/README.md | batch-025 | ok | 14 |
| docs/platform/packaging-distribution/history/documentation-migration/migration-map.md | batch-025 | ok | 26 (24 inventory plus 2 author-added) |
| docs/platform/proposals/README.md | batch-026 | ok | 3 |

No outcome defects in any file.

### herdr-web-dashboard/README.md (06913, 06914)
- 06913 (L9 Provenance) preserves, which is correct.
- 06914 (L17 Related) patches to `docs/platform/herdr-web-dashboard/spec.md`, timing Phase 9. The target exists and is neither the file itself nor already in the Related list (the body links `spec.md`, but the Related list does not). The diff replaces exactly L17. The earlier u04 Q1 concern is resolved by L12-34(4). No legacy references were missed.

### observe/README.md (07196, 07197)
Identical shape to herdr and also correct. 07197 patches to `docs/platform/observe/spec.md`, which exists, and the diff replaces only L17.

### host-invocation-routing/README.md (06959, 06960)
- 06959 (L11 "Promoted from `docs/architect/host-invocation-routing/**`") preserves as provenance. The glob is a pattern and the directory exists. The record-text contradiction u04 flagged is fixed.
- 06960 (L119 "The old documents under [../../architect/host-invocation-routing/]... remain legacy/current sources until redirected or drained") is `phase9-row-flip`, which is correct for a migration-state sentence. The diff is empty.
- The Related header lists only candidate files. The 16 exclusions (vision, roadmap, intent-preservation-ledger) are same-directory candidate files that exist. I found no missed reference: the other links are `../packaging-distribution/README.md`, `../component-boundary.md`, `../../../plans/...`, and local leaves.

### packaging-distribution/README.md (07206 to 07219)
- L11 Source type: 07206, 07207 and 07208 preserve, which is correct.
- Migration-state units flip:
  - L80 (07209), L95 (07210) and L157 (07211) are `phase9-row-flip`.
  - 07212, 07213 and 07214 (L179, L180, L181) share unit `status-bullets-L179` and the same disposition. The earlier u01 defect on 07214 (preserved as history) is fixed.
- Carriage (heading "Retained Readme Source Detail"): 07215 (L208) quotes the framing sentence. 07216 and 07219 (`docs/specs/*`) and 07217 and 07218 (table rows L270 and L273) are carriage, so preserve is correct. L12-34(6) covers the carriage-only holders.
- Coverage: the 14 edges account for every `docs/specs`, `docs/architect`, `docs/distribution-vision.md` occurrence in the file. The 8 legacyScan exclusions (`vision.md`, `README.md` links that resolve into this area) are true. The Related header (L13-23) is all candidate paths. L250 and L258 point at live candidates.
- The README holds no patch edges, so description truth is not in play.

### migration-map.md (07286 to 07309 plus two author-added)
- The file is `Document type: History`, a literal carriage of the old migration map. Every edge is either a source-locator cell in a migration ledger or a dated work-order or checklist line, so preserve is correct throughout.
- The table rows at L90 to L101 and L130 to L134 and L153 each carry one disposition. L132 carries two edges (07302 and 07303, both preserve). L165 carries two edges (07308 and 07309, both preserve).
- 07286 (L25 provenance sentence) preserves. The successor note names the file itself, not the edge's path, so it is valid.
- Author-added edges at L128C86 and L141C13 are bare `runtime-identity-and-activation.md` in carried evidence and work-order text. Preserve is correct.
- The exclusions for L55, L58, L60, L71, L95, L98 and L102 and the other README.md occurrences are right. They are either the frozen Target Area Shape leaves or the retained root README.md.
- Retained roots 07297, 07308 (`docs/reading-map.md`), 07298 (`docs/doc-governance.md`) and 07288 (`docs/distribution-vision.md`) preserve with no deletion claim, which is correct.

### proposals/README.md (07441, 07442, 07443)
- 07441 (L9 Provenance) and 07443 (L24 "Source relationship") preserve. The file header says "Canonical for: Nothing; non-canonical candidate conservation carrier", which is the quoted framing.
- 07442 (L17 Related) is parked as a duplicate: the live holder `docs/platform/proposals/README.md` is the consumer itself. This matches L12-34(4). `blockedCategory` and `dependencyCategory` both equal `phase9-carry`, and the witness group is `carriage`, which is true (2 hits, 0 live).
- The 18 exclusions (L42 to L76) are same-directory candidate leaves that all exist. `../governance.md`, `../documentation/architecture/documentation-system-design.md` and the L56 handoff-prompt link resolve live and are not legacy.

## Record-text notes (not rework)

- Glob successor notes on 07208, 07216 and 07219 name the retiring root itself: `docs/architect/packaging-distribution` and `docs/specs`. The same rule applies to 07219's `docs/specs/*`. L12-34(8) says a successor note cannot name the edge's own path. The correct wording is "no single successor; pattern" or a live holder (`docs/platform/packaging-distribution/`). The outcome does not change.
- 07208's reason opens with "source path absent at author pin" and ends "Committed root ... exists". The first clause should say that the glob is a pattern and the directory exists.
- 07293 (`workspace-runtime-model.md`, a redirect pointer) names `packaging-distribution/spec.md` as successor. The row's own Target says "Redirect/status note only", so the note is loose. 07292 (`scope-map.md`) has a similar situation: README or `history/scope-map.md`.

## Lead-judgment question

In the packaging-distribution README carriage, L250 and L258 (Historical Read Order) point at live candidates. L270 and L273 (Historical Supersession Table) keep `../../architect/...`. The L208 sentence says "Relative links retain their destination", but L250 and L258 are already rebased. I accept preserve for 07217 and 07218 as authored (carriage framing is quoted and a successor note is present). If the Lead wants carriage links consistent, 07217 and 07218 would instead be patch-to-live (workspace-topology and `history/distribution-baseline.md`). That is a ruling, not a defect.

## Per-set counts

| Set | Reviewed | Rework |
|---|---:|---:|
| batch-021 | 1 | 0 |
| batch-023 | 1 | 0 |
| batch-024 | 1 | 0 |
| batch-025 | 2 | 0 |
| batch-026 | 1 | 0 |
| Total | 6 files / 49 edges | 0 |
