---
type: context
title: fgos add/edit missing --parent flag
item: tsk-1xx
stage: clarify
---

# tsk-1xx — fgos add/edit missing --parent flag

## Feature boundary

`fgos add` and `fgos edit` (`src/cli/command-registry.mjs`) do not expose a
`--parent` flag, even though `parent` is a real, load-bearing, separately
validated field (`src/state/work.mjs:255-262`) that ~10 consumers read
directly (`frontier.mjs`, `dep-graph.mjs`'s `buildUnifiedEdges`,
`impact.mjs`'s blocking-fan-out, `decompose.mjs`'s `hasChildren`
re-entrancy check — decision 0012). The only writer of `parent` anywhere in
the repo today is `decompose.mjs:394`, inside `judgeDecompose`'s internal
`addWork()` call for the auto-split path. `fgos-coding-planning`'s own `SKILL.md`
(step 5, lines 117-122) tells a session to create child items that "carry
this item's own id as its `parent`" — language that assumes a CLI path
that does not exist. STR92 (`docs/backlog.md:132`, 2026-07-23 audit) caught
the adjacent missing `--footprint` gap on the same planning step but did
not catch this one.

This item closes that gap: wire `--parent` through the CLI into
`addWork`/`editWork`, validated the same way `work.mjs` already validates
parent shape (non-empty string, not self-referential) — no new
existence-check beyond what `addWork`/`editWork` already enforce via
`assertNoUnifiedCycle` (decision 0012).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Wire `--parent` into **both** `fgos add` and `fgos edit`, not `add` only. |
| D2 | `fgos edit --parent ""` **clears** the field (un-parents an item), matching the existing empty-string-clears convention already used by `edit --deps ""` / `edit --refs ""`. |

### D1 rationale

Scout found only one existing internal use of `parent`:
`decompose.mjs:394` sets it once, at item-creation time, inside its own
`addWork()` call — never edited afterward anywhere in the repo. The
directly analogous prior gap, `--footprint` (STR92), was fixed by adding
the flag to `add` only, never `edit` (`command-registry.mjs:80` — `add`
has `footprint`, `edit` does not). That precedent argues for `add`-only.

Weighed against it: `store.mjs:193`'s `EDITABLE_FIELDS` set deliberately
excludes `parent` today, and the surrounding comments (`store.mjs:251-253`)
treat that exclusion as a load-bearing invariant ("`parent` is NOT
editable, so an edit closes such a cycle only by patching `deps`...") —
this reasoning is about a **cycle-safety accounting shortcut**, not a
claim that `parent` must never change. `editWork` already re-validates the
**full merged candidate** through the same `validateWork` +
`assertNoUnifiedCycle` path `addWork` uses (`store.mjs:213-233`), so
allowing `parent` into `EDITABLE_FIELDS` does not bypass any existing
guard — it is covered by the same mechanism, not a new one.

Decision: user chose **add and edit**. The comment at `store.mjs:251-253`
documents the current shortcut's reasoning, not a hard constraint — it
will need a one-line update (not a redesign) once `parent` moves into
`EDITABLE_FIELDS`, since the guard itself already covers the case.

### D2 rationale

`edit --deps ""` and `edit --refs ""` already clear those fields
(`command-registry.mjs:203-204`, "empty string clears the field"). Now
that `edit --parent` exists at all (per D1), leaving it asymmetric — able
to set/change but never clear — has no cited justification and would be a
gap of the same shape this item exists to close. Unsetting `parent` is
semantically valid: it returns an item to top-level (no longer blocking a
parent's `hasOpenDescendant` check), the same state an item created
without `--parent` already has.

## Pinned terms

- **"parent shape validation"** — `work.mjs:255-262`: `work.parent` must be
  `undefined`/`null` (absent) or a non-empty string, and must not equal
  `work.id`. This is the only validation `add`/`edit`'s new `--parent` flag
  needs to reuse; no new existence-check is added (decision 0012 already
  treats a dangling forward `parent` as accepted/benign).

## Scout evidence

- `src/cli/command-registry.mjs:64-99` (`add` params — no `parent`),
  `:191-219` (`edit` params — no `parent`), `:80` (`add` already has
  `footprint`, precedent for narrow single-flag fixes).
- `src/state/store.mjs:193` (`EDITABLE_FIELDS` excludes `parent`),
  `:213-233` (`editWork` revalidates full merged candidate via the same
  `validateWork`/cycle-guard path as `addWork`), `:251-253` (comment
  documenting the current "parent not editable" shortcut's reasoning).
- `src/state/work.mjs:255-262` (parent shape validation: non-empty string,
  no self-reference).
- `src/intake/plan.mjs:322` (`hasChildren` reads `.parent`), `:394`
  (only existing writer of `parent`, inside `judgeDecompose`'s auto-split
  `addWork()` call, creation-time only).
- `docs/decisions/0012-typed-edge-model-supersedes-deps-parent-separation.md`
  — confirms `parent` is a real, separately-stored, load-bearing field
  (not superseded), unified into cycle-check alongside `deps`, and
  explicitly tolerates a dangling (non-existence-checked) `parent`.
- `.claude/skills/fgos-coding-planning/SKILL.md:117-122` — step 5's child-creation
  language ("carries this item's own id as its `parent`") that assumes the
  now-missing CLI path.
- `docs/backlog.md:132` (STR92 audit) — same-shaped prior gap
  (`--footprint`) fixed `add`-only; direct precedent weighed for D1.

## Canonical references

- `docs/decisions/0012-typed-edge-model-supersedes-deps-parent-separation.md`
- `docs/backlog.md:132` (STR92)
- `.claude/skills/fgos-coding-planning/SKILL.md` step 5

## Outstanding questions deferred to planning

- Exact `verify` command for this fix (item currently carries a
  placeholder: `"chưa xác định — P15 bổ sung"`) — implementer's call, not a
  product decision.
- Whether `store.mjs:251-253`'s comment needs a full rewrite or a one-line
  update once `parent` enters `EDITABLE_FIELDS` — implementation detail,
  not scope-changing.
