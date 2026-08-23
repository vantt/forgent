# CONTEXT: tsk-5ld — resolveDiscovery's --force override has no test for its own success/refusal paths

## Feature boundary

The item's own filed description claimed `discovery.mjs`'s D1a/D1b
(priorRejection threading + `--force` override, `judgeVerifySemanticCorrectness`'s
second-pass dispute path) had zero test coverage. Scout at this stage found
that claim **wrong in part**: `test/intake/judge-verify-second-pass-stability.test.mjs`
already exists and already covers priorRejection threading thoroughly (3
unit tests on `judgeVerifySemanticCorrectness` itself + 1 integration test
proving `resolveDiscovery` actually wires `view.gates[id].ask` through
across two real rounds) and the mechanical-disagreement exemption from
`--force` (2 tests: the mechanical check itself rejects before any LLM
call, and `--force` cannot bypass a mechanical disagreement).

The REAL, narrower gap: that file never tests `--force`'s own two other
behaviors — succeeding on a genuine non-mechanical disagreement (and
logging the override decision), and refusing when the item is already
`awaiting-human`. Both exist in the shipped code
(`src/intake/discovery.mjs:669-691`) but neither has a test. This item's
scope is corrected to exactly those two missing cases — mirroring the
same two cases `tsk-25g`'s own `decompose.test.mjs` additions already
proved for `resolveDecompose`'s parallel `--force` logic (commit
`cd0cc56`, merged to `main`).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope corrected from "add all missing tests for D1a/D1b" (the filed description's premise) to exactly two missing cases: (a) `--force` overrides a genuine non-mechanical disagreement, writes the item through to `decompose` stage, and logs a decision naming the overridden disagreement; (b) `--force` refuses (throws/rejects) when the item is already `awaiting-human`, pointing at `fgos answer` instead. Grounded in reading `test/intake/judge-verify-second-pass-stability.test.mjs` in full (222 lines) — priorRejection and the mechanical exemption are both already covered there; only these two `--force` branches of `discovery.mjs:669-691` have no test exercising them. |
| D2 | New tests land in the SAME file (`test/intake/judge-verify-second-pass-stability.test.mjs`), not a new file — it already owns this exact concern (D1a/D1b coverage for `resolveDiscovery`'s second-pass dispute path) and already has the fake-executor/`resolveDiscovery`-integration helpers these two new cases need (`writeCapturingExecutor`, `sampleWork`, `tmpStoreDir`, the round-aware-executor pattern the existing "threads the prior dispute's ask text" test already uses). Creating a second file for the same concern would duplicate that scaffolding for no reason. |

## Pinned terms

- **"the two missing cases" (D1)** — precisely: (a) `--force` + a
  non-mechanical disagreement + item NOT already `awaiting-human` →
  succeeds, decision logged (mirrors `decompose.test.mjs`'s "resolveDecompose
  --force overrides a disputed (non-mechanical) child verify..." test); (b)
  `--force` + item ALREADY `awaiting-human` → throws, mentions `fgos answer`
  (mirrors `decompose.test.mjs`'s "resolveDecompose --force refuses when the
  item is already awaiting-human..." test). Nothing else is in scope —
  priorRejection and the mechanical exemption are done.

## Scout evidence

- `test/intake/judge-verify-second-pass-stability.test.mjs` (full read,
  222 lines) — confirms exactly what is and is not covered, per Feature
  boundary above. Its own header comment (lines 10-23) states its purpose:
  "This file proves the fix" for tsk-5cf D1a.
- `src/intake/discovery.mjs:669-691` — the two `--force` branches with no
  test: the `addDecision(...)` success path (line 686) and the
  already-`awaiting-human` `throw new StoreError(...)` refusal (line
  680-684).
- `test/intake/plan.test.mjs:1315-1418` (tsk-25g, commit `cd0cc56`,
  merged to `main`) — the exact two analogous tests for `resolveDecompose`'s
  parallel `--force` logic, proven pattern to mirror: same `callerVerdict`
  shape (`{verdict, reason, children, force: true}` for decompose;
  `{clear, verify, force: true}` for discover per
  `judge-verify-second-pass-stability.test.mjs:216`'s own existing usage),
  same `addWork(storeDir, sampleWork({status: 'awaiting-human'}))` setup
  for the refusal case, same `assert.throws(..., /already "awaiting-human"/)`
  assertion shape.
- `fgos tool query --capability impact-analysis --status present`:
  GitNexus registered, `status: "present"`. Not cross-checked against a
  fresh index this session (not needed — this item edits only a test
  file, no function/class/method symbol; per CLAUDE.md's own gate, the
  MUST-run-impact rule is about editing symbols, not adding tests against
  already-read, already-understood functions).

## Outstanding questions (deferred to planning)

- Exact assertion shape / decision-log text match for the "succeeds"
  case's `fgos decision` entry is an implementation choice for whoever
  writes the test, following `decompose.test.mjs`'s own precedent
  (`/--force overrode/` regex match against `view.decisions`).
- Whether a CLI-level test (`test/cli/fgos.test.mjs`, mirroring `discover
  --force`) is also worth adding is explicitly OUT of this item's scope —
  `decompose --force` (tsk-25g) also shipped with no CLI-level test, same
  bar; not asked here, not assumed either way.
