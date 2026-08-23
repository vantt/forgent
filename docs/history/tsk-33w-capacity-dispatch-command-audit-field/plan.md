# plan.md — tsk-33w: ghi CẢ `command` lẫn `provider` vào event `capacity.dispatch`

Mode: **tiny** (a couple of files, one direct task, no gray areas — the
item's own description already names the exact fix, at exact lines, with
exact rationale and exact verify checks). Flag count: 1 of the 10
(auth/authorization/data-model/audit-security/external-systems/public-
contracts/cross-platform/existing-covered-behavior/weak-proof/multi-domain)
— **audit/security** applies (this item's whole point is closing a gap in
`events.jsonl`'s own audit fidelity). The rest do not: both source changes
are additive-only (no schema/migration, no removed validation, no
cross-provider gate change — confirmed below), single-domain, and the one
existing test this item must touch (`loop.test.mjs:309-343`, see Approach
step 4) is a mechanical widen of a closed-key assertion to match the
additive field, not a behavior change carrying real regression risk — named
explicitly here rather than silently bumping mode for a proof point that is
already fully determined by the additive change itself.

No `CONTEXT.md` exists for this item (no `docsRef`) — `fgos-clarifying`
found intent fully understood from the item's own description and
`discover` moved `clarify -> decompose` directly, skipping
`discovery`/`exploring`, same precedent as `tsk-4eu`
(`docs/history/tsk-4eu-executors-key-tier-validation/plan.md`). This plan's
only source of truth is therefore the item's own description, verified
against the real repo below.

## Verified against the real repo (not taken on faith from the description)

- `src/runner/dispatch.mjs:1005` — `resolveExecutorCommand`'s destructure
  already includes `command` in scope: `const { command, args, adapter,
  provider, baseCommit, headRef } = resolveExecutorCommand(...)` —
  confirmed live.
- `src/runner/dispatch.mjs:1031-1042` — `spawnWorker`'s resolved promise
  maps to `(result) => ({ ...result, templateName, templateHash,
  capacityId, provider, baseCommit, headRef })` — `command` is in scope but
  not returned — confirmed live. Matches the item's description exactly;
  line numbers shifted slightly vs. the description's `:1037` because of an
  intervening unrelated commit (`987c132`, tsk-4eu) that also touched this
  file.
- `src/runner/loop.mjs:744-761` — the `capacity.dispatch` event's `payload`
  carries `id, capacityId, provider, model, baseCommit, headRef` — no
  `command` — confirmed live, matches description (same minor line drift,
  same reason).
- `src/runner/dispatch.mjs:782` — `provider: executor.provider ??
  executor.command` — confirms `provider` is a declared/overridable
  display label, `command` is what actually gets spawned. This is the
  exact distinction the item's own "not a security hole" reasoning rests
  on.
- `src/runner/dispatch.mjs:566-577` — comment already documents `provider`
  as "a freely-overridable display alias, not the command actually
  spawned," and states the cross-provider gate (`allowCrossProvider`)
  checks the resolved `command`, never `provider` — confirms the item's
  claim that the cross-provider gate is unaffected by this change.
- `replay.mjs` ignores unknown event fields/types by design (cited in
  `loop.mjs`'s own comment at `:736-741`) — confirms adding a field to
  `capacity.dispatch`'s payload needs no migration; old events (no
  `command`) stay readable.
- `test/runner/dispatch.test.mjs:1462-1478` — existing precedent test
  `'spawnWorker result carries capacityId and provider alongside every
  existing field...'` (tsk-62v D7) is the direct analog this item's own new
  assertion extends — same additive-field-on-spawnWorker-result pattern,
  `command` slots in next to `capacityId`/`provider`.
- `test/runner/loop.test.mjs:309-343` — existing test `'runOnce logs the
  "<capacityId> — <provider> — <model>" announce line and appends a
  matching capacity.dispatch audit event'` destructures `const {
  baseCommit, headRef, ...rest } = auditEvent.payload;` then asserts
  `assert.deepEqual(rest, { id, capacityId, provider, model })` — a
  **closed**-key shape. Adding `command` to the payload breaks this test
  as-is (the actual `rest` would carry an extra key). **This is the one
  existing test this item must touch** — confirmed by direct read, not
  assumed.

## Approach

Single chained commit (mirrors this item's own "một item, một commit
chuỗi" framing, same shape `tsk-4eu` used for this exact area):

1. `src/runner/dispatch.mjs:1042` — add `command` to `spawnWorker`'s
   returned object: `(result) => ({ ...result, templateName, templateHash,
   capacityId, provider, command, baseCommit, headRef })`. Additive only —
   `command` is already in scope from the `:1005` destructure; no existing
   field removed, no key read positionally anywhere (every consumer reads
   by name).
2. `src/runner/loop.mjs:753-760` — add `command: worker.command` to the
   `capacity.dispatch` event's `payload`.
3. Leave the human-readable announce line at `loop.mjs:742`
   (`` `fgos-runner: ${worker.capacityId} — ${worker.provider} —
   ${worker.model}` ``) untouched. The item's own text proposes adding
   `command` there only conditionally ("CHỈ thêm khi `command !==
   provider`") and explicitly deprioritizes it ("mục tiêu của item là SỔ,
   không phải dòng log"). Leaving it out keeps this item to exactly what
   its own text commits to.
4. Update the one existing test that breaks (`test/runner/
   loop.test.mjs:309-343`): widen the closed-key `rest` assertion to
   include `command: process.execPath` (this test's fixture dispatches
   through `fgos-coding-implement`, whose resolved `command` and `provider`
   are both `process.execPath` in this fixture — not the differing-value
   case, that's covered by the new regression test below).
5. Add two new pinned tests:
   - `test/runner/dispatch.test.mjs` — extend or add alongside the tsk-62v
     D7 precedent test (`:1464`): `spawnWorker`'s result carries `command`
     alongside every existing field (item's verify check 4, additive-only
     regression).
   - `test/runner/loop.test.mjs` — a new test using a synthetic capacity
     fixture where the resolved `command` differs from `provider` (e.g.
     `command: 'agy'`, declared `provider: 'claude'` — mirrors the real
     shape `submit-assist-classify` *could* take, without depending on the
     live `.fgos/config.json`'s actual values) → the `capacity.dispatch`
     event payload records `command: 'agy'` AND `provider: 'claude'`
     (item's verify checks 2-3, the regression proof for the actual
     symptom the item names).

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `spawnWorker` return shape | Low — additive, mirrors tsk-62v D7's already-proven pattern | New/extended test: result carries `command` alongside every pre-existing field |
| `capacity.dispatch` payload | Low — additive, event type already documented as replay-ignored/audit-only | New test: payload carries both `command` and `provider`, including the differing-value case |
| `loop.test.mjs:309-343`'s closed-key assertion | Low, but a real must-touch (confirmed by direct read, not assumed) — mechanical widen, not a behavior change | Updated assertion includes `command: process.execPath`; test still passes end-to-end through the real `runOnce`/`spawnWorker` path |
| Backward-read of old events (no `command`) | Low — no migration, `replay.mjs` ignores unknown fields by design | Cited precedent (`loop.mjs:736-741` comment); no new test needed |

Impact-analysis capability gate (`CLAUDE.md`): `fgos tool query
--capability impact-analysis --status present` returns `gitnexus` present,
BUT its index (`lastCommit: 19bc5e4`) is 16 commits behind this branch's
base HEAD, including `987c132` (tsk-4eu) which touched `src/runner/
dispatch.mjs` itself — the exact file this item edits. Posture:
**degraded** — `fgos-coding-implement` must still run `impact()` per
`CLAUDE.md`'s MUST rules but treat that evidence as weak and name the gap;
this plan's own "Verified against the real repo" section above already
cross-checked every touched line by direct read against the current file
content (not through GitNexus), which stands regardless of index
staleness.

## No split

One honest piece of work — two source files' worth of additive changes,
one existing test to widen, two new pinned tests, one chained commit. No
independently shippable sub-piece; `fgos graph --what-if` was not run
because there is no split candidate to compare.

## Outstanding questions

None
