# fgos-coding-shaping — plan

Item: tsk-69g. Stage: decompose (planning pass). Decisions this plan
assumes: D1–D6 in `CONTEXT.md` (same folder) — cited by D-ID below, never
reopened.

## Mode

Flags counted: auth (no), authorization (no), data model (no),
audit/security (no), external systems (no), public contracts (no — this
adds new commands/schema, breaks nothing existing), cross-platform (no),
existing covered behavior (no — no existing test/behavior touched),
weak proof around the area (no — net-new area), multi-domain (no).

**Flag count: 0.** Mode: **small** — a few new files, zero gray areas
(CONTEXT.md already resolved every product decision; nothing left to
discover mid-build).

Impact-analysis posture, checked fresh this pass: GitNexus registered,
`status: present` → **full**. Informational only — this item adds new
files, edits no existing symbol, so no proof point here leans on
blast-radius evidence.

## Approach

Three new files, in this order (each later file depends on the contract
the one before it fixes):

1. **`.claude/skills/fgos-coding-shaping/SKILL.md`** — the real driving
   skill. Fixes the actual contract: reads/writes
   `docs/history/<feature>/DISCUSSION.md` per D3's 7-section shape, runs
   the open-conversational brainstorm loop per D4, and on convergence sets
   `refs` + hands off to `fgos-coding-exploring` then `fgos-coding-planning` per D2 —
   the same "Handoff" prose pattern `fgos-coding-exploring`/`fgos-coding-planning`
   already use (a session-visible instruction to invoke the next skill
   next, not a nested in-skill call), so this reuses an existing pattern
   rather than inventing a new dispatch mechanism.
2. **`plugins/fgOS/skills/coding-shape/SKILL.md`** — thin command
   wrapper, `name: coding-shape`, mirrors the existing
   `plugins/fgOS/skills/pick/SKILL.md`/`submit/SKILL.md` shape: reads the
   `/fgOS:coding-shape` argument, dispatches straight into
   `fgos-coding-shaping` (per D1), does no independent logic.
3. **`plugins/fgOS/skills/coding-shape-distill/SKILL.md`** — thin command
   wrapper, `name: coding-shape-distill`, same dispatch shape as (2) but
   passes the supplied `<doc-path>` through and tells
   `fgos-coding-shaping` to run its extraction mode instead of live Q&A
   (D1's "fast doc-ingest" entry).

**Alternative rejected:** writing all three as one flat file (no thin
wrapper indirection). Rejected because it breaks the existing
command-wrapper convention every other `fgOS:*` command in this repo
already follows (`pick`, `submit`, `discover`, …) — those all dispatch
into a real skill under `.claude/skills/`, never carry their own logic.

## Risk map

| Component | Risk | What proves it |
|---|---|---|
| `DISCUSSION.md` 7-section schema (D3) matches what `fgos-coding-exploring` actually reads (`refs`, title, `docsRef`) | low | already grounded — `fgos-coding-exploring/SKILL.md` step 1 already reads `refs` today, unchanged by this item |
| Native-first handoff (D2) actually reaches `fgos-coding-exploring`/`fgos-coding-planning` the same way this very session's own drive of tsk-69g just did | low | this item's own `fgos-coding-driving` → `fgos-coding-exploring` → `fgos-coding-planning` sequence in this session is itself the working precedent; no new mechanism to prove |
| Wrapper dispatch (D1) actually names and reaches `fgos-coding-shaping` | low | covered directly by this item's own `--verify` (below) |

No medium/high risk entries — nothing here needs a `fgos-coding-validating` proof
point beyond the verify command itself, consistent with `small` mode.

## Shape

One direct task, no phases:

- Write `.claude/skills/fgos-coding-shaping/SKILL.md` per CONTEXT.md D2–D6.
- Write `plugins/fgOS/skills/coding-shape/SKILL.md` and
  `plugins/fgOS/skills/coding-shape-distill/SKILL.md` per D1, dispatching
  into the skill above.
- Concrete cases worth checking at this mode's depth: both wrapper files
  carry the correct bare `name:` (`coding-shape` / `coding-shape-distill`,
  not the `fgOS:`-prefixed command form — matches the existing
  `pick`/`submit` convention); the distill wrapper's own text visibly
  covers `<doc-path>` handling, not just a copy of the interactive
  wrapper.

## Split decision

No split. One honestly-sized piece — matches the recommendation already
in `plans/reports/collab-brainstorm-design-session-260804-1456-fgos-
coding-shaping-skill-report.md` (no hard-gate flag present to justify
guessing a split ahead of this mode-gate count), now confirmed by the
mechanical count above (0 flags). `fgos graph --json` shows this item as
its own isolated component (no deps, no dependents) — nothing to order
against.

## Assumptions

- The exact prose/wording inside each new `SKILL.md` (beyond the D-ID
  contracts above) is `fgos-coding-implement`'s own call at build time — this
  plan fixes the contract each file must satisfy, not its literal text.

## Proof (leave execution alone, step 6)

The one command that proves this item done — already locked as the
item's own `verify` field via this session's `fgos-coding-exploring` pass
(`fgos discover --verdict clear --verify "..."`, outcome `clear`):

```
test -f .claude/skills/fgos-coding-shaping/SKILL.md && grep -q "DISCUSSION.md" .claude/skills/fgos-coding-shaping/SKILL.md && grep -qi "native-first" .claude/skills/fgos-coding-shaping/SKILL.md && grep -q "fgos-coding-exploring" .claude/skills/fgos-coding-shaping/SKILL.md && grep -q "fgos-coding-planning" .claude/skills/fgos-coding-shaping/SKILL.md && grep -q "^name: coding-shape$" plugins/fgOS/skills/coding-shape/SKILL.md && grep -qi "fgos-coding-shaping" plugins/fgOS/skills/coding-shape/SKILL.md && grep -q "^name: coding-shape-distill$" plugins/fgOS/skills/coding-shape-distill/SKILL.md && grep -qi "fgos-coding-shaping" plugins/fgOS/skills/coding-shape-distill/SKILL.md && grep -qi "doc-path" plugins/fgOS/skills/coding-shape-distill/SKILL.md
```

This plan does not re-design it — it already survived a two-pass
model judge (round 1 and round 2 of `fgos discover` both flagged weaker
drafts; this is the version that passed) during the `clarify` pass this
same session just ran.
