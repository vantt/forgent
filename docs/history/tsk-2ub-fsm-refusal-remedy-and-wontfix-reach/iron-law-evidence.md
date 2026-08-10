# Iron Law evidence — tsk-2ub

`classifyIronLaw` on this item's final diff returns:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/state/status-fsm.mjs"]
}
```

`src/state/status-fsm.mjs` is a real files-changed match, not a
description-keyword false positive.

## Failing-test-first proof

Two things changed: the refusal message now names a remedy, and
`awaiting-human -> wontfix` becomes legal. Two tests target the second
(the message change is proven separately below, since it has no dedicated
pre-existing test slot):

- `wontfix IS reachable from awaiting-human (tsk-2ub): ...`
- `wontfix is not reachable from awaiting-approval, delivered,
  retrospective, cleanup, or done ... (tsk-2ub)` (renamed from the
  pre-fix test that previously also asserted `awaiting-human` was
  refused — this rename IS the proof that the old assertion has been
  deliberately narrowed, not silently dropped)

### RED — run against the pre-fix code

Pre-fix `src/state/status-fsm.mjs` restored from `git show
ce0f7d6^:<path>` (the parent of this item's own implementation commit),
with the new/renamed tests from the post-fix `test/state/fsm.test.mjs`
layered on top:

```
$ node --test --test-name-pattern="tsk-2ub" test/state/fsm.test.mjs

✔ wontfix is not reachable from awaiting-approval, delivered, retrospective, cleanup, or done -- ... (tsk-2ub)
✖ wontfix IS reachable from awaiting-human (tsk-2ub): ...
  AssertionError: missing answer must still be refused, same as every other awaiting-human exit
  actual: FsmError: transitionWork: no transition from "awaiting-human" to "wontfix" for work "w1".

ℹ tests 2
ℹ pass 1
ℹ fail 1
```

(The first test passes trivially pre-fix too — it's a subset of an
already-true invariant, not new behavior; only the second is the real
failing-test-first proof for the new edge.)

Message-remedy fix, checked directly against the same pre-fix file:

```
$ node -e "
import { transitionWork } from './src/state/status-fsm.mjs';
try { transitionWork({ work: { id: 'w1', status: 'todo' }, to: 'done' }); }
catch (e) { console.log(e.message); }
"
transitionWork: no transition from "todo" to "done" for work "w1".
```

No remedy text — confirms the pre-fix message names only the illegal edge.

### GREEN — run against the fixed code

Restored `src/state/status-fsm.mjs` to its post-fix state (`git diff
--stat` against the working tree was empty first, confirming
byte-identical recovery):

```
$ node --test --test-name-pattern="tsk-2ub" test/state/fsm.test.mjs

✔ wontfix is not reachable from awaiting-approval, delivered, retrospective, cleanup, or done -- ... (tsk-2ub)
✔ wontfix IS reachable from awaiting-human (tsk-2ub): ...

ℹ tests 2
ℹ pass 2
ℹ fail 0
```

```
$ node -e "... same probe ..."
transitionWork: no transition from "todo" to "done" for work "w1". -- valid targets from "todo" are: doing, blocked, awaiting-human, wontfix
```

Remedy text now present, listing the real valid targets from `TRANSITIONS`.

### Full suite, post-fix

```
$ node --test test/state/fsm.test.mjs
ℹ tests 47
ℹ pass 47
ℹ fail 0

$ npm test
ℹ tests 2744
ℹ pass 2739
ℹ fail 0
ℹ skipped 5
```

## Verification source

- `src/evolve/iron-law.mjs`'s `classifyIronLaw`'s `MODULE_RULES` list —
  confirms `src/state/` (this file specifically) triggers `required: true`
  on a real files-changed match.
- The RED/GREEN transcripts above — both real command runs against real
  file contents swapped in/out on disk (`git show ce0f7d6^:<path>` to
  `/tmp`, then restored from the working tree's own already-committed
  post-fix state), not paraphrased or fabricated.
- `docs/history/tsk-2ub-fsm-refusal-remedy-and-wontfix-reach/CONTEXT.md`
  D0-D2 and `plan.md`'s risk map / Gate — the decisions and human-approved
  design choice this evidence satisfies.
