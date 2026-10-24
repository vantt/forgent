# W16 review: G0 content rework, G9 park rule, parity-base fix

Reviewer: independent, read-only. Worktree branch `plan/260925-documentation-authority-unification`. Asked at `d8d77543a`. HEAD moved to `35c7f92bf` during the review; that commit changes only the two phase-06 reproduction manifests. Every proof was re-run at `35c7f92bf`, and sweep was also run at `d8d77543a`.

## Verdict

**REWORK (narrow).**
- **B (`33cc5539d`) passes.**
- **C (`d8d77543a`) passes.**
- **A (`c25e8cf6a`) is correct in most parts.** The three re-decisions, 127 hashes, rationales, the overlay retirement and both required proofs all hold. One High defect remains: the 21 new parity rows break the parity file's own verifier. One Medium also remains: the events.lock successor does not cover main's Event Store cutover.

## A. Binding content rework (`c25e8cf6a`, merged in `3e1612222`)

**(1) Scope: pass.** The commit touches five files, all inside the writable list: the redecisions shard, `source-parity.json` and `g0rework/**`. No legacy or docs file changed.

**(2) The three supersede re-decisions: pass, with F2 and F3.**
- Every cited source exists and is an ancestor of HEAD.
  - `10416a6b0` replaces `git rev-parse --git-common-dir` with an on-disk `.git`/gitdir/commondir walk in both shell functions of `scripts/fgos-shell-integration.sh`.
  - `63b777873` and `11733af37` move work ids onto the mint door (`mintRandom`, `generateId` removed).
  - `bd8d64fdd` rewrites the `docs/specs/work-state.md` rigor row. Seat Binding §5.2 says "`rigorToTier` bị xoá".
  - `4a4e8446e` and `64de0de56` introduce `withStateTx` and `appendEventCore` and remove `withEventsLock`.
  - Identity §4a, Seat Binding §5.2 and holder-lock §15 all exist.
- For b5695d38, the false "complete unit digest equal" text is gone.
- All 127 rows are `pending`. All 127 `bindingSha256` recompute independently with the four-key compact+LF recipe.
- `verify.py` asserts that the changed lines exactly equal `changedClauses` for all 3 rows.
- **2e2bc926 successor.** The code at HEAD confirms the successor:
  - `WAIT_TIMEOUT_MS = 5000`, `POLL_MS = 10`;
  - `HotLockError('hot-lock-timeout')` and `hot-lock-reentry`;
  - the child-process guard;
  - no `withEventsLock`, `appendEventLocked` or `events.lock` left in `src/` or `bin/`.

  This is correct **at the pin**, but see F2.

**(3) Parity entries: digests pass; format fails (F1).**
- The 324 earlier rows are byte-unchanged (`c25e8cf6a^` prefix). The 21 new rows are 19 confinement and 2 work-state.
- I checked a sample of 5 (rows 324, 330, 336, 343, 344) independently. I extracted units at `49ad04648^1` and `49ad04648` and at the worktree. In all 5:
  - the commit changes the file;
  - the old digest matches;
  - the new digest matches;
  - the current legacy unit at `currentSourceAnchor` equals the target digest;
  - old ≠ new.

**(4) Rationales: pass, with one Low (F4).**
- I sampled 15 rows: 0, 29, 30, 33, 36, 43, 44, 46, 52, 53, 57, 60, 61, 81 and 84 (plus 91 and 109).
- All 21 resync rationales name the correct current legacy anchor.
- 4d5b7f73: the 5 reworded lines (account lock, RUL80, RUL86, RUL91, RUL96) are confirmed by diff.
- d5ba1eda: the 5 absent lines (account lock, RUL80, RUL86, RUL90, RUL91) are confirmed. Its remainder and `residualRef.targetUnitDigest` are `797c7185…`. `fb0b0100` survives only as `historicalTargetUnitDigest`.
- No rationale still contains "26 historical", "limitations retained", `fb0b0100` or "complete unit digest equal".

**(5) Stale overlay pointers: pass, with one Low (F5).** `effective()` on s12 `/unitCarries/364`, s14 `/bindingRefresh/574` and `/577` now resolves to redecisions `/bindingRefresh/124..126`. Those rows have the same claim and binding as the current rows `/6`, `/20` and `/21`.

**(6) Proofs: pass.**
- `rebind/rebind.py --check` → 0, drift 0.
- `g0rework/verify.py` → 0 at `35c7f92bf`. Its rebind, misc and ratchet steps and `git diff --check` all exit 0. The audit-report step exits 1 because checks.mjs is not run (126) in both manifests (F6).
- No addon cache or `target/` change appeared.

## B. Drift-only park rule (`33cc5539d`): pass

- **Population.** Exactly 15 of the 574 records carry a non-empty phase-08 `/parked`. All 15, and no others, have `carriedBlocker`. Each has `pointer:/parked` and `status:open`, and its `recordSha256` equals the physical line's SHA-256.
- **Dispositions of the 15:** 13 still-valid, 1 superseded, 1 owned-park. The owned park is generators `:66`, a stale STR70a line citation that only the backlog owner can replace; its sibling `batch-126:2` gets the same disposition.
- **Counts.** All rows: 526 / 15 / 31 / 2. Former parks: 296 / 9 / 31 / 2. 9 dispositions changed:
  - 5 from recomposition to valid;
  - 3 from park to valid;
  - 1 from superseded to valid (step04-029).

  `cli-help-messages:3` was not one of the 338, and the receipt discloses it. All of this matches the receipt.
