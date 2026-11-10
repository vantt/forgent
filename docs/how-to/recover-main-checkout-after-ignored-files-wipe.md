---
type: how-to
title: How to recover the main checkout after its ignored paths were deleted
tags: [recovery, fgctl, activation, agentkit, worktree, ignored-files]
---

# Recover the main checkout after its ignored paths were deleted

Use this when a cleanup ran in the main checkout and removed every git-ignored
path: `.fgos/installation`, `.fgos/runtime`, run history, `.claude/hooks`,
`.claude/rules`, `.grok`, `target/`, `.claude/worktrees/`. Tracked files are
untouched (`git status` shows them clean). Run the steps in order from the main
checkout. Do not clean anything again to "start fresh".

Prevention: never hand-roll deletion of ignored files (AGENTS.md, "Destructive
cleanup"); remove a worktree with `fgos worktree remove`.

## 1. Re-activate the release

Pick a release staged on this machine that carries the native addon:

```sh
fgctl status                                   # staged digests, active/previous
find ~/.local/state/fgos/releases/sha256:<hex>* -name '*.node'   # must print one file
fgctl init --from ~/.local/state/fgos/releases/sha256:<hex>
```

`fgctl init --from` must resolve to the digest in the committed
`.fgos/distribution.json`, otherwise it refuses with `pin-mismatch`. `fgctl
upgrade` is no use: it needs an existing activation. When the committed pin names
a release this machine lacks or that has no addon, override the pin for this
activation only:

```sh
fgctl init --from ~/.local/state/fgos/releases/sha256:<hex> --override-pin "main checkout recovery after ignored-files wipe"
```

The release must already be staged (it is when `fgctl status` lists it; otherwise
`fgctl stage --from <path>` first). Every check of a plain init still runs. The
command prints `pin overridden: ...`, records the reason as `pinOverrideReason` in
`.fgos/installation/activation.json`, and leaves `.fgos/distribution.json`
untouched, so there is nothing to restore. An `fgctl` older than the flag answers
`Unknown option: --override-pin`; build one from this checkout
(`cargo build --release -p fgctl`, then run `fgctl` from that target's `release/`
directory). `fgctl` now updates with the release: once the workspace is active
again, `fgctl upgrade --from <the same release>` replaces an older machine `fgctl`
with the one that release ships and keeps the old binary as `<path>.prev`; it
prints `fgctl: up to date ...` when nothing needed replacing. Releases built before
this change ship no `fgctl`, and the upgrade says so. Never edit or commit the pin to get
past this: it is shared by every machine, and changing it is a separate,
owner-approved change.

## 2. fgos setup

```sh
.fgos/installation/bin/fgos setup
git diff --stat -- .fgos/coexistence.json      # setup can drop the codex entry
git checkout -- .fgos/coexistence.json         # restore it from HEAD if it changed
```

## 3. Cargo build

```sh
git worktree prune                             # drop registrations of vanished worktrees
export CARGO_TARGET_DIR=<dir on ext4 under forgent-worktrees>   # never the tmpfs /tmp
cargo build --workspace
```

Stale registrations make `fgos worktree create` refuse with
`worktree-registration-uncertain`; the prune above fixes it.

## 4. AgentKit v3, per runtime

`fgos setup` does not rebuild `.claude/hooks`, `.claude/rules` or `.grok`.

```sh
export AK_NO_AUTO_UPDATE=1                     # a kit install may otherwise bump the ak binary
ak kit install engineer --target claude-code --yes
git checkout -- .claude/settings.json .claude/agents   # ak rewrites both; keep ours
ak projects add "$PWD"
```

- Never `ak init`: it claims about 1 900 tracked `.claude/` files that a later
  `ak uninstall` could delete.
- Never `--force` on claude-code.
- Other runtimes repeat the install with their own `--target <runtime>`.
- If `AGENTS.md` carried an uncommitted AgentKit block, check `git diff AGENTS.md`
  and re-apply it.
- `ak doctor` may still say "no kits installed" and warn about
  `${CLAUDE_PLUGIN_ROOT}` hooks: it only inspects global installs and the plain
  hook form; the guarded hooks in `.claude/settings.json` work.

## 5. Recreate runtime scratch

```sh
mkdir -p .fgos/runtime/tmp
```

## 6. Verify

```sh
fgctl verify                                   # "verified active release sha256:..."
fgos doctor
ak versions --local-only                       # receipts under .agentkit/adapters/<runtime>/engineer/
```

## What cannot be recovered

Run history (assignments and provenance under `.fgos/`), other ignored runtime
state, worker state of removed worktrees, and any uncommitted work in deleted
linked worktrees. Tracked files come back with `git checkout`; the Event Store
refs live in the git common directory, not in ignored paths, so check
`fgos doctor` before assuming loss. Record the loss on the program board.
