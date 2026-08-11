# fgos-coding-shaping — locked decisions

Item: tsk-69g. Stage: clarify (this pass). This item's `refs` already
pointed at a full pre-discussion report — see "Scout evidence" — so this
pass generated **zero new candidate questions**; every gray area was
already material-grounded-answered before `fgos-coding-exploring` even loaded.

## Feature boundary

A new coding-domain driving skill, `fgos-coding-shaping`, exposed through
two command wrappers (`fgOS:coding-shape`, `fgOS:coding-shape-distill`).
It is an upstream, pre-`clarify` collaborative brainstorm/design phase —
open-ended, conversational, multi-day-resumable — that keeps one
coherent living document per feature (`docs/history/<feature>/
DISCUSSION.md`) and, once the discussion converges, hands off into the
*existing* `fgos-coding-exploring`/`fgos-coding-planning` machinery natively in-session
rather than re-implementing any of their decision-authoring logic.

Out of scope for this item: any change to `fgos-coding-exploring`,
`fgos-coding-planning`, `fgos-routing`, or the domain/stage registry themselves
— this item only adds a new upstream skill that calls them, unchanged.

## Locked decisions

| D-ID | Decision |
|---|---|
| D1 | Commands: `fgOS:coding-shape` (interactive), `fgOS:coding-shape-distill <doc-path>` (fast doc-ingest). Internal skill: `fgos-coding-shaping`. Domain-prefixed — matches `fgos-coding-driving`, since `coding` is the only real domain today (`src/state/workflow-stage-graphs.mjs`: `synthetic` domain is illustrative/disposable, never loads a skill; `discovery.mjs`/`decompose.mjs` hardcode coding's stage literals). Rejected `coding-design` (collides with the existing `design` skill's branding meaning) and `coding-brainstorm` (collides with the existing generic `brainstorm` skill). |
| D2 | This skill never writes `CONTEXT.md`/`plan.md` itself. It sets the target item(s)' `refs` field to a scoped anchor inside its own `DISCUSSION.md`, then — once the discussion converges — invokes `fgos-coding-exploring` and `fgos-coding-planning` directly in the *same* session (Native-First Dispatch Doctrine, tsk-27y D1/D2), so those two skills do their own real authoring with full live context instead of a later cold session re-deriving it. |
| D3 | Document shape: one `docs/history/<feature>/DISCUSSION.md` per feature (never one file per task — avoids fragmenting the human's read-through). Fixed sections, in order: (1) Trạng thái hiện tại — status recap, updated every round, for multi-day resume; (2) Mục tiêu & đề bài; (3) Vấn đề rõ/chưa rõ — living table; (4) Quyết định đã chốt — D-ID table, append-only, each also recorded via a real `fgos decision --id <item-id>` call the moment it stabilizes; (5) Q&A log — append-only, timestamped; (6) Thiết kế đã chốt `{#design}` — the one section that is **regenerated in full**, not appended, every time a new decision changes the design's shape: coherent synthesis (as if written fresh for a stranger) plus a diagram when there is real structure/flow to draw; (7) Danh mục hạng mục/task `{#tasks}` — one subsection per candidate task, each with its own `{#task-<slug>}` anchor, own goal, excerpt of §6, applicable D-IDs, relationships to sibling tasks, draft verify command. |
| D4 | The brainstorm loop itself is open conversational prose — never a structured-choice tool (`AskUserQuestion`) forcing convergence each round, unlike `fgos-coding-exploring`/`fgos-coding-planning`/`fgos-discover`. Revisiting and changing one's mind mid-discussion is expected, not a failure. A D-ID is only minted once a point holds stable across multiple rounds. Locking/gating (D2's native-first handoff) is the only place formal convergence happens — never mid-brainstorm. |
| D5 | No new index file across a parent's child tasks. Reuse the existing `parent` field, the live `fgos rollup <id>` command, and `fgos-coding-planning` step 5's own mandatory split-list section in `plan.md`. Verified directly: all 162 pre-existing `docs/history/*/` folders carry zero index/README files — this stays consistent with that, and avoids a second, driftable source of truth alongside the item store. |
| D6 | Reference-learning inputs, both read directly this session: `docs/distillery/sources/superpowers.md` (already distilled — no new scan needed) supplies the hard separation rule "the ONLY skill you invoke after brainstorming is writing-plans," which D2/D4's split already matches. The local `ck:brainstorm` skill (`~/.claude/skills/brainstorm/SKILL.md`) supplies scout-first and present-analysis-before-asking discipline (adopted into this skill's own flow); its per-phase `AskUserQuestion` forced-decision-capture pattern is explicitly rejected (conflicts with D4). |

