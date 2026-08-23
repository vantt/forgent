# Plan: tsk-2cs — registry mở-rộng-được cho fgos doctor's checks + fgos setup's config-defaults

**Decisions source:** `docs/history/setup-doctor-config-registry/CONTEXT.md` (D1-D6)

## Mode: high-risk

Flags counted (auth / authorization / data model / audit-security / external
systems / public contracts / cross-platform / existing covered behavior /
weak proof around the area / multi-domain):

- **data model** — yes: registry entry shape (id + optional check + optional
  config-default) and the shared config file's per-module-keyed structure are
  both new, persisted schemas.
- **public contracts** — yes: `docs/specs/distribution.md` Data Dictionary #7
  (doctor check set) is stale even before this item (says 3, code has 5);
  `DEFAULT_RUNNER_CONFIG`'s shape (read flat by `src/runner/dispatch.mjs`)
  changes under D6.
- **existing covered behavior** — yes: `src/setup/checks.mjs`,
  `src/setup/config-merge.mjs`, `test/setup/checks.test.mjs`,
  `test/setup/config-merge.test.mjs` already cover the exact paths this item
  changes; all 5 existing checks' behavior must survive unchanged (item's own
  requirement).
- **weak proof around the area** — yes: the registry mechanism itself is
  greenfield (no test today proves "add an entry without touching
  checks.mjs"); D6's runner-config nesting is a real behavior change with no
  existing test coverage for the new shape.
- **multi-domain** — yes: touches setup (`src/setup/*`), runner
  (`src/runner/dispatch.mjs`, `src/runner/loop.mjs`), intake
  (`src/intake/judge-executor.mjs`), and both CLI entry points
  (`bin/fgos.mjs`, `bin/fgos-runner.mjs`) at once — real footprint confirmed
  at `fgos-coding-validating`, wider than first drafted — and coordinates with a
  second, concurrently in-flight item (`tsk-2ta`) sharing the same target
  config file.

5 flags ≥ 4 → **high-risk**, by count alone (no hard-gate flag like
auth/data-loss/security/external-provider/validation-removal is present, but
the threshold is already crossed). A smaller mode would hide both the
migration-adjacent risk on `src/runner/dispatch.mjs` and the real
cross-item coordination risk with `tsk-2ta`.

## Real-time cross-item finding (found during this planning session)

`fgos graph --json`'s `topUnblock` surfaced `tsk-2ta-1` — confirming `tsk-2ta`
already split into children (`tsk-2ta-1..4`), which `CONTEXT.md`'s scout (done
against `tsk-2ta`'s branch-level `plan.md`, written before the split) did not
know about. Reading the real children directly:

- `tsk-2ta-1` (stage `executing`, status `todo`, no deps) — "Đọc và merge
  config: implement đọc `~/.fgos/config.json` (global) rồi merge với project
  config" — footprint `src/setup/checks.mjs`, `src/config` (a **new**
  directory). Its own `verify` command is weak (`grep ... || test -f
  checks.mjs` — the `||` branch is trivially true, so it does not actually
  prove the rename happened).
- `tsk-2ta-2/3/4` — new doctor check, shell fallback, and a synthesis
  `CONTEXT.md` — none of the four children's footprints mention
  `.fgos-runner.json`, `.fgos/config.json` as a rename target, or
  `src/runner/dispatch.mjs` by name.

This means `CONTEXT.md`'s D4 (defer the file rename to `tsk-2ta`) is still the
right **product** decision — `tsk-2ta` owns that concept — but it is not yet
proven that `tsk-2ta`'s *current* decomposition actually delivers the rename
before `tsk-2cs` needs it. This is a **reality/feasibility** question, not a
new product fork — exactly what `fgos-coding-validating` exists to check, so it is
recorded here as the plan's top risk (below) with a concrete proof point,
not sent back to `fgos-coding-exploring`.

## Approach

### Piece 1 — registrations mechanism (D1, D2)

`src/setup/registrations.mjs` (new): each existing check becomes a plain
object `{ id, check }` (or `{ id, configDefault }`, or both — independent per
D2); the file imports/lists every registration and exports one combined
array. `src/setup/checks.mjs`'s `DOCTOR_CHECKS` becomes derived from this
array (`registrations.filter(r => r.check).map(...)`) instead of a literal
list — so its own 5 entries move into `registrations.mjs`, but `checks.mjs`
itself never needs another edit when a 6th is added elsewhere.

Alternatives rejected:

- Manifest JSON (`docs/architecture-manifest.json`-style) — rejected per
  CONTEXT.md D1: JSON can't hold a function reference, and that file already
  means something else.
