# Phase 9 pre-flip — Lead and owner answers

Entries `L13-n`. Phase 8 records (`../phase-08/owner-answers.md`, L12-*) stay historical.

## L13-1 — W0 prep (Lead, 2026-10-23)

Under L12-137. Main import **022c0ee67** (origin/main `28127bc15`, 118 commits): conflicts in `CHANGELOG.md`, holder-lock spec history and the lock-registry schema owner enum, all resolved as unions; census regenerated; selectors and vectors `--check` exit 0; lease test 15/15; registrations 55/60 (known worktree-location five). Board: Git §7 consent requested (`28127bc15`), SEAT agreed to stage a `docs-lease` release from the cutover candidate commit (staging only). `review-batches.json`: of 423 composed specs, **387 reviewable now**, **36 deferred to G9** (26 in D1 writable dirs, 9 changed bytes at M1, 1 in D3 writable files); G7 batches c1 73 / c2 68 / c3 68 / c4 41 / c5 60 / c6 30 / c7 47; G0 batches b1 55 / b2 50 / b3 42 / b4 22 / b5 22. `preflip-gate-status.json` initialised (all unmet).

## L13-2 — Git one-door: no Git component extension from DOC (Lead under A42, 2026-10-23 19:20)

D3 stopped at `scripts/check-evidence-relocation.mjs`: it needs live-index mode/blob/stage (incl. unborn repos), which the existing Inspect port does not expose; extending it means `packages/git/rust/src/inspect.rs` + node addon + tests, i.e. the Git component of another lane. Decision: DOC does **not** extend `packages/git` (RUL104 better-not-bigger; most of these sites are documentation-migration tooling that retires after Phase 10). D3 migrates every site an existing typed port already serves; each site that would need a new port capability becomes an **exemption candidate** with its reason, the missing capability, and a retirement condition, batched into the owner packet with stop S1 (`.githooks/pre-commit:507`). If the owner prefers the port extension, it is filed as a Git-lane item, not done here.

## L13-3 — W1 close and pinned reproduction tooling (Lead under A42, 2026-10-23 20:05)

W1 Doers: D1 pass (`e7b082b92` → picked `f534aeaea`), D2 blocked-partial with outputs verified and committed by the Lead (`ae17b7c02` → `5fe778624`; 15 parks left, test-fixture git repos under /tmp were disclosed and are acceptable), D3 pass after L13-2 (`941511247`+`5e77b60a0` → `898989f21`+`fc23b59c6`; census undeclared 58 → 19), D4 pass (`e708e9329` → `bade6b6b3`). Linear cherry-pick, no conflicts. Pair accounting `949e24c22`: 153 pairs per manifest; check A green.
Check B now fails: D3 changed two scripts whose blob ids the phase-06 reproductions pin (`scripts/generate-doc-inventory.mjs`, `scripts/generate-shipped-path-inventory.mjs`). Ruling: pinned reproduction tooling stays byte-identical to its pin (no rebaseline); D3b restores them, reworks the importers, and lists their git sites as exemption candidates (retire with the reproduction manifests). W2 briefs: `w2-d3b`, `w2-g0fix`, `w2-d2b`, `w2-d5`.

## L13-4 — Late legacy areas and the four holder blockers (Lead under A42, 2026-10-23 20:45)

Finding: `docs/specs/seat-binding.md` (added 2026-10-20, 462 lines) and `docs/specs/workflow.md` (added 2026-10-19, 680 lines) post-date the Phase 2/6 inventory pin and were never transformed; ratchet exceptions admitted them. `docs/specs/enduser-docs-authoring.md` / `enduser-docs-index.md` are routed but have no live platform holder. Cutover deletes `docs/specs/**`, so these would lose their only holder. The packaging (G3 review) and runner (G1 review) candidates also lag their legacy sources. Rulings:
1. **New area specs** `docs/platform/seat-binding/spec.md` and `docs/platform/workflow/spec.md` (component-boundary already names both components): verbatim carry of the legacy specs with full bindings, same method as Phase 6.
2. **End-user docs contracts**: carried as new sections of `docs/platform/work-state/contracts/knowledge-registry.md` (the registry owns the data the index projects); generator `src/report/enduser-index-generate.mjs` and doctor check `enduser-docs-index-stale` named as code truth.
3. **architecture-intent evidence rows**: evidence/Related links may point to carriers or history when labelled (not authority claims): system vision → `docs/platform/vision.md`; Step 09 → a new section of `docs/platform/agent-coordination/spec.md`; Step 10 → its proposal carrier labelled "proposal, coding domain"; component authority map → `docs/platform/component-boundary.md`; intent ledger → `docs/platform/intent-preservation-ledger.md` labelled Draft (acceptance is a separate decision, not taken here); CoordinationSession/FlowDefinition → the retired-engine history files labelled retired.
4. **Drift scan**: G9 must enumerate every legacy file under `docs/specs/**`, `docs/architect/**` added or changed after the inventory pin, not only recorded sources; the runner area gets the same re-sync packaging got. Wave-2 Doer D6 (`w2-d6-brief.md`) does 1, 2, the drift scan and the runner re-sync; D1b fixes the G1/G3 review items.

## L13-5 — Prompt-level write grants and wave-2/3 progress (Lead, 2026-10-23 23:30)

Two writes outside a brief's own writable list were granted by the Lead in the launch prompt and are hereby recorded: G0-fix continuation (turn 662) may write `pilot/decisions/b-io-contract.json` (claim_f5365b8e lives there); D7 (turn 667) may write `docs/platform/seat-binding/spec.md`, `docs/platform/workflow/spec.md` and `docs/platform/work-state/contracts/knowledge-registry.md` for the late-area tidy items. Progress: D3b/D3c (pinned tooling byte-exact, verifier cleanup, census 25 sites all in the exemption proposal), D4b (G2/G6 fixes; delta review 103/1), D6 (late areas), D1b + D7 (legacy drift re-sync: 0 missing in all 33 drifted legacy files at d9bedf229), ledger fix (13,560 rows recomputed under one recipe incl. self-inclusive ancestry and group member digests; 257 gate rows match). Pending: D7b (three D7 review items), D5b (archive), final-pin delta work (W3), the batched owner packet.

