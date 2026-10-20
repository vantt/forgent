# Worktree remove verb

## Built

`fgos worktree remove <path> --delivered-to <ref> [--json]`, wiring only over the existing Worktree port `remove`.

- `src/verbs/worktree/remove.mjs` (use case, mirrors `create.mjs`): resolves the target to its realpath, reads the worktree's current tip through the Inspect port (`listWorktrees`, paged), resolves `--delivered-to` (object id, full `refs/...` ref, or a branch name taken as `refs/heads/<name>`) through `resolveRef`, computes the evidence digest, and calls `port.remove` with a fresh `worktree-<uuid>` operation id. Returns `{removed, path, expectedTip, deliveredTo, deliveredToRef, evidenceDigest}`.
- `bin/fgos.mjs` `worktree` case: new `remove` branch built exactly like `create` (`resolveMainCheckoutRoot`, `worktreeStateRoot`, `resolveWriterIdentity`); a missing `--delivered-to` is rejected by `requireField` as a usage error before any port call.
- `src/cli/command-registry.mjs`: `remove` subcommand, usage line, description and examples. `docs/architecture-manifest.json`: new file registered as `use-case`.
- Docs: CHANGELOG `[Unreleased]`, `docs/platform/git/spec.md` (next to the `worktree create` paragraph). No reading-map line named `worktree create`, so none changed.
- Port refusals surface unchanged (message carries the code, for example `worktree-delivery-unproven`, dirty, worker-state-preserved). No force flag.

## Port rule (read from `packages/git/rust/src/worktree.rs` `remove_land_candidate`)

Refuses unless: path is a registered worktree, no live process in it, custody/lock checks pass, checkout clean (worker state preserved), `evidenceDigest` is 64 hex, `expectedTip` equals the worktree's current tip, tip is an ancestor of or equal to `deliveredTo`, and some ref outside `refs/fgos/` contains `deliveredTo`.

## Evidence digest choice

The port only checks the digest's shape (64 hex) and records it in the WAL intent and outcome; it does not interpret it. Chosen: sha256 of `JSON.stringify({path, expectedTip, deliveredTo: {ref, oid}})`, with the realpath, the tip read from the worktree, and the resolved ref (null when an object id was given). It is the exact delivery statement this verb asserts, so the Git operation record is bound to what was claimed and is reproducible from its inputs. It is not independent proof of delivery; the proof is the port's ancestry and reachability checks.

## Tests

- New `test/verbs/worktree-remove.test.mjs`: 5 tests, all pass (removes clean delivered worktree incl. digest value and object-id form; refuses dirty and leaves content; refuses tip not in target, unknown target, unregistered path, missing `--delivered-to`; registry entry; CLI adapter through the Rust host: usage error, then removal with JSON envelope).
- Existing `worktree-create`, `test/architecture.test.mjs`, `test/docs/*.test.mjs`, `command-registry`, `fgos-help`, `fgos-verb-help-json`, `rust-host/command-routes`: green (architecture needed the manifest row, added).
- Full suite (`npm test -- --test-concurrency=4`, host binary from the private cargo dir): 8666 tests, 8564 pass, 6 fail, 31 skipped. The 6 failures are all known and unrelated: `fences-v1-tombstone` (1), `skill-wrappers` projection (1), and four `runtime-socket-dir` cases in `run-supervisor-checks`, which pass when rerun alone (24/24).

## Notes

- Landing guides can now use the verb instead of ad hoc scripts, `git worktree remove` or `rm -rf`; guides were not edited.
- Open question: a tag name is not accepted as shorthand (an annotated tag resolves to a tag object, not a commit); use a branch name, full ref or oid.
