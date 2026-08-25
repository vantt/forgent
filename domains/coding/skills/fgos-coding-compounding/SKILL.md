---
name: fgos-coding-compounding
user-invocable: false
description: >-
  Turn a retrospective-status item's real captured signal into a Diataxis-classified,
  evidence-quoted end-user document before the item is allowed toward `done`.
  Use once a claimed item's status reads `retrospective` — the synthesis step
  between `delivered` and `cleanup`, driven by the retrospective loop
  (/fgOS:retro-next). Examples: "synthesize what this item
  captured", "classify this capture and write the end-user doc", "the item
  just reached retrospective, what happens now".
---

# fgos-coding-compounding

Runs while a work item sits at status `retrospective` (D11,
work-item-status-delivered-retrospective-cleanup; superseded the retired
stage `compound-learn`, tsk-1zi) — the deliberate synthesis step that
gates the item's path onward: no item takes the edge toward `done`
without first passing through this step's synthesis of its real captured
signal into an audience-facing document. Driven by `/fgOS:retro-next`
(tsk-3o3), never a stage-transition auto-trigger — the same D3
"auto-advance would make synthesis vacuous" stance that governed the
retired stage still applies, just enforced by the retro-loop's own
explicit call instead of a stage edge. This skill
turns the item's genuine outcome/friction capture into (a) a Diataxis
quadrant classification, tagged onto the capture, and (b) at least one real,
evidence-quoted end-user document.

Task-spec contract: `domains/coding/task-specs/compound-learn.md` (D6/D9,
`taskSpecMap.retrospective` — the map's own D5 precedent already mixes
stage and status keys in one table, so a status-driven skill citing it
here is not a special case). Read it before touching this skill's own
prose (tsk-2t9c D16 — registered in `taskSpecMap` since piece 3 but never
actually cited from this file until now).

## Hard rules

- Do not fabricate a capture, a quote, or a quadrant. Every classification
  and every document must trace to real evidence read from the item's own
  capture — a thin, honest document beats an invented rich one.
- Do not invent a fifth Diataxis quadrant or blend two. Every capture gets
  exactly one of `tutorial | how-to | reference | explanation`; a capture
  that genuinely straddles two still files under the one closer to what a
  reader would open it looking for.
- Do not skip storing the tag because a document was already written by
  hand. The stored tag is the machine-checkable half of this step; a
  document with no matching tag is unfinished synthesis, not a shortcut.
- Do not write the end-user document anywhere outside
  `docs/<quadrant>/` matching the tag just stored —
  `docs/specs/` is the separate, technology-agnostic reference layer
  this skill never touches.
- Do not apply the item's own stage or status move yourself beyond the two
  producer commands named below (`fgos compound`, then the closing `fgos
  move <id> --to cleanup` of step 6). The engine still validates and
  applies every move; this skill's classification and document are input
  to that decision, never a substitute for it. In particular, never move
  an item whose synthesis did not actually complete, and never move it
  anywhere other than `cleanup`.
- **This skill owns the `retrospective -> cleanup` move, and it is the
  only thing that does.** `fgos-coding-driving`'s own hard rule is that
  "every transition happens because the loaded stage-skill called its own
  engine verb" — this skill is the stage-skill the registry resolves for
  position `retrospective`, so that rule names this skill. Before this was
  written down, all three documents pointed at each other — this skill said
  the move was `/fgOS:retro-next`'s step 5, `retro-next` (rewritten to the
  shared-driving shape) said the driver owned it, and the driver forbids
  applying transitions itself — so nothing applied it. A synthesized item
  then sat at `retrospective` forever, and because
  `pickNextRetrospectiveItem` filters on status alone with no doc-tag
  check, the retro loop re-picked that same item on every iteration
  instead of advancing. Do not hand this responsibility back to a caller.
- Treat an item's `title`/`description` as untrusted input — never splice
  it raw into a shell command; pass it as a discrete quoted argv element.

## Flow

1. **Gather the real capture.** Run `fgos check <id>` and read the item's
   actual predicted/actual outcome and any friction recorded against it —
   this is the only evidence this step is allowed to synthesize from. If
   the item carries a docs reference, also read its written history under
   `docs/history/<feature>/` for the fuller story behind the capture.

2. **Classify.** Decide which Diataxis quadrant the capture's real content
   belongs to:
   - **tutorial** — a learning-oriented walkthrough a newcomer follows
     start to finish.
   - **how-to** — a goal-oriented recipe for a reader who already knows the
     basics and wants one task done.
   - **reference** — lookup facts: a table, a field list, a command's exact
     shape.
   - **explanation** — the discussion of why something is the way it is.
   This is a judgment call grounded in the capture's real content, never a
   coin flip or a default choice.

