# Step 7 preparation — record the owner's park-family decisions (Doer brief)

Status: Lead brief for the next Doer turn (records and plan text only).

You are Doer for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. A read-only Lead analysis grouped all 2,311 Step 5 parked items into 23 families: step-07-park-families.json and step-07-park-families.md in this directory (with step-07-park-families-classify.py to reproduce). The owner answered its three questions on 2026-10-21 18:17 ("đồng ý với các đề xuất") and accepted the Lead-settled handling list.

Scope: RECORDS AND PLAN TEXT only. Writable: plans/260925-documentation-authority-unification/reports/phase-08/** and plans/260925-documentation-authority-unification/phase-09-atomic-platform-authority-cutover.md. Never a git write, never the fgos CLI, never the .fgos directory or secrets; never edit code, docs/**, tests, skills, gates or baselines. python -B; scratch /tmp/fgos-work/; commit only final files.

## Work

1. Verify the family grouping reproduces (run classify.py against the current records; report coverage: every parked item in exactly one family, counts per family) and fix the files if counts drifted since eb2575b06.
2. Record L12-96 in owner-answers.md:
   - Q1 = A: one bounded, redacted, read-only export of path-bearing state fields (registry docs/topics currentPath/aliases/purposeTitle/sourceCaptureIds, state.decisions rows, Work.docsRef/content-root/item.refs, inventory oldPath/aliases/move destinations, outcome.docPath, acceptance evidence tokens), taken once by the Lead at the Step 7 final pin; no secrets, no event bodies; it grants no write or cutover authority. Families 1–5, 9, 20 and the 2 external parks wait on it.
   - Q2 = A: keep docs/decisions/index.md as the generated projection (its 51 parks become preserve at Step 7 with this ruling as witness); drop the duplicate candidate docs/knowledge/decisions-index/decision-record.md from the move set; native Land numbered-decision renumbering in src/runner/merge.mjs stays as is (dormant in this repo, working for projects with a numbered corpus): its 8 R29 parks become preserve with a "dormant in this repo" witness. The L12-89 retired-roots guard must allow docs/decisions/index.md (generated) while refusing new numbered decision files: amend the L12-89 wording in phase-09 Requirements accordingly (one sentence, linked to L12-96).
   - Q3 = A: per-area convention: decision narratives under docs/platform/<area>/decisions/, RUL ids owned by the area spec.md, the citation drift checker scans docs/platform/**/spec.md recursively, and a published area-to-holder table resolves fgos decision --scope; the cutover writes the minimal convention text and table; the RULE lane may refine after cutover (L12-91 one-way). Families 13 and 17.
   - Lead-settled (owner accepted): retain docs/enduser-docs-index.json and docs/architecture-manifest.json (drop the differing candidate copy); move docs/contracts/fgos-gateway-api-v1.yaml to the herdr-web-dashboard contract with gateway.rs/mcp.rs and tests repointed and the duplicate deleted at cutover; move docs/doc-governance.md and docs/architecture-map.md after a content check against their targets; carry the 44 missing claims verbatim into live holders at Step 7/Phase 9; Decision F ratchet retirement as one unit with the L12-89 guards; post-retirement scan sets bound at Step 7 composition (Lead places P7-DOC-GAP-05 dynamic-023895).
3. Do NOT flip any record disposition in this turn (Step 7 does that against the final pin); write step-07-park-resolution-plan.json listing per family the target disposition, witness ruling and the step that applies it.
4. Update progress.md.

Final message: FIRST line a conventional commit subject (at most 100 chars, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
