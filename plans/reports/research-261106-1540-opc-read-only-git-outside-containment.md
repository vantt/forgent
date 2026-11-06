# Read-only Git outside containment: which reads can reach repository code

Date: 2026-11-06. Lane OPC, for HARDEN and the owner (owner choice (b)). Read from code on `origin/main` at
`6e9b7bf26`. No test was run: the owner holds heavy runs on fg-server2 until the session count is decided.

## Answer

Most reads the Git crate runs cannot reach code the repository configures, so they can run outside the
containment domain. The exception is a worktree read: `status` and a worktree `diff`. It may run a clean
filter, and in a superproject it also runs the submodule's own filter. That submodule config is never
checked. Those reads stay contained whenever the repository has a filter or a submodule. The predicate
for that already exists. Containment on fg-server2 is a process-lifetime guarantee, not a sandbox, so
moving the other reads out loses nothing they need.

## What containment gives a read today

- **Process lifetime only.**
  - The Linux driver runs bwrap with `--unshare-user --unshare-pid --dev-bind / / --proc /proc` and
    `--die-with-parent` (`packages/process/rust/src/containment/linux.rs:66-72`).
  - The whole filesystem is bound read-write and the network is shared.
  - What the domain proves is that no process a call started outlives it:
    - `kill_all` runs on the deadline and on the output limit;
    - `is_empty` must hold before the call returns, else `containment-unproven` (`driver.rs:1371-1406`).
- **It never stopped repository code from running or writing files.**
  - That defense is the config door:
    - `check_config` refuses repository-scoped command keys (`driver.rs:890`, list at `driver.rs:1991`);
    - every invocation forces `core.fsmonitor=false`, `core.hooksPath`, `protocol.allow=never`, `--no-lazy-fetch`, and `--no-ext-diff --no-textconv` on `diff` (`driver.rs:1125-1199`).
- **Borrowed runs are already outside the domain.**
  - These are the Publication, and the Remote or HookContext runs with a loan.
  - Holder-lock spawns them, and they report survivors through the environment marker (`driver.rs:1262-1300`).
  - So the remaining question is the inspect and local reads only.

## Classification of the reads

Counts are subcommand literals in `packages/git/rust/src/*.rs`. A row is "repo code: no" when the
subcommand, with the flags the crate passes, cannot run a configured program.

| Read | Literals | Repo code | Why |
|---|---|---|---|
| `rev-parse`, `symbolic-ref`, `show-ref`, `for-each-ref`, `merge-base`, `rev-list`, `log`, `show`, `ls-tree` | 34, 15, 2, 1, 2, 6, 1, 1, 4 | no | Object and ref reads. `log.showSignature=false` keeps `gpg.program` out, and `--no-replace-objects` is set. |
| `cat-file` (incl. `--batch`, `--batch-check`) | 27 | no | No `--textconv` or `--filters` is passed anywhere. |
| `config` (listing) | 23 | no | Reads files and runs nothing. It is how the door learns the config, so it is the one read the watch already exempts (`driver.rs:1314`). |
| `ls-files --cached/--stage/-v/--unmerged` | most of 18 | no | Index only. |
| `ls-files --others` (`worktree.rs:336`), `check-ignore`, `check-attr` | 1, 1, 1 | no | Reads ignore and attribute files. No filter, no external program. |
| `hash-object -w --stdin` | 10 | no | With no `--path`, no attributes apply, so no filter runs. |
| `diff` tree to tree, `diff --cached` | most of the `diff` call sites | no | No worktree content is read. Ext-diff and textconv are off. |
| `status`, worktree `diff` (index to worktree) | 6 `status`, the worktree `diff` sites in `inspect.rs` and `land.rs` | **yes** | A stat-dirty or racy file is hashed through `convert_to_git`, which runs a configured `filter.<d>.clean` or `.process`. In a superproject, `status` and a worktree diff spawn a child Git in each submodule. That child reads the submodule's own config under `<common>/modules/<name>/config`, which `check_config` never lists, and so it runs that submodule's filter. This is the 2026-10-22 council finding, and the test `submodule_filter_escapee_reported_as_containment_unproven_on_best_effort_containment` (`driver.rs:4245`) owns it. `--ignore-submodules=dirty` (`inspect.rs:311`, `scoped_commit.rs:1255`) does not stop the child from running; it only drops its dirt from the answer. |
| `update-index --refresh` style calls | none found | would be **yes** | `land.rs:499` is `--no-skip-worktree --stdin`, which refreshes nothing. |
| `write-tree`, `read-tree` | 8, 4 | no | Writes to the index or object store, not reads. They are listed only because they run under the same uncontained question. |

