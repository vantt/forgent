# discover-loop lock-timeout signal propagation (tsk-1c6)

## Feature boundary

`/fgOS:discover-loop` used to stop its whole run the moment
`/fgOS:discover-next` reported a `lock-timeout` (old exit code `7` from a raw
CLI subprocess call) — a real systemic signal, since `.fgos/events.jsonl`'s
lock is shared by every item and continuing would very likely hit the same
stuck lock again. After tsk-31l switched `discover-next` from a raw CLI
subprocess call to dispatching through the `fgos-coding-driving` skill
(which invokes `fgos-coding-exploring`/`fgos-coding-planning` in-session rather than as a
subprocess), that distinct exit code stopped surfacing — a lock-timeout
several layers inside those skills now looks identical to any other
one-off `blocked` outcome to `discover-next`/`discover-loop`.

This item's boundary: restore a **lock-timeout-specific** signal that
survives the trip from wherever a `fgos discover`/`fgos plan` call
actually fails, up through `fgos-coding-driving`'s own stop-report
contract, to `discover-next`'s classification step and
`discover-loop`'s stop rule. It does **not** touch the underlying lock
policy itself (`.fgos/events.lock`'s 2s/10ms retry in `events.mjs`, RUL10)
— see D1 below.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Propagation scope is **`lock-timeout` only** — the one category that ever stopped the whole loop. `session-fail`/`merge-fail`/CAS-`validation` conflicts keep being handled per-item ("skipped"), unchanged. An adjacent idea — the underlying `.fgos/events.lock` retry policy being a fixed 2s/10ms regardless of what kind of work is holding it, versus an adaptive timeout or a liveness probe ("is the holder still alive?") instead of a fixed timeout — is a different layer (the lock's own policy in `events.mjs`, not the propagation-through-skill-layers problem this item scopes) and is **deferred to tsk-r87** (`discoveredFrom: tsk-1c6`). |
| D2 | Fix lives at the **root**: `fgos-coding-driving`'s own stop-report contract gains the structured lock-timeout signal, not a narrow patch scoped only to `discover-next`'s own dispatch handling. This means the change is visible to every caller of `fgos-coding-driving` (`/fgOS:cook`, `/fgOS:pick`, any future sweep), not just `discover-next` — intentional, since `fgos-coding-driving` is the shared orchestration point and there are separate ongoing discussions about upgrading the routing mechanism it sits under. |
| D3 | **Reversed twice; final form here.** Originally locked as a mechanical grep-consistency check, disputed 5 times by the engine's `judgeVerifySemanticCorrectness` second pass on `fgos discover --verdict clear --verify` — consistently, and correctly: the claim is a **runtime behavior of SKILL.md prose**, and no static grep proves that. It was then re-locked as "wait for tsk-4l9's verify harness". **That premise no longer holds:** tsk-4l9 investigated and concluded a harness is YAGNI — the spawn-a-real-session mechanism already exists as `docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md`, and what was actually missing was a written standard. tsk-4l9's real deliverable is `docs/how-to/write-verify-for-a-skill-prose-change.md` (commit `5c738bd` on `fgw/tsk-4l9`), which rules: a skill-prose item's `verify` is `npm test && <POSITIVE> && <NEGATIVE>`, and proving runtime behavior is **not** the `verify` field's job — that belongs to the smoke-test how-to plus event-log observation. tsk-1c6 adopts that standard. The five disputes are not overturned; they are answered — no shell command can carry that claim, so `verify` stops being asked to. |
| D4 | The stop-report's lock-timeout signal is identified by the literal token **`stop-reason: lock-timeout`**. This is a locked contract string, not an implementation detail: whoever implements D2 must emit exactly this token, and `fgos-coding-exploring`/`fgos-coding-planning` must relay exactly this token when their own engine-verb call fails that way. Locking it here is what makes D3's POSITIVE assertion a real check rather than a guess at unwritten wording — the failure mode the second pass caught on tsk-1tm (`rg` for a guessed identifier name that a correct fix might never use). How the token is threaded through each layer stays with `fgos-coding-planning`. |

## Pinned terms

- **"lock-timeout"** — the literal category string this item's fix must
  keep visible end-to-end. Maps to `EventLogError('lock-timeout')` in
  `src/state/events.mjs`, exit code `7` in `src/state/store.mjs:70`.
- **`stop-reason: lock-timeout`** — the literal token a stop-report must
  carry (D4). Pinned as a contract so it can be asserted; distinct from the
  bare category string `lock-timeout`, which already appears in
  `discover-loop/SKILL.md` today and therefore proves nothing on its own.
- **"propagation" (this item's scope)** — making a category that is only
  ever directly observed by the acting session at the point a bash call
  fails (e.g. inside `fgos-coding-exploring`'s gate step running `fgos discover`)
  survive being handed back up through each prose-only skill-invocation
  layer, instead of being lost to generic "blocked" paraphrasing.

## Scout evidence

- `plugins/fgOS/skills/discover-next/SKILL.md:96-115` — the "Known gap, not
  fixed by this item" paragraph tsk-31l left behind, naming the exact
  problem this item resolves.
- `plugins/fgOS/skills/discover-loop/SKILL.md:73-77` — `discover-loop`'s own
  stop rule that depends on the lost signal ("lock-timeout — stop the loop
  immediately... this is the one systemic condition").
- `plugins/fgOS/skills/cleanup-next/SKILL.md`, `plugins/fgOS/skills/retro-next/SKILL.md`
  — confirmed, by contrast, these still call their engine verbs
  (`fgos cleanup`/`fgos retrospective`) as raw CLI subprocesses and still
  classify by real exit code — the gap is specific to `discover-next`
  because it alone was switched to skill-dispatch (tsk-31l), not a
  repo-wide regression.
- `src/state/store.mjs:55-70` — the exit-code table: `'lock-timeout': 7`,
  alongside `session-fail`/`merge-fail`/`validation` categories with their
  own codes.
- `src/state/events.mjs` / `docs/specs/work-state.md:1045` — the lock's own
  retry policy: `.fgos/events.lock`, blocking-with-timeout, 2s/10ms,
  independent of `acquireSessionsLock`/`acquireRunnerLock`. This is the
  layer D1's deferred idea (tsk-r87) targets, not this item.
- No test files exist for `discover-loop`/`discover-next` (`find test -iname
  "*discover-loop*" -o -iname "*discover-next*"` → empty) — these are pure
  SKILL.md prose with no executable test surface today, grounding D3.
- Impact-analysis capability gate: `fgos tool query --capability
  impact-analysis --status present` → GitNexus registered and `present`
  (provider `gitnexus`, responsibility `Verification`). Posture: **full**.
  Informational only at this clarify stage — no code touched yet.

## Canonical references

- `plugins/fgOS/skills/fgos-coding-driving/SKILL.md` — the shared driver
  whose stop-report contract D2 targets.
- `plugins/fgOS/skills/discover-next/SKILL.md`, `plugins/fgOS/skills/discover-loop/SKILL.md`
  — the two callers whose stop-classification currently can't tell
  lock-timeout apart from any other block.
- `src/state/events.mjs`, `src/state/store.mjs` — the categorized-error
  source of truth this item's signal must trace back to accurately.

## Verify (per tsk-4l9's standard)

```
npm test \
  && grep -q 'stop-reason: lock-timeout' .claude/skills/fgos-coding-driving/SKILL.md \
  && grep -q 'stop-reason: lock-timeout' .agents/skills/fgos-coding-driving/SKILL.md \
  && grep -q 'stop-reason: lock-timeout' .claude/skills/fgos-coding-exploring/SKILL.md \
  && grep -q 'stop-reason: lock-timeout' .agents/skills/fgos-coding-exploring/SKILL.md \
  && grep -q 'stop-reason: lock-timeout' .claude/skills/fgos-coding-planning/SKILL.md \
  && grep -q 'stop-reason: lock-timeout' .agents/skills/fgos-coding-planning/SKILL.md \
  && grep -q 'stop-reason: lock-timeout' .claude/skills/fgos-coding-validating/SKILL.md \
  && grep -q 'stop-reason: lock-timeout' .agents/skills/fgos-coding-validating/SKILL.md \
  && grep -q 'stop-reason: lock-timeout' plugins/fgOS/skills/discover-next/SKILL.md \
  && grep -q 'stop-reason: lock-timeout' plugins/fgOS/skills/discover-loop/SKILL.md \
  && ! grep -q 'Known gap, not fixed by this item' plugins/fgOS/skills/discover-next/SKILL.md
```

POSITIVE: D4's locked token present in all ten touched files (all ten
confirmed to exist on this branch). NEGATIVE: the superseded paragraph at
`plugins/fgOS/skills/discover-next/SKILL.md:99` is gone.

File count corrected from eight to ten during `fgos-coding-validating`'s reality
gate: `fgos-coding-validating` itself fires `fgos plan` (its own Gate
section) and so is in scope. See `plan.md`'s verb-inventory table.

What this deliberately does **not** prove: that an LLM reading the updated
prose actually relays the token across skill-invocation hops at runtime.
Per tsk-4l9's standard that proof is owned by
`docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md` plus
event-log observation, not by this field.

## Real dependency

- **`deps: [tsk-4l9]`** — kept, with its reason updated. tsk-1c6's verify
  runs regardless of tsk-4l9, but the *justification* for that verify's
  shape lives in `docs/how-to/write-verify-for-a-skill-prose-change.md`.
  Merging tsk-1c6 first would leave a reviewer unable to look up the
  standard it follows. tsk-4l9 has already committed that deliverable and
  sits at `decompose`, so the ordering cost is small.

## Outstanding questions deferred to planning

- Exact mechanism for how a stage-skill (`fgos-coding-exploring`/`fgos-coding-planning`)
  detects a `lock-timeout` from its own `fgos discover`/`fgos plan`
  call and how `fgos-coding-driving`'s loop pseudocode/hard-rules should
  state relaying it verbatim — this is implementation/architecture, left
  to `fgos-coding-planning` per this skill's own scope limit.
- Whether `fgos-coding-validating` (invoked mid-`decompose` by `fgos-coding-planning`)
  also needs this same detection, given `discover-next` routes
  `decompose`-stage items through the same driver.
