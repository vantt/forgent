# Plan — tsk-16a: truncateTitle ellipsis marker

Mode: small

No `exploring` round: discovery's own verdict came back `clear` (see
`RESEARCH.md` round 1), so there is no `CONTEXT.md`/locked-decisions table
for this feature — every claim below traces to this file's own evidence or
to `RESEARCH.md`, never to a `CONTEXT.md` D-ID.

## Approach

`truncateTitle` (`src/state/work.mjs:57-62`) already cuts at a word edge
within `MAX_TITLE_LENGTH` (100) but gives no signal that a title was cut —
confirmed against a real stored item (tsk-3ki) in conversation with the
user before this item was even submitted. Agreed fix, confirmed with the
user: append a single Unicode ellipsis char `…` (not three literal dots —
matches CSS `text-overflow:ellipsis`/`textwrap.shorten` convention and
costs 1 char instead of 3) **only when truncation actually happens**,
reserving that 1 char inside the existing 100-char ceiling so the total
length (word-boundary cut + marker) never exceeds `MAX_TITLE_LENGTH` — the
naive "cut to 100, then append" would produce 101 chars and break the
locked ceiling contract (`docs/explanation/work-item-title-length-ceiling.md`).

Rejected alternative: track paren/bracket depth and avoid stopping inside
an unclosed one. Discussed and rejected with the user as scope creep for a
polish item — the marker alone already signals "this was cut", which is
the actual complaint (title reading as if it finished naturally when it
did not).

**Files touched:**

- `src/state/work.mjs` — `truncateTitle` itself.
- `test/intake/classify.test.mjs` — 2 assertions break (see Risk map).
- `test/runner/loop.test.mjs` — 1 assertion breaks (see Risk map).

**Order:** single commit, all three files together — the test updates are
not separable from the function change (same behavior, same proof).
`fgos graph --json`'s `criticalPath`/`topUnblock` were not consulted:
this item has no dependents and no split candidates to order between (see
"Decide the split" below).

**Impact-analysis posture: full.** `fgos tool query --capability
impact-analysis --status present` → GitNexus present. `impact({target:
"truncateTitle", direction: "upstream"})` → **risk: CRITICAL**, 16 impacted
symbols, 4 direct callers (`deriveTitle`, `addWork`, `editWork`,
`captureDiscoveredWork`). Read together with `RESEARCH.md` round 1: the
CRITICAL label reflects `truncateTitle`'s fan-in breadth (it sits behind
every store write door), not a semantic risk from this specific change —
the 4 direct callers GitNexus found are the exact same set the manual
`rg` scan in `RESEARCH.md` already enumerated, no additional caller
surfaced. Confirmed with the user before proceeding (in-session
AskUserQuestion, 2026-08-16): continue.

## Risk map

| Component | How risky | What proves it |
|---|---|---|
| `truncateTitle` output shape change | Low-medium — wide fan-in (CRITICAL per impact analysis) but narrow actual behavior delta (still a string ≤100 chars; only the trailing content changes when truncation fires) | Full test suite green, esp. the 3 assertions below |
| `test/intake/classify.test.mjs:26` (`longText.startsWith(title)`, "truncates long text with no natural boundary at a word edge") | Will fail as-is — title now ends with `…`, not a literal substring of the input | Update assertion to strip the trailing marker before the `startsWith` check, or assert on the pre-marker portion directly |
| `test/intake/classify.test.mjs:36` (`runOn.startsWith(title)`, "bounds a first sentence that runs past the title bound") | Same failure mode as above | Same fix shape |
| `test/runner/loop.test.mjs:1637` (S11 forged-title-injection test, exact-string `'A'.repeat(MAX_TITLE_LENGTH)`) | Will fail as-is — content changes from 100 `'A'`s to 99 `'A'`s + `…` | Update the expected literal to `'A'.repeat(MAX_TITLE_LENGTH - 1) + '…'`; the security property itself (no `FORGED` substring, no embedded newline) is asserted separately in the same test and is unaffected |
| `src/runner/loop.mjs:699` idempotency check | None — both sides of the comparison call the same `truncateTitle`, so behavior stays self-consistent whatever the output shape is | Confirmed by reading, no test currently exercises this specific self-consistency but existing `runner/loop.test.mjs` coverage around discovered-block capture would surface any drift |
| `test/intake/classify.test.mjs:47` (`title.length === MAX_TITLE_LENGTH`, hard-cut no-space case) | None — reserving 1 char keeps the total exactly `MAX_TITLE_LENGTH` (99 + 1) | No change needed, verified by re-deriving the arithmetic in `RESEARCH.md` |
| `test/state/store.test.mjs:1089,1106` (`length <= MAX_TITLE_LENGTH`) | None — inequality holds regardless of a trailing marker | No change needed |

## Decide the split

One honest piece of work — no split. A single function change plus its two
dependent test files, one commit.

## Shape

1. In `src/state/work.mjs`, change `truncateTitle` to reserve 1 char for the
   marker before searching for the word boundary, and append the marker
   only on the branch that actually truncates:

   ```js
   export function truncateTitle(title) {
     if (typeof title !== 'string' || title.length <= MAX_TITLE_LENGTH) return title;
     const budget = MAX_TITLE_LENGTH - 1; // reserve 1 char for the ellipsis marker
     const cut = title.slice(0, budget);
     const lastSpace = cut.lastIndexOf(' ');
     return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim() + '…';
   }
   ```

2. Update `test/intake/classify.test.mjs:26` and `:36` — the `startsWith`
   assertions need to check the pre-marker prefix, not the whole (now
   marker-suffixed) title.
3. Update `test/runner/loop.test.mjs:1637` — expect `'A'.repeat(MAX_TITLE_LENGTH
   - 1) + '…'` instead of `'A'.repeat(MAX_TITLE_LENGTH)`.

Concrete cases already covered by the sketch above: empty/short input
(early-return branch, untouched — no marker), word-boundary truncation
(existing behavior + marker), no-space hard-cut truncation (existing
behavior + marker, length still exactly 100), and the forged-title security
case (bound still holds, marker does not reopen the newline-injection
gap since it is appended after `.trim()` on the already-bounded slice).

## Outstanding questions

None
