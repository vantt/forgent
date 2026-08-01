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
- **multi-domain** — yes: touches setup (`src/setup/*`) and runner
  (`src/runner/dispatch.mjs`) at once, and coordinates with a second,
  concurrently in-flight item (`tsk-2ta`) sharing the same target config
  file.

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
new product fork — exactly what `fgos-validating` exists to check, so it is
recorded here as the plan's top risk (below) with a concrete proof point,
not sent back to `fgos-exploring`.

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

Alternatives rejected:

- Each `configDefault` entry names its own target file path (my original
  framing before the product owner corrected it) — rejected: contradicts the
  explicit "one shared file, each module its own entry" goal (CONTEXT.md D3).
- `tsk-2cs` performs the `.fgos-runner.json` → shared-file rename itself —
  rejected per CONTEXT.md D4: `tsk-2ta` already locked and is executing that
  exact move; doing it twice risks a real merge collision on the same file.

## Risk map

| Component | Risk | Proof point (→ fgos-validating) |
|---|---|---|
| `tsk-2ta`'s current children don't yet prove the shared-file rename | **High** — piece 2 assumes a shared config file exists at a stable, known path; `tsk-2ta-1`'s own verify command is too weak to prove it does | Before piece 2 starts: read `tsk-2ta`'s real merge state (has `fgw/tsk-2ta` merged to `main`?) and grep the actual shared-file path in its landed code — not the aspirational `plan.md` text. If unresolved, piece 2 waits; piece 1 does not. |
| Existing 5 checks' behavior must survive the `registrations.mjs` refactor | Medium — real behavior regression risk on a well-tested file | `test/setup/checks.test.mjs` (existing) must stay green unmodified in assertions, only wiring changed |
| `src/runner/dispatch.mjs` config-read shape change (D6) | Medium — `ensureRunnerConfig` is depended on by the runner loop, high blast radius if wrong | `impact({target: "ensureRunnerConfig", direction: "upstream"})` before editing (impact-analysis: full, GitNexus present — see below); existing runner tests plus a new test asserting `config.runner.*` reads |
| Registry accepts a new entry without editing `checks.mjs` | Low-medium — the item's own core acceptance bar, currently unproven | New test in `test/setup/registrations.test.mjs`: register a throwaway check via `registrations.mjs` only, assert `DOCTOR_CHECKS`/doctor output includes it, assert `checks.mjs`'s own diff for that test is empty |
| `docs/specs/distribution.md` Data Dictionary #7 drift | Low — already stale before this item (says 3, code has 5) | Leave the spec edit to `tsk-1qm` (its own locked scope, `deps: [tsk-2cs, tsk-2qz]`) — do not fix it here, avoid scope creep beyond this item's footprint |

**impact-analysis: full** — GitNexus registered and `present` (confirmed via
`fgos tool query --capability impact-analysis --status present` during
`fgos-exploring`). Before editing any symbol in `src/setup/checks.mjs`,
`src/setup/config-merge.mjs`, or `src/runner/dispatch.mjs`'s
`ensureRunnerConfig`, run `impact()` and report the blast radius per the
CLAUDE.md/AGENTS.md gate.

## Files likely touched

- `src/setup/registrations.mjs` (new) — the registry itself (piece 1)
- `src/setup/checks.mjs` — `DOCTOR_CHECKS` derived from the registry;
  `checkConfigNotStale` composes config-defaults from the registry (piece 2)
- `src/runner/dispatch.mjs` — `ensureRunnerConfig`/runner config reads move
  under a `runner` key (piece 2, D6)
- `test/setup/registrations.test.mjs` (new) — proves entry-without-edit
- `test/setup/checks.test.mjs` — updated wiring, same assertions
- `test/setup/config-merge.test.mjs` — likely unchanged (`mergeConfigDefaults`
  itself is not modified, only composed differently by its caller)
- `test/runner/*.test.mjs` — new coverage for `config.runner.*` reads

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
   until that is confirmed at `fgos-validating` or execution time.

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
  `runner` key; update `src/runner/dispatch.mjs` accordingly." `parent:
  tsk-2cs`, depends on `tsk-2cs-1` (mechanism must exist first) and, in
  practice though not as a formal graph `deps` entry until confirmed real,
  on `tsk-2ta`'s shared file landing — flagged as the plan's top risk, not
  silently wired into the dependency graph without the product owner's
  confirmation (deps is a structural, user-owned field per the standing
  rule against silently changing user-decided fields). Verify: `node --test
  'test/setup/**/*.test.mjs' 'test/runner/*.test.mjs'`

Neither child is created yet — this plan names them; creating the actual
items (and deciding whether `tsk-2cs-2` formally depends on `tsk-2ta` in the
graph, or just in this plan's prose) is `fgos-validating`'s/execution's next
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

## Assumptions (pending fgos-validating proof)

- `tsk-2ta`'s eventual landed state provides a stable, discoverable path for
  the shared config file (piece 2 needs to import or read this path, not
  hardcode a guess) — flagged as the plan's top risk above, not assumed
  silently.
- `mergeConfigDefaults` needs no code change to support nested,
  per-module-keyed defaults — based on reading its existing recursive
  plain-object handling (`src/setup/config-merge.mjs:21-39`), not yet proven
  against a real multi-module composed object.
- No other code beyond `src/runner/dispatch.mjs` reads `DEFAULT_RUNNER_CONFIG`
  or the runner config file's flat shape directly — not yet confirmed by a
  full `impact()` call (flagged for execution time per the impact-analysis
  gate above).
