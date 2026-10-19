# Re-check: Phase 8 plan revision against red-team P8-1..P8-18

Reviewer: `reviewer:opus-session:a4954387@2026-10-19`
Mode: independent plan re-check (fresh context, no authorship)
Content commit: `df6eab953` (detached, read-only worktree `/home/vantt/projects/forgentX-s8-review`); revision diff `bd779d548..df6eab953`
Abbreviations: `P` = `plans/260925-documentation-authority-unification`, `F` = `P/phase-08-eliminate-switchboard-bypasses-and-prepare-consumers.md`, `R8` = `P/reports/phase-08`, `R6` = `P/reports/phase-06`.

I used read-only commands only: git show/diff/log/diff-tree, jq, grep and sed. I extracted the embedded scripts of both reproduction manifests to my scratch directory and read them. I did not run them, npm test, fgos or cargo, and I did not read the secrets file.

## Verdict

**NEEDS-REVISION.** The revision fixes most of the original findings. L12-3 corrects the false premise, `audit-report.py` is a sound read-only reporter, L12-7 cuts the legacy-root edits, and the counted review budget and the dependency graph are good. Two problems block execution:

1. The new rule that both `checks.mjs` runs are green at every batch end cannot be met as written (N1).
2. The new Step 5 classifier work (L12-9) breaks a frozen pin that those same checks enforce (N2).

Separately, L12-6 reverses an owner-accepted lease decision under A42 without asking the owner, and Phase 9 still describes the old lease (N3).

## P8-1..P8-18

| ID | Outcome | Evidence | Note |
|---|---|---|---|
| P8-1 | fixed | `R8/owner-answers.md:58-60` (L12-3); `F:86`, `F:101`, `F:119` (census joined to every ledger `targetOwner` and shifted anchors), `F:136`, `F:167` (Phase 8-edited `docs/platform` paths appended to the A47 union) | The premise is corrected and N1 carry/rebind runs per batch. The gate it relies on is unworkable as written (N1). |
| P8-2 | fixed | `R8/audit-report.py:29-35` runs all three scripts with no short-circuit, `:36-47` emits manifest-qualified rows plus current digests through each manifest's own `unitsOf`, `:55-57` has no expected-red allowance; `F:103`, `F:105` | I read the embedded scripts. `audit-ownership.mjs` fails on drift (`assert(current.noNewDoubleOwnership)`, which includes `!targetDigestDrift.length`); `ownership.mjs` exits 0. `checks.mjs` is independent. The reporter reads only keys that exist (`audit-ownership` writes `noNewDoubleOwnership` etc. back into the same file) and edits no checker. |
| P8-3 | fixed (owner question declined with reason) | `R8/owner-answers.md:62-64` (L12-4); `F:88`, `F:170`, `F:178`, `F:195`; Phase 9 step 10 (`phase-09:77`) | The criterion text is unchanged (`F:202-204`); the change is recorded only as a reading. The Lead settled it under A42 rather than asking the owner. That is acceptable because it is transparent, but put it in the Phase 8 close packet so the owner sees it. |
| P8-4 | partly | `F:90-96`; L12-5 | The scope was widened but not split into two tiers, which introduces N4. Root `README.md` (an edit target per `F:55`) and `dogfood-fixture/` are missing from the pathspec. |
| P8-5 | partly | `F:157-162` (Step 6b now read-only); L12-6; `F:194` | Building a second guard is avoided. However, the input branch is not readable here (N5). No step obliges updating the board's DOC row, which on main is still "held … trước Phase 7 Step 5" (board line 51). Owner routing is also missing (N3). |
| P8-6 | fixed | `phase-09:26`, `phase-09:46`, `phase-09:53`; `R8/progress.md:7` | The four non-candidate targets are covered by "all nine files" in Step 0. |
| P8-7 | fixed | L12-7 (`R8/owner-answers.md:74-76`); `F:88`, `F:136` | Plan-local binding repair into those roots stays allowed without editing the target content. |
| P8-8 | rejected with sound reason | L12-8 (`R8/owner-answers.md:78-80`); `F:24` | Landing is owner-only. Keeping the work on the branch costs more under N4. |
| P8-9 | fixed | `F:143-144` (Step 5 classifier and inventory), L12-9 (Decision F kept deferred, no `--record`), `F:167` (Plan A/B phase 06 pins) | The Step 5 fix introduces N2. `plan.md:330` and `plan.md:361` have no forward pointer to L12-9 (N6). |
| P8-10 | fixed | L12-10; `F:119`, `F:136` | |
| P8-11 | fixed | `F:184-188`: written classification rule, 40 class parts (20+7+13, arithmetic checks out), 400 minimum deep reads, budget stop | |
| P8-12 | rejected with sound reason (alternative) | `F:6`, `F:188` | Sum checked: 6.75–12 plus a 1-day reserve gives 7.75–13 Doer days, plus 4–6 reviewer days. This is consistent once lease implementation is excluded. |
| P8-13 | fixed | `F:180` | |
| P8-14 | fixed | `F:111`, `F:113` | The row key is the 4-tuple, re-located by content, using `planLinkPass`. I checked the ten indexes against the queue: 0 is the generator, 1–2 conservation tests, 40 the dogfood fixture, 41–42 the ratchet baseline and exceptions, 43–45 the retired-corpus tests, 46 the citation-drift test. All correct. See N8. |
| P8-15 | fixed | `F:102`; `R8/merge-accounting.json` `.conflictResolutions` (7) | All seven `postMergeSha256` values equal `git show 49ad04648:<path>` and are unchanged at HEAD. See N9. |
| P8-16 | fixed | `R8/scan-consumers.py` (inventory patterns over `git ls-files`, excludes `.fgos` and the plan); `R8/progress.md:22` (2,276 files, 0 missing or extra) | |
| P8-17 | fixed | `F:190-198` scorecard rows for the verifier and the lease check | |
| P8-18 | fixed | `F:146` (cargo is a Lead-run heavy job, run alone) | |

