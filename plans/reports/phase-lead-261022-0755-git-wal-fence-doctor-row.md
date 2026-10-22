# Git WAL activation fence: facts, retirement recommendation, doctor row (H16)

Date 2026-10-22 (Asia/Saigon). Branch `git/wal-fence-doctor`, not pushed. Scope: HARDEN T1 hand-off H16
(arbitration §5, D4). H18 (`checkStopped`/`workspaceListing` to `migrate.mjs`) is ES's and untouched.

## 1. Facts

### (a) What the fence guards, and what breaks without it

The fence is the tombstone directory `<main checkout>/.fgos/locks/activation.lock/TOMBSTONE`
(`{"lock":"activation","by":"fgos git","at":...}`), placed by the new `fgctl` inside its activation critical
section (`packages/distribution/rust/src/init.rs:236-258`, `fence_legacy`; `replace_held_file` in
`packages/holder-lock/rust/src/tombstone.rs:27`). It does two jobs:

1. Against an old controller. The old lock FILE becomes a directory, so a pre-C5 `fgctl` fails at its first
   acquire and cannot activate over a WAL workspace and skip the C5 predecessor/WAL check
   (spec `docs/platform/git/spec.md` §12 "Who runs C5": "an older `fgctl` meets and fails on").
2. Against WAL writes without admission. Every WAL-writing door calls `wal::require_activation_fence`
   (`packages/git/rust/src/wal.rs:1098-1105`): `Wal::open` (wal.rs:1110), Publication (`publication.rs:253`),
   refs (`refs.rs:694`), remote (`remote.rs:213`), restore (`restore.rs:737`), repository config
   (`repository_config.rs:189`). Missing fence: `git-fence-missing` before any record is created
   (owning proof `packages/git/rust/tests/publication.rs:2075`).

When it is missing: every Git write refuses by name; the activation door refuses a non-WAL release when
`.git/fgos/git` exists and the fence is not a valid tombstone (`git_gate.rs:211-213`; also `init.rs:212`).
Repair: re-run admission with the same digest (`fgctl upgrade`/`init`); the gate test proves it re-places
the fence (`apps/fgctl/tests/git_wal_activation_gate.rs:255-264`).

Prior art (`git log -S'git-fence-missing'`): introduced in `d1d4ec7ee` (2026-10-18, "fence old activations"),
refined in `af932e76c` (same day, Lane B review blockers). The doctor home in `checkLockFences` is the only JS
trace (`src/setup/holder-lock-checks.mjs:611-613`); it also lived there because the fence path is registered
as a `managedBy: 'fgctl'` row of the `activation` lock (`src/holder-lock/fences.mjs:203`).

### (b) Is it past its release? Recommendation: keep

Evidence:
- This machine has one `fgctl` (`~/.local/bin/fgctl`, 0.2.0, the WAL-capable one); `which -a` shows no other.
  `.fgos/installation/activation.json` records `activatedBy fgctl 0.2.0`.
- `~/.local/state/fgos/releases` holds 19 staged releases: 7 lack `git-wal-v1` (Oct 16-18), 12 carry it
  (Oct 19-22). Any of the 7 is a live rollback or `--to` target today.
- The door already refuses unsafe older releases by other means, but only for the data: unresolved WAL records
  (`git-wal-pending`), live predecessor writers (`git-predecessor-writer-live`), unreadable WAL
  (`git-wal-unreadable`). None of these stops an old CONTROLLER binary (one that predates C5) from running at all;
  only the tombstone does that.
- Spec promise (§12 C5 and "Who runs C5"): rollback means activating a compatible prior release after
  reconciliation, refused with the cause named otherwise; the fence is what makes an old door "unable to skip
  the check". `docs/platform/packaging-distribution/contracts/activation-binding.md:125` repeats it as a
  contract line.
- The fence is not what T1 deletes. T1 deletes the Node doctor row and `fences.mjs`; the Rust fence (gate, WAL
  doors, tests, spec §12) is a separate mechanism. Deleting the row does not retire it, it only removes the
  report. Other owner machines (forgentX, mdview, mcp-skill-hub per arbitration D4) could not be inspected
  from here, so whether a pre-WAL `fgctl` still exists there is unknown.

Recommendation: keep the fence. Cost of keeping: one `symlink_metadata` plus a small JSON read per WAL open
(already paid), about 25 lines of Rust in `wal.rs`/`init.rs`/`git_gate.rs`, one gate test. Cost of retiring: edits
in five Rust crates/tests, spec §12 C5, activation-binding.md, holder-lock spec line 257, and the loss of the
only stop for a pre-C5 `fgctl` on any machine where one remains, with the 7 non-WAL releases still stageable.
Revisit when every owner machine runs a WAL-capable `fgctl` and the non-WAL releases are pruned. Not retired here.

### (c) Does the runtime path skip the fence at `git.rs:218`? No, and it is not a defect

