item: tsk-nfa
docsRef: docs/history/discover-force-park-status-gap/

# plan.md — tsk-nfa: discover --force refuses on an already-parked item

## Mode gate

Flags counted against the standard checklist (auth, authorization, data
model, audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain):

- **existing covered behavior — YES.** `test/state/discover-verdict-
  override.test.mjs` already asserts three scenarios for `discover
  --verdict clear [--force]` (unforced dispute parks, forced dispute
  proceeds, `--force` on an unclear verdict no-ops). The fix must not
  regress any of the three.
- Everything else (auth, authorization, data model, audit/security,
  external systems, public contracts, cross-platform, weak proof, multi-
  domain) — no. This is an internal engine CLI used by this repo's own
  fgOS skills/runner, not an externally-consumed API surface; no data
  model or FSM edge changes, no auth/security boundary crossed.

1 flag → **small**: a couple of files (the one guarded branch in
`src/intake/discovery.mjs`, one new test case + no change needed to the
three existing ones), no gray areas left after D1 locked in CONTEXT.md.

## Approach

`fgos graph tsk-nfa --json` (`componentCount` 178, tsk-nfa is its own
size-1 component, no dependents, not on `criticalPath`/`topUnblock`) — no
split, no ordering dependency on other work. One piece, proceeds as itself.

**Chosen path (honors CONTEXT.md D1):** in `resolveDiscovery`'s force
branch (`src/intake/discovery.mjs:661`, the `if (callerVerdict?.force ===
true)` block), before the `addDecision`/second-pass-override logic that
already lives there, add a guard: if `work.status === 'awaiting-human'`
(read fresh at function entry, same `work` binding the branch already
closes over), throw a validation error naming `fgos answer <id>` as the
resume path instead of falling through to `moveStage`. Only applies inside
the force branch — the branch is unreachable unless `callerVerdict.force
=== true` and the second pass just disagreed, so this never touches the
plain (non-force) dispute-park path at line 668-677, nor the unrelated
first-pass unclear branch at line 714 (which has no `--force` path today,
confirmed unaffected by CONTEXT.md's own scope note).

**Rejected alternative:** auto-resuming `work.status` from
`gates[id].statusAtAsk` inside the force branch (mirroring
`answerAwaiting`). Rejected in CONTEXT.md D1 — would need a synthetic
`answer` string to satisfy `status-fsm.mjs`'s non-empty-answer requirement
on that edge, blurring the audit trail (looks like a person answered a
question nobody answered).

### Risk map

| Component | Risk | Proof point |
|---|---|---|
| `resolveDiscovery` force branch (`discovery.mjs:661-678`) | low — additive early-return guard, no existing line changes | New test: discover parks on disputed verify (no force) → `fgos discover --force` on the now-`awaiting-human` item throws the new validation error and leaves stage/status unchanged |
| Existing force-path tests (`discover-verdict-override.test.mjs:69,83,104`) | low — none of the three existing scenarios call discover on an item already `awaiting-human`; test at line 83 forces on a freshly-submitted item, never parked first | Run `test/state/discover-verdict-override.test.mjs` unmodified — all 3 must still pass |
| CLI exit-code/error contract for `discover --force` | low — this is exactly the intended behavior change per CONTEXT.md D1, not an incidental break | New test asserts the error text and non-zero exit, matching the shape other `resolveDiscovery`/`StoreError` validation failures already use (e.g. `bin/fgos.mjs:2046`'s `return` guard) |

**Blast radius (impact-analysis: degraded — GitNexus present but 146
commits behind HEAD per `list_repos`; `mcp__gitnexus__impact` on
`resolveDiscovery` upstream returned 0 callers, which is wrong/stale —
cross-checked with `rg -n "resolveDiscovery"`):** two real call sites,
`bin/fgos.mjs:1012` (CLI `discover` command, where `--force` is parsed)
and `src/runner/loop.mjs:977` (async runner sweep). The runner sweep never
sets `force` (confirmed: `rg -n "force" src/runner/loop.mjs` — no match),
so this change is inert on that path; only the CLI `--force` caller is
ever affected.

## Shape

Single-piece fix, no split (per `fgos graph`'s component-of-1 above and
CONTEXT.md's own scope note).

Cases to prove:
- **The actual repro (tsk-4y2's shape):** first `discover --verdict clear
  --verify <cmd>` disagreement parks the item (`awaiting-human`, stage
  `clarify`). A second, identical call with `--force` now throws instead
  of silently advancing stage while status stays parked.
- **Regression, no force:** unforced dispute still parks exactly as today
  (existing test, unchanged).
- **Regression, force on a non-parked item:** existing test at line 83 —
  force still proceeds past a dispute when the item was never parked to
  begin with (status `doing`/`todo` at entry, not `awaiting-human`).
- **Regression, force on unclear verdict:** existing test at line 104 —
  `--force` remains a no-op outside the `clear` branch.

## Execution

One command proves this item done — the new + existing tests in
`test/state/discover-verdict-override.test.mjs`:

```
node --test test/state/discover-verdict-override.test.mjs
```

Execute (`fgos-coding-implement`) designs the exact error-throw shape
(exception type, exit code) and the new test's assertions; this plan does
not pre-decide either — implementation detail per CONTEXT.md's own
"Deferred to planning" note, further deferred here to Execute since it is
purely a shape choice with existing precedent (`StoreError`) to follow.

## Assumptions

- The new guard belongs literally inside the force branch (checked right
  where CONTEXT.md's scout evidence points, `discovery.mjs:661`) rather
  than hoisted to function entry — not material to behavior (both read the
  same fresh `work.status`; the force branch is the only place `--force`
  is ever consulted), so pinned here rather than asked.