## L13-6 — Owner: declare the remaining git sites; re-sync and cut over early (owner decision, 2026-10-23 ~23:45)

Owner answers to the batched decision questions: **(1) "A: Khai miễn trừ cả 25"** — the 25 remaining undeclared git sites (1 cold hook S1, 10 byte-pinned reproduction tooling, 9 missing-capability documentation tooling, 5 project-configured commands) become declared exemptions, each with reason and retirement condition, through a reproducible declaration the scanner reads (no hand-moved census rows), reviewed by the Git owner; no Git component extension. **(2) "C: Đồng bộ + cutover sớm"** — DOC keeps re-syncing legacy drift in batches; as soon as the pre-flip gates are met-local the Lead sends the cutover approval packet so the write freeze starts early. The cutover itself still needs its own approval.

## L13-7 — Full suite attribution and the census hook (Lead, 2026-10-24 12:45)

Full `npm test` in isolated clones: plan branch 77db6ed2b **8,948 / 8,409 pass / 440 fail / 2 cancelled**; main 62ce98513 **8,587 / 369 fail**. 83 branch-only titles classified by a debugger with single-file reruns in both clones (`suite-attribution-77db6ed2b.md`): **A 6** (branch-caused), **B 71** (load: all pass alone in both clones), **C 3** (clone under /tmp unreadable by confinement / allowlisted path), **D 3** (dead-vocabulary guard P7-DOC-GAP-05; two reproduction recipes). The six A: two lease-race mocks read `prepare.call(...)` synchronously but main cca48c63a made native `GitLand.prepare` async; the runner-liveness registry pin was stale after main f06b30fa3. Fixed in 53b2b718f; verified: in the addon-staged /tmp clone `merge-land` 0 exit and `doc-runner-liveness` 0 exit; in a clone outside /tmp (`/home/vantt/projects/fgos-p9-verify-clone`) `run-case-admission` 15/15 and `units-runner` 30/30 (the C rows pass there).
Census hook (main 8ba869cd0): every linked worktree runs the main checkout's hook and scanner; on this branch the commit used `git -c core.hooksPath=<worktree>/.githooks` (no check skipped). `censusDrift` hashed only `kindOf` code files, so the census-recorded declarations JSON always read as drift; fixed in db4b7de4d with an owning test (red without the fix, green with). Both reported to the hook owner on the board (ea7295288).
Disk: the machine reached 97%; the Lead removed this session's reviewer scratch under /tmp/fgos-work (w2-*, w3-*, w4-*, review-*, p8-audit-*; regenerable, nothing uncommitted), 14 GB → 36 GB free. Older `mut*`, `mutbase`, `probe-repo` (2026-10-19, not this track) left untouched.

## L13-8 — Correction to L13-7 and the second gate wave (Lead, 2026-10-24 14:20)

**Dated correction to L13-7 (its text is kept above).**
- **B class.** "B 71 (load: all pass alone in both clones)" is false for three titles. `test/e2e/pr-gate.test.mjs` and `test/e2e/runner-loop.test.mjs` fail alone in both clones; these are residual failures shared with main. The host help `--json` test fails alone in the main clone.
  - True wording: 68 pass alone in both clones, and the suite logs carry watchdog and git-timeout signatures (git timeouts 23 on the branch vs 2 on main, containment-unproven 14 vs 0, 17 files killed by the 600 s watchdog).
  - "Load" is inferred from these signatures, not measured: no load average was recorded, and the branch runs 361 more tests.
  - Source: `reviews/w5-suite-fix-review.{md,json}`.
- **D class.** The two step10 reproduction recipes are not an allowed red. They fail because 217 bound rows per manifest drifted from their target units (`noNewDoubleOwnership`). The drift comes from the legacy resyncs and later doc edits. Brief `w5-rebind-brief.md` rebinds them with a rerunnable `rebind.py --check`, which runs again at the final pin.

**Merged since L13-7:**
- ad94156cf (misc fix), fast-forward.
- 22ff13db5 (archive retained set), merge 1975d4403. This merge commit sits outside the first-parent pair walk of check A, so its paths are covered by its review, not by pair accounting.
- Pairs for 7c50f1552 … ad94156cf (62 per manifest; authorities L12-137, L13-6, L13-7) accounted in 1c7af13dc. A and B are ok on both manifests.

**Reviews:**

| Review | Result | Follow-up |
|---|---|---|
| misc | 9 APPROVE / 2 REWORK: doctor split is 136 + 5, not 133 + 8; example framing must be line-scoped | `w5-misc-rework-brief.md` |
| G4 wrapper | 6 APPROVE / 1 REWORK (High): `.call`, `Reflect.apply` and array-slot callers escape a declared wrapper | `w5-g4-escape-brief.md`. The pre-existing export-alias scan gap goes to the Git owner as an open item, not fixed here |
| suite fix | 3 APPROVE / 1 REWORK | the B-class correction above |

## L13-9 — Review push, rebind rulings and the Work cutover stop (Lead and owner, 2026-10-24 20:30)

**Owner (20:0x, answer A to the decision question):** push a separate review branch `review/doc-git-one-door` to origin for HARDEN. It carries only the commits HARDEN must review: the declarations, the wrapper and escape fixes, and the hook. The push waits for WORK's "cutover xong" board line. No main landing, no cutover, no deletes.

