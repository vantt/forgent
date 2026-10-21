# Step 7 park families: what actually unblocks the 2,311 Step 5 parks

Read-only analysis of worktree `forgentX-s8-review` at `eb2575b06`. Sources: `step-05-closure.json` (L12-90), `step-05-records/*.jsonl`, `step-05-proposed-move-read-units.json`, `step-05-step7-carry.json`, and owner-answers L12-58..L12-91. Machine output with member lists, selectors, seams and examples: `step7-park-families.json`.

## Coverage

- Parked owning items: **2,311**. This equals the closure's `totals.dispositions.parked` and the sum of the 1,998 `parksByDependency` groups. The brief's figure of about 2,283 predates L12-90, which added 27 R30 parks, moved 2 preserves to park and removed 1 park under R31 (2,283 + 28 = 2,311).
- Assigned to the 23 families: **2,311**. Unassigned: **0**. Every item is in exactly one family.
- Not counted above: 2 external parks at locator level (`.fgos/**` and ignored instructions; `doc-inventory.json`). The export decision in Q1 unblocks them too.
- There are also 37 R26 move units with no parked item. They hold only comment co-changes, and they follow the move set.

## Families, sorted by item count

| # | Family | Items | Files | Unblocked by | Who decides |
|---|---|---:|---:|---|---|
| 1 | gen-doc-registry: generated `docs/doc-registry.json/.md` rows | 1318 | 2 | Folded registry `view.docs/topics` export (currentPath, aliases, purposeTitle, sourceCaptureIds), then regenerate | **Owner Q1**, then mechanical at cutover |
| 2 | gen-enduser-index: generated `docs/enduser-docs-index.json` entries | 506 | 1 | Same registry export plus the final scan set from Step 7, then regenerate | **Owner Q1**, then mechanical |
| 3 | gen-decision-index: generated `docs/decisions/index.md` rows | 78 | 1 | `state.decisions` rows export plus the index union; output path per Q2 | **Owner Q1** (+Q2), then mechanical |
| 4 | state-registry-export: runtime, doctor and CLI readers of registry currentPath/aliases (R30) | 58 | 7 | The same registry export | **Owner Q1**, then Lead proof |
| 5 | state-work-docsref: Work.docsRef / content-root readers (R30) | 56 | 8 | Work.docsRef / content-root / item.refs export | **Owner Q1** |
| 6 | r26 `docs/decisions/index.md` (move proposed to `docs/knowledge/decisions-index/decision-record.md`) | 51 | 10 | Decision to retain or move the index; the 45 reader slots move as one unit | **Owner Q2** |
| 7 | r26 `docs/enduser-docs-index.json` (move set declares no target) | 36 | 7 | Confirm retention | Lead (A42): retain |
| 8 | readset-post-retirement-scan: guards and classifiers over the post-retirement tree | 31 | 5 | File set from the Step 7 composition; R13 frozen-B lifts in Phase 9 | Mechanical at cutover (one Lead call: GAP-05) |
| 9 | state-inventory-oldpath: bootstrap and migration readers of inventory oldPath (R30) | 31 | 3 | Inventory oldPath / aliases / move-destination export | **Owner Q1** |
| 10 | decision-f-ratchet-retirement | 18 | 1 | Already settled by L12-86 (one retirement unit) and L12-89 (three guards) | Mechanical at cutover |
| 11 | r26 `docs/doc-governance.md` (move proposed to `docs/platform/governance.md`) | 17 | 3 | Confirm the move and check that the target holds the content the gate reads | Lead (A42): move |
| 12 | gateway-ctr010-contract-citations (both YAML copies, which are byte-identical) | 17 | 2 | Gateway path call (#21), then carry items `gateway-yaml-*` | Lead at Step 7 |
| 13 | citation-convention-and-scan | 14 | 4 | Global ADR home, ownership of RUL ids across split holders, and the scan population for the drift checker | **Owner Q3** |
| 14 | carry-foundations-and-retired-decision-narratives (GAP-02, claim-correspondence) | 13 | 4 | Carry verbatim D-ADR0035/0054/0062, RUL11/RUL104 wording and the 0032 heading layout into live holders | Lead (A42) |
| 15 | carry-knowledge-registry-framework | 12 | 4 | Carry the §5.5/§7.2–7.4/§13.5/§14 rules that exist only in the proposals snapshot | Lead (A42) |
| 16 | carry-runner-workstate-doctrine | 11 | 9 | Name the live holder (e.g. `docs/platform/runner/decisions/h-36d872fbb0e5.md`) for Native-First, clarifying rule 2, the session rule, FlowDefinition, STR70a and 2 dead links | Lead (A42) |
| 17 | split-area-holder-mapping: `docs/specs/<area>.md` used as narrative, decision, fact or read-first home | 8 | 4 | One mapping from area to holder, plus a named home for decisions and facts | **Owner Q3** |
| 18 | carry-distribution-gateway-claims | 8 | 7 | Carry ReleaseManifest §5, the init pipeline, git-common-dir, gateway-token refusal, js-yaml and old R5 into live holders | Lead (A42) |
| 19 | r29-native-land-decisions-tree (`src/runner/merge.mjs`) | 8 | 1 | Policy for the native Land numbered-decision writer and reader | **Owner Q2** |
| 20 | state-outcome-and-evidence: outcome.docPath, acceptance tokens (R30) | 7 | 4 | Outcome / capture / acceptance-evidence export | **Owner Q1** |
| 21 | r26 `docs/contracts/fgos-gateway-api-v1.yaml` | 6 | 2 | Retain or move the served CTR010 contract (`gateway.rs` L1187, `mcp.rs` L127) | Lead (A42): move |
| 22 | r26 `docs/architecture-manifest.json` | 6 | 2 | Retain or move | Lead (A42): retain |
| 23 | r26 `docs/architecture-map.md` | 1 | 1 | Confirm the move | Lead (A42): move |

Totals by decider:

| Decider | Items | Distinct files |
|---|---:|---:|
| Owner Q1 | 2,054 | 21 |
| Owner Q2 | 59 | 11 |
| Owner Q3 | 22 | 8 |
| Lead | 127 | 36 |
| Mechanical at cutover | 49 | 6 |

Owner questions: **3**. They cover 2,135 items (92%).

## Draft owner questions

### Q1. Authorize one bounded state export for parity, or prove parity only by regenerating at cutover?

- **What is happening:** 2,054 parks (89%) and both external parks wait on data that lives only in live `.fgos` state or the inventory. That data is the registry docs/topics rows, `state.decisions`, Work.docsRef / content-root / refs, inventory oldPath rows, outcome.docPath and Work.acceptance evidence tokens. Four generated files make up 1,902 of these parks; runtime, doctor and CLI readers make up 152.
- **Cause:** Phase 8 is records-only and never reads live state (L12-58 boundary). R30 forbids closing a state-sourced path as caller pass-through, and L12-71(8) forbids hand-patching generated bytes. So the "same-input parity" these parks require cannot be produced without the data.
- **Options and cost:**
  - **A. Authorize a bounded, redacted, read-only export, taken once by the Lead at the Step 7 final pin.** It contains path-bearing fields only, with no secrets and no event bodies, and the inventory is read through its existing loader. Cost: one extraction turn plus a privacy-boundary change. The benefit is that parity is proven before cutover, and all 2,054 items close together.
  - **B. No export.** Phase 9 regenerates the four outputs with the existing generators from live state inside the cutover, reviews the diff, and relies on the full suite for reader parity. Cost: no boundary change, but there is no pre-cutover proof. A lost alias or currentPath would show up only in the cutover diff. That works against DoD "reproducibly verifiable".
  - **C. Split.** Export only registry and `state.decisions` (which close 1,902 generated plus 58 reader items), and use option B for docsRef, inventory and outcome readers (94 items). Cost: two proof standards.
- **Recommendation:** A. A single bounded input closes 89% of the parks with real evidence, and it is the only option that keeps proof ahead of the cutover.
- **Scope of answer:** families 1–5, 9 and 20, plus the 2 external locator parks. It gives no cutover or write authority.

### Q2. The `docs/decisions/` tree: keep the generated index where it is, and what should native Land do with numbered decision files?

- **What is happening:** 59 parks. The R26 unit for `docs/decisions/index.md` has 45 reader slots in 10 files: the CLI, decision-index and enduser generators, citation drift, instruction-registry, doctor and tests. Separately, R29's 8 members are in native Land (`merge.mjs` L418 `docs/decisions/0000-index.md`, `nextFreeDecisionId` L537, rebuild L1104). They renumber colliding numbered decision files when a merge conflicts on the old index.
- **Cause:** the Phase 6 move set proposes moving the index to `docs/knowledge/decisions-index/decision-record.md`. That candidate already exists and is a copy of the generated index. However, `decision-index.mjs` L18 writes `repoRoot/docs/decisions/index.md` in every project, and AGENTS.md documents that path. L12-89 guard 1 refuses new retired decision files. Land's writer only acts when a project still has a numbered corpus.
- **Options and cost:**
  - **A. Keep `docs/decisions/index.md` as the generated projection.** Its 51 parks become preserve, and the duplicate candidate is dropped. Native Land's conflict renumbering stays as is: it is dormant here and still works for projects that keep a numbered corpus. Its 8 parks become preserve with a "dormant in this repo" witness. Cost: one non-platform generated path stays, and the L12-89 placement rule has to allow it.
  - **B. Move the index.** Patch 45 readers, change the generator default for all projects, and keep Land. Cost: every project's `fgos decision-index` output moves.
  - **C. Option A or B, plus retiring Land's numbered writer and reader.** Cost: projects with legacy corpora lose automatic renumbering.
- **Recommendation:** A. It is the cheapest, it changes nothing for other projects (mission #1), and it is consistent with tsk-1lv-4 and L12-89.
- **Scope of answer:** families 6 and 19, and the output path of family 3.

### Q3. After `docs/specs/**` retires, where do new decisions and settled facts go, and how are RUL ids addressed?

- **What is happening:** 22 parks. They are the citation-format skill source and its two renders, the `check-decision-citation-drift` default scan population, AGENTS.md L14/L74/L75 and its read-first route, the help text for `fgos decision --scope` (area to holder is not one-to-one, e.g. distribution maps to packaging-distribution), and a `store.mjs` JSDoc example.
- **Cause:** L12-86 found no live passage that establishes a global ADR home or ownership of RUL ids across split holders. Per-area `docs/platform/<area>/decisions/` directories exist for only 7 areas. L12-91 puts rule-lane writes after cutover, but the cutover itself has to rewrite these pointers.
- **Options and cost:**
  - **A. Per-area convention.** Narratives go to `docs/platform/<area>/decisions/`, RUL ids stay owned by the area's `spec.md`, the citation checker scans `docs/platform/**/spec.md` recursively, and a published area-to-holder table resolves `--scope`. Cost: the cutover authors the convention text and the table, and coverage must be at least the current flat scan.
  - **B. Single global home.** `state.decisions` plus the generated index is the only decision home, and area holders only cite it. Cost: the per-area decision directories that already exist become second homes, which is split authority.
  - **C. Interim pointers at cutover, final convention by the rule lane after cutover.** Cost: the 22 items stay pointed at interim text, and agents author decisions against a provisional rule.
- **Recommendation:** A, with the cutover writing the minimal convention and the rule lane free to refine it later (L12-91 stays one-way).
- **Scope of answer:** families 13 and 17.

## Settled by the Lead (A42) or mechanically at cutover

Owner may veto any of these, but none needs an answer to proceed.

| Family | Proposed handling | Evidence |
|---|---|---|
| r26 `docs/enduser-docs-index.json` (36) | Retain. The readers preserve; only the contents regenerate (family 2). | Move set declares no target. `package.json files` ships it. |
| r26 `docs/architecture-manifest.json` (6) | Retain. Drop the candidate copy, which differs from the current file at line 23. | L12-60 ruled it retained. The `instruction-registry` default is `projectRoot/docs/architecture-manifest.json` for every project. |
| r26 `docs/contracts/fgos-gateway-api-v1.yaml` (6) and gateway-ctr010 (17) | Move to the herdr-web-dashboard contract, repoint `gateway.rs` / `mcp.rs` and their tests, delete the duplicate, then run carry items `gateway-yaml-*`. | The two copies are byte-identical today. Keeping both is split authority. The contract is internal to the gateway app (A45 CTR010 identity kept). |
| r26 `docs/doc-governance.md` (17), `docs/architecture-map.md` (1) | Move after a content check against the existing targets. | The readers are only this plan's gates and tests (R13), which change in Phase 9 anyway. |
| 37 R26 units with no readers | Follow the pinned move set; comment co-changes patch with the move. | L12-83/L12-86 |
| carry-* families (44 items) | Step 7 / Phase 9 carries the exact passages verbatim into live holders, then patches the pointers. Rendered copies follow their core source. | L12-62/63, L12-71(4), R2. No locked law changes (verbatim carriage). |
| decision-f-ratchet-retirement (18) | Retire the script, baseline and exceptions as one unit in the same change that lands the three L12-89 guards. | L12-86, L12-89 |
| readset-post-retirement-scan (31) | Bind successor file sets from the Step 7 composition and replay in Phase 9. The Lead places the P7-DOC-GAP-05 component-boundary carriage (`dynamic-023895`). | R13; L12-90 |

## Limits

- Grouping uses the record fields `dependency`, `stateExportDependency`, `blockedCategory`/`dependencyCategory` and file, plus the explicit follower citations (quadrant help cites `dynamic-009788`/`009791`). The rules are in `classify.py`.
- Recommendations are analysis, not rulings.
- I did not verify the content of the candidate targets (`governance.md`, `architecture-map.md`) beyond checking that they exist and comparing bytes.
