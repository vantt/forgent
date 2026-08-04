# discover-loop lock-timeout signal propagation (tsk-1c6)

## Feature boundary

`/fgOS:discover-loop` used to stop its whole run the moment
`/fgOS:discover-next` reported a `lock-timeout` (old exit code `7` from a raw
CLI subprocess call) — a real systemic signal, since `.fgos/events.jsonl`'s
lock is shared by every item and continuing would very likely hit the same
stuck lock again. After tsk-31l switched `discover-next` from a raw CLI
subprocess call to dispatching through the `fgos-coding-driving` skill
(which invokes `fgos-exploring`/`fgos-planning` in-session rather than as a
subprocess), that distinct exit code stopped surfacing — a lock-timeout
several layers inside those skills now looks identical to any other
one-off `blocked` outcome to `discover-next`/`discover-loop`.

This item's boundary: restore a **lock-timeout-specific** signal that
survives the trip from wherever a `fgos discover`/`fgos decompose` call
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
| D3 | Verify approach is a **mechanical consistency check**, not a runtime/dogfood-fixture test: grep for one literal category token (e.g. `lock-timeout`) appearing consistently across every touched `SKILL.md` (`fgos-coding-driving`, `fgos-exploring`, `fgos-planning`, `discover-next`, `discover-loop`), proving no layer paraphrases the signal away into generic "blocked" prose. A dogfood-fixture scenario that actually holds `.fgos/events.lock` to force a real lock-timeout was considered and rejected as disproportionate cost (timing-based, standard tier) — these skills are prose-driven with no existing runtime test surface (confirmed: no `discover-loop`/`discover-next` test files exist today). |

## Pinned terms

- **"lock-timeout"** — the literal category string this item's fix must
  keep visible end-to-end. Maps to `EventLogError('lock-timeout')` in
  `src/state/events.mjs`, exit code `7` in `src/state/store.mjs:70`.
- **"propagation" (this item's scope)** — making a category that is only
  ever directly observed by the acting session at the point a bash call
  fails (e.g. inside `fgos-exploring`'s gate step running `fgos discover`)
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

## Outstanding questions deferred to planning

- Exact mechanism for how a stage-skill (`fgos-exploring`/`fgos-planning`)
  detects a `lock-timeout` from its own `fgos discover`/`fgos decompose`
  call and how `fgos-coding-driving`'s loop pseudocode/hard-rules should
  state relaying it verbatim — this is implementation/architecture, left
  to `fgos-planning` per this skill's own scope limit.
- Whether `fgos-validating` (invoked mid-`decompose` by `fgos-planning`)
  also needs this same detection, given `discover-next` routes
  `decompose`-stage items through the same driver.
