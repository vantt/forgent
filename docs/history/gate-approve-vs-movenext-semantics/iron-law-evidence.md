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

# Iron Law evidence: tsk-19j (root, merge into main)

`classifyIronLaw` on the root's full cumulative diff (`fgw/tsk-19j` vs
`main`, `git diff --name-only main...fgw/tsk-19j` — 24 files, the union of
tsk-19j-1/2/3/4's own diffs plus the root's own `plan.md`/this evidence
file):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs", "src/state/store.mjs"]
}
```

Same 2 matched modules as tsk-19j-1's own evidence above — tsk-19j-2/3/4
each independently classified `required: false` on their own diffs (no
match against `MODULE_RULES`), verified directly before each of their own
`fgos approve` calls. Nothing beyond `bin/fgos.mjs`/`src/state/store.mjs`
is newly self-modifying-capable across the whole feature.

## Honest gap

Same tradeoff as tsk-19j-1's own evidence above, for the same reason
(`recordGateApprove`/the `gate-approve` verb) — not proven red-before-green.
Every other track (`tsk-19j-2`'s decompose skip-and-advance + real verify,
`tsk-19j-3`'s `fgos-coding-driving` + `frontier.mjs` generalization,
`tsk-19j-4`'s cook/pick retrofit + the 3 driver rules discovered while
building it) was also implemented-then-tested-alongside, not TDD, and each
one's own commit/decision log already says so plainly.

## What was actually proven

Full suite, run from the root's own branch (`fgw/tsk-19j`, tip
`61e534a` — the last of the 4 children's own merge commits already landed),
clean tree (`.fgos/` exclusion per `isWorkingTreeClean`'s own contract),
immediately before this root's own `fgos approve --acknowledge-iron-law`:

```
ℹ tests 2250
ℹ suites 0
ℹ pass 2245
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
```

(Same 5 pre-existing skips every other item in this feature recorded —
unrelated to this work.)

Per-child coverage (each independently returned with its own passing
verify run before its own `fgos return`, already detailed in each child's
own commit): `tsk-19j-1` — `test/state/store.test.mjs` (2 new
`recordGateApprove` tests) + `test/state/replay.test.mjs`/
`test/state/gate-bypass.test.mjs` regression. `tsk-19j-2` —
`test/intake/discovery.test.mjs`/`test/intake/plan.test.mjs` (5 new
tests: skip-and-advance for `mode: tiny`/`small`, no-skip for `standard`/
`high-risk`, real-verify preference on both discovery's and decompose's
skip/real paths). `tsk-19j-3` — `test/state/frontier.test.mjs` (3 new
`step` param tests, including the domain-never-maps-this-step edge case
found while writing it). `tsk-19j-4` — prose-only (`fgos-coding-driving`'s
3 new hard rules, `cook`/`pick` retrofit); its own declared verify
(`frontier.test.mjs`/`workflow-stage-graphs.test.mjs`) re-confirms no
regression in the modules the driver actually reads, matching this same
item's own honest note that a driver SKILL.md has no unit-test surface of
its own.

Accepted via `fgos approve tsk-19j --acknowledge-iron-law` on this
evidence.
