# Windows holder-lock driver (plan 4.4b): landing on the owner's Linux workspaces

Date 2026-10-18, 00:15–00:25. The owner ran the 500-repeat gate on the Windows machine and sent the report; the lane lead runs landings on this machine under the owner's 2026-10-17 19:05 authorization.

- **Plan:** [plan.md](../261017-1256-windows-lockfileex-driver-and-macos-handoff/plan.md), phase 06 sections B and C.
- **Section A and gate:** [P06A report](phase-lead-261017-2049-win-driver-p06a-integration-and-ci.md), sections "Gate procedure for the owner" and "Stress gate"; the follow-up phase P05b ([report](phase-lead-261017-2140-win-driver-p05b-hotlock-judge-handle-list.md)).

## Gate (owner's Windows machine)
Artifact `windows-predecessor-stress` of run `39044432620` (tree `6cf430051`), 500 repeats per scenario, all three tests `ok`. Evidence: [evidence-261018-0015-windows-driver-stress-report.json](evidence-261018-0015-windows-driver-stress-report.json).

| Scenario | Violations | jobOpened | Extra wait p50 / p95 (ms) |
|---|---|---|---|
| all-owners-dead | 0 / 500 | 0 (fallback path every time) | 96.6 / 122.2 |
| borrow-hook-predecessor-check | 0 / 500 | 500 | 109.1 / 158.8 |
| dying-job-open | 0 / 500 | 500 | 101.0 / 142.9 |

Before the gate, CI caught one real violation in `all_owners_dead` on an earlier tree (`a24d58e48`, run `39042084746`: a member named by no source while still running). P05b fixed it (orphan candidates after the job is gone, bounded by `declaredAt`, a one-shot 200 ms window); nine consecutive stress dispatches and the owner's 500 repeats were then clean.

## Result
- **main:** `d9d527ad6`, a fast-forward from `win-driver/integration` after main (docs only: Git spec, Git G0 Q6 decision) was merged into it; the merge conflicted in the decision history of `docs/platform/holder-lock/spec.md`, both entries kept. Then `cargo test` of `fgos-holder-lock`, `fgos-process`, `fgos-distribution`, `fgctl` 161 pass, 0 fail; holder-lock, state, `holder-lock-checks`, `registrations`, architecture 1554 pass, 0 fail.
- **Release:** `sha256:0c43eb1da5e43308d9331a5c06a1a1832b8671b5a6ac42fb77481725fdf20632`.
- **fgctl:** reinstalled at `~/.local/bin/fgctl` (`ee04934c…`); previous kept at `.fgos/runtime/tmp/landing-4.4b/fgctl.prev`.
- **Activation:** `fgctl upgrade --from <tree>` in mdview, mcp-skill-hub, forgentX, all exit 0; the per-machine pin in `.fgos/distribution.json` was restored to main's value.
- **Fences:** mdview 219/219 and mcp-skill-hub 20/20 unchanged; forgentX 2451/2451 after placing 2 new dispatch-cwd paths through `fixLockFences(root, {excludePids})` (the same ten non-fgOS processes as the earlier landings, none with an fgOS file open).
- **Doctor:** `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders` (0 held), `lock-fences`, `lock-record-unreadable`, `state-root`, `active-release-matches-checkout`, `main-checkout-hook-wired` pass in all three where applicable. The other failing checks are the same set as before.

## Not done here
- **Windows activation:** no fgOS workspace is activated on the Windows machine as far as this lane knows. Activating one needs an `fgctl.exe` built from main on that machine (`cargo install --locked --path apps/fgctl --root <dir>`) and then `fgctl init|upgrade`; `fgos doctor` should then report `lockfileex`/`kernel`, and `fgos run` should no longer refuse with `lock-driver-unavailable`.
- **Second machine:** lands this release on its own.

## Open after landing
- The 200 ms orphan window is a timing assumption; it held at 500 repeats on the owner's machine.
- The round-5 `Held` seen once in CI was never reproduced; the stress test now prints a trace if it recurs.
- Review lows 5–9 of the P06A report stay open (no failing evidence).
- Extra wait on the owner's machine is about 100 ms p50 against about 15 ms on the CI runner.

## Rollback
Stop writers, revert the merge on main, copy `fgctl.prev` back, activate `sha256:b31b7526…` (`.fgos/runtime/tmp/landing-4.4b/rollback-digests.txt`) in the three workspaces. No new fences were placed by this landing beyond two dispatch-cwd paths, which the previous release also fences.

No component-boundary change.
