# Step 3 pilot round 2 review: g02, batch-040, docs/specs/reading-map.md

Pin `ae141550c`. Source read in full (72 lines, 35,721 bytes). Records read directly (82 edges, `maps-j-08136..08217`, one diff of 30 changed lines, two hunks). Candidate targets checked at the pin: packaging-distribution §3.3, decision-citation-drift spec, runner spec Pointers, runner business-rules subcomponent (RUL53/84/89/93), runner decision history file `h-36d872fbb0e5.md` (0048, 0049), work-state spec §11 (RUL45, RUL60), cli-io-contract §3 and §7, agent-confinement spec / contract / decisions / history, host-invocation-routing tree, system-architecture tree, architecture-intent and domainization headers, doc-registry alias for the herdr layout. Resolver run for 08186, 08187, 08188, 08215. All 25 patch targets exist at the pin, and all 24 existing preserve paths exist.

## File verdict

- Path: `docs/specs/reading-map.md`. Set: batch-040.
- Verdict: **rework**. One new disposition defect (08215) and one reason-text defect (08194).
- Dispositions: 37 patch / 17 parked / 3 row-flip edges / 25 preserve = 82 (matches the request).

## Round-1 defects confirmed fixed

- Drift: 08158 patches to `docs/platform/decision-citation-drift/spec.md`. Its "Carriage only / Canonical: No" header is candidate status, not carriage.
- Envelope and verb registry: 08165 → cli-io-contract `#3-output-direction-unified-envelope`; 08166 → `#7-machine-readable-verb-registry`. Both anchors exist and slugs are correct.
- RUL60 and RUL45: 08167 and 08207 → work-state `#11-business-rules`. RUL60 is at line 1089 and RUL45 at line 1077, in the live section.
- Guidance layer: 08168 → runner/spec.md. Pointers hold the P50 guidance-layer entry.
- RUL53/93/89/84: 08181, 08182, 08189, 08192 → runner subcomponent. RUL53 (line 90), RUL84 (178), RUL89 (183) and RUL93 (187) are all there, under `## Business Rules`. The anchor is the file H1 `#added-in-candidate-runner-business-rules`, which is valid.
- Bare runner pointers: 08183 and 08210 → runner/spec.md.
- Registry alias: 08171 → `docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md`. The doc-registry alias is confirmed, the legacy file is absent at the pin, and the "lớp UI/wireframe" gloss stays true.
- 08193 parks on the description rewrite. The 08194 park is also on the description rewrite, but see D2 for its reason text.
- 08187 and 08188 both park as whole-source carriage (L12-30(3)), so the bullet is no longer half-patched.
  - architecture-intent: "Preserve the complete ... source at its frozen-map candidate owner", "Agent carriage".
  - domainization: "Source snapshot retained", "non-canonical candidate conservation carrier".
- 08186: no README in `docs/platform/system-architecture/`, and only history carriage exists. The park is correct.
- 08190: parked on workflow carry. The query for `docs/specs/workflow.md` returns 0 hits, and no workflow candidate directory exists.
- 08191: patched to `h-36d872fbb0e5.md#added-in-candidate-runner-lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4`.
  - That file holds both 0048 and 0049. 0048 item 2 is the thin driver and 0049 item 4 is the Workflow runner as sequencer, so the §2 and §4 citations are true.
  - The slug is correct.
  - The `docs/specs/workflow.md` reference on the same line stays legacy under 08190, so the line does not claim workflow is carried.
- 08150 → `packaging-distribution/spec.md#33-dev-checkout-channel`. The section documents sourcing `scripts/fgos-shell-integration.sh` and the tier order. The translated-heading correspondence is valid and the label is kept.
- 08152 stays parked, and the reason is true. The source gloss is literally "legacy spec: ... §Setup, §Doctor", so a path-only patch would make it false. Live §6 and `contracts/setup-doctor-registry.md` are named.
- 08185 park verified. `§13.1` and the private-home recipe (formula, account inventory, commit history) are held only in `history/rollout-and-settled-facts.md` (line 51). The live spec, contract and decisions hits mention private-home only incidentally.
- 08184 patches the initial whole-file pointer to agent-confinement/spec.md.
- 08215 now states the absent-target fact. `git log` over the whole ancestry finds no such file. The disposition is a problem, see D1.

## New defects

| edgeId | Source line | Rule | Problem and required correction |
|---|---|---|---|
| maps-j-08215 | 69 | L12-30(5) | The `test/` row says "benchmark ngoài suite (F4) tại `docs/history/.../f4-benchmark.md`". This is a present-tense location pointer in live navigation, not a dated or past-tense recount. The record preserves it as "dated completed-action evidence". The target never existed in git history, and L12-30(5) says a never-existing target in live navigation is parked as a dead link with that fact. g03 08241 and g04 08349 are handled that way. Correction: park it as a dead link, naming the never-existed fact and the smallest blocker (the benchmark report or the row text is missing). Alternatively, justify with a quoted passage why this one sentence is history. |
| maps-j-08194 | 45 | L12-30(5), L12-30(6) | The park is correct, but the reason says the listed legacy files are "absent from the candidate directory". Two of the five names exist in the candidate tree under `architecture/`: `legacy-cli-transition.md` and `external-provider-protocol.md`. The other three are renamed or absent: `provider-routing.md` replaces `host-invocation-provider-routing.md`, `node-to-rust-migration.md` replaces `node-to-rust-component-migration.md`, and `rust-cli-and-proof-components-plan.md` is not found. Correction: reword the reason to "the 5-file list does not match the candidate layout (3 renamed or absent, 2 moved under architecture/)". |

## Lead-judgment questions

1. 08215 above. If Lead rules the sentence is history, the file moves to ok and the only remaining fix is the 08194 wording.
2. 08181, 08182, 08189, 08192 and 08191 anchor to the file H1, not to the exact RUL or decision heading. Valid and consistent with the resolver; accepted. Say so if a finer anchor is wanted.

## Denominator and numerator

- batch-040, this report: 1 file reviewed, 1 rework (0 ok). The other 10 batch-040 files belong to g05 and g06.

Status: DONE_WITH_CONCERNS
Summary: docs/specs/reading-map.md is rework. All round-1 defects are fixed and the patches and parks verified at the pin. One disposition problem remains (08215, a dead-link park under L12-30(5)) and one reason-text imprecision (08194).