**Lead rulings under A42:**
1. **Ownership rebinds.** The `misc-fix/rebind.py` preimage conflict is resolved in that phase-09 record tool, which now reads its preimages from its own pin. No embedded phase-06 checker changed (L13-3). 217 rows were applied (8e7c6ee93): 93 anchor-only rows keep their status; 124 content rows are pending re-review (A22, `rebind/rereview-claim-ids.json`).
2. **Archive retention is direct links only.** The transitive closure would have kept 637 files / 281,770,653 B and was rejected; its evidence is `archive/link-closure.json`. Four direct ruling targets are kept (783,918 B).
3. **Example framing is scoped to the sentence or table cell (afb5bb35c).** f00445, f08621, f08646 and f08700 keep `preserve-operand-reachability-unchanged`. The general illustrative-placeholder rule is accepted. A span whose path holds a `<placeholder>` is evidence on its own when the reason says illustrative. This moved 51 rows from parked to confirmed (6 → 57 example/placeholder rows; list in `preserve-premise/sentence-delta.json`; review `reviews/w7-header-sentence-review.md`).
4. **Two script fixes by the Lead in this commit:**
   - `preserve-premise/proof.py` now accepts any `/tmp/fgos-work/` output directory, not only one Doer's scratch name.
   - `misc-fix/verify.py` replays the G6 artifacts at the `sourceCommit` that `proof.json` records, not at HEAD. Proof that this is correct: `proof.py --pin 4178dcc6e` output is byte-equal to the committed `proof.json`.

   `misc-fix/verify.py` now exits 0. The combined `preserve-premise/verify.py` still stops only on the G2 census pin; that is a final-pin item, and the review found 33 G2 Rust test locations that also need refreshing.
5. **Check H.** Four contract docs lacked the fenced candidate header block (30ed2bbf4). H now has 0 findings.

**Archive cold timing.** The Lead ran it unconfined, after SEAT agreed to the heavy IO (5c3b57347):
- reduced tip: 2.93 s cold, 2.90 s median;
- pre-freeze tree: 41.70 s cold, 12.44 s median.

Both are under the 120 s Git driver deadline. `verify-design.py` exits 0 at its pin.

**Work cutover stop.** WORK ordered every machine to stop Work writes at 15:00 (board line 14:00). DOC missed that line and launched Doer turns 688 and 689 at 15:01 and 15:08, then let them finish and launched no new turn. DOC's late "đã dừng" line is on origin/main at 7cd761949 (posted by SEAT). DOC launches no `fgos run`, pull or push until "cutover xong".

## L13-10 — G6 exhaustive reviews and file-level framing (Lead, 2026-10-24 21:00)

Exhaustive G6 reviews:
- **Parks** (`reviews/w8-g6-parks-review`): 1,220 APPROVE / 40 REWORK. There are 15 operand-normalization bugs and 25 removed rows that have no next action.
- **Judgments** (`reviews/w8-g6-judgments-review`): 163 APPROVE / 1 REWORK. f07526 needs lines 22, 33 and 37 of the same file handled together.

**Ruling (A42):** add two file-level evidence rules, one for distillery files whose header says they describe an outside or upstream repo, and one for dated reports under `archive/plans/` or `plans/reports/`. Each rule needs negative controls and a quoted marker.
- **Why:** the reviewer's sample found 29 of 40 unconfirmed parks have a real premise outside the one-sentence rule. About 334 rows are affected. Every park is a pre-flip Lead action, so over-parking delays the cutover without making it safer.
- **Scope:** this stays inside the approved G6 method, which is evidence for a preserve premise. It adds no product mechanism.
- Live conventions such as `docs/history/<feature>/` stay parked.

Brief: `w8-g6-fix-brief.md`. It is launched after WORK's "cutover xong" line, because the stop order covers `fgos run`.

**Lead-fix review** (`reviews/w8-lead-fixes-review`): 8 APPROVE / 4 REWORK, all fixed in 25e8842d3.
- The misc, rebind and archive receipts are now current.
- G5 is lowered to `partial`: `docs/reading-map.md` restates the L11-25 banner in English and keeps line 34 only with a Truth-correction suffix. Accepting that restatement goes to the owner in the cutover packet.

## L13-11 — Composition review rulings (Lead, 2026-10-24 21:05)

`reviews/w8-composition-review`: 164 APPROVE / 19 REWORK.
- **Resolved:** both recomposed G7 specs (c5, c7) replay byte-exact.
- **Park actions:** 95 of 101 pass.
- **Members:** all 115 are joined.
- **Rework:** most of it comes from records written before the D6 holders landed in e5af4c501.

**Rulings (A42):**
1. **architecture-intent, 8 rows.** Five links point at the existing candidate copies: proposals step-09, step-10 and component-authority-boundary-map, the system-vision file and team-communication-protocol-v1. The links to the intent ledger, coordination-session and flow-definition are labelled as history of the retired engine. Reason: those three exist only as history, and the other five have live copies.
2. **GAP-05 `dynamic-023895`.** The placement is approved. It is rebased on HEAD with 88 binding overlays, and G0 reviews the overlays.
3. **Citation drift, 142 findings at HEAD.**
   - Exclude `*/history/*` (2 findings).
   - Gloss the 10 branch-only sites on the branch.
   - The 130 sites in docs that main owns are glossed by DOC at final pin F, under the docs lease. The baseline is not widened, because the scan policy forbids a rebaseline. Glossing at F under the lease avoids conflicts with lanes that are still editing those docs.

Brief: `w8-composition-fix-brief.md`, launched after WORK's "cutover xong".

## L13-12 — Review branch push, corrected (owner, 2026-10-24 21:2x)

Correction to L13-9: option A as written could not be done. A review branch that carries only a few commits cannot keep their SHAs without their ancestry. A cherry-pick onto main breaks the tree-wide git census and the git spec on main's base.

Measured cost: the plan history origin does not yet have is 363 MB (16,363 objects). The earlier "~2 GB" figure for option B was wrong; that was the tracked tree size.

**Owner chose A':** push `review/doc-git-one-door` pointing at the plan branch HEAD, with full history and SHAs kept, for HARDEN's G4 and §7 review. The board line goes through SEAT.

Scope: a non-main branch only. No main landing, no documentation cutover, no deletes.

Work cutover: WORK reported "cutover xong" on fg-server2 at 21:00. design-lap is not cut over and must not pull main. Before resuming, DOC checked that `fgos run` writes no Work events: turns 688 and 689 created no `.fgos/events` file, only assignment and runtime state.