Tally: 14 fixed, 2 partly fixed (P8-4, P8-5), 2 rejected with sound reason (P8-8, P8-12), 0 not fixed.

## New findings

### Critical

**N1. The batch-end rule "both checks.mjs green" cannot be met for any Phase 8 write, and Step 0 does not name how the accounting is done.**

Evidence:

- `checks.mjs` (identical in both manifests, `R6/step10-*-reproduction.json`) fails check A on two things:
  - every first-parent commit/path pair from B0 `dbe5c4328` onward that lies outside `R6/allowed-paths.json` and is missing from an `exceptions` array **embedded in the checker source**;
  - every uncommitted working-tree path outside that allowlist (`newWorkingViolations`, from `git diff --name-only HEAD`).
- The allowlist excludes every Phase 8 write class: `R8/**`, the phase-08 and phase-09 files, `AGENTS.md`, `core/**`, `domains/**`, `src/**`, `bin/**`, `apps/**`, most of `scripts/**`, `.agents/**`, `plugins/**` and `CHANGELOG.md`.
- I recomputed check A at `df6eab953` with the same git commands. There are **20 unaccounted pairs**, not the 12 in `R8/progress.md:20` and `revision-verification.json`: 11 from `fc2076ece`, 1 from `bd779d548`, and 8 from the revision commit `df6eab953` itself. The progress note was written before its own commit.

Consequences:

- A runner round verifies before it commits. Any batch that edits outside the allowlist is therefore red at verify time (working-tree violation), and red again after the commit until a second commit adds the exception data. That second commit must touch only allowlisted paths, so it cannot also update `progress.md`.
- Step 4 and Step 5 batches, plus the `build:skills` render output, could create hundreds of pairs per batch, each written into two embedded checker sources.
- `F:86`/`F:101` say only "record exact committed path/commit exception data after runner commits". They name no mechanism, give no definition of "batch end", and do not list the 20 pairs. The precedents differ:
  - Phase 7 L11-24 used an external lanes file for its *own* check A and explicitly left the historical checkers red (`reports/phase-07/owner-answers.md:606`, `:631`).
  - Phase 6 widened `allowed-paths.json` (`2296413a2`).

Under "no expected-red allowance", the plan as written either blocks every consumer batch or invites an improvised accounting step.

Fix: add an L12 decision in Step 0 that picks one accounting lane:

- (a) A per-commit exceptions-data append to both manifests in an allowlist-only follow-up commit. Define "batch end" as after that commit, and run the checks only after the commit. Or:
- (b) A recorded widening of `allowed-paths.json` for the Phase 8 write classes, on the Phase 6 precedent, which removes the per-pair churn.

Either way, list the current 20 pairs as Step 0 inputs, and state that the reproduction test is not part of a runner's pre-commit verify for batches outside the allowlist.

### High

**N2. The L12-9 Step 5 classifier change breaks frozen check B.**

`R6/step10-start-checks.json` `.B` pins the blob hash of `scripts/generate-shipped-path-inventory.mjs`, together with `generate-doc-inventory.mjs`, `doc-inventory-artifact.mjs`, `check-legacy-docs-ratchet.mjs` and `lib/is-main-module.mjs`. `checks.mjs` sets `B.ok = expected===actual`. Step 5 (`F:144`) extends the classifier inside that exact file (the rules are at `generate-shipped-path-inventory.mjs:224`, `:307`). It also regenerates `P/shipped-path-conventions-inventory.*`, which is outside the allowlist.

After Step 5, check B stays red permanently. Re-pinning it would be the frozen-baseline edit that `F:71` forbids.

Fix: decide explicitly. Either re-pin B as recorded accounting data (an L12 decision with a reason), or move the classifier and inventory regeneration to a separate item or to Phase 9 so that L12-3's green rule still holds.

