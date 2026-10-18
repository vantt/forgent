# Review: Git phase 01 Lane A (Publication port, WAL, driver, holder-lock borrow changes)

Read-only code review of branch `git/p01-publication-port` at `694ac49f9` against base `93aad788c`.
Every changed file in the brief was read in full except the long test bodies, which were read
where they cover a rule this review checks. Contract: `docs/platform/git/spec.md` (D-ADR0057 +
D-ADR0058), `docs/platform/holder-lock/spec.md` §5/§8, phase-01 plan requirements 1-13a, and the
phase-lead reports 1146-1246. No file other than this report was written. One behaviour was checked
with a scratch probe outside the repository (finding H2). Test run: see "Evidence" at the end.

## Verdict

The protocol core matches the spec. It follows the pin → read-back → dir fsync → `prepared` →
TargetAttempt → single-ref `--no-deref` CAS → read-back → dir fsync → outcome order, never reissues
an attempt (also after ABA), records supersession only, and claims `processCrash` only. The
holder-lock changes keep the description opaque, give one child per description, drain before
return, never signal outside the borrow group/descendants, and keep the handle when a foreign
holder exists. I found no safety violation of the double-publication or kill-outside-domain kind.

The blockers are about **liveness and reachability**, not CAS safety:

- the WAL refuses this very repository;
- Publication wedges permanently as history grows, and after some crashes;
- one transport path runs foreign hooks under the borrowed seal.

These need fixing before the Event Store handover. Findings are ranked below.

**Critical: none.**

## High

### H1. WAL refuses any repository whose common dir is group-writable, including this one
- `packages/git/rust/src/wal.rs:420` (`Directory::open` mode check), applied to the common dir
  at `wal.rs:483` and `wal.rs:503`.
- **Spec reason:** requirement 8 refuses a group/world-writable **WAL root**
  (`<common-dir>/fgos/git/operations`). The code applies the same `mode & 0o022` test to the
  repository common dir itself. `git init` under umask 002, the default for user-private groups on
  Ubuntu and the umask of this session, makes `.git` 0775. `/home/vantt/projects/forgent/.git` is
  0775 today. `Wal::open`, `HolderAuthority::new` and every Publication call would therefore fail
  with `Untrusted` in the owner's own repository and on any `core.sharedRepository=group` repo.
- **Why the tests miss it:** the fixture hides the problem. `tests/publication.rs:20` and `:61`
  `chmod 0700` every temp repo, and `wal.rs` tests create 0700 dirs.
- **Fix:**
  - Keep the uid/mode/`O_NOFOLLOW` trust test on `fgos/`, `git/`, `operations/` and `compacted/`,
    which the WAL creates 0700.
  - For the common dir, check only "directory, not a symlink, canonical, owned by euid or root".
    Reject world-writable (0o002); do not reject group-writable.
  - Remove the `chmod 0700` from the fixtures, and add a test that runs under the real umask
    (002) on a shared-group repo.

### H2. `pushRefs` to a `file://`/path remote runs the remote repository's hooks under the borrowed event-seal
- `packages/git/rust/src/publication.rs:1220-1222` (accepts `/…` and `file://`) and `:1475-1487`.
- **Spec reason:**
  - §4: "Publication's private Git calls cannot execute repository hooks."
  - §10 rule 4a: every Publication git child runs borrowed with hooks disabled, "so a Publication
    git child starts no descendant outside that borrow".
- **The client config does not reach the remote side.** `-c core.hooksPath=<empty>` reaches only
  the client. A local push spawns `git-receive-pack` in the remote repo, and Git clears
  `GIT_CONFIG_PARAMETERS` for that local transport (local_repo_env). The remote's `pre-receive`,
  `update`, `post-receive` and `reference-transaction` hooks therefore run.
- **Scratch probe (Git 2.53.0):** with `-c core.hooksPath=<empty dir> -c protocol.allow=never
  -c protocol.file.allow=always push --porcelain --no-verify -- file://…/remote.git …` the remote
  `pre-receive` ran, and `/proc/$$/fd/3` was open inside it. That is the slot holder-lock maps the
  event-seal description to.
