# code-panel-multicell-facade — track closeout

Date: 2026-09-16

## Outcome

The track is proven on branch `code-panel-multicell-facade` and ready for safe
publication to `main`.

Tested state:

- tested SHA: `069e93cffd6da26f9ce1702c9fec220216b5dddd`
- tested tree: `094be49654b757d62dee26ffad0c94acd047dbb3`
- environment: Node `v24.18.0`, npm `11.16.0`, Linux x86_64
- `package-lock.json` sha256: `b097ecd850ca73e265a2dcbf94c63aa48c118069db53d42b00996fecd83fe2fc`

## Final proof

```sh
cargo build --release --workspace
node --test test/rust-host/*.test.mjs
node --test test/cli/fgos-intake-4.test.mjs
env -u CLAUDE_CODE_ENTRYPOINT -u CLAUDECODE -u CLAUDE_CODE_SSE_PORT npm test
```

Results:

- Rust build: success.
- Rust-host suite: 102/102 pass.
- Intake baseline check: 15/15 pass.
- Full suite: 6593 tests, 6584 pass, 0 fail, 9 skipped, duration
  `395982.212118ms`.

## What changed operationally

- `fgos-code-panel` now has a planned multi-cell resume contract that a fresh
  session can follow from disk evidence instead of chat history.
- Planned-mode test policy is documented and fixture-backed: focused/affected
  proof is enough for narrow skill/projection edits; full proof is reserved for
  trigger paths and final integration.
- Main hotfixes for dispatch bottlenecks are included in the tested track tree,
  so read-only Claude leakage and recovery claim cleanup are present before
  publication.

## Remaining publication step

The direct run intentionally did not merge to `main` because the main checkout
had user-owned dirty/untracked files. To publish:

1. preserve or clear those main-checkout changes;
2. merge branch `code-panel-multicell-facade` to `main`;
3. compare `git rev-parse main^{tree}` with
   `094be49654b757d62dee26ffad0c94acd047dbb3`;
4. if identical and the environment fingerprint is unchanged, reuse this proof;
5. if not identical, sync latest `main` back into the track branch and rerun the
   final full proof there.
