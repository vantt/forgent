# Step 3 wave 1 review, part p03

Author pin `ae141550c2e022310de7a0efea757580c0b2479f`, read-only worktree `forgentX-s8-review` at `8ab390227`. Checker, probes and fgos CLI were not run. Source, targets and candidate files were read with `git show` at the pin. Elapsed time was not instrumented (estimate about 30 minutes).

| File | Set / record | Record digest | Diff sha256 (prefix) | Edges reviewed | Verdict |
|---|---|---|---|---|---|
| `docs/architect/roadmap.md` | batch-009:1 | 198ff048a43ae55a | 36eb4bba75a7446c | 11 (5 inventory + 6 added) | rework |
| `docs/platform/agent-coordination/README.md` | batch-015:1 | a0a5aa8e1899e97e | ebd9e2fbc3103b6d | 3 | rework |
| `docs/architecture-map.md` | batch-033:2 | d70414923eaeaf0d | empty diff | 40 (39 + 1 added) | rework (L372) + Lead ruling on framing |

Per-set counts: batch-009 reviewed 1, rework 1. batch-015 reviewed 1, rework 1. batch-033 reviewed 1, rework 1 (conditional, see file 3). Each is above 3%, so each set expands to every file in it. batch-009 has one file, so nothing expands. batch-015 has 22 files and batch-033 has 2 (the second is `docs/README.md`).

## 1. `docs/architect/roadmap.md` (batch-009) - rework

Whole source (292 lines) read. All 11 edges and the 2-hunk diff reviewed.

What is correct:
- 01225 (L7), 01227 (L162), 01228 (L252): the `docs/architect/` parks as description-rewrite are right. Each is a live "canonical for / write under docs/architect/" statement, so a prefix substitution would leave a false rule. Witness category partial-holder is true.
- 01226 (L132) and 01229 (L254): the `docs/specs/*` parks as description-rewrite are consistent. The cells describe the legacy tree's role ("regenerated docs/specs/*", "generated/curated state"), not an illustrative glob.
- L31C25, L31C50, L31C83 and L123C99 (workspace-topology*.md): the parks as phase9-carry are right. The only candidate, `docs/platform/system-architecture/architecture/workspace-topology*.md`, says "Canonical for: Nothing until promotion; current source remains docs/architect/...". I found no other holder under `docs/platform` or `docs/knowledge`. This matches batch-010's treatment of the same files.
- L128C104 and L214C5: the patches to `../platform/packaging-distribution/architecture/runtime-identity-and-activation.md` are right.
  - The target is a promoted live doc ("Source type: Promoted from docs/architect/packaging-distribution/runtime-identity-and-activation.md").
  - The target covers the descriptions in the adjacent row: release store (§2), workspace activation (§4), pin, projection ledger, drift/rollback/quarantine (record-types section) and identity reporting.
  - The whole-file anchor is justified, since this is a pointer to the doc.
  - `../platform/...` resolves correctly from `docs/architect/`.

Outcome defect (missed legacy references; A51 "every missed legacy reference"):
- Source lines 29-35 (the `Primary Docs` column of the stream table) cite 10 retiring `docs/architect/` files or directories by path relative to `docs/architect/`.
- None has an edge or a contextual exclusion. The census did not extract backticked relative paths. `scan_candidates` misses them because its bare-name pattern excludes names preceded by `/` and its partial forms only match `specs/` or `architect/` prefixes.
- Missed occurrences, all existing at the pin:
  - L29: `agent-coordination/`, `agent-coordination/contracts/`, `proposals/step-09-group-thinking-substrate.md`
  - L30: `proposals/step-10-coding-domain-adoption.md`, `domainization/`
  - L32: `component-boundary/`, `proposals/component-authority-boundary-map.md`
  - L33: `host-invocation-routing/`
  - L34: `host-invocation-routing/node-to-rust-component-migration.md`, `host-invocation-routing/rust-cli-and-proof-components-plan.md`
  - L35: `packaging-distribution/`
- Required correction: add an authorAddedEdge for each of these (about 13 spans) with a disposition.
  - File refs should resolve to the exact candidate. `node-to-rust-component-migration.md` is promoted to `docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md`. The `proposals/*.md` files have copies under `docs/platform/proposals/`, which are carriage and so park as phase9-carry.
  - Directory refs follow the bare-area-pointer rule (candidate `spec.md` or README).
  - The L31 row keeps one shared disposition: the three workspace-topology parks are already phase9-carry.
