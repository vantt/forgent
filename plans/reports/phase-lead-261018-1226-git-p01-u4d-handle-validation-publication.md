# Git phase 01, unit 4d: handle validation and Publication checkpoint

Follow-up 2026-10-18: the cleanup blocker below is resolved and Publication passed five consecutive full gates in [unit 4e](phase-lead-261018-1246-git-p01-u4e-borrow-cleanup-domain.md). This report retains the historical checkpoint.

Stopped under the brief's instruction: **“If anything else in holder-lock is missing, stop and report.”** The requested stale-inode validation fix is implemented. Publication implementation is present for review, but is not accepted or frozen: the required three-crate test gate failed, and a separate real-process probe confirms another holder-lock concurrency hazard. No additional holder-lock fix was attempted.

## Blocker: cleanup kills an unrelated child before exec

An unrelated child of the holder inherits its close-on-exec descriptions until exec. Linux borrow cleanup scans every process holding the lock description, excluding only the holder process; it cannot distinguish that transient unrelated child from a borrowing descendant and kills it. This occurs even when the borrowed command succeeds. A multi-threaded addon process can start other children while Publication runs.

The full gate failed at the mirror-fetch test's config preflight: `git-config-failed`, exit code None, empty stderr. The same test passes alone. An earlier parallel run also failed creating a fresh repository. These failures are consistent with the confirmed hazard; the particular failed child's killer was not traced.

A temporary `packages/git/rust/examples/borrow_concurrency_probe.rs` isolated the hazard without Publication, remote transport or a repo:

1. Acquire an exclusive opaque event-seal on an OS-temp lock file.
2. In another thread, spawn unrelated `/bin/true`; its `pre_exec` creates a readiness marker with libc open/close, then pauses 500 ms with libc usleep before exec. It has no fd mapping or borrow annotation.
3. After the marker appears, call holder-lock `run_borrowed_io` for `/usr/bin/git --version` with a ten-second deadline and 4096-byte capture bounds.
4. Wait for the unrelated child. Observed:

```text
borrowed git: exit=Some(0), signal=None, leftovers_killed=1
unrelated /bin/true: signal: 9 (SIGKILL), signal=Some(9)
```

The pause exposes the real fork-to-exec window; no production flag or bypass is involved. The probe was run through `cargo run --locked -p fgos-git --example borrow_concurrency_probe` using the private target, then removed. Relevant existing paths: holder-lock `driver/flock.rs::end_listed_holders`, Process `platform/linux.rs::holds_lock_on`, and Process `control.rs::unix_spawn_with_fds`. Those files were not edited. Needed upstream capability: borrowed-child cleanup that remains safe when the same process starts unrelated children concurrently, without killing those children or weakening cleanup/admission. Process edits and further holder-lock changes require a new authorized unit.

## Requirement → implementation → evidence

- **First prerequisite:** public non-spawning holder-lock `validate(&Handle)` reuses `same_file` and the Unix borrower check. Every borrow family validates before spawn; Windows controlled entry is covered. Shared or replaced resources refuse; a replaced inode reports `lock-resource-replaced`. The fd remains private. The rename + successor-acquire regression passes for both ordinary and bounded-I/O borrow, and successor exclusion remains intact. Holder-lock spec §5 has only the requested dated sentence.
- **Authority:** `HolderAuthority` takes an exclusive mutable borrow of an acquired opaque event-seal, binds repository/resource/writer/ref, and is not Sync. Before Intent/supersession it also requires a listable holder set containing only this process. Existing acquire/predecessor admission remains authoritative; no registry row was added. Linux only, matching the existing WAL support.
- **Objects/M1/M7:** binary blobs, literal `mktree -z`, canonical commit objects with explicit author/committer dates, ordered parents and exact messages; bounded typed batch object reads; stop-set/visited-set DAG pages carrying ordered parents and tree IDs; shallow crossing refuses. Dates accept `unix-seconds +/-HHMM`, with optional leading `@`.
- **CAS/delete/durability:** pin CAS → read-back and directory sync → prepared WAL → TargetAttempt → single-ref no-dereference target CAS → read-back/ref-directory sync → terminal observation. Exact-old branch-events delete uses next=Absent. Loss includes actual tip even at equal candidate; same-id conflict and compacted replay are handled. Object/ref directory chains and WAL use explicit fsync; receipts claim processCrash only. Post-effect faults retain attempts and attach pending observed receipts where possible.
- **Recovery:** attempted CAS never replays, including after ABA; eligible prepared recovery installs the first attempt; observed effects do not claim winning attribution. Pin reconciliation checks recorded candidate/expected pin and native-lock absence. Supersession delegates rule 4a to the WAL; exact pin release precedes compaction. Unknown native locks and corrupt/incomplete backlog evidence are preserved.
- **Remote/M4/M5:** explicit pinned RemoteGrant, restricted file/HTTPS/SSH transport, no terminal prompting, SSH BatchMode and command-config refusal. Fetch downloads advertised exact OIDs without ref destinations, then installs mirror refs by no-dereference exact-old CAS. Push is unforced and returns accepted/non-FF/other/unknown. Typed remote transfers extend the existing WAL; interrupted recovery observes locally without resending. Inspect facts expose effective mappings/origins, redacted URL, machine ID and floor; mapping provenance remains None until the later RepositoryConfig writer lands.

