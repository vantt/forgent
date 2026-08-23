# tsk-2as — Iron Law evidence

`classifyIronLaw` result (`src/evolve/iron-law.mjs`, computed against this
item's real committed `changedFiles(root, item)`):

```json
{"required":true,"matchedFlags":["auth"],"matchedModules":["src/evolve/iron-law.mjs","src/intake/classify.mjs","src/intake/risk-keywords.mjs"]}
```

Unlike `tsk-69g`'s evidence doc, `matchedModules` here is a **genuine**
trip, not a keyword artifact: this item edits `src/evolve/iron-law.mjs`,
`src/intake/classify.mjs`, and `src/intake/risk-keywords.mjs` directly —
all three are explicit `MODULE_RULES` entries (self-modifying-capable:
the exact risk-classification logic that governs Iron Law/tier gating
itself). `matchedFlags: ["auth"]` is the same pre-existing substring
artifact this item exists to fix (this item's own `description` field
still contains "authoring") — irrelevant to the verdict here since
`matchedModules` alone already makes `required: true` legitimately.

## Failing-test-first proof

Item's own `verify` command (recorded on `tsk-2as`, survived three rounds
of an independent second-pass judge at `fgos-coding-exploring`):

```
node --test test/evolve/iron-law.test.mjs && node --input-type=module -e "
import assert from 'node:assert/strict';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { classify } from './src/intake/classify.mjs';
const fp = classifyIronLaw({ filesChanged: [], description: 'does NOT duplicate fgos-coding-exploring authoring logic' });
assert.equal(fp.matchedFlags.includes('auth'), false);
const fpClassify = classify('does NOT duplicate fgos-coding-exploring authoring logic');
assert.equal(fpClassify.tier, 'standard');
const tp = classifyIronLaw({ filesChanged: [], description: 'fix the auth flow' });
assert.equal(tp.matchedFlags.includes('auth'), true);
const tpClassify = classify('fix the auth flow');
assert.equal(tpClassify.tier, 'heavy');
console.log('OK');
"
```

**Before** (real transcript, captured earlier this same session, before
`countMatches`/`classifyIronLaw` were changed — the inline check run
standalone against the then-unmodified `src/evolve/iron-law.mjs`):

```
$ node --input-type=module -e "... assert.equal(fp.matchedFlags.includes('auth'), false); ..."
node:internal/modules/run_main:107
    triggerUncaughtException(
    ^
AssertionError [ERR_ASSERTION]: classifyIronLaw must not match auth inside authoring
true !== false
    at file:///home/.../[eval1]:6:8
    ...
  generatedMessage: false,
  code: 'ERR_ASSERTION',
  actual: true,
  expected: false,
  operator: 'strictEqual',
  diff: 'simple'
}
Node.js v24.18.0
```
(genuinely red — `classifyIronLaw` matched `'auth'` inside `'authoring'`,
the exact bug this item fixes)

**After** (real transcript, captured after implementing the fix in
`risk-keywords.mjs`'s new `matchesKeyword` export and wiring it into both
`classify.mjs`'s `countMatches` and `iron-law.mjs`'s inline loop):

```
$ node --test test/evolve/iron-law.test.mjs && node --input-type=module -e "..."
ℹ tests 25
ℹ pass 25
ℹ fail 0
OK
$ echo "item verify exit: $?"
item verify exit: 0
```
(all 25 tests green — the original 19, unmodified, plus 6 new cases added
this item: 2 false-positive-avoided + 2 standalone-still-matches for both
`classifyIronLaw`/`classify`, plus 1 Vietnamese true-positive regression
and 1 Vietnamese boundary-avoided case)

## Scope

Covers this item's real diff: `src/evolve/iron-law.mjs`,
`src/intake/classify.mjs`, `src/intake/risk-keywords.mjs` (new
`matchesKeyword` export, D1), and `test/evolve/iron-law.test.mjs`
(extended, not replaced — every pre-existing assertion still passes
unchanged, confirming no regression to the 34-keyword true-positive
coverage, including the 7 Vietnamese-diacritic entries).
