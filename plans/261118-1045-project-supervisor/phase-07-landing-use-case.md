# Phase 7 — Landing use case

`land.rs` in `fgos-supervision` is the one landing use case behind `fgos land` (the verb is wired in phase 16). It composes the existing Git ports (PS-2): fetch, prepare a Land candidate under the target's rank-20 merge slot, gate, publish, push. It merges (PS-3), takes its gate and regeneration from project config (PS-5), and never invents a lock. Rust, one file, one test file.

## Inputs
Step 0 first: re-grep every item. A finding that changes a plan decision stops the phase with `NEEDS_CONTEXT`.
- `packages/git/rust/src/land.rs`: `LandRequest` `:14` (`source`, `target`, `destination`, `message`, `squash`, `footprint`, `subtree`, `files`), `LandFile` `:31`, `LandEvidence` `:84`, `LandCandidate` `:94` (`worktree`, `candidate`, `tree_digest`), `LandSession` `:104` (the comment at `:102-103` says it holds the slot while alive), `prepare_land` `:294`, `publish_land` `:673`. Refusals Git already gives: `land-identical-tips`, `land-already-merged`, `main-checkout-dirty-mid-merge`, `lock-order-violation`, `land-slot-already-held`, `land-verification-mismatch`.
- Remote: `packages/git/rust/src/remote.rs:157` `fetch_refs`, `:177` `push_refs` (`RemoteGrant {name, pinned_url}` at `publication.rs:184`; explicit ref mappings, atomic, never forced). Lock table: `docs/platform/git/spec.md` row "Remote fetch/push of non-event refs" (no lock; allowed under 20).
- Scoped commit for `--paths`: `packages/git/rust/src/scoped_commit.rs`: `preflight_commit` `:1289`, `scoped_commit` `:1337`, `CommitRequest {writes, message}` `:18`.
- Prior art kept in Node, not ported: `src/runner/merge.mjs:847` `declareLandFiles` and `:870` `landRunnerItem` (pins target, declares files, then Land). The hand script `.fgos/runtime/tmp/land-branch.sh` (main checkout) holds this repo's gate list; it moves to `land.gates` project config (phase 19 deletes the script).
- Config shapes: `land.gates`, `land.regenerate` (phase 4). The crate gets values from its caller; it reads no config.
- Fixture helpers for a repo with a bare remote: `packages/git/rust/tests/land.rs`, `refs_remote.rs` and `tests/support`.

## Footprint
`packages/supervision/rust/src/land.rs`, `packages/supervision/rust/tests/land.rs`.

## Steps
1. Types: `LandCommand { branch, paths: Option<Vec<String>>, target: Option<String>, message, squash }`; `LandConfig { gates: Vec<Gate>, regenerate: Option<Regenerate> }` with `Gate { run, when: Option<glob> }` (`when` = the gate runs only if the branch changes a path matching the glob); `LandOutcome { main_sha, landed_paths, retries, gates_run }`; `LandRefusal { code, detail }`.
2. Refusals owned here: `land-gate-missing` (empty `gates`, checked first, nothing touched), `land-gate-failed` (names the command, bounded stderr tail), `land-regenerate-failed`, `land-branch-unknown`, `land-paths-empty`, `land-retries-exhausted`, `land-remote-diverged`. A Git refusal passes through with its own code.
3. Branch flow `land(command, config, ports)`:
   - fetch the target from the remote; resolve source and target OIDs;
   - prepare the Land candidate (the session holds the rank-20 slot until it is dropped);
   - regenerate: if `regenerate` is set, run it in `candidate.worktree`, read the declared files it lists, and pass them as `LandRequest.files` bound to the pinned target. Step 0 reads `prepare_land` and decides whether files must be given at the first prepare; if so, prepare once without files, regenerate in the candidate, drop the session, and prepare again with the files at the same target OID (the census is thus produced from the merged tree);
   - gate: run each `gates` entry whose `when` matches, in the candidate worktree, in order, stop at the first failure;
   - evidence: digest of the gate run, `LandEvidence`; publish; push the target with an explicit mapping while the session is still alive;
   - the remote moved (push rejected or publish `stale`): drop, fetch, repeat from prepare, at most 3 times, then `land-retries-exhausted`.
4. `--paths` flow: refuse an empty set; preflight; run the gates on the working tree before anything is committed (a failed gate leaves no commit); `scoped_commit` the exact paths with `message`; push. A rejected push after a local commit: fetch; fast-forward push if possible; otherwise refuse `land-remote-diverged`, keep the local commit and name its OID in the detail.
5. Shell execution (gates, regenerate) goes through one small `CommandRunner` trait with a real `sh -c` implementation; tests use the real one. Output is bounded; the environment is the caller's.
6. Writer id and operation id come from the caller (Identity writer, a fresh operation id); the use case invents none.
7. Tests in `tests/land.rs`, each with a real bare remote and a clone, one proof per behaviour: clean merge lands and pushes, returns the main SHA; conflict in a declared generated file is regenerated and lands; a failing gate refuses and publishes nothing (remote tip unchanged); remote moved once between prepare and push lands on the second try, moved every time ends `land-retries-exhausted`; an unrelated dirty edit in the main checkout does not block a branch land, an overlapping one refuses `main-checkout-dirty-mid-merge`; empty `gates` refuses `land-gate-missing`; `--paths` commits exactly the named paths and leaves other dirty files alone; two concurrent lands into one target serialize (second waits or reports `land-slot-already-held`).

## Verify
- `cargo test -p fgos-supervision --test land` passes; `cargo test -p fgos-supervision` passes.
- `cargo clippy -p fgos-supervision -- -D warnings`.
- Compile checks for msvc and `aarch64-apple-darwin` (no Unix-only call outside `cfg`).
- `rg -n "git (merge|push|commit|rebase)" packages/supervision` finds nothing: all Git goes through the ports. The one-door census scan (`node scripts/git-one-door-scan.mjs`) reports no new site; the census file itself is regenerated in phase 19.

## Rollback
Revert the phase commit. The crate keeps its stub `land` module; nothing calls it before phase 16.
