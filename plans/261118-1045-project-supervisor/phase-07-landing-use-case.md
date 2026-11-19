# Phase 7 — Landing use case

`land.rs` in `fgos-supervision` is the one landing use case behind `fgos land` (the verb is wired in phase 16). It
composes the existing Git ports (PS-2): fetch, prepare a Land candidate under the target's rank-20 merge slot, gate,
push the candidate, publish (fast-forward local main). It merges (PS-3), takes its gate and regeneration from project
config (PS-5), checks the branch against the plan footprint (PS-24), and never invents a lock. Rust, one file, one test
file.

**Trust boundary (PS-19, decided).** Gates and regeneration run with `sh -c` in the candidate worktree, unconfined, as
the owner, on branch code. Review is the control: a lead lands only a phase its reviewer passed, and the commands come
from the trusted main checkout's config. The module doc comment says this in plain words; confined gates are a backlog
row (phase 19).

## Inputs
Step 0 first: re-grep every item. A finding that changes a plan decision stops the phase with `NEEDS_CONTEXT`.
- `packages/git/rust/src/land.rs`: `LandRequest` `:14` (`source`, `target`, `destination`, `message`, `squash`, `footprint` `:23-24` = the dirty-main-checkout scope, `subtree`, `files`), `LandFile` `:31`, `LandEvidence` `:84`, `LandCandidate` `:94`, `LandSession` `:104` (`:102-103`: holds the slot while alive), `prepare_land` `:294`, operation-id reuse refusal `:351-366`, dirty check `:262-271`, conflict abort `:540-555`, candidate pin ref `refs/fgos/git-operations/<id>/candidate` `:733-735`, `publish_land` `:673`, `recover_land` `:1145`. Refusals Git already gives: `land-identical-tips`, `land-already-merged`, `main-checkout-dirty-mid-merge`, `land-conflict-aborted`, `operation-id-reused`, `lock-order-violation`, `land-slot-already-held`, `land-verification-mismatch`, `land-recovery-required`.
- Read ports: `packages/git/rust/src/inspect.rs:1178` `merge_tree` (conflicted paths, read-only), `:387` `diff` (changed paths), `:237` `resolve_trunk`. Footprint matching: `fgos-write-scope` (`matches`, `overlaps`, as `land.rs:241,267-269` use them).
- Remote: `packages/git/rust/src/remote.rs:157` `fetch_refs`, `:177` `push_refs` (`RefMapping {source, destination}` `:12`, both `refs/` names, `packages/git/rust/src/lib.rs:78-79`; `RemoteGrant {name, pinned_url}` at `publication.rs:184`; atomic, never forced). Lock table: `docs/platform/git/spec.md` row "Remote fetch/push of non-event refs".
- Scoped commit for `--paths`: `packages/git/rust/src/scoped_commit.rs`: `preflight_commit` `:1289`, `scoped_commit` `:1337`, `CommitRequest {writes, message}` `:18`.
- Recovery verb: `fgos git recover` (`apps/fgos/src/wiring/git_incidents.rs:71`).
- Prior art kept in Node, not ported: `src/runner/merge.mjs:847-855` `declareLandFiles` and `:870` `landRunnerItem`. The hand script `.fgos/runtime/tmp/land-branch.sh` (main checkout) holds this repo's gate list; it moves to `land.gates` (phase 19).
- Config shapes: `land.gates: [{run, when?: [glob]}]`, `land.regenerate: {run, files}` (phase 4). The crate gets values from its caller; it reads no config.
- Fixture helpers for a repo with a bare remote: `packages/git/rust/tests/land.rs`, `refs_remote.rs` and `tests/support`.

