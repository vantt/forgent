# A38 ordinary review: Step 9 Phase 7 own scope, displaced candidate sets (01)

- Reviewer: `reviewer:sonnet-session:a507f40016274b773@2026-10-18`
- Author sessions: `codex-session:fgos-run_unit-run-179225dfe65eba@2026-10-18` (N1 predecessor / package producer); `codex-session:fgos-run_unit-run-179229832261fa@2026-10-18` (L11-21 accounting author). These sets are original-record rows from the package producer.
- Review mode: ordinary
- Reviewed commit: `9ac0f42fb` (read-only detached worktree `/home/vantt/projects/forgentX-s8-review`); content commit `e6b7efeec`; B0 base `queue.base` in `step-09-rebind-units.json`.
- Request: `review-request-a38-step-09-package-02.md`, scope `review-scope-step-09-phase7-own.json` (A46)
- Scope: `displaced-unheaded-block-candidate` (497, parts 026-034), `displaced-heading-candidate` (67, parts 034-036), `displaced-file-block-candidate` (1, part 036). 565 entries.
- Verdicts here are advisory. Nothing was applied, committed or written in any repo. No approval is carried: all 565 entries read `reviewStatus: pending`.

## Mechanical authentication (per part)

The portable script has no per-set mode, but accepts a single part file. I ran `env -u CLAUDE_CODE_SESSION_ID node --max-old-space-size=768 .../step-09-package-review-auth.mjs <part>.json all` for parts 026 through 036 (the whole-index run was left to the other reviewer). Every part passed: 60 of 60 entries each (part 036 also covers 31 routing and 23 decision rows that belong to other reviewers). Mechanical only, not a semantic verdict.

## Method

1. For every entry I recomputed the B0 unit (queue tuple, `git show <base>:<path>`) and the successor unit(s) at `e6b7efeec:<path>` using the production extractor, then sliced real text (heading units: heading line plus section payload up to the next heading, as the digest is defined).
2. Classification of the 565 entries: 472 `same` (successor digest equals B0 digest, so the text is byte-identical), 59 `changed` successor (44 headings, 14 blocks, 1 file block), 34 `none` (identityGaps/retiredUnits with no successor, content judged against the best F counterpart).
3. For all 472 `same` entries I verified: text equal, successor found, exactly one unit with that digest in F, `currentNative` anchor/digest equal to the successor. 375 of them moved anchor index (earlier insertions); the native claim was re-anchored accordingly. Context diffs (`previous`/`next`) are explained by neighbouring unit edits.
4. For every entry whose content changed (59 changed plus 34 none, 93 rows) I diffed B0 against F inline and read both directions for dropped statements. All relative links added in changed text (106 in total) were resolved against `e6b7efeec` including anchors: 0 broken.
5. Cross-checks: A45 renumbering (CTR010 stays Gateway, CTR011 confinement) against the registry rows; `src/runner/main-checkout-lock.mjs` absent and `src/runner/repo-locks.mjs` present on main (`eab4d617b`); milestone name `first-independent-verdicts-linked` still present twice in `architecture-intent.md`; manifest JSON valid.

## Seed and draw

Seed (held by reviewer, generated fresh): `a38-own-displaced-candidate-01-20551da5beab`. Python `random.Random(seed).sample` over the entry ids in index order per set, k = max(10, ceil(15%)) (all when 10 or fewer). Mandatory/high-risk rows added: every `historical` disposition row (49) and every row whose successor digest changed (heading rewrites), because those are the only rows where Phase 7 changed content.

| Set | Entries | Seeded draw | Mandatory added | Deep reads |
|---|---|---|---|---|
| displaced-unheaded-block-candidate | 497 | 75 | 41 | 116 |
| displaced-heading-candidate | 67 | 11 | 36 | 47 |
| displaced-file-block-candidate | 1 | 1 | 0 | 1 |

Drawn ids (seeded):

