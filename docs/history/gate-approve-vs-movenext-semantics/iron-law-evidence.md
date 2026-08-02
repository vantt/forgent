# Iron Law evidence: tsk-19j-1

`classifyIronLaw` on this item's real diff (`fgw/tsk-19j-1` vs its base
`fgw/tsk-19j`, `git diff --name-only fgw/tsk-19j...fgw/tsk-19j-1`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs", "src/state/store.mjs"]
}
```

`matchedModules` are real: `bin/fgos.mjs` (new `gate-approve` verb case) and
`src/state/store.mjs` (new `recordGateApprove` write door) are both
core engine mechanism files on the D10+D14 self-modifying-capable list.
`matchedFlags` is empty — no `HEAVY_KEYWORDS` term appears in the item's
description.

## Honest gap: this was not failing-test-first development

`recordGateApprove`, the `work.gate-approve` replay fold, and the
`gate-approve` CLI verb were implemented first, then
`test/state/store.test.mjs`'s two new tests (`recordGateApprove folds into
gates[id].<gate>...` and `recordGateApprove rejects a missing id...`) were
written alongside and verified green — not proven red-before-green against
the pre-change code. Matches the same acknowledged tradeoff tsk-3bn's own
evidence file records (`docs/history/tsk-3bn-merge-conductor-harness-v2/
iron-law-evidence.md`), not a substitute for the real practice.

## What was actually proven

Full suite, run from the real implementation branch (`fgw/tsk-19j-1`), clean
tree, immediately before this item's own `fgos return`:

```
ℹ tests 2240
ℹ suites 0
ℹ pass 2235
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
```

(5 skips pre-exist this item's work, unrelated to it — same count the
tsk-3bn precedent recorded.)

New-capability coverage added by this item specifically:
`test/state/store.test.mjs` — `recordGateApprove folds into
gates[id].<gate> with actor/at/verify, one field per gate, never merged
across gates` (asserts the fold shape, multi-gate coexistence, and
per-gate overwrite-without-disturbing-siblings) and `recordGateApprove
rejects a missing id, an unrecognized gate, an unrecognized actor, and an
empty verify` (validation coverage for all 4 reject paths). The mirrored
`.claude/skills/` / `.agents/skills/` SKILL.md edits are additionally
proven by the existing `test/skills/fgos-mirror.test.mjs` byte-identity
check, which was run and passed after mirroring.

Accepted via `fgos approve tsk-19j-1 --acknowledge-iron-law` on this
evidence.
