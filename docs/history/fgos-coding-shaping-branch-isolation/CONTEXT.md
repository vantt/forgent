# CONTEXT.md — tsk-5qs: fgos-coding-shaping branch isolation

## Feature boundary

`fgos-coding-shaping` (the design-brainstorm skill, entered via
`/fgOS:coding-shape [id|free-text]` and `/fgOS:coding-shape-distill
<doc-path> [id]`) writes and `git commit`s `docs/history/<feature>/
DISCUSSION.md` while the session's cwd is the main checkout, not a claimed
`fgw/<id>` worktree — because `fgos-coding-driving`'s own claim-timing rule
(tsk-19j-4/D9) only claims a worktree right before the `executing`-stage
skill. Empirically confirmed: `main`'s own HEAD carries `docs(tsk-2sj)`
commits (this skill's own `DISCUSSION.md` writes) with no intervening
worktree or merge (see `RESEARCH.md` in this same directory for the full
git-log evidence).

This item upgrades `fgos-coding-shaping` and its two wrapper skills
(`/fgOS:coding-shape`, `/fgOS:coding-shape-distill`) so every
`DISCUSSION.md` write lands on the item's own `fgw/<id>` branch, never on
`main` — by routing the initial request through `submit` (when no item
exists yet) and claiming the item into its worktree before any file is
written.

**Explicitly out of scope** (D1): reopening `fgos-coding-driving`'s own
claim-timing rule (tsk-19j-4/D9). The same class of bug also hits
`fgos-coding-exploring`/`fgos-coding-planning` (confirmed: `fa067c9c`, a
`fgos-coding-planning` `plan.md` commit, sits on `main`'s HEAD the same
way) — that is real, but a separate, wider architectural question this
item does not take on. Also out of scope: `tsk-5wr`'s "backlog status"
proposal — still unresolved (only `RESEARCH.md`, no locked `CONTEXT.md`)
and, per its own research, orthogonal to branch/worktree placement even
once built.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope stays narrow: fix `fgos-coding-shaping` + its 2 wrappers only. Do not reopen `fgos-coding-driving`'s claim-timing rule (tsk-19j-4/D9), and do not wait on or entangle with `tsk-5wr`'s backlog-status work. User's own reason: dirtying `main` from shaping causes real merge pain today; the narrow fix should ship without waiting on a separate, unresolved design. |
| D2 | `/fgOS:coding-shape`'s free-text argument (no existing item) auto-creates a new workitem via a `submit` call before claiming — e.g. `/fgos:coding-shape <mô tả vấn đề cần thảo luận>` creates the item automatically, matching the user's own proposed usage form. An **existing id** argument skips `submit` entirely (the item already exists) and goes straight to claim (`fgos pick`) + `EnterWorktree`. |
| D3 | `/fgOS:coding-shape-distill` signature changes from `<doc-path>` to `<doc-path> [id]`. With `id`: distill into that existing item (attach `docsRef`, claim+worktree it). Without `id`: auto-create a new item via `submit`, text derived from the doc-path's own title/first line — symmetric with `coding-shape`'s `[id|free-text]` shape. Reason: real use cases want to distill into an already-existing item sometimes, not always create a fresh one. |
| D4 | `fgos-coding-shaping` never creates child items or attaches dependencies itself during a live session — §7 (task breakdown) in `DISCUSSION.md` is prose+anchors only, per the skill's own existing hard rule ("does not design task tracking of its own"). Real child-item creation + `--parent`/dependency wiring happens downstream, in `fgos-coding-planning`'s own split step, after shaping's terminal handoff — outside this item's scope. **Consequence:** exactly ONE real item is ever claimed/worktree'd during an active `fgos-coding-shaping` session — the single id/free-text/doc-path argument. No multi-worktree design is needed. The worktree used is the standard `fgw/<id>` lifecycle (`fgos pick` + `EnterWorktree`) already used everywhere else in this repo — it persists across shaping → exploring → planning → executing on the same item, merged once at `awaiting-approval`, not a separate discussion-only tree created and torn down early. |

## Pinned terms

- **"Claim" / "worktree"** — the standard `fgos pick <id>` (creates/enters
  `fgw/<id>` under `.claude/worktrees/**`) + `EnterWorktree` pattern
  already used by `fgos-coding-driving`'s own claim hard rule and
  `/fgOS:pick`'s steps 2/4. This item introduces no new claim mechanism.
- **"Route through submit"** — calling the `fgos submit` verb (or the
  `/fgOS:submit`-equivalent protocol: scan for a textually-grounded
  dependency candidate, confirm before attaching) to create a brand-new
  item. Only fires when no item exists yet (free-text for `coding-shape`,
  no-`id` for `coding-shape-distill`) — never re-fired against an existing
  id.

## Scout evidence

- `.claude/skills/fgos-coding-shaping/SKILL.md` — current hard rules
  instruct "Commit `DISCUSSION.md` to the item's `fgw/<id>` branch" with
  no step anywhere in Flow that claims or enters that branch/worktree —
  the gap this item closes.
- `.claude/skills/fgos-coding-driving/SKILL.md` — "Claim right before the
  FIRST invocation of the `executing`-stage skill, never earlier" (the
  root architectural cause, confirmed out of scope per D1).
