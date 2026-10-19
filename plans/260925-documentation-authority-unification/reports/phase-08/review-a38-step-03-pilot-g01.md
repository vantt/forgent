# Step 3 pilot semantic review, group g01 (batch-001, batch-002)

Author pin ae141550c2e0; worktree read-only. Sources read in full at the pin: all six consumer files (reading-map.md every line 1-184, long Section 5 bullets read in whole). Candidate targets read at the pin: packaging-distribution/spec.md (headings, section 9, lines 203 and 724), work-state/spec.md (RUL10/45/60 at 1050-1089), work-state/contracts/cli-io-contract.md (headings), runner/decisions/h-36d872fbb0e5.md (0005), runner/subcomponents/h-6979005beaf7/spec.md and runner/spec.md (RUL53/84/89/93 holders), agent-confinement/spec.md 9.2, claude-plugin/spec.md, decision-citation-drift/spec.md, domainization/architecture/domainization.md, system-architecture/history/architect-readme.md, observe and herdr-web-dashboard specs (headers), doc-registry.json, switchboard rootDocuments. Anchors checked with scripts/list-doc-anchors.mjs (plain citation uses extractor anchor; routing-handoff 9.2 anchor is correct).

## Per-file verdicts

### batch-001

`docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` — set batch-001 — **rework** — 2 edges reviewed.
- maps-j-07239 (line 39, parked, `docs/specs/distribution.md` in "Agent Context Engine (RUL102, ...)"). Rule: L12-26 class 1 (RUL citation of a promoted file maps to its candidate; park only when no target or only carriage holds it) and the rule that a parked edge must name the real smallest missing dependency.
  - Defect 1: the reason says RUL102 content is "only found in retained Distribution Source Detail". That is false. `packaging-distribution/spec.md` line 203 (section 9, live, heading anchor `9-instruction-composition-and-projection`) states the RUL102 boundary ("main RUL102 ... Composition and registry semantics belong to the Agent Context Engine"). Only the dated decision narrative (line 724) is in carriage.
  - Defect 2: it cites P8-DOC-GAP-01, which is the participant-contract events.lock stale-prose gap (owner-answers line 163), unrelated to RUL102.
  - Correction: patch to `docs/platform/packaging-distribution/spec.md#9-instruction-composition-and-projection`, keeping the "(RUL102, ...)" locator text. Or, if Lead requires the line-724 decision narrative as the target, park and name that exact missing live copy. Drop the GAP-01 reference.
  - Lead judgment: spec section 9 refers back to this contract (mutual pointer). It is not a self-reference of the consumer, so the patch is allowed; Lead should confirm the circularity is acceptable.
- maps-j-07240 (line 83, preserve `docs/architecture-manifest.json`): ok, retained path (L12-26(3)).

### batch-002

`README.md` — **ok** — 3 edges (maps-j-00001..00003, preserve). `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`, `docs/how-to/`, `docs/explanation/` exist at the pin and are not retired by an alias. Protected root file, no render patch. Correct.

`docs/doc-governance.md` — **ok** — 8 edges.
- Preserve edges 01902/01903/01904/01907/01908/01909: retained roots or lineage, correct.
- Phase 9 row flips 01905 and 01906 (line 95, one shared paragraph): replacement text has post-flip semantics, names retained `docs/transitional-switchboard.md` (exists), and keeps the original until cutover. Correct.
- 01904 and 01909 (Related list and table row for `documentation-system-design.md`): the only candidate is a conservation carrier ("Source snapshot retained ... non-canonical candidate conservation carrier"), so no patch is allowed and preserve is right. The recorded reason does not mention that the target is a carrier. Non-blocking.