## Footprint
`packages/supervision/rust/src/land.rs`, `packages/supervision/rust/tests/land.rs`, `scripts/lib/git-one-door-declarations.v1.json` (the gate runner's `sh -c` site; added 2026-11-18), and for the merge-slot door a `--paths` land holds (lead:OPC review, 2026-11-18): `packages/git/rust/src/land.rs`, `packages/git/rust/tests/land.rs`, `docs/platform/git/spec.md`, `docs/platform/supervision/spec.md`.

## Steps
1. Types: `LandCommand { branch: Option<String>, paths: Option<Vec<String>>, tests: Vec<String>, footprint: Option<Vec<String>>, target: Option<String>, message, squash }` (exactly one of `branch`/`paths`; `footprint` is the caller's plan footprint, given by the host for a lead); `LandConfig { gates: Vec<Gate>, regenerate: Option<Regenerate> }`, `Gate { run, when: Vec<glob> }`; `LandOutcome { main_sha, landed_paths, retries, gates_run }`; `LandRefusal { code, detail }`.
2. Refusals owned here: `land-gate-missing` (empty `gates`, checked first, nothing touched), `land-gate-failed` (names the command, bounded stderr tail), `land-regenerate-failed`, `land-branch-unknown`, `land-paths-empty`, `land-outside-footprint` (names the paths), `land-test-unknown` (a `--test` path absent from the candidate), `land-retries-exhausted`, `land-remote-diverged` (the fetch was refused or left no tracking ref), `land-target-ahead` (local trunk holds commits the remote lacks), `land-paths-push-rejected`. A Git refusal passes through with its own code; `land-recovery-required` adds "run `fgos git recover`" to the detail.
3. Branch flow `land(command, config, ports)`:
   - fetch the target from the remote; resolve source and target OIDs;
   - footprint: when `footprint` is given, list the branch's changed paths (`diff` from the merge base to the source) and refuse `land-outside-footprint` for any path not matched; pass `footprint` as `LandRequest.footprint`, so only dirty main-checkout paths that overlap it refuse;
   - pre-merge read: `merge_tree(target, source)`; a conflicted path outside `regenerate.files` refuses `land-conflict-aborted` before any prepare; for each conflicted declared file, declare the target side's bytes;
   - prepare the Land candidate with those `files` and operation id A (the session holds the rank-20 slot);
   - regenerate: if `regenerate` is set, run it in `candidate.worktree`, read `regenerate.files`; when any differs from the candidate's bytes, drop the session and prepare again with a fresh operation id B, the regenerated bytes as `files`, at the same pinned target OID (one re-prepare at most; a second difference refuses `land-regenerate-failed`);
   - gate: run each `gates` entry whose `when` matches a changed path (absent `when` = always), in the candidate worktree, in order, stop at the first failure; a gate whose `run` holds `{tests}` gets the `tests` paths, shell-quoted, each checked to exist in the candidate;
   - push first: push the candidate pin ref `refs/fgos/git-operations/<id>/candidate` to `refs/heads/<target>` (a non-forced push is a compare-and-swap on the remote); then publish, which fast-forwards local main to the pushed commit, while the session is still alive;
   - the remote moved (push rejected): drop, fetch, repeat from the footprint step with a fresh operation id, at most 3 times, then `land-retries-exhausted`. Local main never holds an unpushed land.
4. `--paths` flow: refuse an empty set; fetch and fast-forward the main checkout's trunk to the fetched remote tip when local main is behind (refuse `land-target-ahead` when it has local commits the remote lacks); preflight; run only the gates whose `when` matches a named path (absent `when` = always) in the main checkout before anything is committed (a failed gate leaves no commit); `scoped_commit` the exact paths with `message`; push. The merge slot is held across commit and push, so a rejected push means the remote moved outside fgos: refuse `land-paths-push-rejected`, name the local commit's OID and the reset that clears it. The grant check on `paths` is the request route's (phase 10), not here. Gating the committed tree instead of the working tree needs a worktree-at-commit port Git does not have; not built (RUL104), recorded in the spec.
5. Shell execution (gates, regenerate) goes through one small `CommandRunner` trait with a real `sh -c` implementation; tests use the real one. Output is bounded; the environment is the caller's.
6. Writer id and operation ids come from the caller (Identity writer, an operation-id source); the use case invents none.
7. Tests in `tests/land.rs`, each with a real bare remote and a clone, one proof per behaviour (the Land port's own refusals stay owned by `packages/git/rust/tests/land.rs`; one pass-through proof here):
   - a clean merge lands, pushes, and local main equals the remote tip;
   - a conflicting census (a declared generated file) lands regenerated;
   - a conflict outside the declared files refuses `land-conflict-aborted` with no candidate prepared;
   - a failing gate refuses and publishes nothing (remote and local tip unchanged);
   - the remote moved once between prepare and push lands on the second try; moved every time ends `land-retries-exhausted` with local main unchanged;
   - a branch path outside `footprint` refuses `land-outside-footprint`; an unrelated dirty main-checkout file does not block a branch land with `footprint` set; one Git refusal (`main-checkout-dirty-mid-merge` on an overlapping dirty file) passes through;
   - empty `gates` refuses `land-gate-missing`; a `{tests}` gate receives the `--test` paths;
   - `--paths` commits exactly the named paths, leaves other dirty files alone, and runs only matching gates; the remote moved before a `--paths` land is fast-forwarded first;
   - a land interrupted after prepare (the session leaked by a test seam, its WAL intent left) is followed by a land that either completes or refuses `land-recovery-required` naming `fgos git recover`;
   - two concurrent lands into one target serialize (second waits or reports `land-slot-already-held`).

## Verify
- `cargo test -p fgos-supervision --test land` passes; `cargo test -p fgos-supervision` passes.
- `cargo clippy -p fgos-supervision -- -D warnings`.
- Compile checks for msvc and `aarch64-apple-darwin` (no Unix-only call outside `cfg`).
- `rg -n "git (merge|push|commit|rebase)" packages/supervision` finds nothing: all Git goes through the ports. The one-door census scan (`node scripts/git-one-door-scan.mjs --root .`) reports no new site; the census file itself is regenerated in phase 19.

## Rollback
Revert the phase commit. The crate keeps its stub `land` module; nothing calls it before phase 16.

## Landed (6f20234bd, lead:OPC MERGE 2026-11-18) and follow-ups

Land tests 21/21 on the phase 7a doors (this also meets 7a's acceptance). Review follow-ups, not blocking, done in
phase 7c after phase 14a lands (both touch the Git crate):
1. The merge-slot params and slot key are built in five places in `packages/git/rust/src/land.rs` (prepare, the
   `acquire_merge_slot` door, recover and two more); the internal sites use one helper the door shares (RUL11).
2. `merge-slot-busy` is classed Refused while `worktree-admin-held` is Busy/retryable; pick one class for "a lock is
   busy, try again" and use it for both.
3. `land-paths-push-rejected` tells a human to run raw `git reset --keep`; when fgos has a SafeRestore verb for this (backlog `p-tpqddlbsk6`),
   point at it instead (no verb exists today: backlog row, not phase 7c).

