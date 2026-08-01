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
