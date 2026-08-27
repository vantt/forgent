---
type: how-to
title: How to hold an open-ended design brainstorm with fgos-coding-shaping
tags: [fgos-coding-shaping, discussion, brainstorm, clarify]
timestamp: 2026-08-06T09:50:00.000Z
source_capture_ids: [tsk-69g, tsk-5qs]
framework: diataxis
mode: how-to
---

# How to hold an open-ended design brainstorm with `fgos-coding-shaping`

Use this when one or more related coding-domain work items need real
back-and-forth exploration — revisiting points, comparing options,
changing your mind — before anything should be locked into `CONTEXT.md`/
`plan.md`. This is upstream of `fgos-coding-exploring`/`fgos-coding-planning`, not a
replacement for either.

## Two ways in

- **`/fgOS:coding-shape [id|free-text]`** — interactive. Holds a live,
  open-ended conversation.
- **`/fgOS:coding-shape-distill <doc-path>`** — fast doc-ingest. Distills
  an existing design document straight into the same shape without a
  live round-trip conversation.

## What it produces

One coherent living document per feature — never one file per task, to
avoid fragmenting the read-through — at
`docs/history/<feature>/DISCUSSION.md`, with fixed sections in order:

1. **Trạng thái hiện tại** — status recap, updated every round, so a
   multi-day-resumable discussion can pick back up cleanly.
2. **Mục tiêu & đề bài**
3. **Vấn đề rõ/chưa rõ** — living table of clear vs. still-open points.
4. **Quyết định đã chốt** — a D-ID table, append-only. Each entry is also
   recorded via a real `fgos decision --id <item-id>` call the moment it
   stabilizes.
5. **Q&A log** — append-only, timestamped.
6. **Thiết kế đã chốt** (`{#design}`) — the one section that gets
   *regenerated in full*, not appended, every time a new decision changes
   the design's shape: a coherent synthesis written as if fresh for a
   stranger, plus a diagram whenever there's real structure or flow to
   draw.
7. **Danh mục hạng mục/task** (`{#tasks}`) — one subsection per candidate
   task, each with its own `{#task-<slug>}` anchor: its own goal, an
   excerpt of §6, applicable D-IDs, relationships to sibling tasks, and a
   draft verify command.

## Every `DISCUSSION.md` write lands on the item's own branch, never on main

`fgos-coding-shaping` claims an item and enters its own `fgw/<id>`
worktree **before** creating or writing `docs/history/<feature>/
DISCUSSION.md` — never on the shared main checkout. This wasn't always
true: `tsk-5qs` fixed a real incident where the skill wrote and committed
`DISCUSSION.md` directly on main, confirmed by main's own HEAD carrying
several `docs(...)` commits with no merge behind them.

The claim sequencing depends on which of the two entry points was used:

- **`/fgOS:coding-shape <id>`** (an existing item) — skip `fgos submit`
  entirely, since the item already exists; claim and enter its worktree
  directly.
- **`/fgOS:coding-shape <free-text>`** (no existing item) — call `fgos
  submit` first to create the item, then claim and enter its worktree
  using the returned id.
- **`/fgOS:coding-shape-distill <doc-path> [id]`** — with `id`: distill
  into that existing item (claim + enter its worktree, same as the
  `id`-given case above). Without `id`: auto-create a new item via `fgos
  submit`, using the doc-path's own title/first line as the submitted
  text, then claim and enter its worktree using the returned id.

**Exactly one real item is ever claimed/worktree'd during an active
`fgos-coding-shaping` session** — the single `id`/free-text/doc-path
argument. This isn't a limitation worth working around: the skill's own
hard rule is that it never creates child items or attaches dependencies
itself during a live session — task breakdown (§7 above) is prose+anchors
only inside `DISCUSSION.md`. Real child-item creation happens downstream,
in `fgos-coding-planning`'s own split step, after this skill's terminal
handoff — so no multi-worktree design is ever needed here. The worktree
entered at the start of a shaping session is the same standard `fgw/<id>`
lifecycle used by every other stage (`fgos pick` + `EnterWorktree`),
persisting across `shaping -> exploring -> planning -> executing` on that
one item, merged once at `awaiting-approval` — not a separate,
discussion-only tree created and torn down early.

## Why the brainstorm stays open conversational prose

Unlike `fgos-coding-exploring`/`fgos-coding-planning`/`fgos-discover`, this skill never
forces convergence each round with a structured-choice tool
(`AskUserQuestion`). Revisiting and changing your mind mid-discussion is
expected, not a failure — a D-ID is only minted once a point has held
stable across multiple rounds. All formal convergence happens at one
place only: the native-first handoff below, never mid-brainstorm.

## How it hands off — never re-implements `fgos-coding-exploring`/`fgos-coding-planning`

This skill never writes `CONTEXT.md`/`plan.md` itself. Once the
discussion converges, it sets the target item(s)' `refs` field to a
scoped anchor inside its own `DISCUSSION.md`, then invokes
`fgos-coding-exploring` and `fgos-coding-planning` directly in the *same* session
(Native-First Dispatch Doctrine, `tsk-27y` D1/D2) — so those two skills
do their own real authoring with full live context, instead of a later
cold session having to re-derive it from scratch.

## Why the name is `fgos-coding-shaping`, not `coding-design`/`coding-brainstorm`

Domain-prefixed to match `fgos-coding-driving`'s own precedent — `coding`
is the only real, skill-loading domain today
(`src/state/workflow-stage-graphs.mjs`: the `synthetic` domain is
illustrative/disposable and never loads a skill). `coding-design` was
rejected (collides with the existing `design` skill's branding meaning);
`coding-brainstorm` was rejected too (collides with the existing generic
`brainstorm` skill).

## No new index file

There is deliberately no per-parent index file across a feature's child
tasks. Reuse the existing `parent` field, the live `fgos rollup <id>`
command, and `fgos-coding-planning` step 5's own mandatory split-list section in
`plan.md` instead — verified directly against all 162 pre-existing
`docs/history/*/` folders at design time, none of which carried an
index/README file; adding one here would have been a second, driftable
source of truth alongside the item store.

## Related

- `docs/history/fgos-coding-shaping/CONTEXT.md` — full locked decisions
  (D1–D6) and scout evidence.
- `docs/history/fgos-coding-shaping-branch-isolation/CONTEXT.md` — the
  submit-then-claim-then-worktree fix and its own locked decisions
  (D1–D4).
- `.claude/skills/fgos-coding-exploring/SKILL.md`,
  `.claude/skills/fgos-coding-planning/SKILL.md` — the two skills this feature
  invokes natively, never duplicates.
- `.claude/skills/fgos-coding-driving/SKILL.md` — the naming precedent.
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — Native-First Dispatch Doctrine, the handoff mechanism this skill reuses.