## L13-13 — Night wave rulings: third import, check pins, archive evidence (Lead, 2026-10-25 03:20)

Decided by the Lead under A42 and L13-6.

1. **The third main import, 571a996f5, was never accounted.** The ratchet was red on three legacy files. The Lead widened the resync turn's writable list to `docs/reading-map.md`, because that file is the surviving navigation holder and must match main's new probe count and its config verbs. The Lead also allowed one scanner change: a shard marked `appliedToDocs: false` is reported as `preparedPendingApply` and is not resolved against the live tree. A shard without that flag that points at a missing file still fails. The work was done in 7693ae514 and d786e305e and reviewed in w11-import3.
2. **Checks that prove authoring use the commit that wrote them.** Live correctness belongs to the shared rebind check. `misc-fix/rebind.py --check` now replays its authoring at its own commit, and on the live tree it checks the binding hash, `reviewStatus` and the non-binding fields against later recorded rebinds. A one-shot authoring check must never again compare against live bytes. Every check that reads committed bytes takes an explicit `--pin`.
3. **Old Doer commits are kept with local refs.** `keep/doer-pin-92260972c` and `keep/doer-pin-a27d85d0a` stay until the end of the track, because records once pinned them and they could otherwise be garbage collected.
4. **Archive retention at F.** In the gate register, 70 of the 92 evidence paths point at files that the archive partition moves out of the tip, because the retention rule follows only Markdown links. Ruling: the rebuild at F also keeps every file named as evidence in `preflip-gate-status.json` and in the final status ledger. These are owning records (class a under L12-128). The rebuild's link parity check must count them.
5. **A side effect the Lead accepted.** Turn 695 staged a checkout git addon under ignored `.fgos/runtime/git-addon/` in worktree d3, outside its writable list. It stayed local to that worktree and touched no shared target. Later briefs forbid loading native addons.

## L13-14 — G9 judges drift, not inherited blockers (Lead, 2026-10-25 03:55)

Decided by the Lead under A42. The w15 review found that the G9 park judgment treats records that already carried a phase-08 blocker in four different ways (5 still valid, 5 recompose, 1 superseded, 4 parked). Examples of such a blocker are a Work export and registry inventory rows. The ruling: a G9 disposition depends only on whether the source drift breaks the record's claim. A blocker the record already carried stays owned where it was recorded, linked through `carriedBlocker`, and does not make the record a G9 park. Brief: `w15-g9-park-rule-brief.md`.

## L13-15 — Content rework follow-up (Lead, 2026-10-25 04:45)

Decided by the Lead under A42.

1. **Turn 702's safety exception is accepted.** The Doer reported that `checks.mjs` may have reached addon staging, which would write an ignored cache under `.fgos/runtime/git-addon/` in its own worktree. That is the same side effect accepted in L13-13.5. The w16 review found no such directory on the host, so the write probably stayed inside the Doer sandbox. Later briefs forbid running `phase-08/audit-report.py` inside a Doer turn; the Lead runs it outside the sandbox.
2. **The events.lock successor is decided at F.** The successor named for `claim_2e2bc926` (`withStateTx` / `appendEventCore`) is true at the plan's pin. Main has since cut Work over to the Event Store (42c5a0a55, 2026-10-24 20:50), and `events.mjs` is gone there. The re-decision is redone after the final main import, as a final-pin duty.
3. **A check must not report success when part of it did not run.** A verifier that skips a sub-check reports "partial" and names the part that was skipped.

## L13-16 — A parity proof checks the live tree too (Lead, 2026-10-25 08:55)

Decided by the Lead under A42. The w17 review approved the 704 parity rework, with one exception. To pass, the carries checker moved its heading census, block coverage and patch drift checks to the witness pin `f534aeaea`. Read live, those checks find 4 stale heading rows, 1 block with no parity row, and 2 drifted patches.

The ruling refines L13-13.2. A check that is a *permanent* proof, not a one-shot authoring check, verifies both the authoring pin and the live tree. Known live drift that belongs to the final pin is listed by name in a machine-readable duty list, and any drift not on that list fails.

So the 4 heading rows and the block-17 row are fixed now. The 2 drifted patches (`bin/fgos.mjs`, `docs/backlog.md`) stay a final-pin duty. Brief: `w17-parity-live-brief.md`.

## L13-17 — Gate register review follow-up (Lead, 2026-10-25 09:20)

Decided by the Lead under A42, from the w18 review (5 APPROVE / 1 REWORK).

1. **G2's 187 owned judgments are settled before F, not at F.** G2 requires every census id to be joined to a proof or to a confirmed REJECT. Moving 187 open judgments to F would leave the final pin with judgment work the plan places before it, and no ruling allowed it. G2 goes back to `partial` until those judgments are settled and independently reviewed. Brief: `w18-g2-judgments-brief.md`.
2. **Owned-park actions are co-composed at F.** The 163 dated wrapper notes, the owned-park actions and the 6 repoint proposals all need the actual flip date and placement, and those exist only at F. Their judgments were reviewed before F (w8, w9). Only their composition is an F duty.
3. **Rule-level approval of a mechanical reclassification is accepted.** W9 approved db023f065's reclassification of 319 parks and 20 operand rows by rule, with a 56-row spot check. That is enough, because `proof.py` replays the rule byte-identically and the review checked positive and negative controls for each rule. The G6 note must say so instead of implying a row-by-row review.
4. The remaining w18 Low and Info findings are register corrections. They go in the same turn. 25e8842d3 (misc-fix receipt counts) gets an independent re-review.

## L13-18 — The local archive ref is created at F (Lead, 2026-10-25 09:55)

Decided by the Lead under A42. The G8 row asks for a repository-local archive ref before F. The partition is bound to d3efc70c5 and gets rebuilt at F (W3/W4), and `archive/design.md` makes the archive ref create-only: it refuses an existing ref that points at a different target. So a local ref created now would point at a commit the F rebuild replaces, and it would then block the correct ref at F.

