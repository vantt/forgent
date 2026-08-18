# tsk-1qm — close `docs/specs/distribution.md`'s doctor-fix drift

**Stage:** clarify (fgos-coding-exploring). **Date:** 2026-08-02.

## Feature boundary

`docs/specs/distribution.md` no longer describes real behavior for two
rules, both because `tsk-2qz` (doctor `--fix`) and `tsk-2cs` (extensible
check/config-default/fix registry) shipped and are `done`:

- **RUL9** (`distribution.md:200`): "doctor's checks never write anything,
  under any circumstance" — no longer true; `--fix` writes for real.
- **RUL11** (`distribution.md:210`): "`doctor --fix` does not exist yet...
  stays a Deferred Idea" — no longer true; it exists and runs.
- **Data Dictionary #7**: lists exactly 6 named doctor checks — the real
  registry has 8 (`node-version-and-git`, `shell-integration-sourced`,
  `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`,
  `config-awareness`, `dependencies-installed`, `gate-bypass-configured`),
  and the count is no longer fixed at all — any module can add one via
  `registerCheck`.

## Locked decisions (all scout-resolved, no person-gray-area)

| ID | Decision |
|----|----------|
| D1 | Both RUL9 and RUL11 get superseded, not just RUL11 as the item's own title names — grounded directly in `tsk-2qz`'s own locked D2 (`docs/history/doctor-fix-gate-bypass/CONTEXT.md`): *"Quyết định này ĐẢO RUL9 + RUL11 (docs/specs/distribution.md:200,210) ... tsk-1qm chịu trách nhiệm supersede chính thức trong spec."* `tsk-2qz` explicitly delegated this to `tsk-1qm` by id — not a scope guess. |
| D2 | Data Dictionary #7's row is rewritten to describe the registry mechanism (points at `src/setup/registrations.mjs`'s `registerCheck`), not a hardcoded enumeration of today's 8 checks. Hardcoding a list would immediately misrepresent the exact fact `tsk-2cs` shipped — the whole point of that item's own D1 was making this **not** a fixed list. A frozen 8-item enumeration is exactly the drift this closure item exists to fix; writing a new one would recreate the same problem on the next `registerCheck` call. |
| D3 | RUL9's rewrite keeps the "no side-effect creation on plain diagnostic" guarantee for the no-`--fix` default path, and adds the `--fix` exception explicitly — not a full reversal, since `fgos doctor` (no flag) genuinely still writes nothing (confirmed live: `bin/fgos.mjs`'s `doctor` case only calls `runFixes` when `flags.fix` is truthy). |
| D4 | RUL11's rewrite states plainly that `--fix` exists, runs a registered-fix list (today: `gate-bypass-configured`, confirmed live via `fgos doctor --fix`), and that the list itself grows through the same registry `registerFix` exposes — same "point at the mechanism, not a frozen snapshot" shape as D2. |

## Scout evidence

- `bin/fgos.mjs` `case 'doctor'`: `const fixed = flags.fix ? runFixes(process.cwd()) : undefined;` — confirms RUL9's "never writes, under any circumstance" is false only when `--fix` is passed; the no-flag path is still accurate.
- `fgos doctor --fix` run live in this worktree: `{"fixed":[{"id":"gate-bypass-configured","changed":true,"message":"wrote gateBypass.level = \"off\" to .../.fgos/config.json"}]}` — real, not simulated.
- `fgos doctor` run live: 8 real check ids returned (listed above), vs. 6 documented today.
- `src/setup/registrations.mjs:63,84,109` — `registerCheck`/`registerConfigDefault`/`registerFix` are real, independent (D2 of `tsk-2cs`: a module may register any subset) registration functions; `checks.mjs` is now a thin re-export shim, never itself listing checks.
- `docs/history/doctor-fix-gate-bypass/CONTEXT.md` D2 — the explicit reversal-and-delegation citation for D1 above.
- `docs/history/setup-doctor-config-registry/CONTEXT.md` D1-D2 — registry mechanism and independent-registration shape, backing D2 above.
- `scripts/check-decision-citation-drift.mjs` baseline run: 3 pre-existing findings, none in `docs/specs/distribution.md` (they're in `docs/backlog.md` and `docs/specs/decision-citation-drift.md`, an unrelated pre-existing drift). RUL11's own citation is a local `(per D8)` — `distribution.md`'s own internal D-numbering, not the global 4-digit/ADR scheme this checker scans — so this checker doesn't gate anything in the rewrite either way. Confirmed by reading the checker's own `DECISION_ID_PATTERN`.
- Impact-analysis posture: **full** (`gitnexus` present).

## Canonical references

- `docs/specs/distribution.md` (RUL9:200, RUL11:210, Data Dictionary #7)
- `docs/history/doctor-fix-gate-bypass/CONTEXT.md` (`tsk-2qz`)
- `docs/history/setup-doctor-config-registry/CONTEXT.md` (`tsk-2cs`)
- `bin/fgos.mjs` `case 'doctor'`
- `src/setup/registrations.mjs` (`registerCheck`, `registerFix`, `DOCTOR_CHECKS`, `FIX_REGISTRATIONS`)