- displaced-unheaded-block-candidate seeded: 0235, 0246, 0257, 0282, 0287, 0289, 0293, 0297, 0298, 0308, 0315, 0317, 0318, 0326, 0329, 0338, 0340, 0342, 0362, 0363, 0364, 0368, 0370, 0372, 0374, 0396, 0401, 0402, 0404, 0413, 0421, 0433, 0440, 0456, 0458, 0463, 0478, 0497, 0499, 0501, 0502, 0507, 0527, 0528, 0536, 0537, 0548, 0556, 0585, 0590, 0593, 0594, 0595, 0611, 0626, 0627, 0638, 0639, 0644, 0646, 0647, 0649, 0659, 0661, 0666, 0672, 0674, 0679, 0690, 0694, 0701, 0713, 0740, 0744, 0766
- displaced-unheaded-block-candidate mandatory (not in seed): 0216, 0220, 0226, 0291, 0301, 0306, 0310, 0467, 0472, 0475, 0533, 0539, 0543, 0554, 0558, 0559, 0563, 0568, 0583, 0587, 0603, 0607, 0612, 0616, 0623, 0633, 0715, 0719, 0720, 0724, 0728, 0731, 0736, 0749, 0754, 0759, 0762, 0765, 0767, 0772, 0776
- displaced-heading-candidate seeded: 0229, 0273, 0542, 0604, 0632, 0634, 0678, 0712, 0730, 0742, 0768
- displaced-heading-candidate mandatory (not in seed): 0214, 0219, 0224, 0290, 0292, 0296, 0300, 0304, 0309, 0313, 0385, 0532, 0538, 0546, 0551, 0557, 0562, 0581, 0602, 0606, 0610, 0615, 0619, 0622, 0636, 0718, 0722, 0727, 0734, 0737, 0747, 0752, 0756, 0764, 0771, 0775
- displaced-file-block-candidate seeded: 0530
- displaced-file-block-candidate mandatory (not in seed): 

(Ids are `displaced-NNNN`.) Minimum deep reads met: blocks 116 vs 75, headings 47 vs 11, file block 1 vs 1.

## Rework items (exact fixes)