## Pinned terms

- **DISCUSSION.md** — the one living document this skill maintains per
  feature; distinct from `CONTEXT.md`/`plan.md`, which stay
  `fgos-coding-exploring`/`fgos-coding-planning`'s own canonical outputs, unchanged by
  this item.
- **Native-First Dispatch** — the same-session, no-cold-re-derivation
  invocation pattern already established by tsk-27y D1/D2; this item
  reuses it, does not invent a variant.
- **Stable (for D-ID minting purposes)** — a point that has held across
  more than one discussion round without being revised.

## Scout evidence

- `rg "fgos-coding-shaping" src bin test docs dogfood-fixture .claude/skills --glob "*.{mjs,cjs,md}"` — zero hits: no existing naming collision, confirmed net-new.
- `src/state/workflow-stage-graphs.mjs` (read in full) — grounds D1: only `coding` is a real, skill-loading domain today.
- All 162 folders under `docs/history/` (`ls docs/history/*/`, checked directly) — grounds D5: zero pre-existing index/README file in any of them.
- `docs/distillery/sources/superpowers.md` (`grep -i brainstorm`, 20 matches reviewed) and `~/.claude/skills/brainstorm/SKILL.md` (read in full) — ground D6.
- `plans/reports/collab-brainstorm-design-session-260804-1456-fgos-coding-shaping-skill-report.md` — the full discussion this item's `refs` already pointed at; source of D1–D6 and every entry in this doc.
- Impact-analysis capability gate, checked fresh this pass:
  `fgos tool query --capability impact-analysis --status present` →
  GitNexus registered, `status: present`. Posture: **full** — informational
  only here (this skill adds new files, touches no existing symbol), no
  proof point required at this stage; `fgos-coding-planning`/`fgos-coding-validating`
  can lean on it if a later proof point needs blast-radius evidence.

## Deferred to fgos-coding-planning

- The item's real `--verify` command (currently the submit-time
  placeholder) — this skill does not design verify commands.
  `fgos-coding-planning` step 6 names it.
- Whether this item's shape counts as `tiny`/`small`/`standard` under
  `fgos-coding-planning`'s mode-gate flag count, and whether it needs a split —
  this item's own report already recommends "one item, let decompose
  decide" (no hard-gate flags present), but the actual count is
  `fgos-coding-planning`'s job, not asserted here.
- Exact file paths/contents for `fgos-coding-shaping/SKILL.md` and the two
  command wrapper files — implementation detail, `fgos-coding-planning`'s
  Approach step and `fgos-coding-implement`'s own pass, not this skill's.

## Canonical references

- `plans/reports/collab-brainstorm-design-session-260804-1456-fgos-coding-shaping-skill-report.md`
- `.claude/skills/fgos-coding-exploring/SKILL.md`, `.claude/skills/fgos-coding-planning/SKILL.md` (the two skills this feature invokes natively, never duplicates)
- `.claude/skills/fgos-coding-driving/SKILL.md` (naming precedent, D1)
- `docs/distillery/sources/superpowers.md`, `~/.claude/skills/brainstorm/SKILL.md` (D6)
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md` (Native-First Dispatch Doctrine, D2)
