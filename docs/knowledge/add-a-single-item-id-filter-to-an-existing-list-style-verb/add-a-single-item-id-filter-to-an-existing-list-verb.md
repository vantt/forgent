---
framework: diataxis
mode: how-to
---
# Add a single-item `--id` filter to an existing `list`-style verb

A recipe for narrowing an existing multi-item read verb to one item by id,
grounded in adding `list --id <id>` (tsk-42m) so `/fgOS:pick`'s
terminal-rename step stops dumping the entire open-item backlog just to
read one claimed item's `title`/`description`.

## 1. Confirm the antipattern is real before designing the fix

The reported symptom was concrete: `/fgOS:pick`'s own call site ran raw
`node bin/fgos.mjs list --json` and produced a 326.6KB response in session
just to read one item's two fields. Don't design the filter in the
abstract — find the actual over-fetching call site first
(`plugins/fgOS/skills/pick/SKILL.md:81`), and confirm nothing else already
solves it.

## 2. Reuse the nearest existing narrowing-flag precedent, don't add a verb

Before inventing a new verb (`fgos show`/`fgos get`), scout for a flag that
already narrows an existing read verb to one item. `graph --what-if <id>`
(`bin/fgos.mjs:1085-1088`) was that precedent here — one flag on an
already-registered verb, not a parallel command surface. Locked as D1:

> `--id <id>` narrows `list` to a single item (`data.work["<id>"]`),
> following the existing `graph --what-if <id>` narrowing-flag pattern,
> rather than adding a new verb (e.g. `fgos show`/`fgos get`).

## 3. Match the id-lookup shape every other id-based verb already uses

Every id-based verb in this CLI (`take`, `pick`, `return`, `review`,
`approve`, `reject`, `catchup`, `rollup`, `compound`) resolves
`listWork(dir).work[id]` directly and throws the same not-found shape on a
miss — `list`'s new `--id` branch should do the same, not invent its own
error shape:

```js
if (flags.id !== undefined) {
  const id = requireField(flags.id, 'list --id requires a non-empty work id');
  const item = rawView.work[id];
  if (!item) {
    throw new StoreError('validation', `list: work "${id}" not found.`);
  }
  const singleView = { ...rawView, work: { [id]: item } };
  if (item.status === 'awaiting-human') {
    const ctx = computeAwaitingContext(singleView, id);
    if (ctx) return { ...singleView, awaitingContext: { [id]: ctx } };
  }
  return singleView;
}
```

Locked as D2: `--id` bypasses `list`'s own open-only default
(hiding `status === 'done'` items unless `--all`) entirely — naming a
specific id already commits to that item regardless of status, so
`--all`/open-only is irrelevant once an id is named. Short-circuit before
the pagination branch too; single-id lookup and `--cursor`/`--limit` are
mutually irrelevant.

## 4. Rewire the actual motivating call site, don't leave the flag unused

Adding the capability without wiring the reported over-fetching call site
to use it would not close the bug — it would just make closing it
*possible*. Locked as D4 (human-confirmed scope call): this item also
updates `/fgOS:pick`'s own call from bare `list --json` to
`list --id "<id>" --json`, substituting the same `<id>` already read from
the claim step — no new variable, no new state read.

## 5. Scope out sibling call sites that need the full list for a different reason

Not every raw `list --json` call site is the same antipattern. Scouted and
explicitly ruled out of scope (D3):

> `submit`'s (`plugins/fgOS/skills/submit/SKILL.md:30`) and `cook`'s
> (`plugins/fgOS/skills/cook/SKILL.md:58`) own raw `list --json` call sites
> are out of scope for this item... `submit` scans every open item's title
> for a textually-grounded dependency candidate (needs the whole open set,
> not one item); `cook` re-reads full state for orientation ("always
> fresh"). Neither is the "one item, full dump" antipattern this item
> fixes.

Only rewire a call site once you've confirmed it wants exactly one item,
not a scan over the open set.

## Update (`tsk-2u9`): "scoped to one item" meant `work`, not every section

Step 3's original implementation only narrowed `singleView.work` to the
requested id — every other section of the response
(`decisions`/`discovery`/`gates`/`settlements`/`outcomes`/`frictions`/
`learnings`/`decisionsById`) stayed unfiltered against the *entire*
backlog. Confirmed with a real repro: `list --id tsk-2aa --json`
correctly returned `work: {}` scoped to 1 entry, but the same response
carried 1334 unscoped `decisions` entries, 201 `discovery` keys, and 138
`gates` keys — a 2.2MB response for what was supposed to be a single-item
lookup.

This directly contradicted the skill docs that motivated this whole
feature: `pick/SKILL.md` step 3 documents the call as "filtered to just
this item so the call never dumps the whole backlog," and
`fgos-coding-exploring/SKILL.md` step 1 implies scoped access to
`view.discovery["<item-id>"]`. The behavior these docs promised was never
actually shipped for anything past `work` itself.

Fixed by scoping every one of those sections to the requested id the same
way `work` already was — a genuine single-item response, not a
single-item `work` field bolted onto a full-backlog dump for everything
else. The lesson for the next narrowing flag added this way: "scoped to
one item" has to mean every section of the response, not just the field
that happened to be the original bug report's own repro.

## 6. Test both the bypass behavior and the not-found shape

Three cases proved this feature, not just the happy path:

- `list --id <id>` returns only that item, ignoring `--all`/open-only.
- `list --id <id>` on a `status: done` item still returns it *without*
  `--all` — proving the open-only default is actually bypassed, not just
  unreached in the happy-path test.
- `list --id <unknown>` exits non-zero with the exact
  `work "<id>" not found.` message shape every other id-based verb uses.
