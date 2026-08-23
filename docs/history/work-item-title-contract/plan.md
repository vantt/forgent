# work-item-title-contract — work shape

Item: `tsk-52g`. Decisions: `docs/history/work-item-title-contract/CONTEXT.md`
(D1–D6). Nothing here reopens those — each choice below cites the D-ID it
honors.

**Revision 2.** The first shape put the length ceiling in `validateWorkShape`
and claimed one placement covered every write door. The feasibility check
disproved both by reading the code: `validateWorkShape` is a pure validator
and cannot truncate, and `fgos edit --title` is a third door the shape had
missed. Phase 1 and phase 3 below are rewritten against what the code
actually does. No `CONTEXT.md` decision changed — D5 still says truncate at
the store layer; only the function it lands in did.

## Mode: standard (3 flags)

Counted against the mode-gate list, not judged:

| flag | applies | why |
|---|---|---|
| auth | no | — |
| authorization | no | — |
| **data model** | **yes** | D5 adds a length bound to the store's own write doors (`addWork`/`editWork`, `src/state/store.mjs`); D4 rewrites the `title` field on every existing item. |
| audit / security | no | — |
| external systems | no | No network, no provider, no subprocess. |
| **public contracts** | **yes** | `fgos add --title` and `fgos submit` change observable output — a title over the ceiling comes back truncated. `deriveTitle` is imported by `bin/fgos.mjs` and covered by its own tests. |
| cross-platform | no | Pure string + JSON work. |
| **existing covered behavior** | **yes** | `test/intake/classify.test.mjs` (9 tests over `deriveTitle`) and `test/state/work.test.mjs` (21KB over `validateWorkShape`/`addWork`) both cover the exact surfaces being changed. |
| weak proof around the area | no | The opposite — the area is among the better-covered ones in the repo. |
| multi-domain | no | Single `coding` domain. |

**3 flags → standard.** A `small` mode would not honestly cover this: D4 is a
one-shot rewrite across every item in the store, and D5 changes both write
doors every mutation goes through (`addWork`, `src/state/store.mjs:139`;
`editWork`, `store.mjs:206`). Both need a phase with its own proof, not a
single note.

The third write door found at the feasibility check does not add a flag —
`public contracts` and `data model` already cover it — so the mode stays
`standard`. It does widen phase 1 from one placement to two.

**No hard gate fires.** The one candidate was D4 as data loss — rewriting 54
titles, some hand-authored. It does not qualify: `.fgos/events.jsonl` is the
event-sourced truth **and is git-tracked**, while `state.json` is only a view
rebuilt from it (`src/state/store.mjs:7,10,103-108`). A re-derive appends
`edit` events; every original title survives in the log and `rebuild()` is the
documented recovery path (`store.mjs:13`). Reversible, so no hard gate.

## Graph position

`fgos graph --json`: `tsk-52g` appears in neither `criticalPath` (depth 10,
rooted at `tsk-4vo`) nor `topUnblock`. It is an isolated component — no deps,
nothing waiting on it. The graph therefore imposes **no external ordering**;
the phase order below is driven purely by the internal dependency that the
ceiling constant must exist before anything can consume it.

## Split decision: no split

This stays one item. Reasoning:

- Phases 1 and 2 are one coherent change to a single rule (title length) across
  two adjacent modules.
- Phase 3 cannot be defined until phase 1 fixes the ceiling constant, so
  splitting it out would only create a dependency edge that ordering inside one
  item already guarantees, at the cost of an extra claim, worktree, and merge.
- Phase 4 is prose in skills and one prompt — too small to stand as its own
  claimable item.

Total surface: 4 source/doc files plus one migration pass. One session does
this in one pass; splitting would add lifecycle overhead without buying
isolation.

## Approach

### Phase 1 — the ceiling at the store layer (D5, D2)

**Not in `validateWorkShape`.** That function (`src/state/work.mjs:131-160`) is
a pure validator: every branch either throws `WorkValidationError` or returns
`true`, and it never mutates the item it is handed. D5 requires the ceiling to
**truncate, never reject** — the only behavior a validator can offer is
rejection, which is exactly what D5 forbids, and exactly what would break an
agent calling `add --title` with a long title.

The ceiling belongs at the two **normalize** points the store already has,
each one line above its `validateWork` call:

- `addWork` — `const item = { ...work, tier: work?.tier ?? DEFAULTS.tier };`
  (`src/state/store.mjs:154`), then `validateWork(item, …)` (`:155`).
