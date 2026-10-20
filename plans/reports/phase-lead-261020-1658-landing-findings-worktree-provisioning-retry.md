# Landing findings: worktree provisioning, retry, stuck attempt, lock fences

Date 2026-10-20, 16:58–17:10 (Asia/Saigon), lane `fix/landing-findings-261020` (worktree `.claude/worktrees/landing-fixes`, from origin/main `2be2307d4`). Inputs: [this machine's landing](landing-261020-1651-latest-main-pane-close-this-machine.md) and [the owner machine's landing](landing-261020-1527-cook-p4-debate-mpb1-fix-owner-machine.md).

## 1. `fgos worktree remove` refused every provisioned worktree: fixed

**Cause.** `fgos worktree create` provisions after the Git port returns: `npm ci`/`npm install`, then `worktreeSetup.commands` (here, a copy of the ignored `ak-*` skill directories). The port's clean check refuses any path from `git ls-files --others --directory --ignored --exclude-standard` with `worktree-ignored-bytes-preserved`.

**Prior art.** `d66eb841a` moved provisioning into the create verb. `9fa8a08f0` added the `ak-*` copy. `8a8362712` added the port and its ignored-bytes rule. Nothing recorded what provisioning placed. The fix reuses `provisionDependencies`, `runWorktreeSetupCommands`, `nulPaths`, `uniqueTmpTag` and `realpathOrSelf`. Git and the port are unchanged.

**What changed:** Execution layer only, in `src/runner/worktree.mjs`. A new file would need an architecture-manifest row, which is outside this lane's scope.

- `provisionWorktree(path, repoRoot, stateRoot)` lists untracked and ignored paths before and after provisioning (`git ls-files --others --directory -z`).
  - It records each new path in `<stateRoot>/worktree-provisioning/<sha256(realpath)>.json`, bound to the checkout directory's device and inode.
  - A file is recorded with its sha256, and a symlink with its target.
  - The `node_modules` that `provisionDependencies` installed is recorded as `regenerable`. `provisionDependencies` now returns whether it installed.
  - The record is written in `finally`, so a checkout whose setup command failed can still be removed.
- `setProvisionedAside(stateRoot, path)` runs in the remove verb before `port.remove`.
  - It moves the regenerable directory, and every copy that still matches its digest, into a sibling directory `.<name>.provisioned-<tag>`.
  - A recorded directory is taken out only once it is empty.
  - If the port refuses, everything is moved back (`restore`). If the port removes the checkout, the moved bytes and the record are deleted (`discard`).
  - An edited copy, a foreign file, or a checkout with no record stays in place, and the port refuses on it as before.
  - Moving the bytes aside, rather than deleting them, keeps a refused remove (for example, delivery unproven) from stripping a live worktree.
- No `git clean`, no force flag, no env switch.

**Tests** (`test/verbs/worktree-remove.test.mjs`, real native port):
- Round trip: create with a dependency install and an ignored skill copy (file, nested file, symlink), then remove. The checkout is gone, the record is deleted and no sibling directory is left; extra bytes inside `node_modules` do not block.
- A worker-edited copy refuses, and so does a foreign ignored file. Every provisioned byte is back afterwards and the worker's bytes are untouched. Once the foreign file is gone, the same record removes the checkout.
- The CLI adapter test now runs `fgos worktree create` with a `worktreeSetup` command that copies an ignored skill, then `fgos worktree remove` through the real host.

The fixture's `npm` is a PATH stub, because the fixture has no registry.

**Existing worktrees:** a worktree created before this release has no record, so it needs its provisioned bytes cleaned by hand once.

## 2. Smoke c retry "found the previous try's result file": not an outbox defect, no code change

The outbox is already scoped to one attempt:
- `briefPaths` uses `<runDir>/outbox/result-<round>.json`, and the round is always 1 for an attempt (`herdr-round.mjs`).
- A resume opens `runs/NN+1`, and a new `fgos run` opens a new unit directory.
- The three smoke c tries were three units (`…19a805a7`, `…a585c6cf`, `…cc76dd22`), each with its own `runs/01/outbox`.

