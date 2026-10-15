# Specs and UI carriage authoring report

Date: 2026-10-15. Assignment: unit-run-1792045007741-a245b0a6/producer/1. Author: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15. State: authoring complete; A39 and candidate link follow-up applied; fast D has zero structural findings; native validation/review packaging next. Input HEAD: 111adc51fd047d99121fd9d076eb4794c87045a4. The runner supplies the output commit. Read progress first; wrote progress early and again before finishing. Read Step 8, shared P1–P4, frozen map, constitution, owner amendments, component-boundary anchor, source corpus and committed Lead step8-evidence.md before carriage. Lead supplied main merge aa60246e1; no git writes or additional merge are run here.

| Authoring result | Count |
|---|---:|
| Sources / HEAD units | 27 / 566 |
| Spec sources / units | 6 / 355 |
| UI sources / units | 21 / 211 |
| Source decisions pending / reviewed | 566 / 0 |
| Shards (largest) | 7 (211 rows) |
| Carrier-bound / generated no-target rows | 557 / 9 |
| Row dispositions move / regenerate-from-source | 557 / 9 |
| File dispositions move / split / regenerate-from-source | 20 / 2 / 5 |
| Candidate files / portals / provenance sidecars | 35 / 7 / 2 |
| Unit-exact / Weak-exact / Judgment | 275 / 260 / 31 |
| Unequal source/target pairs / no-target generated rows | 22 / 9 |
| Section liveness entries | 224 |
| Direct/concept citation queue entries / captured source relative links | 249 / 81 |
| Existing targeted tests pass / fail / skip | 44 / 0 / 0 |

All seven area routes already existed as candidate. Six new candidate area directories were authored; the existing dashboard area gains spec.md and its portal. No component-boundary change: this only adds candidate documents and navigation to existing runtime areas; no platform component, contract meaning, writer ownership or runtime dependency changes. No new config/env/infra dependency is introduced, no setup/doctor registry change is needed and no shipped user behavior changes; no changelog outside the write scope is required. All prior closure obligations remain.

## Decisions applied under existing rules

| Lead decision | Rule | Applied record |
|---|---|---|
| Five generated projections retain regenerate-from-source, no candidate copy | A9/N1; constitution §4 | Per-file overrides in step8-triage.json and each generated file row; source builder .claude/skills/ui-spec/tools/build.mjs and interpret-wireframe.mjs. Frozen map is unchanged. A39 (Lead commit b4d758676) adds the generated route; fast D/E confirms the five class findings are gone. |
| Keep working legacy UI tool root, candidates only at map paths | P3; Lead decision 2 | docs/ui-spec untouched; owner queue ui-spec-tool-root requires repoint or retained tool root before promotion. |
| Preserve screen/modal/component/flow kinds | P2; frozen specs-ui map | Architecture for S01–S04, M01–M03, C01; guide-runbook for F01/F02. No reclassification by author preference. |
| Split mixed confinement and observe content with labelled subdivisions | Step 8; constitution kind placement; P2/P3 | Confinement §6 contracts, §10 and §13 leading/13.1 history, §12 and §13.3 decisions; §13.2/deferred items remain spec. Observe §6 decisions. Source headings, numbering and all text preserved. New files/parent labelled Added in candidate. All numbered and code/doc consumer citations queued. |
| Carry false/stale current sentences verbatim | A19/A28; Lead decision 5 | Plugin 12 verbs/check/full, confinement migration/no-key, citation retired corpus/.bee, observe migrate/archive path, dead layout/0014 links, UI generated/gitignore; Lead evidence §4 and owner queue. No truth fix in carriage. |
| Machine files byte-equal with sidecars; YAML front matter stays first | P3; Lead decision 6; Step 5 machine-carrier precedent | spec.config.yaml and surface-contract.schema.json checked byte-equal; adjacent .md provenance sidecars. All 18 front-matter sources retain their exact first bytes; candidate header follows H1. |
| Stop condition 6 counts changed unit digests | Lead decision 7; P1 | 5/557 = 0.9%, not whole changed-file rows; 557 pin → 566 HEAD units. All changed/new units carry HEAD text. step8-source-drift.json. |

