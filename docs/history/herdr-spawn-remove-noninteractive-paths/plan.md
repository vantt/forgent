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

**CONTEXT.md D1** (locked at a mid-planning `fgos-coding-exploring`
re-entry, triggered by this validating round's own reality-gate FAIL):
proceed with the original removal scope as written below, with
`agy-herdr`'s `interactiveMode` bug and the fate of the three dormant
`*-herdr` executor configs both explicitly out of this item's own scope.

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

**CORRECTED at validating (RESEARCH.md round 2), locked as CONTEXT.md D1**:
Round 1's claim that `claude-herdr`/`pi-herdr`/`codex-herdr` and
`live-renderers/*.mjs` are unreferenced was wrong — it only searched
tracked `src`/`test`/`docs`, never the real, gitignored
`.fgos/config.json`. That file shows `claude-herdr`/`pi-herdr` really do
declare `liveOutput` pointing at the two `live-renderers/*.mjs` files, and
`codex-herdr` really does depend on the plain path. D1 (person's call,
live conversation at the exploring re-entry): proceed with the deletion
anyway — these three are "DORMANT" (never wired to any capability's
`prefer`) and functionally redundant with the plain `cli-spawn`-based
`claude`/`codex`/`pi` executors, which already cover non-interactive
dispatch for those same CLIs. Losing them is an accepted, explicit
trade-off, not an oversight. `agy-herdr`'s own `interactiveMode`
prompt-delivery bug (also found at validating — confirmed twice in
`runner.capabilities.fgos-coding-implement`'s own description, currently
worked around via `prefer: "agy-cli"`) is explicitly OUT of this item's
scope per D1 — not a blocker, not something this item fixes.

**executors.claude-herdr/pi-herdr/codex-herdr**: their code-side dependency
(the plain path / `liveOutput`) goes away in this item's own branch. Their
`.fgos/config.json` entries themselves are NOT touched by this branch
(ADR0020 — a worker branch never carries a `.fgos/` change) — after this
item merges, invoking any of the three BY NAME would throw the new
missing-`interactiveMode` `DispatchError` instead of running. Recommended
follow-up (same pattern as `executors.agy-herdr`'s own separate config-flip
commit under tsk-2rr/tsk-10j, not this item's own footprint): a future
direct main-checkout commit either deletes these three entries outright or
updates their descriptions to note they're retired — flagged here so it
isn't lost, not something this item's own branch or verify depends on.

**live-renderers/*.mjs**: delete both files
(`src/runner/dispatch/live-renderers/{claude-stream-json,pi-agent-session}.mjs`)
— per D1, accepted as safe despite the real `claude-herdr`/`pi-herdr`
config dependency found at validating, since those configs are themselves
being abandoned as redundant.

**Risk map:**

| component | how risky | what proves it |
|---|---|---|
| `herdrSpawnAdapter` non-interactive body removal | standard — well-scoped, single function, single registration site (confirmed) | full existing test suite green pre-change (confirmed this round: 29/29 pass, incl. LIVE tests against real `herdr`/`agy` binaries — both are installed here) and green post-change with the surviving interactiveMode-only subset |
| `interactiveMode` now required, not optional | standard — a caller lacking it now gets a thrown `DispatchError` instead of the old plain-path behavior | a new/kept test asserting the reject path (see Step 4 below) |
| live-renderers deletion | light — confirmed zero other consumers | `grep -rln "live-renderers\|claude-stream-json\|pi-agent-session" src test docs` returns only this change's own touched files afterward |
| executors.claude-herdr/pi-herdr/codex-herdr becoming non-functional | light — accepted per D1, config entries untouched by this branch (ADR0020) | confirmed real via `.fgos/config.json` read (RESEARCH.md round 2); no test in this branch depends on them working |
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
- **Coordination**: tsk-2rr (still `awaiting-approval`) is confirmed, by
  reading its own full description, to be the FIX for exactly the
  prompt-delivery bug `RESEARCH.md` round 2 found — `herdrSpawnInteractive
  Adapter` types the initial `agy -i <prompt>` line but never follows up
  with the prompt as a separate typed input the way it already does for
  `exitCommand`, so `agy` sits idle at its own real REPL banner forever;
  `agent_status` honestly reports idle because the prompt genuinely never
  arrived. tsk-2rr's own fix touches `herdrSpawnInteractiveAdapter`
  (`transport.mjs:538+`) and its own tests — a **different** function from
  this item's own `herdrSpawnAdapter` non-interactive body
  (`transport.mjs:907+`), so the two branches do not overlap in the file,
  but both land in the same test file
  (`test/runner/herdr-spawn-adapter.test.mjs`). Whichever of the two
  branches merges second should rebase, not force-push over the other's
  test-file edits. Per D1, this item's own branch does not wait on tsk-2rr
  and does not touch `.fgos/config.json` either way.
- **Partial failure**: none new — this item removes a code path, it does
  not add a new failure mode beyond the one named reject case above.

## Outstanding questions

None
