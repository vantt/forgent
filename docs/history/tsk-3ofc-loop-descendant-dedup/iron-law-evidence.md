# Iron Law evidence — tsk-3ofc

## Classification

Run after the implementation commit (`e17001d4`), against the real
committed diff (`changedFiles`/`classifyIronLaw`, `src/evolve/iron-law.mjs`):

```
{"required":true,"matchedFlags":["delete"],"matchedModules":["src/runner/loop.mjs"]}
```

**Note on the `delete` flag:** this matched the item's own stale
`description` field (still describing the ORIGINAL, rejected proposal —
"delete the now-dead hasStillNeededDescendant function" — see
`CONTEXT.md` D1 for why that proposal was rejected and the item re-scoped
to a comment-only change). The actual committed diff contains **zero
deletions** — both files only gained lines (`git show e17001d4 --stat`:
`2 files changed, 5 insertions(+), 1 deletion(-)`; the single "deletion"
is a docstring line replaced by two lines extending it, not a code
deletion). The gate is honored as required regardless of the false-
positive-looking trigger — evidence below is real either way.

## Verify command

```
node --test test/runner/loop.test.mjs && grep -q "hasOpenDescendant" src/runner/loop.mjs && grep -q "hasStillNeededDescendant" src/state/frontier.mjs
```

## Failing-before / passing-after proof

Since this diff touches no test files (comment-only change), the
before/after comparison reverted the two touched implementation files to
their pre-implementation committed state (`git checkout HEAD~1 --
src/runner/loop.mjs src/state/frontier.mjs`) rather than stashing
uncommitted files — the implementation was already committed by the
out-of-process worker (`e17001d4`) before this classification step ran,
per this skill's own commit-then-classify ordering.

**Red (pre-implementation state, `a073019b`'s tree):**

```
$ git checkout HEAD~1 -- src/runner/loop.mjs src/state/frontier.mjs
$ node --test test/runner/loop.test.mjs && grep -q "hasOpenDescendant" src/runner/loop.mjs && grep -q "hasStillNeededDescendant" src/state/frontier.mjs
...
ℹ tests 69
ℹ pass 69
ℹ fail 0
$ grep -q "hasOpenDescendant" src/runner/loop.mjs; echo $?
0
$ grep -q "hasStillNeededDescendant" src/state/frontier.mjs; echo $?
1
```

The scoped regression suite (69/69) already passed before the change —
expected, since this is a comment-only addition, not a bug fix. The real
"red" signal is the second grep: `src/state/frontier.mjs` did not yet
contain the string `hasStillNeededDescendant` anywhere, so the full
chained verify command's real exit code was `1` (failed) at that step.

**Green (real implementation, `e17001d4`, restored via `git checkout
HEAD -- src/runner/loop.mjs src/state/frontier.mjs`):**

```
$ grep -q "hasOpenDescendant" src/runner/loop.mjs; echo $?
0
$ grep -q "hasStillNeededDescendant" src/state/frontier.mjs; echo $?
0
$ git status --short
(clean)
```

Both cross-reference comments are present; the full verify command now
exits `0`.

## Full regression re-check

`node --test test/runner/loop.test.mjs` re-run after restoring the real
implementation: `69/69` pass, `0` fail — identical pass count to the
pre-implementation baseline above, confirming no regression.

## Blast-radius / impact-analysis posture

`fgos tool query --capability impact-analysis --status present` reports
GitNexus as `present` (one provider registered). Cross-checked directly
against `mcp__gitnexus__list_repos` per this repo's own capability gate
(`CLAUDE.md`: "a present status only means the tool is installed, never
that its index is fresh or intact") — the actual indexed state is
**degraded, not full**: the `forgentX` main-checkout index is 1325
commits behind HEAD, and this item's own worktree
(`tsk-3ofc-28HAKY`) is not indexed at all (absent from
`list_repos`'s siblings list). Correcting the "full" posture recorded
earlier in `plan.md`/`CONTEXT.md` (based only on `tool query`'s
present/absent check, before this cross-check ran).

Named plainly per the gate rather than silently trusted: this gap is not
load-bearing for THIS item — the diff is a two-line, comment-only
addition to two already-fully-read functions (`loop.mjs:331-343`,
`frontier.mjs:308-313`, both re-confirmed by direct read this session),
with no call-site or exported-signature change, so a code-graph blast-
radius query would not surface anything the direct read + regression
suite above hasn't already covered.
