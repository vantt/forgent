# Run supervisor, direct mode (plan 6.2): stop-everything landing

Date 2026-10-18, 08:05–08:35, on the owner's machine, under the owner's 10-18 delegation ("em tự điều phối để các lane làm việc cho tới khi xong nhé. cần land thì em tự land").

- **Plan:** [plan.md](../261016-1351-run-supervisor-rust-core-direct-mode/plan.md), block "CẮT LẠI 2026-10-18"; two phases added on the way, P03w (gate on Windows/macOS) and P04w (supervisor on Windows/macOS), because D7 no longer held once the Windows lock driver landed.
- **Section A:** [P12A report](phase-lead-261018-0717-run-supervisor-p12a-integration-and-full-suite.md); cutover: [P09 report](phase-lead-261018-0543-run-supervisor-p09-cutover-direct-mode.md).
- **Decision:** D-ADR0056 recorded (`fgos decision`, supersedes the detached-run-supervisor part of D-ADR0043 `540326f7`), `docs/decisions/index.md` regenerated.

## Proof before landing
- **CI `process-containment`** (Linux, Windows, macOS; `fgos-process`, `fgos-run-supervisor`, `fgos-agent-protocol`): run `39085293061` on `13199adb4`, green. The run before (`39085090150`) was red on Ubuntu in `steps_runner::a_step_past_its_timeout_is_killed_with_its_descendants_and_leaves_no_receipt`: the step runner sends SIGKILL to the whole group before it returns and the test judged the grandchild at once, while the kernel was still tearing it down (8 of 15 local runs). Fixed in the test only (`13199adb4`, bounded wait for death; 20/20 after).
- **Full `npm test`** on the integration tip, host built from it, `target` linked to a private release build for the fgctl tests: 8255 tests, 8140 pass, 10 fail on a machine still loaded by the last lead; the six failing files rerun serially: 205 of 206 pass, 0 fail. The two left fail without this plan: `hot-lock-host-judge` (also red in the main checkout) and `skill-wrappers` (untracked wrapper only in the main checkout).
- **Crash matrix** through real bwrap and real `fgos run` (P09, rerun in P12A): controller SIGKILL, supervisor SIGKILL, deadline after controller death, both dead, two adopters, the four controller-death edges. T8 cli cA–cD pass. `gate_pid1` zombie test 20/20 under load 12–17.

## Result
- **Old-release pass (plan D8):** with release `6208cb3e…` still active, `fgos doctor --fix` in the three workspaces; afterwards `/tmp/fgos-confinement` held no v1 home without `paneId` (5 before, 0 after).
- **main:** `13199adb4`, a fast-forward from `run-supervisor/integration` (main was already merged into it).
- **Release:** `sha256:e95c130df092232d3d8327fa80fc985c5a646fefdb1837dbed3dd94eb4ac0392`.
- **fgctl:** reinstalled (`4e5aef57…`, it links `fgos-process`); previous kept at `.fgos/runtime/tmp/landing-6.2/fgctl.prev`.
- **Activation:** `fgctl upgrade --from <tree>` in mdview, mcp-skill-hub, forgentX, all exit 0; `.fgos/distribution.json` restored. `fgos setup` in each, exit 0 (runtime socket dir `/run/user/1000/fgos` 0700; forgentX's project config gained the `lock` and `terminal` keys, committed).
- **Fences:** mdview 219/219, mcp-skill-hub 20/20, forgentX 2483/2483 after placing 10 new unit-run lock paths (script `.fgos/runtime/tmp/phase-leads/place-fences.mjs`: excludes this session's process chain and idle non-fgOS processes with no file open under `.fgos/`).

## Doctor through the shim (all three workspaces)
`process-containment` pass (`bwrap-pidns`, level kernel), `runtime-socket-dir` pass, `run-attempts-stuck` pass (forgentX 2101 open attempts of old runs, none stuck), `run-supervisor-route` pass, `gate-kill-grace` pass (10000 ms default), `lock-holders` pass, `terminal-control` pass, `active-release-matches-checkout` pass in forgentX. The failing set is the same as before the landing.

## Smoke
- `fgos run --provider claude` (cli, direct mode) in a clone of mdview under `.fgos/runtime/tmp/smoke-6.2`: outcome `pass`; the run dir holds `envelope.json`, `supervisor-binding.json`, `gate-exit.json` (`stoppedBy: agent`, exit 0), `receipt.json`, `steps/settle-attempt.json`, `steps/finalize-home.json`, `closed.json`; the supervisor log ends `closed / exited`.
- **Defect found:** the same run from a clone under `/tmp` ends `gate-lost`: the gate, inside the bwrap sandbox, cannot read `envelope.json` from a run dir under `/tmp` ("envelope unreadable: No such file or directory"). Every workspace under `/tmp` is affected (scratch clones; the owner's projects live under `/home`). Follow-up opened on the program board.

## Open after landing
- Workspaces under `/tmp`: direct mode fails at the gate (above).
- `npm run fgos:dev`: the dev host copy and manifest are deleted when the controller dies, so a supervisor started from a dev host fails its settle with ENOENT (P12A); the installed release is unaffected.
- `hot-lock-host-judge` red on main (follow-up of the Windows driver landing); `skill-wrappers` worktree-only failure.
- Windows: no workspace is activated there; the controller handover on Windows is proven only by the CI supervise/adopt tests.

## Rollback
Before deactivating, with this release: `fgos internal adopt --protocol 1 --scan` over `.fgos/assignments/*/*/*/runs/*` until `run-attempts-stuck` is clean. Then stop writers, revert the merge on main, copy `fgctl.prev` back, activate `sha256:6208cb3e…` (`.fgos/runtime/tmp/landing-6.2/rollback-digests.txt`). v2 homes are kept by the old release; remove by hand from the doctor list taken before rollback.

## Next
- 6.3 (terminal mode and the launcher half of identity) is unblocked: 6.2 and 6.5 have landed. 6.4 waits for 6.3.
- MP-B2 can start once 6.3 P05–P06 land.
- The second machine lands 6.5 and 6.2.

Component boundary: changed in P11 (Run Supervisor L4, Launch gate L4, Agent protocol L3, Containment port L0 in [component-boundary.md](../../docs/platform/component-boundary.md)); no further change here.
