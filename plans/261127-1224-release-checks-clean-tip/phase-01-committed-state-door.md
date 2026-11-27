# Phase 1: One Git door for a checkout's committed .fgos bytes

Capability: `code:implement`, then `code:review`. Starts at once.

## Inputs

- `plans/261127-1224-release-checks-clean-tip/plan.md`, "Decisions settled inside the frame", point 1.
- `packages/git/rust/src/land.rs`: the Land candidate block after `create_detached_worktree` (search
  `materialize those immutable target bytes`): `ls-files -z -- .fgos`, then `update-index --no-skip-worktree -z
  --stdin`, then `--literal-pathspecs restore --source <target> --staged --worktree --pathspec-from-file=-
  --pathspec-file-nul`, all through `land_call` / `land_text` with `session.slot` held.
- `packages/git/rust/src/worktree.rs`: `create_worktree_locked` (strips `.fgos`, marks its tracked entries
  skip-worktree), `worktree_call`, `worktree_scope`, and the removal check (`worktree-worker-state-preserved`, which
  inspects only skip-worktree `S` entries).
- Owning proofs: `packages/git/rust/tests/land.rs` (candidate tests), `packages/git/rust/tests/worktree.rs`.

## Files this phase may write

`packages/git/rust/src/land.rs`, `packages/git/rust/src/worktree.rs`, `packages/git/rust/tests/land.rs`,
`packages/git/rust/tests/worktree.rs`.

## Steps

1. Run `fgos dispatch decide --for impact-analysis --json`; with GitNexus present, run `impact` upstream on the
   Land candidate's enclosing function and report the blast radius in the review note.
2. In `worktree.rs`, add one public `GitDriver` method that, for a registered linked checkout (never the main
   checkout: refuse by name, as `discard_ignored` does with `worktree-identity-refused`) and a commit, lists the
   checkout's tracked `.fgos` paths, clears their skip-worktree bit and restores them, index and worktree, from that
   commit. Same git argv as the Land block. It takes the caller's held handles the way the other worktree methods do,
   so Land passes its held slot and a caller with no hold passes none. No tracked `.fgos` path is a no-op.
3. In `land.rs`, replace the inline block with a call to that method. Keep the refusal names Land reports
   (`land-state-paths-unreadable`) or map the method's error to them, so Land's observable refusals do not change.
4. Proof: find the Land test that owns the candidate's `.fgos` materialization. If one asserts the candidate holds
   the target's tracked `.fgos` bytes, it now owns the method too: leave it. If none does, extend the closest
   candidate test in `tests/land.rs` with that assertion rather than adding a new test (design principle 8), and
   say so in the commit. Add a case to `tests/worktree.rs` only for what Land cannot observe: the method refuses the
   main checkout, and a removal (`remove_worktree` with ignored discard) still succeeds after the method ran on an
   untouched checkout.
5. Commit message describes behaviour (no plan or phase ids).

## Verify

Hand both commands to lead:SUPERVISOR as one job (confined cargo cannot run, p-ymhj4xcf6x), with the worktree path:

```bash
cargo test -p fgos-git --test land
cargo test -p fgos-git --test worktree
```

Then, in the unit: `rg -n 'no-skip-worktree' packages/git/rust/src/land.rs` prints nothing.

Pass: both suites green; the `rg` finds nothing; the Land block exists once, in `worktree.rs`.

## Rollback

Revert this phase's commit: Land gets its inline block back; nothing else calls the method until phase 2.
