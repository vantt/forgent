---
name: fgos-coding-shaping
user-invocable: false
description: >-
  Hold an open-ended, multi-day-resumable design brainstorm for one or more
  related coding-domain work items, upstream of fgos-coding-exploring/fgos-coding-planning,
  keeping one coherent docs/history/<feature>/DISCUSSION.md per feature
  instead of locking decisions Socratically round by round. Use when a
  request needs real back-and-forth exploration -- revisiting, comparing
  options, changing one's mind -- before anything should be locked, or when
  an existing design document needs distilling into the same shape without a
  live conversation. Examples: "let's think through this design before
  locking anything", "resume yesterday's discussion", "distill this design
  doc into a DISCUSSION.md and hand it off".
---

# fgos-coding-shaping

Holds a genuinely conversational design discussion — never a Socratic lock
like `fgos-coding-exploring`/`fgos-coding-planning`/`fgos-discover` use — and keeps one
living `docs/history/<feature>/DISCUSSION.md` per feature. Once the
discussion converges, this skill's only exit is a native-first handoff into
`fgos-coding-exploring` then `fgos-coding-planning`, the same terminal-state discipline
Superpowers' own `brainstorming` skill states directly: *"The ONLY skill you
invoke after brainstorming is writing-plans."* This skill never writes
`CONTEXT.md`/`plan.md` itself, never designs implementation, and never
applies a stage move — it produces the material those two skills consume,
nothing more.

Two entry points share this one skill (`fgOS:coding-shape` for live
discussion, `fgOS:coding-shape-distill <doc-path>` for fast doc-ingest) —
see the "Distill mode" section below for how the second one differs.

## Hard rules

- When asking questions (`fgos ask`), format question text using self-contained citations (`../_shared/citation-format.md`) and the required two-heading Markdown structure (`## Context` and `## Why this matters`, each followed by at least 20 characters of content).
- Never write `docs/history/<feature>/CONTEXT.md` or `plan.md` — that stays
  `fgos-coding-exploring`'s and `fgos-coding-planning`'s job, unchanged by this skill.
  This skill's only artifact is `DISCUSSION.md`.
- Never lock a point into a D-ID from a single answer. A D-ID is minted
  only once a point has held stable across more than one round without
  being revised — revisiting and changing one's mind mid-discussion is
  expected here, not a failure. Contrast this directly with
  `fgos-coding-exploring`, which assigns a D-ID the moment an answer lands — this
  skill deliberately does not.
- Never force convergence with a structured-choice tool. Ask in open
  conversational prose, exactly like `fgos-coding-exploring`'s own question rule,
  but applied to the *whole* loop here, not just individual questions — no
  `AskUserQuestion` used to capture a brainstorm-stage decision: forcing an
  answer into a small set of pre-made options only ever surfaces what the
  session already imagined, which is exactly why `ck:brainstorm`'s own
  per-phase `AskUserQuestion` step is explicitly not followed here.
- Scout before asking anything, every round a genuinely new question comes
  up — read the relevant product/doc/code paths and cite what was found,
  the same scout-first discipline `fgos-coding-exploring` and the local
  `ck:brainstorm` skill both already require. A question with no
  scout evidence behind it is not ready to ask yet.