- **step04-029:1.** It is still-valid with `retiredPassageIds` 000484 and 000485 via `e71381aba`. That commit's diff removes those two docs/history references. Current `approve.mjs` lines 267-268, 308-309 and 362 still carry tsk-3bn, leaf-merge and 0032.
- **Backlog next action.** Both backlog parks now say "edits docs/backlog.md directly (it is no longer generated)". "regenerat" appears elsewhere only in the path `scripts/regenerate-observe-fixtures.mjs`.
- **Reasons.**
  - batch5:25 now says "removed (absent)".
  - part-26:2 and r20:147 explain that all their passages were REJECT non-document operands.
  - The co-cut rows name `groups.protected-co-cuts`.
  - `park-decisions.json` now groups `batch-040:4` under doc-navigation and `batch7:150` under seat-workflow.
- **`recomposed.json` unchanged: correct.** All 5 bodies whose rows left recomposition predate the park judgment, from the composition chain. Two of them (dead-vocabulary-guard, registrations) have no G9 row user left, but composition `patch-specs.json` still names them.
- **Proof.** `g9/sweep.py --check --pin HEAD` → 0, and `--pin d8d77543a` → 0. Results: 574 records, 0 judgment errors, 0 drift, chain and replay mismatches, and 546 bodies.

## C. Parity base (`d8d77543a`): pass

- **Uncommitted:** `git diff --quiet HEAD -- parity` ≠ 0 gives base HEAD. That is the old behaviour.
- **Committed:** the base is the parent of the last commit that touched the file. That resolves to `c25e8cf6a^` = `568a11f21`, which equals `receipt.json.sourceHead`.
- **Not weaker.** The old code compared against HEAD, so after the commit `appended` was 0 and the check could only fail. The new code keeps the 324-row prefix-equality check and the exact 21-row assertion.
- **Brittle (Low).** Any later commit that edits `source-parity.json` (for example the F1 fix) moves the base past the 21 rows, and the check then fails closed. Pinning the base to `receipt.json.sourceHead` would be stable.

## Findings

| ID | Sev | Summary |
|---|---|---|
| F1 | High | The 21 parity rows carry the historical `sourceAnchor` and `sourceUnitDigest` with `status: current-complete-unit-present`. The file's own reader `carries/verify-carries.mjs:87` requires a **current** source unit at that anchor and digest. My replay of that loop at the worktree fails 35 rows: these 21, plus 14 pre-existing `docs/specs/distribution.md` rows (301, 305 and 312-323) that were already stale and that no proof re-ran. Fix: put the current anchor and digest in `sourceAnchor`/`sourceUnitDigest` (the historical values already sit in `accounting.oldLegacyDigest` and in the ledger row), or add a status the reader handles. Refresh the 14 distribution rows and add `verify-carries.mjs` (with dlopen blocked) to the proof set. |
| F2 | Medium | Main landed the Work Event Store cutover in `42c5a0a55` (2026-10-24 20:50), about 7 hours before this commit. On main, `src/state/events.mjs` is gone, and Work events append through the Event Store consumer gate (`event-log.mjs` header; `store.mjs` imports `work-event-store.mjs`). `withStateTx` is still the serializer. The 2e2bc926 statements "appendEventCore as the lock-free log core" and "NOT a claim that Work has cut over" are true at the plan pin but false on main. The brief named main's cutover. Record the decision as pin-scoped and re-decide it at the next main sync, when the target implementation-pointers unit will change too. |
| F3 | Low | In 5ba6768e, both `changedClauses` entries list the same six `changeSources`, the union of the identity and rigor sources. The prose assigns them correctly; the machine field does not. |
| F4 | Low | claim_320ba622 (row 46) says only the required-field and id clauses changed. The diff also changes "(9 file)" to "trong nhiều file (ví dụ …)". |
| F5 | Low | The stale pointers are retired by duplicate effective rows: 124-126 copy the bindings of /6, /20 and /21. The current row is named only in prose. A later in-place rebind of /6, /20 or /21 must also update 124-126, or the stale-pointer defect returns. |
| F6 | Info | `verify.py` returns 0 while `audit-report.py` exits 1, because checks.mjs is not run (126) in both manifests. The receipt discloses this, but the audit is not green. |
| F7 | Info | The receipt status is **blocked**: earlier attempts may have written an addon cache `df2c8ce8230fecdf`. No such directory exists under the worktree's or main's `.fgos/runtime/git-addon`, so it was probably local to the Doer's sandbox. The merge happened anyway, and the Lead should record that it accepts this exception. |
| F8 | Low | C: the committed-mode base drifts after any later parity edit. Pin it to `receipt.json.sourceHead`. |

## Commands (host, read-only)

- `python3 -B P/reports/phase-09/rebind/rebind.py --check` → 0. It writes its fixed scratch `/tmp/fgos-work/w5-rebind-apply`, which I removed afterwards.
- `python3 -B P/reports/phase-09/g0rework/verify.py` → 0 (twice; final run at `35c7f92bf`).
- `python3 -B P/reports/phase-09/g9/sweep.py --check --pin HEAD` → 0; with `--pin d8d77543a` → 0.
- Extractor replays: node with `process.dlopen` blocked, scratch in a mktemp dir under `/tmp/fgos-work/`, removed afterwards.
