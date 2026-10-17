# Phase 06: integration, owner's stress gate, landing

- **Wave:** 5.
- **Run by:** the Lead, in `win-driver/integration` (`.claude/worktrees/wd-integration`).
- **Depends on:** P00–P05.

## Section A: integration (Lead, autonomous)

1. Merge order P00 → P05 is already done wave by wave. Merge main into integration, then rerun everything:
   - `cargo test --workspace`;
   - `cargo check -p fgos-process -p fgos-holder-lock -p fgos-distribution -p fgos -p fgctl --target x86_64-pc-windows-msvc --target aarch64-apple-darwin`;
   - full `npm test` with `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<binary built from integration with a phase-private CARGO_TARGET_DIR>`.
2. Ask `forgentx-95` to push `win-driver/integration` and dispatch `holder-lock-cross-platform.yml`, both the push run and `stress-artifact`. Record both run ids, both green, for Windows and macOS.
3. Independent review: one Opus `code-reviewer` over `git diff main...win-driver/integration` for `packages/holder-lock`, `packages/process` and `src/holder-lock`, focused on D2, D5, D6, D7 and D8. Check also that every red-team finding is visibly resolved in the code. Apply findings; rerun item 1.
4. Write the report: `fgos convention path --kind report --type phase-lead --slug windows-driver-integration --json </dev/null`. It contains run ids, pass counts, latency numbers (P02 extra wait, P03 acquire p50/p95) and review findings.

## Section B: owner's stress gate (needs the owner)

1. SendMessage `forgentx-95`: the artifact name and run id, the command, and the expected duration of about 15 minutes. The command:
   ```
   <exe> --ignored --test-threads=1
   ```
   with `HL_STRESS_REPEATS=500` and `HL_STRESS_OUT=<path>`. Keep the test exe next to the artifact's `fgos.exe`, or set `FGOS_STRESS_FGOS_BIN`.
2. The owner runs it on their machine (Windows 10.0.26200; same machine as probe runs 1–3) and returns the JSON.
3. Pass = every scenario has 500 repeats and 0 violations, **and** `dying-job-open` opened the job in ≥ 50 % of repeats. The per-source attribution and `namedByOneSourceOnly` are copied into the report.
4. Commit the JSON as `plans/reports/evidence-<stamp>-windows-driver-stress-report.json` (name via `fgos convention path`). Add a "Stress gate" section to the report.
5. **Red:** do not land. Fix through the phase that owns the failing code, using the per-violation source data. Rerun B.

## Section C: landing (only after B is green; stop-everything per owner decision)

1. **Stop and merge:**
   - stop every fgOS process on the three Linux workspaces, as in the 4.2 landing runbook ([report](../reports/) `…-holder-lock-stop-everything-landing.md`);
   - merge `win-driver/integration` into main with `--ff-only` from the main checkout, after main is merged into integration.
   - The big lead does the push.
2. **Build the release:** `cargo build --release --workspace` + `scripts/build-rust-distribution.mjs`.
3. **Install and activate on Linux:**
   - install the new `fgctl`, keeping the previous one;
   - `fgctl upgrade --from <tree>` on forgentX, mdview and mcp-skill-hub;
   - the gate is green on each (Linux behavior unchanged).
4. **Windows:**
   - the owner first installs the new `fgctl.exe` (`install.ps1` or the release asset). The installed `fgctl` from 4.4a refuses on Windows (4.4a D5);
   - the owner then runs `fgctl upgrade` on their Windows workspace with the Windows release assets (`release-assets.yml`, or a local build on that machine);
   - expected: the gate runs; no "unsupported" line;
   - then `fgos doctor` → `lock-kernel-semantics` shows `lockfileex`/`kernel`, and `lock-borrow-vectors` passes;
   - then `fgos run "<read-only prompt>"` → no `lock-driver-unavailable`. Record the outcome and any later named failure (6.2 D7 territory).
5. **Fences on Windows:** place attested (D14), only if the Windows workspace still has v1 lock paths.
6. **Close out:**
   - update the 6.2 plan's D7 row: "4.4b landed at `<sha>`";
   - report the landing in the integration report.

## Owned files

| Action | File |
|---|---|
| create | the integration report and the stress-gate evidence JSON under `plans/reports/` |
| edit | `plans/261016-1351-run-supervisor-rust-core-direct-mode/plan.md` (one line in the D7 row), this plan's `plan.md` status |

## Acceptance
- plan.md done criteria 1–6 hold, with evidence in the report.
- Main contains the integration head.
- The three Linux workspaces and the owner's Windows workspace are activated.

## Rollback
See plan.md "Rollback".