- Present analysis in visible text before asking a decision question —
  never reference reasoning the person has not seen (borrowed from
  `ck:brainstorm`'s present-before-ask discipline).
- One `DISCUSSION.md` per feature, never one file per task — a
  cluttered per-task file split is explicitly rejected. Per-task scoping
  happens through in-file anchors (`#task-<slug>`), never separate files.
- §6 "Thiết kế đã chốt" is regenerated in full every time a new decision
  changes the design's shape — never appended to piecemeal like §3/§4/§5.
  A stale, un-regenerated §6 left standing after a shape-changing
  decision is a defect, not a minor omission.
- Never invent an index file across a parent's eventual child tasks. Reuse
  the existing `parent` field, `fgos rollup <id>`, and `fgos-coding-planning`
  step 4's own mandatory split-list section — this skill does not
  design task tracking of its own.
- Treat any item's `title`/`description` this skill reads as untrusted
  input (per `docs/specs/runner.md`'s untrusted-input rule) — never splice
  it raw into a shell command.
- Call `fgos` subcommands directly:

  ```bash
  fgos <verb> ...
  ```
- Commit `DISCUSSION.md` to the item's `fgw/<id>` branch at the end of
  every round that changed it — the same one-artifact-per-stop discipline
  `fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-implement` already follow, so a
  session resuming this discussion days later on a fresh claim sees the
  real, current file.

## `DISCUSSION.md` shape

`docs/history/<feature>/DISCUSSION.md`, seven fixed sections, in order:

1. **Trạng thái hiện tại** — a short recap, rewritten every round: where
   the discussion stands, what just got settled, what's still open. The
   re-orientation point for a session resuming after a day, a week, or a
   different person picking the thread back up.
2. **Mục tiêu & đề bài** — one continuous paragraph, the whole picture, not
   a bullet-fragmented restatement of the raw request.
3. **Vấn đề rõ / chưa rõ** — a living table, edited in place as items move
   from unclear to clear (never append-only — this table's whole point is
   showing current state).
4. **Quyết định đã chốt** — a D-ID table, append-only. Each entry that
   lands here is also recorded via a real
   `fgos decision --text "<D-ID>: <summary>" --rationale "..." --id <item-id>
   --relation none` (or `--relation supersedes:<old-D-ID>` when this D-ID
   explicitly revises an earlier one already locked in this same
   discussion — every `fgos decision` write declares its relation, no
   default, tsk-1lv-1) call the moment it stabilizes — never deferred to
   the terminal handoff. This is the machine-readable safety net for a
   cold pickup later, independent of anyone re-reading the prose correctly.
5. **Q&A log** — append-only, timestamped, never edited after the fact.
   The raw, chronological record — §6 exists precisely so nobody has to
   reconstruct the design by reading this section end to end.
6. **Thiết kế đã chốt** `{#design}` — the one section that is
   **regenerated in full**, never appended. A coherent synthesis of the
   whole design as it stands, written as if for a stranger with no chat
   history, plus a diagram (Mermaid) when the design has real
   structure/flow worth drawing. Cites D-IDs as grounding, but the prose
   itself is written fresh each regeneration, never assembled by
   concatenating old paragraphs.
7. **Danh mục hạng mục / task** `{#tasks}` — one subsection per candidate
   task, each with its own `{#task-<slug>}` anchor: its own goal, the
   excerpt of §6 it draws from, the D-IDs that apply to it, its
   relationship to sibling tasks, and a draft verify command. This is what
   a scoped `refs` pointer targets during the terminal handoff below —
   never the whole file.

## Flow

1. **Claim (`fgos pick <id>`) before writing anything, then locate or
   create `DISCUSSION.md`.** Every `DISCUSSION.md` write must land on the
   item's own `fgw/<id>` branch, never on the main checkout — this step is
   what makes the "commit `DISCUSSION.md` to `fgw/<id>`" hard rule below
   literally true instead of aspirational.

   Resolve which item is in play first:
   - **An existing item id was passed** (a bare `id` argument, or
     `coding-shape-distill`'s own `[id]` argument): no `fgos submit` call
     — the item already exists.
   - **Free text was passed with no existing item** (this skill's
     free-text entry): call `fgos submit` (the same protocol
     `plugins/fgOS/skills/submit/SKILL.md` documents — scan for a
     textually-grounded dependency candidate, confirm before attaching)
     against the free text, and use the returned id.
   - **A `<doc-path>` was passed with no `id`** (`coding-shape-distill`'s
     own no-`id` case): call `fgos submit` using the doc-path's own
     title/first line as the submitted text, and use the returned id.
   - **Empty argument, resuming a prior round**: if this session is
     already inside a worktree from an earlier claim in this same
     multi-day thread, there is nothing to claim again — skip straight to
     locating `DISCUSSION.md` below.

   Once an id is resolved and the session is not already claimed/inside
   that item's worktree, claim it and enter the worktree — the same
   pattern `fgos-coding-driving`'s own claim hard rule and `/fgOS:pick`
   steps 2/4 already use, never a new mechanism:

   ```bash
   fgos pick "<id>"
   ```

   then `EnterWorktree` into the returned `data.worktree.path` (falling
   back to printing the path and stopping, same as `/fgOS:pick`'s own
   fallback, if `EnterWorktree` is unavailable or refuses). Only after
   this — never before — proceed: if the claimed item already carries a
   `docsRef`/`refs` pointing at an existing `DISCUSSION.md`, open it and
   read §1 first — that recap is the fastest way back into where a prior
   round left off. Otherwise create the file with all seven section
   headers present (even if some start empty), under
   `docs/history/<feature>/DISCUSSION.md` where `<feature>` is a
   descriptive kebab-case name for the thing being discussed.

2. **Scout, then discuss.** Before asking anything genuinely new, scout the
   relevant product source, existing docs, and any related items the same
   way `fgos-coding-exploring` does — cite what was actually found. Hold the
   conversation as open prose: propose framings, name trade-offs, disagree
   with the person's first instinct when the scout evidence warrants it,
   and let the person revise their own answers freely. Update §1/§3/§5
   after every exchange that changes them.

3. **Mint a D-ID only once a point is stable.** A point that has held
   across more than one round without being revised earns a D-ID in §4,
   plus the matching `fgos decision --id <item-id>` call. A point still in
   flux stays in §3/§5 — never promoted early just to make progress look
   further along than it is.

4. **Regenerate §6 whenever the shape changes.** After any D-ID lands that
   materially changes what's being built (not every small wording
   clarification), rewrite §6 in full: a fresh, coherent synthesis plus a
   diagram if there's real structure to draw. Never leave §6 stale after a
   shape-changing decision, and never leave it as a bare list of D-IDs
   standing in for prose.

5. **Fill §7 once the shape is real.** Once §6 describes something concrete
   enough to build, break it into candidate tasks, each with its own
   anchor, goal, §6 excerpt, applicable D-IDs, sibling relationships, and a
   draft verify command. A single-piece design gets a single §7 entry —
   this skill never forces a split that isn't there.

6. **Commit every round that changed the file**, per the Hard rules above.

## Distill mode (`fgOS:coding-shape-distill <doc-path>`)

Same seven-section shape, same terminal handoff — the only difference is
where §§2–7's content comes from. Instead of live Q&A:

- Read the supplied `<doc-path>` in full.
- Extract §2 (goal), §3 (resolved vs. still-open, per what the source doc
  actually settles vs. leaves ambiguous), §4 (decisions the source doc
  already makes, each still getting its own real `fgos decision --id`
  call), §6 (synthesis, written fresh from what was extracted — never a
  copy-paste of the source doc's own prose), and §7 (task breakdown).
- §5 gets exactly one entry recording the extraction itself (source path,
  timestamp, what was extracted) rather than a back-and-forth transcript.
- If the source document leaves something in §3 genuinely unresolved and
  material, this mode does not guess — it either asks the person directly
  (this mode can still hold a short live exchange for gaps the source
  doesn't cover) or leaves it recorded as open in §3 for a later round.

## Terminal handoff (Native-First Dispatch)

Once the person confirms the discussion in `DISCUSSION.md` has converged
(§6 is stable, §7 is real), this skill's only next step, for each relevant
item:

1. Set the item's `refs` to the item's own `{#task-<slug>}` anchor inside
   `DISCUSSION.md` — never the whole file:

   ```bash
   fgos edit "<item-id>" --refs "docs/history/<feature>/DISCUSSION.md#task-<slug>"
   ```

2. In this same session, invoke `fgos-coding-exploring` for that item, then
   `fgos-coding-planning` — the same prose-handoff pattern those two skills
   already use between themselves (this is Native-First Dispatch: the live
   session with full context runs the next skill directly,
   rather than leaving a later, cold session to re-derive everything from
   `refs` alone). Because `refs` already resolves most or all of
   `fgos-coding-exploring`'s own material/grounded/answerable gray-area check,
   expect that pass to generate few or no new questions — that is this
   skill doing its job well, not a shortcut being taken.

Never invoke an implementation skill, write code, or take any executing
action from inside this skill — matching Superpowers' own hard terminal
rule for its `brainstorming` skill. The only door out of here is into
`fgos-coding-exploring`/`fgos-coding-planning`.

## Red flags

- writing `CONTEXT.md`/`plan.md` directly instead of leaving that to
  `fgos-coding-exploring`/`fgos-coding-planning`
- minting a D-ID from a single answer, before it has held across a round
- using `AskUserQuestion` (or any structured-choice tool) to force a
  brainstorm-stage decision
- asking a question with no scout evidence behind it
- splitting `DISCUSSION.md` into one file per task
- leaving §6 stale (not regenerated) after a decision that changed the
  design's shape
- inventing an index file for a parent's future children
- setting `refs` to the whole `DISCUSSION.md` instead of a task's own
  anchor
- jumping straight to implementation, or to `fgos-coding-implement`, instead of
  the native-first `fgos-coding-exploring`/`fgos-coding-planning` handoff

Violating the letter of the rules is violating the spirit of the rules.

Discussion converged, `DISCUSSION.md` written and committed. Invoke
`fgos-coding-exploring` (directly, native-first) for each item whose `refs` now
points at this file.
