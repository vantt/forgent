# Research — tsk-3hks: no field to clear a stale reason/parkReason

## Round 1 — 2026-08-21

**Asked:** Does fgOS's write door (`src/state/store.mjs`) already provide
any way — `editWork`/`EDITABLE_FIELDS`, or another verb — to patch/clear
the `reason` and/or `parkReason` fields on an existing work item (including
one whose status is `done`)? Is there any locked design decision that
deliberately excludes `reason`/`parkReason` from `EDITABLE_FIELDS` for
audit-integrity/immutability reasons, as opposed to them simply never
having been added?

**Checked (repo):**

- `src/state/store.mjs:280` — `EDITABLE_FIELDS` allowlist: `['title',
  'description', 'kind', 'risk', 'verify', 'tier', 'refs', 'deps',
  'acceptance', 'priority', 'intent', 'docsRef', 'parent', 'urgent',
  'impact', 'effort', 'footprint', 'mergeAfter', 'supersededBy',
  'duplicates', 'domainFields', 'goalTier']`. Neither `reason` nor
  `parkReason` is present.
- `src/state/store.mjs:274-279` — comment explains the excluded set that
  IS commented on: `id`/`status`/`stage`/`domain` are deliberately absent
  because each already has its own dedicated write path (identity is
  immutable; `status` is `move`'s; `stage` is `moveStage`'s). `reason`/
  `parkReason` are not named in this comment at all — they are simply
  never populated as edit-door fields, not called out as intentionally
  excluded.
- `src/state/store.mjs:300-318` (`editWork`) — no status-based guard
  blocks editing a `done` item. The only extra guard is `kind` requiring
  `status === 'todo'`. So the write door itself has no structural
  obstacle to allowing `reason`/`parkReason` edits on closed items, if
  they were added to the allowlist.
- `src/state/replay.mjs:172-179` (`RUL32`) — `item.reason` is folded from
  the `reason` field carried by a `work.move` event, **latest-wins**
  (overwrites every time, unlike the additive fold used by outcome/
  friction/settlement/discovery). There is no event type that clears it
  back to absent — once set, it persists forever unless a later move
  event carries a different `reason`.
- `docs/specs/work-state.md:949` — "`done` là cửa một chiều ra: item đã
  done thì mọi lần move tiếp theo đều bị `precondition`" — once an item
  reaches `done`, no further `work.move` event can ever be appended for
  it. Combined with the latest-wins-only-via-move fold above, this means
  a `done` item's stale `reason` is **structurally permanent** today —
  there is no event path left that could ever overwrite it, let alone
  clear it.
- `docs/specs/work-state.md:1159` (RUL32) and `:1230` — confirm the same
  latest-wins-via-move-only mechanics; no mention of `reason` being
  excluded from `edit` for audit-integrity reasons.
- `docs/specs/work-state.md:1179` (RUL64) — a directly relevant PRECEDENT:
  `holder` is also deliberately excluded from `EDITABLE_FIELDS` ("cùng
  loại trừ stage/status/domain đã có"), but instead of ever being added to
  the generic `edit` allowlist, it got its OWN dedicated verb pair
  (`fgos handoff` / `fgos handoff-return`) with its own validation
  (`roleGraph.edges[stage]`). This is the established codebase idiom for
  a field with special semantics that still needs a controlled write path
  outside plain `edit`.
- `grep -rln "reason" docs/decisions/*.md` cross-referenced against
  immutability/audit language: no hit. No decision doc anywhere states
  `reason`/`parkReason` must stay immutable once set. The gap is an
  omission (the field was only ever designed as a move-event side effect,
  for the "hand the worker the latest objection" use case), not a
  deliberate exclusion decision.
- `test/cli/fgos-edit.test.mjs` exists and exercises `EDITABLE_FIELDS`
  behavior directly — this is the narrowest real test surface for a fix
  here.

**Found:**

1. No existing verb can clear/patch `reason` or `parkReason` on a `done`
   item today. `reason` is move-only and `done` accepts no further moves
   — the item description's claim is confirmed exactly as stated, with
   file:line evidence, not just plausible.
2. No locked decision blocks adding this capability. The gap is a genuine
   missing write path, not a deliberately protected invariant.
3. The codebase already has a precedent for how fgOS handles a
   special-semantics field that should not just join generic `edit`:
   `holder`/RUL64 got its own dedicated verb pair instead. This is a
   relevant prior-art signal for planning's approach choice (plain
   `EDITABLE_FIELDS` addition vs. a narrow dedicated verb) — not a
   blocker, but worth citing so planning doesn't re-discover it from
   scratch.

**Still open:** none for discovery purposes — the "extend EDITABLE_FIELDS
vs. new verb" choice is an implementation-approach decision, not a product
ambiguity; planning can resolve it directly using the RUL64/`holder`
precedent above.
