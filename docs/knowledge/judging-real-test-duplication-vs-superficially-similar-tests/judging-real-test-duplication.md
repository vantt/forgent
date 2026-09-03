---
type: explanation
title: Judging real test duplication vs. superficially-similar tests
tags: []
timestamp: 2026-07-29T02:54:18.000Z
source_capture_ids: [tsk-3wr-2]
framework: diataxis
mode: explanation
---
# Judging real test duplication vs. superficially-similar tests

A test suite with many similarly-shaped tests (same assertion pattern,
different inputs) is not automatically padded with redundancy. Removing
the wrong "duplicate" silently deletes real regression coverage. This is
the discriminator that held up across a full manual audit of this repo's
72-file, ~1490-test suite.

## The discriminator

Ask: does the mechanism under test live in **one shared, generic place**,
or is each test site backed by **independently-written code that could
break on its own**?

- **One shared mechanism** (real duplicate candidate): a single static
  data table, a single function called identically by every use site with
  no per-site logic in between.
- **Independently-wired code** (keep, even if the test *shape* looks
  identical): each call site has its own hand-written line that could
  itself be wrong — a typo'd flag key, a missing argument, a forgotten
  wiring — independent of whether the underlying helper it calls is
  correct.

## Real examples from this audit (tsk-3wr-2)

**False positive — looked like duplication, wasn't.** The item that
requested this audit cited `workflow-stage-graphs.test.mjs`'s
`Object.isFrozen()` checks as its concrete example of "a registry-frozen
check walking each field separately when one behavioral assertion would
cover the same guarantee." Reading the source
(`src/state/workflow-stage-graphs.mjs`) disproved this:

> ```
> export const DOMAINS = Object.freeze({
>   coding: Object.freeze({
>     stages: Object.freeze([...]),
>     stepMap: Object.freeze({...}),
>     ...
> ```
> — real source, `src/state/workflow-stage-graphs.mjs`

`Object.freeze()` is shallow — freezing the outer object does not freeze
nested ones. Each `assert.ok(Object.isFrozen(DOMAINS.coding.X))` line
guards a *separate, independent* `Object.freeze()` call in source. Delete
any one assertion and a regression that drops just that one nested
`Object.freeze()` call goes undetected. Left untouched.

**False positive — shared helper, but independently-wired call sites.**
`bin/fgos.mjs`'s `add` command validates `--tier`, `--domain`,
`--discovered-from`, `--docs-ref` all through the same `optionalField()`
helper:

> ```
> tier: optionalField(flags.tier, 'add --tier requires a tier value...'),
> discoveredFrom: optionalField(flags['discovered-from'], 'add --discovered-from requires...'),
> ```
> — real source, `bin/fgos.mjs`

Testing all four flags looks redundant by shape (same helper). It isn't:
each line is its own hand-written wiring that could independently break
(wrong flag key, wrong field name) regardless of whether `optionalField`
itself is correct. Left untouched — matches the same reasoning that
already applied to `work.mjs`'s per-field validation tests.

**Real duplicate — one shared mechanism, no per-site code between.**
`compound`/`review`/`approve`/`reject` verbs each have their *own* inline
`if (item.status !== 'proposed')` check — independently coded per verb,
confirmed by `grep`. But `test/runner/merge.test.mjs` had two tests with
byte-identical bodies (confirmed by a normalized-body hash scan across
the whole suite) both proving `reviewDiff` defaults to `main` with no
`opts.trunk` — an exact duplicate, safe to remove one.

**Real duplicate — same generic mechanism, disjoint parameterization.**
`test/state/fsm.test.mjs` had two separate `for` loops generating
`transitionWork` tests, both executing the identical assertion body
against `transitionWork`'s single static transition table, over disjoint
`(from, to)` pairs. No per-edge independent code existed to lose by
merging the two loops into one — `transitionWork`'s edge table is data,
not per-edge logic.

**Real duplicate — exhaustive test subsumes an arbitrary example.**
`test/state/porting.test.mjs` had one exhaustive test iterating every
`(from, to)` pair in `STATUSES × STATUSES`, proving every illegal edge
throws precondition. A separate test asserting one arbitrary illegal pair
(`candidate -> in-progress`, no unique name or extra assertion depth) was
a pure subset with zero distinguishing value — removed. Two *named*
terminal-state tests in the same file (`ported`/`adapted`/`rejected` are
"terminal single-door", and specifically "no reopen edge to candidate")
were kept even though they're also mechanically subsumed by the
exhaustive test — they document specific business rules by name, which
the exhaustive cross-product doesn't.

## The corollary: named business-scenario tests survive even when
## mechanically redundant

`test/state/fsm.test.mjs` keeps a standalone test for `blocked ->
proposed` alongside the merged generic loop, because it asserts something
the generic loop doesn't name: that this specific edge's event is "never
counted by anti-loop.mjs." Same in `test/runner/anti-loop.test.mjs`,
which keeps two tests that both exercise the identical
`role === 'human'` equality check in `visitsSinceLastHumanEvent` — one
named for a machine park (`anti-loop-max-visits`), one for a system park
(`return`/`approve` internal edges). Mechanically the same code path;
each names a real, distinct system behavior a reader would want confirmed
by name.

## Net result of the audit

Two scanning passes covered the whole suite: an exact-body hash (found 2
groups, both real) and a shape-normalized near-duplicate scan after
replacing literals with placeholders (found ~18 candidate groups). Every
candidate from the second scan was checked against source individually.
Most were false positives once the discriminator above was applied — this
codebase's apparent repetition is, in the overwhelming majority of cases,
independently-meaningful coverage of independently-written code, not
padding.

## Related

- `docs/history/test-suite-legibility/CONTEXT.md` — the locked decisions
  (D1/D2) this audit worked under, including the open-ended,
  duplication-driven scope with no target reduction.
- `fgos check <id>` — full outcome/friction history for this item.
