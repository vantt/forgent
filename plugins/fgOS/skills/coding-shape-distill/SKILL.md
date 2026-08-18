---
name: coding-shape-distill
description: >-
  Use when the user wants an existing design document distilled straight
  into fgos-coding-shaping's DISCUSSION.md shape, without a live
  back-and-forth conversation, from inside a Claude Code session, invoked as
  /fgOS:coding-shape-distill <doc-path> [id]. With id, distills into that
  existing item; without id, fgos-coding-shaping auto-creates a new item via
  submit, using the doc's own title/first line. Dispatches into
  fgos-coding-shaping's distill entry -- never writes .fgos/ state or
  docs/history/ content directly itself.
---

# fgOS coding-shape-distill

Wraps `fgos-coding-shaping`'s fast doc-ingest entry: the same
`DISCUSSION.md` shape as `/fgOS:coding-shape`, but populated by extracting
from an already-written document instead of holding a live conversation.
This skill carries no extraction logic of its own — every read, every
section it fills, every judgment about what's still open belongs to
`fgos-coding-shaping`; this file only routes the request there with the
`<doc-path>` attached.

## Steps

1. **Read the `<doc-path> [id]` arguments.** The first token after
   `/fgOS:coding-shape-distill` is the path to an existing design document
   — a prior report, a spec, notes from outside this session. If it is
   empty, ask the user for the path before doing anything else;
   `fgos-coding-shaping`'s distill mode requires a real source document to
   extract from, not free text to discuss live (use `/fgOS:coding-shape`
   for that instead). An optional second token is an existing item id to
   distill into; pass both through unexamined, do not validate the id here
   — that is `fgos-coding-shaping`'s own claim step to resolve.

2. **Invoke `fgos-coding-shaping` in distill mode**, passing the
   `<doc-path>` and the optional `id` through unexamined. With an `id`,
   `fgos-coding-shaping` claims that existing item and distills into it —
   no `fgos submit` call. Without one, it auto-creates a new item via
   `fgos submit`, using the doc's own title/first line as the submitted
   text, then claims that. Either way it then reads the source document in
   full, extracts §2–§7 of `DISCUSSION.md` from it (goal, resolved/open
   questions, decisions — each still getting a real `fgos decision`
   call — a freshly synthesized §6, and the task breakdown in §7), and
   records the extraction itself as a single §5 entry rather than a
   transcript.

3. **Let `fgos-coding-shaping` run to its own stopping point.** If the
   source document leaves something genuinely open and material, expect a
   short live exchange for that gap specifically — this mode is fast, not
   silent about real ambiguity. Otherwise it proceeds straight to its own
   native-first handoff into `fgos-coding-exploring`/`fgos-coding-planning` once
   converged. Report back whichever of those `fgos-coding-shaping` actually
   reached — this wrapper does not add a second stopping condition of its
   own.
