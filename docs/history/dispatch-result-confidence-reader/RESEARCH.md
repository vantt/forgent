# Research — dispatch-result-confidence-reader (tsk-1g6)

## Round 1 — 2026-08-26 — discovery stage

**Asked:** Where does the dispatch result confidence ladder
(`reported | legacy-signal | inferred`) live today, and what field shape
exists for `executor.dispatch` + worker result evidence that a new reader
could read from? Is tsk-2tr's in-flight extraction a hard blocker?

**Checked (repo, `rg`/direct read):**

- `src/runner/dispatch/cli.mjs:508-524` — `executeExecutorCli`'s own
  `execute <executorId>` CLI subcommand builds the ladder inline:
  `hasSignal = cleanStdout.includes('[DONE]') || cleanStdout.includes('[BLOCKED]')`,
  `isDone = cleanStdout.includes('[BLOCKED]')`... (`[DONE]` for isDone), then
  `base = { mechanism, ...result, ...(hasSignal ? {} : { outcome: 'unsignaled', headBefore, headAfter }), ...(isDone && headAfter ? { verifiedSha: headAfter } : {}) , provider, command }`.
  This is the ONLY place in the codebase that computes the three-way
  ladder. It backs `[DONE]`/`[BLOCKED]` token classification (what tsk-2tr's
  own description calls "legacy-signal") vs the git-head-delta fallback
  ("inferred", `outcome: 'unsignaled'`) vs whatever richer `...result`
  the adapter itself already returned ("reported", structured). This
  confirms tsk-2tr's own description verbatim ("result truth nằm rải trong
  executeExecutorCli").
- `src/runner/dispatch/cli.mjs:169-243` (`spawnWorker`, the function the
  MAIN autonomous runner loop actually dispatches through, `loop.mjs`) —
  does **NOT** run any part of the ladder above. Its return value is just
  `{...adapterResult, templateName, templateHash, executorId, provider,
  command, baseCommit, headRef, governance}`. The ladder is exclusive to
  the ad-hoc `dispatch.mjs execute` CLI subcommand path, never the
  claim/loop dispatch path.
- `src/runner/loop.mjs:918-940` — the durable `executor.dispatch` event
  `loop.mjs` appends per real dispatch (`payload: {id, executorId,
  provider, command, model, baseCommit, headRef, governance}`) carries
  **no outcome/confidence field of any kind** — confirmed by direct read,
  the payload object literal has exactly those 7 keys. `cli.mjs:262-277`
  (`logExecutorDispatch`, the in-session-call sibling entry point) writes
  the identical shape, also with no outcome field.
- `src/runner/loop.mjs:972-1000` — the SEPARATE, older outcome mechanism:
  `addOutcome(dir, { id, actual: { outcome: 'awaiting-approval', passed,
  attempts, errorClass, aheadCount, visits } })` — this is the
  predicted-vs-actual data `fgos check` already reads (see
  `src/runner/goal-check.mjs` / `/fgOS:check`). It is goal-check-derived
  (verify script pass/fail), not the `[DONE]`/`[BLOCKED]`/git-delta ladder
  — a genuinely different signal, already has its own reader (`fgos
  check`), out of this item's scope.
- `src/runner/loop.mjs:960-970` (`appendWorkerLog`) — persists the raw
  per-attempt worker output (`tier, model, templateName, templateHash,
  status, signal, stdout, stderr`) to `.fgos/logs/<id>.log` via
  `src/runner/worker-log.mjs`. This DOES retain the raw stdout a reader
  could re-scan for `[DONE]`/`[BLOCKED]` tokens after the fact, using the
  same detection tsk-2tr is extracting — this is the one durable source
  today a reader can classify real historical dispatches against.

**Finding — is tsk-2tr a hard blocker?** No, but it is the right
dependency (already attached at submit time, user-confirmed): tsk-2tr's
own acceptance criteria promise a small, tested, reusable classification
helper with the exact three ladder outcomes, extracted out of
`executeExecutorCli` — this reader's classification logic should call that
helper rather than re-implement `[DONE]`/`[BLOCKED]`/git-delta detection a
second time. Building the reader before tsk-2tr lands would either (a)
duplicate the detection logic tsk-2tr is about to extract, or (b) import
straight from `executeExecutorCli`'s current inline block, both of which
tsk-2tr's own item exists to prevent. The dependency is real, not
theoretical — but it blocks IMPLEMENTATION, not discovery: the ladder's
current location/shape is fully evidenced already, nothing here needs a
person to resolve.

**Verdict:** `clear`. Real, verifiable verify command exists already
(reused from the item's own text): `node --test
test/runner/dispatch.test.mjs`.
