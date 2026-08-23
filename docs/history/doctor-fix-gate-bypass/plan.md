# Plan: tsk-2qz — fgos doctor tự fix được .fgos/gate-bypass.json

**Decisions source:** `docs/history/doctor-fix-gate-bypass/CONTEXT.md` (D1-D4)

**Revised 2026-08-01 after `tsk-5vf` merged to `main`** (see CONTEXT.md D4):
piece 2 is no longer blocked — real evidence below replaces the earlier
"wait on tsk-2ta" framing throughout.

## Mode: high-risk

Flags counted (auth / authorization / data model / audit-security /
external systems / public contracts / cross-platform / existing covered
behavior / weak proof around the area / multi-domain):

- **data model** — yes: D3's third registry capability (`fix`, alongside
  existing `check`/`configDefault` in `registrations.mjs`) is a new,
  persisted registration shape.
- **audit-security** — yes: `.fgos/gate-bypass.json`'s `level` field
  directly controls whether a skill-embedded confirmation gate auto-approves
  instead of asking a person (`src/state/gate-bypass.mjs`'s
  `canAutoApprove`) — a hard-gate flag by itself.
- **public contracts** — yes: D2 flips `doctor`'s manifest declaration
  (`touchesState`/`externalEffect`, `src/cli/command-registry.mjs:845-849`)
  from read-only to write-capable, superseding RUL9/RUL11
  (`docs/specs/distribution.md:200,210`) — a locked spec contract this item
  reverses (formal spec text supersede stays `tsk-1qm`'s, per CONTEXT.md's
  feature boundary; this item's own manifest/behavior change is real
  regardless).
- **existing covered behavior** — yes: `test/setup/checks.test.mjs`,
  `test/setup/registrations.test.mjs`, `test/setup/doctor-fresh-run.test.mjs`,
  `test/state/gate-bypass.test.mjs` already cover the exact paths this item
  changes; doctor's read-only behavior without `--fix` must survive
  unchanged (CONTEXT.md D2).