Ruling: create the local archive ref at F, from the F rebuild, with its custody evidence (commit, partition hash, path, blob, size and SHA256 agreement), before the G10 rehearsal. Before F, G8 needs only the independent re-review of f67e0f676. Publishing the ref stays in the owner's cutover approval (S2).

## L13-19 — Census park pc-d-0288 and the register catch-up (Lead, 2026-10-25 12:05)

Decided by the Lead under A42, from the w21 review (24 APPROVE / 0 REWORK).

1. **pc-d-0288 is a REJECT, not a park.** The literal is the message template of an `assert.fail` inside a test helper (`hostScan`, `test/event-store/migrate-cutover-grant.test.mjs:34`). It is test diagnostic output that renders only when the test fails. It is not a document citation and not data a product path reads. So it is non-document rendering, which is the REJECT class. Adding a test that fails on purpose, just to own it, would add nothing.
2. **The register catches up.** Settling 0288 leaves G2 with no open judgment. G5 is met-local, apart from the owner's acceptance of the 8 restatements (L13-10) and the rerun at F (w21 B). Under L13-18, G8 needs nothing more before F, because w20 C approved f67e0f676. `gate-reconcile/reconcile.py` stays the only generator of the register.

## L13-20 — Register review: real pre-F work found (Lead, 2026-10-25 12:40)

Decided by the Lead under A42, from the w22 review (10 APPROVE / 4 REWORK). The commit 04319c952 and the 0288 REJECT are approved.

1. **G6: the 787 premise judgments are settled before F.** These are 623 unconfirmed-premise parks, plus 162 removed-by-cutover and 2 absent rows. L13-17.2 was wrong to say these judgments had been reviewed: W8 approved that the rows were classified correctly, not the premises. None of them needs the flip date. Same reasoning as L13-17.1: work that does not need F is done before F. It would otherwise widen the lease and write-freeze window that the owner's approval opens. Three shard turns, each followed by an exhaustive review. Brief: `w22-g6-park-judgments-brief.md`. The 137 current-passage-unbound rows really do need the bytes at F and stay an F duty.
2. **G9: the 33 retention-or-move decisions that phase 08 left to phase 9 are this phase's own decisions.** They are made before F. Brief: `w22-g9-phase9-decisions-brief.md`. Only the WORK and registry exports stay external.
3. **Register corrections, in the next register turn:**
   - G2: add an F duty to compose the 4 unapplied comment retargets from `census-join/pointer-patches.json` into the F chain.
   - G4: add an F duty to rerun the git one-door scan after the final main import.
   - G8: add one recovery sentence for retained JSON path strings to `archive/design.md` now.
   - G0: build the join tool for shards at F against the verdict file before F.
   - Fix the `census-join/join.py:273` locator fallback, which reverted three approved locators.
   - Remove the stale "design-lap must not pull main" text.
   - `cutoverReadiness` states one order, consistent with L13-6: packet at met-local, then owner approval, lease, F, F duties, final ledger review, Land. It also sizes the F window the approval opens.
4. **The cutover approval packet waits** until items 1 to 3 are done and reviewed.

## L13-21 — Premise shard and phase-9 decision reviews (Lead, 2026-10-25 13:10)

Decided by the Lead under A42. Results of the w23 reviews: shard 1 got 229/34, shard 2 256/7, shard 3 217/44, and the G9 decisions 31/3.

1. **Every prepared patch is checked against the F chain, not the bare pin.** The F chain is `phase-08/step-07-composed-patches.json` followed by `composition/patch-specs.json`. A row whose retarget the chain already makes is recorded as `alreadyComposed` with the id of that chain entry, and carries no new patch. A patch that conflicts with the chain is rebased onto the chain's result. A chain entry whose bytes no longer match the current file is rebased in the same turn. One consolidated `park-judgments/check_shard.py` replaces the three per-shard copies. It applies the chain entries first, flags duplicates, and checks that every repointed path is actually removed or moved by the cutover.
2. **The "Removed door (2026-10-14)" banners are current guidance, not history.** That covers 16 rows in shard 1 and 2 in shard 2. Each banner's citation "decision 0062 in `docs/specs/runner.md`" is repointed to `docs/platform/runner/decisions/h-36d872fbb0e5.md`, the same way the chain repoints the AGENTS.md citation.
3. **The 36 `docs/history/` convention parks are decided under L12-10.** The answer is keep-unchanged: history is not a legacy authority root, and the cutover moves no `docs/history` path.
4. **Lineage links in `docs/platform/**` that point at removed files become code spans.** That is 36 rows, 27 clickable source links and 9 Related-header entries. The cutover's platform link guard stays strict, with no exemption list. A lineage reference keeps its path text, but a reader can no longer click into a deleted file. Each one is a prepared patch on the F chain.
5. **Uncovered live pointers are owned by this rework.** Each gets a prepared patch on the F chain:
   - the gateway yaml citations in 4 candidate docs (`config/spec.md:83`, `herdr-web-dashboard/spec.md:299`, `ui-spec/.../S03-task-detail.md:121`, `ui-spec/contracts/15-system-events.md:38`);
   - the component-boundary advisory link (f06920, f06933);
   - `identity/spec.md:22` and `:159`;
   - `workflow/spec.md:694`.

   The `packages/yaml-doc` mentions are recorded as excluded, with a reason.
6. **All Phase-9 dependencies that phase 08 left are decided before F, not just the 33.** That means the other 53 as well, including the 18 retention-or-move rows for `docs/doc-governance.md` and `docs/architecture-map.md`. The Lead owns them.
7. The row-level REWORKs in the three shard reviews are fixed as the reviews say, unless the Doer shows evidence otherwise.

## L13-22 — G0 per-row verdict file is built before F (Lead, 2026-10-25 13:25)

Decided by the Lead under A42. The strict join `g0join/join.py` at 608a4ada5 found 1,924 effective binding rows. Only 174 of them have a per-row APPROVE that matches both digests. 1,473 rows have no per-row verdict, 247 have related verdicts whose digests do not match, 3 have open REWORK, and 27 have a missing digest or an invalid stored hash. The earlier reviews were mostly aggregate: they approved the work, but did not write the `{id, pointer, bindingSha256, targetUnitDigest, verdict}` records that the G0 definition joins on.

