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
