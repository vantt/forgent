item: tsk-60r

# CONTEXT — tsk-60r: discover's plain clear-verdict path leaves a stale awaiting-human park

## Feature boundary

`fgos discover <id> --verdict clear --verify <cmd>` (no `--force`) can
leave an item's `status` stuck at `awaiting-human` after successfully
advancing its `stage`, when the item was already parked there by an
EARLIER `discover` call in the same clarify pass (e.g. a prior verify
dispute). The fix only touches the plain agree path in
`resolveDiscovery`'s clear branch (`src/intake/discovery.mjs`, right
before the `moveStage` call around line 726-728) — the code path reached
when `secondPass.agrees` is `true`, so neither the dispute-park branch
(`putInAwaiting`, line 714) nor the `--force` branch (line 684-706) ever
runs this call.

## Locked decisions

| ID | Decision | Why |
|----|----------|-----|
| D1 | Before `moveStage` in the clear-verdict branch, refuse (throw) when `work.status === 'awaiting-human'` — same guard shape and same error wording style as the existing `--force` guard (`discovery.mjs:695-700`, from `docs/history/discover-force-park-status-gap/CONTEXT.md`, tsk-nfa D1) — pointing at `fgos answer <id> --text ...` as the resume path. No auto-resume, no synthetic answer manufactured by this call. | Matches the design philosophy already stated and already applied once in this exact file (tsk-nfa D1): status transitions stay exclusively behind the ask/answer door, never a synthetic answer. Extending the SAME guard to the plain agree-path (not inventing a new mechanism) turns today's silent inconsistency (stage advances, status stays parked, `fgos return` later refuses with a confusing `not "doing"` error) into an immediate, actionable error at the exact call that would otherwise leave it stuck. Rejected alternative: auto-resume via `answerAwaiting` inside this call — rejected for the same reason tsk-nfa's D1 rejected it (blurs the audit trail, looks like a person answered when only a re-run of `discover` did). |

## Pinned terms

- "plain clear-verdict path" / "agree path" = the code reached in
  `resolveDiscovery` (`src/intake/discovery.mjs`) when `verdict.clear ===
  true` AND (no `verify` was proposed, OR the second-pass judge
  `judgeVerifySemanticCorrectness` agrees with it) — i.e. execution that
  never enters the `if (!secondPass.agrees)` block (lines 668-717) at all,
  falling straight through to the `moveStage` call at line ~728. This is
  distinct from both the dispute-park branch (lines 707-716) and the
  `--force` override branch (lines 684-706), which tsk-nfa's D1 already
  guards.
- "stale park" = `work.status === 'awaiting-human'` left over from an
  EARLIER `discover` call within the SAME clarify pass (most commonly: a
  first call disputed the proposed verify and parked via `putInAwaiting`;
  a second call then supplies a corrected verify the second pass accepts).

## Scout evidence

- `src/intake/discovery.mjs:540-757` — `resolveDiscovery`: full flow read;
  confirmed the plain agree-path (falls through past line 718) calls
  `moveStage` at line 728 unconditionally, with no `work.status` check
  anywhere in that path.
- `src/state/store.mjs:706-740` — `moveStage`: confirmed it only
  transitions `stage` via `transitionStage`/`stage-fsm.mjs`; never reads
  or writes `status`. Status is a fully separate FSM
  (`status-fsm.mjs`, moved only by `moveWork`/`putInAwaiting`/
  `answerAwaiting`).
- `src/state/store.mjs:674-704` — `putInAwaiting`/`answerAwaiting`: the
  only existing status-restore path, reading `view.gates[id].statusAtAsk`
  to know where to resume.
- `docs/history/discover-force-park-status-gap/CONTEXT.md` (tsk-nfa) — the
  directly analogous prior fix, same file, same failure shape
  (`moveStage` running while `status` stays `awaiting-human`), but scoped
  narrowly to the `--force` branch only; its own CONTEXT.md states "It
  does not cover the unrelated first-pass unclear branch" and says
  nothing about the plain agree-path this item covers — confirmed
  non-overlapping via re-reading `discovery.mjs`'s current (post-tsk-nfa)
  code.
- Live repro this session (tsk-2aa's clarify pass, 2026-08-06): first
  `discover --verdict clear --verify "chưa xác định — P15 bổ sung"`
  disputed (outcome: `verify-disputed`), parked to `awaiting-human`.
  Second `discover --verdict clear --verify "test -f docs/how-to/..."`
  (no `--force`, corrected verify, second pass agreed) returned outcome
  `clear`, advanced `stage` to `decompose`, but `status` stayed
  `awaiting-human` with the stale round-1/round-2 dispute `ask` still
  attached — required a manual `fgos answer tsk-2aa --text "..."` to
  unpark before `fgos-coding-driving` could continue.
- Impact-analysis capability gate (`fgos tool query --capability
  impact-analysis --status present`): GitNexus present → posture `full`.

## Canonical references

- `src/intake/discovery.mjs`
- `src/state/store.mjs`
- `docs/history/discover-force-park-status-gap/CONTEXT.md` (tsk-nfa) — the
  direct precedent this item's D1 extends.

## Outstanding questions deferred to planning

- Exact wording of the refusal error message and exception type/exit
  code — `fgos-coding-planning` picks the matching shape, following tsk-nfa's own
  precedent (`StoreError`) unless a concrete reason argues otherwise.
- Whether the check is best expressed as its own early guard (checked
  once, before the `if (typeof verdict.verify === 'string' ...)` block
  entirely) versus only at the specific fall-through point before
  `moveStage` — implementation-shape decision, not a product decision.
- Real `verify` command for this item itself — currently
  `"chưa xác định — P15 bổ sung"`; planning/validating sets the real one.