- `editWork` — `const candidate = { ...work, ...patch };`
  (`src/state/store.mjs:226`), then `validateWork(candidate, …)` (`:227`).

Both already normalize-then-validate, so a title truncation joins an
established pattern rather than introducing one.

**Two doors, not one — `edit --title` is the third title writer.** `'title'`
is in `EDITABLE_FIELDS` (`store.mjs:186`), so `fgos edit --title` writes a
title without ever passing through `addWork`. The four callers CONTEXT.md's
feature boundary names collapse onto exactly these two doors: `submit`, `add
--title`, and `decompose` children all reach `addWork`; `edit --title` reaches
`editWork`. Phase 3 uses the `edit` door itself, so leaving it ungoverned
would let the re-derive pass emit exactly the titles it was run to fix.

Then apply D2 inside `deriveTitle` (`src/intake/classify.mjs:20-36`) so the
ceiling governs **both** branches — today `TITLE_MAX_LENGTH = 60` reaches only
the fallback branch (`:30-35`) while the boundary branch (`:24-28`) returns an
uncapped first sentence. This is deliberate belt-and-braces alongside the store
doors, not redundancy: `deriveTitle`'s output feeds `generateId(title, …)` at
`bin/fgos.mjs:611` **before** `addWork` ever runs, so a store-layer bound is
too late to govern what the id generator sees.

Rejected alternative: putting the ceiling only in `deriveTitle`. It cannot
reach `add --title` (raw passthrough, `bin/fgos.mjs`, `title: flags.title`),
`decompose` children, or `edit --title` — and per CONTEXT.md's scout data those
doors produced the titles now in the store.

Then apply D2 inside `deriveTitle` (`src/intake/classify.mjs:20-36`) so the
ceiling governs **both** branches — today `TITLE_MAX_LENGTH = 60` reaches only
the fallback branch (`:30-35`) while the boundary branch (`:24-28`) returns an
uncapped first sentence. This is deliberate belt-and-braces alongside phase 1,
not redundancy: `deriveTitle`'s output feeds `generateId(title, …)` at
`bin/fgos.mjs:611` **before** `addWork` ever runs, so the store-layer bound is
too late to govern what the id generator sees.

Rejected alternative: putting the ceiling only in `deriveTitle`. It cannot
reach `add --title` (raw passthrough, `bin/fgos.mjs`, `title: flags.title`) or
`decompose` children — the two doors that, per CONTEXT.md's scout data,
produced titles now in the store.

**Verify:** `node --test test/state/store.test.mjs test/state/work.test.mjs test/intake/classify.test.mjs`
(baseline for the latter two measured green at the feasibility check: 102 pass,
0 fail)

### Phase 2 — keep the covered behavior honest (D2, D3)

D2 adds no floor and D3 keeps `submit` mechanical precisely so the existing
assertions stay green — in particular `test/intake/classify.test.mjs:9` (short
first-sentence cut) and `:27-39` (dotted filenames must not cut early, the
`tsk-2z3` fix). New assertions cover the ceiling on both branches; no existing
assertion should need rewriting. **If one does, that is a signal the change
overreached D2, not a licence to edit the test.**

**Verify:** `npm test`

### Phase 3 — re-derive existing titles (D4)

One pass over every item in the store, recomputing `title` from
`description` and writing it through the existing `edit` verb path
(`bin/fgos.mjs:975` → `editWork`, `store.mjs:206`) so each rewrite lands as a
real event rather than a direct `state.json` poke — the one-door-write rule,
and what makes the original titles recoverable: the appended event carries only
`{ id, patch }` (`store.mjs:197`), so every prior title stays in the log.

This phase is why phase 1 must cover `editWork` and not only `addWork`. Its
writes go through the `edit` door; an ungoverned `edit` door means the
re-derive pass is itself unbounded.