- **weak proof around the area** — yes: the `fix` registry capability is
  greenfield (no test today proves "register a fix, `doctor --fix` runs
  it"). D1's original tsk-2ta-landing dependency is now resolved with real
  evidence (D4) — no longer a weak-proof source, kept here only because the
  `fix` capability itself is still unbuilt.
- **multi-domain** — yes: touches setup (`src/setup/registrations.mjs`),
  CLI (`bin/fgos.mjs`, `src/cli/command-registry.mjs`), and state
  (`src/state/gate-bypass.mjs`) — real footprint confirmed by direct file
  read, not guessed.

6 flags ≥ 4, plus one hard-gate flag (audit-security) on its own →
**high-risk** by both the count and the hard-gate rule. Anything smaller
would hide the RUL9/RUL11 contract reversal and the gate-bypass
security-relevance of what's being made writable.

## Approach

### Piece 1 — generic fix-registry mechanism + CLI plumbing (D2, D3)

`src/setup/registrations.mjs`: add a third independent registration
capability, `fix` (a function per entry, alongside existing
`check`/`configDefault` — same "independent, not forced pairing" style
`tsk-2cs`'s own D2 already established there). `registerFix({ id, fix })`
or an equivalent third optional field on the existing register calls —
implementer detail for execution, not re-decided here.

`bin/fgos.mjs`'s `case 'doctor'`: add a real `--fix` flag. Without it,
today's read-only diagnostic path is byte-identical (CONTEXT.md D2 — no
default-behavior change). With it, iterate every registered entry that
carries a `fix` function and invoke it, reporting what each one did —
mirrors `ensureRunnerConfig`'s own report-what-changed style
(`src/runner/dispatch.mjs:292-296,307-309`).

`src/cli/command-registry.mjs`: update doctor's manifest entry —
`touchesState`/`externalEffect` flip to reflect the `--fix` path (RUL9
supersede), `--fix` added to `parameters`, description updated to name
both modes (diagnostic-only default, repair with `--fix`).

Proven with a **test-only registration** (a throwaway entry in
`test/setup/registrations.test.mjs`), not the real gate-bypass entry —
same precedent `tsk-2cs`'s own plan used to prove `configDefault`
generically before wiring a real consumer (`docs/history/
setup-doctor-config-registry/plan.md`, Piece 2). This keeps piece 1
entirely independent of D1's tsk-2ta wait.

Alternatives rejected:
- Hardcode the fix directly in `bin/fgos.mjs`'s doctor case, no registry
  entry — rejected per CONTEXT.md D3 (user explicitly chose the generic
  registry field over a one-off).
- Make `--fix` a separate top-level verb instead of a doctor flag —
  rejected: vision doc §2 trụ cột 3 and §7 both frame this as `doctor
  --fix` specifically, not a new verb; no evidence anyone asked for a
  separate verb.

### Piece 2 — real gate-bypass entry, targeting the shared config file (D1, D4)

The shared config file is real: `.fgos/config.json` (confirmed on disk),
read/written via `src/config/shared-config-file.mjs`'s
`readSharedConfig(dir)`/`writeSharedConfig(dir, config)`/
`sharedConfigFilePath(dir)`/`legacyRunnerConfigPath(dir)`, and its default
shape assembled generically by `registrations.mjs`'s
`assembleRegistryDefaults()`/`ensureSharedConfigDefaults(dir)` (tsk-5vf D4)
from every `CONFIG_DEFAULT_REGISTRATIONS` entry.

Register gate-bypass's own entry in `registrations.mjs`, following the
exact pattern the `runner` entry already uses there (lines ~371-375):
`registerConfigDefault({ id: 'gateBypass', key: 'gateBypass', shape: {
level: DEFAULT_LEVEL } })` (`DEFAULT_LEVEL` from `src/state/gate-bypass.mjs`,
already `'off'`) — `ensureSharedConfigDefaults` (already called by `fgos
setup`, `bin/fgos.mjs:2729`) then bootstraps `config.gateBypass` for free,
no new setup code. Plus `registerCheck` (is `config.gateBypass`
present/well-shaped — mirrors `checkConfigNotStale`'s pattern) and Piece
1's new `fix` capability (create the key or patch a missing/malformed
`level` back to `DEFAULT_LEVEL`, invoked by `doctor --fix`).

`src/state/gate-bypass.mjs`'s `readGateBypassLevel` moves from reading
standalone `<dir>/gate-bypass.json` directly to calling
`readSharedConfig(dir).gateBypass?.level`, with the same fail-closed
contract to `DEFAULT_LEVEL` on anything missing/malformed unchanged — only
the file/path it reads changes. `readSharedConfig` already falls back to
legacy `.fgos-runner.json` for the `runner` key; it has no equivalent
fallback for a standalone `gate-bypass.json`, so `readGateBypassLevel`
itself needs its own narrow legacy-read (today's existing
`<dir>/gate-bypass.json`, currently `{"level":"standard"}` on disk in this
repo) for any caller whose `.fgos/config.json` doesn't have a `gateBypass`
key yet — mirroring the same "never delete the old file, read it as
fallback" discipline `readSharedConfig` already applies to `runner`.

Alternatives rejected:
- Wait further / re-verify tsk-2ta a third time — rejected: evidence is
  now doubly confirmed by direct read of landed `main` code (D4), not
  just the item tracker's status field.

## Risk map

| Component | Risk | Proof point (→ fgos-coding-validating) |
|---|---|---|
| Shared config file existed only as a plan-time assumption | **Resolved** (was High) — `tsk-5vf` merged to `main` (`af2fc64`); `.fgos/config.json` confirmed on disk, `ensureSharedConfigDefaults`/`readSharedConfig` confirmed real by direct read (CONTEXT.md D4) | Done — re-confirm at execution time that `fgw/tsk-2qz` has actually merged `main` (not just read it) before editing `registrations.mjs`/`gate-bypass.mjs`, so the branch builds against the real code, not a stale local copy |
| Doctor's read-only-by-default behavior must survive the `--fix` addition | Medium — real regression risk on a well-tested file (RUL9's own behavior, `test/setup/doctor-fresh-run.test.mjs`) | Existing doctor tests (no `--fix` passed) must stay green unmodified in assertions; new tests only cover the `--fix` path additively |
| `fix` registry capability accepts an entry without any other file edit | Low-medium — item's own core acceptance bar for piece 1, currently unproven | New/extended assertions in `test/setup/registrations.test.mjs`: register a throwaway `fix` entry, assert `doctor --fix` runs it, assert no other file's diff is required |
| `gate-bypass.mjs`'s fail-closed contract (missing/malformed → `DEFAULT_LEVEL`) must survive the read-path move (piece 2) | Medium — security-relevant behavior (audit-security flag above); a regression here silently changes what auto-approves | `test/state/gate-bypass.test.mjs`'s existing fail-closed assertions must stay green against the new read path; add assertions for the new `config.gateBypass` shape specifically |
| GitNexus `impact()` reliability for these symbols | Unconfirmed for this item's specific symbols — `tsk-2cs`'s own plan found `impact()` under-reported for `ensureRunnerConfig`/`DEFAULT_RUNNER_CONFIG` (returned `impactedCount:0` despite real callers) | Re-verify with grep/direct read before editing `readGateBypassLevel`, `DOCTOR_CHECKS`, and the manifest entry, same as `tsk-2cs` did — do not trust a low/zero `impact()` count alone |
| `docs/specs/distribution.md` RUL9/RUL11 left un-superseded by this item | Low — deliberately out of this item's declared scope (CONTEXT.md feature boundary) | Confirm `tsk-1qm` (`deps: [tsk-2cs, tsk-2qz]`) still carries this as its own scope — do not fix here, avoid scope creep beyond this item's footprint |