The operator's own filter, for example `filter.lfs.*` in global config, is trusted since `90e92654a`. It
still starts a child (`git-lfs filter-process`) on a worktree read, so for lifetime purposes it counts as
"repo code: yes" too.

## The rule this gives

A read runs outside the containment domain unless both of these hold:

1. It reads the worktree: `status`, or a `diff` without `--cached` that names no two trees.
2. The repository has a filter in its effective config, or has a submodule.

Both halves already exist:

- `user_code_may_run` checks for `filter.*.clean|smudge|process` (`driver.rs:1053-1093`), but today
  only for HookContext, Publication and LocalMutation.
- `has_submodules` (`driver.rs:1098`) is already OR-ed in for the BestEffort watch (`driver.rs:1316`).

The cut is one predicate at the containment decision, reused, not a new mechanism (RUL104):

- extend `user_code_may_run` to Inspect for worktree reads;
- skip the domain when it is false.

An uncontained read still needs its deadline and output limit, and today only the contained branch
enforces them (`driver.rs:1360-1421`). The light path should go through the existing `pgroup` driver of
`fgos_process` (`containment/pgroup.rs`), not a hand-rolled spawn. A process group gives `kill` on the
deadline and an emptiness check that is good enough for a child that runs no foreign code.

## Gain

- **The measured number** is HARDEN's from the approve run: about 151 of the 228 Git children per approve
  run in bwrap, about 2 s. The 2026-10-22 council measured bwrap at +2.3 ms per child and the 2 ms poll at
  +1.4 ms. By the table above, nearly all 151 are object, ref and index reads. On a repository with no
  filter and no submodule (this repo), none of them would stay contained.
- **Not re-measured today** because of the owner's hold on heavy runs. Acceptance for the change:
  - rerun the contained-child census and the approve-run wall time, before and after, on fg-server2;
  - report the children that stay contained, which should be 0 here, and the wall-time delta.

## Side findings (not part of the cut)

- **Submodule config is never checked.**
  - `repository_scoped_keys` lists the main and linked worktree config only (`driver.rs:857-885`).
  - A submodule's `filter`, `diff.*.textconv` or `include.path` is therefore never refused; it is only
    contained.
  - Keeping submodule worktree reads contained is what holds that line. If containment is ever dropped
    for them, the door must first list `<common>/modules/*/config`.
- **Two config gaps that do not affect reads.**
  - `command_config` does not name `gpg.<format>.program` (`gpg.ssh.program`, `gpg.x509.program`) or
    `core.alternateRefsCommand`.
  - No read the crate runs reaches either one: signatures are off, and alternate refs are a serve-side key.
  - Worth adding to the list in the same change that touches it, so the list matches what Git can run.
- **`--ignore-submodules=dirty` versus `=all`.**
  - Where a caller does not need submodule dirt, `--ignore-submodules=all` stops the child Git
    altogether. The worktree read could then leave containment even in a superproject.
  - This is a caller decision for Land and ScopedCommit, which own those answers. It is not decided here.

## Unresolved questions

- Should the light path count children for the census as "uncontained", or should the census drop them?
  This is HARDEN's census format.
- Who lands the cut: OPC, which owns `packages/process` and reviews the Git crate, or HARDEN, which owns
  the containment plan? OPC proposes OPC writes it and HARDEN reviews `driver.rs`, after the owner lifts the
  hold on heavy runs.