- `plugins/fgOS/skills/pick/SKILL.md` steps 2–4 — the canonical
  claim+`EnterWorktree` pattern this item's fix replicates.
- `plugins/fgOS/skills/submit/SKILL.md` — the submit protocol
  (dependency-candidate scan + confirm, then `fgos submit`) this item's
  fix routes free-text/doc-path-derived requests through.
- `plugins/fgOS/skills/coding-shape/SKILL.md`,
  `plugins/fgOS/skills/coding-shape-distill/SKILL.md` — today's wrapper
  signatures (`[id|free-text]` and `<doc-path>` respectively); D3 changes
  the distill wrapper's own signature.
- `docs/history/fgos-coding-driving-worktreebacked-claim-branch/
  CONTEXT.md` (tsk-5y5) — confirmed unrelated: scoped to a *future*
  `worktreeBacked:false` domain, explicitly states `coding`'s behavior
  (`worktreeBacked:true`) is unchanged by it.
- `docs/history/work-item-backlog-status/RESEARCH.md` (tsk-5wr) —
  confirmed unresolved (no `CONTEXT.md` yet) and, per its own findings,
  scoped to `statusCategory`/transition/default-status mechanics only —
  says nothing about branch/worktree placement (D1's grounding).
- `docs/history/fgos-coding-shaping-branch-isolation/RESEARCH.md` (this
  item's own discovery-round research) — full git-log evidence that the
  same defect class hits `fgos-coding-planning` too (`fa067c9c`).
- `docs/how-to/write-verify-for-a-skill-prose-change.md` — this item
  touches `plugins/fgOS/skills/coding-shape/SKILL.md`,
  `plugins/fgOS/skills/coding-shape-distill/SKILL.md`, and
  `.claude/skills/fgos-coding-shaping/SKILL.md` (all skill-prose paths) —
  `fgos-coding-planning` must shape `verify` as `npm test && <POSITIVE> &&
  <NEGATIVE>` per this doc, not a semantic-comprehension check.
- `CLAUDE.md` impact-analysis capability gate: `fgos tool query
  --capability impact-analysis --status present` → GitNexus registered,
  `status: "present"` (full posture, freshly checked). Informational only
  — this item edits skill-prose only, no symbol/function, so no
  blast-radius proof point applies.

## Canonical references

- `docs/history/fgos-coding-shaping-branch-isolation/RESEARCH.md` — this
  item's own discovery-round evidence (git log, cross-skill defect
  confirmation).
- `tsk-5wr` / `docs/history/work-item-backlog-status/RESEARCH.md` —
  related but explicitly out of scope (D1).
- `tsk-5y5` / `docs/history/fgos-coding-driving-worktreebacked-claim-
  branch/CONTEXT.md` — related but confirmed non-overlapping (different
  domain-readiness concern).

## Outstanding questions

None
