# plan.md — tsk-3id: fix stale STR66 comments + rename fsm.mjs/stage.mjs

## Source of truth

No `CONTEXT.md` exists for this feature and none is needed: the item's own
discovery pass (`fgos show tsk-3id`) already recorded the task as fully
clear and self-contained —

> "Task is fully clear and self-contained: rename src/state/domains.mjs to
> src/state/workflow-stage-graphs.mjs [already done on main], update the 4
> import sites ..., keep every exported name identical ..., run the test
> suite. No design decision needed, no ambiguity — proceed."

The item's own description is the complete spec; this plan only sizes the
work, corrects two inaccuracies in the description's own grep, and lists
the exact file set.

## Mode gate

Flags counted (docs/history/*/CONTEXT.md convention: auth, authorization,
data model, audit/security, external systems, public contracts,
cross-platform, existing covered behavior, weak proof, multi-domain):

- **existing covered behavior** — yes (1 flag). `src/state/fsm.mjs` and
  `src/state/stage.mjs` are both fully covered by `test/state/fsm.test.mjs`
  / `test/state/stage.test.mjs`, and `src/evolve/iron-law.mjs`'s
  self-modification guard also has a literal-path rule over `fsm.mjs`
  covered by `test/evolve/iron-law.test.mjs`. `npm test` must stay green
  end to end (item's own verify command).
- every other flag — no (no auth/data model/external system/public
  contract/cross-platform/multi-domain surface; the rename touches
  internal engine modules only, exported names unchanged).

1 flag, but the touched-file count (14 files: 2 renamed + comment/import
fixes in 12 others) is well past "a couple files" → **mode: small** (a few
files, no gray areas — not `tiny`, not `standard`; no phased split needed,
this is one coherent mechanical piece).

## Impact-analysis posture (CLAUDE.md gate)

`fgos tool query --capability impact-analysis --status present` → GitNexus
registered and `present`. Ran `impact({target: "transitionWork",
direction: "upstream"})` and `impact({target: "transitionStage", ...})` as
corroboration.

**Posture: degraded.** GitNexus's `transitionWork` upstream result reported
only `test/state/fsm.test.mjs` as a caller — it missed `src/state/store.mjs`
(`store.mjs:405` calls `transitionWork(...)` directly). A stale/incomplete
index, not a true zero-caller result — matches CLAUDE.md's "present only
means installed, never that its index is fresh" warning. Grep is the
authoritative source for this plan's file list below (every import,
call-site, and literal-path reference was grep-confirmed directly, not
inferred from GitNexus).

## Corrections to the item's own description

The item's description undercounts two things. Both corrections below are
mechanical (same rename intent the item already states), not new design
decisions, so they're pinned here as assumptions rather than sent back to
`fgos-coding-exploring`:

1. **`stage.mjs`'s "5 importers" list is wrong.** Only 2 files actually
   `import` from `stage.mjs`: `src/state/store.mjs` and
   `test/state/stage.test.mjs`. The other three named
   (`src/intake/plan.mjs`, `src/runner/anti-loop.mjs`,
   `src/state/work.mjs`) only *mention* `stage.mjs` in a comment — no
   import statement. They still need their comment text updated (same
   staleness class the item exists to fix for `domains.mjs`), just not an
   import-path fix.

2. **`fsm.mjs`'s import-site list (4 files) is accurate but incomplete
   overall.** `src/evolve/iron-law.mjs:26` has a literal self-modification
   rule `{ kind: 'equals', value: 'src/state/fsm.mjs' }` — not an import,
   but a hardcoded path this rule matches against. Left unrenamed, the
   iron-law guard silently stops protecting the renamed file. Its test,
   `test/evolve/iron-law.test.mjs`, asserts against the same literal string
   in 3 places (lines 34, 87, 89) and **will fail** `npm test` if the rule
   changes but the test fixture doesn't. Both must move in lockstep with
   the rename.

## Files

**Rename (git mv, preserve history):**
- `src/state/fsm.mjs` → `src/state/status-fsm.mjs`
- `src/state/stage.mjs` → `src/state/stage-fsm.mjs`

No export renamed inside either file (`transitionWork`/`FsmError`/
`STATUSES` for status-fsm.mjs; `transitionStage`/equivalent exports for
stage-fsm.mjs stay identical). Each renamed file's own header comment
(self-referential — currently says "fsm.mjs —" / "stage.mjs —") and any
internal comment naming the sibling module by its old name gets updated as
part of the `git mv` + edit, verified by a post-edit grep for the old
literal filenames (see Verify).

**Import-path fixes (real `import` statements, grep-confirmed):**
- `src/state/store.mjs` — imports from both renamed files
- `src/state/stage-fsm.mjs` (formerly `stage.mjs`) — imports `FsmError`
  from `fsm.mjs`
- `test/state/fsm.test.mjs` — imports from `fsm.mjs`
- `test/state/stage.test.mjs` — imports from both `fsm.mjs` and `stage.mjs`

**Literal-path fix (not an import, a data reference):**
- `src/evolve/iron-law.mjs:26` — `'src/state/fsm.mjs'` → `'src/state/status-fsm.mjs'`
- `test/evolve/iron-law.test.mjs:34,87,89` — same literal, 3 fixture sites

**Stale-comment fixes — `domains.mjs` → `workflow-stage-graphs.mjs`**
(item's own explicit 6-site list):
- `src/state/stage-fsm.mjs` (formerly `stage.mjs`):10,15,47
- `src/state/frontier.mjs`:6,21,94
- `src/runner/loop.mjs`:967
- `src/evolve/iron-law.mjs`:33
- `test/e2e/synthetic-domain.test.mjs`:275
- `docs/explanation/wontfix-terminal-status-filter-consistency.md`:108

**Stale-comment fixes — `fsm.mjs`/`stage.mjs` → new names** (same
staleness class, found during this planning pass, prose-only, no behavior
change):
- `src/intake/plan.mjs`:537 (comment mentions `stage.mjs`)
- `src/runner/anti-loop.mjs`:45,117 (comment mentions `stage.mjs`,`fsm.mjs`)
- `src/state/work.mjs`:147 (comment mentions `stage.mjs`)
- `test/runner/anti-loop.test.mjs`:143 (comment mentions `fsm.mjs`)

Out of scope: `docs/history/**` (audit-trail records of what was true at
the time — not retroactively rewritten), `docs/architecture-map.md`,
`docs/specs/work-state.md`, `plans/**` — none requested by the item, none
broken by the rename (no code depends on their prose).

## Verify

Item's own verify command, already fully specified — nothing to add:

```bash
npm test && test -f src/state/status-fsm.mjs && test -f src/state/stage-fsm.mjs && ! test -f src/state/fsm.mjs && ! test -f src/state/stage.mjs
```

Plus a post-edit grep sweep (not a separate verify command, just a
pre-commit self-check) for zero remaining hits of the old filenames in
prose: `grep -rn "\bfsm\.mjs\b\|\bstage\.mjs\b" src test docs` should return
nothing once the rename and comment fixes land (excluding `docs/history/**`
and `plans/**`, out of scope above).

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| Import path breakage | low | `npm test` fails loudly on a bad import path — mechanical, self-checking |
| iron-law self-modification guard silently stops matching the renamed file | medium (silent, no test failure signal unless the fixture is also updated) | `test/evolve/iron-law.test.mjs` fixtures updated in lockstep (see Corrections §2) — verified by the same `npm test` run |
| Stale comment left behind | low (cosmetic, no runtime effect) | post-edit grep sweep above |

No split: one coherent piece of work, single verify command already covers
the whole surface.