Confinement and Observe were processed last. Their per-source comparisons with source-blobs.txt, frozen map and HEAD were checked immediately before writing their decision rows and saved in step8-triage.json. Confinement differs from the baseline pin; Observe is unchanged. No source byte changed during this run. Complete source SHA256/blob pins, drift by full unit digest, source-to-carrier line segments and full source/target unit bindings are committed in the accompanying JSON files. For the split sources, concatenating the recorded original line ranges reconstructs every source byte. All nonheading payloads and original heading direct payloads are recoverable verbatim after reversing the two recorded Observe link destinations. Candidate H1 section digests include labelled metadata; the Observe contract heading and its block also differ by the explicit destination rebases. Source text and labels remain unchanged. All 566 current source IDs resolve through the existing native registry, without a local ID substitution.

History carriage is not a retired-subject decision. In particular mixed §13.1 retains its current recipe and historical explanation together as one verbatim historical carrier; §13.2 is still in the spec and §13.3 is a decision with rationale/evidence. The liveness scan conservatively protects direct references, extant implementation paths and named subject symbols; no source subject was proven retired. Current truth, generated freshness, source status/coverage headers and dead-link repair are not certified by that classification or by carriage.

## Fast D/E and explicit blockers

This turn ran scoped **fast** D/E through unchanged exported applyDecisions, vocabulary validation and checkConservation on a working-tree overlay, passing all 27 source scope values (equivalent repeated --scope arguments are recorded). Both prior registry row-set invariants were checked. It did not run the committed-tree checkInventory/native extraction or mutate any registry. New candidate gap identifiers are provisional diagnostics, omitted from committed lists; only the 566 source IDs are asserted native. This cannot substitute for the next committed-tree D/E/native equality proof.

- D fast after A39 at input HEAD **b4d758676561e36d320792cacd7128645a90bd43**: **0 structural fatal**. The five generated outputs now derive `generated` from the Lead-added route through the unchanged switchboard contract. All nine regenerate-from-source rows remain pending; no gate, vocabulary, extractor or baseline change.
- E fast: **0 structural fatal**, **566 source rows pending**, **1 contextual identical-unit group**, **3 inherited registry gaps without disposition**, and **136 locally enumerated reverse-open units**. E remains open. The three predecessor IDs in step8-open-accounting.json are distinct from current HEAD decisions and still require native reconciliation.
- The identical group is the empty Behaviors & Operations heading in citation-drift and plugin, preserved under two contextual map owners. Its exact two members/digest and rationale await independent exception review; no accepted exception is invented and the shared exception table is not changed in this turn.
- The 136-unit local reverse list is preliminary only, includes seven area namespaces and the existing dashboard carriers, and has no native tuple-equality/eligibility approval. Next turn derives the actual five-field native candidate-unverified list from strict E; it must not stamp provisional gap IDs as native.

Verification also checked all source SHA256 values, actual native source identities, pending row coverage, full target digests/anchors/ancestry, source-unit and source-heading-payload containment, exact segment reconstruction, 18 untouched front matters, two byte-equal machine files and all new Markdown headers/labels. Existing relevant tests: **44/44 pass**, zero fail/cancel/skip/todo, run with env -u CLAUDE_CODE_SESSION_ID and TMPDIR=/tmp/fgos-work. No new tests or test-only production branches were added. Commands/helpers and raw findings: verification-261015-1400-specs-ui-carriage.md and step8-fast-check.json.

## A39 and relative-link follow-up

Assignment: unit-run-1792047496755-1246aa81/producer/1. Prior authoring commit **ada6e148c**; this follow-up input **b4d758676561e36d320792cacd7128645a90bd43** includes Lead A39. This runner supplies the follow-up commit. A39 resolves the generated-role conflict; historical findings remain labelled in step8-open-accounting.json.

Observe spec link labels stay unchanged. Destinations `../reference/discussion-quality-rubric.md` and `../how-to/compare-discussion-setups-with-metrics-eval.md` become `../../reference/discussion-quality-rubric.md` and `../../how-to/compare-discussion-setups-with-metrics-eval.md`. Both preserve their exact `docs/` repository referent. The Added in candidate note and step8-carriage-accounting.json record the reversal. Three pending target bindings changed: the metadata-bearing H1, the contract heading's section digest, and its link-bearing block. Source digests, anchors, ancestry, dispositions and all 566 pending statuses are unchanged. The latter two rows become Judgment; totals are **275 Unit-exact / 260 Weak-exact / 31 Judgment**, **22 unequal carrier pairs**, plus nine generated no-target rows. All unequal pairs require deep review.