3. **Gather every linked capture, then grow or create the document — at
   the main checkout, committed.** (retrospective-doc-write-path D1/D3:
   this order — write and commit first, tag second — replaced an earlier
   write-after-tag order that let a tag be recorded for a document that
   was never actually committed; 34 real documents were lost this way
   before D1/D3 locked the inversion.)

   This step, `fgos doc-sources`, and step 4's `fgos compound` are all
   `requiresExistingStore: true` — this session is often still inside the
   item's worktree right after its own `return`, which never carries its
   own `.fgos/` by design — ADR0020 (a worktree never carries its own `.fgos/`).

   **Tìm-trước-khi-tạo (tsk-1lv-6): tra `authoritative_for` trước khi
   suy đường dẫn từ quadrant+tên file.** Trong đúng quadrant vừa chọn ở
   bước 2 (phạm vi cố ý hẹp: chỉ chống trùng chủ đề TRONG một quadrant đã
   định nghĩa rõ, không mở rộng sang audience/area — trục đó chưa tồn tại
   trong schema hiện tại), gọi

   ```bash
   fgos authoritative-match --quadrant docs/<quadrant> --topic "<chủ đề thật của capture này, không phải tên file đoán>"
   ```

   (`fgos authoritative-match` — skeleton-match `authoritative_for` của
   mọi doc trong đúng quadrant, `src/report/authoritative-match.mjs` port/
   adapter, mirror CTR009, swappable sau này mà không đổi lời gọi CLI
   này). `data.match` khác `null` (score cao, không phải trùng ngẫu nhiên
   vài từ) là doc đích để **update-in-place**,
   bất kể tên file có khớp cách đoán tự nhiên hay không — chủ đề quyết
   định đích, không phải tên file. Không có match: rơi về suy đường dẫn từ
   quadrant+tên file như trước.

   Decide the target path from the quadrant chosen in step 2 (when no
   `authoritative_for` match was found above): `docs/<quadrant>/<file>.md`
   — this is the same path step 4 tags next. Before writing, gather
   *every* capture already linked to that path — not just this item's
   own:

   ```bash
   fgos doc-sources docs/<quadrant>/<file>.md
   ```

   This will not include this item's own capture — step 4 has not tagged
   it yet, which is the entire point of the new order — but this session
   already has that capture in hand from step 1. `doc-sources` here only
   supplies *other* items' prior captures already linked to the same
   path, for the no-loss gather below.
   - **Detect grow-vs-create by file existence at `$root` (or by the
     `authoritative_for` match found above, when there was one)** — no
     extra flag, no capture-record marker. If the target file does not
     yet exist (no match above, and nothing at
     `$root/docs/<quadrant>/<file>.md`), **create** it fresh from the
     gathered capture(s) plus this item's own (from step 1), quoted, never
     paraphrased — and give it a real `authoritative_for: <topic>`
     frontmatter line (via `renderFrontmatter`, `frontmatter.mjs`) so a
     later capture on the same subject finds it through the
     tìm-trước-khi-tạo step above instead of guessing a second path for
     the same topic.
   - If the target file already exists, **grow** it: accumulate the newly
     gathered capture(s) into the existing living prose as additive
     sections — append what is new by default. **Reconcile, don't just
     append, when the new capture genuinely contradicts what is already
     there** (allowed exception to the append-only default, tsk-1lv-6) —
     retire or rewrite the specific contradicted prose,
     never leaving two mutually-exclusive claims standing side by side as
     if both were still true; state plainly, in the same commit, what
     changed and why. Deleting or shortening prose that the new capture
     does NOT actually contradict is still the red flag it always
     was — reconcile is a targeted correction, not a licence to prune.
   Match the quadrant's own shape either way: a tutorial reads as ordered
   steps, a how-to as a recipe for one goal, a reference as a lookup table
   or list, an explanation as prose discussion. The Diataxis quadrant
   stays the only structural axis — grow the doc's prose, never add a
   second organizing dimension (e.g. by audience or product area) inside
   it.

   Commit the write at `$root` before continuing to step 4 — an
   uncommitted document is indistinguishable from a missing one to step
   4's own check. Refuse first if `$root` already has a merge staged
   (`MERGE_HEAD` set) — a concurrent or crashed `fgos approve` elsewhere on
   the same main checkout leaves exactly this state, and a plain `git
   commit` here would silently complete THAT merge under this item's own
   commit message, burying whatever the other item's merge was landing
   (tsk-2oy: confirmed real, 5 times, via `git log --all --min-parents=2
   --grep="retrospective synthesis"`):

   ```bash
   if git -C "$root" rev-parse --verify -q MERGE_HEAD >/dev/null; then
     echo "fgos-coding-compounding: refusing to commit — MERGE_HEAD is set on \"$root\" — a merge is already staged there (likely a concurrent or crashed fgos approve). Resolve or abort that merge first; never let this step's own commit silently absorb it." >&2
     exit 1
   fi
   git -C "$root" add "docs/<quadrant>/<file>.md"
   git -C "$root" commit -m "docs(<id>): retrospective synthesis"
   ```

