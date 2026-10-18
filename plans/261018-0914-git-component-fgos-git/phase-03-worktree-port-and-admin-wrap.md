# Phase 03: Worktree port, worktree-admin wrap set, public verb

- **Depends on:** phase 02 (Rust LockScope, Inspect, module layout).
- **Branch / worktree:** `git/p03-worktree`, `.claude/worktrees/git-p03`.
- **Model / effort:** sonnet (advanced), rigor high; 20h.
- **Parallel with:** phase 05 (disjoint module files; the one-line `mod`/re-export edits in `lib.rs` and `src/git/index.mjs` are resolved by whichever merges second).

## Context

- Spec §3 Worktree; §5 rank 40 row and Q6 wrap set (holder-lock §16 amended: add, remove, relocate, prune under one hold); §11 cleanup, four residue shapes, no rm-rf; §16 overrides G-032, G-033, G-042, G-046, G-191, G-194, G-195; §18 item 7 (public verb).
- Scout: removal, move and prune run without 40 today (`src/runner/worktree.mjs:512`, `:521`, `:575`, `:603`, `:1426-1436`; `session.mjs:335-554`; `integrate.mjs:125-160`; `merge.mjs:1684-1687`). Those callers move in phase 07, not here.
- Skill text: `core/skills/fgos-run/SKILL.md:25` tells agents to run `git worktree add`.

## Requirements

1. **create / createDetached:** under 40 in the Rust scope; detached `mkdtemp` path or named branch; refuse a path nested in another worktree (realpath), invalid session id characters, or a branch checked out elsewhere; strip worker `.fgos` (G-029) and return. Git takes no provisioning callback (G-032); Execution provisions after return, outside every Git lock (G-030, G-031). Rollback only of its own effects (G-033): before registration remove only its own `mkdtemp` dir; after registration, a failed strip unregisters through guarded remove and rethrows the original cause.
2. **remove:** one hold of 40 covers identity (not main, not root, not a live cwd), custody (caller's verified `dispatch-cwd` lease on that worktree when one exists; another holder's lease means refuse), staged/unstaged/untracked status, pending WAL operations, consumer-supplied delivery proof and current tip. Dirty or uncertain trees are preserved and reported. Remove is `git worktree remove` without `--force`, then prune of that entry; never rm-rf.
3. **relocate:** under 40; WAL records source and destination; recovery repairs at the recorded destination only.
4. **inspectOrphans / repairRegistration / prune:** registration, backlinks and ownership inspected; a missing directory alone never justifies prune; unlock `locked initializing` only with operation-owned WAL evidence, never `move -f -f`. Prune never takes 30.
5. **Residue recovery** for the four shapes of §11 (interrupted create, move killed after rename, removal with admin entry pending, partly pruned admin entry).
6. **Doctor `git-worktree-recovery`:** orphan registrations, dirty or stale checkouts, custody records left `producing` (phase 04 writes them), pending worktree operations. Read-only.
7. **Public verb `fgos worktree create <path> [--branch <name> | --detach] [--base <ref>] [--json]`** through the Worktree port: rank 40 held, worker `.fgos` stripped, prints the path and branch. Registered where existing verbs are registered: the route table `packages/host-runtime/contracts/command-routes.json` and the `bin/fgos.mjs` dispatch point (a board shared file); confirm both at phase start.
8. **Skill text:** `core/skills/fgos-run/SKILL.md` points to `fgos worktree create`; regenerate render surfaces with `npm run build:skills`. Release timing follows open question Q2 (default: ships dark until the phase 07 release).
9. **Holder-lock spec §16:** mark the amended wrap set implemented by the Worktree port; callers move in phase 07.

## Files

| Action | File |
|---|---|
| create | `packages/git/rust/src/worktree.rs`, `packages/git/node-addon/src/git/worktree.rs`, `src/git/worktree.mjs` (and their `mod`/re-export lines) |
| create | `src/verbs/worktree/create.mjs` (location confirmed at phase start), `test/git/worktree.test.mjs`, `test/git/worktree-recovery.test.mjs`, `test/verbs/worktree-create.test.mjs` |
| edit | verb route registration and `bin/fgos.mjs` dispatch line; `src/setup/git-checks.mjs` and `src/setup/registrations.mjs` (one check); `core/skills/fgos-run/SKILL.md` + generated surfaces; `docs/platform/holder-lock/spec.md` §16; `docs/architecture-manifest.json` |

## Steps

1. create/createDetached with strip and own rollback; WAL `WorktreeCreate`.
2. remove and relocate under one hold of 40; WAL `WorktreeRemove`, `WorktreeMove`; TargetAttempt before destroy or move.
3. inspectOrphans, repairRegistration, prune; residue recovery with fixtures produced by killing Git at fixed barriers.
4. Doctor check.
5. Verb, skill text, render surfaces.
6. Code review unit; merge to main.

## Validation

```bash
cargo test -p fgos-git -p fgos-node-addon
cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
node --test test/git/worktree.test.mjs test/git/worktree-recovery.test.mjs test/verbs/worktree-create.test.mjs test/runner/worktree-admin-multiprocess.test.mjs test/setup/git-checks.test.mjs
npm run build:skills && git diff --exit-code -- .agents/skills plugins/fgOS/skills
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<p03 build> npm test
```

Vectors: **V-CLEAN (worktree)** busy, dirty, orphan, relocate, no rm-rf fallback, no data loss; **V-CRASH / E2 (worktree)** the four residue shapes with binary, untracked, symlink, mode and unrelated edits preserved; **V-CUSTODY (remove part)** remove refused while another holder has the lease; **V-ORDER (40 part)** create refused while 50 or 60 is held.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| Preserved dirty worktrees pile up | Medium × Low | Doctor lists them with bytes; a person decides; Execution uses a new worktree (spec §6). |
| Verb exposed before the Event Store cutover against §12 text | Low × Medium | Default Q2 (b): verb ships dark; enabled in the phase 07 release unless the owner answers (a). |

## Rollback

Dormant port and a new verb: revert the merge. Skill text reverts with it; regenerate render surfaces.
