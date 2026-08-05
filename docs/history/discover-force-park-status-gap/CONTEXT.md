item: tsk-nfa

# CONTEXT — tsk-nfa: discover --force leaves a disputed-verify park stuck in awaiting-human

## Boundary

`fgos discover <id> --verdict clear --verify <cmd> --force` overrides a
second-pass verify disagreement (`resolveDiscovery`'s force branch,
`src/intake/discovery.mjs:661`) and moves the item's stage forward
(`moveStage` at line 689), but never touches `work.status`. If the item is
already parked in `awaiting-human` (the normal outcome of the *first*
`discover` call that hit the same dispute — `putInAwaiting` at line 675),
the force call still succeeds at moving stage while status stays
`awaiting-human`. `fgos return`'s own guard (`bin/fgos.mjs:2045-2046`) then
refuses with `work "<id>" is "awaiting-human", not "doing" — nothing to
return`, and the only way out was a manual `fgos answer`.

Scope is narrowly this one gap: `--force` overriding a verify dispute
without restoring park state. It does not cover the unrelated first-pass
`unclear` branch (`discovery.mjs:714`), which has no `--force` path today.

## Locked decisions

| ID | Decision | Why |
|----|----------|-----|
| D1 | `discover --force` refuses when the item's live `work.status` is already `awaiting-human` at the top of the force branch (`discovery.mjs:661`), erroring with a message pointing at `fgos answer <id>` as the resume path, instead of silently moving stage while status stays parked | Keeps `--force`'s contract narrow — it only ever overrides the verify-second-pass judgment, never a park state. Status transitions stay exclusively behind the existing ask/answer door (`putInAwaiting`/`answerAwaiting`, `src/state/store.mjs:674-704`), which already requires a real, non-empty `answer` on that FSM edge. The rejected alternative (force auto-resumes via the item's own `statusAtAsk` snapshot, matching what `answerAwaiting` already does) would need a synthetic `answer` string manufactured by the force call itself to satisfy that same FSM requirement — that blurs the audit trail (looks like a person answered the park question when only `--force` ran) and expands `--force` to bundle two different kinds of override (verify-trust and status-park) behind one flag. D1 accepts the two-command cost (`fgos answer` to resume, then re-run `discover --force` to actually get past the verdict dispute) in exchange for keeping the override boundary honest. |

## Pinned terms

- "force branch" = the `if (callerVerdict?.force === true)` block inside
  `resolveDiscovery` at `src/intake/discovery.mjs:661-678`, reached only
  when the second-pass verify judge (`judgeVerifySemanticCorrectness`)
  disagrees with the first pass's proposed `verify`.
- "already parked" = `work.status === 'awaiting-human'` read fresh at the
  top of the force branch, i.e. the item was already sitting parked
  *before* this `discover` invocation started (the repro's second,
  identical `discover ... --force` call on an item a prior call already
  parked).

## Scout evidence

- `src/intake/discovery.mjs:599-678` — `resolveDiscovery`: verdict judged,
  second-pass check, force branch (661-678) vs. non-force dispute park
  (668-677, `putInAwaiting(dir, { id, ask, statusAtAsk: work.status })`).
- `src/intake/discovery.mjs:689-696` — `moveStage` call the force branch
  falls through to regardless of status.
- `src/state/store.mjs:674-704` — `putInAwaiting`/`answerAwaiting`: the
  latter is the only existing status-restore path, reading
  `view.gates[id].statusAtAsk`, and its own doc comment states
  `status-fsm.mjs requires a non-empty answer on this edge`.
- `bin/fgos.mjs:2045-2046` — `fgos return`'s `status !== 'doing'` guard,
  the failure surface this gap actually hits.
- `docs/explanation/judge-verdict-second-pass-semantic-check.md` — states
  the project's existing "never silently overridden" stance for the
  verify-dispute park; D1 extends the same stance to status.
- impact-analysis capability gate: `fgos tool query --capability
  impact-analysis --status present` returned 0 providers registered —
  `impact-analysis: inactive` for this item; not a gap, GitNexus MCP tools
  were used directly for scouting instead (`context`/exploration via grep,
  no formal blast-radius report needed at clarify stage).

## Canonical references

- `src/intake/discovery.mjs`
- `src/state/store.mjs`
- `bin/fgos.mjs`
- `docs/explanation/judge-verdict-second-pass-semantic-check.md`

## Deferred to planning

- Exact wording of the refusal error message and which exception type/exit
  code it should use (repo already has `StoreError`/`FsmError` precedent —
  planning picks the matching shape).
- Whether the check belongs literally at the top of the force branch
  (line 661) or is more naturally expressed by checking `work.status`
  once at function entry and short-circuiting before the second-pass
  logic even runs when force is set and status is already parked —
  implementation-shape decision, not a product decision.
- Verify command for this fix itself — item's `verify` field currently
  reads `"chưa xác định — P15 bổ sung"` (no real verify locked yet);
  planning/validating establishes the real one.
