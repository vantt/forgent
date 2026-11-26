# Phase 1: Launcher in a linked worktree

Capability: `code:implement`. Depends on: none. Wave 1.

## Inputs

- This plan's `plan.md` (Outcome, Facts, Risks: the behaviour and refusals to build).
- `packages/distribution/rust/src/launcher.rs` (module header, `launcher_body`, the test module, the golden
  digest check at `:247`).
- `packages/distribution/rust/src/launcher.sh` and `launcher-cmd.txt` (the bodies).
- `docs/platform/packaging-distribution/spec.md` RUL17 (read only).
- Owner answer `q-4xd2a3eqxq`: `fgos questions show q-4xd2a3eqxq` ("Run the owning project's release"; its scope
  forbids changes to host root picking, activation, and the config refusal).

## Files this phase may write

`packages/distribution/rust/src/launcher.rs`, `packages/distribution/rust/src/launcher.sh`,
`packages/distribution/rust/src/launcher-cmd.txt`,
`packages/distribution/rust/tests/goldens/launcher-digests.json`.

Do not edit `CHANGELOG.md` or the distribution spec; their lines go in a post-done land (plan.md).

## Steps

1. In `launcher.sh`, after the walk up finds no activation, take the nearest `.git` met on that same walk. If it
   is a regular file (not a symlink), read its single `gitdir: <path>` line with `read`, and require the path to
   be absolute. Then read `<gitdir>/commondir`, resolve it against `<gitdir>` when it is relative, and require the
   result to end in `/.git` and not to be a symlink. The main checkout is its parent, and it must pass `[ -O ]`.
   Look up `<main>/.fgos/installation/activation.json` and continue through the existing digest and status
   checks and the store lookup, unchanged. Before exec, print one stderr line naming `<main>` as the project used.
2. Each failed condition is refused by name with the existing exit code (126) and runs nothing. Keep the existing
   "no installation found" refusal for a plain directory with no `.git` file.
3. Use builtins only, as the module header requires (no `git`, `dirname`, `sed`, `head`, `tr`). Keep the
   variables under the `_fgos_` prefix, and keep the marker line unchanged.
4. Do the same in `launcher-cmd.txt` as far as `cmd` builtins allow. If an ownership or symlink check has no
   builtin form, refuse rather than skip it. If Windows is left as is, say why in the commit message.
5. Update `launcher-digests.json` with the new bodies' digests, and add one sentence to `launcher.rs`'s module
   header stating the linked-worktree rule.
6. Tests in `launcher.rs`'s test block, with titles that describe the behaviour:
   - from a linked worktree outside the main checkout, the launcher runs the main checkout's store release and
     names the project on stderr;
   - refused: missing `commondir`, a relative `gitdir`, a common dir not named `.git`, no activation in the main
     checkout;
   - the existing cases stay green unchanged.

## Verify

```bash
cargo test -p fgos-distribution launcher
```

Pass: green, new cases included.

## Rollback

Revert the commit. The next `fgos doctor --fix` rewrites installed launchers back.