R1. Wrong line citations into `docs/specs/runner.md`. Entries displaced-0718 (heading `bảng-đối-chiếu-từ-vựng-dispatch`), displaced-0719 (unheaded-block-4), displaced-0720 (unheaded-block-5), all in `docs/platform/runner/architecture/h-7af1f0242611.md`. Phase 7 changed `runner.md:2434` to `runner.md:2890` and `runner.md:2172-2180` to `runner.md:2470,2602`. On `e6b7efeec` (and on `eab4d617b`, `9ac0f42fb`) `docs/specs/runner.md` has `### 0034` at line 2897, the 2x2 grid text ("Xếp thành lưới 2×2") at lines 2477 and 2609, and `### 0031` at line 2590. All three new citations are 7 lines early (2890 lands in ADR 0033's tail). Fix: `runner.md:2890` becomes `runner.md:2897` (both places, ADR 0034); `runner.md:2470,2602` becomes `runner.md:2477,2609`. Better: cite by heading (`### 0034`, `### 0031`) so the number cannot drift.

R2. Wrong line citation into `bin/fgos.mjs`. Entries displaced-0730 (heading `gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve`) and displaced-0731 (unheaded-block-26), in `docs/platform/runner/operations/h-51f5cd7279fd.md`. Phase 7 changed `bin/fgos.mjs:4415,4503` to `bin/fgos.mjs:4410,4498`, described as the lines where `evolve --help` returns "unknown verb". On every pin checked (`8b2ee4dd9`, `eab4d617b`, `e6b7efeec`, `9ac0f42fb`, `92af7c8d6`) the two `unknown verb` throws are at lines 4426 and 4514; 4410 and 4498 are unrelated code. Fix: replace with `bin/fgos.mjs:4426,4514`.

Both are factual-citation errors in carried text, not rationale wording. The units' bindings (retained identity / historical gap) stay correct once the text is fixed; no re-carry of the native claims is needed beyond the content edit. They are ledger-independent edits to candidate content, so per the request they go back to N1 author item 1; this review applies none.

## Rework rate

| Set | Deep reads | Rework entries | Rate |
|---|---|---|---|
| displaced-unheaded-block-candidate | 116 | 3 (0719, 0720, 0731) | 2.6% |
| displaced-heading-candidate | 47 | 2 (0718, 0730) | 4.3% |
| displaced-file-block-candidate | 1 | 0 | 0% |
| Total | 164 | 5 entries (2 distinct defects) | 3.0% entries, 1.2% distinct |

The heading rate is over 3% on a small base and the total sits at the threshold (5/164). The whole-set read the rule would trigger is already satisfied in substance: every entry whose content changed between B0 and F (all 93 rows with changed or no-successor content) was read both ways, and the remaining 472 entries have byte-identical text, mechanically verified across the whole set (not just the draw) as equal, unique in F and correctly re-anchored. No further defect class was found beyond R1 and R2.

## Non-rework notes

- displaced-0583 is in `retiredUnits` (retired at B0, `retain-as-evidence`, no target). F has a near-identical successor block (`locks/` layout). Retaining it as evidence without a graft is conservative and consistent with the "no live counterpart or approval claimed" rationale; not a defect.
- displaced-0765, 0766, 0767 (and heading 0764) rewrite the `architecture-intent.md` section 11 table into historical-versus-current statements. Old claims are restated as historical and the proposal intent is kept explicitly; milestone and surface names still exist elsewhere in the file.
- The 34 no-successor rows are all `identityGaps` historical rows: their text was either replaced in place by a new unit (reviewed against it) or still exists byte-identical elsewhere in F. Nothing is lost.
- Post-B0 main-authored lock/event-store content appears in many diffs (holder-lock, Event Store, RUL101-103). I checked that each replaced statement has a replacement; I did not audit those facts against main, which is Phase 9 import accounting per A46.

## Per-entry verdicts (all deep reads, `deep`)

| Set | Entry | Drawn by | Path | B0 anchor | Verdict | Evidence |
|---|---|---|---|---|---|---|
| unheaded-block-candidate | 0216 | mandatory | README.md | unheaded-block-6 | ok | deep: area registry: bare names become links, new area rows added, no row removed; added links resolve |
| unheaded-block-candidate | 0220 | mandatory | README.md | unheaded-block-8 | ok | deep: step 1 and 7 reworded to candidate links, step 7 extended; no step dropped; added links resolve |
| unheaded-block-candidate | 0226 | mandatory | agent-confinement/history/rollout-and-settled-facts.md | unheaded-block-6 | ok | deep: CTR010 to CTR011 per A45; Phase 9 cutover note; meaning kept |
| unheaded-block-candidate | 0235 | seed | agent-coordination/contracts/assignment-run-runresult.md | unheaded-block-10 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0246 | seed | agent-coordination/contracts/assignment-run-runresult.md | unheaded-block-21 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0257 | seed | agent-coordination/contracts/assignment-run-runresult.md | unheaded-block-32 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0282 | seed | agent-coordination/contracts/workflow-stage-operation.md | unheaded-block-11 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0287 | seed | agent-coordination/contracts/workflow-stage-operation.md | unheaded-block-16 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0289 | seed | architecture-map.md | unheaded-block-54 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0291 | mandatory | architecture-map.md | unheaded-block-55 | ok | deep: CTR010 to CTR011 in component row, row text otherwise equal |
| unheaded-block-candidate | 0293 | seed | architecture-map.md | unheaded-block-56 | ok | deep: CTR010 to CTR011 in slice row, otherwise equal |
| unheaded-block-candidate | 0297 | seed | architecture-map.md | unheaded-block-58 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0298 | seed | architecture-map.md | unheaded-block-59 | ok | deep: CTR010 re-pointed to Gateway REST row; confinement row kept verbatim as CTR011 plus label note; CTR012/013 added |
| unheaded-block-candidate | 0301 | mandatory | component-boundary.md | unheaded-block-1 | ok | deep: date bump only |
| unheaded-block-candidate | 0306 | mandatory | component-boundary.md | unheaded-block-11 | ok | deep: adds Process, Holder-lock, Event Store component rows; existing rows intact |
| unheaded-block-candidate | 0308 | seed | component-boundary.md | unheaded-block-12 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0310 | mandatory | component-boundary.md | unheaded-block-13 | ok | deep: adds two related-file rows; existing rows intact |
| unheaded-block-candidate | 0315 | seed | component-boundary.md | unheaded-block-28 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0317 | seed | component-boundary.md | unheaded-block-30 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0318 | seed | component-boundary.md | unheaded-block-31 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0326 | seed | component-boundary.md | unheaded-block-39 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0329 | seed | component-boundary.md | unheaded-block-42 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0338 | seed | component-boundary.md | unheaded-block-51 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0340 | seed | component-boundary.md | unheaded-block-53 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0342 | seed | component-boundary.md | unheaded-block-55 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0362 | seed | component-boundary.md | unheaded-block-75 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0363 | seed | component-boundary.md | unheaded-block-76 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0364 | seed | component-boundary.md | unheaded-block-77 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0368 | seed | component-boundary.md | unheaded-block-81 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0370 | seed | component-boundary.md | unheaded-block-83 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0372 | seed | component-boundary.md | unheaded-block-85 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0374 | seed | component-boundary.md | unheaded-block-87 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0396 | seed | component-boundary.md | unheaded-block-108 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0401 | seed | component-boundary.md | unheaded-block-113 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0402 | seed | component-boundary.md | unheaded-block-114 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0404 | seed | component-boundary.md | unheaded-block-116 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0413 | seed | component-boundary.md | unheaded-block-125 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0421 | seed | component-boundary.md | unheaded-block-133 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0433 | seed | component-boundary.md | unheaded-block-145 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0440 | seed | component-boundary.md | unheaded-block-152 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0456 | seed | component-boundary.md | unheaded-block-168 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0458 | seed | component-boundary.md | unheaded-block-170 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0463 | seed | component-boundary.md | unheaded-block-175 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0467 | mandatory | component-boundary.md | unheaded-block-179 | ok | deep: text byte-identical to a unit still present in F (several identical occurrences), content not lost; claim retained as historical gap by design |
| unheaded-block-candidate | 0472 | mandatory | component-boundary.md | unheaded-block-184 | ok | deep: text byte-identical to a unit still present in F (several identical occurrences), content not lost; claim retained as historical gap by design |
| unheaded-block-candidate | 0475 | mandatory | component-boundary.md | unheaded-block-187 | ok | deep: text byte-identical to a unit still present in F (several identical occurrences), content not lost; claim retained as historical gap by design |
| unheaded-block-candidate | 0478 | seed | component-boundary.md | unheaded-block-190 | ok | deep: text byte-identical to a unit still present in F (several identical occurrences), content not lost; claim retained as historical gap by design |
| unheaded-block-candidate | 0497 | seed | component-boundary.md | unheaded-block-209 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0499 | seed | component-boundary.md | unheaded-block-211 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0501 | seed | component-boundary.md | unheaded-block-213 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0502 | seed | component-boundary.md | unheaded-block-214 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0507 | seed | component-boundary.md | unheaded-block-219 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0527 | seed | component-boundary.md | unheaded-block-239 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0528 | seed | component-boundary.md | unheaded-block-240 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0533 | mandatory | host-invocation-routing/architecture/host-use-cases.md | unheaded-block-5 | ok | deep: link path corrected to archive/plans (only the display path changed) |
| unheaded-block-candidate | 0536 | seed | observe/decisions/observe-component-architecture.md | unheaded-block-3 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0537 | seed | observe/spec.md | unheaded-block-4 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0539 | mandatory | observe/spec.md | unheaded-block-5 | ok | deep: observe store lock: O_EXCL pid/ttl lock replaced by holder-lock kernel lock description incl. tombstone note; nothing dropped without replacement |
| unheaded-block-candidate | 0543 | mandatory | observe/spec.md | unheaded-block-8 | ok | deep: observe store lock: O_EXCL pid/ttl lock replaced by holder-lock kernel lock description incl. tombstone note; nothing dropped without replacement |
| unheaded-block-candidate | 0548 | seed | packaging-distribution/architecture/runtime-identity-and-activation.md | unheaded-block-49 | ok | deep: install.lock wording to kernel lock path |
| unheaded-block-candidate | 0554 | mandatory | packaging-distribution/contracts/activation-binding.md | unheaded-block-15 | ok | deep: activation/install locks stated as kernel locks; adds Windows refusal; prior duties kept |
| unheaded-block-candidate | 0556 | seed | packaging-distribution/contracts/instruction-composition-and-projection.md | unheaded-block-3 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0558 | mandatory | packaging-distribution/contracts/instruction-composition-and-projection.md | unheaded-block-4 | ok | deep: composition ownership split with Agent Context Engine (RUL102); rows/sentences re-stated, packaging duties kept |
| unheaded-block-candidate | 0559 | mandatory | packaging-distribution/contracts/instruction-composition-and-projection.md | unheaded-block-5 | ok | deep: composition ownership split with Agent Context Engine (RUL102); rows/sentences re-stated, packaging duties kept |
| unheaded-block-candidate | 0563 | mandatory | packaging-distribution/contracts/repository-runtime-layout.md | unheaded-block-4 | ok | deep: layout tree shows locks/install.lock and activation lock note; install.lock not lost (moved) |
| unheaded-block-candidate | 0568 | mandatory | packaging-distribution/contracts/repository-runtime-layout.md | unheaded-block-8 | ok | deep: text byte-identical to a unit still present in F (several identical occurrences), content not lost; claim retained as historical gap by design |
| unheaded-block-candidate | 0583 | mandatory | packaging-distribution/contracts/repository-runtime-layout.md | unheaded-block-22 | ok | deep: retiredUnits (retired at B0 as retain-as-evidence); near-identical successor block exists in F with locks/ layout; no approval claimed |
| unheaded-block-candidate | 0585 | seed | packaging-distribution/contracts/repository-runtime-layout.md | unheaded-block-24 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0587 | mandatory | packaging-distribution/contracts/repository-runtime-layout.md | unheaded-block-26 | ok | deep: text byte-identical to a unit still present in F (several identical occurrences), content not lost; claim retained as historical gap by design |
| unheaded-block-candidate | 0590 | seed | packaging-distribution/contracts/repository-runtime-layout.md | unheaded-block-29 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0593 | seed | packaging-distribution/contracts/repository-runtime-layout.md | unheaded-block-32 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0594 | seed | packaging-distribution/contracts/repository-runtime-layout.md | unheaded-block-33 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0595 | seed | packaging-distribution/contracts/repository-runtime-layout.md | unheaded-block-34 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0603 | mandatory | packaging-distribution/contracts/setup-doctor-registry.md | unheaded-block-22 | ok | deep: setup creates lock dirs, lock config key, lock-fences step; permitted-modification sentence extended |
| unheaded-block-candidate | 0607 | mandatory | packaging-distribution/spec.md | unheaded-block-43 | ok | deep: section 9 intro gains ownership sentence; original sentence retained verbatim as prefix |
| unheaded-block-candidate | 0611 | seed | packaging-distribution/spec.md | unheaded-block-80 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0612 | mandatory | packaging-distribution/spec.md | unheaded-block-81 | ok | deep: updated date bump only |
| unheaded-block-candidate | 0616 | mandatory | packaging-distribution/spec.md | unheaded-block-85 | ok | deep: provider-capacity lock text and doctor/fix registry rows updated for holder-lock and new checks; row 5g added |
| unheaded-block-candidate | 0623 | mandatory | packaging-distribution/spec.md | unheaded-block-92 | ok | deep: adds a dated history bullet (RUL102); nothing removed |
| unheaded-block-candidate | 0626 | seed | packaging-distribution/spec.md | unheaded-block-94 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0627 | seed | packaging-distribution/spec.md | unheaded-block-95 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0633 | mandatory | platform-foundations.md | unheaded-block-6 | ok | deep: L3 row annotated with D-ADR0055 supersession; L10 row added |
| unheaded-block-candidate | 0638 | seed | platform-foundations.md | unheaded-block-29 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0639 | seed | platform-foundations.md | unheaded-block-30 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0644 | seed | platform-foundations.md | unheaded-block-35 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0646 | seed | platform-foundations.md | unheaded-block-37 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0647 | seed | platform-foundations.md | unheaded-block-38 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0649 | seed | platform-foundations.md | unheaded-block-40 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0659 | seed | platform-foundations.md | unheaded-block-50 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0661 | seed | platform-foundations.md | unheaded-block-52 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0666 | seed | platform-foundations.md | unheaded-block-57 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0672 | seed | platform-foundations.md | unheaded-block-63 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0674 | seed | platform-foundations.md | unheaded-block-65 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0679 | seed | proposals/component-authority-boundary-map.md | unheaded-block-53 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0690 | seed | proposals/component-authority-boundary-map.md | unheaded-block-64 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0694 | seed | proposals/component-authority-boundary-map.md | unheaded-block-68 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0701 | seed | proposals/component-authority-boundary-map.md | unheaded-block-75 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0713 | seed | runner/architecture/h-69197b459754.md | unheaded-block-3 | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| unheaded-block-candidate | 0715 | mandatory | runner/architecture/h-69197b459754.md | unheaded-block-12 | ok | deep: workflow advance lock described as kernel mutex; pid now from holder list |
| unheaded-block-candidate | 0719 | mandatory | runner/architecture/h-7af1f0242611.md | unheaded-block-4 | rework | deep: citation line numbers refreshed but off by 7 against current docs/specs/runner.md (REWORK R1) |
| unheaded-block-candidate | 0720 | mandatory | runner/architecture/h-7af1f0242611.md | unheaded-block-5 | rework | deep: citation line numbers refreshed but off by 7 against current docs/specs/runner.md (REWORK R1) |
| unheaded-block-candidate | 0724 | mandatory | runner/architecture/h-e53a3a9829a8.md | unheaded-block-4 | ok | deep: guard action clear-cwd-lock now report-only, kernel lock leaves no dead file (RUL101) |
| unheaded-block-candidate | 0728 | mandatory | runner/decisions/h-36d872fbb0e5.md | unheaded-block-190 | ok | deep: dispatch-- locks noted gone since 2026-10-17 (RUL101) |
| unheaded-block-candidate | 0731 | mandatory | runner/operations/h-51f5cd7279fd.md | unheaded-block-26 | rework | deep: bin/fgos.mjs citation 4410,4498 does not match the unknown-verb lines (REWORK R2) |
| unheaded-block-candidate | 0736 | mandatory | runner/operations/h-51f5cd7279fd.md | unheaded-block-33 | ok | deep: sessions.lock described as kernel mutex under .fgos/locks |
| unheaded-block-candidate | 0740 | seed | runner/operations/h-51f5cd7279fd.md | unheaded-block-37 | ok | deep: stale-lock delay sentence replaced (kernel releases at once) |
| unheaded-block-candidate | 0744 | seed | runner/operations/h-51f5cd7279fd.md | unheaded-block-40 | ok | deep: main-checkout activity lock hook described with kernel try-lock/borrow; nothing dropped without replacement |
| unheaded-block-candidate | 0749 | mandatory | runner/spec.md | unheaded-block-7 | ok | deep: tier cells/maxTier (RUL102/103) and provider-state kernel mutex added; old state.lock replaced |
| unheaded-block-candidate | 0754 | mandatory | runner/spec.md | unheaded-block-13 | ok | deep: main-checkout-lock.mjs replaced by repo-locks.mjs (exists on main; old file absent); kernel lock model stated; no behaviour dropped without replacement |
| unheaded-block-candidate | 0759 | mandatory | runner/subcomponents/h-6979005beaf7/spec.md | unheaded-block-7 | ok | deep: RUL49/50 re-stated for kernel mutex; RUL101-103 added; account lock/dispatch lock text updated |
| unheaded-block-candidate | 0762 | mandatory | runner/subcomponents/h-6979005beaf7/spec.md | unheaded-block-36 | ok | deep: provider account lock and dispatch lock text moved to kernel semantics; residual note removed with its cause |
| unheaded-block-candidate | 0765 | mandatory | system-architecture/architecture/architecture-intent.md | unheaded-block-60 | ok | deep: section 11 re-framed as historical vs current; milestone name still present elsewhere (2 occurrences); proposal intent preserved |
| unheaded-block-candidate | 0766 | seed | system-architecture/architecture/architecture-intent.md | unheaded-block-61 | ok | deep: section 11 re-framed as historical vs current; milestone name still present elsewhere (2 occurrences); proposal intent preserved |
| unheaded-block-candidate | 0767 | mandatory | system-architecture/architecture/architecture-intent.md | unheaded-block-62 | ok | deep: section 11 re-framed as historical vs current; milestone name still present elsewhere (2 occurrences); proposal intent preserved |
| unheaded-block-candidate | 0772 | mandatory | work-state/README.md | unheaded-block-4 | ok | deep: adds one read-first row; link resolves |
| unheaded-block-candidate | 0776 | mandatory | work-state/spec.md | unheaded-block-93 | ok | deep: RUL10 notes threshold reached and D-ADR0055 redesign |
| heading-candidate | 0214 | mandatory | README.md | 2-area-registry | ok | deep: area registry: bare names become links, new area rows added, no row removed; added links resolve |
| heading-candidate | 0219 | mandatory | README.md | 4-how-to-change-platform-doc | ok | deep: step 1 and 7 reworded to candidate links, step 7 extended; no step dropped; added links resolve |
| heading-candidate | 0224 | mandatory | agent-confinement/history/rollout-and-settled-facts.md | 13-kết-quả-giải-quyết-rủi-ro | ok | deep: CTR010 to CTR011 per A45; Phase 9 cutover note; meaning kept |
| heading-candidate | 0229 | seed | agent-coordination/contracts/assignment-run-runresult.md | assignment | ok | deep: adds registry id CTR013 line; original text intact |
| heading-candidate | 0273 | seed | agent-coordination/contracts/workflow-stage-operation.md | contract | ok | deep: adds registry id CTR012 line; original text intact |
| heading-candidate | 0290 | mandatory | architecture-map.md | component-live-1414-file-có- | ok | deep: CTR010 to CTR011 in component row, row text otherwise equal |
| heading-candidate | 0292 | mandatory | architecture-map.md | slice-live-tính-năng-xuyên-t | ok | deep: CTR010 to CTR011 in slice row, otherwise equal |
| heading-candidate | 0296 | mandatory | architecture-map.md | 7-sổ-đăng-ký-contract | ok | deep: CTR010 re-pointed to Gateway REST row; confinement row kept verbatim as CTR011 plus label note; CTR012/013 added |
| heading-candidate | 0300 | mandatory | component-boundary.md | component-boundary | ok | deep: Last reviewed date bump only |
| heading-candidate | 0304 | mandatory | component-boundary.md | 4-current-high-level-compone | ok | deep: adds Process, Holder-lock, Event Store component rows; existing rows intact |
| heading-candidate | 0309 | mandatory | component-boundary.md | 6-related-files | ok | deep: adds two related-file rows; existing rows intact |
| heading-candidate | 0313 | mandatory | component-boundary.md | 3-recommended-responsibility | ok | deep: adds historical/deferred advisory note; original intact; link resolves |
| heading-candidate | 0385 | mandatory | component-boundary.md | 13-team-cognition-and-protoc | ok | deep: adds historical/deferred proposal note; original intact; link resolves |
| heading-candidate | 0532 | mandatory | host-invocation-routing/architecture/host-use-cases.md | 4-related-files | ok | deep: link path corrected to archive/plans (only the display path changed) |
| heading-candidate | 0538 | mandatory | observe/spec.md | owns | ok | deep: observe store lock: O_EXCL pid/ttl lock replaced by holder-lock kernel lock description incl. tombstone note; nothing dropped without replacement |
| heading-candidate | 0542 | seed | observe/spec.md | 3-storage-model | ok | deep: observe store lock: O_EXCL pid/ttl lock replaced by holder-lock kernel lock description incl. tombstone note; nothing dropped without replacement |
| heading-candidate | 0546 | mandatory | packaging-distribution/architecture/runtime-identity-and-activation.md | 14-walking-skeleton | ok | deep: install.lock wording to kernel lock path |
| heading-candidate | 0551 | mandatory | packaging-distribution/contracts/activation-binding.md | 6-workspaceactivationbinding | ok | deep: activation/install locks stated as kernel locks; adds Windows refusal; prior duties kept |
| heading-candidate | 0557 | mandatory | packaging-distribution/contracts/instruction-composition-and-projection.md | 2-boundary | ok | deep: composition ownership split with Agent Context Engine (RUL102); rows/sentences re-stated, packaging duties kept |
| heading-candidate | 0562 | mandatory | packaging-distribution/contracts/repository-runtime-layout.md | 2-minimum-layout | ok | deep: layout tree shows locks/install.lock and activation lock note; install.lock not lost (moved) |
| heading-candidate | 0581 | mandatory | packaging-distribution/contracts/repository-runtime-layout.md | 3-roots-and-on-disk-shape | ok | deep: layout tree shows locks/install.lock and activation lock note; install.lock not lost (moved) |
| heading-candidate | 0602 | mandatory | packaging-distribution/contracts/setup-doctor-registry.md | setup | ok | deep: setup creates lock dirs, lock config key, lock-fences step; permitted-modification sentence extended |
| heading-candidate | 0604 | seed | packaging-distribution/contracts/setup-doctor-registry.md | doctor | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| heading-candidate | 0606 | mandatory | packaging-distribution/spec.md | 9-instruction-composition-an | ok | deep: section 9 intro gains ownership sentence; original sentence retained verbatim as prefix |
| heading-candidate | 0610 | mandatory | packaging-distribution/spec.md | retained-distribution-source | ok | deep: updated date bump only |
| heading-candidate | 0615 | mandatory | packaging-distribution/spec.md | data-dictionary | ok | deep: provider-capacity lock text and doctor/fix registry rows updated for holder-lock and new checks; row 5g added |
| heading-candidate | 0619 | mandatory | packaging-distribution/spec.md | business-rules | ok | deep: adds RUL18 and sub-bullets; nothing removed |
| heading-candidate | 0622 | mandatory | packaging-distribution/spec.md | lịch-sử-quyết-định | ok | deep: adds three dated history entries; nothing removed |
| heading-candidate | 0632 | seed | platform-foundations.md | 3-law-summary | ok | deep: L3 row annotated with D-ADR0055 supersession; L10 row added |
| heading-candidate | 0634 | seed | platform-foundations.md | 4-design-gate | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| heading-candidate | 0636 | mandatory | platform-foundations.md | l3-luật-store-truth-ở-jsonl- | ok | deep: adds supersession note under L3; original intact |
| heading-candidate | 0678 | seed | proposals/component-authority-boundary-map.md | 11-four-coordination-rings | ok | deep: adds A43 guard sentence; link resolves |
| heading-candidate | 0712 | seed | runner/architecture/h-69197b459754.md | dispatch-operability-impleme | ok | deep: workflow advance lock described as kernel mutex; pid now from holder list |
| heading-candidate | 0718 | mandatory | runner/architecture/h-7af1f0242611.md | bảng-đối-chiếu-từ-vựng-dispa | rework | deep: citation line numbers refreshed but off by 7 against current docs/specs/runner.md (REWORK R1) |
| heading-candidate | 0722 | mandatory | runner/architecture/h-e53a3a9829a8.md | guard-reconciliation | ok | deep: guard action clear-cwd-lock now report-only, kernel lock leaves no dead file (RUL101) |
| heading-candidate | 0727 | mandatory | runner/decisions/h-36d872fbb0e5.md | 0064-hook-commit-để-lại-đèn- | ok | deep: dispatch-- locks noted gone since 2026-10-17 (RUL101) |
| heading-candidate | 0730 | seed | runner/operations/h-51f5cd7279fd.md | gate-a-xếp-hạng-candidate-bắ | rework | deep: bin/fgos.mjs citation 4410,4498 does not match the unknown-verb lines (REWORK R2) |
| heading-candidate | 0734 | mandatory | runner/operations/h-51f5cd7279fd.md | phiên-checkout-đa-phiên-sess | ok | deep: sessions.lock described as kernel mutex under .fgos/locks |
| heading-candidate | 0737 | mandatory | runner/operations/h-51f5cd7279fd.md | bảo-vệ-approve-khỏi-lồng-phi | ok | deep: stale-lock delay sentence replaced (kernel releases at once) |
| heading-candidate | 0742 | seed | runner/operations/h-51f5cd7279fd.md | khóa-hoạt-động-cây-chính-chặ | ok | deep: main-checkout activity lock hook described with kernel try-lock/borrow; nothing dropped without replacement |
| heading-candidate | 0747 | mandatory | runner/spec.md | historical-source-section-55 | ok | deep: tier cells/maxTier (RUL102/103) and provider-state kernel mutex added; old state.lock replaced |
| heading-candidate | 0752 | mandatory | runner/spec.md | historical-source-section-4e | ok | deep: main-checkout-lock.mjs replaced by repo-locks.mjs (exists on main; old file absent); kernel lock model stated; no behaviour dropped without replacement |
| heading-candidate | 0756 | mandatory | runner/subcomponents/h-6979005beaf7/spec.md | business-rules | ok | deep: RUL49/50 re-stated for kernel mutex; RUL101-103 added; account lock/dispatch lock text updated |
| heading-candidate | 0764 | mandatory | system-architecture/architecture/architecture-intent.md | 11-current-system-fit-and-co | ok | deep: section 11 re-framed as historical vs current; milestone name still present elsewhere (2 occurrences); proposal intent preserved |
| heading-candidate | 0768 | seed | system-architecture/architecture/architecture-intent.md | 12-architecture-change-size | ok | deep: B0 text == F successor text (digest equal, unique in F) |
| heading-candidate | 0771 | mandatory | work-state/README.md | 2-read-first | ok | deep: adds one read-first row; link resolves |
| heading-candidate | 0775 | mandatory | work-state/spec.md | 11-business-rules | ok | deep: RUL10 notes threshold reached and D-ADR0055 redesign |
| file-block-candidate | 0530 | seed | contracts/architecture-manifest.json | file-block | ok | deep: manifest: removes src/runner/main-checkout-lock.mjs (deleted on main, repo-locks.mjs exists), adds holder-lock and related entries; JSON valid |

Status: DONE_WITH_CONCERNS
Summary: 164 deep reads (116 blocks, 47 headings, 1 file block), all 565 entries mechanically verified (parts 026-036 auth passes, no approvals carried). 159 ok, 5 rework entries from 2 distinct defects: stale/wrong line citations (R1 runner.md off by 7 in 3 entries, R2 bin/fgos.mjs 4410,4498 should be 4426,4514 in 2 entries). Bindings, successors and retirements are otherwise correct; nothing lost.
