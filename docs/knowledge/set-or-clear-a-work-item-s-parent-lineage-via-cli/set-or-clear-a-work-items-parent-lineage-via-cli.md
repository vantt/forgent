---
framework: diataxis
mode: how-to
---
# Set or clear a work item's `parent` lineage via CLI

`tsk-1xx` wired a `--parent` flag into `fgos add` and `fgos edit` — before
this item, `parent` was a real, load-bearing field with no CLI path to set
it directly.

## The gap this closes

> `fgos add` and `fgos edit` (`src/cli/command-registry.mjs`) do not
> expose a `--parent` flag, even though `parent` is a real, load-bearing,
> separately validated field (`src/state/work.mjs:255-262`) that ~10
> consumers read directly (`frontier.mjs`, `dep-graph.mjs`'s
> `buildUnifiedEdges`, `impact.mjs`'s blocking-fan-out, `decompose.mjs`'s
> `hasChildren` re-entrancy check — decision 0012). The only writer of
> `parent` anywhere in the repo today is `decompose.mjs:394`, inside
> `judgeDecompose`'s internal `addWork()` call for the auto-split path.
> `fgos-coding-planning`'s own `SKILL.md` (step 5, lines 117-122) tells a session
> to create child items that "carry this item's own id as its `parent`" —
> language that assumes a CLI path that does not exist.

## Setting it

```
fgos add --title "..." --description "..." --parent <id> ...
```

or on an existing item:

```
fgos edit <id> --parent <id>
```

Validated the same way `work.mjs` already validates `parent` shape: a
non-empty string, and it may not equal the item's own id. No new
existence-check is added — a `parent` pointing at a not-yet-created id is
accepted as benign, matching decision 0012's existing tolerance for a
dangling forward reference.

## Clearing it

```
fgos edit <id> --parent ""
```

Locked decision D2:

> `fgos edit --parent ""` **clears** the field (un-parents an item),
> matching the existing empty-string-clears convention already used by
> `edit --deps ""` / `edit --refs ""`.

Rationale:

> `edit --deps ""` and `edit --refs ""` already clear those fields... Now
> that `edit --parent` exists at all (per D1), leaving it asymmetric —
> able to set/change but never clear — has no cited justification and
> would be a gap of the same shape this item exists to close. Unsetting
> `parent` is semantically valid: it returns an item to top-level (no
> longer blocking a parent's `hasOpenDescendant` check), the same state an
> item created without `--parent` already has.

A bare `--parent` with no value is rejected outright, distinct from
`--parent ""`:

```
error: --parent requires a value; use --parent "" to clear it.
```

## Why both `add` and `edit`, not `add` only

D1, weighed against the closest prior precedent (`--footprint`, fixed
`add`-only per STR92):

> Wire `--parent` into **both** `fgos add` and `fgos edit`, not `add`
> only.

Scout found only one existing internal writer of `parent`
(`decompose.mjs:394`, creation-time only inside `judgeDecompose`'s
auto-split path) — but that alone didn't justify skipping `edit`, since a
person restructuring an item's lineage after creation has no other way in
once this item exists to make that a supported operation.

## Encountered while resolving this item's own merge: a real conflicting edit

Landing this fix on `main` conflicted with a concurrently-merged sibling
item that added `--urgent`/`--impact`/`--effort` to the same
`EDITABLE_FIELDS` set, the same registry `edit` command's description
string, and the same "at least one field" error message in
`bin/fgos.mjs`/`src/cli/command-registry.mjs`/`src/state/store.mjs` — all
three were adjacent-insertion conflicts (both branches adding a new field
name to the same list/string), resolved by including both sets of
additions rather than picking one side. `EDITABLE_FIELDS` today is
`title/kind/risk/verify/tier/refs/deps/acceptance/priority/intent/docsRef/parent/urgent/impact/effort`.
