# tsk-397 DISCUSSION.md — completeness/consistency review (Opus, 2026-08-19)

Read in full (1529 lines). Code citations spot-checked against this worktree:
`package.json` (`yaml ^2.9.0`, only dep — holds), `stage-fsm.mjs:94`, `plan.mjs:519`,
`loop.mjs:1297`, `registrations.mjs:407/424` + `checkAgentClaimsResolve:479`,
`project-agents.mjs` SOURCE_DIR:38 / claims:123-125 / frontmatter:145-147,
`dispatch.mjs:1035/1275/1693`, `workflow-stage-graphs.mjs:405-441/670-673`,
`handoff.mjs:37/59-66`, 13 files in `docs/task-specs/coding/`, all 7 cited test files.
**All hold.** Only nuance: D14's "3 chỗ hardcode literal path" — only line 88 has a full
`docs/task-specs/...` path; 177/291 cite the filename only.

## (A) Real inconsistencies / stale references

1. **§6 L905-918** — the block "Còn mở, ĐỀ XUẤT round 19 … `agents/*.yaml` NÊN giữ nguyên
   top-level" is the exact proposal D24 rejected (twice), and D24's own subsection sits 40
   lines below at L955. Delete the block.
2. **§6 L893-896** — "Còn mở (❓ trong diagram): chỉ còn `doctrine` domain-scoped — chưa có
   cơ chế nạp…" contradicts D23 (locked, subsection at L920). Delete/rewrite as resolved.
3. **§7 L1526-1529** — "28/28 quyết định đã chốt" is stale; §1 L30 says 30/30.
4. **§3 row 27 (L417)** — still describes D18 as `workflows/<name>.mjs` + `registry.mjs`
   aggregator + `feature` reference-sharing. §4's D18 row got a `[Round 19: D29/D30]`
   bracket; this row did not. Add the same bracket, status `Chốt — D18/D29/D30`.
5. **§7 {#task-bundle-for-stage} L1336-1337** — "từ `skillMap`/`taskSpecMap` (đã cùng
   object, cùng key stage)" is the pre-D29 shape. Those maps now live per-workflow
   (`workflows/*.yaml`), so `bundleForStage` must resolve through `resolveWorkflow(domain,
   item.kind)` first; the dependency line should cite D29/D30 too.
6. **§7 {#task-persona-key-extension} L1354-1356** — "(layer DISPATCH … + tương lai
   `claims`-matching)" is leftover pre-D20 terminology; should read skill-match.
7. **§7 {#task-eligibility-inversion} step 3 (L1381)** — cites "sau {#task-eligibility-
   inversion}", i.e. the task references itself. Intended referent is D9's task-spec
   migration — which has no task (see B1).
8. **§6 L1137-1143 "Cố ý CHƯA XÂY (D15)"** — still framed as awaiting evidence, patched
   only with a D22 parenthetical. D25 locked it; §3 row 26 and §7's closing line both say
   so. Add the D25 note or fold the block into D25's text.
9. **Diagrams vs D6/D27** — ASCII tree's `domains/marketing/` has no `knowledge/` line and
   the mermaid MARKETING subgraph has no knowledge node (coding has both, D6 is
   domain-generic); the mermaid CORE subgraph has no `core/task-specs/` node although
   D27 put it in the ASCII tree.

## (B) Gaps worth flagging before implementation

1. **No task executes D9.** Nothing in §7 moves the 13 `docs/task-specs/coding/*.md` into
   `domains/coding/task-specs/`, yet tasks 5 (D11), 7 (D14) and 9 (D20) all declare a
   dependency on that move, and `registrations.mjs:407` hardcodes the old path today.
2. **No task executes D16.** The `human-advisor`→`advisor` rename touches real code
   (`workflow-stage-graphs.mjs:406,414,422,424`); the `position`→`role` header sweep
   survives only as a parenthetical inside {#task-eligibility-inversion}.
3. **`workflows`/`defaultWorkflow`/`workflowFor` are homeless after D29/D30.** Verified:
   `resolveWorkflow` (L670-673) reads all three off the domain object, and task-1 promises
   "13 hàm resolver giữ NGUYÊN signature" — but D30's registry.yaml inventory and task-1's
   3-way split both omit them. Decide: selector fields stay in `registry.yaml`, `workflows`
   map synthesized from `workflows/*.yaml` basenames.
4. **D20/D22 define no multi-match tie-break.** Zero-match is caught statically (task-9
   step 4's redirected doctor check), but when ≥2 agent-types satisfy a `requires-skill`,
   nothing says which one dispatch picks; D15's `(domain, stage, role)` key doesn't
   disambiguate.
5. **D24 defines no agent-type name collision rule.** Task-11 explicitly projects
   `core/agents/` + every `domains/*/agents/` into one flat `.claude/agents/`. Same
   exposure for D7's skill assembly into flat `.agents/skills/`.
6. **`.agents/skills/_shared/` is unassigned.** 16 entries exist; task-2 accounts for 15
   (8 coding + 7 core). The `_shared/executor-dispatch-fallback.md` fragment (byte-mirrored
   per AGENTS.md) belongs to neither bucket under D7.

## (C) Minor / optional polish

1. §4's D3/D4 rows still say `domains/*/registry.mjs`, and D20/D22 still say
   `assignable-to`; D18 got a bracketed supersede-note, these did not.
2. §6 L893 refers to "❓ trong diagram" markers no current diagram contains.
3. D14/§6/task-7's "3 chỗ hardcode literal path" overstates: only line 88 is a path.
4. D25's §4 row cites edge `reviewer`→`human-advisor` post-D16 without noting it quotes
   the pre-rename code.

**Stranger-bar (§6 alone):** yes, with one caveat — A1/A2/A8 would actively mislead a
cold reader into thinking doctrine, agent placement and stage-persona are still open, and
B3 leaves the workflow selector unspecified. Fix those four and §6 stands freestanding.
