# P02H Reopen — Herdr Worker-Command Seam, Closed For Real — Cell Trace

**Track:** runtime-recovery
**Coordination session:** `runtime-recovery--p02h2`
**Merge commit:** `main` tip (merges `runtime-recovery--p02h2`, tip `63986e62`) directly into `main`
**Context:** the original [P02H cell](p02h.md) correctly fail-closed required/preferred bwrap confinement on herdr-spawn after its own seam attempt was falsified live. This cell was reopened, mid-track-closeout, after the Lead live-verified a genuinely working mechanism against the real herdr gateway and proposed it to the user for a real fix rather than leaving the capability permanently refused.

## The mechanism (Lead live-verified before dispatch, then independently re-verified by the doer/reviewer through 8 rounds)

`herdr pane run` types text into the pane's shell for the shell to re-parse (confirmed via `herdr api schema --json`: no `pane.run` wire request type exists, it is sugar over `pane.send_text`) — a long, complex `bwrap [flags] -- <cli> [args]` command typed directly is at risk of shell re-tokenization corruption. The fix: write the Confinement Authority's prepared invocation to a launcher script under the Run's own protected directory (never worker-writable), then `pane run <paneId> bash <scriptPath>` — a short, unambiguous typed command with nothing for the shell to mis-tokenize. Once launched, the process is a normal foreground child of the pane's own pty (verified live: output streams incrementally, stdin round-trips correctly — nothing is "swallowed" by the intermediate script). The launched process is then registered into Herdr's own `agent list`/`agent get` tracking via `pane report-agent`/`report-agent-session` (existing client methods from the original P02H cell, previously unused), so it stays promptable (`agent prompt`) and observable exactly like a normal Herdr-launched agent — Herdr's own readiness gate independently cross-checks the pane's real foreground-process identity against the claimed agent kind, it does not blindly trust the registration.

## What landed

- `herdr-round.mjs`'s `runHerdrRound` now routes required/preferred bwrap confinement into this real launch path instead of unconditionally refusing; the legacy unconfined `agent start --kind` path is untouched.
- Post-launch verification is layered, independent signals, not a single check: exe identity (`/proc/<pid>/exe`), argv, environment (`/proc/<pid>/environ` diffed against the prepared env plus a curated injection-vector list), working directory (`/proc/<pid>/cwd`), and a byte-equality re-read of the launcher script itself. Any detected mismatch kills the process, closes the pane, and fails closed — never settles with a receipt claiming confinement it cannot back.
- The adapter receipt binds an independently-recomputed digest of the actual prepared command/args/env, not a self-declared field read from the prepared-invocation record.
- A crash between launch and the binding-record write can no longer duplicate-launch a second real process; resume reconciles by the already-recorded deterministic name/digest instead.
- Completion is still gated on the worker's own outbox result file — Herdr status (`idle`/`working`/`done`) is never Run truth by itself, unchanged from the original P02H contract.

## Fix rounds (8 rounds — the longest of any cell in this track)

