# RESEARCH.md — tsk-3rn (Spike: concrete consumer for AgentMessage/DispatchAssignment)

## Round 1 — 2026-08-26 (discovery stage, fgos-coding-discovering via fgos-researching)

Redone under id `tsk-3rn` after the original `tsk-67t2` attempt's events were
lost to a live `.fgos/events.jsonl` truncation mid-session (tracked
separately as `tsk-46v`) and its id was left permanently colliding with an
orphaned runtime claim (`generateId` hashes the title; resubmitting
identical text reproduced the same `tsk-67t2` id, which `fgos pick` then
refused — claimed by a stale claim record the durable event loss never
cleared). This item's title was reworded to get a fresh, non-colliding id;
the underlying research below is unchanged from the original round, since
it depends only on `tsk-5x7` and the current repo state, neither of which
changed between attempts.

**Asked:** two questions needed to judge whether this item's own scope is
clear enough to skip `exploring` and move straight to `planning`:
(1) does this repo have a precedented convention for a *real* (non-
placeholder) `verify` field on a docs-only/research-only work item with no
code/tests, and (2) is `docs/history/dispatch-plan-protocol-redesign/
plan.md`'s "Deferred | Pull-in condition" table still the current,
undelivered state, or has any child of `tsk-5x7` already shipped one of
those four deferred pieces since delivery.

**Checked / found:**

1. **`verify` convention.** `src/intake/discovery.mjs:101-103`
   (`hasRealVerify`) is the only mechanical gate on a `verify` string: it is
   "real" iff non-empty and does not start with the placeholder prefix
   `"chưa xác định —"`. There is no shape requirement — no `node --test`/
   grep/shell-runnable form is mandated. `src/intake/verify-pattern-check.mjs`
   (`judgeVerifySemanticCorrectness`) only fires a specific check when the
   proposed text itself references `node --test`/`--test-name-pattern`
   (guards against a known vacuous-pass shape,
   `docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md`) —
   irrelevant here since this item's own scope has no test suite. A
   grep across `bin/fgos.mjs` found no site that `exec`s/spawns the
   `verify` string at `return` time — it is read and reported, not
   shelled out to, so a prose description of what evidence counts as
   passing (file/line citations in a written report) is a precedented,
   real verify, not a special case needing invention.

   Item tsk-3rn's *current* stored `work.verify` is
   `"chưa xác định — P15 bổ sung"` — matches the placeholder prefix exactly,
   so `hasRealVerify()` is `false` today even though the item's own
   `description` already states the intended verify in prose. This
   `discover --verdict clear` call supplies that prose as the real
   `--verify` value.

2. **Is the deferred table still current?** `grep -rln "AgentMessage|
   DispatchAssignment" src/` and `grep -rln "class Mailbox|ArtifactRef|
   artifact.store" src/` both return **zero files** — no implementation
   exists anywhere in `src/`. `git log --oneline --all -i --grep=
   "AgentMessage|DispatchAssignment|mailbox"` returns exactly one commit
   (`ebdf69d5`, a docs-only update to
   `docs/architect/dispatch-control-plane-redesign.md`) — no code commit.
   The three real children `tsk-5x7` split into (D6,
   `docs/history/dispatch-plan-protocol-redesign/plan.md`) are confirmed
   by `docs/history/tsk-5x7-{1,2,3}/plan.md`:
   - `tsk-5x7-1` — piece 0, `decide --for` fix + minimal `DispatchPlan`
   - `tsk-5x7-2` — piece 1, declared-egress governance
   - `tsk-5x7-3` — piece 2, `herdr-spawn` adapter (protocol untouched)

   None of the three touch `AgentMessage`, `ArtifactRef`, or mailbox/Herdr
   transport — `tsk-5x7-3`'s own plan.md is explicit that the adapter keeps
   "today's prompt/stdout contract" and introduces "no new result protocol
   and no telemetry claim". The Deferred | Pull-in-condition table (4 rows:
   `StructuredDispatchResult`+confidence reader, artifact store, AgentMessage
   envelope, mailbox/Herdr transport) is confirmed **still the current,
   undelivered state** as of this session — nothing has pulled any row in.

**Still open (belongs to tsk-3rn's own `executing` stage, not this
discovery pass):** whether a real consumer exists TODAY among the four
candidates the item's own description names (Herdr async handoff, dashboard
replay, compliance report, external provider) — this round only established
that no implementation has shipped; it did not yet survey each candidate's
own current need. That is the spike's actual deliverable, done at
`executing`.

**Verdict: clear.** Both discovery-stage ambiguities (verify shape, table
currency) are resolved by direct evidence above; no open question needs a
person before `planning`.

## Round 2 — 2026-08-26 (executing stage, consumer candidate research pass)

Repo-search-first survey of each of the four named candidate consumers for `AgentMessage` / `DispatchAssignment` / mailbox / artifact refs:

