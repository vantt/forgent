# tsk-4iv — `fgos uninstall` plan

**Stage:** decompose (fgos-planning). **Date:** 2026-08-01. Builds on
`docs/history/fgos-uninstall/CONTEXT.md` (D1-D3, approved).

## Mode

**high-risk.** Flag count (per fgos-planning's mechanical gate):

| Flag | Applies? | Why |
|---|---|---|
| auth | no | — |
| authorization | no | — |
| data model | no | — |
| audit/security | **yes** | removes the pre-commit hook enforcing the main-checkout lock (D2) — a live security/enforcement control |
| external systems | no | shells out to a local package manager, not a remote service |
| public contracts | **yes** | adds a brand-new CLI verb (`fgos uninstall`), needs a `docs/specs/distribution.md` Behaviors entry |
| cross-platform | **yes** | package removal (D1) must work across npm/pnpm/yarn and OSes; Windows file-locking on a running process's own files is a real, unsolved risk |
| existing covered behavior | **yes** | reverses `insertSourceLine`/`installGitHooks`, both already under test — must not break their existing round-trip guarantees |
| weak proof around the area | **yes** | no precedent anywhere in this repo for a process removing its own installed package |
| multi-domain | no | stays inside the distribution/setup area |

5 flags, plus two hard-gate flags on their own (audit/security,
"removing a validation" — D2 literally disables the pre-commit hook).
Either alone would already force high-risk; a `standard` or smaller mode
would not honestly cover a verb that both disables a security control and
attempts to delete its own running package. (Note: the item's own
`risk: light` field was set at submit time before this shaping pass — not
reopened or overridden, per fgos-planning's own rule that mode is
`plan.md` prose, never a field write; it simply informs which edge gets
picked next, same as this item's own tier.)

## Approach

Chosen path: implement `fgos uninstall` as one CLI verb (`bin/fgos.mjs`,
new `case 'uninstall'`) that runs its steps in order — confirmation gate
first (D3), then wiring reversal (shell-rc, git-hooks), then package
removal (D1) last, since removing the package first would strand the
process mid-run before it could finish undoing its own wiring. Rejected
alternative: a separate `fgos-uninstall` standalone script outside the CLI
registry — rejected because every other install-surface verb
(`setup`/`doctor`) already lives in `bin/fgos.mjs` and follows the same
enveloped-JSON/`--pretty` output contract (Data Dictionary #8,
`docs/specs/distribution.md`); a standalone script would fork that
convention for no reason.

`fgos graph --json` shows `tsk-4iv` alone in its own component
(`unblocksTransitive: 0`, no children yet) — no other ready item depends
on this one, so ordering here is driven by the steps' own real
dependency (confirm → unwire → remove), not by `criticalPath`/`topUnblock`.

Impact-analysis posture: **full** (`gitnexus` present, confirmed in
CONTEXT.md's scout evidence) — the proof points below that lean on
blast-radius evidence (nothing else calls `insertSourceLine`/
`installGitHooks` in a way this reversal would break) can use it directly
at `fgos-validating`, not carry a "weak evidence" caveat for that part.

### Risk map

| Component | Risk | Proof point (for `fgos-validating`) |
|---|---|---|
| Shell-rc reversal | low | round-trip test: `fgos setup` inserts the source line, `fgos uninstall` removes it, a second `uninstall` run is a clean no-op |
| Git-hooks reversal (D2) | low-medium | round-trip test: unwires only when `core.hooksPath` is still exactly `.githooks`; a hooksPath the caller changed to something else is left untouched — mirrors `installGitHooks`'s existing fill-only test pattern |
| Confirmation gate (D3) | medium | test asserting `fgos uninstall` (no flag) refuses to touch anything and exits without side effects; explicit opt-in actually runs |
| Config preservation (pinned constraint) | medium | test asserting `.fgos/` data, `~/.fgos/config.json`, and project `config.json` are byte-identical before/after a full `fgos uninstall` run |
| Package self-removal (D1) | **high** | integration test: `npm pack` + install into a temp prefix + run `fgos uninstall --yes` + assert the package's files are gone and the command no longer resolves on `PATH` |
| Cross-platform self-deletion | **high, unresolved** | no CI matrix exists yet for this repo (`tsk-3nx`, separate item, still `todo`) — Windows file-locking behavior for a running process deleting its own files is flagged as an open risk, not provable in this plan; carried forward as an explicit unproven assumption |

### Files likely touched

- `bin/fgos.mjs` — new `case 'uninstall'`
- `src/setup/shell-rc.mjs` — new reversal function alongside existing
  `insertSourceLine`
- `src/setup/git-hooks.mjs` — new reversal function alongside existing
  `installGitHooks`/`mainCheckoutHookWired`
- new module for package-manager detection + removal (piece 2 below)
- `docs/specs/distribution.md` — new Uninstall entry in Behaviors &
  Operations + Data Dictionary, per the Install/setup/doctor gate in
  `AGENTS.md` (this change touches how fgOS is installed/removed)
- `test/setup-uninstall-wiring.test.mjs` (new)
- `test/uninstall-package-removal.test.mjs` (new)

## Assumptions (implementation-only, not material to CONTEXT.md's scope)

- Confirmation UX is a `--yes` flag (mirrors the common `npm uninstall -y`
  / `rm -i` convention already familiar to this CLI's users), not an
  interactive TTY prompt — D3 only locked that confirmation is required,
  not its shape; `fgos-validating` checks this is either proven or
  flagged unproven, not asked here.
- Package-manager detection reads the nearest lockfile
  (`package-lock.json`/`pnpm-lock.yaml`/`yarn.lock`) relative to the
  resolved install location, falling back to `npm` if none is found —
  implementation detail, not a scope question.

## Split

Two independently workable pieces — the well-precedented wiring reversal
(mirrors existing, tested fill-only patterns) versus the genuinely novel,
high-risk package self-removal. Splitting lets the low-risk piece land
and prove itself before the high-risk piece's weak-proof area is
tackled. Both carry `parent: tsk-4iv`.

| id | title | verify |
|---|---|---|
| `tsk-4iv-1` | `fgos uninstall`: gỡ wiring của fgOS (shell-rc source line + core.hooksPath/.githooks fill-only, D2) sau xác nhận (D3), giữ nguyên `.fgos/` data + config | `node --test test/setup-uninstall-wiring.test.mjs` |
| `tsk-4iv-2` | `fgos uninstall`: gỡ luôn package đã cài qua package manager phát hiện được (npm/pnpm/yarn, D1), tự xoá file cài đặt kể cả khi process đang chạy | `node --test test/uninstall-package-removal.test.mjs` |

`tsk-4iv-2` carries `deps: [tsk-4iv-1]` — it extends the same `uninstall`
verb piece 1 builds (confirmation gate + wiring reversal scaffold), rather
than starting a second CLI entry point.

## Gate

See hand-off message for the approval question.