Ruling: build the verdict file now, through six independent review batches (`g0join/verdict-batches/batch-1..6.json`, 1,723 rows). At F, only the rows that F rebinds then need delta verdicts. The 27 rows in `held.json` first get a data fix (a Doer turn that recomputes the canonical hashes and restores the missing target digests), and are reviewed after that. Each reviewer judges the row's claim against the current target unit, not only the digests. An aggregate review cited as context does not replace the per-row judgment.

## L13-23 — G9 dependency proposals and G0 verdict wave results (Lead, 2026-10-25 13:45)

Decided by the Lead under A42.

1. **Both Lead proposals in `g9/phase9-decisions.md` item 8 are accepted.** `scripts/generate-shipped-path-inventory.mjs` keeps its `docs/architect/` and `docs/specs/` classifiers. They classify immutable pinned trees, the existing-path branch already covers `docs/platform/`, and nothing in it changes. This agrees with audit check B's frozen hash for that script: no edit, so no re-freeze.
2. **The G9 checker's scan reads deleted record files from the pin.** Turn 717 deleted the per-shard checkers, and the checker had listed files at its pin but scanned them on disk. The Lead fixed it to read pinned bytes for record files missing on disk. Non-record files must still exist.
3. **The G0 per-row verdict wave stands at 1,882 of 1,924 rows approved.** Left are 15 REWORK rows, 27 rows with a hash or digest defect, and two systemic findings:
   - the link rewriter changed text inside inline code spans;
   - three newer rows duplicate older rows without a supersession link.

   Brief: `w25-g0-rework-brief.md`.
4. **The w8 and w9 component-boundary overlay approvals are conditional.** That is 44 rows in batch 1 and 90 in batch 5. They were checked against the prepared after-bytes of composition spec 424 and the `w8:gap05` relocation and history patches, because their target file does not exist at HEAD. At F, those patches are applied together with the overlays, or those approvals reopen. This goes into the G0 F duties.

## L13-24 — One F composition door for every prepared patch (Lead, 2026-10-25 14:00)

Decided by the Lead under A42 and RUL11. The w25 G9 review approved all 158 decisions, but found prepared patches from different records that edit the same lines:
- the G9 gateway and map patches repeat or override premise-shard patches;
- the G9 bin and pointer patches restate `carries/pointer-patches.json` with no link between them.

These patches live in five places:
- `phase-08/step-07-composed-patches.json`;
- `composition/patch-specs.json`;
- `carries/pointer-patches.json`;
- `census-join/pointer-patches.json`;
- the premise shards and `g9/f-composition-additions.json`.

Each record has its own checker, and none of them sees the others. That is the mess itself, not a size problem.

