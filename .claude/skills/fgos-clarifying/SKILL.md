---
name: fgos-clarifying
user-invocable: false
description: >-
  Read a raw submission's text and decide, without asking anyone, whether
  its intent is already understood — asking a person only when a genuine
  gap remains — then classify which domain it belongs to. Runs at Init,
  before any work item exists: called directly by `/fgOS:submit`'s own
  launcher, BEFORE `fgos submit` ever creates the item. Never Socratic by
  default: this skill starts silent and only speaks when it genuinely
  cannot tell what the text is asking for. Verdict-only — it never writes
  state, it returns `{title?, description?, domain, question?}` straight
  back to whichever launcher called it. Examples: "a person just typed a
  submit request, is its intent clear", "decide whether this needs a
  person before any item gets created", "classify which domain this
  submission belongs to", "the description is one line, is that actually
  enough".
---

This is a generated thin wrapper (tsk-1qi) -- do not edit directly, edit the source instead.
The real skill content lives at `../../../.agents/skills/fgos-clarifying/SKILL.md`, this project's own canonical skill source.
Read that file and follow it directly.