- Not defects: `fgctl-and-local-fgos-contract.md` (L129, L225), `project-runtime-adapter-protocol.md` and `workshop-materialization.md` are proposed future docs, never in the tree. The `ADR-010` locators are not path tokens.

Record-text notes: none.

Lead-judgment question: do backtick-relative sibling paths inside the retiring trees (`proposals/x.md`, `host-invocation-routing/x.md`, `dir/`) count as legacy references in scope? I read A51 and L12-32(4) as yes ("every missed legacy reference"). If the answer is no, the file is ok. The same scanner gap probably affects other `docs/architect/**` files.

## 2. `docs/platform/agent-coordination/README.md` (batch-015) - rework

Whole source (72 lines), the 3 edges and the 1-hunk diff reviewed. All relative links in the file resolve at the pin. The L65 `vision.md` exclusion is correct (`docs/platform/agent-coordination/vision.md` exists).

What is correct:
- 05130 (L33): the patch is right.
  - It points to decision 0062 in `docs/platform/runner/decisions/h-36d872fbb0e5.md` (`### 0062 - Xoá cửa thô; dispatch là tầng thấp ...`, line 1716). Decision-record candidates are live targets, and the anchor is the decision's own heading.
  - The adjacent description matches the target: date 2026-10-14, the removed doors (`dispatch execute` in all forms, `dispatch log`, `fanout-batch`), and the `fgos run` / `fgos workflow start` replacement.
- 05131 (L62): `verification/README.md` is a current path outside the retiring trees. Preserve is right.

Outcome defect:
- **05129 (L16, Related header, `docs/specs/runner.md`)**: preserved as "Related-header lineage / imported source". This is wrong for a live Area Portal ("Document type: Area Portal").
  - Rule L12-26(8) (owner-answers): `Related:` lists outside a snapshot are live navigation and patch, unless the target is the consumer itself or already an entry of the same list. `docs/specs/runner.md` is neither.
  - It is not the portal's own predecessor either. The accepted lineage examples (01904, 07953) are the doc's own predecessor path.
  - `docs/specs/runner.md` is deleted at Phase 9, which would leave a dead link in a live portal header. The same portal already names `../runner/spec.md` as the current execution contract (L31).
  - Required correction: change to patch, target `docs/platform/runner/spec.md` (whole-file bare area pointer, L12-30(7)), timing Phase 9, plus a diff hunk. The sibling record batch-004 maps-j-00034 patches the same header line, but to `runner/decisions/h-36d872fbb0e5.md`, so Lead should align the two targets.
  - The carriage copies under `history/retired-engine/**` correctly preserve their own Related and "Superseded by" lines, because those files are history. Only this live portal is affected.

Lead-judgment question: if Lead rules that `Related:` entries in a portal's header record import lineage, then 05129 stays preserve and the file is ok. The preserve reason text is generic and does not justify it for a cross-area spec.

## 3. `docs/architecture-map.md` (batch-033) - rework (L372) and Lead ruling on the framing

The 763-line source was read in full. All 40 edges were checked against actual passage role, and the `descriptionTruth`/diff are empty (no patches).

Header (L3-13): "Legacy status: Promoted source / Promoted to docs/platform/architecture-map.md / Use this legacy file for: Full historical architecture-map detail during migration / Do not use ... for the target documentation entry path". It was added on 2026-09-15 (commit 23fb220e3).

### Framing validation against all units

The framing holds for these units, which are provenance, dated changelog, version lineage or retired decision history regardless of the header. Preserve is right.
- L16-22: the version-lineage links 01237-01241.
- L43, L57, L70: the changelog links 01242-01244 (removed at `4722361ae`, verified as deletions without same-commit renames).
- L41 and L74: dated changelog entries.
- L567: the removed records 0004 and 0017 (the `0017-...md` ellipsis path never existed). Preserve is acceptable.
- L585 and L587: the carried-history section heading and sentence ("di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4)").
- L599, L607, L622, L638, L667, L688, L703, L717, L732, L733, L745, L751: inside the carried 0010/0015/0017 decision narratives.
- Retained existing paths that preserve regardless of framing: L74/L549/L638/L688/L717 `docs/id-systems-audit.md`, L306/L459 `docs/architecture-manifest.json`, L363 `docs/io-contract.md`, L368 `docs/routing-handoff-contract.md`, L525 `docs/backlog.md`, L523/L599/L607/L717/L732 self references.

