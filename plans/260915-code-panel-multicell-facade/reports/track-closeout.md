# code-panel-multicell-facade — track closeout

Date: 2026-09-16

## Outcome

The track is published to `main`.

Tested state:

- tested SHA: `069e93cffd6da26f9ce1702c9fec220216b5dddd`
- tested tree: `094be49654b757d62dee26ffad0c94acd047dbb3`
- main merged SHA: `4386a835e684d32837eff412c8e44457acc12dc6`
- main merged tree: `c254e988199978b354b03386bf9e93a979c32297`
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
- Track full suite: 6593 tests, 6584 pass, 0 fail, 9 skipped, duration
  `395982.212118ms`.
- Main publication full suite on merge commit `4386a835`: 6593 tests, 6584
  pass, 0 fail, 9 skipped, duration `390376.330836ms`.

## What changed operationally

- `fgos-code-panel` now has a planned multi-cell resume contract that a fresh
  session can follow from disk evidence instead of chat history.
- Planned-mode test policy is documented and fixture-backed: focused/affected
  proof is enough for narrow skill/projection edits; full proof is reserved for
  trigger paths and final integration.
- Main hotfixes for dispatch bottlenecks are included in the tested track tree,
  so read-only Claude leakage and recovery claim cleanup are present before
  publication.

## Publication note

The main checkout had user-owned dirty/untracked files before publication, so
they were stashed under `pre-code-panel-facade-publication-20260916`, the track
branch was merged to `main`, and non-overlapping dirty files were restored after
the main proof. The older untracked `plans/260915-code-panel-multicell-facade/`
copy from the stash was not restored because it would overwrite the published
plan; it remains recoverable from that stash if needed.
