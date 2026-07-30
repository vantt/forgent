# tsk-52g — Iron Law evidence

Gate result (`classifyIronLaw`, run against the branch diff):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/intake/classify.mjs","src/runner/loop.mjs","src/state/store.mjs"]}
```

## This time the matched modules genuinely belong to this item's own branch

Unlike `tsk-52g-2`'s evidence file (which flagged the same three modules as
inherited from a grandparent branch not yet on trunk), `tsk-52g` is the
parent item whose branch (`fgw/tsk-52g`) is what actually lands on `main`.
`tsk-52g-1` — the child that changed `src/intake/classify.mjs`,
`src/runner/loop.mjs`, and `src/state/store.mjs` — merged directly into
this branch (commit `b1aba62`), so those three modules are correctly
part of what this item's own merge to trunk will carry. This is the real
Iron Law case, not an artifact of diffing against an unmerged ancestor.

The substantive failing-test-first proof for these three modules already
exists and is not repeated here: `docs/history/tsk-52g-1/iron-law-evidence.md`
(committed at `47ac65b`, present in this branch's own history) — five tests
failing when the store/`deriveTitle` bound was reverted, all passing restored,
plus the pre-existing `S11` regression test that came failing-first on its
own.

## What this item's own additional commits changed

Beyond the two children's own work (already evidenced separately —
`docs/history/tsk-52g-1/iron-law-evidence.md`,
`docs/history/tsk-52g-2/iron-law-evidence.md`), this parent item's own
commit (`7996341`) fixed one thing discovered while running this item's own
`verify`:

- `.claude/skills/fgos-submit-assist/SKILL.md` (edited by `tsk-52g-2`) has a
  required byte-identical mirror at
  `.agents/skills/fgos-submit-assist/SKILL.md`
  (`test/skills/fgos-mirror.test.mjs`), which `tsk-52g-2` never touched. This
  item's own `verify` run caught the drift:

  ```
  ✖ every mirrored file pair is byte-identical
    AssertionError [ERR_ASSERTION]: fgos-submit-assist/SKILL.md differs
    between .claude/skills and .agents/skills
  ```

  Fixed by copying the `.claude` file over the stale `.agents` copy. Neither
  path matches any `MODULE_RULES` entry in `src/evolve/iron-law.mjs` — this
  fix is not itself part of what tripped the gate.

## Full suite, restored implementation

```
node --test test/state/store.test.mjs test/intake/classify.test.mjs test/runner/loop.test.mjs test/skills/fgos-mirror.test.mjs
ℹ pass 115
ℹ fail 0
```

Item's own `verify` (`npm test -- --grep 'title'`): 1829 pass, 0 fail.