All **35 candidate files / 32 relative Markdown link occurrences** resolve through the existing checker's exported link parser; all 33 Markdown candidates pass scoped metadata/link checks. Global `env -u CLAUDE_CODE_SESSION_ID node scripts/check-doc-candidate-status.mjs --json` also reports **0 findings**. No other link rebase is needed. Evidence and full scratch reproduction source: step8-link-rebase-verification.json. The committed fast-check helper is unchanged; its scratch invocation reverses only the two recorded destinations for payload-containment assertions. Actual gate input, digest/anchor checks and exported applyDecisions/vocabulary/checkConservation rules use actual candidate bytes. Fast D/E reports **0 structural fatal** and the four open categories above. The earlier 44/44 targeted test result is historical, not a rerun in this follow-up. No native sync or review pack is run here.

## Next turn: exactly one native sync, then bounded review requests

At this follow-up turn's actual runner commit (not ada6e148c or input b4d758676), the next authorized turn runs exactly one full native registry sync. Preserve all prior known IDs, gap/retired rows and existing independent approval notes/pins; do not invent or graft candidate identities. Reconcile the three explicit predecessor gaps in step8-open-accounting.json under A22/A34; the current 566 source decisions do not dispose those predecessors. A39 has resolved the five generated source-class declarations; verify that classification in native D/E, without any gate/vocabulary/extractor relaxation. Run D and 27-source strict E against both prior registries together and separately; compare active native ID/path/anchor/digest tuples to the persisted registry and to the applied inventory. Persist the real compact working registry once, prove no known-ID loss and verify exact duplicate member/owner membership. Derive the complete native candidate-unverified-specs-ui.json from actual scoped E, including all eligible units of the seven namespaces (and the existing dashboard carriers); compare full claimId/path/anchor/unitDigest/fileStatus tuples, never only counts or this local provisional list.

Then package bounded independent ordinary source requests for all 566 pending rows, with complete shown source/target text, full digests, decisions and ancestry at the authoring commit. Use bounded text/row sizes and split the long confinement contracts across packets; no broad pack that asks for an unreadable whole spec. Include A36 class lists (currently 275 Unit-exact, 260 Weak-exact, 31 Judgment), every one of the 22 unequal source/target-digest pairs, all nine generated no-target dispositions, and the independent seeded deep draw obligation: at least 15% of each pack's Weak-exact/Judgment population, minimum 10 (all if fewer), plus all unequal pairs; reviewer supplies the seed/draw. More than 3% deep rework expands to full deep read. Every row still gets mechanical proof and an ordinary deep/mechanical verdict note. Retain the separate script-exact stratified spot-check obligation; this producer claims no script approval.

Package separate non-source requests for all 27 triage rows and the five map overrides, the 224-section liveness classification (including mixed historical recipe/decisions), complete native candidate eligibility and reverse-list equality, one contextual identical-unit group, predecessor/generation accounting, owner queue and report. These are separate verdict channels; source approval is not eligibility or truth approval. Prepare the independent A28 30-current-unit truth sample and later per-area fresh-reader keys/runs without this author choosing reviewer seeds or supplying verdicts. Preserve all earlier Rings holds, A34 residuals, token-total checkpoint, fresh-reader limitations and promotion/navigation/alias obligations. No Step 8 closure, global strict green, promotion, deletion or cutover is implied.

## Evidence and scope

- step8-source-blobs.json, step8-source-drift.json: exact source pin and changed-unit evidence.
- step8-liveness.md/json and step8-liveness-scan.mjs: pre-carriage 224-section scan.
- step8-triage.md/json: all 27 dispositions, map overrides and final hot-source checks.
- step8-carriage-accounting.json and step8-carriage-author.mjs: 35 files, 566 decision bindings and verifiable source ranges.
- step8-fast-check.json/mjs, step8-open-accounting.json: exact findings, source/binding assertions, inherited gaps, contextual group and provisional reverse enumeration.
- step8-owed-repoints.json and owner-queue.md: UI tool-root obligation and all captured references, including every Lead-listed numbered/line citation and web source comment.

No native sync, registry refresh/write, review pack, review verdict, lifecycle verb, git write, source-file edit, workspace .fgos write or secret read. Every workspace write is inside docs/platform or this plan. Scratch is only /tmp/fgos-work. Required external result claim is the sole explicit scope exception. No needsWrites. MCP Markdown viewer is unavailable. The installed mdview CLI is not invoked because it would create viewer state outside the authorized write scope. Report name was obtained through checkout Rust fgos convention name (report/verification); the legacy plan directory fails the current convention path grammar, so explicit assignment paths are retained. This follow-up changes neither the frozen map nor the switchboard, checkers, vocabulary, extractor or baselines; A39 is a pre-existing Lead change.
