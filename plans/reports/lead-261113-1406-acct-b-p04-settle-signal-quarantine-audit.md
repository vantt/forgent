# Lead report: account health B, settle signal, quarantine dating, capacity audit log

Branch `harden/acct-b-p04`, worktree `/home/vantt/projects/forgent-worktrees/acct-b-p04`. Not landed: main is frozen until `v0.2.0-rc.7`.

## Base

- `--base origin/harden/acct-b-p02`, then merged `origin/harden/acct-b-p03` (`e583e0e5f`). The only conflict was the census, which was regenerated.
- `origin/harden/acct-b-p02` does **not** contain `02a5c75a8`, the 429 status-only fix. Only `origin/harden/acct-b-p01` has it. I merged `origin/harden/acct-b-p01` too (`9d3fa8fff`). Again the census was the only conflict, and it was regenerated. forgent-6a has been told.
- Diff base for this phase: `9d3fa8fff`.

## Commits (on top of 9d3fa8fff)

- `0ccfd2337` test: red. The provider signal dates a quarantine, and every fault leaves an audit line.
- `59c0ea562` feat: settle plumbing, classifier dating, audit log, the leaf module move, and the census.
- `17961fb43` docs: subcomponent spec, RunResult contract line, decision note.
- `b58c5b849` test: the reconcile import-closure pin names the new leaf.

## What changed

- `providerStopOf` returns `{adapterOutcome, cause, signal}`. `signal` is `receipt.providerSignal ?? null`, set only for the three provider stops. The cause table is now a `Map`, so a name like `constructor` cannot match through the object prototype.
- `settleRunOutcome` takes `providerSignal`. `failureOverride` carries it when present, which gives `classification.failure.providerSignal`.
- Deleted: the `capacityEvidenceText` argument, `SCREEN_EVIDENCE_LINES`, and the stderr input to the classifier.
- `classifyProviderCapacityFault({provider, adapterOutcome, structuredAgent, stopCause, providerSignal, now})`. A quota stop's `until` is chosen in this order:
  1. `requestedWaitMs`, when it is a positive number;
  2. else the `resetHint` window (`resets in …`);
  3. else the `resetHint` clock time (`try again at …`);
  4. else 1 h.
- **Bound: 24 h, applied by clamping** to both the requested wait and the hint window. The wait and the hint come from the CLI's last words, and the agent can print those too. A day covers the longest window a provider resets on per request (a daily quota). A weekly limit is hit again by the next real run after the day and quarantines again, at the cost of one failed round per day.
  - Why clamp rather than discard: an over-long real value still means a quota stop, and dropping it to 1 h would retry an exhausted account sooner.
  - The clock form can never exceed 24 h anyway.