`docs/platform-foundations.md` — **ok** — 6 edges (05086..05091, all preserve). docs/distillery/** exists at the pin. maps-j-05091 (line 176): `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` does not exist at the pin and no successor exists anywhere in the tree. Preserve is correct (dated claim, L12-26(5)), but the boilerplate reason says "retained evidence/source". Non-blocking correction: record "target absent at pin, no successor found". Authoring-rule gap: none beyond this note.

`docs/routing-handoff-contract.md` — **rework** — 5 edges.
- 08053 (patch to `docs/platform/work-state/spec.md`) and 08054 (patch to `agent-confinement/spec.md#92-hostread-blind-worker-mù-trước-run-state-của-peer`): ok. The extractor anchor was verified, the §9.2 locator is retained, and timing is Phase 9. The `work-state/spec.md` target holds the work item data dictionary (section 3).
- 08052/08055: preserve, retained root. ok.
- **maps-j-08056** (line 94, parked, `docs/specs/runner.md` "(ADR-0005 Runner & cô lập worker, D3/D4)"). Rule: L12-26(1), which maps decision citations to `runner/decisions/h-36d872fbb0e5.md` (Lead-ruled valid target). A live ADR-0005 section exists at `h-36d872fbb0e5.md` line 30 (anchor `0005-runner-cô-lập-worker`). The generic reason ("Exact live passage/authority carry has not been proved") does not name a real missing dependency. The ADR-0005 text has no "D3/D4" labels, so the real open question is label correspondence. Correction: patch to `docs/platform/runner/decisions/h-36d872fbb0e5.md#0005-runner-cô-lập-worker`, keeping the "ADR-0005 ... D3/D4" text. Or park and name "D3/D4 labels absent from candidate ADR-0005" as the dependency.

`docs/reading-map.md` — **rework** — 89 edges (21 patch, 28 parked, 3 row flip, 37 preserve). Coverage: all 57 legacy-root occurrences are in edges. Patch edges (07976, 07988-07991, 07997, 08011, 08014, 08019-08027, 08030, 08032, 08034, 08040) point to existing candidate files, retain label and locator form, and join hunks correctly. Row flips 07955, 07969 and 07970 are correct. Preserves are correct, including lineage at lines 19 and 124 (target would be the consumer itself), retained roots (confirmed in switchboard rootDocuments), and 08037/08038 (source says "path not present at this commit").

Defects, all in parked edges that the rules make patchable, or with a boilerplate reason that does not name the real missing target:
1. Plain pointers with no locator, parked while identical siblings are patched (L165-171 and L177 are patched):
   - 08010: line 158 final `spec: docs/specs/runner.md`.
   - 08033: line 178 `spec: docs/specs/runner.md **Truth correction:**`.
   - Correction: patch to `docs/platform/runner/spec.md`.
2. Locator citations that L12-26(1) maps to a live candidate:
   - 08008 (line 158 §RUL53) and 08009 (§RUL93) → `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` (RUL53 at line 90, RUL93 at line 187; Lead ruled this a valid exact target).
   - 08016 (line 161, RUL89) and 08017 (line 162, RUL84): the pointer is plain and the RUL label is in the preceding gloss. Patch to `runner/spec.md` (siblings do the same), or to h-6979005beaf7 (RUL89 at 183, RUL84 at 178).
   - 07994 (line 154 §RUL60) and 08031 (line 176 §RUL45) → `docs/platform/work-state/spec.md` (RUL60 at 1089, RUL45 at 1077, live Business Rules region).
   - 07995 (line 154 "(lớp hướng dẫn)", a gloss, not a section) → `runner/spec.md`.
   - 07992 (line 149 §envelope) → `work-state/contracts/cli-io-contract.md#3-output-direction-unified-envelope`.
   - 07993 (line 150 §sổ verb) → `cli-io-contract.md#7-machine-readable-verb-registry`.
   - Keep the §/RUL text after the patched path.
3. Parked although a live candidate exists:
   - 07996 (line 155, plain `docs/specs/fgos-plugin.md`) → `docs/platform/claude-plugin/spec.md` (provenance is that spec; same header status as the patched observe and herdr specs).
   - 07985 (line 145 `docs/specs/decision-citation-drift.md`) → `docs/platform/decision-citation-drift/spec.md` (the parked reason is "no exact live destination", which is false).
   - 07998 (line 156 `docs/reference/herdr-web-dashboard-layout.md`): the path is absent at the pin, and `doc-registry.json` currentPath is `docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md` (exists, live). Under L12-26(2) the registry successor applies. Correction: patch to that path, or record it as a named successor note rather than parking on a "Step 3 successor decision".
4. Parked correctly, but the dependency or reason is boilerplate or names the wrong gap:
   - 07981 (line 144) and 08028 (line 172) point to `docs/specs/enduser-docs-index.md`: the dependency must name P8-DOC-GAP-02, not "Step 3 exact passage/row decision".
   - 08013 (`docs/architect/README.md`) and 08015 (`docs/architect/domainization/README.md`): the real reason is that the only holders are carriers (`system-architecture/history/architect-readme.md` is history, `domainization/architecture/domainization.md` is a conservation carrier). The recorded dependency "P8-DOC-GAP-02 (enduser-docs and curated foundations)" is the wrong gap.

## Authoring-rule gaps needing Lead judgment (not counted as defects)
- 08019 (line 164): the patch turns `docs/architect/host-invocation-routing/` into `docs/platform/host-invocation-routing/`, but the bullet enumerates "5 tệp" with names that do not exist in the candidate (`host-invocation-provider-routing.md`, `rust-cli-and-proof-components-plan.md`). L12-26(6) parks sentences about how the legacy tree is organised. Decide whether to patch only the path and accept the stale file list, or rewrite or park.
- 07977 (line 142 "§Dev checkout shell helpers") and 07979 (line 143 "legacy spec: ... §Setup, §Doctor"): the exact headings exist only in carriage, but live `packaging-distribution/spec.md` section 3.3 (`33-dev-checkout-channel`) and section 6 (`6-doctor-fix-and-legacy-setup`) hold the content. Line 143 labels the target "legacy spec", so it may be a row-flip rather than a path patch. Park is defensible. Lead should say whether live sections count as the locator holder.
- 07958..07961 (lines 81-84 under "During migration, the existing roots remain active"): preserve is right for the paths, but the sentence is migration-state text. Lead should say whether it needs a Phase 9 status-only flip entry (L12-26(6), "rows naming paths that stay valid flip status only").
- Line 160 (08014 patched while 08013 and 08015 stay legacy) leaves a mixed bullet before and after cutover. This is acceptable only if Phase 9 applies the parked parts together.

## Denominators
- batch-001: 1 file reviewed, 1 rework (100%), 2 edges.
- batch-002: 5 files reviewed, 2 rework (40%): reading-map.md and routing-handoff-contract.md. The 3 ok files are README.md, doc-governance.md and platform-foundations.md. 111 edges reviewed. Both sets exceed the 3% gate on this slice.

Status: DONE
Summary: Reviewed 6 files / 113 edges. 3 files ok, 3 rework: instruction-composition (1 parked edge with a false reason), reading-map (about 16 parked edges that should be patches or need specific dependencies), routing-handoff-contract (1 parked decision citation). Four Lead judgments are listed separately.
