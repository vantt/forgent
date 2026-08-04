# Iron Law evidence: tsk-38t-7

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` on this item's diff
returned `required: true` — `matchedModules:
["src/state/workflow-stage-graphs.mjs"]` (on `MODULE_RULES`'
self-modifying-capable list), `matchedFlags: []`.

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/state/workflow-stage-graphs.mjs"
  ]
}
```

## Failing-test-first proof

Test command: `node --test test/e2e/fixture-marketing-domain.test.mjs`
(part of `npm test`).

**Before the fix** — reverted `src/state/workflow-stage-graphs.mjs` to its
pre-`tsk-38t-7` state (`git stash push -- src/state/workflow-stage-graphs.mjs`)
while keeping the new test file (and the unrelated one-line update to
`test/state/workflow-stage-graphs.test.mjs`'s domain-count assertion), then
ran the new file. Real transcript:

```
fgos: unrecognized domain "fixture-marketing" — folding to "coding".
✖ DOMAINS['fixture-marketing'] declares its OWN statusLabels/skillMap.retrospective/fieldSchema, none of them borrowed from coding (1.328222ms)
✔ adding "fixture-marketing" leaves DOMAINS.coding completely unchanged (RUL11 — purely additive) (0.48881ms)
✖ e2e: moving a fixture-marketing item into "blocked" stamps statusCategory "canceled" (its own declined-equivalent) while the same move for a plain coding item stamps "in-progress" (123.026155ms)
✖ e2e: a dependent item unblocks when its fixture-marketing dep enters "blocked" (its OWN declined-equivalent, category "canceled") — proving isResolvedStatus reads statusCategory, not a hardcoded "wontfix" literal (116.490435ms)
✖ e2e: work.add/work.edit --domain-fields round-trips for a fixture-marketing item, whole-object-overwrite on edit, and fieldSchema accepts/rejects correctly (123.30138ms)
✖ e2e: a fixture-marketing item runs the real take -> return -> delivered -> retrospective -> compound -> cleanup chain, reaching done identically to coding — the four tail-segment moves stamp NO statusCategory, exactly like coding (127.420632ms)
ℹ tests 6
ℹ suites 0
ℹ pass 1
ℹ fail 5
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 536.869886

✖ failing tests:

test at test/e2e/fixture-marketing-domain.test.mjs:117:1
✖ DOMAINS['fixture-marketing'] declares its OWN statusLabels/skillMap.retrospective/fieldSchema, none of them borrowed from coding (1.328222ms)
  AssertionError [ERR_ASSERTION]: Expected "actual" not to be reference-equal to "expected":
  ...
    operator: 'notStrictEqual',
    diff: 'simple'
  }

test at test/e2e/fixture-marketing-domain.test.mjs:155:1
✖ e2e: moving a fixture-marketing item into "blocked" stamps statusCategory "canceled" (its own declined-equivalent) while the same move for a plain coding item stamps "in-progress" (123.026155ms)
  AssertionError [ERR_ASSERTION]: add fx-cat failed: fgos: work.domain must be one of ["coding","synthetic","triage"] when present, got: "fixture-marketing"

  4 !== 0

test at test/e2e/fixture-marketing-domain.test.mjs:188:1
✖ e2e: a dependent item unblocks when its fixture-marketing dep enters "blocked" (its OWN declined-equivalent, category "canceled") — proving isResolvedStatus reads statusCategory, not a hardcoded "wontfix" literal (116.490435ms)
  AssertionError [ERR_ASSERTION]: add fx-dep failed: fgos: work.domain must be one of ["coding","synthetic","triage"] when present, got: "fixture-marketing"

  4 !== 0

test at test/e2e/fixture-marketing-domain.test.mjs:215:1
✖ e2e: work.add/work.edit --domain-fields round-trips for a fixture-marketing item, whole-object-overwrite on edit, and fieldSchema accepts/rejects correctly (123.30138ms)
  AssertionError [ERR_ASSERTION]: add fx-fields failed: fgos: work.domain must be one of ["coding","synthetic","triage"] when present, got: "fixture-marketing"

  4 !== 0

test at test/e2e/fixture-marketing-domain.test.mjs:250:1
✖ e2e: a fixture-marketing item runs the real take -> return -> delivered -> retrospective -> compound -> cleanup chain, reaching done identically to coding — the four tail-segment moves stamp NO statusCategory, exactly like coding (127.420632ms)
  AssertionError [ERR_ASSERTION]: add fx-life failed: fgos: work.domain must be one of ["coding","synthetic","triage"] when present, got: "fixture-marketing"

  4 !== 0
```

(The one test that still passed, `adding "fixture-marketing" leaves
DOMAINS.coding completely unchanged`, is correctly domain-agnostic — it
only asserts facts about `DOMAINS.coding`, which the revert never touches;
it is not testing the fixture domain's own existence, so its pass here is
expected and not a sign of a tautological test.)

**After the fix** — restored `workflow-stage-graphs.mjs` (`git stash pop`),
same test file, real transcript:

```
✔ DOMAINS['fixture-marketing'] declares its OWN statusLabels/skillMap.retrospective/fieldSchema, none of them borrowed from coding (0.896871ms)
✔ adding "fixture-marketing" leaves DOMAINS.coding completely unchanged (RUL11 — purely additive) (0.114514ms)
✔ e2e: moving a fixture-marketing item into "blocked" stamps statusCategory "canceled" (its own declined-equivalent) while the same move for a plain coding item stamps "in-progress" (383.894775ms)
✔ e2e: a dependent item unblocks when its fixture-marketing dep enters "blocked" (its OWN declined-equivalent, category "canceled") — proving isResolvedStatus reads statusCategory, not a hardcoded "wontfix" literal (330.112236ms)
✔ e2e: work.add/work.edit --domain-fields round-trips for a fixture-marketing item, whole-object-overwrite on edit, and fieldSchema accepts/rejects correctly (219.804629ms)
✔ e2e: a fixture-marketing item runs the real take -> return -> delivered -> retrospective -> compound -> cleanup chain, reaching done identically to coding — the four tail-segment moves stamp NO statusCategory, exactly like coding (569.486368ms)
ℹ tests 6
ℹ suites 0
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1544.956568
```

Full suite after the fix (`npm test`, the item's own recorded `verify` run
in full, prior to this evidence step): **2542 tests, 2537 pass, 0 fail, 0
cancelled, 5 skip** (baseline before this item: 2536/2531/0/5 — exactly the
6 new tests added by this item, zero regressions; the one-line update to
`test/state/workflow-stage-graphs.test.mjs`'s domain-count assertion, from
three entries to four, is a like-for-like replacement, not a net-new test,
which is why the delta is exactly 6 and not 7).

## Why the proof was captured after implementation, not via a literal red-green session

Same reasoning as `docs/history/tsk-38t-2/iron-law-evidence.md`'s own "Why
the proof was captured after implementation" section: this item's
implementation and its own test file were written together by an
unattended subagent, not through a live TDD red/green loop typed by a
person. The evidence above reconstructs the equivalent proof mechanically
and honestly: reverting only `src/state/workflow-stage-graphs.mjs` (never
the test file) and re-running proves the new tests are not tautological or
vacuously passing — 5 of 6 fail for the real reason (the domain genuinely
does not exist without the fix, so `work.add --domain fixture-marketing`
is rejected by `work.mjs`'s own `validateWork`, exactly the same shape of
proof `bin/fgos.mjs`'s real CLI gives any caller of an unrecognized
domain), and all 6 pass for the real reason once the registry entry is
restored.

## Why this evidence also proves the item's own most important claim

The single most important thing this item exists to prove — per its own
task instructions — is that `isResolvedStatus` (`src/state/frontier.mjs`,
`tsk-38t-4`'s own migration) reads `item.statusCategory` generically rather
than a hardcoded `item.status === 'wontfix'` string comparison. The
"before" transcript above shows the dependent-unblock test
(`e2e: a dependent item unblocks when its fixture-marketing dep enters
"blocked"...`) fails at the very first `add` call, before it can even reach
its own `isResolvedStatus` assertion — because without this item's registry
entry, `fixture-marketing` is not a real domain at all, so there is no way
to construct the scenario the test needs. The "after" transcript shows the
full scenario running for real: a fixture-marketing item enters `blocked`
(never `wontfix`), and a dependent item genuinely unblocks — which
`isResolvedStatus`'s literal-`'wontfix'` fallback path could never have
produced. A hypothetical future regression that replaced
`item.statusCategory === 'canceled'` with a hardcoded `item.status ===
'wontfix'` check would make this specific test fail again, for the real
reason, without needing to revert anything in
`workflow-stage-graphs.mjs` at all — which is the regression-catching power
this item's task asked the fixture domain to add.