1–2. Wired the mechanism into the real production dispatch door (`executeThroughConfinement` → `herdrSpawnAdapter`, previously never threaded the confinement requirement — a repeat of this track's own recurring wiring-gap bug class); fixed a real outbox-writable-grant gap that prevented a genuinely confined worker from ever settling; fixed a crash-window duplicate-launch (F1); fixed launch trusting a self-declared digest instead of an independently recomputed one (F2); widened tamper detection scope with real process/pane cleanup (F3).
3. Found and fixed a real environment-injection gap (H-1): `LD_PRELOAD`/`HOME` injection into the launcher's environment, with argv and the executable untouched, was undetected and settled with a genuine-looking receipt.
4. Found and fixed a real regression (H-2): the prior round's kill+close cleanup had also started firing on the legacy unconfined path's own `agent start` failures, breaking that path's intentional "keep the pane open for human inspection on failure" contract — an existing, correctly-passing test caught this. Lead ruling: scope the cleanup to the new confined path only, the legacy test's expectation was correct and untouched.
5. Found and fixed a CRITICAL regression: the H-1 fix's environment baseline was read from `/proc/<shellPid>/environ`, a static exec-time snapshot — but the pane's live shell legitimately changes its own environment afterward (rc-file sourcing changes `PATH`; `cd`-ing into the launch cwd changes `PWD`/`OLDPWD`), so every honest, untampered confined launch was being killed as a false-positive tamper, disabling the required-confinement path entirely on a real gateway. Replaced the baseline source with a post-launch byte-equal re-read of the launcher script itself, layered on top of the still-valid exe/argv checks.
6. Found and fixed a real, narrower gap (RES-CWD): a `cd` line injected into the launcher script during a precise timing window could relocate the launched process's working directory undetected. Fixed by adding an independent `/proc/<pid>/cwd` post-exec check, matching the existing exe-identity check's own fail-closed discipline (unreadable is never treated as a pass).
7–8. Two small, purely mechanical test-fixture fixes: a fixture using a fabricated, nonexistent pid tripped the new (correct) cwd check; then a fixture spawning a real process but declaring a mismatched expected command tripped the exe-identity check. Neither was a production code defect — both were fixed on the test side, the checks themselves were never relaxed.

Final recheck (reviewer): **PASS** — focused lease 58/58 (0 fail, 1 skipped), broader dispatch/confinement/herdr sweep 780/780 (0 fail, 2 env-gated skips).

## Verified independently by the Lead

- `node --check` on all 9 files touched across the whole reopen.
- `herdr-reconciliation.test.mjs` + `herdr-spawn-adapter.test.mjs`: 58/58 pass, run live in the worktree before merge and again on `main` after merge (22/22 on `herdr-reconciliation.test.mjs` alone, confirmed post-merge).
- Before ever dispatching this reopen, the Lead independently live-tested the core mechanism (script-file launch preserving live output/stdin visibility; `pane process-info` returning real pid/argv; `report-agent` correctly registering into Herdr's tracking; `agent prompt` succeeding once the launched process's own argv[0] genuinely matched the claimed kind) against the real herdr gateway, before proposing the fix to the user.

## Deferred / accepted as non-blocking

- **F-1-residual (MEDIUM)**: an env var NOT on the curated injection-vector list, injected during a narrow (~10-90ms) timing race against the launcher-script byte-equality readback, can still settle with a genuine-looking receipt. Requires an attacker to already have same-uid write access to the protected launcher directory during that specific window — a significant precondition. A structural fix exists (exec the launcher via `env -i` with the complete prepared environment set, so the launched process's real environment must equal the prepared set exactly rather than checking named vectors) but was judged too large a restructuring for this already-8-round cycle; documented here as the concrete follow-up shape.
- **R-1 (INFO, unreproduced)**: a hypothetical setuid-root bwrap host where `/proc/<pid>/cwd` might be unreadable even for an honest launch was noted by the reviewer as a plausible-but-unconfirmed concern — not reproduced on this host (`bwrap` here is `0755`, not setuid), not acted on.
- Every residual from the original P02H cell (`p02h.md`) that this reopen did not touch remains as documented there.

## Process note

This was the longest fix cycle in the entire runtime-recovery track (8 rounds). Notably, round 5 found and fixed a CRITICAL regression the fixer's own PRIOR round had introduced (a false-positive that would have disabled the required-confinement path entirely in production) — a clear demonstration of why every round's live reverification against the real gateway mattered, not just a code read. The doer/fixer role also hit two distinct resource exhaustion events mid-cycle: `agy-cli` hit its own account-level quota (separate from the Claude CLI session-limit exhaustion seen earlier in this track), requiring a switch to headless `claude` for the remainder of the reopen. Full incident detail in `plans/260911-2305-runtime-recovery/reports/dispatch-process-incidents.md`.
