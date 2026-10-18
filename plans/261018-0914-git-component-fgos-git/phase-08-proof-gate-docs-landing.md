# Phase 08: implementation-time proofs, docs, landing

- **Depends on:** phase 07 release candidate; the Event Store plan's V-EVENT run green. E1, P-SPACE and the E3 publication workloads may start after phase 01; E4 after phase 02.
- **Branch / worktree:** `git/p08-gate` on top of `git/p07-switch`, `.claude/worktrees/git-p08`.
- **Model / effort:** opus; 18h agent time plus owner time for E1/P-SPACE (Q3) and the landing hour.

## Context

- Spec §15 (every vector and experiment), §17 (acceptance and prohibited claims), §19 implementation-time conditions, §12 P-RELEASE and stop-everything, §18 item 1.
- Proof units drafted in the [fold report](../reports/review-261018-0024-git-g0-proof-fold-verdicts.md) ("Việc kiểm lại": `e1-durability-device`, `e3-combined-addon`, `space-resource-after-effect`, `gate-cutover-release-consumer`, `e4-containment`); reuse them, updated for the real implementation.
- Owner inputs: `e3-budgets.md` (phase 01 step 0) and a root session for E1/P-SPACE (Q3).

## Requirements

1. **E1** on a real ext4 device with `dm-flakey` or `dm-log-writes` (owner root, Q3): objects, refs, `packed-refs` and the WAL survive a power cut at every barrier with `fgos-git`'s own directory fsyncs; the syscall trace shows the §10 order. A passing filesystem profile lets `git-durability-capability` and receipts advertise `stableMedia` for that profile only; elsewhere `processCrash` stays.
2. **E3** full: the §15 workload split (new object, existing object, no-op ref, changing ref, local transport with and without objects, full typed operation) on ext4, Node → addon calls and Git subprocess counts reported separately, p50/p95/p99, backlog metrics (pending operations, records per operation, logical and allocated bytes, inodes, oldest debt, scan completeness, full reconciliation latency), compared with the DC baseline and the current Node writers, judged only against `e3-budgets.md`. A failed budget or a failed rollback with live processes reopens Q1 (stop, owner decision).
3. **P-SPACE and P-RESOURCE** on a small private filesystem: ENOSPC, EIO, permission, EMFILE/ENFILE, ENOMEM, spawn EAGAIN, output and queue saturation, deadline cancellation at prepare, object, pin, CAS, receipt and parent-dir sync, before and after the effect. Ceilings and workload are written into the run brief before measuring.
4. **E4:** hooks, filters and aliases starting same-group, `setsid()` and double-fork children, under a deadline and after git exits; drain proven through `linux-gate`/pidns on Linux and `job-object` on Windows; `containment-unproven` reported as `recovery-required` where no driver answers `Empty` (macOS `macos-tree`).
5. **V-CONSUMER** dynamic: `business-discussion` in a detached HEAD without `origin/HEAD`, and in a directory that is not a repository (Q1 outcome); labelled noncoding writing-land fixture.
6. **P-RELEASE:** a live old process during activate and rollback; a pending WAL record refuses activation of a release without `git-wal-v1`; an older `fgctl` stops at the fence; stop-everything cutover for the lock-free writers; external project install through `scripts/ci-external-consumer.sh`; a stale global npm `fgos merge` refused by the protocol bump; no legacy-writer fallback; every workspace on every machine of the owner's list (Event Store Q2, M2) reports the activation fence.
7. **P-CUTOVER end to end:** evidence from the Event Store cutover commit (grant used once, nothing else allowed) plus the phase 05 refusal tests.
8. **Vector matrix:** every §15 vector mapped to its test file and last green run id. V-EVENT comes from the Event Store plan's run through the port; that green run is a **blocking edge** of this phase, recorded on the board.
9. **Docs:** Git spec header "Implementation status" and §19 results rows for the implementation runs (as results, not a redesign); component boundary row verified; `docs/specs/reading-map.md` lists `packages/git/**`, `src/git/**`; runner spec history notes Workflow owns no git; holder-lock §16 marked implemented; packaging contracts final.
10. **Landing (stop-everything, holder-lock §12):** owner picks the hour; quiesce scan on every workspace and machine of the owner's list (Event Store Q2, M2; at least forgentX, mdview, mcp-skill-hub); merge `git/p07-switch` + `git/p08-gate` to main; build, stage, activate one workspace at a time; doctor green (the eight Git checks of spec §12 plus the existing holder-lock checks); landing report from `fgos convention path --kind report --type landing`; board row updated.

## Files

| Action | File |
|---|---|
| create | `test/git/e2e-consumer-noncoding.test.mjs`, `test/git/release-activation.test.mjs`, `scripts/git-proofs/` (E1, P-SPACE, P-RESOURCE, E4 drivers, run by hand or CI as named) |
| create | reports under `plans/reports/` named by `fgos convention path` (E1, E3, P-SPACE/P-RESOURCE, E4, vector matrix, landing) |
| edit | `docs/platform/git/spec.md` (status, §19 result rows), `docs/specs/reading-map.md`, `docs/specs/runner.md`, `docs/platform/holder-lock/spec.md` §16, `docs/platform/packaging-distribution/contracts/*.md`, program board row |

## Steps

1. Early (after phase 01): E1 and P-SPACE scripts written; owner runs E1 (Q3); E3 publication workloads.
2. After phase 02: E4 driver runs on Linux, CI on macOS and Windows.
3. On the phase 07 candidate: E3 full, P-RESOURCE, V-CONSUMER, P-RELEASE, P-CUTOVER evidence, full vector matrix.
4. Any red result: fix in the owning phase's module on the integration branch, rerun; a protocol-level failure stops and goes to the owner in the decision template.
5. Docs; final review unit (opus) of the whole diff against spec §17's prohibited claims.
6. Landing.

## Validation

```bash
cargo test --workspace && cargo clippy --workspace --all-targets -- -D warnings && cargo fmt --all -- --check
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<release build> npm test
node --test test/git/*.test.mjs
fgos doctor --json   # after activation, on every workspace: the eight Git checks of spec §12 pass
```

Done means every item of the plan's Acceptance list holds and each report is committed.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| No root device for E1 | Medium × High | Q3; without it implementation is not done (spec §17), receipts stay `processCrash`. |
| E3 reverses Q1 late | Low × High | Publication workloads measured after phase 01, before the Event Store builds on the addon. |
| Landing on one workspace fails mid-way | Low × High | Stop-everything order, one workspace at a time; previous release reactivated through the C5 door after reconciliation. |

## Rollback

Activate the previous release only through `fgctl` after WAL reconciliation (C5 refuses it while an unsupported pending record exists). Never retry through the deleted Node writers, never erase WAL, never reset a published ref. The Event Store rollback (`fgos events export --format legacy-layout`) is the Event Store plan's.
