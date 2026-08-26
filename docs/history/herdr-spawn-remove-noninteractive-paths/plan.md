# plan.md — tsk-by0: remove herdr-spawn's non-interactive dispatch paths

Mode: standard

Lane derivation (mechanical, `fgos-routing`'s Mode gate, done at
`fgos-coding-planning` Bootstrap since no `fgos-routing` Orient handed a
lane off this session — direct entry via `fgos-coding-driving`): counted
flags — external systems (real `herdr` CLI process control), public
contracts (`herdr-spawn`'s own invocation contract changes: `interactiveMode`
goes from optional to required), existing covered behavior
(`test/runner/herdr-spawn-adapter.test.mjs`'s 29 existing tests, most of
which get deleted, the rest must keep passing) = 3 flags → standard.
(Compare tsk-10j, the sibling ADD item that introduced
`herdrSpawnInteractiveAdapter`: that item counted a 4th flag — "weak proof
around the area", real external-CLI UI/timing fragility for a brand-new
code path — and landed high-risk. This item is subtractive, touches no new
external timing behavior, and leaves `herdrSpawnInteractiveAdapter` itself
untouched, so that 4th flag does not apply here.)

**Impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` reports GitNexus `present`, but
`mcp__gitnexus__list_repos` shows the `/home/vantt/projects/forgentX` index
is 2214 commits behind HEAD — too stale to trust for current line numbers
or a graph-walked blast radius. Used a direct grep/read cross-check instead
(see `RESEARCH.md` round 1, section "Checked"): confirmed
`herdrSpawnAdapter`/`'herdr-spawn'` has exactly one registration site
(`EXECUTOR_ADAPTERS['herdr-spawn']`, `transport.mjs:1348`), and that
`live-renderers/*.mjs` has no consumer outside the code/tests/docs already
named below.

`fgos graph --json`'s `criticalPath`/`topUnblock` do not include tsk-by0 —
it has no upstream/downstream dependency edges in the current graph, so
there is no cross-item ordering constraint to honor; this item's own
internal file order (below) is decided by which pieces would break the
build if done out of order, not by graph data.

## Approach

**Chosen path**: delete `herdrSpawnAdapter`'s non-interactive body
(`transport.mjs:907`-end, everything after the existing
`if (invocation.interactiveMode) return herdrSpawnInteractiveAdapter(...)`
redirect at lines 904-906) in one pass, together with its two now-dead
`live-renderers/*.mjs` files, its own now-dead tests, and a required-vs-
default resolution — rather than doing these as separate items. Rejected:
splitting into "remove liveOutput" + "remove plain path" + "delete
live-renderers" as separate items — they are not independently deployable
(deleting only liveOutput but keeping the plain sh-wrapper path still
leaves the exact problem tsk-by0's own description objects to: "hides real
content behind an echoed script... defeating the whole point of dispatching
via herdr"), and splitting would just multiply commits touching the same
20-line diff region for no independent value. One honest piece.

**require, not default, `interactiveMode`**: `herdr-spawn` will reject (a
`DispatchError`, known category — reuse `worker-spawn-fail`'s sibling shape,
e.g. a new `invalid-config` category consistent with existing categories in
this file) any invocation missing `invocation.interactiveMode`, rather than
silently defaulting it in. Cites: the item's own locked framing ("Keep ONLY
herdrSpawnInteractiveAdapter... as herdr-spawn's one supported mechanism
going forward" — one mechanism implies no silent second path), and this
repo's own baseline convention against fallback shims
(`~/.claude/rules/development-rules.md`: "Don't use feature flags or
backwards-compatibility shims when you can just change the code"). A caller
that forgets `interactiveMode` gets a loud, named error instead of silently
getting a behavior it never asked for.

**executors.claude-herdr/pi-herdr/codex-herdr**: delete outright, not
research 3 more CLIs' interactive flags. `RESEARCH.md` round 1 confirmed
zero references anywhere in `src`/`test`/config — they were never actually
wired into `.fgos/config.json` or any shared-config default. Reproducing
`agy`'s own dedicated interactive-mode redesign (tsk-10j, real live-binary
proof work) for three CLIs with zero current callers is exactly what YAGNI
argues against. **Caveat**: since these ids were not found as real config
entries in THIS checkout at all, there may be nothing to actually delete —
Execute's first real step is confirming this (see Step 1 below); if
confirmed absent, this sub-item is a no-op, not a blocker.

**live-renderers/*.mjs**: delete both files
(`src/runner/dispatch/live-renderers/{claude-stream-json,pi-agent-session}.mjs`)
— `RESEARCH.md` round 1 confirmed no consumer outside the code/tests being
removed in this same change.

**Risk map:**

| component | how risky | what proves it |
|---|---|---|
| `herdrSpawnAdapter` non-interactive body removal | standard — well-scoped, single function, single registration site (confirmed) | full existing test suite green pre-change (confirmed this round: 29/29 pass, incl. LIVE tests against real `herdr`/`agy` binaries — both are installed here) and green post-change with the surviving interactiveMode-only subset |
| `interactiveMode` now required, not optional | standard — a caller lacking it now gets a thrown `DispatchError` instead of the old plain-path behavior | a new/kept test asserting the reject path (see Step 4 below) |
| live-renderers deletion | light — confirmed zero other consumers | `grep -rln "live-renderers\|claude-stream-json\|pi-agent-session" src test docs` returns only this change's own touched files afterward |
| executors.claude-herdr/pi-herdr/codex-herdr deletion | light — likely a no-op (see caveat above) | same grep, zero hits before AND after |
| `docs/architecture-manifest.json` | light — hand-maintained layer manifest, not generated | its two `live-renderers/*.mjs` entries (lines 29-30) removed alongside the files |

## Files touched (footprint)

- `src/runner/dispatch/transport.mjs` — delete `herdrSpawnAdapter`'s
  non-interactive body; keep the 3-line interactiveMode redirect, now
  throwing when `interactiveMode` is absent instead of falling through
- `src/runner/dispatch/live-renderers/claude-stream-json.mjs` — delete
- `src/runner/dispatch/live-renderers/pi-agent-session.mjs` — delete
- `test/runner/herdr-spawn-adapter.test.mjs` — delete the plain-path
  (mocked + LIVE) and liveOutput/live-renderer tests named in
  `RESEARCH.md` round 1's test-triage section; keep the interactiveMode
  tests; keep whichever shared mock-binary fixture helpers (lines 1-274)
  the surviving tests still exercise; add one new test asserting the
  reject-when-missing-interactiveMode path
- `docs/architecture-manifest.json` — remove the two `live-renderers/*.mjs`
  entries (lines 29-30)
- `CHANGELOG.md` — one line under `## [Unreleased]` (AGENTS.md's
  install/setup/doctor gate: this changes dispatch behavior a user of
  fgOS would see — `herdr-spawn` now requires `interactiveMode`)
- `docs/history/herdr-spawn-remove-noninteractive-paths/plan.md` (this
  file)

Not touched: `.fgos/config.json` (ADR0020 — a worker branch never carries
a `.fgos/` change; nothing here needs one anyway, since `executors.agy-herdr`
already carries its own separate config-flip step under tsk-2rr/tsk-10j,
not this item).

## Shape

One pass-through piece — no split. The change is contained to one file's
one function plus its own direct test file, two now-orphaned files, and
one hand-maintained manifest; nothing here has independently shippable
sub-parts.

Concrete cases to prove against, at standard depth:
- **Boundary**: an invocation with `interactiveMode` absent/undefined ->
  must reject with the new, named `DispatchError` category, never silently
  fall through to old plain-path behavior (the behavior change this item
  exists to make explicit).
- **Existing behavior that must not regress**: every surviving
  interactiveMode test (lines 1077-1229 of the current test file) keeps
  passing unchanged — `herdrSpawnInteractiveAdapter` itself is not touched
  by this item.
- **Coordination**: tsk-2rr (still `awaiting-approval` per `RESEARCH.md`
  round 1) — if it merges before this item's own branch does, rebase onto
  its result rather than duplicating its `interactiveMode` config-shape
  work; if this item's branch is ready first, do not touch
  `executors.agy-herdr`'s own config (that's tsk-2rr/tsk-10j's own
  separate main-checkout commit, per ADR0020) — this item's own diff stays
  entirely inside code/tests/docs, never `.fgos/config.json`.
- **Partial failure**: none new — this item removes a code path, it does
  not add a new failure mode beyond the one named reject case above.

## Outstanding questions

None