- **Consequence:** arbitrary repository code holds the seal description. A hook that daemonizes
  (setsid + double-fork) becomes a `lock-description-foreign-holder`, and the event-seal stays held
  until it exits.
- **Fix:** for the `file` scheme, pass `--receive-pack` and `--upload-pack` as
  `<absolute git> -c core.hooksPath=<trusted empty dir> receive-pack` / `upload-pack`. Prove with a
  real local remote carrying a marker hook that no remote hook fires. If that is not acceptable,
  refuse path/`file://` remotes for push by name.

### H3. Every Publication call does an O(history) WAL scan, and the 100,000 bound becomes a permanent refusal
- `publication.rs:244` (`wal.scan(100_000)` on every `compare_and_swap`, fetch and push).
- `wal.rs:1196-1212`: the bound counts operation directories **and** ledger entries; reaching it
  sets `complete=false`.
- `publication.rs:245`: an incomplete scan is refused (`publication-backlog-unreadable`).
- `publication.rs:1552`: only PublicationCas chains are ever compacted. Every fetch and push leaves
  a terminal 4-record operation directory forever.
- **Spec reason:** §10 says the id stays non-reusable, so the ledger grows one entry per operation.
  C4 says a bounded scan that is incomplete is not clearance. Combined, these guarantee a
  **permanent** refusal of all Publication in the repository once about 100,000 operations have
  happened in total. Before that, each call costs one `read_json` + SHA-256 per historical
  operation. Opportunistic sync (fetch/push) reaches the bound fastest. Plan 12a's "bounded per
  operation" is about bytes, not the per-call scan cost.
- **Fix:**
  - Admission needs only **unresolved** chains touching this ref. Do not iterate the ledger in
    `admit_pending`; the ledger is consulted per id in `begin`.
  - Compact terminal transfer chains, or record them directly in the ledger.
  - Keep the full `scan` for doctor/C5 only, with a bound reported as incomplete there.
  - Add a test with ≥100,001 ledger entries that still publishes.

### H4. Chains that stop before their TargetAttempt have no terminal path and stay unresolved forever
These are WAL chains that ended at Intent or Prepared. Four places produce them:

- **Intent installed before cheap read-only preconditions.** `publication.rs:1137-1156` installs
  Intent and then checks `candidate_intact`. A pin CAS failure, read-back mismatch or fsync error
  at `:1165-1179` returns with the chain at Intent and possibly a pin on disk.
- **Wide window between Prepared and TargetAttempt.** In `publication.rs:545-560`,
  `validate_quiescent` (up to `killWaitMs`, 2 s) runs between `prepared` and TargetAttempt. A
  `ForeignHolder` refusal or a crash there leaves the chain at Prepared.
- **Transfers.** `publication.rs:1284-1299`: a crash or Busy between Intent, Prepared and
  TargetAttempt leaves a RemoteFetch/RemotePush chain. `wal.recover` returns `RecoveryRequired` for
  non-CAS kinds (`wal.rs:871-873`). `admit_pending` (`publication.rs:255-262`) then refuses
  **every** later PublicationCas of the stream's own ref, because that ref is the transfer's
  `resource_set[0]`.
- **Empty or temp-only operation directory.** `begin` creates the directory (`wal.rs:543`) before
  record 0. A crash there leaves an empty or temp-only directory. `inspect` gives
  `corrupt("empty operation directory")` (`wal.rs:283-285`), `scan` reports it as an error, and
  `admit_pending` refuses **all** Publication in the repository. Only a retry with the *same* id
  heals it, but the Event Store retries with a new id (D6). The test
  `every_acknowledged_filesystem_boundary_preserves_attempt_evidence` asserts this error state at
  `tests/publication.rs:633-636` without checking that publishing continues.

**What keeps these chains alive:**

- `supersede` accepts only a chain whose last record is TargetAttempt (`wal.rs:670`).
- `recover` maps Intent to `Unprepared` and then to `RecoveryRequired` (`wal.rs:876-878`).