Scope is **all items**, not only violators (D4, explicitly chosen over the
narrower option). Expected effect, from CONTEXT.md's measurements: the 32
items over 100 chars shorten; the 7 short ones are unchanged, because
re-derive can only shorten (CONTEXT.md "Known limits" #3).

**Verify:** every stored title is within the ceiling —

```bash
node bin/fgos.mjs list --json --dir . | node -e "
let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
const bad=Object.values(JSON.parse(s).data.work).filter(i=>(i.title||'').length>100);
if(bad.length){console.error('over ceiling: '+bad.length);process.exit(1);}
console.log('ok: no title over ceiling');});"
```

### Phase 4 — the semantic contract where authors read it (D6, D1)

Write D1's contract (đối tượng + hành động + phạm vi) into the three places an
author actually reads before naming something:

- `.claude/skills/fgos-submit-assist/SKILL.md`
- `plugins/fgOS/skills/submit/SKILL.md`
- the `decompose` LLM prompt, `src/intake/plan.mjs:130`

Per D6 and CONTEXT.md's "Known limits" #1–2, this is **author guidance, never a
mechanical assertion** — no code asserts D1 anywhere.

Rejected alternative: binding D1 to the `decompose` prompt alone. Measured, the
LLM child path holds **0 of 54** items, so it would have had near-zero present
effect while every title in the store came through `submit` or `add`.

**Verify:** `npm test` (guards the `decompose` prompt's own snapshot/shape
tests in `test/intake/plan.test.mjs`)

## Risk map

| component | risk | what would prove it |
|---|---|---|
| store-door truncation (phase 1) | **medium** — `addWork` and `editWork` are the two doors every mutation passes; a rejection instead of a truncation, or an off-by-one, breaks `add`/`submit`/`edit` for every caller at once | `fgos-coding-validating`: confirm an over-length `add --title` **and** an over-length `edit --title` each return exit 0 with a truncated title, not an error |
| both doors stay in step (phase 1) | **medium** — two placements can drift; a ceiling on `addWork` alone leaves phase 3's own `edit` writes ungoverned | `fgos-coding-validating`: confirm the same constant governs both call sites, and that no third `EDITABLE_FIELDS` path writes `title` |
| `deriveTitle` both-branch cap (phase 1) | **medium** — touches behavior locked by 9 existing assertions, including the `tsk-2z3` dot-boundary fix | `fgos-coding-validating`: confirm the new cap cannot re-break the dotted-filename case at `classify.test.mjs:27-39` |
| re-derive pass (phase 3) | **medium** — writes to all 54 items; a bug corrupts the whole backlog's titles in one run | `fgos-coding-validating`: confirm the rewrite path goes through the `edit` verb (events appended, `rebuild()` recovery intact), and dry-run the diff before writing |
| truncation cut point (phase 1) | low | word-edge vs hard-index is deferred below; either satisfies D2 |
| skill/prompt prose (phase 4) | low | no runtime behavior; `npm test` covers the prompt's shape tests |

Every medium above carries a named proof point into `fgos-coding-validating`. None is
resolved by assertion here.

## Cases worth proving against

- Title exactly at the ceiling, one under, one over (boundary).
- Empty and whitespace-only submissions — `deriveTitle` must still return
  `'Untitled submission'` (`classify.mjs:22`).
- A submission whose first sentence contains a dotted filename — must not
  regress `tsk-2z3`.
- `add --title` with an over-length title from a script: exit 0, truncated
  (D5), never a thrown error.
- Re-derive run twice: second run must be a no-op (idempotent), not a
  progressive shortening.
- An item whose `description` is byte-identical to its `title` (6 such items
  measured) — re-derive must leave it unchanged.

## Deferred from CONTEXT.md, decided here

- **Ceiling constant**: exported from `src/state/work.mjs` next to
  `MAX_ID_LENGTH`, imported by both consumers rather than duplicated as a
  second number. Both import directions are already established, so this adds
  no new layering: `store.mjs` already imports from `work.mjs`
  (`store.mjs:36`), and `src/intake/*` already imports from `src/state/*`
  (`decompose.mjs:24`, `discovery.mjs:27` both take `DEFAULTS` from
  `../state/work.mjs`).
- **`normalizeChild` length check** (`src/intake/plan.mjs:146`): **not in
  scope.** Child items are created through `addWork` (`decompose.mjs:25`
  imports it directly), so phase 1's door truncates their titles already; a
  second check there would be a duplicate rule at a weaker choke point.

## Still open for `fgos-coding-validating`

- Word-edge versus hard-index truncation, and whether an ellipsis marker is
  wanted at the cut.
- Whether phase 3 ships as a one-shot script under `scripts/` or a CLI verb —
  CONTEXT.md left this open and nothing since has settled it.
- Whether re-derive is genuinely idempotent given `deriveTitle` runs against
  `description`, not against the prior title.
