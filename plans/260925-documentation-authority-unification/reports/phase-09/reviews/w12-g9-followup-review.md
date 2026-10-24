# G9 follow-up review (w12)

Commit `4c9e1f31e` ("bind replayed bodies and refresh source evidence"), merged in `c4133d86a`. Checked at HEAD `335b7faa9`. The judged pin is `d786e305e` (the commit's parent). No non-plan file changed between `d786e305e` and HEAD, so `--pin HEAD` and the named pin read the same source bytes.

Verdict: **pass with findings**. The checks hold. Three gloss findings (medium) remain in the prepared records and should be fixed before F. Nothing blocks the next step.

## 1. Scope — pass

`4c9e1f31e` touches only `g9/**` (26 files) and `composition/**` (15 files). It does not touch `ledger/decisions/**`, and no ledger change was claimed.

## 2. Sweep and re-judged rows — pass

- `python3 -B g9/sweep.py --check --pin X` exits 0 for X = HEAD, `4c9e1f31e` and `d786e305e` (about 16 s each). Result: 0 drift, 0 chain mismatches, 0 body mismatches, 0 judgment errors, 1,016 body replay commands.
- Join check. `git diff --name-only d14d89865 d786e305e` lists 90 paths: 84 under `plans/`, plus 5 docs files and `scripts/check-legacy-docs-ratchet.exceptions.json`. I matched them against every string field of all 574 rows (path, currentPath, evidence paths, recordFile) and against the passage `path`/`currentPath` fields. Exactly one row matches: `citation-ratchet-roots.jsonl:7`. Its 52 exceptions.json passages all belong to that row. The other docs files appear only as `operand` text, never as evidence paths. The set is complete.
- That row is still `absent` / `owned-park`. `currentFileSha256` 52d2936c… equals the blob at the pin.
- Old vs new judgments, compared per row: **0 disposition changes**. One record classification changed (`tests-judgment-batch6.jsonl:16`, changed→moved, still-valid), which is the LF case.

## 3. Glosses #61/#62/#64 — pass with findings

- #61, #62 and #64 now read `Mục 1:`…`Mục 8:` with capitals, and every number is kept. The labels are not literally `D1:`…`D8:`. That choice is defensible, because bare `D\d+` tokens are what `check-decision-citation-drift.mjs` treats as local ids. But see M2.
- `w10-gloss-audit.json` has 104 per-witness entries with before/after, matches, label accounting and status. Both reviewed matches (#66, #97) hold up.
- My own scan of all 104 witnesses, plus a spot-read of 14 (#59, #60, #63, #65, #70, #35, #94, #77, #95, #47, #19, #51, #2, #50), found faults the audit misses:
  - **M1.** `docs/platform/git/spec.md:1075-1079` (#35–#39) was a D1–D9 list. Every label is lost. #35, #36 and #39 still start their bold item in lowercase ("**the red-tests-first order (order)**"), while #37/#38 were capitalized in this commit. The new gloss repeats the old subtitle ("order (order)", "WAL digest evidence decision (WAL digest)"). The list-label rule only checks lists with several labels on one line, so this one-label-per-line list passes as "no local list".
  - **M2.** In the holder-lock spec, "mục N" already means section N ("Spec: mục 9", "xem mục 16"). In #62, "Mục 8: `worktree-admin` … xem mục 16 … Spec: mục 14, 16–18" now uses one word for both an item and a section. Use another label: "(1)", "Ý 1" or "QĐ 1".
  - **M3.** #65 (line 430) glosses the cross-reference "D8" as "the declared repo-lease and worktree-admin scope decision". That is wrong: it mixes the hardening-lane D8 (repo lease) with the main-door D8 (worktree-admin wraps add only). It also drops English into a Vietnamese sentence. With the Mục labels back in #62, it should simply point there ("Mục 8 của plan main-door").
  - Low, already present before this commit: Vietnamese glosses inside English sentences (#47, #50, #59), nested parentheses (#94, "(D-ADR0072 (…))"), and #2 "…starts an idle turn and record layout", which now reads as one phrase.

## 4. Body vs chain — pass

- The new code in `sweep.spec_sweep` replays the current composition chain from the pin preimage, applies the body's own diff to the same preimage, and compares bytes plus `expectedAfterSha256`. `verify.py` asserts the same.
- Scratch copy at `/tmp/fgos-work/w12-g9-review/` (symlinked root, copied g9 `*.py` and `recomposed.json`, `GIT_DIR` exported). Unmodified copy: exit 0. Four mutations, each run with `--check --pin HEAD`:
  - A: old holder-lock body, old hash, current chain metadata → exit 1, body mismatch.
  - B: old body with the current `expectedAfterSha256` forged in → exit 1, "historical after hash mismatch".
  - C: old agent-confinement body with its old preimage → exit 1, drift plus body mismatch.
  - D: a self-consistent edited body (one `+` line changed, hash recomputed, applies cleanly) → exit 1, body mismatch.
  - Restoring the original file gives exit 0 again.
- `patch --batch --fuzz=0 --reject-file=- -p1`, forward then rollback, on the pin preimage for holder-lock, `docs/reading-map.md`, agent-confinement `rollout-and-settled-facts.md` and git spec: before hash matches, exit 0/0, after hash matches, rollback is byte-exact, no offsets or fuzz.
- Note: the check reuses `recompose.relocate`, the same code that produced the bodies, so it proves the bodies match the current chain but is not an independent replay. Mutation D shows it still catches a stale but self-consistent body.

## 5. Trailing LF — pass

- `same_passage` accepts exactly one added or removed final LF. In `passages.json`, every moved/unchanged passage whose text differs from its bound text (274) differs only by a final LF. Nothing else is absorbed.
- Old vs new judgments: exactly 274 passages went changed→moved, in 26 rows. No other passage classification changed and no disposition changed.
- Receipt counts match `judgments.json`: records 55/89/352/78, evidence 3,576/13,040/3,583/995, dispositions 229/7/338. **L2:** the "Passages" column counts per-row evidence (21,194), not unique passages (20,621 in `passages.json`). The column label should say so.

## Low

- **L1.** `sweep.py --check` now imports `recompose.py`, which runs `mkdir /tmp/fgos-work/w11-g9` at import and writes temporary directories under it during the replay. So the docstring "this module never writes files" is no longer true, and every check recreates the scratch directory that the receipt says was deleted. My run recreated it, and I removed it afterwards. Fix: pass a temporary directory in, or create it lazily inside `relocate`.

Scratch is deleted. No git writes, no fgos CLI, and recompose/judge/verify were not run.