Such chains are never terminal, so:

- doctor's unresolved count grows;
- C5 (requirement 19, `git-wal-pending`) blocks rollback to a non-WAL release forever.

**Spec reason:**

- §10 rule 4: "a valid chain without any TargetAttempt is the WAL evidence that no prior attempt
  happened". These chains are provably effect-free.
- §10 C2 and rule 5: directory creation decides nothing.
- The spec defines no terminal outcome for them, so the gap is partly in the spec.

**Fix:**

1. Run every read-only precondition (candidate intact, symbolic preflight, quiescent admission)
   before Intent, and run the quiescent admission before `prepared`, not between `prepared` and
   TargetAttempt.
2. Treat an operation directory with no record 0 as "no Intent". Under the same authority, remove
   it or ignore it for admission; it never blocks other ids.
3. Add a record-only terminal outcome for a chain with no TargetAttempt, for example
   `abandoned-before-attempt`. Under the same publication authority it may be installed by the
   no-overwrite primitive. Make it compactable, and let a non-CAS transfer chain at Intent or
   Prepared close the same way.
4. Item 3 adds a phase outcome to the §10 graph, so it is a §10 amendment for the owner (same shape
   as A1). Until it is decided, items 1-2 alone remove the common cases.

## Medium

### M1. The Node holder-lock door still kills every description holder; the amended §5/§8 rule now has two implementations that disagree
- `src/holder-lock/index.mjs:406-433` (`sweepLeftoversSync`/`sweepLeftovers` call
  `killDescriptionHoldersOnce(handle.path, {excludePid: process.pid})`).
- The Rust `driver/flock.rs` `drain_description` now kills only the borrow group and descendants.
- **Spec reason:** holder-lock §5 (clarified 2026-10-18) and §8 step 0 now say foreign holders are
  "waited or refused, never killed" for the port, not for one language.
- **Consequences:**
  - The Node path still SIGKILLs an unrelated pre-exec child of the same process, which is the
    hazard found in u4d.
  - Under the combined addon (lane B) that child can be a Rust Publication git child, and its
    outcome then becomes `publication-outcome-unknown`.
  - A Linux setsid hook escapee is now refused by Rust but killed by Node, and
    `borrow_git.rs:137-183` changed from "killed" to "refused".
- **Design principle 7 / L10:** one authority, one implementation.
- **Fix:** move the Node Linux sweep to the same domain rule. Better, route it through the Rust
  port's `end_leftovers` via the existing helper. Add the pre-exec vector to
  `test/holder-lock/*.test.mjs`. Record in holder-lock §8 that Linux escapees from hook-enabled
  borrows (checkpoint and merge commits) now keep the lock until they exit; this was a kill before.

### M2. Requirement 12's automatic same-ref recovery after a receipted CAS is not implemented
- `publication.rs:1098-1182`: after a successful CAS nothing recovers other pending PublicationCas
  chains of the same ref. `recover` and `supersede` exist only as explicit calls with ids the
  caller must know.
- **Spec reason:** plan requirement 12 says "After every receipted CAS, the port runs recovery of
  pending PublicationCas records of the same ref while it still holds the caller's authority".
  §10 rule 4a's supersession is the A1 form of that sweep.
- Without the sweep, every crashed attempt stays pending until the Event Store discovers and
  supersedes it, and that blocks C5 (see H4).
- **Fix:** after `finish` returns `thisInvocationWonCas`, use a bounded list of unresolved same-ref
  chains (H3 fix) and call `recover` / `supersede(old, this_id)` for each. Ignore per-chain
  refusals, which keep the evidence. Add a test: crash at `before-target-cas`, then a new id wins,
  then the old chain is `superseded` with nothing pending, and no explicit call is made.

### M3. `superseded` is never surfaced as a result code
- `publication.rs:481-513` and `:445-453`. A chain ending in `Outcome::Superseded` comes back from
  `recover`, `supersede`, or `compare_and_swap` with a reused id (`Begin::Existing`/`Compacted`)
  as **`Ok(Receipt)`**.
