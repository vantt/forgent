# Misc-fix pin and gloss polish review (w13)

Commits checked at HEAD `aaf127d23`:

- A: `901c41dea` "pin authoring checks and account for live rebinds", against `w11-misc-check-pin-brief.md`.
- B: `0fe6c4381` "polish gloss labels and make replay scratch disposable", against `w12-gloss-polish-brief.md` and the M1–M3 and L1–L3 findings of `reviews/w12-g9-followup-review.md`.

Verdict: **pass with findings**. A has one medium finding: the live part of the old check lost some assertions. B has only low findings. Nothing blocks the next step, but fix A-M1 before F.

## A. Misc-fix authoring pin

### Scope: pass

The commit changes only six files, all under `misc-fix/**`.

### Pinned authoring: pass

- `author_commit()` finds the commit with `git log -1 --format=%H -- misc-fix/binding-refresh.json`. Nothing is hardcoded. It resolves to `ad94156cf`.
- The check compares the regenerated shard and record with `git show ad94156cf:<path>`. It runs the effective-row loop on `preimages(ad94156cf)`. The extractor reads the docs at that commit through `virtual` entries.
- It also runs `rebind.py` as it was at `ad94156cf`, using `exec`. This is needed because the shard written at that commit contains the old "133 literal plus 8" disposition text, and the current `generate()` writes "136 plus 5".
- `python3 -B misc-fix/rebind.py --check` exits 0 (283 checked, 27 changed, 21 content changes, sourceHead `23f6eaccf`).

Old and new `check()`, compared line by line:

| Old assertion (on live bytes) | New |
|---|---|
| live shard == `generate(pin)` | authored shard == authored recipe's `generate(pin)` |
| live record == generated record | authored record == generated record |
| effective chain lands on `(SHARD, overlayPointer)` | same, on authored ledgers |
| `payload(r)==newBinding`, `bindingSha256==digest(r)` | same, on authored ledgers |
| `reviewStatus=='pending'` | same, on authored ledgers |

None of these assertions was removed, and none checks less at the authoring commit. On the live tree, however, every one except the binding payload is gone. See A-M1.

### Live overlay check: pass, with A-M1

`check_live` passes a row if the live ledger still has it as the effective binding with the same payload. Otherwise it passes the row only if `(shard, pointer, digest(preimage))` appears in a later, non-blocked record whose last-writing commit descends from the authoring commit. The 24 unchanged rows pass, and rows 14, 15 and 18 pass through `import3/binding-refresh.json`.

I ran my own controls on an in-memory copy of the live ledgers:

| Mutation | Result |
|---|---|
| none | pass |
| an unrecorded payload edit on row 3 (`targetUnitDigest`) | **caught**, `/bindingRefresh/3` |
| row 2 `reviewStatus` set to `approved` | not caught |
| row 2 `disposition` and `sourceContent` changed | not caught |
| row 2 `bindingSha256` set to zeros | not caught |
| a further edit to row 14, which was rebound in place | not caught (left to the owning rebind check, as the brief says) |

The Doer's two controls in `pin-controls.json` (a corrupted authored overlay, and the row-14 preimage dropped from the record) both fail with the expected assertion.

### checks.json: pass

The receipt states why `checks.json` changed: the new `miscAuthoringCommit`, authoring-commit doc reads, the sourceHead navigation baseline, and the G6 commands relocated to scratch. I ran `misc-fix/verify.py` and it exits 0 (1 min 38 s). The only rewrite was volatile: `sourceCommit` became HEAD and the temp dir names changed. I restored the file with `git show HEAD:<path>`, its SHA-256 matches the original, and the tree is clean. The G6 relocation in `verify.py` uses five `str.replace` calls. I checked that each pattern occurs in its source file (1/1/1/3/1), so none is a silent no-op.

### A findings

- **A-M1 (medium): the live check no longer covers fields other than the binding.**
  - The old check asserted on live bytes: the whole shard equal to `generate()`, `bindingSha256==digest`, and `reviewStatus=='pending'` on the effective row.
  - `check_live` compares only `payload()`. That is the four `KEYS` (target owner, anchor, unit digest, ancestry).
  - `rebind/rebind.py --check` reports only binding drift, and `replay-proofs.py` covers only rebound rows. So nothing now checks a live misc row's `reviewStatus`, `bindingSha256`, `disposition`, `sourceContent` or `claimId`. The controls above show this.
  - The 136/5 disposition correction in the live shard is now covered by no check either. The current `generate()` is never used in `--check`.
  - The receipt claims "All previous … hash, effective-row and pending-review assertions remain". That holds only at the authoring commit.
  - Fix: in `check_live`, for each row still effective at its own pointer, require these on the live row:
    - `bindingSha256==digest(row)` and `reviewStatus=='pending'`;
    - every non-binding field equal to the authored row, except fields that a recorded later change names;
    - the disposition text equal to the current `generate()` output for that row, so the 136/5 correction stays covered.
- **A-L1 (low): scratch is left behind after every run.**
  - `rebind.py --check` writes `/tmp/fgos-work/w11-misc-pin/misc/extract-units.mjs` and never removes it.
  - `verify.py` writes `registry.mjs`, `proof.py`, `physical-move.mjs` and `g6-owning-assertions.py` under `w11-misc-pin/verify/`.
  - The directory was present before my runs (times 02:15 and 02:26), so the receipt's "that directory was deleted" no longer holds after any later check.
  - This is the same class of problem B fixed for G9. Use a `tempfile` directory, or the lazy `workspace()` pattern.