What carried over was the workspace file. The refused first try wrote `docs/smoke-paneclose-c.md` but did not commit it, because the claim failed to parse. The second try's `controller/evaluator-baseline.json` has `dirtyBefore: ["docs/smoke-paneclose-c.md"]`. The agent found the line already there and changed nothing. `inconclusive`/`no-evidence` is the correct verdict: the runner cannot attribute bytes it did not see change. The strict claim parse (`invalid-agent-result-claim` on the raw newline) is unchanged.

To retry after a refused writing run, either remove or commit its leftover first, or use `fgos run --resume <unitRunId>` where resume applies.

## 3. `run-attempts-stuck` on `unit-run-1792482363495-797e4401`

**State.** Read-only terminal smoke, receipt `cancelled` (SIGTERM, both capture digests), `release-slot` done with `retain`. `settle-attempt` is open after exit 66, and no pane remains in `herdr pane list`.

The envelope binds the steps to `hostBin` `.claude/worktrees/pane-close/.fgos/runtime/dev-host/run-Gs1777/fgos` and `payloadRoot` `.claude/worktrees/pane-close`. Both are gone, because the whole `pane-close` worktree was deleted.

**Door.** The door is `fgos doctor --fix`, which runs adopt. Adopt has no fallback to the active host, by the recorded decision of 2026-10-19 (run-supervisor spec, decision history item 5); this lane keeps that. The door can still settle the attempt once the paths are back:
- `host_bin_is_current` compares paths only.
- `verifyPayload` accepts a host with no manifest next to it as a development host.
- The step env's `FGOS_STATE_ROOT` (`/var/tmp/fgos-paneclose-state`) still exists.

So this is not a missing door, and I did not run it: this sandbox mounts the main checkout's `.fgos` read-only (the adopt probe fails with `EROFS`). Run on the host, from `~/projects/forgent`:

```sh
fgos worktree create .claude/worktrees/pane-close --detach --base e1d5a4005
mkdir -p .claude/worktrees/pane-close/.fgos/runtime/dev-host/run-Gs1777
cp ~/.local/state/fgos/releases/sha256:fde9e4e12b09f62b713a1fd67c542c0e86eda6f6b5b4223b764b1c3068270ea3/bin/fgos \
   .claude/worktrees/pane-close/.fgos/runtime/dev-host/run-Gs1777/fgos
fgos doctor --fix          # run-attempts-stuck adopts it: settle-attempt, finalize-home, cleanup-trust, closed.json
fgos doctor                # run-attempts-stuck no longer names 797e4401
rm -rf .claude/worktrees/pane-close/.fgos/runtime
fgos worktree remove .claude/worktrees/pane-close --delivered-to main   # with fix 1 active; before it, git worktree remove --force
```

`fgos doctor --fix` also runs the other registered fixes, so run it in a quiet window. The unit then reads `awaiting-resume` and can be left alone as a dev smoke.

**Defect fixed on the way.** The check's remedy named only the missing `hostBin`. Restoring only that would have failed again with `payload-missing`. `releaseGoneReason` (`src/setup/run-supervisor-checks.mjs`) now also names a missing `<payloadRoot>/src/run-supervisor/attempt-step.mjs`, and says to restore both at those paths. Against the real attempt it now names both paths.

## 4. `lock-fences` warning for 11 smoke `.recovery.lock` paths: a defect, fixed

The holder-lock spec (fence table) says the per-run `advance`/`recovery` tombstones are "for every run that exists at cutover, not lazily". The check listed every current run directory, so every run made after the cutover showed up as a missing fence. The warning grew with each run, and each landing used its quiet window to fence runs that need no fence (the last landing placed 77, with 434 already there).

