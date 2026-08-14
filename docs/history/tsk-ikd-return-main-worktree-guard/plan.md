# plan: tsk-ikd — return's main-source path: refuse an unregistered worktree, exempt a registered session

Mode: standard

Flag count/lane: 1 explicit flag (existing covered behavior — `bin/fgos.mjs`'s
`return`/`approve` cases both carry extensive real CLI test suites). No
hard-gate flag (auth/data-loss/audit-security/external-provider/removed-
validation) — item's own `tier`/`risk` (`standard`/`standard`) match the
report's "severity: medium". Standard lane.

Direct-entry fallback: this item entered `planning` straight from a `clear`
discovery verdict — no `CONTEXT.md`/exploring round exists. `RESEARCH.md`
round 1 stands in for it.

## Impact-analysis posture

Same as every sibling item checked in this session: gitnexus `present` but
172 commits behind HEAD — **degraded**. Not leaned on here: the actual
resolution for this item came from reading `docs/specs/runner.md` directly
(a locked spec, not blast-radius evidence) plus an empirical test run
(RESEARCH.md round 1) — no GitNexus call was needed or made for this item.

## Approach

**The report's own "Suggested direction" is INCOMPLETE, corrected here with
evidence (RESEARCH.md round 1):** blindly applying `approve`'s
`isMainWorktree(repoRoot)` refusal to `return`'s main-source path would
reverse a locked, spike-proven design decision documented in
`docs/specs/runner.md:656-669` — "`return`... running from inside a session
[worktree] behaves exactly the same as everywhere else" — and would break
an existing, passing test (`test/cli/fgos-return.test.mjs:997`,
"return succeeds unchanged from inside a real session worktree"). Confirmed
by actually implementing the naive version first and running the existing
suite against it: it failed that exact test. Per `review-audit-self-
decision`'s "Verified Decisions" rule, a locked/spike-proven decision is
not reversed on an audit's suggestion alone, absent new evidence — the audit
here didn't cite any; it simply didn't check for the carve-out.

**The corrected fix**, in `bin/fgos.mjs`'s `case 'return'`, main-source
branch (right after the branch-source path's own early return, before any
main-tree-touching code runs):

```js
const returnCwdReal = realpathOr(repoRoot);
const insideRegisteredSession = listSessions(repoRoot).some((session) => {
  const wtReal = realpathOr(session.worktreePath);
  return returnCwdReal === wtReal || returnCwdReal.startsWith(`${wtReal}${path.sep}`);
});
if (!insideRegisteredSession && !isMainWorktree(repoRoot)) {
  throw new StoreError('validation', `return: refusing to run from "${repoRoot}" — ...`);
}
```

This mirrors `approve`'s own two-part guard shape (a `listSessions`
realpath-prefix registry check, then a structural `isMainWorktree` check)
but with `return`'s own, OPPOSITE session handling: `approve` refuses ANY
worktree including a registered session (a session worktree is
structurally wrong for a merge-into-main); `return` ALLOWS a registered
session (its progress check is spike-proven correct there) and refuses only
an UNREGISTERED worktree — the actual Finding 4 danger (a leftover, unrelated
`fgw/<id>` claim checkout, or a bare `git worktree add` by hand).

**Why the session carve-out is safe, not a loophole** (RESEARCH.md round 1):
a session worktree's `.fgos` is a real symlink to the shared store (D10, no
copy, no staleness), and `session end` (session.mjs's own divergence guard)
already refuses to silently discard a dangling commit made from inside it
— that is the layer responsible for making sure work returned from a
session worktree actually reaches main before the session is closed, not
`return`'s own job.

**Branch-source path:** unchanged, needs no guard at all (its own existing
comment, D2: "tree người là việc của người" — it never touches `repoRoot`'s
working tree, verify runs in a disposable detached worktree built from the
branch tip itself).

## Risk map

| Component | How risky | Proof point |
|---|---|---: |
| The new guard's session/main-worktree logic | Medium — must refuse the real danger case without breaking the spec-locked session carve-out; a naive first pass DID break an existing test, caught before this plan was written | New test reproducing Finding 4's real failure scenario (a main-source `take`, returned from an ad-hoc `git worktree add` never registered via `fgos session start`) — asserts a clean validation refusal (exit 4), item stays `doing`, never reaches `awaiting-approval`. Existing session-worktree test (`fgos-return.test.mjs:997`) reruns UNCHANGED, still green, proving the carve-out holds |
| Every other existing `return`/`approve` test (branch-source, blocked-branch, no-new-commits-ok, ad-hoc-worktree approve variants) | Low — must stay byte-identical | Full existing `test/cli/fgos-return.test.mjs` (49 tests) and `test/cli/fgos-approve.test.mjs` (part of a 224-test combined run with fgos-read/fgos-merge) rerun unchanged |
| Broader e2e coverage touching `return` (pr-gate, runner-loop, compound-learn, fixture-marketing) | Low — none of these use an unregistered ad-hoc worktree for `return`; the runner's own dispatch path is always branch-source (never reaches this guard) | Full existing e2e suites (`pr-gate`, `runner-loop`, `compound-learn-lifecycle`, `fixture-marketing-domain` — 14+15 tests) rerun unchanged, confirmed during this same research round |

## Shape

Single piece, no split — one guard, already implemented and verified
against both the new failure-scenario test and the full existing suite
(including the specific test that would have caught a wrong, over-broad
fix).

Verify (already synced onto the item at discovery, real and runnable):
```
node --test test/cli/fgos-return.test.mjs test/cli/fgos-approve.test.mjs
```

## Outstanding questions

None
