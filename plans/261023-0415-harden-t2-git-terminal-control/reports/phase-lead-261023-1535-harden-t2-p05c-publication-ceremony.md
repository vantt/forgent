# HARDEN T2 slice 5C: publication ceremony trim

Branch `harden/t2-p05c-publication-ceremony`, cut from `2658282ae`. Code commit `66117d9d3`.

## Result

One seal's publication ceremony (compare-and-swap, then pin release) drops from 13 to 10 Git children in steady state, and from 15 to 10 for the first publication of a ref. Contract, WAL records and their order, durability and exact-old CAS are unchanged.

## Method

A logging `git` first on PATH (the pattern of `tests/sequence.rs`) around: write objects, `compare_and_swap`, `release_pin_and_compact`, eight rounds on a sha256/files repo. Children counted per call. The same logging git is now the owning proof (below).

## Child table

`ev` = `refs/fgos/events/<machine>`, `pin` = `refs/fgos/git-operations/<id>/candidate`.

### Changing compare_and_swap (steady state)

| # | Before | Answer | After |
|---|---|---|---|
| 1 | for-each-ref ev | symbolic-or-direct fact, refuses a symbolic target before any record | kept |
| 2 | rev-list candidate | candidate intact | kept |
| 3 | show-ref --exists pin | preflight of pin create | folded |
| 4 | update-ref pin (old = zero) | pin install | kept |
| 5 | for-each-ref pin | pin read-back | kept |
| 6 | for-each-ref ev | preflight and Loss check right before the CAS | kept |
| 7 | update-ref ev (exact old) | target CAS | kept |
| 8 | for-each-ref ev | target read-back, decides Success or Loss | kept |

8 to 7.

### First compare_and_swap (target absent)

Before: for-each-ref + symbolic-ref (target, early), rev-list, show-ref pin, update-ref pin, for-each-ref pin, for-each-ref + symbolic-ref (target, before CAS), update-ref ev, for-each-ref ev = 10.
After: show-ref ev, rev-list, update-ref pin, for-each-ref pin, show-ref ev, update-ref ev, for-each-ref ev = 7.

### release_pin_and_compact

| # | Before | Answer | After |
|---|---|---|---|
| 1 | show-ref --exists pin | is the pin there (it is, on a first release) | folded |
| 2 | for-each-ref pin | read the pin | kept as the only read |
| 3 | for-each-ref pin | cas_raw preflight, repeats #2 | folded |
| 4 | update-ref -d pin <candidate> | exact-old delete | kept |
| 5 | show-ref --exists pin | compaction's read-back that the pin is gone | kept |

5 to 3.

Per seal: before 8+5 = 13 steady, 10+5 = 15 first. After 7+3 = 10 both.

## Folds and why each invariant holds

1. **Pin create reads nothing first** (`compare_and_swap`: `cas_preflighted` instead of `cas_raw`). `update-ref --no-deref <pin> <oid> <zero>` refuses any existing ref, live or dangling symbolic (checked on Git 2.53.0: "reference already exists" / "dangling symref already exists"). So the read was redundant to the CAS. A refusal still reads the pin once, so a symbolic pin keeps its cause `symbolic-publication-ref`; any other refusal is still `publication-pin-cas-failed`. The pin is still installed, read back and made durable before the target CAS.
2. **Release reads the pin once** (`release_pin_and_compact`). The read right before the delete is the symbolic preflight the delete needs, so `cas_preflighted` replaces `cas_raw` (its second read repeated the first). A first release finds the pin in place, so the listing replaces the existence probe that cost an extra child; a resumed release (chain already at `PinReleaseAttempt`) still probes by existence. The delete is still exact-old on the recorded candidate, a pin with another value still preserves the evidence, a native lock still reports `pin-release-failed`. `PinReleaseAttempt` and `PinReleased` records and their order are untouched.
3. **A target expected absent is probed by existence** (new `tip_expecting`, which `cas_raw` now also uses). One child instead of listing plus symbolic probe; a ref in the other state costs one more child. Same facts, same refusals.

