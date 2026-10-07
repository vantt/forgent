# Consumer survey for Phase 8 (read-only, measured 2026-10-07)

Scratch only. Nothing was written in the repository. Data file: `consumer-survey.json` (same directory). Numbers marked UNPROVEN were not measured.

## 1. Headline

- Inventory: commit `57f3e7fe7af86adee1e805925cca82cf7a894164` (branch `plan/260925-documentation-authority-unification`), regenerated into scratch: 4,318 files, 87,153 claim rows, **118,377 consumer edges**, of which 80,406 are `glob` pattern matches and 6,474 are unresolved dynamic patterns with no target.
- **What a Phase 8 executor really has to touch (core set = targets under `docs/specs/`, `docs/architect/`, `docs/ui-spec/` plus `docs/io-contract.md`): 275 consumer files and 1,347 reference edges**, after removing history and aliased-only consumers, legacy roots themselves, evidence payloads, the ratchet baseline data and glob matches. Adding ten other root authorities (provisional list in section 2) gives 300 files and 1,564 edges.
- The figure in the retirement dry run (`consumers-rewritten`, 3,853 on 2026-10-06) reproduces as **3,908** on this commit. It is an upper bound that counts glob matches (997), edges from the byte-identical evidence payload copy (538) and the ratchet's own baseline and exceptions data (1,018). Section 3 gives the chain.
- Ownership of the work, by group (reference edges to the core set, files in brackets): generated renders 35 (19) and skill sources 18 (10) go with one source edit plus `npm run build:skills`; always-loaded 8 (1); source and runtime code 48 (31), of which 49 of 50 reference edges (all targets) are comments; tests and fixtures 215 (35); platform documents (candidate and promoted) 754 (86); end-user docs 160 (66); other docs 96 (20); gate scripts 1,026 (6) of which 1,020 are ratchet data.
- **Not visible to the inventory** (section 7): three real-file readers in tests, one script default directory, CLI help strings, wrapped comment paths, `path.join('docs','specs')` constructions, `docs/ui-spec` tooling, work-item records naming retiring paths (12 live items in the committed snapshot), and the gitignored `.claude/rules/**`.
- Main risk for Phase 8: any edit to a legacy-root document after Phase 6 stales that document's reviewed decision rows (plan `7.5b`, Phase 6 stop condition 6). The lease spec entry and any CLI help change must be planned around that.

## 2. Method

All counts by node scripts over the loaded inventory (`loadInventory` from `scripts/check-doc-inventory-gates.mjs`), never `grep | wc`. Scripts are in the scratch directory (`survey.mjs`, `final.mjs`, `perfile.mjs`, `linekind.mjs`, `reconcile.mjs`, `chain.mjs`, `crosscheck.mjs`, `targets.mjs`).