- `ResultCode::Superseded` is constructed nowhere (`grep ResultCode::` over `src/`).
- **Spec reason:** §2 says `superseded` is a distinct terminal result that "says nothing about
  whether the old CAS ran". §17 prohibits claiming that it ran. A caller retrying the old id cannot
  tell this `Ok` apart from a success except by reading `publication_state: Unknown`.
- **Fix:** return `Err(OperationError{code: Superseded, receipt})`, or add an explicit outcome
  field to the receipt. Add an assertion in `attempted_operation_is_never_replayed_after_fault_or_aba`.

### M4. The CAS loss and push rejection classification parses localized Git text
- `driver.rs:68-80` (`Scrubbed` keeps `LANG`/`LC_*`); `publication.rs:592-597` (`"but expected"`,
  `"reference already exists"`); `publication.rs:1497-1500` (`[rejected] (non-fast-forward)`).
- Under a non-English locale a real loss becomes `publication-outcome-unknown`. The chain then
  stays at TargetAttempt, and because the later expected value equals neither the old expected nor
  the old next, it is never supersedable. The push results M4 promises (`rejected-non-fast-forward`)
  degrade to `rejected-other`.
- **Fix:** set `LC_ALL=C` (and `LANGUAGE=`) in the driver's typed overrides for every policy.
  Better still, decide the loss from the read-back only: success iff the read-back equals `next`;
  a definite loss iff the read-back is neither expected nor next and update-ref exited 1.

### M5. Post-effect failures are reported as an ordinary refusal
- `publication.rs:582` (`self.ref_tip(...)?` right after the target CAS) and `:561` (read after
  TargetAttempt) propagate a `Refused` error without `pending_error`.
- **Spec reason:** C4 says "after the effect return observed/pending durability, not ordinary
  no-effect failure". Child death or timeout around a CAS is unknown until read-back.
- **Fix:** map every error after the TargetAttempt install through `pending_error` (code
  `RecoveryRequired`, operation id set).

### M6. One door: the durable-install primitive now exists three times
- `packages/run-supervisor/rust/src/publish.rs:21` (`publish_once`) and
  `packages/terminal-control/rust/src/store.rs:154` remain alongside `fgos-durable-file`.
