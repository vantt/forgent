---
type: explanation
title: Spec docs drift silently when only the code has an exact-match test
source_capture_ids: [tsk-2m5]
---
# Spec docs drift silently when only the code has an exact-match test

`tsk-2ta-2` added a 6th entry (`config-awareness`) to `src/setup/checks.mjs`'s
`DOCTOR_CHECKS` array. `test/setup/checks.test.mjs` has a real, exact-match
test for this array's shape:

```js
test('DOCTOR_CHECKS has exactly the three v1 checks from CONTEXT.md plus
  main-checkout-hook-wired, tool-registry-configured, and config-awareness',
  () => {
    assert.deepEqual(
      DOCTOR_CHECKS.map((c) => c.id).sort(),
      [...],
    );
  });
```

That test caught every prior addition — it's an `assert.deepEqual` on the
full sorted id list, so a new check that isn't added to the array (or an
old one accidentally removed) fails the suite immediately.

`docs/specs/distribution.md`'s Data Dictionary #7 row had no equivalent
guard. Before this item, it read:

> `node-and-git` (Node/git present), `shell-integration-sourced` (helper
> wired into every shell profile the caller has), `config-not-stale`
> (local config has every current default setting)

Three checks named — but by the time this item started, `DOCTOR_CHECKS`
already had five (`main-checkout-hook-wired` and `tool-registry-configured`
had already landed, in earlier items, without anyone updating this row).
The spec's `updated: 2026-07-23` frontmatter and `coverage: full` claim gave
no signal that the check list underneath it had already drifted two checks
out of date. Nothing failed, nothing warned — a reader trusting the spec
would have gotten a materially wrong picture of what `fgos doctor` actually
reports.

## Why the code stayed honest while the doc didn't

The code's exact-match test and the doc have no structural link — one is a
JS array a real test asserts against on every `npm test` run, the other is
markdown prose nothing executes or checks. Adding a check to the array
without also touching the spec doesn't fail anything; the two artifacts
can only stay in sync through someone remembering to update both, every
time, forever. That's a discipline gap, not a tooling gap that's been
solved here — this item just corrected the drift it found and moved on,
it did not add anything that would catch the *next* drift.

## The general shape

A spec doc describing a fixed, enumerable set (check ids, verb names,
config keys) that has a real test for the enumerable set in code but no
equivalent for the doc will drift the moment someone updates the code
without also remembering the doc — and nothing will tell them. Before
trusting a spec's claim about an exact set, check whether that set has a
name a real test somewhere actually asserts against; if the answer is
"only in code," treat the doc's version as a snapshot that could already
be stale, not a live source of truth.

## The gap this item left open got a real guard, later

`tsk-4y2` closed the specific instance of this gap named above: no test
existed comparing `registerCheck`/`registerFit`'s real registered ids
(`src/setup/registrations.mjs`) against `docs/specs/distribution.md`'s
Data Dictionary #7/#7b rows — confirmed by grepping `test/` for
`distribution.md`, which returned nothing. Without that guard, the same
drift this document describes was already primed to repeat: `tsk-2jc`
(which had just locked the #7/#7b contract) was about to close, and the
next check/fix added the way `tsk-4xg`'s `claude-plugin-marketplace` was
(new registry entry, spec left untouched) would drift the doc again with
nothing to catch it.

The fix landed in `test/setup/registrations.test.mjs`, alongside the
registry it checks against — two tests, one per direction: "Data
Dictionary #7 names exactly the registered doctor checks" and the
equivalent for #7b's registered fixes. Proven fail-first, not just
asserted: reproducing the exact old drift (removing
`claude-plugin-marketplace` from #7's list) turned the test red and named
the missing entry specifically; adding an unregistered id
(`a-check-that-was-deleted`) turned it red in the opposite direction.
Restoring the spec brought the full suite back to green (2576 tests, 0
failures at the time).

This is the same kind of two-way exact-match guard `checks.test.mjs`
already gave the code side (see above) — now extended to cover the doc
side too, for this one spec row. The general shape described above still
holds for any other enumerable spec claim that has no equivalent test;
this item only closes it for the Data Dictionary #7/#7b row specifically,
not as a general mechanism for every future enumerable claim a spec might
make.

## The guard caught its own predicted repeat (`tsk-2m5`)

`tsk-4y2`'s own writeup above named a concrete risk: a future item adding
a new doctor check the way `claude-plugin-marketplace` had, without also
touching the spec, would drift the doc again with nothing to catch it —
unless the new guard actually worked. `tsk-2m5` (adding a
`herdr-orchestrator-configured` doctor check) is a real, later instance
of exactly that scenario, and confirms the guard held:

> "adding `herdr-orchestrator-configured` also needs
> `docs/specs/distribution.md`'s Data Dictionary row #7 updated, or
> `registrations.test.mjs`'s enumeration test fails."
> — real commit message, `f14f1175`, branch `fgw/tsk-2m5`

This was caught at `fgos-coding-validating` — before the item's own plan.md
grounding was accepted — not discovered later as a live test failure
after implementation. The two-way guard did exactly the job `tsk-4y2`
built it for: a new check registered without its matching spec row
update turned red immediately, the same way `checks.test.mjs`'s own
code-side exact-match test already had for years.

## Related

- `docs/history/stage-status-driving-coordination/plan.md` (`tsk-2m5`'s
  own plan, grounding correction) — the real instance where this guard
  fired.
