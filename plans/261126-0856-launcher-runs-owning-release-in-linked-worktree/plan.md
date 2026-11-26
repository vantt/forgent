---
contract: plan-v1
title: "Plain fgos inside a linked worktree runs the owning project's release"
status: running
lead: head:lead-forgent-261126-0856-launch-b7cbc
priority: P2
blockedBy: []
base: 9820dbb74cbb4084f07d78203e5b9ae95363b82b
footprint:
  - plans/261126-0856-launcher-runs-owning-release-in-linked-worktree/**
  - packages/distribution/rust/src/launcher.rs
  - packages/distribution/rust/src/launcher.sh
  - packages/distribution/rust/src/launcher-cmd.txt
  - packages/distribution/rust/tests/goldens/launcher-digests.json
source:
  - plans/discussions/ds-gszx4utkr4-config-set-dir-never-overwrites/DISCUSSION.md
  - p-mfllw32ynj
  - q-4xd2a3eqxq
created: 2026-11-26
---

# Plain fgos inside a linked worktree runs the owning project's release

## Outcome

Inside a linked worktree made by `fgos worktree create` (its `.fgos` stripped, so it has no
`.fgos/installation`), the installed `fgos` launcher no longer stops with "no .fgos/installation found". The owner
answered `q-4xd2a3eqxq` with "Run the owning project's release" (2026-11-26T02:42Z).

- When the walk up finds no activation and the nearest `.git` is a file, the launcher reads that file's
  `gitdir: <path>` line and that git dir's `commondir` with plain file reads (shell builtins, no `git` call). It
  resolves the main checkout as the parent of the common dir, which must be named `.git`.
- It then runs the release named by the main checkout's `.fgos/installation/activation.json`, under every RUL17
  trust rule that already applies: a store-only release, the digest shape, and `status: ready`. It names the
  project it chose on stderr.
- Anything odd is refused by name with the launcher's existing exit code, and nothing is run. That covers a
  relative or missing `gitdir`, a missing `commondir`, a common dir not named `.git`, a symlink along that path,
  a main checkout not owned by the calling user, and no activation in the main checkout.

With this, no caller needs `fgos config set --dir <worktree>` for everyday work. That `--dir` call was the path
of the 2026-11-17 incident (discussion section 2). The write is already refused by plan
`261126-0853-config-set-refuses-stripped-project-file` (done); this plan removes the push toward it
(`task-launcher-in-linked-worktree`).

### Facts

- The launcher bodies are `packages/distribution/rust/src/launcher.sh` and `launcher-cmd.txt`, included by
  `launcher.rs` (`SH_BODY`, `CMD_LINES`, `launcher_body`). Their bytes are pinned by
  `packages/distribution/rust/tests/goldens/launcher-digests.json` (read at `launcher.rs:247`). Today they walk up
  only for `.fgos/installation/activation.json`, use only shell builtins, and execute nothing from the project
  (module header).
- A worktree from `fgos worktree create` has no `.fgos` (stripped; `packages/git/rust/src/worktree.rs:935`), so
  the walk finds nothing when the worktree sits outside the main checkout.
- The launcher tests live in `launcher.rs`'s own `#[cfg(test)]` block (for example
  `the_cmd_launcher_runs_the_store_release_the_nearest_activation_names_and_refuses_outside_a_project`).
- Installed launchers are rewritten by doctor's `project-fgos-launcher` fix when out of date, which the marker
  line makes possible (the marker never changes).

### Shared files left out of the footprint (parallel running)

`CHANGELOG.md` is also in the footprint of plan `261122-0056-orchestration-skeleton` (the Keeper plan).
`docs/platform/packaging-distribution/spec.md` is in the footprint of the running plan
`261125-1631-agent-context-engine`. The plan-contract check refuses either overlap between two active plans, so
this plan writes neither. When this plan is `done`, the supervisor or lead adds three lines in one small
`fgos land --paths CHANGELOG.md,docs/platform/packaging-distribution/spec.md`. The text is written in phase 2's
report:

1. this plan's `CHANGELOG.md` line;
2. the config refusal line carried for plan `261126-0853-config-set-refuses-stripped-project-file`:
   "Fixed: `fgos config set`, `patch` and `init` no longer create a fresh `.fgos/config.yaml` in a worktree whose
   tracked config was stripped; they refuse with `config-project-file-stripped` and name the main checkout.";
3. a dated RUL17 sentence in the distribution spec on the linked-worktree rule.

## Acceptance criteria

1. `cargo test -p fgos-distribution launcher` passes with new cases in `launcher.rs`'s test block. The setup is
   a main checkout carrying an activation and a store release, and a linked worktree (`git worktree add`, `.fgos`
   absent) outside it. From the worktree the `sh` launcher runs the main checkout's release and names that
   project on stderr. Each odd shape (missing `commondir`, a relative `gitdir`, a common dir not named `.git`, no
   activation in the main checkout) is refused by name and runs nothing.
2. The `cmd` body gets the same behaviour and a case, or phase 1's commit message and phase 2's report say why
   Windows is left as is.
3. `launcher-digests.json` holds the new bodies' digests, and the module header states the linked-worktree rule.
4. Phase 2's report holds the exact text of the three post-done lines (see "Shared files left out").
5. `npm test` and `cargo test --workspace` are green, or each failure is shown to come from outside this plan's
   files.

## Non-goals

- Any change to how the host picks the project root after launch, to release activation, or to the config write
  refusal (the answer's scope forbids these).
- Any change to how `fgos worktree create` strips `.fgos`.
- Running anything from inside the worktree's or the main checkout's own files (RUL17: only the machine store's
  verified release runs).
- Editing `CHANGELOG.md` or the distribution spec inside this plan (post-done land, above).

## Authority map

| New thing | Model row | Note |
|---|---|---|
| The launcher resolves a linked worktree's main checkout and runs that project's activated release | `packaging-distribution` (component) | `fgos authority locate "the installed launcher shim finds the activated release by walking up for the installation directory"` returns `packaging-distribution`. The existing launcher is extended in place; no new door. |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Launcher in a linked worktree](phase-01-launcher-in-linked-worktree.md) | - | packages/distribution/rust/src/launcher.rs, packages/distribution/rust/src/launcher.sh, packages/distribution/rust/src/launcher-cmd.txt, packages/distribution/rust/tests/goldens/launcher-digests.json | 1 | running |
| 2 | [Integration](phase-02-integration.md) | 1 | plans/261126-0856-launcher-runs-owning-release-in-linked-worktree/reports/integration.md | 2 | ready |

Phase 1 run: ticket `c-1594-1795683208377` (gemini, worktree `forgent-worktrees/261126-0856-launcher-runs-owning-release-in-linked-worktree-p01`) was still running after 12 waits; resume with `fgos request result c-1594-1795683208377`.

Contract check: one implementation phase, and the integration phase in a later wave. No hot file is in the
footprint. Capability: phase 1 `code:implement`, phase 2 `code:test`.

## Owner questions

None open. `q-4xd2a3eqxq` was answered "Run the owning project's release".

## Risks and rollback

- **Wider trust boundary (the cost the answer accepted).** A `.git` file and `commondir` are local metadata that
  Git writes (a clone cannot ship one). The launcher still refuses a relative `gitdir`, a common dir not named
  `.git`, a symlink on the path, and a main checkout the calling user does not own (`[ -O ]` in `sh`; on `cmd`,
  as far as builtins allow, said in the report). After resolution, RUL17's store-only rule applies unchanged, so
  the worst case runs a release from this machine's verified store, never a project file.
- **Installed launchers update lazily.** Each machine picks up the new body at its next `fgos doctor --fix` (the
  `project-fgos-launcher` fix rewrites a stale launcher). This is expected, not a defect.
- **Rollback:** revert phase 1's commit; the next `fgos doctor --fix` rewrites installed launchers back to
  today's refusal.