- Directory auto-scan — rejected per CONTEXT.md D1: no existing repo
  precedent for implicit discovery; every registry in this codebase today
  (`DOCTOR_CHECKS`, `tool-registry.mjs`, `command-registry.mjs`) is explicit.

### Piece 2 — config-default registry + shared-file wiring (D3, D5 groundwork, D6)

`registrations.mjs` entries may also carry `configDefault: { key, shape }`
(D2/D3) — `key` is the module's own top-level section name in the shared
config file. `checkConfigNotStale` (today hardcoded to `.fgos-runner.json` +
`DEFAULT_RUNNER_CONFIG` flat) changes to: compose every registered
`configDefault` into one object keyed by `key` (runner's own
`DEFAULT_RUNNER_CONFIG` becomes the `runner` key's shape per D6, no longer
flat at root), then call the existing, unchanged `mergeConfigDefaults` once
against the shared file's real content. `src/runner/dispatch.mjs`'s
`ensureRunnerConfig` and every runner-config read move from flat root access
to `config.runner.*`.

This piece does **not** itself register `gate-bypass.json` — CONTEXT.md D5
locks the *fate* (it will fold in, under its own key) as precedent for
`tsk-2qz`, but the vision doc is explicit that `tsk-2qz` is meant to *be* the
first real registry consumer (`docs/distribution-vision.md` §7: "làm ĐÚNG như
entry đầu tiên của registry tsk-2cs xây"). Piece 2 proves the config-default
half of the mechanism with a test-only registration, not a real
`gate-bypass.mjs` change — leaving that wiring for `tsk-2qz`'s own execution
keeps this item inside its declared consumer boundary (mechanism, not every
consumer).

**Real blast radius (found at `fgos-coding-validating`, superseding the first draft
of this section — see Risk map's GitNexus row for how this was found):**
D6's flat→nested move is not contained to `dispatch.mjs`. Direct grep of
every `cfg.executor`/`cfg.executors`/`cfg.models`/`cfg.timeoutMs`/
`cfg.parallel` read site found real, non-test consumers in:

- `src/runner/dispatch.mjs` — internal (`validateExecutorShape`,
  `resolveExecutor`, `effectiveTimeout`, already in scope)
- `src/runner/loop.mjs:143,694,929` — `config?.parallel`, `config.timeoutMs`
  ×2 — the autonomous runner's own main loop
- `src/intake/judge-executor.mjs:34` — `cfg?.timeoutMs`, plus prose
  referencing `cfg.executors`/`cfg.executor` for judge-tier dispatch
- `bin/fgos.mjs:244` — `ensureRunnerConfig(...).timeoutMs`, plus 3 more
  `ensureRunnerConfig` call sites (244, 892, 912, 2727) whose returned
  object feeds `resolveDiscovery`/`resolveDecompose`
- `bin/fgos-runner.mjs:105` — `ensureRunnerConfig` call feeding the
  standalone runner's own `config` object into `loop.mjs`

Piece 2's real scope is: nest `DEFAULT_RUNNER_CONFIG` under a `runner` key,
update every read site above to `cfg.runner.*`, and add/extend tests for
each touched file — not `dispatch.mjs` alone.

Alternatives rejected:

- Each `configDefault` entry names its own target file path (my original
  framing before the product owner corrected it) — rejected: contradicts the
  explicit "one shared file, each module its own entry" goal (CONTEXT.md D3).
- `tsk-2cs` performs the `.fgos-runner.json` → shared-file rename itself —
  rejected per CONTEXT.md D4: `tsk-2ta` already locked and is executing that
  exact move; doing it twice risks a real merge collision on the same file.

## Risk map

| Component | Risk | Proof point (→ fgos-coding-validating) |
|---|---|---|
| `tsk-2ta`'s current children don't yet prove the shared-file rename | **High** — piece 2 assumes a shared config file exists at a stable, known path; `tsk-2ta-1`'s own verify command is too weak to prove it does | Before piece 2 starts: read `tsk-2ta`'s real merge state (has `fgw/tsk-2ta` merged to `main`?) and grep the actual shared-file path in its landed code — not the aspirational `plan.md` text. If unresolved, piece 2 waits; piece 1 does not. |
| Existing 5 checks' behavior must survive the `registrations.mjs` refactor | Medium — real behavior regression risk on a well-tested file | `test/setup/checks.test.mjs` (existing) must stay green unmodified in assertions, only wiring changed |
| Flat→nested config-read shape change (D6) real blast radius | **High** (revised at `fgos-coding-validating`, was Medium) — real read sites in `src/runner/loop.mjs`, `src/intake/judge-executor.mjs`, `bin/fgos.mjs`, `bin/fgos-runner.mjs`, not just `dispatch.mjs` (see Approach's "Real blast radius" note) | Update every cited read site to `cfg.runner.*` in the same commit as the shape change (never landed partially); existing tests for each touched file plus new assertions for `config.runner.*` reads; `npm test` full suite (not a scoped subset) before this piece is considered done, given the spread |
| GitNexus `impact()` unreliable for these symbols | **Confirmed, not hypothetical** — `impact({target:"ensureRunnerConfig", direction:"upstream"})` and same for `DEFAULT_RUNNER_CONFIG` both returned `impactedCount:0, risk:LOW` even after a fresh re-index (`node .gitnexus/run.cjs analyze`, was 38 commits stale) — directly contradicted by grep evidence of real callers in `bin/fgos.mjs`/`bin/fgos-runner.mjs`/tests | Do not trust `impact()` output for these two symbols at execution time either — re-verify with grep/direct read before editing, same as done here; re-run `impact()` after the fix lands to see if it now resolves correctly (informational, not a gate) |
| Registry accepts a new entry without editing `checks.mjs` | Low-medium — the item's own core acceptance bar, currently unproven | New test in `test/setup/registrations.test.mjs`: register a throwaway check via `registrations.mjs` only, assert `DOCTOR_CHECKS`/doctor output includes it, assert `checks.mjs`'s own diff for that test is empty |
| `docs/specs/distribution.md` Data Dictionary #7 drift | Low — already stale before this item (says 3, code has 5) | Leave the spec edit to `tsk-1qm` (its own locked scope, `deps: [tsk-2cs, tsk-2qz]`) — do not fix it here, avoid scope creep beyond this item's footprint |

**impact-analysis: degraded, for these specific symbols** (revised at
`fgos-coding-validating`; was recorded `full` at `fgos-coding-planning` from the tool's
registered/present status alone, before its actual output was checked
against real evidence). GitNexus is registered and reports `present`, and a
fresh re-index was run during validating, but its `impact()` call for
`ensureRunnerConfig`/`DEFAULT_RUNNER_CONFIG` (upstream direction) returns
`impactedCount: 0` — contradicted by direct grep of real callers in
`bin/fgos.mjs`, `bin/fgos-runner.mjs`, `src/runner/loop.mjs`,
`src/intake/judge-executor.mjs`, and `test/runner/dispatch.test.mjs`. Per
the CLAUDE.md gate's degraded framing: every other required check still
runs, but this piece's blast-radius evidence is grep/direct-read based, not
`impact()`-based, and that gap is named here rather than silently dropped.
Before editing any symbol in `src/setup/checks.mjs`, `src/setup/config-merge.mjs`,
or the read sites listed above, still call `impact()` per the
CLAUDE.md/AGENTS.md gate (it may resolve correctly for other symbols in this
item, e.g. `checks.mjs`'s own `DOCTOR_CHECKS`), but cross-check its result
against a grep of the target symbol's name before trusting a low/zero count.

## Files likely touched

- `src/setup/registrations.mjs` (new) — the registry itself (piece 1)
- `src/setup/checks.mjs` — `DOCTOR_CHECKS` derived from the registry;
  `checkConfigNotStale` composes config-defaults from the registry (piece 2)
- `src/runner/dispatch.mjs` — `ensureRunnerConfig`/internal runner config
  reads move under a `runner` key (piece 2, D6)
- `src/runner/loop.mjs` — `config?.parallel`, `config.timeoutMs` (×2) move to
  `config.runner.parallel`/`config.runner.timeoutMs` (piece 2, D6, real
  blast radius found at `fgos-coding-validating`)
- `src/intake/judge-executor.mjs` — `cfg?.timeoutMs` and the
  `cfg.executor`/`cfg.executors` fallback chain move to `cfg.runner.*`
  (piece 2, D6, same finding)
- `bin/fgos.mjs` — 4 `ensureRunnerConfig` call sites (lines 244, 892, 912,
  2727); line 244's `.timeoutMs` chain moves to `.runner.timeoutMs` (piece 2,
  D6, same finding)
- `bin/fgos-runner.mjs` — 1 `ensureRunnerConfig` call site (line 105)
  feeding `loop.mjs` (piece 2, D6, same finding)
- `test/setup/registrations.test.mjs` (new) — proves entry-without-edit
- `test/setup/checks.test.mjs` — updated wiring, same assertions
- `test/setup/config-merge.test.mjs` — likely unchanged (`mergeConfigDefaults`
  itself is not modified, only composed differently by its caller)
- `test/runner/dispatch.test.mjs`, `test/runner/loop.test.mjs` — updated for
  `config.runner.*` shape (existing files, confirmed present)
- `test/cli/fgos.test.mjs` — likely needs coverage for the entry-point call
  sites in `bin/fgos.mjs` (confirmed to exist, not yet read for exact
  assertions — execution-time task)

Not touched by this item (deliberately, per CONTEXT.md D4/D5):
`scripts/fgos-shell-integration.sh`, `src/state/gate-bypass.mjs`,
`docs/specs/distribution.md`.

## Order

`fgos graph --json` places neither piece on `criticalPath`; `tsk-2cs` itself
appears in `topUnblock` (unblocks `tsk-2qz`, `tsk-1qm` — 2 real, 3 newly).
No graph signal for internal piece ordering (both pieces are inside one
item's own decomposition, not separate graph nodes yet), so sequencing below
is by risk, matching the Real-time finding above:

1. **Piece 1 first** — self-contained, zero dependency on `tsk-2ta`, lowest
   risk, and is the item's actual minimum bar per its own description ("một
   module mới có đường chính thức khai... test chứng minh registry nhận
   thêm entry mà không sửa checks.mjs").
2. **Piece 2 second** — gated on confirming `tsk-2ta`'s shared file is real
   (the plan's top risk); do not start `src/runner/dispatch.mjs` changes
   until that is confirmed at `fgos-coding-validating` or execution time.

## Split decision

**Split into two child items**, mirroring the real risk/dependency
difference above — not a guess, the two pieces have genuinely different
blockers (piece 2 alone is blocked on external state) and different files
(`src/runner/dispatch.mjs` only enters piece 2):

- **tsk-2cs-1** — "Build the registrations.mjs registry mechanism; convert
  existing 5 doctor checks to registrations; prove a new entry needs no
  `checks.mjs` edit." `parent: tsk-2cs`. Verify:
  `node --test 'test/setup/**/*.test.mjs'`
- **tsk-2cs-2** — "Wire config-default registrations into checkConfigNotStale
  against the shared config file; nest runner's own defaults under a
  `runner` key; update every real flat-config read site
  (`src/runner/dispatch.mjs`, `src/runner/loop.mjs`,
  `src/intake/judge-executor.mjs`, `bin/fgos.mjs`, `bin/fgos-runner.mjs`) to
  `cfg.runner.*`." `parent: tsk-2cs`, depends on `tsk-2cs-1` (mechanism must
  exist first) and, in practice though not as a formal graph `deps` entry
  until confirmed real, on `tsk-2ta`'s shared file landing — flagged as the
  plan's top risk, not silently wired into the dependency graph without the
  product owner's confirmation (deps is a structural, user-owned field per
  the standing rule against silently changing user-decided fields). Given
  the confirmed wider footprint, this piece's own mode is high-risk on its
  own merits, not just by inheriting its parent's. Verify: `npm test` (full
  suite — the touched surface now spans setup/runner/intake/both CLI
  entries, too wide for a safe scoped subset)

Neither child is created yet — this plan names them; creating the actual
items (and deciding whether `tsk-2cs-2` formally depends on `tsk-2ta` in the
graph, or just in this plan's prose) is `fgos-coding-validating`'s/execution's next
step, consistent with this skill never applying its own shape directly.

## Verify command

```
npm test
```

Full suite (`node --test 'test/**/*.test.mjs'`) — this item touches
`src/setup/` and `src/runner/`, each already covered by existing tests that
must stay green (AGENTS.md DoD question 5). Each child piece above also
carries its own narrower verify command for faster iteration during
execution.

## Assumptions (pending fgos-coding-validating proof)

- `tsk-2ta`'s eventual landed state provides a stable, discoverable path for
  the shared config file (piece 2 needs to import or read this path, not
  hardcode a guess) — flagged as the plan's top risk above, not assumed
  silently.
- `mergeConfigDefaults` needs no code change to support nested,
  per-module-keyed defaults — based on reading its existing recursive
  plain-object handling (`src/setup/config-merge.mjs:21-39`), not yet proven
  against a real multi-module composed object.
- ~~No other code beyond `src/runner/dispatch.mjs` reads `DEFAULT_RUNNER_CONFIG`
  or the runner config file's flat shape directly~~ — **resolved, false**:
  confirmed at `fgos-coding-validating` by direct grep (not `impact()`, which
  under-reported) that `src/runner/loop.mjs`, `src/intake/judge-executor.mjs`,
  `bin/fgos.mjs`, and `bin/fgos-runner.mjs` all read the flat shape too. See
  Approach's "Real blast radius" note and the updated Files-touched list.
- `test/cli/fgos.test.mjs` covers the `bin/fgos.mjs` call sites at line 244
  (and 892/912/2727) closely enough to catch a `.runner.timeoutMs` regression
  — confirmed the file exists (grep hit during validating), not yet read for
  its exact assertions; if it does not cover these lines closely enough,
  execution needs to add coverage before piece 2 is done, not skip it.
