# plan.md — tsk-5wf: decision doc mới supersede phần từ vựng của `0026`

Mode: **tiny** (a couple of files, one direct task, no gray areas — three
clauses to fix are already named verbatim by the item's own description and
by the locked decisions D7/D8/D17 on `tsk-5td`). Flag count: 0 of the 10
(auth/authorization/data-model/audit-security/external-systems/public-
contracts/cross-platform/existing-covered-behavior/weak-proof/multi-domain)
— this item edits only prose in `docs/decisions/`, no code, no schema, no
existing test surface.

No `docsRef` on this item — its own `refs` field points directly at
`docs/history/dispatch-concept-boundary/DISCUSSION.md#task-decision-doc-0026`,
one of seven items minted from that shared shaping document (`tsk-5td`'s own
`fgos-coding-shaping` session, vòng 27 "bàn giao"). That anchor section
(§7.1) plus §6.3/§6.4/§6.7 of the same file, plus `tsk-5td`'s own locked
decisions D7/D8/D17 (read live via `fgos show tsk-5td` — the shared event
log, readable across worktrees regardless of branch) are this plan's only
source of truth. `tsk-5td` itself is still `status: doing` on its own
unmerged branch (`fgw/tsk-5td`), so its `DISCUSSION.md` is only visible from
its own worktree (`.claude/worktrees/tsk-5td-pqXr9j/`) — read from there
directly, never re-derived from memory.

## Verified against the real repo (not taken on faith from the description)

- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — current file already reflects `0028`'s rename (body says "launcher"
  throughout, `superseded_by: 0028` in frontmatter) — confirmed live. The
  three clauses this item must fix:
  - lines 68-71 (`subTask`) and lines 59-66 (`rootTask`) — `0026` itself
    calls `rootTask` a **vai trò** ("công việc gốc đang làm... Vai trò này
    có tính ĐỆ QUY/fractal") and `subTask` a **relative name** ("chỉ là tên
    gọi tương đối, nhìn từ góc của bên kích hoạt") — matches D7's own
    rationale verbatim.
  - lines 73-87 (`capacity`) — "1 đơn vị functional/helper hẹp... không tự
    mang vòng đời 1 rootTask đầy đủ" — matches D8's target clause.
  - `0026` never enumerates a fixed value-set for the caller-side role
    (T1) at all — D17 fills a gap `0028`/`tsk-2cw` left open ("giải phóng
    từ orchestrator để dành cho MỤC ĐÍCH KHÁC", never assigned), not a
    literal string to replace.
- `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md` — frontmatter
  template this item's own instructions say to copy (`type`, `title`,
  `tags: []`, `timestamp`, `source_capture_ids: []`, `date`, `supersedes`)
  — confirmed live, copied exactly in Approach below.
- `docs/decisions/0000-index.md:27-32` — repo's own supersede policy:
  change = new record, never edit in place; old record gets
  `superseded_by: <new id>` in frontmatter plus an updated summary line in
  the index table.
- `rg "superseded_by" src/ bin/` → **one hit**, `src/runner/merge.mjs:486`,
  a doc-comment describing the convention — **not parsed by any code**.
  Confirms the CAM BAY 1 shape question is a pure-prose decision, safe to
  settle here without touching code.
- `ls docs/decisions/` → highest existing number is `0028` — `0029` is free
  as of this read. Per the item's own CAM BAY 2 warning, this check is
  **not** the final word — it must be repeated immediately before the file
  is actually created at execution time, since a concurrent branch could
  mint `0029` first.

## Approach

**CAM BAY 1 resolved: `superseded_by` becomes a list, `[0028, 0029]`.**
Rationale: `0028` and `0029` supersede *different, non-overlapping* slices
of `0026`'s text — `0028` covers the "orchestrator" naming only (its own
D1: "supersedes 0026 on the 'orchestrator' naming only"), `0029` covers the
three vocabulary clauses (rootTask/subTask, capacity, T1 value-set), none of
which `0028` touched. `0000-index.md`'s own stated purpose for
`superseded_by` is to stop a session that reads `0026` directly from
re-deriving stale framing — a reader needs to know about **both** live
successors to get the full current framing, since neither one alone
supersedes the whole document. Overwriting to a bare `0029` would silently
drop the `0028` citation for the naming slice, which is still current and
still cited by 12 skill files' worth of path references (per `0028`'s own
Hệ quả section). A list costs nothing new: `supersedes` on the citing side
is already an array (`0028`'s own `supersedes: [0026]`); using the same
shape for the reverse pointer is the cheaper, more consistent choice than
inventing new syntax, and no code parses this field to break.

One chained set of edits, three files touched:

1. **Re-check `ls docs/decisions/` immediately before naming the file**
   (CAM BAY 2) — if `0029` is taken by then, use the next free number and
   update every reference below accordingly; do not assume the number this
   plan reads today still holds.
2. Create `docs/decisions/0029-<kebab-slug>.md` (slug TBD at execution,
   descriptive of "sửa từ vựng dispatch của 0026" — e.g.
   `0029-sua-tu-vung-dispatch-roottask-subtask-capacity-cua-0026.md`),
   frontmatter copied from `0028`'s exact shape:
   ```yaml
   ---
   type: explanation
   title: "0029 — <tiêu đề>"
   tags: []
   timestamp: <ISO now>
   source_capture_ids: []
   date: <today, YYYY-MM-DD>
   supersedes: [0026]
   ---
   ```
   Body covers exactly the three clauses from `0029`'s Verified section
   above, citing D7/D8/D17 by id and quoting `0026`'s original wording
   before each replacement (same "Bối cảnh → Quyết định → Hệ quả" shape
   `0028` uses). Explicitly states, per D17's own correction, that "T1 has
   two values (launcher/driver)" is a **new** clause `0026` never wrote
   (not a literal string replacement) — filling the gap `0028`/`tsk-2cw`
   left open, not overriding either of them.
3. Edit `docs/decisions/0026-...md` frontmatter **only**: line 9
   (`superseded_by: 0028`) becomes `superseded_by: [0028, 0029]`. No other
   byte of `0026` changes — its body already reflects `0028`'s in-place
   rename per that record's own explicitly-decided exception; this item
   does not repeat that exception for its own vocabulary changes, since the
   item's own hard fence says body text lives entirely in `0029`.
4. Add a one-line note to `0026`'s table row in `docs/decisions/0000-index.md`
   (mirroring the existing `0006`/`0023` rows' "Đã supersede bởi..." pattern)
   naming both `0028` (naming) and `0029` (vocabulary), so the index table
   itself doesn't read as 100%-current either.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| New `0029` file content accuracy | Low — three clauses and their D-IDs are already locked and quoted verbatim above, no new judgment needed | `rg -n "rootTask\|subTask" docs/decisions/ src/ bin/` returns 0, or only historical mentions inside `0026`/`0028`'s own frozen prose |
| `0026` frontmatter edit scope | Low — single line, mechanical | Diff of `0026` shows exactly one line changed (`superseded_by`), body byte-identical |
| Decision-id collision on merge | Medium — flagged explicitly by the item itself (CAM BAY 2), real given ~100 open worktrees in this repo today | Re-run `ls docs/decisions/` immediately before file creation; if merge still collides, follow `docs/how-to/resolve-a-decision-id-collision-merge-conflict-on-approve.md` |
| Item's own verify rg scope (`docs/decisions/ src/ bin/`) shows non-`0026`/`0028` residue | Medium — found at `fgos-coding-validating`: `src/runner/dispatch.mjs:649,654` already use `subTask` in docstring prose describing the live dispatch-decision helper, unrelated to the vocabulary this item retires, and out of this item's own no-code-edit fence | User confirmed at the validating gate (2026-08-09): `0026`/`0028` in the verify text is an example of acceptable historical residue, not an exhaustive list — `dispatch.mjs`'s prose counts too. Verify passes with these 2 known, pre-existing hits; no follow-up item needed for this alone |
| `superseded_by` shape (list vs overwrite) | Low once decided — no code reads the field | Resolved above with cited evidence (`rg` confirms no parser); documented so a future third supersede of `0026` has a precedent to extend, not re-litigate |

Impact-analysis capability gate (`CLAUDE.md`): this item touches no code
(`docs/decisions/**`, `docs/decisions/0000-index.md` only) — blast-radius
analysis does not apply to a pure-prose change with zero identifiers in
`src/`/`bin/` (confirmed by the `rg` check above). Posture: **not
applicable**, not skipped — there is no symbol here for `impact()` to
analyze.

## No split

One honest piece of work — one new file, two single-line-scoped edits to
two existing files, all three edits mechanically determined by decisions
already locked on `tsk-5td`. No independently shippable sub-piece;
`fgos graph --what-if` was not run because there is no split candidate to
compare.

## Outstanding questions

None

## Post-implementation note (fgos-coding-implement, 2026-08-09)

Two deviations from this plan, both user-confirmed at implementation time:

1. **Step 4 (index note) dropped.** The plan assumed `0026` already had a
   row in `docs/decisions/0000-index.md`'s table to append a note to — it
   does not; the table stops at `0025`, and `0026`/`0027`/`0028` were never
   backfilled (a pre-existing gap unrelated to this item). Backfilling
   three missing rows to add one note is out of D7/D8/D17's scope; skipped
   rather than expanded.
2. **Item's own `verify` field patched twice, both via `fgos edit --verify`.**
   First: the field was Vietnamese prose, not a runnable shell command —
   `fgos return` failed with a shell syntax error. Patched to an equivalent
   runnable command covering the same checks (user-confirmed). Second: that
   command's `npm test` clause runs the whole suite, which is red for 5
   pre-existing, unrelated files (`docs/history/backlog-execution-
   reconciliation/RECONCILIATION.md`, `tsk-33w`'s and `tsk-4eu`'s
   `iron-law-evidence.md`, `docs/how-to/produce-failing-test-first-proof-
   for-an-iron-law-gated-diff.md`, `plans/260808-2210-dispatch-vocabulary-
   rearrange/next-session-prompt.md` — all committed 2026-08-08 by other
   items, confirmed via `git log`) already failing
   `test/docs/launcher-vocabulary-guard.test.mjs`'s whole-repo NEGATIVE
   scan for the word "orchestrator". User chose (over fixing all 5, or
   parking) to narrow `verify`'s test clause to
   `node --test --test-name-pattern='POSITIVE|self-check'
   test/docs/launcher-vocabulary-guard.test.mjs` — the POSITIVE assertions
   (including the new `superseded_by: [0028, 0029]` regex this item
   updated) plus the two synthetic self-check tests, excluding only the
   whole-repo NEGATIVE scan that fails for reasons outside this item's
   footprint. **This pre-existing debt is not fixed by tsk-5wf** — a
   separate item should re-run the full `launcher-vocabulary-guard.test.mjs`
   NEGATIVE test and either allowlist or reword those 5 files.
3. **`fgos approve` (post-merge re-verify) failed a third time, exit 1.**
   Root cause: the verify command's `rg` exclusion matched
   `src/runner/dispatch.mjs`'s two `subTask` comment lines by hardcoded line
   number (`:649|654:`) — accurate against this branch's own base
   (`branchHeadAtTake: 51ddb258`), but `main` had moved 5 commits ahead by
   approve time and an unrelated merge shifted those same two comments to
   lines 707/712. Fixed by matching the file path alone
   (`^src/runner/dispatch\.mjs:`, no line-number anchor) — verified only 2
   hits remain in that file (still lines 707/712, same content, confirmed
   by direct read) before broadening the exclusion. Lesson: a verify
   command embedding a specific line number from a file this item does not
   own is fragile against concurrent, unrelated edits to that file between
   `return` and `approve`; match by path when the item isn't the one
   authoring the file's content.