## Proposed Event Store interface — confirmation pending

`HolderAuthority::new(&repo, &mut acquired_event_seal, &resolved_seal_path, own_ref, writer)` → `PublicationPort::new(&driver, authority)`, optionally `.with_remote(RemoteGrant { name, pinned_url })`. `HolderAuthority::legacy_import` is the separate legacy grant. The port implements the existing Publication trait, plus `recover(repo,id)`, record-only `supersede(repo,old_id,later_id)`, and `release_pin_and_compact(repo,id)`. Compacted replay requires compare_and_swap with the original request. Caller keeps no-Git-under-state/event-append responsibility and retains the handle after dropping the port. Event Store coverage, manifests, retries and segment deletion remain caller-owned.

## Validation and remaining work

- Required three-crate `cargo test --locked -p fgos-git -p fgos-durable-file -p fgos-holder-lock`: **FAILED** at the intermittent mirror test. Git's 24 unit tests and 3 contract tests passed; the Publication integration run had 8 pass, 1 fail, and 1 ignored child entry (explicitly invoked by its SIGKILL parent test). The mirror test passed alone afterward. All four SHA-1/SHA-256 × files/reftable combinations completed the every-filesystem-boundary fault sweep and before/after-target SIGKILL vectors. Existing holder-lock tests separately exercise deadline/overflow child kills and leftover cleanup.
- Required three-crate clippy `--locked --all-targets -- -D warnings`: **passed**. `git diff --check` and Draft 2020-12 WAL schema validation passed. Separate locked holder-lock/durable-file tests passed: 45 tests including doc tests; the detailed output is preserved in the assignment outbox.
- Prior art reused: holder-lock identity checks (`1afc7973f`), bounded borrow (`b83c2d097`), hardened driver (`dc6c91249`), durable-file/WAL/recovery/compaction (`ef7d3f48d`). `impact-analysis: inactive` (zero providers). No npm suite, git add/commit, registry or Work lifecycle mutation.
- Resume after the upstream concurrency hazard is resolved or an owner-approved supported execution restriction is supplied; rerun the full parallel gate before accepting Publication. Event Store lead confirmation, combined-addon integration, RepositoryConfig provenance writing, cross-platform execution, stable-media measurement, kills inside Git's rename syscall window, real filesystem/resource-exhaustion profiles, actual forge and phase performance/release gates remain unclaimed. Coordinator owns board/changelog/setup/release integration outside this unit's scope.
- Convention produced this exact report path using `2026-10-18T12:26:00+07:00`. MDView preview failed because its database is read-only.

Status: BLOCKED
Summary: Implemented the requested opaque-handle validation and drafted the Linux Publication backend, but stopped on a second holder-lock hazard: cleanup can SIGKILL an unrelated child during its pre-exec window.
Concerns/Blockers: Publication is not accepted; the required full test gate failed. Further holder-lock/Process repair is outside this unit's authorization.
Context refs:
- docs/platform/git/spec.md §§4, 5, 10
- docs/platform/holder-lock/spec.md §§5–8
- packages/git/rust/src/publication.rs
- packages/holder-lock/rust/src/driver/flock.rs::end_listed_holders
- packages/process/rust/src/platform/linux.rs::holds_lock_on
