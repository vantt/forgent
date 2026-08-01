# Plan: tsk-2qz — fgos doctor tự fix được .fgos/gate-bypass.json

**Decisions source:** `docs/history/doctor-fix-gate-bypass/CONTEXT.md` (D1-D3)

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
  it"); D1's tsk-2ta-landing dependency is itself unproven at this writing.
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

### Piece 2 — real gate-bypass entry, targeting the shared config file (D1)

Once `tsk-2ta`'s shared config file (`.fgos/config.json`, or wherever
`tsk-2ta` lands it) is real: register gate-bypass's own entry in
`registrations.mjs` with all three capabilities (`check` — is
`config.gateBypass` present/well-shaped; `configDefault` — `{ level:
'off' }` under the `gateBypass` key, mirroring `DEFAULT_LEVEL`; `fix` —
create the key or patch a missing/malformed `level` back to a safe
default, mirroring `ensureRunnerConfig`'s create-if-missing /
merge-missing-keys shape). `src/state/gate-bypass.mjs`'s
`readGateBypassLevel` moves from reading standalone `<dir>/gate-bypass.json`
to reading `config.gateBypass.level` from the shared file (still fails
closed to `DEFAULT_LEVEL` on anything missing/malformed — that contract
does not change, only the file it reads).

This piece is **blocked** on tsk-2ta per CONTEXT.md D1 — not started until
its proof point below resolves.

Alternatives rejected:
- Bootstrap `.fgos/gate-bypass.json` standalone now, migrate later —
  rejected per CONTEXT.md D1 (user explicitly chose to wait, citing
  `tsk-2cs`'s own precedent of the identical risk).

## Risk map

| Component | Risk | Proof point (→ fgos-validating) |
|---|---|---|
| `tsk-2ta`'s shared config file doesn't exist yet | **High** — piece 2 has no real target path to write against | Before piece 2 starts: read `tsk-2ta`'s real merge state (`fgw/tsk-2ta` merged to `main`?) and confirm the shared file's real path/shape by direct read of landed code, not `plan.md` prose. If unresolved, piece 2 waits; piece 1 does not (CONTEXT.md D1). |
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

Piece 2 (blocked on tsk-2ta, per D1):
- `src/setup/registrations.mjs` — real gate-bypass entry (check +
  configDefault + fix)
- `src/state/gate-bypass.mjs` — `readGateBypassLevel` reads
  `config.gateBypass.level` from the shared file instead of standalone
  `gate-bypass.json`
- `test/state/gate-bypass.test.mjs` — updated for the new read path,
  fail-closed assertions preserved

Not touched by this item (deliberately, per CONTEXT.md feature boundary):
`docs/specs/distribution.md` (RUL9/RUL11 formal supersede — `tsk-1qm`'s
scope), any physical move of `.fgos-runner.json` (`tsk-2ta`'s scope).

## Order

`fgos graph --json`: tsk-2qz is not on `criticalPath`; it appears in
`topUnblock` (unblocks 1 real, 2 newly — `tsk-1qm`). No ambiguity between
piece 1/piece 2 ordering to resolve with `--what-if` — piece 2 mechanically
depends on piece 1's registry shape existing, and is additionally blocked
externally on `tsk-2ta` (CONTEXT.md D1), so the order is forced, not a
judgment call:

1. **Piece 1 first** — self-contained, zero dependency on `tsk-2ta`,
   proves the registry's actual minimum bar (a new entry needs no edit
   beyond `registrations.mjs` + the CLI plumbing that already reads it).
2. **Piece 2 second** — gated on confirming `tsk-2ta`'s shared file is
   real (the plan's top risk); do not start `src/state/gate-bypass.mjs`
   changes until that is confirmed at `fgos-validating` or execution time.

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
  `config.gateBypass.level`." `parent: tsk-2qz`, depends on `tsk-2qz-1`
  (registry shape must exist first) and, in practice though not yet a
  formal graph `deps` entry, on `tsk-2ta`'s shared file landing — flagged
  as this plan's top risk, not silently wired into the graph without
  confirming `tsk-2ta`'s real merge state first (CONTEXT.md D1's own
  instruction — `fgos-validating`/execution decides the formal wiring).
  Verify: `node --test 'test/state/gate-bypass.test.mjs' 'test/setup/**/*.test.mjs'`

Neither child is created yet — this plan names them; creating the actual
items (and deciding whether `tsk-2qz-2` formally depends on `tsk-2ta` in
the graph) is `fgos-validating`'s/execution's next step, consistent with
this skill never applying its own shape directly.

## Verify command

```
node --test 'test/setup/**/*.test.mjs' 'test/state/gate-bypass.test.mjs' 'test/cli/fgos.test.mjs'
```

Scoped to the real touched surface (setup registry, gate-bypass state, CLI
manifest/doctor case) rather than the full suite — narrower than
`tsk-2cs`'s own `npm test` because this item's blast radius does not reach
`src/runner/*`/`src/intake/*` the way `tsk-2cs`'s D6 did. Each child piece
above also carries its own narrower verify command for faster iteration.

## Assumptions (pending fgos-validating proof)

- `tsk-2ta`'s eventual landed state provides a stable, discoverable path
  for the shared config file that piece 2 can import/read, not a hardcoded
  guess — flagged as the plan's top risk above, not assumed silently.
- `mergeConfigDefaults` (unchanged, `src/setup/config-merge.mjs`) needs no
  code change to support piece 2's nested `gateBypass` key — based on
  `tsk-2cs`'s own confirmed reading of its recursive plain-object handling,
  not yet re-verified against this specific shape.
- `test/cli/fgos.test.mjs` covers doctor's CLI entry point closely enough
  to catch a manifest/`--fix`-flag regression — file exists (confirmed by
  direct find during this planning session), not yet read for its exact
  assertions; if it does not cover this closely enough, execution needs to
  add coverage before piece 1 is done, not skip it.
