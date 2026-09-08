# Cell P03.1 — Doer Report: Human-Turn Trusted-Input/Decision Door

Phase: `plans/260905-architecture-advisory-panel/phase-03-minimal-hard-shell-and-protocol.md`, Cell P03.1
Gap closed: P02.1's Table 4 `BL4` row / Table 2 `new-hard-capability` row (`docs/architect/agent-coordination/verification/architecture-advisory-panel/P02.1.md`)
Branch: `group-thinking-plan-loop` (verified before every commit)

## GitNexus Impact Analysis (run first, before editing anything)

Index was stale (`gitnexus status`: "Indexed: 9/3 ... stale"). Repaired the
corrupt FTS index (`gitnexus analyze --repair-fts`, a real infra failure
unrelated to this cell) then ran a fresh full `gitnexus analyze`
(35,096 nodes | 48,717 edges | 838 clusters | 300 flows, 27.3s). Multiple
repos were indexed, so every call below names `--repo /home/vantt/projects/forgentX`
after cross-checking `gitnexus list`'s own absolute scan-root field (per
this repo's own multi-target-resolution rule, tsk-5nz) — never a guessed
label from the disambiguation error text.

Raw tool output for every call: `proofs/P03.1/impact-*.log`.

| Symbol | direction | impactedCount | risk | Why LOW/HIGH/CRITICAL is not alarming here |
|---|---|---|---|---|
| `validateEventPayload` (schema.mjs) | upstream | 54 | CRITICAL | High fan-in (13 direct callers, 10 processes) because every event kind in the whole coordination kernel funnels through this one validator. My only change is one new `if (field === 'attributedTo')`/`'recordedBy'`/`'turnOrdinal'` branch and one new `EVENT_SPECS['human-turn-recorded']` entry — every existing kind's own branch is untouched, so existing behavior for those 54 impacted callers is unaffected (confirmed by the full 728/728 focused pass and the 728-test suite showing zero new failures). |
| `assertDispositionRefOwnedBySession` (store.mjs) | upstream | 9 | HIGH | 3 direct callers (`recordDriverDisposition`, `recordContributionLink`, my new `recordHumanTurn`). Added one new `if (ref.startsWith(HUMAN_TURN_REF_PREFIX))` branch and a new `humanTurnIds` opt-in parameter (defaults to an empty `Set`) — a caller that never passes it (none of the pre-existing 3 call sites in this function's OWN body did before I updated `recordDriverDisposition`'s own two calls to build and pass it) sees byte-identical behavior for every non-`human-turn:` ref. |
| `recordDriverDisposition` (store.mjs) | upstream | 0 | LOW | Zero upstream callers inside `src/runner/coordination/**`/`src/verbs/coordination/**` per GitNexus's own graph (its only real caller, `run.mjs`'s disposition-step branch, was unchanged by this cell). |
| `replaySession` (replay.mjs) | upstream | 39 | CRITICAL | Same story as `validateEventPayload`: this is THE read reconstruction every coordination consumer (show, engine doors, the whole test suite) calls. My additions are one new `else if (event.type === 'human-turn-recorded')` branch (never taken for any pre-existing kind) and one new check inside the PRE-EXISTING `driver-disposition-recorded` branch, gated on `event.payload.targetRef.startsWith(HUMAN_TURN_REF_PREFIX)` — a targetRef that is not `human-turn:`-prefixed (every pre-existing disposition ever recorded) takes the identical code path as before. |
| `validateSteps` (verbs/coordination/schema.mjs) | upstream | 9 | HIGH | One direct caller (`validateCoordinationRequest`). Added one new `if (step.type === 'human-turn') return validateHumanTurnStep(step, i);` branch and updated the closed-vocabulary error message text (which two PRE-EXISTING tests asserted verbatim — both updated in this cell, see Tests section). |
| `runCoordinationUseCase` (verbs/coordination/run.mjs) | upstream | 6 | LOW | Added one new `else if (step.type === 'human-turn')` branch inside the existing steps loop; every other branch (`operation`/`authorize`/`disposition`/`contribution`/fan-out `else`) is untouched. |

**Verdict:** every touched function's risk label reflects pre-existing fan-in
breadth (these are shared kernel choke points by design), not new risk this
cell introduces — confirmed empirically, not merely asserted, by the zero-
new-failures full-suite run below.

## What Was Implemented, Per File

### `src/runner/coordination/schema.mjs`
- New `EVENT_SPECS['human-turn-recorded']`: required
  `['turnId','turnOrdinal','channel','artifactRef','revision','externalRef','attributedTo','recordedBy']`,
  accepted = required + `respondsToRefs`.