## B. Gloss polish and sweep hygiene

### Scope: pass

The commit changes 36 files, all under `g9/**` or `composition/**`.

### Glosses: pass

I read the after-lines in `w10-gloss-audit.json`. They match `w8-citation-glosses.json` and the replayed bytes (0 mismatches across the four files).

- **#35–#39** (git spec): `(1) Order`, `(2), (3) Sequence counter and the scp form`, `(4) Worktree-add fsync count`, `(5), (6) Test move-down …`, `(7) WAL digest`, `(8) Drains`, `(9) Parked`.
  - All nine labels are back, grouped labels included. Each title starts with a capital and no subtitle repeats.
  - `(n)` is not a `D\d+` token, so the citation scanner does not read it as a decision id.
- **#62** (holder-lock): labels are `(1) (4) (5) (6) (7) (8)`, the same as the original D-numbers including the gaps. `mục` now appears only in `mục 16` and `mục 14`, which are sections.
- **#65**: "ý (8) của đoạn main-door chỉ bọc `git worktree add`". This is true: main-door item 8 wraps add only. It no longer mixes in the repo-lease D8, and the sentence is all Vietnamese.
- **#47 and #50**: the English column of the table now carries an English gloss. The Vietnamese column was already Vietnamese.
- **#59**: all English.
- **#94**: the nested parentheses are gone, using `D-ADR0072 (gloss)` after a dash.
- **#2**: fixed, but see B-L3.

### Vertical-list audit rule: pass, with B-L1

`audit_glosses` in `g9/w11-followup.py` now finds adjacent one-item-per-line numbered or lettered items. It ran on all 104 witnesses: 102 pass, 2 are reviewed matches (#66, #97), and none needs review. 5 witnesses are flagged as vertical (#35–#39). `w12-audit-controls.json` shows two things:

- Stripping the labels from #35–#39 is rejected with the exact lost labels.
- Generic numbered and lettered samples are rejected and then pass once the labels are restored.

### Chain replay: pass

I wrote an independent replay script, using only GNU patch, for `docs/platform/git/spec.md` and `docs/platform/holder-lock/spec.md`:

- The preimage at `eb744281d` matches `beforeSha256`.
- Each file is a 2-step chain (predecessor repin, then gloss). I applied each step with `patch --batch --fuzz=0 -p1`. Every exit was 0, with no fuzz or offset, and `expectedAfterSha256` matched each time.
- Rolling back in reverse order with `rollbackDiff` gives byte-exact intermediate states and restores the preimage.

### sweep: pass

`python3 -B g9/sweep.py --check --pin HEAD` exits 0. It reports 545 files, 0 drift, 0 chain mismatches, 0 body mismatches, 1,016 body replay commands and 0 judgment errors. The listing of `/tmp/fgos-work` was the same before and after the run, and `w12-gloss` stayed absent. `recompose.py` no longer creates a directory at import.

### Receipts: pass

- The g9 table header is now "Evidence passages per row". The rows are 3,576 / 13,040 / 3,583 / 995, totalling 21,194, which matches the sweep's `passageCounts`.
- The receipt gives 20,621 unique passages, and `passages.json` has 20,621.
- The records count (574), the dispositions (229/7/338), "14 distinct witnesses" (I counted the list) and "four changed bodies" (matches `w12-recomposition-delta.json`) are all correct.
- Both receipts list their commands with exit codes.

### B findings

- **B-L1 (low): the vertical-list rule only works when at least two adjacent items were both glossed.**
  - `vertical` requires a neighbouring witness on line ±1.
  - Suppose a single glossed item in a longer list loses its one `D3:` label. That row gets "single citation prefix is not an ordered list", so `ordered` is false and the loss is not flagged.
  - Fix: decide whether a line is vertical from the before-file's neighbouring lines, not from the witness set.
- **B-L2 (low): a narrow race in `recompose.workspace()`.**
  - Process A created the root and is finishing. Process B got `FileExistsError` but has not yet created its `TemporaryDirectory`. If A's `rmdir` runs in that gap, B fails with `FileNotFoundError`.
  - The other outcome of the same race is an empty root left behind.
  - Runs are serial in practice, so this is low. Fix: `TMP.mkdir(exist_ok=True)` inside the retry, or a per-process root.
- **B-L3 (low wording): #2 reads as both open and settled.** It now says "two forks left open (section 16: the Stop-drain decision and the record layout; Stop-drain permits only wake-enabled mail to start an idle turn)". The decision was answered on 2026-10-20 (witness #0). Better: "… the Stop-drain decision, later settled so that only wake-enabled mail starts an idle turn, and the record layout".
- **Note, not a finding:** #62 still has the English clause "(Amended 2026-10-17 by owner decision (Git G0 Q6); implementation lands …)" with nested parentheses. It is source text, not a gloss, and is outside this brief.

## What I ran and changed

- I ran `misc-fix/rebind.py --check`, `misc-fix/verify.py` (then restored `checks.json`), `g9/sweep.py --check --pin HEAD`, and my own controls and replay under `/tmp/fgos-work/w12-misc-review/`. That scratch is deleted.
- I did not run recompose, judge or the g9 `verify.py`.
- No git writes, no fgos CLI, no suites. My runs rewrote the contents of the existing `w11-misc-pin` scratch (A-L1). I left it in place, since it was there before.
- I wrote only this file and its `.json`.
