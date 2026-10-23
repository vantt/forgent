---
phase: 03
title: "Git correctness: config recovery durability (CF05), WAL temporaries (CF06), rejected push (CF08), local counter durability (CF09)"
status: pending
depends_on: [02]
parallel: "with phase 04 (disjoint files); with phase 06"
effort: ~1d
net_size: "Node 0 / Rust +45 / tests +10 (estimate)"
---

# Phase 03 — Git correctness

## Context

Arbitration D1 step 3, §1 item 2, D2 (the sequence counter is in T2; CAS-only/no-WAL stands; fixes reuse existing primitives; IDENT told). Correctness seat CF05, CF06, CF08, CF09 (fix shapes). CF07 went to phase 2 (D-T2-2). Phase 1's red tests are the acceptance; a finding closed as "not reproduced" in phase 1 is skipped here.

## Requirements

- **CF05** (`packages/git/rust/src/repository_config.rs:244-258` recovery, `:269-273` replay, seat cites `:493-497,525-547` for the effect path; re-grep): a config change whose rename is observed but whose file and parent-directory durability is not proven is **not** acknowledged by value match alone. Recovery and same-id replay first complete the durability step with the existing `fgos_durable_file` sync (file, then parent), then append `Transfer { acknowledged: true }`; if the sync still fails, the chain keeps pending evidence (`unknown: true`) and the answer is `recovery-required` with a named cause. The edit is never replayed; no second journal.
- **CF06** (`packages/git/rust/src/wal.rs`, inner readers: per-operation `inspect` and the pre-intent scan; the outer scan's rule `is_temporary` at `wal.rs:2480`): every reader applies the existing temporary classification **before** counting entries against the record bound. Unknown names still refuse; nothing is deleted. One classification function, no copy.
- **CF08** (`packages/git/rust/src/sequence.rs:180-186`): only git's stale-lease verdict maps to `SequencePush::Stale` (the porcelain `!` row whose reason is the lease's `stale info` / `fetch first` for a `--force-with-lease` push — the lead pins the exact reason strings from git's `push --porcelain` output in a unit case); every other `!` row and every failure keeps git's stderr and returns `sequence-push-failed` with it. The CAS-only protocol is unchanged.
- **CF09** (`sequence.rs:135-147,192-205`, local home): the counter commit object is made durable before the ref moves, and the ref and its directory chain are durable before `Claimed` is returned, by reusing the existing primitives: `objects.rs` object sync and `refs::sync_refs` (`refs.rs:241-273`), and `-c core.fsync=…` on the `update-ref` exactly as `install_pin` does (`refs.rs:290-335`). No WAL (owner decision stands).

## Files

**Create**: none. **Modify**: `packages/git/rust/src/{repository_config.rs,wal.rs,sequence.rs}` (wal.rs: the inner readers only; phase 2's `RECENT_TERMINAL` move is already merged), tests from phase 1 in `tests/{repository_config.rs,sequence.rs}` and `wal.rs` inline (assertions only if a red test needs its expected cause adjusted to the final name). **Delete**: the duplicated temporary checks inside the inner readers (if any copy exists, re-grep `.durable-file-` in `wal.rs`). **Tests to retire**: none.

Not touched: `driver.rs` (phase 4), `refs.rs` (phase 2 merged; this phase only calls `sync_refs`).

## Steps

1. Branch `harden/t2-p03-git-correctness` from the track branch after phase 2 merged.
2. One commit per finding, each turning its phase 1 test green: `fix(git): finish config durability before acknowledging a recovered change`; `fix(git): failed-write temporaries never count against the WAL record bound`; `fix(git): a sequence push the remote refuses keeps the remote's reason`; `fix(git): a local counter claim is durable before it is reported`.
3. OPC review; IDENT told (board line) for CF08/CF09 since the mint door calls this code.
4. Report: Δ lines, proofs, OPC verdict, CF09 witness type (unit or E1 script).

## Verification (exact)

```sh
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p03-target
cargo test -p fgos-git --test repository_config --test sequence --test publication --test land_crash_matrix --test recovery_matrix
cargo test -p fgos-git --lib -- wal::
cargo test -p fgos-identity
cargo clippy -p fgos-git --all-targets -- -D warnings
```

Node: `test/git/repository-config.test.mjs test/git/recovery.test.mjs` (one-file command). If CF09 has no unit witness: `scripts/git/e1-power-cut.*` per its own README on a scratch device directory, output pasted.

## Net size

Node 0 / Rust +45 (CF05 +15, CF06 ±5, CF08 +10, CF09 +15) / tests +10.

## Test-cost line

Added 0 beyond phase 1 (≤ 1 porcelain-parsing unit case for CF08); retired 0; local counter claim gains ≈ 3–4 fsyncs per claim (cold path: one id mint).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Stale-lease reason strings differ across supported git versions | M × M | Match on the documented porcelain flag plus reason family; floor-version probe already pins the git range; unit case per spelling observed on the floor version |
| Recovery that now syncs can fail on a read-only or full disk where it used to "succeed" | L × M | That success was the defect; the answer names the cause and keeps evidence |
| CF06 hides a real foreign file by classifying it as temporary | L × H | Only the exact existing pattern (`wal.rs:2480`) is skipped; unknown names still refuse (existing refusal tests stay) |

## Rollback

Revert the four commits; no on-disk format changes (CF05 writes the same records; CF09 writes the same ref and object).

## Done when

Phase 1's CF05, CF06, CF08, CF09 tests green (or CF09's E1 run recorded); crash matrices green; OPC verdict recorded.
