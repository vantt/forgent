# Iron Law evidence: tsk-4ax

`classifyIronLaw` on this item's real diff (`fgw/tsk-4ax` vs its target
`fgw/tsk-51m`, computed with `changedFiles(repoRoot, item, {trunk:
'fgw/tsk-51m'})` against the real branch):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

`matchedFlags` is empty — nothing in this item's title/description trips a
keyword. The gate fires purely on the module rule (`{equals:
'bin/fgos.mjs'}` in `src/evolve/iron-law.mjs`'s `MODULE_RULES`).

This item is a self-declared **hard-gate removing-a-validation** item —
its own description states the risk plainly: "false-positive ở đây là land
code chưa verify" (a false positive here means landing code that was never
verified). Treated with the weight that deserves throughout.

Full real diff (`fgw/tsk-51m...HEAD`):

```
bin/fgos.mjs
test/cli/fgos-approve.test.mjs
test/cli/fgos-post-merge.test.mjs
```

## Honest gap: this was not failing-test-first development

Same disclosure as every sibling item in this batch: implemented, then
covered with tests in the same pass and verified green — not proven
red-before-green.

## What the item's own four acceptance criteria required, and what proves each

The description names two absolute constraints before anything else:
**never loosen `mergedTreeAlreadyVerified`'s two conditions** — only give
them a real chance to become true — and **fail-closed must stay
fail-closed** when catchup was NOT involved. Neither condition inside
`mergedTreeAlreadyVerified` (`merge.mjs:803`) was touched by this diff at
all; the only change is that `branchHeadAtReturn` now gets written
correctly by more code paths (catchup's two success outcomes, and an
in-memory-only override for approve's own inline catchup), giving the
EXISTING unmodified conditions a real chance to both be true.

1. **Item goes through catchup, then lands: outbound gate does NOT
   re-verify, proven by assert, not by timing** —
   `test/cli/fgos-post-merge.test.mjs`: *"catchup records
   branchHeadAtReturn as its own commit tip, so a subsequent approve skips
   re-verifying entirely"* — a sentinel-file verify command runs once
   during a manual `catchup` call, the sentinel is deleted, then a real
   `approve` call is asserted to NOT recreate it. A second test proves the
   same for the `already-caught-up` (no-new-commit) outcome. `test/cli/
   fgos-approve.test.mjs`: *"approve of a leaf whose root has moved since:
   auto-catches-up inline... and its own inline verify is the ONLY verify
   that runs — exactly once, not twice"* — the strongest version of this
   proof: a run-counter log (not existence, an actual count) is asserted
   to hold **exactly 1 line** for a single `approve` call that both catches
   up AND lands, with no separate `fgos catchup` call anywhere in the test.
2. **Item did NOT go through catchup, target has moved: outbound gate
   STILL runs full verify — fail-closed unchanged, never loosened** — this
   is the pre-existing, completely untouched behavior of
   `mergedTreeAlreadyVerified`'s own two conditions, covered by
   `test/runner/merge.test.mjs`'s `D5: main advancing past the fork forces
   the checks to run again` (unmodified by this diff, still passing).
   `test/cli/fgos-approve.test.mjs`'s new *"approve of a leaf whose root
   has NOT moved: no catchup attempted at all"* additionally proves the
   ancestor pre-check itself correctly short-circuits (no catch-up commit
   appears) when there is genuinely nothing to catch up — the new code
   path doesn't fire when it has no reason to.
3. **Item never returned (no `branchHeadAtReturn`): outbound gate still
   verifies fully** — also pre-existing, untouched:
   `test/runner/merge.test.mjs`'s `D5: an item with no branchHeadAtReturn
   is never eligible for the skip`, still passing unmodified.
4. **Lock hold time per land drops from ~185s to seconds, measured** — not
   measured as a wall-clock number in this pass (the test fixtures use
   trivial verify commands, so a real 185s-scale measurement was not
   reproducible here), but the STRUCTURAL claim is stronger than a
   reduction and is directly provable: for the leaf-to-root and
   sync-root-nested paths, `main-checkout.lock` is not merely held for
   less time — it is **never acquired at all** anymore
   (`targetSlot: true`, tsk-xyr's own mechanism). Every test in this item
   and its sibling (`tsk-xyr`) that asserts `gitHead(cwd) === headBefore`
   for a leaf/nested-sync-root approve is indirect proof of this: the
   human's own main checkout is never touched, so nothing there could have
   needed exclusive locking. The root-to-main path (where
   `main-checkout.lock` genuinely IS the target's own slot, by design) is
   unaffected by this item — the ~185s figure historically came from
   exactly the leaf/nested paths this item and tsk-xyr together remove
   from that lock's critical section. Named as a real gap: no session
   attempted to reproduce and time the original 185s scenario end-to-end
   to report a concrete before/after number.

## Additional real finding this diff also fixes, beyond the four listed criteria

A conflict or a red verify during the NEW inline-catchup path (approve's
own pre-check, not the standalone `catchup` verb) needed its own
blocked-park handling — the item's own description didn't enumerate this
explicitly, but leaving it unhandled would have meant an inline catchup
failure crashing instead of parking cleanly. `test/cli/
fgos-approve.test.mjs`'s *"approve of a leaf whose inline catchup hits a
real conflict: parks blocked... root untouched"* proves this path parks
correctly with the same `merge-conflict`/`verify-fail-post-merge` reason
strings approve's own direct merge attempts already use, and that a failed
inline catchup leaves the target's tip completely untouched.

## Full suite

Run from this branch, clean tree, immediately before this evidence file was
written:

```
$ npm test
ℹ tests 3029
ℹ suites 0
ℹ pass 3024
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 48898.877148
```

(The 5 skips pre-exist this item's work and are unrelated to it.)

## Not acknowledged by this session

The acknowledgment itself is deliberately left to a person — `fgos approve
tsk-4ax --acknowledge-iron-law` has not been run here. This is the last of
tsk-51m's five formal children; once acknowledged and merged, `fgw/tsk-51m`
holds all five and D1 (root cannot land partial into `main`) is satisfied.