- New `validateAttributedTo` validator: `{type: 'person', id}` only, no
  classification field (per the phase's "no heuristics as enums" rule).
- `recordedBy` reuses the existing `validateAuthorizedBy` (same `{type:
  'driver', id}` shape), wired into `validateEventPayload`'s shared
  `authorizedBy`/`validatedBy`/`linkedBy` branch alongside the new
  `recordedBy` field name.
- `turnOrdinal` reuses the existing `isPositiveInteger` check, wired
  alongside `maxAssignments`/`expiresAfterRound`.
- `respondsToRefs` added to the existing shared
  `OPTIONAL_STRING_ARRAY_FIELDS` set (never legalized on any OTHER kind's
  own `accepted` list, per that set's own documented discipline).
- New export `HUMAN_TURN_REF_PREFIX = 'human-turn:'`.
- **No existing event kind's own required/accepted list, validator branch,
  or error message was touched.**

### `src/runner/coordination/store.mjs`
- New `recordHumanTurn(coordinationId, payload, opts)`, modeled byte-for-
  byte on `recordSpecialistAuthorization`/`recordDriverDisposition`: shape
  validate → `withEventsLock` → `assertSchemaVersionCurrent` → require
  `status === 'active'` → `assertDriverIdentity(manifest, recordedBy, {fieldName: 'recordedBy'})`
  → every refusal named in the task → idempotent-on-identical-payload
  append.
- Refusals implemented and tested: `attributedTo.id === recordedBy.id`;
  `attributedTo.id` in `manifest.actors[].id`; `attributedTo.id` shaped
  like `asgn_`/`contribution:`/`human-turn:`; `turnOrdinal !== max+1`;
  `externalRef` reuse; `turnId` reuse with different payload (hard
  `duplicate-ref`) vs. identical payload (idempotent `{appended: false}`).
- `assertDispositionRefOwnedBySession` extended with an opt-in
  `humanTurnIds` set (defaults to empty `Set`, so every pre-existing call
  site with no `human-turn:` refs is unaffected): a `human-turn:<id>` ref
  must name a turn this session actually recorded (`dangling-ref`
  otherwise); a bare `turnId` matching one of this session's own recorded
  turns is refused as a near-miss (same discipline `contribution:` already
  has).
- New `recordedHumanTurnIds(events)` helper, next to `linkedContributionIds`.
- `recordDriverDisposition` now builds `humanTurnIds` from a fresh
  lock-held `readEvents` and passes it through to both its `targetRef` and
  `evidenceRefs[]` ownership checks — a disposition can legally cite a
  `human-turn:` ref as its decision basis.

### `src/runner/coordination/replay.mjs`
- New `humanTurns`/`ignoredHumanTurns` reconstruction, mirroring the
  `specialist-authorized`/`aggregation-validated` pattern exactly: a turn
  recorded after a terminal event is neutralized into `ignoredHumanTurns`,
  never silently dropped and never thrown.
- Independent re-validation (defense in depth, per the task's own
  requirement — "don't just trust the writer validated it once"):
  `recordedBy.id !== manifest.provenanceRoot.writerId` → `foreign-ref`;
  `attributedTo.id === recordedBy.id` → `validation`; `attributedTo.id` in
  `manifest.actors[]` → `validation`; non-contiguous `turnOrdinal` →
  `validation`; duplicate `turnId` → `duplicate-ref` (unconditional, same
  posture as `aggregation-validated`/`specialist-authorized`'s own
  duplicate-id checks — store.mjs never appends a second event for an
  idempotent repeat, so ANY duplicate on disk is a hand-crafted log);
  duplicate `externalRef` → `duplicate-ref`.
- `driver-disposition-recorded`'s existing branch gained one new,
  unconditional (not gated on `!terminalSeen`, unlike the pre-existing
  `contribution:` resolution logic immediately below it — this is a
  referential-integrity/fabrication-resistance check, not a "did this
  resolve anything" question) check: a `human-turn:` targetRef naming a
  turn not yet walked at that point in the log → `out-of-order-ref`.
- Artifact/external refs are never opened from disk during replay (kept
  pure, per the task's explicit instruction) — `revision` was already
  computed at write time by `run.mjs`; replay only checks internal
  log consistency.
- Return object gained `humanTurns`/`ignoredHumanTurns`, both frozen
  arrays, alongside the pre-existing `authorizations`/`aggregations`/etc.

### `src/verbs/coordination/schema.mjs`
- New step type `'human-turn'`, allowed keys exactly `type, as, turnId,
  turnOrdinal, channel, artifactRef, externalRef, attributedTo,
  respondsToRefs` — deliberately no `revision`, no `recordedBy`, per the
  task's explicit instruction.
- `attributedTo` validated `{type: 'person', id}` only (`assertSafeId` on
  `id`, matching this module's own charset discipline for every other id).
- **Deviation from my own first draft, corrected before commit:**
  `respondsToRefs` entries are validated as BARE turn ids
  (`assertSafeId`), not the `human-turn:`-prefixed / `$ref:`-resolvable
  shape I initially wrote with `assertSafeRefOrId`. Reason: a colon is
  outside this module's `SAFE_ID_RE` charset (so a literal
  `"human-turn:turn_1"` value is unconditionally rejected as a "path
  escape" at the request boundary, confirmed by a real test failure before
  I caught it), AND a human-turn step never gets a `labels[step.as]`
  entry (no Assignment materializes), so there is no `$ref:` an entry
  could ever resolve through either. Fixed to mirror the SAME shape a
  `contribution` step's own `anchors`/`respondsTo` already take (bare
  ids, engine adds the meaning) — `run.mjs` now prefixes each bare id with
  `HUMAN_TURN_REF_PREFIX` before calling `recordHumanTurn`. Documented as
  a named, pre-existing-pattern-consistent narrowing in the contract doc
  (it mirrors an ALREADY-EXISTING, already-disclosed gap: a literal
  `contribution:`-prefixed disposition `targetRef`/`evidenceRefs` value
  was never reachable through this request boundary either, before this
  cell existed — not a new limitation this cell introduces).
- Closed-vocabulary error message updated to name all SIX step types; two
  PRE-EXISTING tests asserting the old five-type message verbatim were
  updated (see Tests section) — no other behavior of any existing step
  type changed.

### `src/verbs/coordination/run.mjs`
- New `else if (step.type === 'human-turn')` branch: resolves `artifactRef`
  against `ctx.cwd` (`path.resolve` — this module had no pre-existing
  file-based-ref resolution helper to reuse, confirmed by reading the
  whole file; "otherwise resolve relative to cwd" per the task's own
  instruction), reads the real bytes with `fs.readFileSync`, throws a
  named `StoreError('validation', ...)` on `ENOENT`/`EISDIR` naming the
  resolved path, computes `revision = 'sha256:' + hex digest`, maps each
  bare `respondsToRefs` entry to `HUMAN_TURN_REF_PREFIX + id`, and calls
  `recordHumanTurn` with `recordedBy` derived from `request.writerId`
  exactly the way `authorize`/`disposition`/`contribution` steps already
  derive their own driver identity.
- No `labels[step.as]` entry (matches `authorize`/`disposition`/
  `contribution` — no Assignment materializes).
- Header comment updated ("TWO deliberate exceptions" → "THREE") to keep
  the module's own documented import-boundary reasoning accurate.

### `src/verbs/coordination/show.mjs`
- New `renderHumanTurn` + `humanTurns`/`ignoredHumanTurns` fields on the
  returned payload, rendered from `coordinationState.humanTurns`/
  `ignoredHumanTurns` — its own labelled section, never merged into
  `dispositions` or any other list (verified by a dedicated test asserting
  `!('turnId' in shown.dispositions[0])`).

### `docs/architect/agent-coordination/contracts/coordination-session.md`
- New Event Log table row for `human-turn-recorded`.
- New "Human Turn Provenance (Phase 03.1, Architecture Advisory Panel
  track)" section: what the event pins, every refusal, and the full T1-T8
  threat table (below).
- 3 new bullets in "Required Negative Tests".
- Header "Implementation:" note updated to cite this cell and this report.

### `CHANGELOG.md`
- One `## [Unreleased]` → `### Added` entry.

## Tests First — Files And Counts

1. **`test/runner/coordination-human-turn.test.mjs`** (NEW, 24 tests, all
   pass) — store-level door tests: happy path, idempotent repeat,
   immutability, every T1 attributedTo-shape refusal (self, panel actor,
   `asgn_`/`contribution:`/`human-turn:`-shaped id), ordinal gap/reuse/
   sequence, externalRef reuse, foreign `recordedBy`, terminal-session
   refusal, schema-level `attributedTo` shape refusals, missing-required-
   field refusals, `respondsToRefs` ownership (valid/dangling/bare-near-
   miss), and `recordDriverDisposition` citing a `human-turn:` ref
   (accept + two dangling-ref refusals).
2. **`test/runner/coordination-replay.test.mjs`** (+11 new tests, all
   pass) — replay-time INDEPENDENT re-validation against hand-crafted logs
   that never went through `recordHumanTurn`: clean reconstruction, foreign
   `recordedBy`, self-attribution, panel-actor attribution, ordinal gap,
   duplicate `turnId`, duplicate `externalRef`, and the disposition
   `human-turn:` out-of-order-ref case (both the refusal and the legal
   in-order case).
3. **`test/verbs/coordination-run-driver-steps.test.mjs`** (+~19 new
   tests, all pass) — request-boundary schema tests (unknown/missing
   fields, `attributedTo` shape, path-escaping `turnId`, normalization,
   `respondsToRefs` bare-id charset) AND real end-to-end
   `runCoordinationUseCase` proof: revision computed from real file bytes
   (byte-for-byte compared against an independently-computed
   `createHash('sha256')` in the test itself), missing-artifact-file
   failure, self-attribution/panel-actor refusal reaching the REAL engine
   door (not just schema), `respondsToRefs` bare-id-to-prefixed-ref
   resolution end to end, and `show` rendering `humanTurns` as its own
   section. Also updated the pre-existing "unknown-step-type message
   names all five supported types" test to six types (the message text
   changed; no other assertion in that test changed).
4. **`test/verbs/coordination-group-thinking-nominal-group-lite-pack.test.mjs`**
   — one PRE-EXISTING test asserted the same old five-type message text
   verbatim (a "link" step rejected by the closed vocabulary); updated to
   the new six-type text. No other change to that file, no change to its
   own subject (nominal-group-lite pack behavior is untouched).

## Real Command Output — Focused Suite

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' \
  'test/verbs/coordination-*.test.mjs' \
  'test/cli/coordination.test.mjs' \
  'test/architecture.test.mjs'
```

**Result: 728 tests, 728 pass, 0 fail.** (P02.1's own baseline for this
exact command was 680/680 before this cell; +48 net new tests across the
three files above, zero regressions.) Full raw log:
`proofs/P03.1/focused-suite-run.log`.

## Real Command Output — Full `npm test`

**Result: 5666 tests, 5656 pass, 4 fail — 0 NEW failures.** Full raw log:
`proofs/P03.1/full-test-run.log`. The 4 failures are EXACTLY the track's
own recorded baseline (`index.md`'s Baseline section: legacy durable-doing
ask/answer, docs-index missing-quadrant, 2 resume-example placeholder
chars, 1 live-executor flake), confirmed by matching file/test name and
failure shape one by one:

1. `test/cli/fgos-intake-4.test.mjs:318` — legacy durable-doing ask/answer
   seq-number drift (unrelated state-store test, pre-existing).
2. `test/report/enduser-index.test.mjs:187` — docs-index missing-quadrant
   fixture assumption (`docs/tutorials` now exists; pre-existing, unrelated
   to coordination).
3. `test/runner/codex-cli-glm-cli-live-executors.test.mjs:68` — live
   executor flake (a real network-dependent dispatch test; unrelated).
4. `test/setup/coordination-doctor-check.test.mjs:42` — the track's own
   already-disclosed resume-example placeholder-char gap (`grantedContextRefs`
   in two shipped example JSON files literally contains a human-readable
   placeholder string, not a real ref) — pre-existing, not touched by this
   cell, and not a `human-turn` example.

No test in this list mentions `human-turn`, `recordHumanTurn`, or any file
this cell touched.

## `detect_changes` Output

The GitNexus MCP tool was not present in this session's tool manifest;
used the CLI equivalent (`gitnexus detect-changes`), same underlying
mechanism, against the SAME multi-repo-disambiguated target.

**`--scope compare --base-ref main`** (as the task literally specified):
252 files, 1387 symbols, risk CRITICAL. This reflects the WHOLE branch's
divergence from `main` (this branch already carries the entire
`group-thinking-plan-loop` history ahead of `main`, unrelated to this
cell) — not a useful signal for THIS cell's own blast radius on its own.
Raw output: `proofs/P03.1/detect-changes-vs-main.log`.

**`--scope all`** (working-tree diff against `HEAD`, isolating exactly
this cell's own uncommitted work before the AGENTS.md/CLAUDE.md GitNexus-
stats churn from the `analyze` run above was reverted): **9 files, 27
symbols**, risk CRITICAL (same fan-in-driven label as the `impact` calls
above — `replaySession`/`validateEventPayload`/`assertDispositionRefOwnedBySession`
are shared choke points). Every listed changed symbol
(`replaySession`, `validateEventPayload`, `EVENT_KINDS`,
`OPTIONAL_STRING_ARRAY_FIELDS`, `assertDispositionRefOwnedBySession`,
`recordDriverDisposition`, `linkedContributionIds`, ... — see full log)
maps to a file this report names above; nothing unexpected (no
Assignment/dispatch/Work-lifecycle file) appears. Raw output:
`proofs/P03.1/detect-changes-isolated-diff.log`.
Investigated before trusting: cross-checked the "CRITICAL" label against
the actual full-suite pass rate (5656/5660 non-baseline tests, i.e. every
non-pre-existing-failure test green) rather than treating the label alone
as a verdict, per this repo's own "a suspicious answer is worth a
cross-check" doctrine.

## Threat Model — T1 Through T8

Full narrative and mechanism column in the contract doc's new "Human Turn
Provenance" section; summarized here as instructed:

| # | Threat | Status |
|---|---|---|
| T1 | Driver-authored artifact/actor identity occupies the human-decision slot | **Closed** |
| T2 | A recorded human turn is silently edited/overwritten | **Closed** |
| T3 | One real turn replayed/duplicated as two | **Closed** |
| T4 | Turns inserted out of order / ordinal gaps or reuse | **Closed** |
| T5 | A disposition cites a fabricated/non-existent human turn | **Closed** |
| T6 | The coordinator process itself fabricates the underlying artifact | **Open, by design — cannot be closed in-process** |
| T7 | Crash/race during recording leaves a partial/duplicated ledger entry | **Closed** |
| T8 | A hand-crafted/corrupted `events.jsonl` presents a forged event | **Narrowed, not fully closed** (a forger who also holds the real driver identity and mirrors every checked shape exactly is not structurally distinguishable — same disclosed residual `aggregation-validated`/`specialist-authorized` already carry) |

T6 is the one this cell's own task briefing named explicitly as
out-of-scope for any in-process mechanism, and this report says so
plainly rather than papering over it: the coordinator process and every
mechanism this cell adds run at the SAME OS-user privilege level, so no
kernel change here (or anywhere in this codebase) can prevent the process
from writing a fabricated artifact and citing it. What changed is that
doing so now leaves a permanent, immutable, driver-attributed record
naming a specific artifact revision — a real forensic trail, not
invisibility.

## What I Could Not Fully Verify

- The GitNexus MCP tool itself was unavailable in this session (only the
  CLI). Used the CLI's own `impact`/`detect-changes` subcommands, which
  the project's own doctrine text treats as the "not present" degraded
  path's remedy — but I could not compare CLI vs MCP output shape
  side-by-side to confirm they are byte-identical.
- The `--scope all` "isolated diff" comparison's own semantics (diff
  against `HEAD`, not a clean "just my commits" comparison) is my own
  reading of the CLI help text, not independently documented anywhere I
  found; treated its 9-file/27-symbol result as corroborating evidence
  alongside the full test suite, not as sole proof.
- I did not attempt to reproduce the pre-existing `codex-cli-glm-cli-live-executors`
  flake a second time (network-dependent, and the track's own baseline
  already names it as a known flake) — took the single run's match against
  the recorded baseline description as sufficient.

## Optional Design Item Deliberately Deferred

The design brief's "Optional but cheap" instruction to let
`grantedContextRefs` (an `authorize` step's own context grant) resolve
`human-turn:` refs would require editing `assertRefsOwnedBySession` in
`src/runner/coordination/session-engine.mjs` — a file NOT named among this
cell's own File Ownership list, and today that function flatly REFUSES
the sibling `contribution:` namespace for the same reason a human turn
would need special-casing (a contribution/turn carries no dispatchable
artifact content of its own in the SAME sense a produced work-product
does — the turn's `artifactRef` is real bytes, but the existing refusal's
own stated reason is "not a grantable context ref", a broader claim than
"has no content"). Deferred rather than expanding scope into an
un-owned file for an explicitly optional line item; named here rather than
silently dropped.

Status: DONE
Summary: Implemented the `human-turn-recorded` event, its `recordHumanTurn` write door, replay-time independent re-validation, the `human-turn:` disposition ref namespace, and the `human-turn` request-step type across schema/store/replay/verbs-schema/run/show — 48 new tests (all passing), 728/728 focused suite, and the full `npm test` shows the exact same 4 pre-existing baseline failures with zero new ones.
Concerns/Blockers: None blocking. One optional design item (context-grant resolution of `human-turn:` refs) deliberately deferred as out-of-file-ownership scope, named above rather than silently dropped.