`git.rs:218` is inside `inspect_git` (`#[napi]` at `git.rs:195`), the read-only doctor/Inspect reader. It uses
`Wal::open_existing`, documented as "C5/doctor reader: opens existing descriptors without mkdir or fsync"
(`wal.rs:1135-1137`). Skipping the fence there is intended: a reader must be able to open and describe a WAL
that lacks it, otherwise the doctor could not report the condition. The runtime WAL-WRITING open is
`initialize_git_wal` (`git.rs:293`, `Wal::open`), which requires the fence, as spec §12 C5 says. So the premise
"runtime path skips the fence" is wrong; the gap was only that Inspect never reported the fence (now it does).

Related finding (small, real, owner's call; not changed): three Land doors and one Restore door open the WAL
with `Wal::with_filesystem`, which does not check the fence:
`land.rs:384` (`prepare_land`), `land.rs:753` (`publish_land`), `land.rs:1585` (`acknowledge_land`).
(`restore.rs:738` is fine: it calls `require_activation_fence` at line 737; `land.rs:1245` uses `Wal::open`.)
Spec §12 C5 and the `wal.rs:1098` doc comment ("All WAL-writing doors require the controller's cutover fence")
say these should refuse. Fix: call `wal::require_activation_fence(repo)` before `Wal::with_filesystem` at the
three sites, mirroring `publication.rs:253` and `restore.rs:737` (3 lines, plus one owning test per door that
removes the fence like `publication.rs:2075`). Blast radius: callers of Land (Work integrate path) get
`git-fence-missing` in an unfenced workspace instead of writing records; workspaces activated by the WAL-capable
`fgctl` are fenced and unaffected; Land is not yet exposed to callers per spec §12 ("capability split"), so
exposure today is near zero. Recommended, but the owner decides.

## 2. Replacement doctor row

Reused row: `git-operation-journal` (no new row). One door: the Rust check itself.
- `packages/git/node-addon/src/git.rs`: `inspect_git` now returns `activationFence`, computed by
  `wal::require_activation_fence(&repo).is_ok()`: the same function the WAL doors call, so the tombstone parse
  (`fgos_holder_lock::tombstone::is_tombstone`) stays in Rust. No JS parse.
- `src/setup/git-checks.mjs`: when `journal.initialized && activationFence === false` the row fails with
  `git-fence-missing: ...` and next step `fgctl upgrade` for the active release. A WAL that never existed
  keeps its previous behaviour (the row is already red when uninitialized, and `--fix` refuses by name).
  An addon predating the field (`undefined`) is not judged.
- `src/setup/registrations.mjs`: row description names the cause.
- Docs: `docs/platform/git/spec.md` doctor-row table, `setup-doctor-registry.md`, CHANGELOG `[Unreleased]`.
- Census: `node scripts/git-one-door-scan.mjs --write-census` regenerated `packages/git/contracts/mutation-census.v1.json`
  (0 undeclared sites).

Tests (principle 8):
- Owning proof of the fact: `test/git/native-load.test.mjs` "inspection reports whether the controller
  activation fence stands" (absent, valid tombstone, tombstone by another controller).
- Wiring proof of the row: `test/setup/git-checks.test.mjs` "the journal row fails with git-fence-missing when a
  Git WAL has lost the controller activation fence" (real addon, real WAL, fence removed).
- Not covered here: the old `lock-fences` test `holder-lock-checks.test.mjs:387` (`^git-fence-missing:`) goes
  with `checkLockFences` in T1; the new wiring test supersedes it.

## 3. Gates

- `cargo test -p fgos-git -p fgos-distribution -p fgos-node-addon`: all result lines ok.
- `cargo clippy -p fgos-git -p fgos-distribution -p fgos-node-addon -p fgctl --all-targets -- -D warnings`: clean.
- Focused node tests (`test/setup/git-checks.test.mjs`, `test/git/native-load.test.mjs`): both new tests pass.
- Full `npm test` (tracked `.fgos/config.json` restored for the run, stub state restored after): 8849 tests,
  8749 pass, 4 fail, none in Git/doctor code: `decideExecutorCli resolves dispatch plan for an assignment`,
  `two checkers whose leases conflict at once rebind...`, `a host that does not know the route throws
  host-version-mismatch`, `the row fails on a host that has no seat-binding route` (dispatch, seat-binding and
  host-route tests; probably a host binary older than source in this worktree). Not compared against a clean
  baseline run of the full suite.
Pre-existing, not caused here: `cargo fmt --check` reports a diff in `apps/fgctl/src/main.rs`; the test
`an unused controller fence does not turn a channel without activation red` fails on this worktree without
and with my change (`git-addon-unavailable` outside an activated release); it is a `checkLockFences` test that
T1 deletes.

## 4. Unresolved
- Whether a pre-WAL `fgctl` remains on forgentX, mdview or mcp-skill-hub (owner machines, not inspectable here).
- Owner call: adding the fence check to the three Land doors (section 1c).
