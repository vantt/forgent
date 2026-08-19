# RESEARCH — tsk-67t: audit of commit 7bf76aaa's stray-merge absorption

## Round 1 — 2026-08-18

**Asked:** Is tsk-5nj's plan-split content (plan.md split into tsk-4mx +
tsk-49e) genuinely intact on `main` today, and did tsk-648's own
retrospective-synthesis doc write survive in the same commit and get
properly tagged via `fgos compound`? (`docs-67t`, carried over from
tsk-2oy round 1's audit list, row 1 of the 5-instance table in
`docs/history/retrospective-synthesis-merge-corruption/RESEARCH.md`.)

**Checked (git, direct — no assumption from the item description):**

1. `git show 7bf76aaa --stat` — confirms `7bf76aaa` is a 2-parent merge
   (`Merge: 9340ad59 18b90ab8`), commit message
   `docs(tsk-648): retrospective synthesis`. Files changed relative to
   parent 1 (`9340ad59`, tsk-3wn's prior retrospective-synthesis):
   - `docs/explanation/why-fgos-review-crashed-with-enobufs-on-stale-branch-diffs.md` (91 lines, new)
   - `docs/history/tsk-5nj-state-json-write-only-cost/CONTEXT.md` (72 lines, new)
   - `docs/history/tsk-5nj-state-json-write-only-cost/RESEARCH.md` (69 lines, new)
   - `docs/history/tsk-5nj-state-json-write-only-cost/plan.md` (64 lines, new)

2. `git show 18b90ab8 --stat` (parent 2, `docs(tsk-5nj): plan.md -- split
   into tsk-4mx + tsk-49e`) — touches only `plan.md`, 64 insertions.
   `18b90ab8^` is `b076b638` (`docs(tsk-5nj): RESEARCH/CONTEXT for the
   state.json snapshot decision`), which is where `CONTEXT.md` and
   `RESEARCH.md` for tsk-5nj originate.

3. Byte-level diffs, source commit vs. merge-commit blob:
   - `git diff 18b90ab8:.../plan.md 7bf76aaa:.../plan.md` → **empty** (identical).
   - `git diff b076b638:.../CONTEXT.md 7bf76aaa:.../CONTEXT.md` → **empty** (identical).
   - `git diff b076b638:.../RESEARCH.md 7bf76aaa:.../RESEARCH.md` → **empty** (identical).
   All three files merged through byte-for-byte, no silent truncation or
   conflict-marker corruption.

4. Byte-level diff, merge-commit blob vs. current `main` HEAD
   (`b44a56bd`): `plan.md` differs by exactly 2 lines — both are a later,
   unrelated rename cleanup (`fgos-planning` → `fgos-coding-planning`,
   `fgos-validating` → `fgos-coding-validating`) from a subsequent commit,
   not data loss. `CONTEXT.md`/`RESEARCH.md` are still present
   (`git cat-file -e main:<path>` → success) and their content traces
   cleanly back to the same originating commits.

5. tsk-5nj's plan split actually got acted on: `fgos show tsk-4mx --json`
   and `fgos show tsk-49e --json` both report `"status": "done"`,
   `"stage": "executing"` — the split plan was not just preserved as text,
   it was executed to completion.

6. tsk-648's own retrospective-synthesis doc
   (`docs/explanation/why-fgos-review-crashed-with-enobufs-on-stale-branch-diffs.md`)
   — `git log --oneline -- <path>` shows exactly one commit ever touched
   it (`7bf76aaa` itself); `git diff 7bf76aaa:<path> main:<path>` is empty
   (never modified since). `fgos show tsk-648 --json` confirms
   `outcome.docType: "explanation"` and
   `outcome.docPath: "docs/explanation/why-fgos-review-crashed-with-enobufs-on-stale-branch-diffs.md"`
   — the doc write was captured and properly tagged via `fgos compound`,
   not silently dropped.

**Found:** Both open questions resolve clean. The merge at `7bf76aaa` has
the same *mechanical shape* as the bug tsk-2oy fixed (an unrelated
second parent absorbed into a `docs(tsk-648): ...`-labeled commit), but
in this specific instance `git merge` preserved every byte of both
sides — tsk-5nj's plan-split content is intact and was carried through to
two completed child items (tsk-4mx, tsk-49e), and tsk-648's own synthesis
doc survived and is correctly tagged. No content was lost or corrupted.
This is a **mislabeling-only** instance, not a content-loss instance —
consistent with a normal `git merge` fast-forwarding both trees cleanly
(the corruption risk tsk-2oy's RESEARCH.md flagged is real for *other*
instances in the 5-row table, e.g. tsk-2x9/tsk-1r3 which buried a live
code fix — but tsk-67t's own instance, row 1, checks out clean).

**Still open:** Nothing regarding tsk-67t's own scope. The other 3
unaudited rows in the 5-instance table (tsk-1q5/tsk-13m,
tsk-1vi/tsk-66t, tsk-2x9/tsk-1r3) are out of scope here — each is its own
follow-up item per tsk-2oy CONTEXT.md D1.

**Verdict:** `clear: true`, `verify: "npm test"` (item's existing verify;
no code change is warranted by this finding, so the repo's ambient test
suite green is the only proof needed).
