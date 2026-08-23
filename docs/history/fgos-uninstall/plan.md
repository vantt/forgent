# tsk-4iv — `fgos uninstall` plan

**Stage:** decompose (fgos-coding-planning). **Date:** 2026-08-01. Builds on
`docs/history/fgos-uninstall/CONTEXT.md` (D1-D4, approved).

## Mode

**high-risk.** Flag count (per fgos-coding-planning's mechanical gate):

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
reopened or overridden, per fgos-coding-planning's own rule that mode is
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
at `fgos-coding-validating`, not carry a "weak evidence" caveat for that part.

### Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| Shell-rc report (D4, not a deletion) | low | test asserting `fgos uninstall` detects the fgOS source line via the existing `hasSourceLine`/`deadSourceLines` primitives and reports its rc file + path in its result, without modifying the rc file's bytes at all — matches `docs/history/shell-rc-dead-source-lines/CONTEXT.md` D1's existing report-only contract |
| Git-hooks reversal (D2) | low-medium | round-trip test: unwires only when `core.hooksPath` is still exactly `.githooks`; a hooksPath the caller changed to something else is left untouched — mirrors `installGitHooks`'s existing fill-only test pattern |
| Confirmation gate (D3) | medium | test asserting `fgos uninstall` (no flag) refuses to touch anything and exits without side effects; explicit opt-in actually runs |
| Config preservation (pinned constraint) | medium | test asserting `.fgos/` data, `~/.fgos/config.json`, and project `config.json` are byte-identical before/after a full `fgos uninstall` run |
| Package self-removal (D1) — **reshaped as a spike, see below** (`fgos-coding-validating` returned this row NOT READY on 2026-08-01: zero precedent anywhere in this repo for a process removing its own installed package; plausibility only) | **high** | spike answers this before any build verify is written |
| Cross-platform self-deletion | **high, unresolved** | no CI matrix exists yet for this repo (`tsk-3nx`, separate item, still `todo`) — Windows file-locking behavior for a running process deleting its own files is flagged as an open risk, explicitly out of scope for the spike below (npm + Linux/macOS only); carried forward as an explicit unproven assumption |

### Files likely touched

- `bin/fgos.mjs` — new `case 'uninstall'`
- `src/setup/shell-rc.mjs` — no new deletion function (D4); reuses the
  existing `hasSourceLine`/`deadSourceLines` primitives to detect and
  report the fgOS source line, never edits the rc file
- `src/setup/git-hooks.mjs` — new reversal function alongside existing
  `installGitHooks`/`mainCheckoutHookWired`
- new module for package-manager detection + removal (piece 2 below)
- `docs/specs/distribution.md` — new Uninstall entry in Behaviors &
  Operations + Data Dictionary, per the Install/setup/doctor gate in
  `AGENTS.md` (this change touches how fgOS is installed/removed)
- `test/setup/uninstall-wiring.test.mjs` (new)
- `test/setup/uninstall-package-removal.test.mjs` (new)

## Assumptions (implementation-only, not material to CONTEXT.md's scope)

- Confirmation UX is a `--yes` flag (mirrors the common `npm uninstall -y`
  / `rm -i` convention already familiar to this CLI's users), not an
  interactive TTY prompt — D3 only locked that confirmation is required,
  not its shape; `fgos-coding-validating` checks this is either proven or
  flagged unproven, not asked here.
- Package-manager detection reads the nearest lockfile
  (`package-lock.json`/`pnpm-lock.yaml`/`yarn.lock`) relative to the
  resolved install location, falling back to `npm` if none is found —
  implementation detail, not a scope question.

## Split

Two independently workable pieces — the well-precedented wiring reversal
(mirrors existing, tested fill-only patterns) versus the genuinely novel
package self-removal. Splitting lets the low-risk piece land and prove
itself while the novel piece answers its own feasibility question first.
Both carry `parent: tsk-4iv`.

| id | title | verify |
|---|---|---|
| `tsk-4iv-1` | `fgos uninstall`: gỡ wiring của fgOS — unwire core.hooksPath/.githooks (fill-only, D2), CHỈ report (không tự xoá) dòng shell-rc source line cho người tự xoá tay (D4) — sau xác nhận (D3), giữ nguyên `.fgos/` data + config | `node --test test/setup/uninstall-wiring.test.mjs` |
| `tsk-4iv-2` | **SPIKE**: process tự gỡ package npm-installed của chính nó (Linux/macOS) có tin cậy được không — file biến mất sạch, lệnh hết resolve trên PATH, không lỗi file-lock giữa chừng? Phạm vi CHỈ npm + Linux/macOS; pnpm/yarn và Windows nằm ngoài spike này | `node --test test/setup/self-uninstall-spike.test.mjs` |

`tsk-4iv-2` carries `deps: [tsk-4iv-1]` (reuses the same `uninstall` verb
scaffold piece 1 builds) and is reshaped as a spike per
`fgos-coding-validating`'s 2026-08-01 NOT READY verdict on the original
`Package self-removal` risk-map row — that row had zero accepted evidence
anywhere in this repo (no precedent for a process removing its own
installed package), which is exactly the "one yes/no question decides
whether the plan is even real" shape a spike exists for. D1 itself is not
reopened: `tsk-4iv-2` still targets real package removal via a real
integration test (pack + install into a temp global prefix + attempt
self-removal), it just answers the feasibility question narrowly (one
package manager, two OSes) before any pnpm/yarn/Windows-matrix build work
is planned. If the spike's finding is "yes, reliable" — a follow-up item
extending it to pnpm/yarn (and, separately, whatever `tsk-3nx`'s CI matrix
enables for Windows) gets created then, not now (YAGNI — no point
shaping a 3-package-manager build plan before the one-package-manager
question is even answered). If the finding is "no, unreliable" — that
result itself is the deliverable, and `tsk-4iv`'s own scope (specifically
D1) goes back through `fgos-coding-exploring` with real evidence in hand.

## Gate

See hand-off message for the approval question.
