# Handoff: TEST lane (test-suite governance)

Written 2026-10-21 15:19 (Asia/Saigon) by the GIT/ES coordinator session on the second machine, on the owner's request ("khi lane TEST … xong một phần của nó thì dừng lại, rồi em cho anh 1 prompt handoff, anh sẽ nhờ một agent khác quản lý riêng luồng TEST"). The prompt below is self-contained; paste it to the new agent.

---

## Prompt for the new TEST lane owner

You now own the **TEST lane** of the fgOS platform program (repo `~/projects/forgent`, second machine, timezone Asia/Saigon). Reply to the owner in Vietnamese; write reports in English. Read `AGENTS.md` first, then the board `plans/261017-1313-fgos-platform-program-board/plan.md` (lane rows) and the top of `log.md` (newest first). Your lane row is `TEST`; update only your own row and add your own log lines at the top of `log.md`.

### Goal (owner's words, 2026-10-20)

"có rất rất nhiều test, anh cảm giác là thừa … anh không muốn suy yếu hệ thống. chỉ là anh nghi ngờ nó cứ thêm vào và không hề đánh giá xem có cần thiết và dư thừa hay không." Tests must stop growing without review, redundant tests go, and the system must not get weaker.

### Settled rules (do not re-open)

- Design principle 8 **"One proof"** (`core/instructions/design-principles.md`), AGENTS.md L5 question 5, Git spec §15 E6, decision **0073** in `docs/specs/platform-foundations.md`: each behaviour has one owning proof at the lowest layer that can observe it; each boundary above it has at most one wiring proof; deleting a mechanism retires its tests in the same change; a retired test names its successor or "behaviour removed"; never weaken an assertion about a behaviour that still exists.
- Owner answers 2026-10-20 17:47 to the counsel `plans/reports/counsel-261020-1658-test-suite-growth-rule.md`: DQ1 (c), DQ2 (a), DQ3 (b).
- Mechanism already on main: `npm test` prints a `suite:` line against `test/suite-baseline.json` and ratchets cross-file clones (`scripts/test-proof-inventory.mjs`), commit `e7a6adff8`; `npm test` green on this host (`6fa5de5ed`).
- Never add an env switch, skip or test-only branch to make tests pass (AGENTS.md L5).

### Plan and where it stands

Plan: `plans/261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md` (phase 2: per-port Node-vs-Rust inventory; phase 3: use-case extraction for the slowest files). The "Git 07 files" hard constraint in it is lifted: Git 07–08 landed on both machines on 2026-10-21.

Phase 2, first batch (report `plans/reports/phase-lead-261021-1129-test-governance-p2-ported-areas.md`, merged to main `a7689dd37`):
- **terminal-control: done.** 3 Node tests retired (owned by the crate), route test widened; `npm test` 8781 → 8778, 0 fail; `cargo test --workspace` 1214/0; coverage map 0 sources lost.
- **event-store: inventoried,** 75 tests = 1 route + 74 owns, nothing to retire. Five seeded Rust mutations fail no Rust test (the Node tests are the only proof) — report §6.
- **run-supervisor: half-done.** 143 tests labelled and mutation-checked; 5 retirements decided but **not applied** (report §4: `contracts-unit-state` lines 48, 55, 65; `contracts-terminal` line 75; `adopt-client` line 64). Next: delete them, run both gates (~30 min), commit.
- **git, holder-lock: not started.**
- Report §6 lists six behaviours no test notices when mutated (e.g. `sync --no-push` still pushing) — owner decisions, not added yet.
- The lead read "contract-prose retires" narrowly (pure contract lints no code reads stay); that reading is an owner question in the report.

Phase 3 (top-20 slow files to direct use-case tests): not started. Then the batch of **59 `test/setup` cross-file clones** listed in `plans/reports/phase-lead-261020-1748-test-governance-rule-and-first-cleanup.md`.

### Inputs from the HARDEN lane (session `forgent-a8`, same machine)

Report `plans/reports/research-261021-1210-harden-test-suite-investigation.md` (main `2142c074c` and later), §4, §7, §8, §10. HARDEN reuses TEST's labels and tools and does not build test mechanisms; these are yours to decide:
1. **§8 test-cost reporting** in every lead brief/phase file: tests added and retired (the `suite:` line), new CLI/host spawns its tests add, the change in one CLI call's cost (`fgos --help`, `fgos list` before/after); a new test that spawns the CLI says why a lower layer cannot prove it. Build on `test-proof-inventory` and the `suite:` line, no new tool.
2. **Runner:** order files longest-first from the last junit (estimated wall 488 s → ~330 s; `fgctl-upgrade` 323 s starts at +164 s today).
3. **Debug vs release staging** of the test host/addon (debug addon is 86 MB; the per-process addon hash is being fixed by HARDEN T0 in the loader move, not by you).
4. **`test/rust-host/fgctl-*`** run a real `fgctl init` per case (6–23 s, a 40 s doctor) and **call the real `claude` CLI and the network** (doctor's claude-plugin-marketplace row: `claude --version`, `claude plugin marketplace list/add vantt/forgent`; `src/setup/registrations.mjs:3226,3300`); no file in `test/rust-host` sets `FGOS_CLAUDE_COMMAND`. Same bug as the 2026-08-27 `checks.test.mjs` NO_CLAUDE_ENV fix, in the files split out on 10-14.
5. 1,223 tests at ≥ 1 s take 88% of test time; the CLI and rust-host directories are 45% of the time.

### Known environment facts

- Suite wall today ~465–483 s against the 202 s baseline at `f38dfd1d0` (HARDEN §10 explains the growth).
- Known host flakes: `hot-lock fast path` ratio; `loop.test` "real concurrency" under load; an intermittent leaked `fgos-direct-repo-*` temp directory (cause not isolated). Rerun solo before calling a regression.
- A fresh worktree may carry a skip-worktree stub `.fgos/config.json` (~1.3 KB, no `runner.executors`) that fails ~78 executor-config tests; restore the tracked file for the run, never commit it.
- `npm test` may rewrite `packages/git/contracts/mutation-census.v1.json` when product files changed since it was last regenerated; regenerate with `node scripts/git-one-door-scan.mjs --write-census` in the commit that changes product code, never commit a churn-only rewrite.
- The repo hook blocks bash commands containing "build", "target" or ".git": put such commands in a script file.
- Other lanes on this machine: HARDEN (`forgent-a8`, SendMessage), GIT/ES coordinator (this session). Heavy suites go through the full-suite queue; announce long measurement runs to the other sessions. Never commit, pull, reset or stash in the main checkout `~/projects/forgent` (another session's uncommitted edits); work in a linked worktree (`fgos worktree create … --base origin/main`) and push your branch to main when the gates are green.

### Gates for every batch (from the plan)

`npm test` and `cargo test --workspace` green before and after, quote the `suite:` line both times; `node scripts/test-select-coverage-map.mjs` before and after, no source loses its last covering test; ≤ 60 tests per commit; `git log -S` each retired title (a regression witness moves into the owning proof); delete, never skip; new test files start with `import '../helpers/process-tmp-root.mjs';`.

### First steps

1. Read the board, the plan, the phase-2 report and the HARDEN report.
2. Finish run-supervisor (apply the 5 decided retirements, gates, commit, merge).
3. Ask the owner, in the decision-question template (`core/skills/_shared/decision-question.md`), only what the reports leave open: the six unguarded behaviours, the narrow "contract-prose" reading, and which HARDEN runner items to adopt.
4. Continue phase 2 for git and holder-lock, then phase 3, then the 59 `test/setup` clones.