- New `recordProviderAccountFault` in `provider-capacity.mjs`. Under the state lock it quarantines when the classifier says so and queues one `provider-capacity-audit.v1` record. The record is `{action: "fault", at, provider, accountId, reasonCode, quarantine: {kind, until?} | null, providerSignal | null, runId, assignmentId}`. It is written only for `quota-limit`, `auth-token` and `provider-error`.
- `quarantineProviderAccount` and the fault path share `setQuarantine`. The quarantine `detail.kind` was `provider-stderr-classifier`, which is now false, so it is `provider-stop`. Nothing reads it.
- How the audit log is written:
  - `writeState` takes everything queued in `state.audit` and appends it to `<runtimeDir>/audit.jsonl` (`providerCapacityStatePaths().auditPath`) before it writes `state.json`.
  - `state.json` no longer has an `audit` field.
  - A legacy array is moved once, on the next write.
  - A record the log refuses (for example a full disk) is dropped with one stderr warning, and the state is written anyway: the log is evidence, not state, so the audit never blocks a lease (changed after forgent-6a's review; the first version kept refused records in `state.json` as a retry queue).
  - A crash between the append and the state write moves an old `state.json` history again: a duplicate line, never a lost one.
  - The three existing writers (`readState` corrupt resets, `clearProviderAccountQuarantine`, `probeQuarantinedAccounts`) are unchanged at their call sites: they push to the queue, and the queue now ends up in the log. `readState`'s `Array.isArray(parsed.audit)` is the one reader kept, for legacy entries only.
- `inspectProviderCapacity` output is unchanged.
- `appendFaultRecord` and `FAULT_LOG_MAX_BYTES` moved to the kernel leaf `src/util/capped-jsonl-log.mjs` (fs/path only), which is registered in `docs/architecture-manifest.json`. `invocation-fault-log.mjs`, `approve-fault-log.mjs` and `provider-capacity.mjs` all import it from there, and there is no re-export.

## Incident #17

A pane receipt `terminal:blocked:usage-limit` with `providerSignal {status: 429, statusWord: RESOURCE_EXHAUSTED, requestedWaitMs: 1800000}` on gemini/tetcu72 settles as follows:
- `failure {provider, provider-limit, cause: quota, providerSignal}`;
- the account is quarantined until settle time + 30 min.

This is proved through the real `settle-attempt` entry in `attempt-steps.test.mjs`. The pane text → `requestedWaitMs` step is P01's vector.

## Owning proofs

| Behaviour | Proof |
|---|---|
| receipt signal → `failure.providerSignal`, cause unchanged, #17 quarantined 30 min | extended `a pane seat stopped at its deadline … quarantined for the wait the provider asked` (attempt-steps) |
| `providerStopOf` carries the signal on provider stops only | extended `the receipt reason names the provider stop …` (attempt-steps) |
| one `fault` line per fault, no `audit` field in state.json | extended `a pane seat the supervisor stopped on a dead login quarantines …` (attempt-steps) |
| dating order: wait > hint > default | rewritten `H1: a quota stop whose provider signal names no wait and no reset …`, `a quota quarantine lasts as long as the provider says …`, `a quota quarantine ends at the wait the provider requested before the reset it named …`, clock-time case (provider-capacity) |
| 24 h bound, a non-number wait is ignored | new `a provider wait or reset longer than a day quarantines for a day …` (provider-capacity) |
| an unwritable audit log drops its record with one warning; the state is still written, with no `audit` field | new `an audit log that cannot be written drops its record …` (provider-capacity), added after review; no test owned the earlier retry fallback, which is removed |
| legacy array moved once | new `a fault history left in state.json moves to the audit log once …` (provider-capacity) |
| capped append | unchanged, `test/observe/invocation-fault-log.test.mjs` (import path only) |

Retired (no test deleted):
- the stderr text arm of the H1 reset-window case, and the screen arm of the old `ends its quarantine at the reset time its screen printed` case. Both are now owned by the rewritten signal cases above.
- the `capacityEvidenceText` input of the dead-login classifier case, whose behaviour is gone. That case now passes a `resetHint` and still asserts there is no `until`.

The clock-time case also asserts the minutes now. Before, it passed by accident because the 1 h default from 17:00 is also 18:00.

## Files outside the phase list (necessary, reported)

- `test/runner/provider-quarantine-probe.test.mjs`, `test/runner/dispatch-reconcile-operation.test.mjs` and `test/runner/assignment-dispatch.test.mjs` each read `state.audit` and now read `audit.jsonl`. The proofs are unchanged.
- `test/runner/dispatch-reconciliation-import-graph.test.mjs` pins reconcile's exact import closure, and the new leaf is a reviewed addition to it.
- `docs/platform/agent-coordination/contracts/assignment-run-runresult.md` gets one sentence naming `failure.providerSignal`. The plan lists that field as a P04 contract change; the file is P03's, and P03 is already in my base.

## Gates

| Gate | Result | Log |
|---|---|---|
| focused: attempt-steps, provider-capacity, provider-pool-lease, invocation-fault-log, architecture, terminal-fallback, provider-auth-failure, quarantine-probe, dispatch-reconcile-operation, assignment-dispatch | 219 pass, 0 fail | `/dev/shm/acct-b-p04-green1.log` |
| architecture, doc-health, citation drift | 90 pass, 0 fail | `/dev/shm/acct-b-p04-docs.log` |
| one-door scan | 0 undeclared sites, count unchanged (census hashes only) | `/dev/shm/acct-b-p04-scan.log` |
| full npm test #1 (before the closure pin) | 2 fail, both in `dispatch-reconciliation-import-graph` (the new leaf); no ERROR lines | `/dev/shm/acct-b-p04-full1.log` |
| reconciliation import graph after the fix | 25 pass, 0 fail | `/dev/shm/acct-b-p04-importgraph.log` |
| full npm test #2 | 8830 pass, 2 fail: `claim-port` (file timeout at 601 s, which is the ERROR line, plus one leaked `fgos-tp-*` dir from the kill) and `mailbox-live-confined` orphan sweep. Both are known load flakes, untouched by this phase, and both passed in run #1 | `/dev/shm/acct-b-p04-full2.log` |
| flakes rerun alone | mailbox-live-confined 19/0, claim-port 21/0 | `/dev/shm/acct-b-p04-flake-mailbox.log`, `/dev/shm/acct-b-p04-flake-claimport.log` |
| Rust | not touched by this phase; no cargo gate | - |

`git diff --stat 9d3fa8fff..HEAD`: 18 files, no unexpected deletions.

## Net size

- Node src: +173 −100, net +73. Tests: +96 −45.
- The plan estimated about +10. The difference is `recordProviderAccountFault` (about 35 lines; the plan's "+35" assumed a thinner audit path) and the doc comments on the bound and the queue. No feature beyond the requirements.

## CHANGELOG line (proposed, under the new [Unreleased])

- A quota quarantine now ends when the provider asked (for example "Provider requested 1800000ms wait" quarantines for 30 minutes), else at the reset it named, else after an hour, and never later than a day. Every provider fault leaves one line in `provider-capacity/audit.jsonl`, where manual clears and probe unlocks also go; `state.json` no longer keeps an `audit` list.

## Authority

- No locked law changed and no D-ADR was minted. The narrative is a dated note in `docs/platform/runner/decisions/h-36d872fbb0e5.md`.
- Seat Binding's capacity adapter stays the one owner of quarantine and its history. The receipt is the one judge of the stop and its signal.

## Lessons

- A brief's claim about which branch carries a commit is worth a `git merge-base --is-ancestor` before building: p02 did not carry p01's last fix.
- Using the in-memory `state.audit` as an append queue that `writeState` flushes moved all three writers and the legacy migration with no change at their call sites.
- A test pinned to a coincidence (default 1 h from 17:00 = 18:00) stayed green without the behaviour; assert the full value.
- Exact import-closure pins (`dispatch-reconciliation-import-graph`) catch a new kernel leaf only in the full suite; add them to the focused set when an import moves.
