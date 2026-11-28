# Phase 5 integration report

Result: the full gate is green through the new door on main `69e00f741a` (ticket `c-97759-1795828229002`, worktree
`261127-0151-ready-plan-runs-unattended-p05g`), run from the confined lead head. Acceptance criteria 3 and 5 are met.
Reaching green took one test-race fix, landed in this phase (`849230f1d8`), and a recipe change by the supervisor
(`69e00f741a`).

## Green gate (criteria 3 and 5)

`fgos release check --worktree /home/vantt/projects/forgent-worktrees/261127-0151-ready-plan-runs-unattended-p05g`,
2026-11-28 01:10-01:38 UTC, answered `green: true`, tip `69e00f741a`, no note (the check checkout was removed).

| argv | exit |
|---|---|
| `env -u FGOS_STATE_ROOT TMPDIR=/tmp/r npm test -- --test-concurrency=6` | 0 (6594 tests, 6567 pass, 0 fail, 27 skipped) |
| `env -u FGOS_STATE_ROOT TMPDIR=/tmp/r cargo test --workspace` | 0 (462 test binaries ok, 4809 tests passed) |

The committed `.fgos` is present in the check checkout. Tests that read the committed `.fgos/config.json` pass inside it
in every run (log line 3470, "the committed .fgos/config.json runner section loads and is well-formed").
Log: `.fgos/runtime/head-tickets/lead-forgent-261127-0151-ready-c75c2/c-97759-1795828229002.log`.

## Red path (criterion 3)

The earlier real red answers of the door serve as the red proof, in place of a planted failing test. The first,
`c-1642-1795817855888` on `2bb1312e6b`, answered `green: false` with exit 1, and the door changed nothing: activation
stayed at `sha256:31b00435`, and `.fgos/installation/activation.json` was unchanged since before the run. Main moved
during the run only by two plan-file lands of other heads (`49f851828f`, `edc652cb5d`), and no release record was
written. Later red runs (`c-5855`, `c-78925`, `c-95835`) behaved the same.

## Runs before green, and what each found

| ticket | tip | TMPDIR | npm | cargo | finding |
|---|---|---|---|---|---|
| `c-1642-1795817855888` | `2bb1312e6b` | `/var/tmp/r` | 1 (2 fail) | 101 | overlapped a supervisor release run; Node failures did not recur |
| `c-5855-1795820836333` | `2bb1312e6b` | `/var/tmp/r` | 0 | 101 | `fgos-distribution` `holder_lock_gate_drains_a_borrowed_git_background_gc` |
| `c-78925-1795823834076` | `849230f1d8` | `/var/tmp/r` | 1 (1 fail) | 101 | GC test fixed; `fgos-event-store` `seeded_interleavings_smoke` timed out; mailbox-live-confined 30 s wait |
| `c-95835-1795826187981` | `69e00f741a` | `/var/tmp/r` (stale main-checkout config) | 0 | 101 | `confinement_policy` `machine_private_roots_hide_...` vector mismatch |
| `c-97759-1795828229002` | `69e00f741a` | `/tmp/r` | 0 | 0 | green |

### GC vector race (fixed in this phase)

The `gc-auto-loose-objects` vector (`packages/holder-lock/rust/src/borrow_vectors.rs`) builds a control repository
inside the directory the distribution test scans in `/proc`. Its unswitched commit started a detached auto gc that was
awaited only until its `pre-auto-gc` marker appeared, never until it exited. The control repository now sets
`gc.autoDetach=false` and `maintenance.autoDetach=false`, so its gc runs in the foreground and has exited when the commit
returns; the borrowed repository is unchanged. Fix `c48686ea64` plus comment follow-up `4fffe460f8`, landed as
`849230f1d8` after the phase footprint was widened (`a09103f468`). An independent review reproduced the race by hand
with git 2.53 and found no blocking issue. Lead check: the distribution lib suite passed the GC test in 5 of 5 runs on
ext4 and 5 of 5 on tmpfs after the fix (1 failure in 3 ext4 runs before).

### Recipe TMPDIR (changed by the supervisor)

The release recipe ran every check with `TMPDIR=/var/tmp/r` on the ext4 root disk (config `2e033ea268`, no reason
recorded), while plain runs that pass use tmpfs `/tmp`. Timing-bound tests ran past their limits there
(`seeded_interleavings_smoke`, measured alone at 3-4 s on tmpfs against 11-12 s on ext4), and the `confinement_policy`
vector assumes the fixture root lies under `/tmp`. The supervisor chose option A, `TMPDIR=/tmp/r`, landed as
`69e00f741a`. The main checkout's working copy of `.fgos/config.yaml` had not picked up that land, so run `c-95835` still
used the old value until the supervisor synced it.

## Contract checks

- `node scripts/plan-contract-check.mjs --plan plans/261127-0151-ready-plan-runs-unattended`: exit 0, `ok`, with
  footprint-overlap warnings only (plans 261127-1003 and 261127-1535).
- `node scripts/plan-contract-check.mjs --all`: exit 1, only on errors of plans 261118-1117 (7) and 261123-0815 (1),
  which were already there and are not this plan's.

## Cleanup (standing rule U3)

All branches `ready-plan-runs-unattended/p01` to `p05g` are merged into main. Superseded worktrees for the supervisor to
remove with `fgos worktree remove --delivered-to main`:

- `/home/vantt/projects/forgent-worktrees/261127-0151-ready-plan-runs-unattended-p04` (tip `7c04d297ca`)
- `/home/vantt/projects/forgent-worktrees/261127-0151-ready-plan-runs-unattended-p05f` (tip `849230f1d8`)
- `/home/vantt/projects/forgent-worktrees/261127-0151-ready-plan-runs-unattended-p05g` (tip `69e00f741a`)

No unmerged branch or dirty worktree remains. No debt: every criterion is `[core]` and met.

## Learning left behind

- A release-recipe `TMPDIR` on a slow disk turns timing-bound tests red only inside the check and release checkouts;
  plain runs on tmpfs hide it. A suite run outside the recipe's environment is not proof that the recipe is green.
- A land does not always refresh a dirty file in the main checkout; the door reads the recipe from that working copy,
  so `fgos config show --path release` is the thing to check before a gate run.