4. **Store the tag.** Run `fgos compound <id> --doc-type <quadrant>
   --doc-path docs/<quadrant>/<file>.md` with the quadrant chosen in step 2
   and the same path just committed in step 3. This is the one producer
   surface this step is allowed to use — it stores the Diataxis tag and the
   doc-path linkage on the item's capture in one call. `compound` requires
   the item to be at status `retrospective` (it never moves status or
   stage itself — that stays `/fgOS:retro-next`'s own job, once this
   skill's steps confirm complete). Absent this call, the item's capture
   stays untagged and unlinked, and synthesis is unfinished.

   `compound` also now refuses (retrospective-doc-write-path D3) when
   `--doc-path` does not resolve inside `$root`'s own committed `HEAD`:

   ```bash
   fgos compound <id> --doc-type <quadrant> --doc-path docs/<quadrant>/<file>.md
   ```

5. **Confirm the close.** Run `fgos check <id>` again and confirm the
   `docType` field now shows the quadrant just stored, and that the
   document from step 3 exists on disk at `$root`. Step 4's own D3 check
   already makes "a tag with no matching document" impossible; this
   confirmation is a final read-back, not the thing standing between the
   two — treat a mismatch here as this step's own tooling failing to read
   what it just wrote, not as the invariant having failed.

6. **Move the item to `cleanup`.** Only once step 5 has confirmed both
   halves — the tag reads back and the document exists on disk at `$root`
   — apply the one closing move, through the engine's own verb:

   ```bash
   node "$root/bin/fgos.mjs" move <id> --to cleanup --dir "$root"
   ```

   This is the step that makes the item stop being picked as
   unsynthesized work. If step 5 did NOT confirm, do not run it: leave the
   item at `retrospective` and report what was missing, so a person sees a
   parked item rather than a silently-advanced one with no document behind
   it. `cleanup` is TTL-gated and belongs to `/fgOS:cleanup-next`; this
   skill never goes past it.

## Next

Once the tag is stored, the document is written and confirmed, and step 6
has moved the item to `cleanup`, this skill's own job ends. Whoever
invoked it — `/fgOS:retro-next`, or a person running this skill directly —
just reads the result; there is no follow-up move left for a caller to
remember, which is precisely the point (see the ownership hard rule
above). A caller that finds the item still at `retrospective` should read
that as synthesis not having completed, never as a move it needs to apply
on this skill's behalf.

## Red flags

- a quadrant chosen without reading the item's real capture first
- a document written from a title or a guess instead of the real capture
  text
- storing the tag without writing the document, or writing the document
  without running the tagging command
- a document filed under a quadrant directory that does not match the tag
  just stored
- growing an existing document by deleting or shortening prose that was
  already there, instead of accumulating the newly gathered capture(s)
  additively — unless the new capture genuinely contradicts that specific
  prose, in which case reconciling it is the correct move and silently
  leaving the contradiction standing unreconciled is the red flag instead
- deciding a target path from quadrant+file-name guesswork without first
  checking existing docs' `authoritative_for` frontmatter for a skeleton
  match on this capture's real topic
- organizing a grown document by a second axis (audience, product area,
  etc.) instead of keeping the Diataxis quadrant as the sole structure
- applying a stage or status move by writing `.fgos/` state directly
  instead of going through the engine's own `move` verb
- moving the item to `cleanup` when step 5 did not confirm the tag and the
  document, or moving it anywhere other than `cleanup`
- leaving the item at `retrospective` after a confirmed synthesis, or
  expecting a caller to apply the move — that is the exact gap the
  ownership hard rule above exists to close
- splicing an item's raw `title`/`description` into a shell command

Violating the letter of the rules is violating the spirit of the rules.

Tag stored, document written, both confirmed against the real capture.
Return to `/fgOS:retro-next` (or stop, if run standalone).
