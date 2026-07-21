---
name: fgos-compounding
description: >-
  Turn a proposed item's real captured signal into a Diataxis-classified,
  evidence-quoted end-user document before the item is allowed toward `done`.
  Use once a claimed item's stage reads `compound-learn` — the synthesis step
  between `executing` and `done`. Examples: "synthesize what this item
  captured", "classify this capture and write the end-user doc", "the item
  just reached compound-learn, what happens now".
---

# fgos-compounding

Runs while a proposed work item sits at stage `compound-learn` — the
deliberate synthesis step that gates the item's path onward: no item takes
the edge toward `done` without first passing through this step's synthesis
of its real captured signal into an audience-facing document. This skill
turns the item's genuine outcome/friction capture into (a) a Diataxis
quadrant classification, tagged onto the capture, and (b) at least one real,
evidence-quoted end-user document.

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
- Do not apply the item's own stage or status move yourself beyond the one
  producer command named below. The engine still validates and applies
  every move; this skill's classification and document are input to that
  decision, never a substitute for it.
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

3. **Store the tag.** Run `fgos compound <id> --doc-type <quadrant>` with
   the quadrant chosen above. This is the one producer surface this step is
   allowed to use — it stores the Diataxis tag on the item's capture. Since
   this step only runs once the item is already at stage `compound-learn`,
   the call tags the capture without moving stage again (there is no
   compound-learn -> compound-learn move to make). Absent this call, the
   item's capture stays untagged and synthesis is unfinished.

4. **Write the document.** Create (if missing) `docs/<quadrant>/` and
   write at least one document there whose content is quoted from the real
   capture read in step 1 — never paraphrased into something the capture
   did not actually say. Match the quadrant's own shape: a tutorial reads
   as ordered steps, a how-to as a recipe for one goal, a reference as a
   lookup table or list, an explanation as prose discussion.

5. **Confirm the close.** Run `fgos check <id>` again and confirm the
   `docType` field now shows the quadrant just stored, and that the
   document from step 4 exists on disk. A tag with no matching document, or
   a document with no matching tag, is unfinished — return to whichever
   half is missing before treating this step as done.

## Next

Once the tag is stored and the document is written and confirmed, load
`fgos-routing` to re-read the item's stage and continue — routing decides
whether the item's own already-registered move onward gets picked next;
this skill's own job ends at a tagged capture and a written document.

## Red flags

- a quadrant chosen without reading the item's real capture first
- a document written from a title or a guess instead of the real capture
  text
- storing the tag without writing the document, or writing the document
  without running the tagging command
- a document filed under a quadrant directory that does not match the tag
  just stored
- applying the item's stage or status move directly instead of leaving it
  to the engine
- splicing an item's raw `title`/`description` into a shell command

Violating the letter of the rules is violating the spirit of the rules.

Tag stored, document written, both confirmed against the real capture.
Invoke `fgos-routing` to continue.