## Trims dropped (weaken a spec rule)

- **Pin read-back after the pin create.** Spec section 4, "CAS and pin ordering": the pin is written by exact-old CAS and read back as a prepare substep, mandatory, "no optimization".
- **The two target reads before the CAS (#1 and #6).** #1 refuses a symbolic target before any WAL record or pin exists (`hooks_symbolic_refs_and_replaced_authority_are_refused`). #6 is the preflight directly before the CAS (spec C1) and the Loss check after the TargetAttempt record. Reusing #1 for #6 widens the window across WAL fsyncs, a rev-list and the pin install; removing #1 leaves a pending chain for a symbolic target.
- **The target read-back after the CAS.** It decides Success against unknown or Loss; update-ref's exit code alone does not see an outside move right after the win.
- **Compaction's pin-absent read.** It is the documented read-back before the ledger entry is written (`wal.rs` `compact`), and it is an independent reader by design.
- **Releasing with the delete alone (no read).** A delete with the candidate as old value on a symbolic pin whose dereferenced value matches would remove tamper evidence instead of reporting it.
- **`rev-list` candidate check** stays: no cache may outlive an operation.

## Proof

New binary `tests/publication_children.rs` (like `tests/head_switch.rs`), one case: `a_publication_and_its_release_run_only_the_git_children_whose_answers_are_not_known`. It names the behaviour, lists the exact subcommand sequence for a first publication, a pin release and a changing publication (the pin update precedes the target update), and checks every `update-ref` carries `core.fsync=all`, `core.fsyncMethod=fsync` and `--no-deref`. No existing test counted children or pinned the order. It fails on the pre-5C source (10-child first publication) and passes on the new. The logging git is installed once per test binary before any driver exists (the driver fixes its git per process), so it lives in its own binary and the other `publication.rs` cases run against real git, unchanged from the base.

## Verification

- `cargo test --no-fail-fast -p fgos-git -p fgos-event-store -p fgos-identity`: 502 passed, 0 failed (includes `publication`, `land_crash_matrix`, `recovery_matrix`, `wal` cases).
- `-p fgos-node-addon`: builds, 0 tests, exit 0.
- `cargo clippy -p fgos-git -p fgos-event-store -p fgos-node-addon --all-targets -- -D warnings`: clean.
- Node one-file command on `test/git/*.test.mjs` and `test/runner/land-vs-manual-commit.test.mjs`: `tests 182, pass 181, fail 0, skipped 1`, no `run-tests: ERROR` lines.
- `test/runner/loop.test.mjs` through the one-file command, with a counting git first on PATH (adds a shell hop per child): `tests 98, pass 98, fail 0, duration_ms 245318`, wall 246 s, 14467 git children (148 per case). No baseline run on the unchanged branch, so no delta; this branch does not carry WORK's cutover, so the Work seal path that motivated the slice is not in this measurement. Load average was about 6 at the start.

## Net size and test cost

- Rust source: +30 -11 in `packages/git/rust/src/publication.rs`.
- Rust test: +96 -0 in the new `packages/git/rust/tests/publication_children.rs` (`publication.rs` test file is unchanged from the base). Tests added 1, retired 0, new CLI or host spawns 0 (the wrapper is one `sh` hop per existing Git child).
- Node: 0.

## Git-area SHAs for OPC

- `66117d9d3` perf(git): drop the publication ceremony's Git reads whose answer the operation already holds (`publication.rs` source; the test case, later moved).
- Census regeneration commit: see the branch tip (last commit).

## Open points

- Event Store calls `compare_and_swap` then `release_pin_and_compact` and only reads the receipt; its contract is unchanged (event-store tests green).
- Further saving would need the two target reads or the read-backs; all are spec-bound, so this slice stops at 10.
