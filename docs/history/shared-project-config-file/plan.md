# Plan: tsk-5vf — di dời project config sang `.fgos/config.json`, wire global config vào runtime thật

**Decisions source:** `docs/history/shared-project-config-file/CONTEXT.md` (D1-D5)

## Mode: high-risk

Flags counted (auth / authorization / data model / audit-security / external
systems / public contracts / cross-platform / existing covered behavior /
weak proof around the area / multi-domain):

- **data model** — yes: persisted config file's shape changes (flat root →
  nested per-module sections), plus a new physical location.
- **public contracts** — yes: `fgos doctor`'s check output changes
  (`config-not-stale`, `config-awareness`); `docs/specs/distribution.md`
  Data Dictionary #7 needs updating same as `tsk-2ta` already flagged this
  exact pattern.
- **existing covered behavior** — yes: `test/config/global-config.test.mjs`,
  `test/runner/dispatch.test.mjs`, `test/setup/checks.test.mjs`,
  `test/setup/registrations.test.mjs` all already cover the exact paths this
  item changes.
- **weak proof around the area** — yes: the registry-driven assembler (D4)
  is brand-new code with zero existing test; `CONFIG_DEFAULT_REGISTRATIONS`
  itself has never been consumed by real behavior before this item.
- **multi-domain** — yes: touches runner (`src/runner/dispatch.mjs`), setup
  (`src/setup/checks.mjs`, `registrations.mjs`), config
  (`src/config/global-config.mjs`), and CLI entry points (`bin/fgos.mjs`,
  `bin/fgos-runner.mjs`) at once.

5 flags ≥ 4 → **high-risk**, by count alone (no hard-gate flag like
auth/data-loss/security/external-provider/validation-removal is present).
Same threshold and shape as `tsk-2ta`'s own plan for the sibling D1/D2 work
this item continues.

## Approach

### Step 1 — build the registry-driven assembler (D4)

New module, e.g. `src/config/shared-config-file.mjs` (kebab-case, matches
repo convention): reads `.fgos/config.json`, assembles the default shape by
merging every `CONFIG_DEFAULT_REGISTRATIONS` entry's `shape` under its own
`key`, applies `mergeConfigDefaults` once against the file's real content,
writes back only when keys were actually added (same discipline
`ensureRunnerConfig` already uses today — never rewrite a file that already
has everything). Migration fallback: when `.fgos/config.json` does not
exist but the legacy `.fgos-runner.json` does, read the old file and treat
its content as the `runner` section's value — never delete the old file
automatically; the actual physical write to the new location only happens
through `fgos setup` (D2).

### Step 2 — wire `mergeWithGlobalConfig` into the read path

The assembler's read result (whole shared-file object, sections included)
is what gets passed through `mergeWithGlobalConfig` — project object versus
loaded `~/.fgos/config.json`, project wins per key at any depth (existing
`mergeConfigDefaults` recursion already gives this for free, no new merge
logic needed). This is the "global config has real effect on runtime"
half of the gap (`tsk-2ta`'s original wording).

### Step 3 — retarget the 5 real call sites + dispatch.mjs's runner functions

`loadRunnerConfig`/`ensureRunnerConfig` (`src/runner/dispatch.mjs`) keep
their own shape-validation logic, but now operate on the assembler's
`runner` section instead of a flat file passed in directly. The 5 callers
that currently build `.fgos-runner.json` path (`bin/fgos-runner.mjs:105`,
`bin/fgos.mjs:244,892,912,2727`) go through the assembler instead of
constructing that path themselves.

### Step 4 — doctor discoverability (D5)

`checkConfigNotStale` — defined in `src/setup/registrations.mjs:224-235`
(registered there via `registerCheck` at `:284-288`; `src/setup/checks.mjs`
is a pure re-export shim, per its own header comment, and needs no edit)
— reads through the assembler and reports staleness against the registry's
default shape (natural consequence of D4 — pinned as an assumption below,
not re-opened in `CONTEXT.md`, since it does not change scope/behavior,
only how far the already-decided genericity extends). `describeConfigAwareness`'s default
`projectConfigPath` (`src/config/global-config.mjs`) points at
`.fgos/config.json`, with presence-detection aware of the legacy-fallback
case so "project config active" stays true for an install that has not run
`fgos setup` since the move yet.

### Step 5 — docs

`docs/specs/distribution.md` Data Dictionary #7 update (check output/shape
changed) — additive, same pattern `tsk-2ta`'s own plan already used for this
exact doc.

Alternatives rejected:

- Hardcode `.fgos/config.json`'s `runner` key directly in dispatch.mjs,
  skip the assembler — rejected: user explicitly chose the registry-driven
  path (D4) over this narrower option when presented both.
- Leave `checkConfigNotStale`/`describeConfigAwareness` on the old path as
  a separate follow-up item — rejected: user explicitly chose to close this
  in the same item (D5), matching AGENTS.md's doctor-discoverability gate.
- Auto-migrate (write the new file) the moment any read-only command runs
  — rejected, inherited from `tsk-2ta`'s own plan: `doctor` never writes
  (RUL9); the move stays `fgos setup`'s job (D2).

## Risk map

