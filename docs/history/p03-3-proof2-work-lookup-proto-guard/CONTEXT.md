# CONTEXT: throwaway planning Work — guard `--work <id>` lookup against JS prototype property names

Throwaway item created only to exercise Phase 03 Proof 2 (ADR-006/ADR-007
R5, coding consult supporting a planning Work) — see
`docs/architect/agent-coordination/verification/step-07-mvp/proof-2-coding-consult-supporting-planning-work.md`
for the live-proof record. The underlying gap this CONTEXT.md/plan.md pair
plans against is real (already logged as a Follow-Up in
`docs/architect/agent-coordination/verification/step-07-mvp/index.md`); this
item itself is not committed as real backlog work — it is closed
`wontfix` after the proof completes.

## Feature boundary

`src/runner/dispatch/cli.mjs`'s `--work <id>` lookup (used by both `decide
--work` and the `--contract --work` door) does unguarded bracket access
against a plain object literal returned by `listWork(fgosDir).work`. A
`--work` value that happens to match a JS built-in property name
(`__proto__`, `constructor`, `toString`, ...) silently resolves to that
prototype value instead of the honest "no work item found" error every
other unknown id produces. Fix the lookup only; no other `--work`
resolution behavior changes.

## Locked decisions

| D-ID | Quyết định |
|------|-----------|
| D1 | Root cause: `listWork(fgosDir).work[workIdArg]` (`cli.mjs:621` for `decide --work`, and the `--contract --work` branch that reuses the identical lookup verbatim) is bracket-notation access on an ordinary `{}` object literal (`state/store.mjs`'s `currentEffectiveView` builds `{ work: {}, decisions: [] }` as a plain, `Object.prototype`-linked object, never `Object.create(null)`), with no `Object.prototype.hasOwnProperty.call` guard before the `if (!work)` check. Confirmed by direct reproduction (P03.2 Red-Team, `docs/architect/agent-coordination/verification/step-07-mvp/P03.2.md`): `--work __proto__`/`--work constructor` silently resolve instead of erroring, at both call sites. |
| D2 | Fix approach: add an `Object.prototype.hasOwnProperty.call(listWork(fgosDir).work, workIdArg) ? listWork(fgosDir).work[workIdArg] : undefined` guard at both call sites (`cli.mjs:621` and the `--contract --work` branch), per the Follow-Up's own recommendation. Rejected alternative: switching `state/store.mjs`'s `currentEffectiveView` `work` map to `Object.create(null)` at the source — correct in principle (every consumer of `.work[id]` gets the fix for free) but a broader blast radius than this item's scope; deferred to a future item that audits every `.work[id]` consumer, not just these two. |
| D3 | Regression coverage: a new test (or two, one per call site) in `test/runner/assignment-dispatch.test.mjs` asserting `--work __proto__` and `--work constructor` both produce the `no work item "..." found` error (not a silent resolve) for `decide --work` and `execute --contract --work`. |

## Scout evidence

- `docs/architect/agent-coordination/verification/step-07-mvp/P03.2.md`
  Red-Team section — the LOW finding this item plans to close, including
  the exact empirical reproduction transcript.
- `docs/architect/agent-coordination/verification/step-07-mvp/index.md`
  Follow-Ups — the same gap logged for pickup by "a future cell that
  touches both call sites together."
- `src/runner/dispatch/cli.mjs:621` and the `--contract --work` branch —
  both confirmed (by reading, cited in P03.2.md) to share the identical
  unguarded lookup.

## Outstanding questions

None.
