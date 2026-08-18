# Iron Law evidence: tsk-xyr

`classifyIronLaw` on this item's real diff (`fgw/tsk-xyr` vs its target
`fgw/tsk-51m`, computed with `changedFiles(repoRoot, item, {trunk:
'fgw/tsk-51m'})` against the real branch):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/main-checkout-lock.mjs",
    "src/runner/merge.mjs"
  ]
}
```

`matchedFlags` is empty — nothing in this item's title or description trips
a keyword. The gate fires purely on the module rule: `src/evolve/
iron-law.mjs`'s `MODULE_RULES` carries `{prefix: 'src/runner/'}` and
`{equals: 'bin/fgos.mjs'}`, and `:93` decides `required = matchedModules
.length > 0 || matchedFlags.length > 0`, so touching a gated module is by
itself enough. `plan.md`'s own mode declaration predicted exactly this
before any code was written — this item is a self-declared **hard-gate
data-loss** item (it changes which lock protects the `git branch -f` ref
move that `tsk-46a`/`tsk-2cd` already lost real work to), not an ordinary
diff that happens to graze a gated path.

Full real diff (own commits only, `fgw/tsk-51m...HEAD`):

```
bin/fgos.mjs
docs/history/tsk-xyr/plan.md
src/runner/main-checkout-lock.mjs
src/runner/merge.mjs
test/cli/fgos-merge.test.mjs
test/runner/main-checkout-lock.test.mjs
test/runner/merge.test.mjs
```

## Honest gap: this was not failing-test-first development

Following the precedent this item's own plan pointed to
(`docs/history/tsk-3bn-merge-conductor-harness-v2/iron-law-evidence.md`),
disclosed plainly rather than dressed up: the lock primitives, the
`withMergeTargetSlot`/`targetSlot` wiring, and the picker-skip logic were
each implemented, THEN covered with tests in the same pass and verified
green — not proven red-before-green. This file does not claim otherwise.
Acknowledgment is an informed tradeoff for the person reviewing this, not a
substitute for TDD discipline.

A second, narrower honest gap: every concurrency claim below is proven at
the **unit/async level** (two `Promise`s racing the real lock files on a
real disposable git repo, synchronized with an explicit gate so both are
provably inside their critical section at once) — not with two genuinely
separate OS processes invoking the real `fgos` CLI concurrently. The
underlying mechanism (`wx-atomic-create` + `link(2)` on real lock files)
does not distinguish "two async calls in one process" from "two processes"
— the same code path executes identically either way — but a reviewer
should know a true multi-process CLI test was not written for this item.

## What the plan's own risk map required, and what proves each row

Plan.md named every "high" row a mandatory proof point, "not suy đoán". Each
one below cites the actual test, not an argument:

1. **`mergeRunnerItem` no longer takes `main-checkout.lock` on the ephemeral
   path (hard-gate data loss)** —
   `test/runner/merge.test.mjs`: *"mergeRunnerItem with targetSlot:true does
   NOT take main-checkout.lock"* (merges successfully while another identity
   holds `main-checkout.lock`, proving the two are independent resources);
   *"mergeRunnerItem omitting targetSlot... still takes main-checkout.lock
   exactly as before"* (regression guard, byte-identical default);
   *"withMergeTargetSlot refuses when the SAME target ref is already held...
   code lock-held"* (the tsk-46a-class contention case, at the new slot
   layer). The pre-existing tsk-46a CAS guard test in this same file
   (`withMergeEphemeralWorktree refuses to force-move the branch when it
   moved since this call started`) is untouched and still passes — the slot
   change does not weaken it.
2. **`lockFile` option on the shared lock module** —
   `test/runner/main-checkout-lock.test.mjs`: *"acquireMainCheckoutLock
   omitting lockFile still resolves to LOCK_FILE"* (every existing caller's
   default, unchanged); *"two different lockFile values never contend with
   each other"* (both acquire, independently refuse a third writer,
   independently release); the full pre-existing 53-test suite for this
   module (self-recognition, TTL, stale reclaim, atomic-write races) passes
   unmodified against the new optional parameter.
3. **Slot acquired outside the ephemeral worktree** —
   `test/runner/merge.test.mjs`: *"the target-slot pattern in practice:
   withMergeTargetSlot held around withMergeEphemeralWorktree blocks a
   second concurrent attempt on the SAME target BEFORE it can read the
   target tip"* — asserts the target's tip is byte-identical before and
   after the refused attempt, proving `createDetachedMergeWorktree` never
   even ran.
4. **Picker skip** — `test/cli/fgos-merge.test.mjs`, three new tests: a sole
   Iron-Law-required ready item is skipped, never attempted, distinct
   `{reason: 'every ready item is blocked'}` from a genuinely empty ready
   list; a mixed pool skips the blocked one and picks/merges the other;
   `--acknowledge-iron-law` forwarded by the caller disables the pre-skip
   exactly as before this item.
5. **"Nothing left" vs "stuck"** — same three tests above; the `skipped`
   array and the two distinct `reason` strings are the signal merge-loop's
   pool-empty stop rule needs.
6. **`sync-root` nested path takes the same slot shape as a leaf approve** —
   wired identically in `bin/fgos.mjs` (`withMergeTargetSlot(repoRoot,
   targetBranch, ...)` around `withMergeEphemeralWorktree`, `targetSlot:
   true` threaded through `runAndReport`); NOT separately proven by a
   dedicated new test in this pass — same code path as the leaf-to-root
   wiring, same unit-level primitive tests above cover the mechanism, but a
   CLI-level test asserting the two call sites actually contend on the
   identical lock file for a shared target was not written. Named here as a
   real gap, not silently left out.

## Full suite

Run from this branch, clean tree, immediately before this evidence file was
written:

```
$ npm test
ℹ tests 3017
ℹ suites 0
ℹ pass 3012
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 47501.065299
```

(The 5 skips pre-exist this item's work and are unrelated to it.)

## Not acknowledged by this session

The acknowledgment itself is deliberately left to a person — `fgos approve
tsk-xyr --acknowledge-iron-law` has not been run here. The Iron Law stop is
a real human judgment by design (§H.3 and the locked law); this file exists
so that judgment can be made quickly against real evidence, including its
honest gaps, rather than reconstructed from scratch.