1. **Herdr async handoff**
   - **Surveyed**: `herdr-plugin/src/` (gateway, MCP, pane scanner) and `src/runner/dispatch/transport.mjs` (`herdrSpawnAdapter`).
   - **Findings**: `herdrSpawnAdapter` and `herdrSpawnInteractiveAdapter` (`src/runner/dispatch/transport.mjs:881-1327`) manage worker execution inside Herdr terminal panes via `herdr pane split`, `herdr pane run`, and `herdr pane wait-output`. Execution status and completion are observed by matching a unique process exit sentinel in terminal scrollback and returning the standard status/stdout/stderr result shape. All gateway REST API endpoints (`herdr-plugin/src/gateway.rs:400-441`) execute CLI commands via `spawn_fgos_verb` (`fgos <verb> --json`). No async question/answer channel, mailbox, or envelope protocol exists or is requested in the Herdr integration (`docs/history/tsk-5x7-3/plan.md:27-30`).

2. **Dashboard replay**
   - **Surveyed**: `docs/history/*dashboard*/`, `herdr-plugin/src/gateway.rs`, `herdr-plugin/src/pane_scan.rs`, `src/runner/dispatch/result-ladder.mjs`.
   - **Findings**: The Herdr dashboard reads state digests from `/v1/work*` REST endpoints (`herdr-plugin/src/gateway.rs:612-638`) and active pane tracking from `herdr pane list` (`herdr-plugin/src/pane_scan.rs:1-120`). Out-of-process dispatch results are normalized using the 3-rung result ladder (`src/runner/dispatch/result-ladder.mjs:1-55`: reported adapter output, legacy `[DONE]`/`[BLOCKED]` token signal, and inferred `outcome: 'unsignaled'` with `headBefore`/`headAfter` git SHAs). No dashboard component reads or replays structured `AgentMessage` or `DispatchAssignment` envelope history.

3. **Compliance report**
   - **Surveyed**: `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `docs/history/tsk-5x7-2/plan.md`, `test/runner/egress-governance.test.mjs`.
   - **Findings**: Egress governance (`tsk-5x7-2`, `src/runner/dispatch/resolve.mjs:142-181`, `src/runner/dispatch/transport.mjs:142-181`) evaluates cross-provider egress permissions at executor resolution time using `providerFamily` and `egress {kind, target, content}` descriptors. Governance attestation is recorded directly on dispatch execution events (`src/runner/loop.mjs`). No compliance consumer or report generator reads or requires a message-level audit envelope (`AgentMessage`).

4. **External provider**
   - **Surveyed**: `src/runner/dispatch/config.mjs`, `src/runner/dispatch/transport.mjs` (`EXECUTOR_ADAPTERS`).
   - **Findings**: `EXECUTOR_ADAPTERS` (`src/runner/dispatch/transport.mjs:1323-1327`) registers 3 adapters: `cli-spawn` (argv subprocess), `http` (HTTP fetch), and `herdr-spawn` (Herdr terminal pane). All 3 adapters pass prompt text via command-line arguments or HTTP request body and receive plain text stdout/response body. None of the registered adapters or configured providers require a cross-process message envelope (`AgentMessage` / `DispatchAssignment`) beyond the existing prompt/stdout CLI and HTTP contract.

## Consumer candidates

| Candidate | Evidence (file:line) | Required fields (if a real need was found) | Non-goals |
|---|---|---|---|
| Herdr async handoff | `src/runner/dispatch/transport.mjs:881-1327`, `herdr-plugin/src/gateway.rs:400-441`, `docs/history/tsk-5x7-3/plan.md:27-30` | None (no in-flight async result/question channel needed; standard prompt/stdout + Herdr scrollback exit sentinel suffices) | Building async message channel or mailbox transport for Herdr |
| Dashboard replay | `src/runner/dispatch/result-ladder.mjs:1-55`, `herdr-plugin/src/gateway.rs:612-638`, `herdr-plugin/src/pane_scan.rs:1-120` | None (dashboard consumes state digests via REST API and normalizes execution via 3-rung ladder; no message replay needed) | Inventing structured message store or message replay protocol for web UI |
| Compliance report | `src/runner/dispatch/resolve.mjs:142-181`, `src/runner/dispatch/transport.mjs:142-181`, `docs/history/tsk-5x7-2/plan.md:13-25` | None (egress governance records `providerFamily` and `egress` descriptors directly on dispatch events; no message envelope needed) | Wrapping egress governance audit events in `AgentMessage` envelopes |
| External provider | `src/runner/dispatch/transport.mjs:1323-1327`, `src/runner/dispatch/config.mjs:1-100` | None (all 3 registered adapters — `cli-spawn`, `http`, `herdr-spawn` — communicate via plain prompt/stdout/HTTP body) | Designing cross-process message envelopes for external provider adapters |

**Decision:** defer further

