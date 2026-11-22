# Lead report: heads-rotate-on-their-own, waves 1-3

All four phases are landed on main. One acceptance criterion is still open: number 6, `npm test` and `cargo test --workspace` green on the combined tree. Phase 4 stays `running` until that proof exists.

## What landed

| Phase | Land commit | Review |
|---|---|---|
| 1 head launch sees the quarantine | `b8482a127` | no blocking findings |
| 2 crons and tasks no longer block | `db1319f9b` | one blocker fixed before land: cron and task strings could forge the handoff's pending-question heading; each value is now one escaped line |
| 3 weekly quota rotates the head | `1cd8386c5` | two review rounds; blockers fixed (see below) |
| 4 spec, changelog, integration report | `7717d9a05` | no blocking findings; two doc nits fixed |

## Phase 3 differs from its phase file

- **Sidecar path.** The confinement policy (`packages/execution/contracts/confinement-policy/policy.v1.json`) never grants a writable path under `.fgos`, so `<lineage>/sidecar/` could not work. The sidecar is written beside the session transcript at `<dir of transcript_path>/<session_id>.context-sidecar.jsonl`. Step 2 of the phase file prefers a folder the confinement already grants; this is one.
- **Payload proof.** `reports/status-line-payload.md` was reconstructed from the installed Claude Code bundle, not recorded from a running head. The report says so in its first lines. A real recording is still owed.
- **How it ran.** The first unit hit the 35-minute executor ceiling. The runner never commits files that were already dirty when a unit starts (`src/runner/dispatch/assignment-runner.mjs:8`), so the leftover work was carried into a fresh worktree (`p03b`) through a patch and landed from there. The old `p03` worktree is handed to the supervisor.

## Gate on the combined tree (unit sandbox, recorded in `integration.md`)

- `node scripts/plan-contract-check.mjs --plan plans/261122-2307-heads-rotate-on-their-own`: exit 0, with two footprint-overlap warnings (heads-stable-and-able, owner-communication-standard).
- `cargo test --workspace`: 563 passed, 7 failed. All 7 are in `apps/fgos/src/wiring/doctor/confinement.rs` and judge process liveness and ownership of confinement folders through `SystemHost`. They fail the same way in the lead's sandbox. The module imports nothing this plan changed, so the sandbox is the likely cause. That is unproven until the run happens outside a sandbox.
- `npm test`: did not start. `scripts/lib/full-suite-queue.mjs` needs `~/.local/state/fgos/locks/full-suite.lock`, which is read-only in both the lead's sandbox and a unit's.

## Follow-ups outside this plan's footprint

- `packages/run-supervisor/contracts/head-request.v1.json`: the `session rotate` stop-facts prose omits `sessionCrons`, `backgroundTasks` and `quota`. The enforced check is `checkStopFacts` in `src/session-rotation/rotate.mjs`.
- A real status-line payload recording from a running head.

## Open

- Someone outside a sandbox must run `npm test` and `cargo test --workspace` on main at or after `7717d9a05`. If both are green apart from failures that also occur at the plan's base `27fd8a9b0`, phase 4 and the plan can be set `done`.
