# Iron Law evidence — tsk-3ch

`classifyIronLaw` on this item's committed diff returns `required: true`,
`matchedModules: []`, `matchedFlags: ["migration", "audit"]`:

```json
{
  "required": true,
  "matchedFlags": ["migration", "audit"],
  "matchedModules": []
}
```

## Where the flags actually came from

`matchedModules: []` confirms this is a pure description-text keyword
match (`src/evolve/iron-law.mjs` calls `matchesKeyword` against
`HEAVY_KEYWORDS`, `src/intake/risk-keywords.mjs`), independent of
`filesChanged` — the same shape of hit `docs/history/context-md-
enforcement-scope/iron-law-evidence.md` (tsk-47e) already documented for
its own `"audit"` match. `HEAVY_KEYWORDS` literally includes the strings
`'migration'` and `'audit'` (`src/intake/risk-keywords.mjs:20,25`).
tsk-3ch's own stored `description` contains both, verbatim, as part of
quoting the global rule this item enforces: `"...code comments, migration
names, or commit messages..."` and a citation of
`review-audit-self-decision.md`'s Stable Code Artifacts section — neither
mention reflects this item touching a real database migration or a
security audit; the item is a `test/**/*.test.mjs` naming-convention
linter.

## Unlike tsk-47e's precedent, this item's diff DOES touch real code

`context-md-enforcement-scope/iron-law-evidence.md` (tsk-47e) could
correctly say "there is no code to write a failing test against" because
that item's whole deliverable was a decision doc. tsk-3ch's deliverable is
a real script (`scripts/check-decision-codes.mjs`) plus its own test file
(`test/scripts/check-decision-codes.test.mjs`) — so, unlike that
precedent, this item DOES have real failing-before/passing-after evidence
to attach, from two genuine bugs this session's own test-writing pass
caught and fixed (not fabricated after the fact — both transcripts below
are the real tool output from writing and debugging this item's own test
suite):

### 1. A single-digit fixture ("str9") that doesn't match the real 2-3-digit pattern

Before (real `node --test test/scripts/check-decision-codes.test.mjs`
output):

```
✖ the matched line text is trimmed for ratchet identity (0.1822ms)
...
✖ failing tests:

test at test/scripts/check-decision-codes.test.mjs:104:1
✖ the matched line text is trimmed for ratchet identity (0.1822ms)
  TypeError: Cannot read properties of undefined (reading 'text')
      at TestContext.<anonymous> (.../check-decision-codes.test.mjs:112:17)
...
ℹ tests 18
ℹ pass 17
ℹ fail 1
```

Root cause: the fixture used `str9` (one digit), but the detection regex
requires `str[0-9]{2,3}` (2-3 digits) — the exact same pattern
`tsk-3wr`'s own already-proven verify command uses, reused verbatim per
`plan.md`'s Approach. The test fixture was wrong, not the detection
regex.

After (fixture corrected to `str90`):

```
✔ the matched line text is trimmed for ratchet identity (0.176381ms)
...
ℹ tests 18
ℹ pass 18
ℹ fail 0
```

### 2. This item's own new test file self-matched its own check

Before fix, `test/scripts/check-decision-codes.test.mjs` (this item's own
new file) contained a test named `'a tsk-xxx item id is flagged'` —
`tsk-xxx` itself matches `tsk-[0-9a-z]{3}` (`x`,`x`,`x` are all valid
`[0-9a-z]` characters), so the check's own real, live run against the
repo flagged its own newly-added test file:

```
$ node scripts/check-decision-codes.mjs --write-baseline
check-decision-codes: wrote baseline with 255 known violation(s) across 51 file(s).

$ grep -nP "^\s*(test|it|describe)\(\s*['\"].*\b(str[0-9]{2,3}|D[0-9]{1,2}\b|RUL[0-9]{2,3}|STR[0-9]{2,3}|tsk-[0-9a-z]{3})\b" test/scripts/check-decision-codes.test.mjs
64:test('a tsk-xxx item id is flagged', () => {
```

This would have baked a real, meta-ironic violation into the baseline for
the very file introducing the check. Fixed by renaming the test to `'a
work-item id embedded in a test name is flagged'` (no literal
decision-code-shaped substring in the description). After:

```
$ grep -nP "..." test/scripts/check-decision-codes.test.mjs
(no output, exit 1)

$ node scripts/check-decision-codes.mjs --write-baseline
check-decision-codes: wrote baseline with 254 known violation(s) across 50 file(s).

$ node scripts/check-decision-codes.mjs
check-decision-codes: no new findings (254 baselined).
```

254/50 matches this item's own `CONTEXT.md` scout evidence (re-verified
reproducibly at implementation time), and the baseline-write/default-check
round trip confirms self-consistency (`plan.md`'s risk map row on this
exact point).

## Full verify, real output

```
$ node --test test/scripts/check-decision-codes.test.mjs && node scripts/check-decision-codes.mjs && npm test
...
ℹ tests 18
ℹ pass 18
ℹ fail 0
check-decision-codes: no new findings (254 baselined).
...
ℹ tests 2845
ℹ pass 2840
ℹ fail 0
ℹ skipped 5
```

(5 skipped are pre-existing and unrelated to this change — same count as
before this diff.)

## Verification source

- `src/evolve/iron-law.mjs` + `src/intake/risk-keywords.mjs` read
  directly — confirms `matchedFlags` is a pure description-text scan
  against `HEAVY_KEYWORDS`, independent of `filesChanged`.
- `docs/history/context-md-enforcement-scope/iron-law-evidence.md`
  (tsk-47e) — precedent for a description-keyword false-positive trigger
  resolved by documenting its provenance rather than fabricating evidence.
- Every transcript above is real tool output from this session's own
  implementation and debugging pass, not reconstructed after the fact.