Ruling: one ordered F composition manifest names every prepared-patch source, and one checker composes them all on the pin. It fails on two patches for the same lines, on a conflict, and on a patch without one owning row. Each changed line has exactly one owning patch. Every other record that mentions that change links to it by id, and carries no second copy. The per-record checkers keep their record-level checks, and their replay goes through this one door. This consolidates the existing replay code (`composition/compose.py` `apply_diff` and `check_shard.py`'s chain builder) rather than adding a new engine. The G9 checker reads `plans/` evidence from the pin, not from disk, so later record edits do not break it.

## L13-25 — G0 rework review follow-up (Lead, 2026-10-25 15:05)

Decided by the Lead under A42, from the w26 review (65 of 72 rows APPROVE, 7 REWORK).

1. **Code inside a fence is literal, like an inline code span.** The link rewriter also retargeted paths inside two fenced code blocks: `workflow/spec.md:420` and `component-boundary.md:549`. Code text is copied byte for byte from its source. A path inside code is not a link, so a reader gains nothing from the retarget. Restore both, and record the scan over fenced code as well as inline spans.
2. **A verdict binds the row as it was reviewed, not only its two digests.** w26 found about 70 rows whose rationale, disposition or review status changed after their approval. The join still counts those approvals, because it reacts only to digest changes. `g0join/join.py` now also requires the verdict to postdate the last commit that changed the row's decision fields (by git ancestry), or to carry a matching row-content fingerprint. Rows that fail this check go back to review.
3. The 7 REWORK rows are fixed as the review says. `import2/partial-carry-residuals.json` becomes writable for the two stale residual records. The duplicate binding in s14 `/bindingRefresh/8` becomes an explicit drop.

## L13-26 — Links into moved paths are retargeted by prepared patches (Lead, 2026-10-25 19:50)

Decided by the Lead under A42 and RUL11, from the w28 review (104 APPROVE, 2 REWORK).

1. **Links into moved paths.** After the full F chain, 160 clickable links in 40 `docs/platform/**` files still point at paths that the phase-08 cutover move set moves or removes. 119 of them are in files F does not touch. L13-21.4 keeps the link guard strict, so F would fail as it stands. Ruling: each of these links gets a prepared patch that retargets it to its post-F path. The patches live in one new record, `fchain/link-retargets.json`, with one owning row per link, and the F manifest names it as a source. Do not run a separate retarget pass at cutover; F must be replayed and certified by the one door (L13-24). Links in code spans and fences stay literal (L13-25.1). A link whose target is removed with no successor becomes a code span, as lineage links did under L13-21.4.
2. **The door checks for this itself.** `fchain/check.py` gains one finding, `linkIntoMoveSet`. It reports any clickable link in the composed `docs/platform/**` that still resolves to a move-set source path. That way a later docs edit cannot bring these links back unseen.
3. **Gateway contract list.** The `x-specs` entries for `docs/specs/work-state.md` and `docs/specs/runner.md` in the moved `fgos-gateway-api-v1.yaml` are repointed in the same record.
4. The work-state chain entries made stale by the `work-state/spec.md` edit are rebased in the same turn. No decision changes.

## L13-27 — The ownership audit judges drift through the rebind door (Lead, 2026-10-25 21:30)

Decided by the Lead under A42, RUL11 and RUL104, from turn 733's evidence (`g0rework/ownership-drift-proof.json`).

The Phase 6 ownership audit (`ownership.mjs`, `audit-ownership.mjs`, embedded in both `phase-06/step10-*-reproduction.json`) fails at the plan HEAD on 23 `targetDigestDrift` rows. Its real invariants still hold: there are 0 native duplicates and 0 new active pairs. All 23 rows are false positives of an old reader:
- **7 rows** are original rows whose effective successors already match the live document.
- **16 rows** are group rows, with a null anchor and eight members each. Commit 594fe4194 filled in their digest. Before that fill, the audit's digest guard skipped them.

The audit's drift test (`u.anchor===r.targetAnchor && u.textDigest.startsWith(r.targetUnitDigest)`) predates both supersession and identical-unit groups. `rebind/rebind.py --check` already owns that judgment: it reports 0 unresolved drift, authenticates the 7 superseded origins, and authenticates the 128 group members.

Ruling: the audit's drift test asks the one door that already decides drift, instead of copying its logic.
- A raw drift row counts as accounted only when `rebind.py --check` authenticates it: either as a superseded origin whose effective successor matches the live unit, or as a group whose members all match.
- Every other drift row still fails.
- Raw diagnostics stay in the audit's output.
- Ledger history is not rewritten.
- The pair-accounting exception list in `checks.mjs` is not touched.

## L13-28 — Every link in docs/platform resolves after F (Lead, 2026-10-25 23:45)

Decided by the Lead under A42 and RUL11, from the w33 link-retarget review: 4 APPROVE, 1 REWORK and 3 notes.

At cutover, guard 3 lands: the link and anchor check inside `docs/platform/**` (L12-89). The composed tree after F would still fail that guard on three populations:
- 67 Related-header entries in 59 files that point at moved files;
- 411 relative links that are already broken at the pin, mostly in snapshots of the retired engine;
- 24 broken links in files that F creates.

L13-26 covered only clickable links into the move set. That is one slice of the guard's population, not all of it. The size of the rest is no reason to exempt it.

Ruling:
1. **The whole population.** Guard 3's population is every link and every anchor in the composed `docs/platform/**`, Related headers included. All of them must resolve after F, with no exemptions.
2. **Rules for each link, in this order:**
   1. Retarget to the successor. The successor comes from the move set, from the surviving file under G5, or from the record of anchor renames.
   2. If the target was removed and has no successor, turn the link into a code span. This is the lineage rule of L13-21.4, and it covers retired-engine snapshots too.
   3. A link that would point at its own file goes to the matching anchor in that file if one exists; otherwise it becomes a code span.
   4. A link label that shows the old path shows the new path.
3. **Row `L13-26:link:125`** retargets to `../../reading-map.md`, as w33 gives it. That file is the G5 surviving file.
4. **One record and one check.**
   - The fixes extend `fchain/link-retargets.json`; no second record is added.
   - The `fchain/check.py` finding `linkIntoMoveSet` becomes `linkGuard`. It resolves the file and the anchor of every link in the composed `docs/platform/**`, Related headers included, using the anchor rule of the unit extractor.
   - This check is the pre-F witness of guard 3. The guard itself is built in the cutover change, and it must agree with this check; that is an F duty.
5. **Gateway contract.** The YAML descriptions in `fgos-gateway-api-v1.yaml` that name retired paths, and the `x-docs` entries that name decision files already gone, are fixed in the same record.

## L13-29 — The packet goes out at w38; its low notes refresh the register before the lease (Lead under A42, 2026-10-26 03:20)

Finding: the register update e7e6c129c was reviewed in w38: 11 APPROVE, 0 REWORK, 5 low notes. The notes are citation and wording details: the rebind status should also cite W26; the `linkIntoMoveSet` field is a constant after its rename to `linkGuard`; the register pins the ownership audit at 4a4fefbe8, while the later accounting is 23e3c34b7; two citations are loose; and the summary still says the update awaits review. Each change to the register needs a new review, so fixing these first would delay the packet by another cycle and change no gate status.

Rulings:
1. The cutover approval packet goes out now, at met-local (L13-6). It cites w38 and states the ownership audit at 23e3c34b7: 0 unaccounted pairs, B ok, reproduction 8/8. The 58 exceptions for already-allowed paths are dropped, as w33 recommended.
2. The five w38 low notes and the two uncarried w33 ownership follow-ups (raw drift count; consistent keying of records 149–150) are applied in one register refresh through `reconcile.py`. The refresh runs after the owner answers and before the lease, with a light review. `linkIntoMoveSet` is removed from the register, `verify.py` and its control, not left as a constant.
3. Record commits after 23e3c34b7 (reviews, this ruling, the packet) are pair-accounted at the next accounting, at the latest in the F import accounting.

## L13-30 — Owner approves cutover option A (owner decision)

**Owner text:** 2026-10-26 09:57, answer to the cutover approval packet (6586bbc46): **"đồng ý A, khi nào lead LAND báo ổn thì em làm."**

Scope, as the packet set it:
- **Allowed:** take the documentation lease; import main once as F, with accounting; run the F duties on the plan branch and clones; publish the archive ref; write and independently review the final ledger.
- **Not allowed:** Land on main, which needs a separate approval after the final ledger review; deleting files on main; pushing `.fgos/events*`; widening the frame when F exceeds the counts. In that last case the Lead stops and asks again.

**Condition:** start only after lead:LAND says it is OK. The Lead asked LAND at 09:58 about the lease and freeze, the F import and the F-window heavy IO.

**Owner items:**
- **G8:** the archive ref publication is covered by A's scope.
- **G5 and G9:** still open; asked separately.

**Work allowed before LAND answers:** the L13-29.2 register refresh only. It touches the plan branch only, needs no lease and causes no heavy IO.

## L13-31 — Freeze notice on the board first, F import after HARDEN answers (owner decision)

**Facts.**
- The active release 2bef8cb2 has no `docs-lease` verb (lead:LAND, 2026-10-26).
- Execution plan §3 W4 orders the work as follows: F import, then release R staged from the F code (staging only), then the G11 proof in a disposable clone, then the G10 rehearsal (needs the Git owner's §7 consent), and only then the real lease.
- The lanes on the other machines are MAIL, TEST, RULE and ES. They read only the board log on origin/main, and A does not allow DOC to commit to main.

**Owner choice:** 2026-10-26, option **"1. Board trước"**.
- lead:LAND posts a DOC line in the board log. It announces the docs/ freeze from the F import until Land, which until the lease exists is held by convention only. It also asks HARDEN/Git owner for the G4 review of the 25 declarations and for §7 consent.
- The Lead imports F only after HARDEN answers.

**Not covered by this choice:** DOC committing to main, activating release R, holding the real lease before G10 and G11 pass, and Land.

## L13-32 — Owner go for the cutover with review conditions (owner decision)

**Owner text:** 2026-10-26 11:42, relayed into this session after lead:COMMUNICATION collected DOC-READY from the lanes on fg-server2.
1. The owner approves DOC to run the documentation cutover. All six lanes on fg-server2 have confirmed they write nothing under docs/ from DOC's F import until Land.
2. The machine is quiet, and the new release is up.
3. Before the lease, DOC fixes the scanner and the hook and pushes `review/doc-git-one-door`. OPC must give the hook a MERGE before DOC takes the lease. HARDEN must re-review the scanner before DOC lands.
4. OPC's High item stays the gate on the lease. The `reference-transaction` hook currently blocks `git pull` on other machines while the lease is held, so taking the lease before it is fixed would block the other machines.
5. When DOC changes `docs/specs/*`, DOC writes a board line for COOK. Every exchange between DOC and the lanes goes through the board.

**Lead plan under this go.**
1. Merge and verify the scanner fix (turn 741) and the hook fix (turn 742), with an independent review.
2. Import F with accounting.
3. Push `review/doc-git-one-door` (L13-12 A'), and ask on the board for OPC's hook re-review and HARDEN's scanner re-review.
4. lead:LAND stages release R from the F code, staging only.
5. Run G11, then G10.
6. Take the lease only after OPC MERGE.
7. Land only after HARDEN's re-review and a separate owner Land approval.

Board lines go through lead:LAND unless the owner allows DOC to push them itself.

## L13-33 — G5 accepted; G9 proposal corrected (owner decision + Lead correction)

**Owner text:** 2026-10-26 12:2x: «chấp nhận G5».

**G5 accepted.** The owner accepts exactly the 8 restatements of `docs/specs/reading-map.md`. Lines 3–9 (the transition banner) are carried by `docs/reading-map.md` lines 89–108. Line 34 (the workflow truth correction) is carried by line 156. The exact old and new bytes are in `g5/check-b57e79625.json` /ownerAcceptance. G5 is closed for the owner.

**G9 proposal corrected (Lead).** When the owner asked for an explanation, the Lead re-read both backlog rows and the current spec. The packet's proposal was wrong on both claims:
- **STR70a** cites `docs/specs/work-state.md:647-675` as the precedent for non-transitioning verbs (`decision`/`outcome`). Those legacy lines now hold the verb manifest text. The current holder is `docs/platform/work-state/spec.md`, "Decision Verb" and "Outcome Recording". It is not "Add Verb".
- **STR62** cites `:864` for the data model that has only `parent`/`deps`/`blocks`. That line now holds the add surface. The current holder is §3 "Work Item Data Dictionary", rows 5 (`deps`) and 13 (`parent`, the typed-edge model). It is not §6 "Domain Model", which is about the per-item domain and its stage set.

The corrected proposal goes back to the owner for confirmation. The claims themselves are unchanged; only their citations are repointed.

**G9 owner answer:** 2026-10-26, «G9 đồng ý». The owner confirms the corrected proposal:
- **STR70a** → `docs/platform/work-state/spec.md`, "Decision Verb" and "Outcome Recording".
- **STR62** → the same spec, §3 "Work Item Data Dictionary", rows 5 (`deps`) and 13 (`parent`).

The claim text is unchanged. At F, the Lead edits `docs/backlog.md` directly, because the backlog is not generated. The edit:
- repoints both citations;
- retires the removed js-yaml advisory binding;
- carries the same STR70a correction into `generators-skills-and-support.jsonl:66`;
- records the resulting row identities in the G9 records.

G9's owner items are closed.

## L13-34 — Rebuild the composition delta at F (owner decision)

**Facts.**
- F is the merge eb161da46, at origin/main 947dc3103. After it, the shared composition replay (the g9 check through `fchain/check.py` with the F additions) reports 199 findings on 61 files:
  - `conflict` 149: 67 stale chain entries, 55 whole-body witness preimage drifts, 11 composed preimage hash changes, 9 absent `composedBy` postimages;
  - `linkGuard` 42: 32 moved-target, 6 stale-label, 3 missing-file and 1 other;
  - `ownerless` 8.

  21 of the 61 files are docs; 40 are code or tests.
- The ownership audit has 27 unaccounted target-digest drift rows in runner, work-state, distribution, architecture-manifest, confinement-authority, component-boundary, install how-to and dispatch-module-boundaries.
- The carries checker fails on `s11-preflip-carries.json /unitCarries/248`.
- The legacy ratchet reports 9 unaccounted legacy edits with stale exception digests.
- The findings are saved at `fchain/f-delta-findings-947dc3103.json`.

**Owner choice:** 2026-10-26 ~13:00, option **"1. Làm tiếp ở F này"**. The Lead rebuilds the delta at this F on the plan branch:
- rebuild the patches and chain entries on the F preimages;
- fix the links and owners;
- rebind the drift rows;
- refresh the carries and the ratchet exceptions with provenance;
- run delta reviews;
- account the pairs.

docs/ stays frozen. **Not allowed:** the lease before OPC's MERGE, Land, and another main import without asking.