`fences.mjs` no longer enumerates a run directory holding `attempt.lock`. Such a run was made by the run supervisor, whose release already takes `recovery` as a kernel lock; `legacy-sweep.mjs` already uses the same marker. Against this workspace, read-only, every `recovery` target is now fenced or no longer listed; only 2 paths are missing, neither of them `recovery`.

The two that remain are expected:
- the `dispatch-cwd` path of the new worktree `landing-fixes`;
- the `merge-slot` path of its new branch.

Their spec rows and an existing test ("a branch created after the fences were placed has no merge slot tombstone…") keep those reported until the next quiet `fgos doctor --fix`. The fix refusing while a lead's worker runs `fgos` is the stop-everything precondition working as designed.

`advance` (per workflow run) has the same spec rule, but I found no reliable marker: `locks/advance.lock` also appears on a pre-cutover run resumed later. It is left unchanged and listed under ideas below.

## Verification

All commands run from the worktree root.

| Command | Result |
|---|---|
| `node --test test/verbs/worktree-remove.test.mjs` | 7/7 (includes the CLI round trip through a host built here) |
| `node --test test/verbs/worktree-create.test.mjs` | 3/3 |
| `node --test test/runner/worktree.test.mjs` | 71/71 |
| `node --test test/architecture.test.mjs` | 29/29 |
| `node --test --test-name-pattern='run-attempts-stuck' test/setup/run-supervisor-checks.test.mjs` | 6/6 |
| `node --test test/holder-lock/fences-v1-tombstone.test.mjs` | 6/7; the new test passes |

**Needs the host.** These fail identically at HEAD in this sandbox, so they are not regressions:
- `fences-v1-tombstone` "every real v1 acquire…": the worktree has no `node_modules` (`yaml`).
- `test/setup/run-supervisor-checks.test.mjs`: 2 `legacy-attempts-stuck` tests; process liveness reads `pid-unknown`.
- `test/setup/holder-lock-checks.test.mjs`: 3 lock-fences fix tests.
- `test/holder-lock/fences-stop-check.test.mjs`: 6 tests; the quiesce scan sees no processes.

No full `npm test` was run. GitNexus tools were not available in this session (impact analysis inactive). Blast radius was checked by `rg`:
- `provisionDependencies` has callers in `create.mjs` (replaced), `merge.mjs` and `bin/fgos.mjs`, which ignore the return value.
- `fenceTargets`/`fenceStatus` are read by the doctor check, its fix and their tests.

## Writes outside the scope (needed, not made)

- `docs/platform/git/spec.md` §11, the `fgos worktree remove` paragraph: one sentence that the verb sets provisioned bytes aside first (record under the state root, digest-checked) and that the port rule is unchanged.
- `docs/platform/holder-lock/spec.md`, fence table `advance`, `recovery` row: "a run holding `attempt.lock` is post-cutover and is not enumerated".

## Ideas (owner's choice, not done)

1. **Refuse a writing launch whose declared `writes` are already dirty.** This is the smoke c case. Today the run starts, spends a model turn and settles `inconclusive`; a refusal before launch would name the file. Cost: one check at launch.
2. **Dev door prune and open attempts.** `npm run fgos:dev` prunes a staged host once no process runs from it. An attempt whose supervisor ended with a step still open (as here) then loses its host for good. Keep a staged host while an attempt envelope naming it has no `closed.json`. Cost: the dev door reads assignment envelopes.
3. **`advance` per-run fences.** Same growth as recovery once workflow runs are frequent, but it needs a creation marker that workflow runs do not have yet.

Status: DONE_WITH_CONCERNS
Summary: Fixed fgos worktree remove on provisioned worktrees (record and set-aside at the Execution layer) and the lock-fences per-run recovery overcount; showed the smoke c retry was workspace leftover, not an outbox bug; gave the restore-then-doctor-fix commands for the stuck dev attempt and made its remedy name the missing payload.
Concerns/Blockers: Item 3 is not executed (main checkout `.fgos` is read-only in this sandbox); host-only tests listed above still need a host run; two spec edits outside the scope are listed.