1. Regenerated the inventory from the committed tree (`git` object store, not the working tree, so another session's uncommitted files cannot leak in): `node scripts/generate-doc-inventory.mjs --refresh --commit 57f3e7fe7... --identity-registry <scratch copy> --json-out <scratch> --md-out <scratch>` (exit 0, 18.3 s; "bound; no carry-forward needed"). `git status` of the plan worktree was unchanged by it.
2. Target classes: `specs` (`docs/specs/**`), `architect`, `ui-spec`, `io-contract`, plus a provisional root-authority set: `platform-foundations`, `routing-handoff-contract`, `architecture-map`, `coexistence`, `doc-governance`, `operator-runbook-herdr-cockpit`, `distribution-vision`, `work-item-lifecycle-vision`, `id-systems-audit`, `transitional-switchboard` (all `docs/*.md`). The set is provisional: the final retiring-root list comes from the Phase 6 area maps (`ledger/area-map-*.md`, do not exist yet). `docs/reading-map.md` is excluded: the constitution freeze decision keeps it at its place (plan `7.5b`).
3. Consumer groups by path prefix (section 4). Edge kinds: **reference** = every kind except `glob` (`literal`, `executable-proof`, `fixture`, `shipped-contract`, `dynamic` with a resolved target); `glob` edges are a consumer line naming a pattern (`docs/**`, `docs/specs/*.md`) that merely matches a legacy file: no literal text exists to rewrite. One glob line can create hundreds of edges (a single log line in an evidence payload creates 612).
4. Line kind (comment, code literal, markdown link, code span, data literal) by reading the consumer line at the inventory commit (`git show <commit>:<path>`), heuristics by file extension; approximate.
5. Independent cross-check: a text scan with a wider regex (adds relative `../specs/`, `specs/<x>.md`, `path.join('docs','specs')` segments) over the 2,950 tracked non-history, non-legacy text files <= 4 MB found 187 files with hits; 80 of them have no edge in the inventory. They are not all misses (see section 7).
6. Plans A, B, C: read in the main checkout (`/home/vantt/projects/forgentX`, read only) at `7e36897c0`.

## 3. Reconciliation with the earlier figures

| Figure | Where | Definition | Reproduced here |
|---|---|---|---:|
| 3,853 | `phase-04` execution record, retirement dry run 2026-10-06 | target under `docs/specs/` or `docs/architect/`; consumer not under those roots and not under `docs/history/`, `archive/`, `plans/`, `.fgos/`; all edge kinds | **3,908** (+55; the inventory commit differs, cause of the 55 not isolated, UNPROVEN) |
| 5,382 | `phase-06-planning-261007.md` section 3 table, "inbound edges" | target in the 1,040 legacy files; consumer outside history and outside the legacy roots; grouped by batch | not reproduced. Closest definitions: 5,059 (history incl. `CHANGELOG.md` excluded) and 5,114 (`CHANGELOG.md` counted). Difference 323 or 268, cause UNPROVEN (the planning table's own grouping was not available) |

Chain from the dry-run figure to the working set (this commit, definition of the first row, script `chain.mjs`):

| Step | Edges |
|---|---:|
| Dry-run definition | 3,908 |
| minus glob pattern matches | 2,911 |
| minus consumers that are evidence payloads under `docs/platform/**/verification/<collection>/**` (byte-identical copy of the legacy payloads; digest contract, never rewritten) | 2,373 |
| minus `scripts/check-legacy-docs-ratchet.baseline.json` and `.exceptions.json` (data of the gate that retires) | 1,355 |
| Group-based set of this survey (core set, adds `io-contract` and `ui-spec` targets, groups `CHANGELOG.md` with history) | 1,347 (= 1,355 - 28 CHANGELOG + about 20 io-contract/ui-spec; the +20 is the remainder, not separately measured) |

Consequence for the retirement check: `consumers-rewritten` can never reach 0 by rewriting alone. It needs an exemption mechanism (manifest) for tool data, provenance text and fixtures, or it must count only the reference set. Phase 8 must change that evaluator (tests first).

## 4. Groups

Counts are reference edges and distinct files with at least one reference edge to the **core set**. `All` = reference plus glob edges. Root = reference edges to the provisional root-authority set. Source of numbers: `consumer-survey.json` field `measured`.

| Group | Members | Files (ref) | Ref edges | Glob | Root ref |
|---|---|---:|---:|---:|---:|
| A Always-loaded | `AGENTS.md`, `core/instructions/platform-laws.md` (source of the generated block in `AGENTS.md`), `CLAUDE.md`, `.claude/rules/**` | 1 | 8 | 2 | 28 |
| B1 Skill sources | `core/skills/**`, `domains/*/skills/**` | 10 | 18 | 14 | 3 |
| B2 Other core | `core/task-specs`, `prompt-templates`, `coordination-protocols`, `agents`, `workflows` | 2 | 3 | 0 | 0 |
| C Generated renders | `.agents/skills/**`, `plugins/fgOS/skills/**`, `.claude/skills/<fgos-*>` | 19 | 35 | 28 | 8 |
| D1 Doc-migration gates | ratchet script, baseline, exceptions; `check-doc-*`, generators, `verify-phase-*`, `knowledge-migration` | 6 | 1,026 | 0 | 16 |
| D2 Other scripts | `check-decision-citation-drift.{mjs,baseline.json}`, two more | 1 | 2 | 16 | 2 |
| E Tests, fixtures | `test/**`, `dogfood-fixture/**` | 35 | 215 | 119 | 13 |
| F Source, runtime | `src/**`, `bin/**`, `apps/**`, `packages/**`, `.github/**` | 31 | 48 | 4 | 2 |
| G1a Platform evidence payloads | `docs/platform/**/verification/<collection>/**` | 128 | 539 | 175 | 17 |
| G1b Platform documents | `docs/platform/**` outside payloads | 86 | 754 | 416 | 78 |
| G2 End-user docs | `docs/knowledge`, `how-to`, `explanation`, `reference`, `tutorials` | 66 | 160 | 90 | 15 |
| G3 Other docs | root `docs/*.md`, generated indexes, templates, contracts, distillery | 20 | 96 | 147 | 53 |
| H1 Immutable history | `archive/`, `.fgos/`, `CHANGELOG.md`, `docs/history/`, `docs/journals/` | 447 | 2,008 | 1,083 | 307 |
| H2 Plans, reports | `plans/**` | 300 | 3,326 | 1,193 | 256 |
| self | `docs/specs/**`, `docs/architect/**`, `docs/ui-spec/**` as consumers | 231 | 1,257 | 552 | 86 |

Actionable total (A, B, C, D, E, F, G1b, G2, G3): 277 files by group sum (275 as a union), 2,365 reference edges, of which 1,018 to 1,020 are ratchet data, leaving 1,347.

### 4.1 Per group: method, shipped, overlap, timing

| Group | Rewrite method | Shipped contract (mission 1/2)? | Overlap with Plans A/B/C | Wait for cutover? |
|---|---|---|---|---|
| A | Edit `AGENTS.md` hand-written lines (about 21 hand-written lines (plus 10 lines in the generated block) name `docs/platform-foundations.md`, `docs/specs/system-overview.md`, `docs/specs/reading-map.md`, `docs/routing-handoff-contract.md`, `docs/specs/<area>.md`, `docs/specs/runner.md`, `docs/specs/platform-foundations.md`, `docs/distribution-vision.md`, `docs/specs/distribution.md`, `docs/backlog.md`, `docs/decisions/`); edit `core/instructions/platform-laws.md` and regenerate the `fgos:instruction-projection` block (exact command UNPROVEN: read `src/setup/instruction-projections.mjs`). Never hand-edit the generated blocks. `docs/reading-map.md` stays, `docs/specs/reading-map.md` retires: AGENTS.md repoints to the former | The projected block ships into consumer-project AGENTS.md files (text names repository-local paths that do not exist there: already dead, no regression). `AGENTS.md` itself is repository-local | Plan A phase 06 done (on main); Plan B phase 06 writes `AGENTS.md` next (pending, not authorized); Plan C phase 05 (draft) | **Yes**, and after Plan B per plan 7.5. Prepare text and owner-review it early |
| B1 | Edit the source, `npm run build:skills` | Yes (`package.json` `files`: `core`, `domains`); all hits are `repository-local-contract` in the shipped-path inventory, so consumer-project path contracts do not change | Plan A phase 02 (done) added the generated header | Apply at cutover |
| B2 | Edit the source | Yes (`core`) | none known | At cutover |
| C | Regenerate. `plugins/fgOS/skills` copies carry a relative link that resolves to `plugins/docs/...` (already dead); no hand edit | Yes (`.agents` in `files`; plugin channel) | Plan A phase 02/04 (render header, doctor drift check) | At cutover, in the same change as B1 |
| D1 | 1,020 of 1,026 reference edges are ratchet baseline and exceptions data: exempt (tool data) or retire with the ratchet; 6 code literals/comments | scripts ship in the package but these gates are repository tools | none | Owner decides which gates survive (Q8-4); apply at cutover |
| D2 | `scripts/check-decision-citation-drift.mjs:428` default scan directory is `docs/specs`; behavior reader | repository tool, shipped | none | Change with the doc move, with a test run |
| E | 136 edges in 9 gate-tool tests use legacy paths as synthetic data (exempt); 43 are recorded run fixtures (never rewrite); 3 tests read real legacy files and must move with the docs (section 6) | no | none | At cutover, same commit as the doc move |
| F | 49 of 50 non-glob edges (all targets) are comments; one code literal; CLI help strings (section 6) | Yes: `bin`, `src` ship; help strings are user-visible text | Plan A phase 04/05 and Plan B phase 02-05 touch `src/setup/registrations.mjs`, `.githooks/pre-commit`, `src/cli/command-registry.mjs` | Comments and help at cutover |
| G1a | Never rewritten. Digest contract; legacy-path text inside is covered by the alias table. Legacy copy is deleted at cutover step 6 after the evidence verifier passes | no | none | Verifier prepared in Phase 8; deletion at cutover |
| G1b | Phase 6 Step 10 repoints candidate-to-candidate links. What remains is provenance (history, ledger, verification documents name legacy paths on purpose: 344 edges in 10 `history/**` files, 71 in 3 ledgers, 61 in 9 verification files) and live-document links (portals 70, other 132, contracts 36, architecture 40, playbooks 40). Provenance: exempt or alias-only. Live links: rewrite | no | Phase 6 rewrites most of this group. Plan B edits `component-boundary.md` and adds `convention/` | **Re-measure after Phase 6 closes** (numbers here are the pre-Phase-6 state). The three promoted portals change only at cutover |
| G2 | Edit the document. How-to and explanation ship in the package. Knowledge documents are registry-managed (writer gating): use the registry door or a reviewed exception, UNPROVEN how | how-to (12 files, 29 reference edges, all targets) and explanation (16 files, 33) ship; knowledge (50 files, 112) does not | none | At cutover |
| G3 | Generated files (`docs/decisions/index.md`, `docs/backlog.md`, `docs/doc-registry.*`, `docs/enduser-docs-index.json`) regenerate; hand-written root docs edit; `docs/distillery/**` needs a class (history-like) | `docs/enduser-docs-index.json` ships | Plan B writes reading-map and system-overview lines; advisory plan writes reading-map | Depends on the Phase 6 retiring-root list |
| H1, H2 | Alias only, never rewritten (Phase 9 step 7) | no | none | At cutover |

### 4.2 Top targets by non-history, non-payload reference edges

`docs/specs/runner.md` 269 edges (80 files; 136 from tests), `docs/specs/work-state.md` 89, `docs/platform-foundations.md` 60, `docs/specs/distribution.md` 48, `docs/architect/host-invocation-routing/host-invocation-provider-routing.md` 41, `docs/specs/platform-foundations.md` 39, `docs/doc-governance.md` 36, `docs/specs/reading-map.md` 31. 1,012 distinct target files. Full list: `consumer-survey.json` `topTargets`.

## 5. The 47-edge judgment queue and the other queues

`reports/phase-05/pilot-b-link-judgment-queue.json`: 47 edges in 33 consumer files, targets `docs/specs/work-state.md` (44) and `docs/io-contract.md` (3). By consumer: `docs/knowledge/**` 13 (two are line citations like `work-state.md:1045`), `docs/specs/**` 9, `docs/explanation/**` 5, `test/**` 6 and 2 scripts and 1 fixture scenario (path literals coupled to a proof), `docs/architect/**` 3, `docs/contracts/**` 3, other 6. It is the work-state pilot only. Phase 6 Step 10 item 2b requires "link queues complete for all sources", so the Phase 8 queue is the union of all per-source queues of Phase 6; its size is UNPROVEN. No committed script produces the Phase 5 link preview (`git ls-files scripts` contains none; the preview in `reports/phase-05/pilot-b-link-rewrite-preview.md` was generated by an uncommitted script). Phase 8 therefore needs its own committed tool (Phase 8 draft, Step 1) unless Phase 6 delivers one under another name.

## 6. Behavioral readers ("bypasses"): code that reads a legacy path as a directory or file, not as prose

| Where | What it does | After the cutover | Method |
|---|---|---|---|
| `test/docs/rul11-anchor-phrase.test.mjs:17,31,36` | reads `docs/specs/platform-foundations.md`, asserts a `RUL11` line equals the locked wording | `ENOENT` fails the test | repoint to the single owner of the law text (three `platform-foundations.md` exist: `docs/`, `docs/specs/`, `docs/platform/`); decide which |
| `test/docs/decisions-corpus-retired.test.mjs` | asserts the retired ADR narratives live in `docs/specs/<area>.md` sections named "Lịch sử quyết định retired từ docs/decisions/" | fails | rewrite against the new area decision documents; a content-coupled test |
| `test/runner/dead-vocabulary-guard.test.mjs:54-56,536` | walks `docs/specs`, `docs/architect/agent-coordination/contracts` (and the platform contracts) | missing directories (behavior of `collectFiles` on ENOENT not read, UNPROVEN) | change the roots to `docs/platform/**` |
| `scripts/check-decision-citation-drift.mjs:428` | default `--specs-dir docs/specs`; sweeps `docs/**` | scans nothing | change default; baseline JSON keyed on text, re-measure |
| `src/cli/command-registry.mjs:473,1411` and `bin/fgos.mjs` help text | CLI help strings naming `docs/specs/<area>.md` (`decision --scope`) and `docs/specs/distribution.md` (`doctor`) | shipped user-visible text, dead in consumer projects already | reword; `fgos` help changes are visible, so a `CHANGELOG.md` `[Unreleased]` line (AGENTS.md install gate) |
| `.claude/skills/ui-spec/tools/config.mjs`, `verify-runtime.mjs`, `SKILL.md` (tracked, hand-authored, 8 mentions) | the ui-spec compiler finds `spec.config.yaml` under `docs/ui-spec` and its docs say to run from `docs/ui-spec/tools/` (that directory has 0 tracked files) | breaks if Phase 6 Step 8 moves `docs/ui-spec/**` | decide the area home first; `docs/ui-spec` holds `spec.config.yaml`, `schema/`, `generated/` files that tools read, so it is a toolchain, not only prose |
| `src/setup/instruction-registry.mjs:458` | reads `docs/architecture-manifest.json` (root file) | breaks only if the file moves | depends on the Phase 6 maps (it is "named explicitly by the maps") |
| `scripts/check-legacy-docs-ratchet.mjs:20`, `scripts/check-doc-retirement.mjs:44` | `DEFAULT_ROOTS` and `LEGACY_ROOTS` constants | the ratchet fails on deleted baselined files (`unexpected-deletion`) | retire or rebaseline in the cutover change (evidence policy decision 3) |
| `test/state/decision-relation.test.mjs`, `test/state/retrospective-doors.test.mjs`, `test/scripts/generate-doc-inventory.test.mjs`, `test/scripts/check-decision-citation-drift.test.mjs` | create `docs/specs/...` inside temporary repositories | no effect | exempt (synthetic) |

## 7. What the inventory does not see (blind spots, measured by the cross-check)

- Paths wrapped over two comment lines (`// ... docs/architect/knowledge-registry-` then `redesign.md`): `src/report/knowledge-resolver.mjs:18`, `apps/fgos-gateway/web/src/lib/network.ts:1` and similar.
- Directory-only mentions and path construction (`path.join(repoRoot, 'docs', 'specs')`, `'docs', 'architect'`): the tests above.
- Directory references without a file (`docs/ui-spec/` in `.claude/skills/ui-spec/**`).
- Hand-authored tracked skills under `.claude/skills/` (not generated; `ui-spec`, `distill`, `gitnexus` are not wrappers).
- Evidence payload text mentioning `specs/` or `architect/` in forms the extractor does not resolve (50 of the 80 files with hits sit under `docs/platform/**` (44 of them under `verification/`); they are payload, not rewritten).
- 6,410 unresolved dynamic edges from non-history consumers: almost all `**` or file-name patterns; only about 25 mention `docs/`; the relevant ones are `src/report/enduser-index-generate.mjs:92` (`docs/<quadrant>`), `src/setup/registrations.mjs:3708` (`docs/<relPath>`), `scripts/check-decision-citation-drift.mjs`. None targets a legacy root.
- **Work-item records** (`.fgos/state.json`, tracked at this commit, 1,042 items): 77 items name a retiring path in `description`, `verify`, `refs`, `footprint`, `acceptance`, `title` or `action`; by status todo 6, doing 2, blocked 1, awaiting-human 1, delivered 2 (12 live), retrospective 34, done 25, wontfix 6. `verify` commands run when an item returns; `footprint` feeds the conflict advisory. The snapshot is the branch's, not main's live state (UNPROVEN: re-read main's live state read-only at Phase 8 start). The inventory counts them only as history edges.
- **Untracked consumers**: `.claude/rules/**` (gitignored by `/.claude/*`; names `docs/platform/component-boundary.md` only), the owner's `~/.claude/**` (outside the repository). The lease cannot freeze them and the commit gate never sees them.

## 8. Overlap with the other plans (read in the main checkout at `7e36897c0`)

| Plan | Status | Consumer files it touches | Effect on Phase 8 |
|---|---|---|---|
| A `261006-1415-fgos-single-door-mechanisms` | completed, on main (`a004bb598`) | `AGENTS.md` (five doctrine lines, done), `core/skills/_shared/**` and renders (header), `.githooks/pre-commit` (root-file allowlist), `src/setup/registrations.mjs` (doctor `active-release-matches-checkout`), `docs/specs/distribution.md` | already in the branch (main merged). Render header and doctor drift check mean `npm run build:skills` output must be committed unmodified; hand edits to renders are caught |
| B `261006-1415-fgos-convention-component` | pending, not authorized | `AGENTS.md` (phase 06, one line), `.githooks/pre-commit`, `src/setup/registrations.mjs`, `docs/specs/reading-map.md`, `docs/specs/system-overview.md`, `docs/specs/distribution.md` line 70, `docs/platform/component-boundary.md`, new `docs/platform/convention/spec.md`, `docs/platform/README.md`, `CHANGELOG.md` | Plan 7.5 requires cutover after Plan B phase 06. The lease guard also edits `.githooks/pre-commit` and `src/setup/registrations.mjs`: two writers, serialize on main (lease first or Plan B first; record the order) |
| C `261006-1445-fgctl-dev-activation` | draft, unscheduled | `docs/platform/packaging-distribution/**`, `docs/specs/distribution.md` row 7, `AGENTS.md`, `CHANGELOG.md`, `docs/specs/reading-map.md` | not a dependency; if scheduled it runs after the cutover |
| advisory capability completion, council parity first slice, request-to-run p1 | pending | `docs/specs/runner.md`, `docs/specs/reading-map.md` | each main-side edit to a legacy root after Phase 6 stales decision rows; re-check at every sync |

## 9. Hook fact that changes the lease design

`git config core.hooksPath` is `/home/vantt/projects/forgentX/.githooks` (absolute, set by `src/setup/git-hooks.mjs:103`). Every worktree therefore runs the main checkout's checked-out `.githooks/pre-commit`. A commit guard for the lease must be present in the main checkout's working tree (on main) before the lease is acquired; a guard that exists only on the plan branch does not protect other worktrees. The lease code must land on main as a separate early change (plan 5 item 9) and cannot ship inside the cutover merge. Not stated in `cutover-write-lease-design.md`.

## 10. Unproven

- Cause of the +55 against the 3,853 figure and of the 5,382 figure.
- Exact set of retiring roots (Phase 6 area maps do not exist yet); my provisional list may include documents that stay.
- Counts for G1b and all link queues after Phase 6 (the platform corpus changes).
- How `collectFiles` in the dead-vocabulary guard behaves on a missing directory.
- How the instruction projection regenerates the `AGENTS.md` block, and how registry-managed knowledge documents may be edited.
- Live work-item state of main (only the branch snapshot was read).
- Cross-check regex is wider than the extractor: its hit counts are not edge counts.
