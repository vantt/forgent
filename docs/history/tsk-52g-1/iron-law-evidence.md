# tsk-52g-1 — Iron Law evidence

Gate result (`classifyIronLaw`, run against the committed diff):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/intake/classify.mjs","src/runner/loop.mjs","src/state/store.mjs"]}
```

Test command (the item's own `verify`, and the narrower run used for the
transcripts below):

```
npm test -- --grep 'title'
node --test test/state/store.test.mjs test/intake/classify.test.mjs test/runner/loop.test.mjs
```

## Honest provenance of this proof

Read this before acknowledging the gate.

The tests below were written **after** the implementation, not before it. The
Iron Law check this skill runs before returning reported `required: false` at
the time, because `changedFiles` reads committed work and the implementation
was not yet committed — so no evidence was written during the run. The gate
then correctly refused the merge, and this file was produced afterwards.

To turn that into real evidence rather than a claim, the three door files were
reverted to the parent commit (`e853918`) in the item's own worktree, with
`work.mjs` — which only adds the constant and helper — left in place so the
suite could still load. That isolates exactly the change under test: the two
store doors and `deriveTitle` calling the bound. The transcripts below are the
verbatim output of that run and of the restored run. Nothing here is
reconstructed or paraphrased.

What this proves: these tests genuinely fail without the change and pass with
it. What it does not prove: that they were authored first.

## Failing before — doors reverted to e853918

```
✖ deriveTitle bounds a first sentence that runs past the title bound (3.184611ms)
✖ deriveTitle cuts a single unbroken token at a hard edge (0.389417ms)
✖ S11: a discovery block title with embedded newlines cannot forge extra log lines (sanitized in the idempotent-skip log), and a very long title is clamped in the log and bounded in the stored item (73.619076ms)
✖ addWork truncates an over-length title instead of rejecting the write (3.57133ms)
✖ editWork truncates a title patch, and the appended event carries the truncated value (0.767496ms)
ℹ tests 112
ℹ pass 107
ℹ fail 5
```

The assertion that fails at the store door, verbatim:

```
✖ addWork truncates an over-length title instead of rejecting the write (3.57133ms)
  AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:

    assert.ok(stored.title.length <= MAX_TITLE_LENGTH)
```

Two tests stay green through the revert, and are meant to:

```
✔ addWork leaves a title already within the bound byte-identical (0.349264ms)
✔ editWork does not reshape a stored title when the patch does not carry one (0.470594ms)
```

They assert what must **not** change — a title already inside the bound, and a
patch that carries no title. A bound that fired unconditionally would have
turned these red.

## Passing after — implementation restored

```
ℹ tests 112
ℹ pass 112
ℹ fail 0
```

Full suite, through the item's own `verify` command:

```
ℹ pass 1829
ℹ fail 0
ℹ skipped 5
```

Baseline before this item's change was `1829 - 7 = 1822` passing, matching the
seven tests this item adds.

## The one test that did come failing-first

`S11` in `test/runner/loop.test.mjs` was already in the suite and turned red
the moment the store started bounding titles:

```
AssertionError [ERR_ASSERTION]: the second, identical block is recognized as already-captured

2 !== 1
```

The runner keyed discovery-capture idempotency on the raw block title, which
no longer matches the bounded stored title, so every re-run re-captured a
long-titled block. That is a genuine regression this item introduced, caught
by an existing test before the fix, and fixed in `src/runner/loop.mjs` by
keying on the same bounded value the store holds.

## Modules the gate matched

- `src/state/store.mjs` — the bound applied at `addWork`'s and `editWork`'s
  existing normalize steps, before `validateWork`.
- `src/intake/classify.mjs` — `deriveTitle` bounds both exits through the
  shared helper.
- `src/runner/loop.mjs` — discovery-capture idempotency keyed on the bounded
  title.
