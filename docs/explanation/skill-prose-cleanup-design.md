---
authoritative_for: fgOS skill prose cleanup design (tsk-56w), SKILL.md/references split standard, citation-boundary-by-production-role, skill QA process
---

# fgOS skill prose cleanup: the design behind `tsk-56w`

`tsk-56w` cleaned up three concrete defects across every fgOS skill
(`.agents/skills`, `.claude/skills`, `plugins/fgOS/skills`), modeled
partly on upstream `bee`/`beegog`'s own skill-prose consolidation
(18→9 skills, script engine pulled out of skill prose entirely). Nine
child items (`tsk-56w-1` through `tsk-56w-9`) each applied one slice of
this design to a specific skill or file group.

## The three defects, and the fix for each

1. **7 skills exceeded the 300-line standard** (`fgos-coding-driving`
   645 lines, `fgos-coding-exploring` 557, `fgos-coding-planning` 532,
   `fgos-coding-validating` 513, `merge-loop` 437, `fgos-coding-implement`
   436, `fgos-fanout` 358). Fix (D4): split each into `SKILL.md`
   (high-level flow, <300 lines, quick reference) + `references/*.md`
   (step-by-step detail, each file <300 lines, split along logical
   boundaries — typically one file per major Flow step), per the
   already-installed `skill-creator` standard. No content duplicated
   between the two locations (the "No Duplication Rule"). The two skills
   carrying real pseudocode/algorithm (`fgos-coding-driving`,
   `fgos-fanout`) were rewritten into `skill-creator`'s Pattern 1
   ("Sequential Workflow Orchestration" — numbered `### Step 1: ... ###
   Step 2: ...`), removing nested loop/if-else code-shaped constructs.
2. **Mechanical boilerplate** — 23 skill CLI-wrapper files in
   `plugins/fgOS/skills` repeating the identical 9-line bash block calling
   the `fgos` CLI. Consolidated into `plugins/fgOS/skills/_shared/
   fgos-cli-fallback.md`, following the same precedent
   `_shared/citation-format.md` already established.
3. **Bare governance-id citations** — 267+ occurrences of `tsk-…`/
   `RUL…`/`D…` scattered with no explanation, heaviest in the core
   skills. Fixed per D1 below.

## D1 — the citation boundary is by production role, not directory

The key generalizable decision: whether a governance id needs a gloss (or
must never appear at all) depends on **what role the artifact is
produced for**, not which directory it happens to live in:

- **Process/build-time artifacts** (`docs/history`, `docs/decisions`,
  `docs/backlog.md`, a work item's own text/`CONTEXT.md`, `docs/specs`):
  keep the existing `tsk-37i` rule — `ADR`/`RUL` ids get a one-line gloss
  at the citing location, D-local ids never leave their home
  `CONTEXT.md`. See `docs/how-to/fix-bare-citation-findings.md` and
  `docs/how-to/fix-d-local-outside-home-findings.md`.
- **Product/shippable artifacts** (`.agents/skills/*/SKILL.md` — the real
  source, copied byte-identical into every distribution — and its
  `references/*.md`): remove **every** governance id outright, and write
  the reason directly in plain prose instead. Fixed once at the source
  (`.agents/skills`), which covers every mirrored copy.

**Why the split.** `.agents/skills` sits next to `docs/` in this
monorepo, but it is *produced* to operate outside it — proven by the fact
it's copied byte-identical into `plugins/fgOS/skills`, the real
marketplace publish channel, confirmed to ship with no `docs/` alongside
it. The upstream `bee` model (gloss + pointer-integrity check + a durable
doc target) only works when that durable doc target ships *with* the
package — fgOS has no such mechanism, so the id has to be removed
entirely rather than glossed. This is the same reasoning that later
narrowed `tsk-2sp`'s own scope to exclude skill files — see
`docs/explanation/citation-drift-backlog-scope-split-with-tsk-56w.md`.

## Safety and QA process (D2/D5)

Before the first child entered `executing`: `git tag
pre-skill-prose-cleanup-tsk-56w` on `main` — a restore point if an edit
silently broke a skill's real behavior. Each child task then proves two
separate things, using two standards already in the repo (no new process
invented):

1. **`verify`** proves the *structure* is right (new content present, old
   content gone) — never proves the skill still runs correctly.
2. **A real smoke test** (`docs/how-to/smoke-test-fgos-code-implement-
   with-a-trivial-item.md`: a genuinely throwaway `chore` item, `verify:
   "true"`, claimed so the edited skill runs for real at least once,
   confirmed via `.fgos/events.jsonl`) proves the skill still *runs*
   correctly, at least on the happy path.

Honestly stated limit: verify + smoke-test prove the happy path, not a
negative case ("the skill should have stopped but didn't") — covered
instead by human review at `fgos-coding-validating`'s existing
reality-check step, not a new gate.

**Mirror sync per child, not blocked on a separate automation item.**
Each task splitting one of the 6 mirrored dev-skills adds a required
positive check: `diff .agents/skills/<name>/SKILL.md plugins/fgOS/
skills/<name>/SKILL.md` is empty, and every new `references/*.md` exists
identically in both places — by hand or via the (then-in-flight) build
script, whichever landed first; no dependency edge was created on that
separate automation item.

## Out of scope

`ui-spec` (`.claude/skills/ui-spec`) — not a fgOS skill (D3). The
existing 3-tier mirror architecture (`.agents/skills` real source →
`.claude/skills` generated thin wrapper → `plugins/fgOS/skills`
marketplace copy) — unchanged, not re-architected.