**N3. L12-6 reverses an owner-accepted decision under A42, and Phase 9 still contradicts it.**

`plan.md:370` records the owner, on 2026-10-06, accepting the lease direction with "build in Phase 8", a `reference-transaction` guard, and reuse of the main-checkout lock primitive. L12-6 defers any build until Git 04 lands, on Git's door, and is recorded as a Lead decision with no owner packet. A42 covers "ordinary owner-routed choices" (`reports/phase-07/owner-answers.md:10`). Undoing an explicit owner decision needs the five-part packet. The reuse argument itself is sound: one door, L10.

Two documents were not updated:

- Phase 9 step 1 (`phase-09:59-62`) still says "acquire a migration-specific exclusive documentation-cutover lease".
- The `plan.md:469` risk row still names a migration-specific lease.

The change also puts Phase 9 behind Git 04's landing, which the board says requires stopping both machines and which the owner will schedule later (board lines 121-122, 125).

Fix: send the owner one decision-question packet: reuse Git custody (wait for 04) or build the accepted migration lease. Then align `phase-09` step 1 and the `plan.md:370` and `:469` text with the answer.

### Medium

**N4. The L12-5 drift gate is too broad and its logic is inconsistent.**

"Merge main only when that diff is empty" is applied over `core domains src test apps bin scripts packages .agents plugins .claude`. Main changes those trees daily, so the diff is almost never empty. Each sync then becomes a per-file conflict review of all main changes, and every review is invalidated. Root `README.md` and `dogfood-fixture/` are also missing from the pathspec (`F:93`).

Fix: use the two-tier rule. The identity scope decides merge or defer. The intersection of the main diff with the files Phase 8 actually touched decides which reviews and parity receipts are invalidated. Add `README.md` and `dogfood-fixture`.

**N5. The Step 6b input is not readable from this repository.**

No `git/p04-custody` ref exists locally or on `origin`. The board places Git 04 on the second machine, unlanded (board line 122). A Doer cannot run the read-only reuse check against "Git phase 04 on `git/p04-custody`" (`F:159`).

Fix: the Lead obtains a pinned commit (pushed or fetched) before 6b, records it as an input pin, and updates the board's DOC row, which is still "held", as AGENTS.md requires.

**N6. Plan, progress and board text drift out of step with the revision.**

- `plan.md:278` still says "next: settle the 47-edge queue, then complete semantic census" and "reproduction ownership audit blocked by target drift". The next step is the Step 0 package.
- `R8/progress.md:20` gives 12 pairs; there are 20 at HEAD (N1).
- `plan.md:361` (Decision F) and `:330` (core/workflows) have no pointer to L12-9.

Fix: a one-line update to each.

### Low

- **N7.** `audit-report.py:43` looks up current digests by the *same* positional anchor. For shifted `unheaded-block-N` anchors this reports the digest of the wrong block, which works against `F:86`'s rule to resolve by content. Fix: also emit the anchors whose current digest matches the expected prefix (a content-match candidate), or state the limitation in Step 0.
- **N8.** Step 1 pre-assigns dispositions only to the ten code/test/gate rows. Queue rows 3–5 (`docs/architect/**`) and 31–39 (`docs/specs/**`) must be cutover-patch-only under L12-7. Fix: say so in Step 1.
- **N9.** In merge `49ad04648`, ten paths differ from both parents (`git diff-tree --cc`). Three of them are not among the seven "conflict" paths: `CHANGELOG.md`, `docs/platform/session-identity/spec.md` and `docs/specs/reading-map.md`. If those three were clean auto-merges, say so in `merge-accounting.json`; otherwise the reviewer cannot confirm the set of seven.

## Checks that passed

- The Requirements and Success Criteria text is unchanged. L12-4 is recorded as a reading only (`F:88`, `F:202-204`).
- The reporter and scanner are read-only. They write only to `/tmp/fgos-work/`, change no checker, recipe or baseline, and use each manifest's own `unitsOf`.
- The seven conflict digests match the merge bytes.
- The Step 0 review sizing of 98 entries in at least 2 parts is consistent.
- The estimate arithmetic adds up.
- `F:180` forms a sound DAG.
- Phase 9 consumes the Step 0 and N1 receipts and keeps the A47 final union.

Status: DONE
Summary: P8-1..18: 14 fixed, 2 partly fixed (P8-4, P8-5), 2 rejected with sound reason (P8-8, P8-12), 0 not fixed. New findings: Critical 1 (N1: the checks-green batch rule is unachievable; 20 unaccounted pairs, not 12), High 2 (N2: the Step 5 classifier breaks frozen check B; N3: L12-6 reverses an owner lease decision and Phase 9 step 1 contradicts it), Medium 3, Low 3. Verdict NEEDS-REVISION.