| Component | Risk | Proof point (→ fgos-coding-validating) |
|---|---|---|
| Registry-driven assembler (D4, new module) | High — brand-new code path, zero test today, the one piece every other step depends on | A test asserting every `CONFIG_DEFAULT_REGISTRATIONS` entry lands under its own key in the assembled default, and an existing shared-file value is never overwritten |
| 5 call-site retarget (`bin/fgos.mjs` x4, `bin/fgos-runner.mjs` x1, `dispatch.mjs`'s runner functions) | Medium — existing tests (`test/runner/dispatch.test.mjs`) target the old flat path | Grep every `.fgos-runner.json` reference in `src`/`bin`/`test` before changing; confirm none remain except the fallback-read path itself |
| `mergeWithGlobalConfig` wiring into the real read path | Medium — the function itself is tested in isolation, but has zero real caller today | An integration test: a project-set value wins over a global-set value for the same key, through the real `ensureRunnerConfig`/assembler path, not just the pure function |
| Migration fallback (old file present, new absent) | High — real, existing user installs hit this path; breaking it silently changes runtime behavior for everyone who has not re-run `fgos setup` | A test with only `.fgos-runner.json` present (no `.fgos/config.json`) resolves to the same runtime config as before this item, byte-for-byte |
| `checkConfigNotStale` + `describeConfigAwareness` path update (D5) | Medium — doctor output changes, `test/setup/checks.test.mjs` covers today's messages | Doctor's config-not-stale and config-awareness checks report against the new location; both stay `passed: true` for read-only/informational cases per RUL9 |
| `docs/specs/distribution.md` Data Dictionary #7 drift | Low — additive doc update | Row reflects the real check behavior post-change, no claim beyond what's implemented |

**impact-analysis: full** — GitNexus registered and `present`, confirmed via
`fgos tool query --capability impact-analysis --status present` during
`fgos-coding-exploring`. Before editing any symbol in `src/runner/dispatch.mjs`,
`src/setup/checks.mjs`, `src/setup/registrations.mjs`,
`src/config/global-config.mjs`, `bin/fgos.mjs`, or `bin/fgos-runner.mjs`,
run `impact()` and report the blast radius before editing, per the
CLAUDE.md/AGENTS.md gate.

## Files likely touched

- `src/config/shared-config-file.mjs` — new, the assembler (D4) + migration
  fallback read (D2)
- `src/config/global-config.mjs` — `mergeWithGlobalConfig` gains its first
  real caller (the assembler); `describeConfigAwareness`'s default
  `projectConfigPath` updated (D5)
- `src/runner/dispatch.mjs` — `loadRunnerConfig`/`ensureRunnerConfig`
  retargeted to the assembler's `runner` section
- `bin/fgos.mjs` — 4 call sites (`:244,892,912,2727`) retargeted
- `bin/fgos-runner.mjs` — 1 call site (`:105`) retargeted
- `src/setup/registrations.mjs` — `checkConfigNotStale` (the function's
  real home, `:224-235`) retargeted (D5); `registerConfigDefault`/
  `registerCheck` mechanism itself unchanged, already exists from `tsk-2cs`
- `src/setup/checks.mjs` — pure re-export shim (confirmed via read, `:1-17`);
  no edit needed
- `test/config/global-config.test.mjs` — new cases for the real
  `mergeWithGlobalConfig` caller
- `test/runner/dispatch.test.mjs` — updated for the new config path
- `test/setup/checks.test.mjs` — updated `config-not-stale`/
  `config-awareness` message expectations
- new test file for the assembler module (e.g.
  `test/config/shared-config-file.test.mjs`)
- `docs/specs/distribution.md` — Data Dictionary #7 update

## Order

`fgos graph --json` shows `tsk-5vf` as an isolated single-item component
(size 1), absent from both `criticalPath` and `topUnblock` — no graph
signal to order by, same as `tsk-2ta`'s own plan found for the sibling
work. Sequencing below is by dependency + risk instead:

1. **Assembler (Step 1)** first — every other step reads or writes through
   it; nothing else can be tested meaningfully before it exists.
2. **Global-config wiring (Step 2)** — layers directly on the assembler's
   read result, no other dependency.
3. **Call-site retarget (Step 3)** — needs the assembler's real shape
   settled first, or the retarget would have to be redone.
4. **Doctor discoverability (Step 4)** — reads through the same assembler;
   sequenced after it is proven working, not before.
5. **Docs (Step 5)** — last, describes the shipped behavior.

## Split decision

No split. Every step reads or writes through the same one new module (the
assembler) — splitting into separate items would force either a fragile
dependency chain (later items blocked on an earlier item's exact internal
shape) or duplicate assembler work across items. Matches `tsk-2ta`'s own
precedent for this exact area: high-risk mode, single item, ordered steps
inside it rather than a split.

## Verify command

```
npm test
```

Full suite — this item touches `src/config/`, `src/runner/`, `src/setup/`,
and `bin/`, each already covered by existing tests that must stay green
(AGENTS.md DoD question 5).

## Assumptions (pending fgos-coding-validating proof)

- `checkConfigNotStale` becomes generic over `CONFIG_DEFAULT_REGISTRATIONS`
  (checks every registered entry's staleness, not just `runner` alone) as a
  natural consequence of D4's registry-driven approach — not itself a new
  CONTEXT.md decision, pinned here as an implementer detail; `fgos-coding-validating`
  confirms this doesn't silently change `config-not-stale`'s `passed`
  semantics for the 4 checks that have no config-default today.
- `.fgos-runner.json` is never deleted automatically by any step in this
  item — only `fgos setup` performs the real move/write, matching D2 and
  `tsk-2ta`'s own plan precedent.
- `src/setup/registrations.mjs`'s registry MECHANISM itself
  (`registerCheck`/`registerConfigDefault`) needs no changes — this item is
  purely a new consumer of what `tsk-2cs` already built and merged. The
  file itself IS touched (Files likely touched) because `checkConfigNotStale`
  is physically defined there, not in `checks.mjs`.