**impact-analysis: full** — GitNexus registered and reports `present`
(`fgos tool query --capability impact-analysis --status present`, re-run
from the main checkout root during this planning session). Per the
CLAUDE.md gate, still cross-check any low/zero `impact()` result against a
direct grep before trusting it (see GitNexus row above — `tsk-2cs`'s own
experience with the same tool on adjacent symbols).

## Files likely touched

Piece 1:
- `src/setup/registrations.mjs` — third registration capability, `fix`
- `bin/fgos.mjs` — `case 'doctor'`: `--fix` flag, invoke registered fixes
- `src/cli/command-registry.mjs` — doctor's manifest entry: `--fix` param,
  `touchesState`/`externalEffect` updated
- `test/setup/registrations.test.mjs` — proves entry-without-other-edit
- `test/setup/doctor-fresh-run.test.mjs`, `test/setup/checks.test.mjs` —
  updated/extended for the `--fix` path, existing assertions unmodified

Piece 2 (unblocked — see D4):
- `src/setup/registrations.mjs` — real gate-bypass entry (`registerCheck` +
  `registerConfigDefault` + Piece 1's `fix`), following the `runner`
  entry's own pattern
- `src/state/gate-bypass.mjs` — `readGateBypassLevel` reads
  `readSharedConfig(dir).gateBypass?.level`, with its own narrow
  legacy-read fallback for today's standalone `gate-bypass.json`
- `test/state/gate-bypass.test.mjs` — updated for the new read path,
  fail-closed assertions preserved
- `test/config/shared-config-file.test.mjs` — likely needs a `gateBypass`
  key assertion alongside its existing `runner`-key coverage

Not touched by this item (deliberately, per CONTEXT.md feature boundary):
`docs/specs/distribution.md` (RUL9/RUL11 formal supersede — `tsk-1qm`'s
scope), `src/config/global-config.mjs` (global-vs-project precedence —
already tsk-2ta/tsk-5vf's finished scope).

## Order

`fgos graph --json`: tsk-2qz is not on `criticalPath`; it appears in
`topUnblock` (unblocks 1 real, 2 newly — `tsk-1qm`). Piece 2 mechanically
depends on Piece 1's `fix` capability existing (its registry entry needs a
`fix` field to register), so the order is still forced by that dependency
alone now, not by any external block:

1. **Piece 1 first** — self-contained, proves the registry's actual
   minimum bar (a new entry needs no edit beyond `registrations.mjs` + the
   CLI plumbing that already reads it).
2. **Piece 2 second** — needs Piece 1's `fix` field to exist before
   gate-bypass can register one; no longer needs any external landing to
   proceed (D4).

## Split decision

**Split into two child items**, mirroring the real dependency/blocker
difference above (same shape `tsk-2cs`'s own plan used for the identical
class of risk):

- **tsk-2qz-1** — "Add a generic `fix` registration capability to
  `registrations.mjs` (third capability alongside `check`/`configDefault`);
  wire `fgos doctor --fix` to invoke registered fixes; update doctor's
  manifest access declaration. Prove with a throwaway test registration,
  not the real gate-bypass entry." `parent: tsk-2qz`. Verify:
  `node --test 'test/setup/**/*.test.mjs'`
- **tsk-2qz-2** — "Register gate-bypass's real check/configDefault/fix
  entry against the shared config file; move `readGateBypassLevel` to read
  `readSharedConfig(dir).gateBypass?.level`." `parent: tsk-2qz`, depends on
  `tsk-2qz-1` (registry shape must exist first) — no external dependency
  remains (D4). Verify:
  `node --test 'test/state/gate-bypass.test.mjs' 'test/setup/**/*.test.mjs' 'test/config/shared-config-file.test.mjs'`

Both children already created (`fgos add`, during this planning pass):
`tsk-2qz-1`, `tsk-2qz-2`, both `parent: tsk-2qz`. No `deps: [tsk-2ta]`
needed on either, consistent with D4 — the external block this plan
originally flagged never materializes into a real dependency edge.

## Verify command

```
node --test 'test/setup/**/*.test.mjs' 'test/state/gate-bypass.test.mjs' 'test/cli/fgos.test.mjs'
```

Scoped to the real touched surface (setup registry, gate-bypass state, CLI
manifest/doctor case) rather than the full suite — narrower than
`tsk-2cs`'s own `npm test` because this item's blast radius does not reach
`src/runner/*`/`src/intake/*` the way `tsk-2cs`'s D6 did. Each child piece
above also carries its own narrower verify command for faster iteration.

## Assumptions (pending fgos-coding-validating proof)

- ~~`tsk-2ta`'s eventual landed state provides a stable, discoverable path
  for the shared config file~~ — **resolved, true**: `.fgos/config.json`
  confirmed real on disk, `readSharedConfig`/`ensureSharedConfigDefaults`
  confirmed real by direct read of `src/config/shared-config-file.mjs` and
  `src/setup/registrations.mjs` on `main` (D4).
- `mergeConfigDefaults` (unchanged, `src/setup/config-merge.mjs`) needs no
  code change to support a new `gateBypass` key alongside the existing
  `runner` key — `assembleRegistryDefaults()` already proves this generic
  composition for `runner`; adding a second registered key follows the
  same, already-exercised path, not a new one.
- ~~`test/cli/fgos.test.mjs` covers doctor's CLI entry point~~ — **checked,
  false**: `grep -n doctor test/cli/fgos.test.mjs` returns zero hits. Real
  doctor CLI e2e coverage lives in `test/setup/doctor-fresh-run.test.mjs`
  instead (confirmed: `spawnSync`s the real `fgos` binary with `doctor`
  args) — already correctly listed under Piece 1's files-touched above;
  this assumption just named the wrong file. No coverage gap, just a
  corrected citation.
