# Iron Law evidence: tsk-kv3

`classifyIronLaw` on this item's real diff (`fgw/tsk-kv3` vs its target
`fgw/tsk-51m`, computed with `changedFiles(repoRoot, item, {trunk:
'fgw/tsk-51m'})` against the real branch):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

`matchedFlags` is empty. The gate fires purely on the module rule
(`{equals: 'bin/fgos.mjs'}`) — expected and named in advance in this
item's own `plan.md` (Q3: scope widened to include this exact file, in
place of the `merge.mjs` location `tsk-51m`'s parent plan originally
assumed).

Full real diff (`fgw/tsk-51m...HEAD`):

```
bin/fgos.mjs
docs/history/tsk-kv3-merge-clean-gate-shared-tree/RESEARCH.md
docs/history/tsk-kv3-merge-clean-gate-shared-tree/plan.md
test/cli/fgos-approve.test.mjs
```

## Honest gap: this was not failing-test-first development

Same disclosure as every sibling item in this batch: the gate relocation
was implemented, then covered with a new test in the same pass and
verified green — not proven red-before-green.

## What was actually proven

The change is a pure RELOCATION (move a check from one branch to another,
same logic, same `ownFileSet`/`isMainTreeClean` call) rather than new
logic, so the proof burden is smaller than usual — but real, not argued:

1. **The removed gate is genuinely inert where it's removed.** `RESEARCH.md`
   F4 establishes with a direct code read that the leaf→root merge runs
   entirely inside a detached ephemeral worktree
   (`withMergeEphemeralWorktree`) that never reads or writes `repoRoot`'s
   own working tree — the gate protected a resource that path structurally
   cannot touch.
2. **A leaf approve now succeeds despite a dirty main checkout, even one
   colliding with the leaf's own declared footprint path** —
   `test/cli/fgos-approve.test.mjs`'s new test, run side by side against
   the existing root/standalone test using the identical dirty-file shape
   (an uncommitted footprint path): the root version still refuses
   (unchanged, D3 intact), the new leaf version succeeds, `main` HEAD
   unchanged, and the dirty file itself asserted to survive untouched —
   this gate never claimed to clean up anything, only to (wrongly) block
   on it.
3. **Root/standalone approve is completely unaffected** — the pre-existing
   `tsk-598 D3` footprint-dirty test (root/standalone case) passes
   unmodified; the check's logic, inputs, and the file set it computes are
   byte-identical to before this item, only its position in the function
   moved.
4. **`sync-root`'s own gate placement needed no change** — confirmed by
   reading the nested (`item.parent`) nested branch directly: no
   `isMainTreeClean` call exists there at all, meaning `tsk-66t`'s original
   placement was already scoped correctly to the root-to-main-shaped
   branch from the start.

Q2 (root-to-main's `ownFileSet` diluting toward whole-tree for a
many-child root) is explicitly answered in `plan.md` as working-as-designed
per `tsk-598` D2 — no code change accompanies it, and none is claimed.

## Full suite

Run from this branch, clean tree, immediately before this evidence file was
written:

```
$ npm test
ℹ tests 3089
ℹ suites 0
ℹ pass 3084
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
```

(The 5 skips pre-exist this item's work and are unrelated to it.)

## Not acknowledged by this session

`fgos approve tsk-kv3 --acknowledge-iron-law` has not been run here.
Acknowledgment is deliberately left to a person.
