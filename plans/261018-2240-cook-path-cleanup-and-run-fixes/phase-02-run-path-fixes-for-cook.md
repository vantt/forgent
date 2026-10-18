# P3: run path fixes for cook

Source: roadmap P3 + owner 2026-10-18. Prior art first (`git log -S` on each symbol); reuse before adding. RUL104: no new layer.

## Requirements

1. **`verify` survives on the Unit.** `validateUnit` drops the field today; keep it through validation, binding and the round.
2. **Verify runner with a configurable timeout** replaces the bare `execSync` in `src/runner/execution/run.mjs` (search `execSync(verifyCmd`). Reuse an existing bounded command runner if one exists (search `spawnSync`/`timeout` helpers under `src/`); otherwise one small function in the lowest layer that needs it. Timeout from config with a default; register the key in setup config-merge and the doctor/config registry per AGENTS.md install gate. A timeout is a failed verify with a clear reason, never a hang.
3. **No pinned `npm test`** in the `code-change` preset: verify comes from the Unit/one-liner input; absent verify is stated in the result, not invented.
4. **One-liner flags** `fgos run "<prompt>" --input <path> --verify "<cmd>"`, wired into the same Unit fields as `--unit` files. Update help text and the CLI contract surface the repo uses.
5. **`docs:write` declared in config** (roadmap item) where capabilities are declared.
6. **Skills at flow level:** `skills`/`requiresSkills` on a Unit (today only from Work operations, recorded only) reach `bind()` and filter executors that cannot provide them; refusal reason code when none can.
7. **Rigor high/critical ⇒ every seat on a distinct model family.** Today `reviewed.mjs` makes checker ≠ producer mandatory and spread between checkers only preferred (`preferIndependentOf`, `familySpread`). At rigor `high`/`critical` make spread between all seats mandatory; standard/low unchanged. Refuse with a clear reason code when the pool cannot satisfy it.

## Validation

Tests for each item (unit + one CLI path). Run every test importing touched modules (bind, reviewed, run, unit validation, presets, CLI parser, setup/doctor registry, import guards), then full `npm test` with `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`, `FGOS_SESSION_ID` unset. Spec facts in `docs/specs/runner.md` (or owning area spec); `CHANGELOG.md` lines.

## Risk

`run.mjs` was touched by 6.4 (controller death); rebase on current main before starting. Shared files with P1: `docs/specs/runner.md`, `CHANGELOG.md` — same branch, sequential, no conflict.