- **Spec reason:** plan requirement 7 ("Move both existing callers to it in the same change
  (L10)") and design principle 1. The u1 report deferred the move because of a lane-6.3 collision.
  That is acceptable only with a tracked item; none is linked.
- **Fix:** move both callers, or open the backlog/board item now and name it in the merge commit.

### M7. The admission refusal does not name the blocking operation
- `publication.rs:255-262` returns a bare `publication-wal: RecoveryRequired` with no id.
- Transfer ids are generated internally (`publication.rs:1258-1266`), so the Event Store cannot
  drive `recover`/`supersede` without a doctor scan.
- **Fix:** put the blocking id(s) into `OperationError.operation_id` and the cause.

### M8. Spawn count per operation is high enough to threaten E3 before it is measured
- Every `publication_call` spawns `git config --list` before the real command
  (`driver.rs:271-289`).
- `read_ref` takes three spawns (`symbolic-ref`, `show-ref`, `for-each-ref`), so six with config.
- `walk_commits` spawns `cat-file --batch` once **per commit** (`publication.rs:1031`): two spawns
  per commit.
- One CAS is on the order of 40 spawns. A 10,000-commit walk is about 20,000 spawns, roughly 2
  minutes at the DC baseline of 6 ms per spawn.
- Plan requirement 2 allowed "cached per process, re-read when a config file's identity changes".
- **Fix:**
  - Batch `cat-file --batch` over the pending frontier.
  - Use one `for-each-ref`/`symbolic-ref` pair per read.
  - Cache the config preflight keyed by the identities of the config files.
  - Do this before step 13 (E3) runs; it decides Q1.

### M9. Transport runs under the fixed 30 s deadline used for local plumbing
- `driver.rs:279`, `:302`: fetch and push get `Duration::from_secs(30)`.
- A legitimate first fetch of event history over HTTPS/SSH, or a slow push, is killed. Fetch then
  leaves a pending chain (H4), and push becomes `remote-outcome-unknown`.
- **Fix:** take the transport deadline from the caller or from config registered through
  `fgos setup`/doctor (AGENTS install gate). Keep 30 s for local plumbing.

## Low

- **L1. Linux-only refusals are not named as platform refusals.** `publication.rs:105`
  (`publication-borrow-unavailable` on non-Linux) and `wal.rs:428` (`WalError::Unsupported`
  rendered as `publication-wal: Unsupported`). The brief requires refusal "elsewhere by name".
  Use `unsupported-platform: publication requires linux` so doctor and the Event Store can tell
  "no borrow" from "no platform".
- **L2. A pre-spawn refusal of a push is reported as `remote-outcome-unknown`.** At
  `publication.rs:1518` (`Err(_) => RemoteOutcomeUnknown`), a known-no-effect refusal (authority
  validation, floor, config) becomes "unknown". Return the refusal when no child was spawned.
- **L3. The `--no-deref` guard is bypassable.** `driver.rs:432-436` adds `--no-deref` only when
  `update-ref` is `args[0]`; every Publication call prefixes `-c core.fsync=all`. Publication passes
  `--no-deref` itself, so behaviour is correct today, but the driver's own guard does nothing. Match
  the verb after leading `-c k=v` pairs, or have `cas_raw` own the flag alone.
- **L4. One broken worktree registration fails `resolve_repo` for every worktree.** At
  `driver.rs:204-208`, one partly pruned `worktrees/<x>` without `gitdir` (a §11 residue shape)
  aborts the whole resolution. Skip unreadable entries, and refuse only when the requested path
  matches none.
- **L5. The ledger bound is measured in logical bytes.** `wal.rs:1217` measures `metadata.len()`.
  One file per id allocates 4 KiB (the E3 note: about 4.5x). "≤ 512 bytes per operation" holds
  logically, not on disk. Report allocated blocks, or append to a segment file.
- **L6. `HolderAuthority::old_performer_gone` returns `true` unconditionally** after quiescent
  validation (`publication.rs:187-192`). This is sound on Linux by the flock argument in the
  comment, but no real-process negative test exists at this layer (only fake admission in
  `wal.rs:1523`). Add an assertion that a second handle cannot be acquired while an orphan holds
  the old description, which documents why `true` is sound.
- **L7. The driver environment keeps `LD_PRELOAD`, `HOME`/`XDG_CONFIG_HOME`, `PAGER` and similar.**
  `driver.rs:68-80` keeps them. This conforms to plan requirement 1 (only `GIT_*` scrubbed). Note
  the risk for §4's "nor inherit worker-provided external commands"; an allowlist environment
  (`PATH`, `HOME`, `LC_ALL=C`, `TMPDIR`) would close it.
- **L8. Command-key preflight is wider than needed.** The preflight refuses `include.path`/
  `includeIf`, whose targets are already expanded by `config --list --show-origin`, and
  `credential.helper`/`insteadOf` even on Remote calls that override them (`driver.rs:848-866`).
  This is plan-conformant (risk row "LFS"), but a global `git lfs install` or `credential.helper`
  makes every operation refuse. Record it in the plan's risk row as observed, not hypothetical,
  before phase 07.

## Test coverage against the plan's validation list

The tests are real: temporary bare repos in SHA-1/SHA-256 × files/reftable, SIGKILL of a
re-executed test child, fault injection through the `FileSystem` trait, no environment switch.
Missing or masked:

- **umask 002 / shared-group repositories:** masked by `chmod 0700` (H1).
- **Syscall order trace** (`strace -f -e trace=fsync,fdatasync,renameat2,link,rename`):
  absent. Plan "Validation" requires it as the E1 precondition.
- **Plan M8 (10,000 sequential PublicationCas, kill at every compaction step):** the 10,000 test
  is WAL-only (`wal.rs:1844`), and the report says so. It does not exercise the O(history)
  admission scan (H3).
- **Crash between Intent, Prepared and TargetAttempt of a transfer, and an empty operation
  directory followed by a *new* id:** absent (H4).
- **`file://` remote hook marker:** absent (H2).
- **`superseded` result code, and automatic same-ref recovery:** absent (M2, M3).
- **Kill between pin CAS and `prepared` with a real SIGKILL:** covered only by injected faults.
  The real kills are at `before-target-cas` and `after-target-cas`. This is acceptable.

## What conforms (checked, no finding)

- **CAS order and TargetAttempt:**
  - pin by exact-old CAS from `Absent`, read-back, ref dir chain fsync (including the common dir
    for `packed-refs` and `reftable/`), durable `prepared`, durable TargetAttempt, then a
    single-ref `update-ref --no-deref <ref> <next> <old>`;
  - read-back, dir fsync, then the outcome record. Never a multi-ref transaction;
  - a TargetAttempt with no outcome is never re-effected, also after ABA (tests at
    `tests/publication.rs:406`, `:499`).
- **Recovery table:**
  - Intent-only is preserved;
  - Prepared with ref=expected and pin=candidate re-attempts only by installing the first
    TargetAttempt through no-overwrite;
  - ref=next completes as `effectObservedOnly`;
  - pin residue is reconciled only from a prepared/attempted record, with no native lock present;
  - a native lock (`<ref>.lock`, `tables.list.lock`, `packed-refs.lock`) is never unlinked.
- **Rule 4a:** `wal.rs:664-714` checks all of the following, and has no replay path:
  - same repo identity, resource set and authority binding;
  - later outcome `thisInvocationWonCas` with expected ∈ {old expected, old next};
  - live admission and no native lock;
  - attribution `effectObservedOnly`/`uncertain`;
  - a no-overwrite outcome record.
- **WAL:**
  - hash-chained versioned records;
  - no-overwrite `link`+`unlink` install, which spec §10 allows as an alternative to `renameat2`;
  - file, directory and parent fsync;
  - record 0 binds digest + resource set; the loser stops at `Busy`/`EEXIST`;
  - corrupt is never empty; directory fds use `O_NOFOLLOW`;
  - recovery derives the pin from the id, not from a recorded path.
- **Receipts:** `durability.processCrash` only.
- **C1 hardening on every invocation:**
  - `--no-replace-objects`, `core.fsmonitor=false`, `gc.auto=0`, `maintenance.auto=false`;
  - trusted empty `core.hooksPath` (0500, checked empty per call);
  - `protocol.allow=never`, plus an explicit scheme allow on Remote;
  - `--no-lazy-fetch` + `GIT_NO_LAZY_FETCH=1` on non-Remote;
  - `--no-optional-locks` on Inspect; `--end-of-options` before revisions;
  - `GIT_*` scrubbed; bounded and redacted stderr.
- **Holder-lock:**
  - the descriptor stays private (compile-fail doctest);
  - `validate` re-checks inode identity before every borrow;
  - one mapped child per call; the root stays unreaped through cleanup;
  - cleanup signals only the group/descendants, by identity; foreign holders are refused with the
    handle kept;
  - `validate_quiescent` never signals; predecessor admission in `acquire` is unchanged;
  - Windows refuses `run_borrowed_io` before spawning.
- **No unwrap or panic on I/O in production paths.** The `expect`s cover embedded contract JSON,
  piped std handles and validated chains.

## Evidence

- Read: every changed source and contract file listed in the brief; holder-lock `port.rs`
  `borrowed_check`/`Locked` (Unix `before_close` is a no-op, so `validate` does not unlock the
  holder's description); `src/holder-lock/index.mjs:380-470`.
- `stat -c %a /home/vantt/projects/forgent/.git` → `775`; the session umask is `002` (H1).
- Scratch probe for H2, in the session scratchpad and outside the repo: the remote `pre-receive`
  hook ran on a `file://` push despite the client `core.hooksPath`, with fd 3 open inside it.
- `CARGO_TARGET_DIR=.fgos/runtime/phase-target cargo test --locked -p fgos-git -p fgos-durable-file`:
  result recorded in the assignment report (`report-1.md`).
