---
type: plan
title: fgos setup initializes global config (tsk-1ri)
timestamp: 2026-08-08T08:40:00.000Z
---

# fgos setup initializes global config

Mode: standard

Lane decided via `fgos-routing`'s own Mode-gate direct-entry fallback (this
session never ran `fgos-routing`'s Orient step for this item — went
submit → `fgos-coding-shaping` → `fgos-coding-exploring` directly). Flag count: 2
— **public contracts** (`fgos setup`'s documented behavior in
`docs/specs/distribution.md`/`README.md` changes: it now also writes
`~/.fgos/config.json`, not just project-local state) and **existing
covered behavior** (`fgos setup`/`ensureSharedConfigDefaults` already have
real test coverage this change must not regress). No hard-gate flag (no
auth, data loss, audit/security, external provider, or validation
removal) — standard, not high-risk.

## Approach

**Chosen path — reuse `ensureSharedConfigDefaults` as-is, called against
`os.homedir()` instead of a project dir, rather than writing a new
global-specific init function.**

Key finding: `ensureSharedConfigDefaults(dir)`
(`src/setup/registrations.mjs:161-171`) is already dir-generic — it calls
`readSharedConfig(dir)`/`sharedConfigFilePath(dir)`/`writeSharedConfig(dir,
config)` (`src/config/shared-config-file.mjs`), none of which assume `dir`
is a project root. `sharedConfigFilePath(os.homedir())` resolves to
`path.join(os.homedir(), '.fgos', 'config.json')` — byte-identical to
`src/config/global-config.mjs`'s own `defaultGlobalConfigPath()`. So
`ensureSharedConfigDefaults(os.homedir())` already does exactly what D1
locks (full default shape via `assembleRegistryDefaults()`, fill-missing-
only via `mergeConfigDefaults`) with **zero new functions** — this is a
call-site change in `bin/fgos.mjs`'s `setup` case, not new logic in
`src/config/global-config.mjs`.

**Alternative rejected:** adding a parallel `ensureGlobalConfigDefaults`
function (or a write path inside `global-config.mjs` duplicating
`readSharedConfig`/`writeSharedConfig`). Rejected — it would duplicate
logic `ensureSharedConfigDefaults` already provides byte-for-byte, for no
behavioral difference (D1 says the global shape should be identical to the
project shape). Violates DRY for no gain; the existing function's own
`dir` parameter already generalizes to this case honestly.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| `bin/fgos.mjs`'s `setup` case calling `ensureSharedConfigDefaults(os.homedir())` | Low — reuses a function with existing test coverage (`test/setup/registrations.test.mjs:163-178`), only a new call site | `fgos-coding-validating`: confirm the call site compiles/runs against a temp `HOME`, doesn't touch this dev machine's real `~/.fgos/config.json` |
| Test isolation (never write to the real dev machine's `~/.fgos/config.json` while running `npm test`) | Medium — a missed `process.env.HOME` override in a new test would pollute the real machine | Precedent already exists and must be followed exactly: `test/config/global-config.test.mjs:122-134` overrides `process.env.HOME` to a temp dir, restores it in a `finally`. New test for `fgos setup`'s global-write behavior must use the same pattern. |
| `mergeWithGlobalConfig`'s "project wins" semantics once global commonly holds full defaults too | Low — already covered by `test/config/global-config.test.mjs`'s precedence tests (project value wins even when both levels declare the same key); this item adds no new precedence logic, only populates the global file more often | none needed beyond existing coverage — informational only |
| `docs/specs/distribution.md`/`README.md` going stale (public-contract flag) | Low, but real — Setup's documented behavior changes | Update `docs/specs/distribution.md` Setup Behaviors + Data Dictionary and `README.md`'s Setup section in the same change, not deferred |

Impact-analysis capability gate: `fgos tool query --capability
impact-analysis --status present` → GitNexus `present` but `tsk-1lg`
(separate, open) flags the index as 434 commits stale — **degraded**.
`bin/fgos.mjs`'s `setup` case and `ensureSharedConfigDefaults` are both
small, already-covered-by-tests functions with a well-understood, narrow
caller set (confirmed by direct `rg` read in `CONTEXT.md`'s Scout
evidence, not GitNexus) — the degraded posture does not block this plan,
but `fgos-coding-implement` should still run `impact()` on
`ensureSharedConfigDefaults` before editing it and cross-check with `rg`
if the result looks thin, per `CLAUDE.md`'s gate.

`fgos graph --what-if tsk-1ri --json` → `unblocksTransitive: 0`,
`newlyReady: []` — nothing else in the backlog depends on this item;
confirms no ordering question and no reason to split.

## Shape

One honest piece — no split (`fgos graph --what-if` above confirms no
other item depends on this one, and the change is narrowly scoped to one
call site plus its own test and two doc updates). Files touched:

- `bin/fgos.mjs` — `setup` case: add
  `const { addedKeys: globalAddedKeys } = ensureSharedConfigDefaults(os.homedir())`
  alongside the existing project-local call; extend the returned envelope
  with the global result (e.g. `globalConfigPath`, `globalConfigCreated`,
  `globalConfigAddedKeys`) — exact field names left to implementation,
  matching the existing `configPath`/`configCreated`/`configAddedKeys`
  naming convention already used for the project-local result just above
  it in the same case block.
- `test/setup/checks.test.mjs` (or a new adjacent test file, implementer's
  call) — integration test: `fgos setup` run with `process.env.HOME`
  pointed at a temp dir populates `<tempHome>/.fgos/config.json` with the
  full default shape, and does not rewrite it on a second run when nothing
  changed (mirrors `test/setup/registrations.test.mjs:163-178`'s existing
  two-case shape for the project-local version, applied to the global
  path).
- `docs/history/global-project-config-awareness/CONTEXT.md` — refresh the
  stale "Chưa làm" section (the `mergeWithGlobalConfig` runtime wiring it
  describes as undone is already real, confirmed in this item's own
  `CONTEXT.md` Scout evidence) and resolve the "Có cần `fgos setup` cũng
  ghi/khởi tạo `~/.fgos/config.json`" Outstanding question by pointing at
  this item's own D1/D2.
- `docs/specs/distribution.md` — Setup Behaviors section + Data Dictionary
  #3/#8-adjacent rows (wherever `fgos setup`'s current effects are listed)
  gain a line for the global-config write.
- `README.md` — Setup section gains a short line noting `fgos setup` also
  initializes `~/.fgos/config.json`.

## Proof surface

Real, runnable verify for this item as a whole (no split, so this is the
item's own verify, not a per-child one):

```
npm test
```

(the new integration test named above is added to the suite `npm test`
already runs — no separate command needed; `fgos-coding-planning` does not invent
a new test runner, per this skill's own Proof-surface rule. Exact new
test file/name is an implementation choice, left to
`fgos-coding-implement`.)

## Assumptions

- `os.homedir()` resolves correctly in every environment `fgos setup` runs
  in (already relied upon today by `checks.mjs`'s rc-file detection and
  `global-config.mjs`'s own `defaultGlobalConfigPath()` — not a new
  assumption this item introduces).
- No existing `~/.fgos/config.json` on any real user's machine has a shape
  `assembleRegistryDefaults()`'s fill-missing-only merge would corrupt —
  same guarantee `ensureSharedConfigDefaults` already gives project-local
  files (never overwrites a present key), extended here with no new risk.

## Open Questions

None material — `CONTEXT.md`'s two Outstanding items (exact
function/call-site shape, exact message wording) are implementation
choices, left to `fgos-coding-implement`, not gray areas this plan needs
`fgos-coding-exploring` for.
