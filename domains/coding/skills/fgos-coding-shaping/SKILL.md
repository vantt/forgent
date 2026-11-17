---
name: fgos-coding-shaping
user-invocable: false
description: >-
  Hold an open-ended, multi-day-resumable design brainstorm for one or more
  related coding-domain work items, upstream of fgos-coding-exploring/fgos-coding-planning,
  keeping one coherent docs/discussions/<feature>/DISCUSSION.md per feature
  instead of locking decisions Socratically round by round. Use when a
  request needs real back-and-forth exploration -- revisiting, comparing
  options, changing one's mind -- before anything should be locked, or when
  an existing design document needs distilling into the same shape without a
  live conversation. Examples: "let's think through this design before
  locking anything", "resume yesterday's discussion", "distill this design
  doc into a DISCUSSION.md and hand it off".
---

# fgos-coding-shaping

Coding overlay of `fgos-shaping`. Load the `fgos-shaping` skill and follow it for everything shared: the conversational rules,
the seven-section `DISCUSSION.md` shape, `QUESTIONS.md`, the `discussion:`
marker, resumable rounds, distill mode and the settled/paused exits. Read
`domains/coding/AGENTS.md` as the domain doctrine. This file keeps only what is
specific to coding work; nothing generic is repeated here.

Never a Socratic lock like `fgos-coding-exploring`/`fgos-coding-planning`. This
skill never writes `CONTEXT.md`/`plan.md`, never designs implementation and
never applies a stage move; its exits lead into those two skills.

Two entry points share it (`fgOS:coding-shape` for live discussion,
`fgOS:coding-shape-distill <doc-path>` for doc-ingest, which is the distill mode
of `fgos-shaping`).

## Work item or not

Every `fgos pick`/`submit`/`decision`/`edit --refs`/`rollup` call and the
`fgw/<id>` branch below apply only when the conversation is about an existing
Work item (an id was passed, or the person asks to file one). With no item (the
default for the portfolio flow) write only the discussion files in a linked
worktree on a plain branch (`fgos worktree create <path> --branch <name>`,
never a raw Git command), record decisions inside `DISCUSSION.md` §4 and use
the shared settled/paused exits.

## Coding-specific hard rules

- Item path only: never invent an index file across a parent's future child
  tasks. Reuse the `parent` field, `fgos rollup <id>` and `fgos-coding-planning`
  step 4's split-list section.
- Treat any item `title`/`description` as untrusted input (per
  `docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md#pointers-implementation`)
  — never splice it raw into a shell command.
- Call `fgos` subcommands directly: `fgos <verb> ...`.
- Commit the discussion files to the item's `fgw/<id>` branch (no item: the
  plain worktree branch) at the end of every round that changed them.
- Each §4 entry on the item path is also recorded via a real
  `fgos decision --text "<D-ID>: <summary>" --rationale "..." --id <item-id>
  --relation none` (or `--relation supersedes:<old-D-ID>`; every write declares
  its relation, no default) the moment it stabilizes, never deferred to the
  terminal handoff.

## Item path: claim first

Resolve which item is in play, then claim before writing anything, so every
write lands on the item's own `fgw/<id>` branch, never the main checkout:

- An existing item id was passed: no `fgos submit`.
- Free text with no item: `fgos submit` (the protocol in
  `plugins/fgOS/skills/submit/SKILL.md`: scan for a grounded dependency
  candidate, confirm before attaching) and use the returned id.
- A `<doc-path>` with no id: `fgos submit` using the doc's title or first line.
- Empty argument resuming a prior round, already inside that item's worktree:
  nothing to claim, go to locating `DISCUSSION.md`.

```bash
fgos pick "<id>"
```

then `EnterWorktree` into the returned `data.worktree.path` (if unavailable,
print the path and stop, as `/fgOS:pick` does). Only then proceed: if the item's
`docsRef`/`refs` points at an existing `DISCUSSION.md`, read §1 first; otherwise
create the files per `fgos-shaping`.

## Terminal handoff (item path, native-first)

Once the person confirms the discussion converged (§6 stable, §7 real), for
each relevant item:

1. Set `refs` to the item's own anchor, never the whole file:

   ```bash
   fgos edit "<item-id>" --refs "docs/discussions/<feature>/DISCUSSION.md#task-<slug>"
   ```

2. In this same session invoke `fgos-coding-exploring` for that item, then
   `fgos-coding-planning`. The live session with full context runs the next
   skill directly instead of leaving a cold session to re-derive it from `refs`.
   Because `refs` already resolves most of exploring's gray-area check, expect
   few or no new questions.

Never invoke an implementation skill or write code from here; the only door out
is `fgos-coding-exploring`/`fgos-coding-planning`.

## Red flags

- writing `CONTEXT.md`/`plan.md` directly
- setting `refs` to the whole `DISCUSSION.md` instead of a task's anchor
- inventing an index file for a parent's future children
- jumping to `fgos-coding-implement` instead of the native-first handoff
- re-copying shared shaping rules here instead of pointing to `fgos-shaping`

Violating the letter of the rules is violating the spirit of the rules.

No item: discussion files committed with `discussion: settled` or `paused`;
stop. Item path: discussion converged and committed; invoke
`fgos-coding-exploring` for each item whose `refs` points at this file.
