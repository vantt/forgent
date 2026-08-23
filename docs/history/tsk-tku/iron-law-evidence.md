# Iron Law evidence: tsk-tku

`classifyIronLaw` against the real committed diff (`trunk...branch`)
returned `required: true`, matched modules:

```
bin/fgos.mjs
src/runner/claim-port.mjs
src/runner/dispatch.mjs
src/runner/loop.mjs
src/runner/worktree.mjs
src/state/status-fsm.mjs
src/state/store.mjs
src/state/workflow-stage-graphs.mjs
```

(The full list is cumulative against `main` for this whole stacked
`fgw/tsk-2mt` feature tree, same as `docs/history/tsk-403/
iron-law-evidence.md` and `docs/history/tsk-qod/iron-law-evidence.md`
already noted for their own turns — most of these files belong to sibling
items (`tsk-403`, `tsk-qod`) already covered by their own evidence files.
This item's own actual diff touches exactly one of them,
`src/state/workflow-stage-graphs.mjs` — the `skillMap.discovery` repoint —
plus two new skill files and prose/test files outside the matched-module
list.)

## Test command

```
npm test
```
(`node --test 'test/**/*.test.mjs'`)

## Failing-before / passing-after

Two real, pre-existing assertions hardcoded the old skill name and would
have silently kept passing against a stale expectation had they not been
updated alongside the registry repoint — captured live by temporarily
reverting each to its pre-change value and re-running just that file,
then restoring the real fix and re-running to confirm green again.

**`test/state/workflow-stage-graphs.test.mjs`** (the registry itself):

```
test at test/state/workflow-stage-graphs.test.mjs:82:1
✖ DOMAINS.coding.skillMap maps every stage, including executing, to its skill
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'fgos-coding-discovering'
  - 'fgos-researching'
      at test/state/workflow-stage-graphs.test.mjs:87:10

test at test/state/workflow-stage-graphs.test.mjs:164:1
✖ skillForStage resolves each of coding's mapped stages to its skill name
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'fgos-coding-discovering'
  - 'fgos-researching'
      at test/state/workflow-stage-graphs.test.mjs:168:10
```

After restoring the real fix (`'fgos-coding-discovering'` in both
places): `test/state/workflow-stage-graphs.test.mjs` — **44 tests, 44
pass, 0 fail**.

**`test/runner/dispatch.test.mjs`** (proves the fix is not just a static
config value — `buildPrompt`'s `skillForStage(domainObj, stage)` call,
`src/runner/dispatch.mjs:149`, actually resolves the new skill path for
real worker dispatch):

```
test at test/runner/dispatch.test.mjs:189:1
✖ buildPrompt with stage:"discovery" points the Agent skill section at fgos-coding-discovering's SKILL.md and selects the discovery template
  AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:
    assert.ok(prompt.includes('.claude/skills/fgos-researching/SKILL.md'))
      at test/runner/dispatch.test.mjs:192:10

test at test/runner/dispatch.test.mjs:1530:1
✖ spawnWorker with opts.stage:"discovery" logs the discovery templateName and sends the fgos-coding-discovering-pointed prompt — never a diverging pick between the two call sites
  AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:
    assert.ok(payload.args[0].includes('.claude/skills/fgos-researching/SKILL.md'))
      at test/runner/dispatch.test.mjs:1541:10
```

After restoring the real fix: `test/runner/dispatch.test.mjs` — **179
tests, 179 pass, 0 fail**.

Full suite at the final, returned state: **2953 tests, 2948 pass, 0 fail,
5 skipped** (same 5 pre-existing skips `tsk-qod`'s own evidence file
noted — bee-checkout skips, expected in a worktree).

## One real finding: verify's literal string appeared 3 times, not just at the section heading

`fgos-validating`'s reality gate on this item's `plan.md` (recorded in
`docs/history/discover-stage-graph-and-skill-layering/plan.md`'s own
Phase 3 note) caught this before implementation started, not after: the
item's own `verify` clause `! grep -q "Discovery and exploring stages"
.claude/skills/fgos-coding-driving/SKILL.md` checks for the literal
string anywhere in the file. It appeared 3 times in each mirror (a Hard
rule's "one documented exception" callout, the section itself, and a Red
flag bullet) — removing only the section heading would have left verify
failing. All 3 occurrences were removed in both `.claude/` and
`.agents/` mirrors; confirmed absent via `grep` before committing.

## Not applicable here

No package install, no scope/architecture redesign, no blocking issue
found in the touched path beyond the two test updates and the plan's own
already-anticipated 3-occurrence removal above.
