# RESEARCH: port count-consumption fix + close the __proto__ gap in both checkers

## Round 1 (tsk-1pf, stage discovery)

**Goal:** confirm both bugs from tsk-6at's own RESEARCH.md are still real
against current `main`, and resolve concrete fix approaches.

**Checked:** `scripts/check-decision-codes.mjs` (fresh full read),
`scripts/check-decision-codes.baseline.json` (real committed data),
`scripts/check-decision-citation-drift.mjs` (fresh full read, post
tsk-6at/tsk-12v), `test/scripts/check-decision-codes.test.mjs`, direct
`__proto__` repro against both scripts.

**Bug 1 confirmed unchanged:** `check-decision-codes.mjs`'s
`findNewFindings`/`baselineFromFindings` (`:43-57`) still key on bare
`f.text` via `.includes()` membership, no count. Real committed baseline
(`scripts/check-decision-codes.baseline.json`) still has 0 duplicate-text
entries today — dormant, not live. Blast radius unchanged: called only
by this file's own `runCli` and imported only by
`test/scripts/check-decision-codes.test.mjs`.

**Note on this script's key shape (simpler than citation-drift.mjs's
own):** a finding here has no `kind`/`id` split the way citation-drift's
does — `text` (the trimmed source line) already fully determines `code`
(extracted from the SAME line), so two findings sharing identical `text`
necessarily share identical `code` too. The count-consumption port here
keys on `f.text` directly, no compound key/`findingKey` helper needed —
simpler than tsk-6at's own fix, not a lesser version of it.

**Bug 2 confirmed, and BROADER than originally scoped — a real find this
round, not assumed from the original report:** the `__proto__` collision
is not only a write-side (`baselineFromFindings`) issue. Reproduced a
SEPARATE read-side manifestation: `findNewFindings`'s own `baseline[f.file]`
lookup on a bare `{}` (e.g. `loadBaseline`'s own empty-fallback return
when no baseline file exists yet) returns `Object.prototype` itself
(truthy, not `undefined`) for `f.file === "__proto__"`, then
`.includes()` on it throws `TypeError: known.includes is not a function`
— confirmed directly. `JSON.parse` itself is NOT vulnerable (verified:
it defines `__proto__` as an ordinary own property, never triggers the
accessor) — the risk is confined to bare object-literal `{}` values
constructed in-process, never a loaded-from-disk baseline.

**Every plain-object-keyed-by-filename spot found (grep, both scripts):**
- `check-decision-codes.mjs:51` `baselineFromFindings`'s `const baseline = {}`
- `check-decision-codes.mjs:89` `loadBaseline`'s `return {}` (empty fallback)
- `check-decision-citation-drift.mjs:182` `findNewFindings`'s own
  `const remaining = {}` — **this is tsk-6at's own just-landed code**,
  not something this item introduces; the same class of gap survived
  into the fix that resolved bug 1's analogous issue there, simply
  because `__proto__` wasn't in scope for that item.
- `check-decision-citation-drift.mjs:204` `baselineFromFindings`'s
  `const baseline = {}`
- `check-decision-citation-drift.mjs:388` `loadBaseline`'s `return {}`

**Fix approach, confirmed minimal:** `Object.create(null)` in place of
every `{}` above. Verified directly: a null-prototype object serializes
through `JSON.stringify` identically to a plain object (confirmed:
`Object.create(null)` with a `"__proto__"` key round-trips correctly),
and every existing operation on these objects (`.push()` on array
values, `Object.keys()`, `for...of Object.entries()`) works unchanged —
zero behavioral difference for any legitimate filename, only removes the
special meaning of the literal string `"__proto__"`. No `Map` migration
needed (would be a larger diff for the same protection).

**Verify strategy:**
- Bug 1: a new regression test in `test/scripts/check-decision-codes.test.mjs`
  mirroring tsk-6at's own — 2 baselined identical-text findings + a
  genuine 3rd occurrence must report 1 new, not 0.
- Bug 2: a direct test asserting `baselineFromFindings`/`findNewFindings`
  no longer throw when a finding's `file` is literally `"__proto__"`, in
  both scripts.
