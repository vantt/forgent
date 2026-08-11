---
name: coding-shape
description: >-
  Use when the user wants to hold a live, open-ended design discussion for
  an fgOS coding-domain work item (or a cluster of related ones) before any
  decisions get locked, from inside a Claude Code session, invoked as
  /fgOS:coding-shape [id|free-text]. Dispatches into fgos-coding-shaping's
  interactive entry -- never writes .fgos/ state or docs/history/ content
  directly itself.
---

# fgOS coding-shape

Wraps `fgos-coding-shaping` so a person working inside Claude Code can open
or resume a real design conversation without hand-typing anything. This
skill carries no discussion or design logic of its own — every question,
every `DISCUSSION.md` edit, every hand-off decision belongs to
`fgos-coding-shaping`; this file only routes the request there.

## Steps

1. **Read the argument.** The text after `/fgOS:coding-shape` is either an
   existing item id, free text describing something new to think through,
   or empty (resume whatever `DISCUSSION.md` this session was last working
   on, if any). Pass it through unexamined — do not classify, summarize, or
   pre-judge it here; that scouting/framing job belongs to
   `fgos-coding-shaping`'s own Flow.

2. **Invoke `fgos-coding-shaping` in interactive mode.** Load the skill
   with the argument from step 1, mode: live discussion (not distill —
   that is `fgOS:coding-shape-distill`'s job). It locates or creates the
   relevant `docs/history/<feature>/DISCUSSION.md`, holds the open
   conversation, and owns every decision about pacing, scouting, and when
   to regenerate its own §6 synthesis.

3. **Let `fgos-coding-shaping` run to its own stopping point.** It either
   pauses mid-discussion for the next round (a normal, expected outcome —
   multi-day, multi-session discussion is this skill's common case, not an
   edge case), or reaches convergence and fires its own native-first
   handoff into `fgos-coding-exploring`/`fgos-coding-planning`. Report back whichever of
   those `fgos-coding-shaping` actually reached — this wrapper does not
   add a second stopping condition of its own.
