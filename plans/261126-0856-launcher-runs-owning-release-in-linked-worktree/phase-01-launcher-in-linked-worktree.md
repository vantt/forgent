# Phase 1: Launcher in a linked worktree

Capability: `code:implement`. Depends on: none. Wave 1. Status draft until `q-4xd2a3eqxq` is answered.

## Inputs

- `plan.md` of this plan (Outcome: the branch the answer picked).
- `packages/distribution/rust/src/launcher.rs` (module header, `launcher_body`, the test module).
- `docs/platform/packaging-distribution/spec.md` RUL17.
- `plans/discussions/ds-gszx4utkr4-config-set-dir-never-overwrites/DISCUSSION.md`, Q1.

## Files this phase may write

`packages/distribution/rust/src/launcher.rs`, `docs/platform/packaging-distribution/spec.md`, `CHANGELOG.md`.

## Steps

1. Read the answer: `fgos questions` (or the question store record for `q-4xd2a3eqxq`).
2. In the `sh` body, after the walk up finds no activation: find the nearest `.git` on the same walk. If it is a
   file, read its single `gitdir: <abs path>` line with builtins only (`read`), then read `<gitdir>/commondir`.
   Resolve it against `<gitdir>` when it is relative and require the result to end in `/.git`. The main checkout
   is its parent.
   - Recommended answer: look up `<main>/.fgos/installation/activation.json` and continue through the existing
     digest and status checks and the store lookup.
   - Other answer: refuse with exit 126 and a message naming `<main>` and the door.
   Every odd shape is refused by name with the existing exit code.
3. Do the same in the `cmd` body, or record in the commit message why it is left (the Windows release does not
   use `fgos worktree create`, if that turns out to be so).
4. Keep the marker line unchanged (the module header requires it). Doctor's `project-fgos-launcher` fix rewrites
   an out-of-date launcher, so installed launchers pick the change up through `fgos doctor --fix`.
5. Tests in the module's test block: a linked worktree case for the chosen branch, and the odd-shape refusals.
   Titles describe the behaviour.
6. RUL17 in the distribution spec: one dated sentence on the linked-worktree rule. `CHANGELOG.md`
   `[Unreleased]`: one line.

## Verify

```bash
cargo test -p fgos-distribution launcher
```

Pass: green, new cases included.

## Rollback

Revert the commit. The next `fgos doctor --fix` rewrites installed launchers back.
