# Work CLI `move` overhead: admission probe and seal-written checkpoint

2026-10-23 (Asia/Saigon). Branch `work/es-cutover`, commits `58fb6f1d2` (event-store + JS) and `92128dd8a` (node addon + census; `packages/git/**` alone). Pushed.

## Changes
1. **Write admission, one Git-port read.** `legacy_import.rs` `absent_roots`: one `read_paths_at` of the legacy root directories (`.fgos`, `docs/distillery/state/porting`, `porting`, plus roots from a legacy-import hint) at the HEAD commit already observed. Roots answered "absent" are not listed; any other answer (present, blob, error) goes to the old listing, which owns the answer and every refusal. Git-port only; `driver.rs` untouched. No-legacy admission: 9 -> 4 git children (symbolic-ref, rev-parse, for-each-ref, one cat-file). The read path shares the same inventory code.
2. **Seal writes the checkpoint.** After the receipt is written, `checkpoint::advance` extends `.fgos/cache/event-history.json` with the events the seal just verified and moves that ref's verified tip to the sealed commit. Applies only to a valid file whose verified tip for the ref equals the tip before the seal, and only when the folded history has nothing deferred or missing. The ordering is the read's own rule (`read::fold_history`, extracted and shared). Written through `fgos_durable_file::replace_durably`. A failure is reported as `checkpointError`, never raised. The read still verifies the file against the real refs (ignore + rewrite on mismatch). The verification walk, seal timing and fsyncs are unchanged. Path plumbing: `policy.historyPath` -> seal coalescer -> `store.seal({checkpointPath})` -> `native.seal` -> `seal_checkpointed`.

## Proofs (owning, lowest layer)
- Admission one object child, no ls-tree: `tests/read_head_children.rs` (new test). Refusals stay in `tests/legacy_import.rs` (unchanged, green). `tests/legacy_reader.rs` single-read assertion 0 -> 1 (the root probe is the one single read; files still one request).
- Second process walks zero sealed commits after a seal; forged file written by a seal is ignored and rewritten; seal without a file leaves it to the read; concurrent seals + reads leave one usable file and no temp file: new `tests/seal_checkpoint.rs`. `tests/checkpoint.rs` untouched.
- Wiring: `test/event-store/seal-coalescing.test.mjs` (path reaches the seal), `test/event-store/work-gate.test.mjs` (next process: continued, nothing written).
- Gates: `cargo test` and `clippy -D warnings` on `fgos-event-store`, clippy on `fgos-node-addon`; focused node run of `test/event-store`, `test/state`, `test/setup`, `test/architecture.test.mjs`: 2317/2317. Census regenerated with `--write-census`.

## Measurement (ext4 fixtures under forgent-worktrees, debug addon, load 1.9-2.2 at start, release of other lanes held)
Method: scratchpad `c1-prof.test.mjs` through `fr.sh` (CLI harness repo, one warm move, then 5 alternating `move` processes; strace2 3 moves for counts). A = origin/main `fc45170a7`, B-before = `9d30618d4`, B-after = branch tip. The three sides share one Cargo target; worktrees share crate fingerprints (mtime), so each side's workspace crates were cleaned before its build and the three staged addons were confirmed distinct by sha256. An earlier run that skipped this measured stale addons and is discarded.

| side | wall per move, plain, median of 5 (range) | wall, spy, median of 5 | git children | fsync |
|---|---|---|---|---|
| A (main) | 225 ms (215-240) | 220 | 5 | 0 |
| B before | 1114 ms (1086-1177) | 1143 | 49 | 69 |
| B after | 944 ms (900-999) | 992 | 37 | 69 |

Per call, B after vs before (strace, steady-state move): admitWrites 9 -> 4 git children (184 -> 101 ms straced); read 9 -> 2 (235 -> 51 ms straced; the 2 are the ref listing and the fence lookup); seal 26 -> 26, 63 fsync unchanged (the verification walk is deliberately kept). Net -12 git children and about -170 ms per move (-15%). The first move after `add` (no checkpoint yet) still walks once and writes the file.

## Remaining B - A gap (about 720 ms)
Seal 26 git children / 63 fsync (about 530 ms of it on ext4), plus spawn-chain latency of the 37 serial children on an idle host. Neither is WORK-only overhead: seal ceremony and fsync layout belong to the Git lane and the per-command seal rule.

## Notes
- Cost trade: a commit that tracks all three legacy roots pays one extra git child for the probe (roots present are listed as before).
- Cleaned: `w6-before`, `w6-main` worktrees and the ext4 temp dir removed; no processes left.

Status: DONE_WITH_CONCERNS
Summary: Per CLI move on ext4: 1114 -> 944 ms (median of 5; A 225 ms) and 49 -> 37 git children, fsync unchanged at 69.
Concerns: B still about 4x A; the rest is seal ceremony and fsync (not WORK-only).
