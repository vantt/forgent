# Iron Law evidence — tsk-5wz

`fgos sync-root tsk-5wz` refused to run:

```
fgos: sync-root: "tsk-5wz" trips the Iron Law — a failing test must precede
this self-modifying diff before it can land. Matched flags: [auth]; matched
modules: [bin/fgos.mjs, src/state/workflow-stage-graphs.mjs].
Re-run with --acknowledge-iron-law to confirm failing-test-first proof and proceed.
```

Recipe followed: `docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`.
The one deviation is the get-to-red mechanism: that how-to uses `git stash`,
which this repo forbids for a worktree session — the stash stack is shared
with the main checkout and every other worktree, and another session's entry
can be popped by accident (`AGENTS.md`). `git checkout main -- <impl files>`
+ `git checkout HEAD -- <same files>` produces the identical red/green pair
with no shared-state risk. Two other sessions were demonstrably live in this
repo during this run (`16cbcdcc` on tsk-2ie5/tsk-28o, `79cf3f11` on
tsk-3fj), so this was not a hypothetical hazard.

## Scoped test command (identical before and after)

```
node --test test/state/work.test.mjs test/state/workflow-stage-graphs.test.mjs test/intake/classify.test.mjs
```

## Red run 1 — implementation absent, tests exactly as they ship

```
git checkout main -- src/state/work.mjs src/state/workflow-stage-graphs.mjs bin/fgos.mjs
```

```
ℹ tests 3
ℹ pass 0
ℹ fail 3

SyntaxError: The requested module '../../src/state/workflow-stage-graphs.mjs' does not provide an export named 'classificationVocabulary'
✖ test/intake/classify.test.mjs (33.970942ms)
SyntaxError: The requested module '../../src/state/workflow-stage-graphs.mjs' does not provide an export named 'classificationVocabulary'
✖ test/state/work.test.mjs (29.441088ms)
SyntaxError: The requested module '../../src/state/workflow-stage-graphs.mjs' does not provide an export named 'classificationVocabulary'
✖ test/state/workflow-stage-graphs.test.mjs (30.170033ms)
```

All three files fail to load: the tests import a symbol the implementation
has not created yet.

## Red run 2 — registry restored, ENFORCEMENT still absent

Load-level failure proves the symbol is new; it does not prove the
enforcement behaves. So the registry half was restored and `work.mjs` alone
left at `main`, isolating the behavior under test:

```
git checkout HEAD -- src/state/workflow-stage-graphs.mjs bin/fgos.mjs
node --test test/state/work.test.mjs
```

```
ℹ tests 129
ℹ pass 126
ℹ fail 3

✖ validateWork rejects a kind outside the coding vocabulary, naming the field
✖ validateWork rejects a risk outside the coding vocabulary, including the low/medium/high set
✖ an untouched legacy kind/risk is grandfathered on edit, but a touched one is held to the vocabulary

AssertionError [ERR_ASSERTION]: Missing expected exception: risk "low" must be rejected
```

Real assertion failures against the exact values this item exists to reject.

## Green run — same scoped command, implementation restored

```
git checkout HEAD -- src/state/work.mjs
node --test test/state/work.test.mjs test/state/workflow-stage-graphs.test.mjs test/intake/classify.test.mjs
```

```
ℹ tests 199
ℹ pass 199
ℹ fail 0
```

## Full suite

```
npm test
ℹ tests 2700
ℹ pass 2695
ℹ fail 0
```

5 skipped, matching the pre-implementation baseline. `node bin/fgos.mjs
doctor` exits 0 (its `changelog-unreleased-stale` check reads the MAIN
checkout's CHANGELOG.md by design — `resolveMainCheckout`, `src/setup/
registrations.mjs:767` — so this branch's own new entry is invisible to it
until merge; the check is remind-only and never blocks).

## detect_changes (`base_ref: main`)

```
risk_level: medium
changed_count: 52, changed_files: 41, affected_count: 2
affected_processes:
  - Event → WorkValidationError (step 3: validateWorkShape)
  - Event → Touched            (step 3: validateWorkShape)
```

Both affected processes centre on `validateWorkShape` — the write door this
item deliberately tightened, and nothing else. No unscoped symbol or process
appears.

**Caveat, stated rather than hidden:** the GitNexus index is stale (last
indexed `4ce7a96`) and this run returned several garbled symbol names, so
this is corroborating evidence, not primary. Primary blast-radius evidence
for this item is grep — see below.

## Impact-analysis posture: DEGRADED

`fgos tool query --capability impact-analysis --status present` reports
GitNexus `present`. But `impact({target: "validateWorkShape", direction:
"upstream"})` returned `impactedCount: 0, risk: LOW`, which is wrong:

```
grep -rn "validateWorkShape" src bin test
src/state/work.mjs:757:  validateWorkShape(work, touchedFields);   <- the real caller
+ 20 further references across bin/fgos.mjs and 4 test files
```

Per `CLAUDE.md`'s own capability gate ("a suspicious zero-result ... is
worth a quick grep/rg cross-check before being trusted"), the zero was
discarded and every call site in this item was established by grep instead.

That same grep discipline is what found the two live `risk` consumers the
item's original premise had missed — `decompose.mjs`'s `HEAVY_RISK` gate and
`priority-formula.mjs`'s `RISK_DISCOUNTS` — and inverted this item's
vocabulary decision before any code was written. See `plan.md`'s own
"Validating findings" section and the CHANGELOG entry.