The framing is not supported by the file's own plan context for the units below.
- Evidence: `current-authority-map-2026-09-25.md:70` classes the root as "legacy-current / maintained-authority".
- The candidate `docs/platform/architecture-map.md` §5 says the root "is still the full legacy map. Do not delete or rewrite it wholesale ...".
- `phase-09-atomic-platform-authority-cutover.md:51` and `phase-08...md:147` name "A45 legacy CTR010 lines in `docs/architecture-map.md`" as a cutover seam that changes in the Phase 9 packet.
- The alias table is empty, so the root path is retained.

### Outcome defect

- **01250 (L372, CTR010 row, `docs/specs/confinement-authority.md`)**: preserved as "retired history/lineage".
  - This is the A45 seam that Phase 8/9 say changes at cutover. In the candidate registry CTR010 is the Gateway and `confinement-authority.v1` is CTR011.
  - The "Định nghĩa ở" cell names a spec deleted at Phase 9.
  - A blanket history preserve contradicts the plan, and nothing in the record carries the seam.
  - Required correction: park as description-rewrite (the row's contract id and defined-in cell must be rewritten from the target registry, or patched to `docs/platform/agent-confinement/contracts/confinement-authority-v1.md` together with the id change), timing Phase 9 / A45.

### Coverage and record-text corrections

- **L41 `reading-map.md`** is excluded as "retained docs/reading-map.md", but the sentence names the same set as the added `system-overview.md` edge (L41C27, kept as `docs/specs/system-overview.md`), and §12 (L529) says the reading map is `docs/specs/reading-map.md`. Add an authorAddedEdge preserve, retiring-tree state, for `docs/specs/reading-map.md`.
- **L735 `reading-map.md`** (decision 0017 text) is the same case: L733 names `docs/specs/reading-map.md`, and the description ("no `##` sections, one bullet per line") fits the `docs/specs` file. Add an edge. Outcome is preserve either way, but these retiring-tree citations must reach the Phase 9 baseline.
- **Record-text notes**: 01237-01244 (and 01258, 01266) lack the non-executable D-ADR narrative-holder note required by L12-31(4) where one exists. Holders: 0010, 0015 and 0017 are in this file's own `## Lịch sử quyết định retired` section (`### 0010`, `### 0015`, `### 0017`). 0012 and 0013 are at `docs/platform/work-state/decisions/retired-decision-history.md` (anchors `#8-adr-0012-...` and `#9-adr-0013-...`).
- **01259**: say that `0017-...md` abbreviates the removed 0017 record (removed at `4722361ae`), not just "never existed".

### Lead-judgment questions (framing)

1. Is the root map frozen history from now, or a live maintained file until Phase 9? If frozen, 01250 stays preserve plus an A45 note. If live, the live-voice units below must be parked as description-rewrite under L12-26(6) ("sentences about how the legacy tree is organised are parked").
2. Live-voice units that depend on that ruling:
   - 01246 (L225, "`docs/specs/` KHÔNG nằm trong Kernel").
   - 01252 and 01256/01264 (L522 and L529/L622: §12 table "Sở hữu" cells and "đường đọc chuẩn: `docs/specs/reading-map.md`").
   - Each currently preserves under the whole-file header.
   - Each is a present-tense statement about the retiring `docs/specs` tree, so it will be false after Phase 9 unless the file is history.
   - I did not mark these as defects on their own.

## Per-set summary

| Set | Selected | Reviewed | Rework (outcome) | Rework (record-text only) |
|---|---:|---:|---:|---:|
| batch-009 | 1 | 1 | 1 (13 missed-reference edges; Lead scope ruling) | 0 |
| batch-015 | 1 | 1 | 1 (05129) | 0 |
| batch-033 | 1 | 1 | 1 (01250; L41/L735 coverage) | notes above |

Required corrections are marked "outcome" only where the Phase 9 result would differ. No rule was invented: the scanner gap for backtick-relative sibling paths and the live-versus-frozen status of the root map are routed to Lead above.

Status: DONE_WITH_CONCERNS
