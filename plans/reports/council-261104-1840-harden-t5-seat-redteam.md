# HARDEN T5 council: red-team seat (Execution Core, Dispatch and Confinement, Seat Binding, Run Result)

Main `26c652965`; no file of this layer differs from `c129461af`. Written 2026-11-04 18:41 to 18:55 (Asia/Saigon) on fg-server2. Lens: adversarial (axes A and B, with F where the spec claims a guarantee the code does not give). The threat model is a hostile agent and a hostile pulled project file. Read-only: this report is the only repository file written.

## What I ran

- **Read in full:** `worker-artifacts.mjs`, `trust-store.mjs` (lines 1-470), `confinement/drivers/bwrap.mjs` (lines 505-723), `confinement/resources.mjs` (lines 1-140 and 295-500), `confinement/cleanup.mjs` (lines 1-300), and `run-supervisor/steps/{settle-attempt,cleanup-trust,finalize-home}.mjs`.
- **Read by function:** in `provider-credential-renewal.mjs`: the layouts, apply, judge, write-back and settle functions (lines 80-365, 540-660 and 1155-1257). In `authority.mjs`: `buildConfinementAttestation`, the MCP approval site (1335-1375) and `finalizeAttemptHome` with its marker read (1834-1900). In `herdr-round.mjs`: lines 200-460. In `assignment-runner.mjs`: lines 1351-1390, 1960-2125 and 2180-2210. Also `settlement.mjs` 520-620 and 700-730, `handoff-refs.mjs` 150-320, `proof-helpers.mjs` 40-90, `visibility-session.mjs` 60-230, the `write-scope.mjs` matcher, and the reads in `run-result` Rust `lib.rs` and `unit_summary.rs`.
- **Skimmed by export:** `config.mjs`, `policies.mjs`, `assignment-runner.mjs` (the rest of it) and `run.mjs`. Other seats own these files.
- **Four reproductions.** Each ran from the session scratchpad (`/tmp/claude-1000/-home-vantt-projects-forgent/8e8e56bb-00a0-4158-ad04-ec29cabf8204/scratchpad/t5rt/`). Each imported the working-tree modules with `HERDR*` and `CLAUDE*` unset. Where the native door was needed, I loaded the staged addon through `FGOS_HOST_BIN`, `FGOS_ACTIVE_MANIFEST_PATH` and `FGOS_ACTIVE_RELEASE_PATH`, without restaging it. The bwrap runs used `/usr/bin/bwrap` 0.11.1 and the real `prepareBwrapSync` argv. Every scratch root under `/var/tmp` was removed by the script itself.
  - `real-home-read.mjs`: a confined read against the real home. It printed only existence and readability codes, never file contents.
  - `writeback-poison.mjs`: R-1.
  - `trust-race.sh`: R-2.
  - `fifo.mjs`: R-4.
  - `pulled-config.mjs` with a scratch `proj/.fgos/config.yaml`: R-3.
- **Not done:**
  - I dispatched no provider and started no pane, run or daemon.
  - I touched no real credential: the victim stores in R-1 are scratch files holding fake tokens.
  - I ran no test file, because another session was using the checkout.
  - I built no Cargo target.

## Part A: target shape (red-team view; layout and size are the other seats' call)

| Component | Kind | What it must be the authority for, from a hostile-input view | Spec versus code |
|---|---|---|---|
| Execution Core (`runUnit`, Unit, Pattern) | component | Which files of a run are host-written truth and which are agent-written evidence. Today the split is implicit: some readers use `openAgentFileSync`, others use plain `readFileSync`. | The spec states no hostile-input rule for this layer. The T3/T4 rule (no-follow, non-blocking, regular file, bounded) should be stated once in the runner spec and enforced through `proof-helpers.mjs`. |
| Dispatch (bind, seat resolver, adapters, settlement) | component | Settlement already reads the claim and report safely (`settlement.mjs:565,585`). Trust seeding into another tool's store (`trust-store.mjs`) is part of Dispatch, and it is the layer's only writer of a file the operator's own CLI also writes. | none |
| Confinement Authority | separate component | The sandbox argv, the private home and the write-back of a renewed login. Write-back must never take its authority from a file inside a writable grant. Today it does (R-1). | Spec §8.1 rule 3 says no component may lower a policy, but the project layer can (R-3). §3.2 disclaims secret reads, yet §9.3 hides `accounts.yaml` while every store it names stays readable (R-5). |
| Seat Binding (Rust) | separate component | A pure decision over config. It reads no agent-writable file. | No red-team finding. |
| Run Result (Rust reader, Node writer) | part of Execution Core | The Rust reads use `symlink_metadata` and bounded summaries, over host-written files. | No red-team finding. |

## Part B: findings

**R-1 Critical, reproduced: a confined worker can overwrite any codex-, pi- or omp-shaped login store on the host through the credential write-back.**

How it happens:
- The attempt home's ownership marker `.fgos-confinement-owner.json` is written inside the private home (`bwrap.mjs:598-605`, `cleanup.mjs:96-110`). That home is bound read-write into the sandbox: both built-in policies grant `private-home` `read-write` (`policies.mjs:41,57`), and `bwrap.mjs:617-618` binds it.
- `finalizeAttemptHome` takes the marker from that file (`authority.mjs:1834-1843`). It checks only `contract`, `creator`, `attemptId` and `runDir`, all of which the worker can read and keep. It then calls `writeBackRenewedCredential(target, marker)` (`authority.mjs:1868`).
- `validWriteBack` checks only the shape of `credentialWriteBack`: an absolute `home`, an absolute `runtimeDir` and a known `layout` (`provider-credential-renewal.mjs:1168-1176`).
- The copy wins when its expiry is later and its refresh token differs (`:233-237`). Codex expiry is the JWT `exp`, read without a signature check (`:209-214`, `:312-323`).
- The copy is read with a following `readFileSync` (`:82-96`) and staged with a following `copyFileSync` (`:290`, `:347`).

**Reproduction** (`writeback-poison.mjs`). Inside the real bwrap sandbox, the worker:
1. rewrote the marker, adding `credentialWriteBack.home = <victim codex home>`;
2. wrote an `auth.json` with `exp` set to 2100 and a refresh token of its own choosing;
3. failed to write the victim directly (`EROFS`).

On the host, the marker was accepted (`marker accepted: true`). The write-back returned `applied`, and the victim's refresh token was now the agent's (`victim refresh token now agent-chosen: true`).

**Consequences:**
- An agent can plant its own provider account into the operator's unconfined CLI home (account swap), or put junk tokens in every login (all accounts dead).
- An honest home needs no tampered marker for half of this: a forged `auth.json` alone is written back into the leased account's own store.
- The worker can even add `credentialWriteBack` to a home that never leased an account.
- The existing proof `provider-credential-renewal.test.mjs:1230` tests only unsafe provider and account ids.

**Fix (moves authority; adds no mechanism):**
1. Read `credentialWriteBack` only from a host-only record that the controller writes outside every grant: the attempt finalization descriptor under `runDir/protected`, already read at `authority.mjs:1860`. The in-home marker keeps identity only.
2. Read the copy through `openAgentFileSync`/`readAgentFileSync` with a size cap.
3. Apply a staged copy only after the existing probe door (`provider-credential-probe.mjs`, already run by `refreshAhead`) accepts it and its account identity matches the source's.

This replaces the in-home `credentialWriteBack` field.

**R-2 High, reproduced: concurrent seats lose each other's trust entries in `~/.claude.json` (H-T4c), and every seat races the operator's live claude processes.**

How it happens:
- `seedTrust` and `removeTrust` read, modify and rename the whole store with no lock (`trust-store.mjs:206-238`, `:81-101`).
- For claude, the target is always the operator's real file (`herdr-round.mjs:308-309`).
- It is seeded for every unconfined claude pane (`herdr-round.mjs:425-427`) and removed by `cleanup-trust.mjs:28` after the receipt.

**Reproduction** (`trust-race.sh`): four processes each seeded 100 distinct paths into one 200 KB store. Every call returned `true`, and 103 entries remained (297 of 400 lost silently).

**Effect:**
- A lost seed leaves the pane at the folder-trust dialog, which ends as `terminal:needs-human`. Panel and research-fan-out patterns start seats in parallel, so this is the common case, not a rare one.
- The other direction is unreproduced (I did not touch real claude): a fgOS rename made from a stale read drops whatever claude wrote in between.
- A lock alone fixes only the fgOS-to-fgOS race, because claude's own writes take no fgOS lock.

**Options for the sub-plan (owner question Q1):**
- (a) Give unconfined claude panes the same derived-store treatment as codex, so the operator's file is never written. That deletes the claude branches of `seedAttemptTrust` and `cleanup-trust`.
- (b) Keep the shared write, serialised through the holder-lock with a re-read under the lock, and accept the remaining race with claude.

**R-3 High, config layer reproduced, execution reasoned: a pulled project config can turn off confinement and replace executor commands (attach to `p-8da4b370`).**

**Reproduction** (`pulled-config.mjs`): `loadRunnerConfigForDir` on a scratch repository whose committed `.fgos/config.yaml` sets `runner.capabilities."code:review".confinement.mode: unconfined` and claude's invocations to `/bin/sh -c ...`. It returned:

```json
{"reviewConfinement":{"mode":"unconfined"},"claudeCliCommand":"/bin/sh",...}
```

Why it works:
- No `runner` node carries `x-fgos-scope: global-only` (only `gateway` does: `core/config-schema/gateway.schema.yaml:6`).
- The schema text says a higher layer replaces the whole confinement entry (`runner.schema.yaml:425`).

This contradicts spec §8.1 rule 3. Combined with R-1 and R-5, a teammate's pulled commit turns every read-only review seat into an unconfined shell. Fix direction, using the config component's existing `global-only` scope (owner question Q2): make `capabilities.*.confinement` downgrades and `executors.*.invocations[].command|args` global-only, or let the project layer only raise them.

**R-4 Medium, reproduced: host-side reads of agent-writable or pulled files block on a FIFO and follow links.**

| Site | Reads |
|---|---|
| `trust-store.mjs:174` (`claudeMcpApprovalArgs`) | `<cwd>/.mcp.json`, in the controller before the handover |
| `trust-store.mjs:402` | `.codex/hooks.json` |
| `cleanup.mjs:116` and `authority.mjs:1836` | the marker |
| `provider-credential-renewal.mjs:85,602,617` | the copy's files |

**Reproduction** (`fifo.mjs`): a FIFO at `.mcp.json` and a FIFO at the marker each kept the call blocked past a 5 s timeout. In the controller this blocks the event loop, so the Ctrl-C handler cannot run, and the controller has no step timeout. In finalize-home the step hits `stepTimeoutMs` on every adopt (`steps.rs:478-483`), so the attempt stays stuck with its login copy on disk.

Who can plant one:
- A seat with workspace-write, or the worker itself, can plant a FIFO for a later seat in the same worktree or for its own finalize.
- A pulled commit can carry a symlink (`.mcp.json` pointing at `/dev/zero`), which is an unbounded read.

Fix: route these reads through `readAgentFileSync` with a cap. That is the existing door; no new helper.

**R-5 High, reproduced, conflicts with a documented non-goal: a confined worker reads every login on the machine except the two files fgOS chose to hide.**

`real-home-read.mjs` gave the same answer under `host-write-denied` and `workspace-write`, blind or not:

| Path | Result |
|---|---|
| `~/.fgos/private/{gateway-token,accounts.yaml}` | `ENOENT` (hidden) |
| `~/.claude/.credentials.json`, `~/.claude.json`, `~/.config/gh/hosts.yml`, `~/.fgos/config.yaml` | `READABLE` |
| `~/.ssh` | listable (2 entries) |

The account homes that `accounts.yaml` names (`${HOME}/.codex-*`, `${HOME}/.pi/accounts/*`, `${HOME}/.omp/profiles/*`) sit outside every mask, so they are readable too (`bwrap.mjs:559`, `--ro-bind / /`; mask list `resources.mjs:92-99`). Network egress is open.

The spec disclaims secret reads (§3.2, `agent-confinement/spec.md:120`). But the private-home login copy and the hiding of the account inventory only make sense if a worker should see its own leased login alone. A worker leased on account A can read accounts B and C and the operator's GitHub token, and send them out. Proposal P-1 extends the existing mask list; owner question Q3 asks whether the non-goal still holds.

**R-6 Medium, reasoned, not reproduced: a launch that fails before the handover can leave an attempt home with a login copy that nothing owns.**

The order of the launch:
1. `prepareConfinementForLaunch` (`assignment-runner.mjs:1967`) creates the home and copies the login.
2. `prepareTerminalAttempt` (`:2007`) can fail at pane allocation.
3. `writeAttemptFiles` writes the envelope (`:2093`).

Nothing on the failure path removes the home:
- `abandon()` releases the pane and the trust entry, but not the bwrap home (`herdr-round.mjs:399-403`).
- The rollback in `prepareBwrapSync` uses `cleanupConfinementResource`, which reads only v1 markers (`bwrap.mjs:707-715`, `cleanup.mjs:261-264`).
- `removeConfinementDir` refuses a v2 home outright (`cleanup.mjs:217`).

Adopt still finalizes the home while `attempt-intent.json` exists (`adopt.rs:158`). But the controller's `finally` removes the intent when a settled result exists without an envelope (`assignment-runner.mjs:2185`). Then no door and no doctor row (`registrations.mjs:4571-4580`, `credential-copies-retained`) sees the home again. Needed: one owning test, "a refused pre-handover launch leaves no attempt home".

**R-7 Low, reasoned: smaller items.**
- **Claim presence follows links.** `findWorkerClaim` and `claimOf` use `existsSync` (`worker-artifacts.mjs:68`, `settle-attempt.mjs:120`). A symlinked `result-N.json` therefore counts as a present claim for `rawResultOf` (exit 0 on a stopped attempt) and for `classifyRunOutcome`, and only then turns out invalid. Leading zeros pass `Number()` (`worker-artifacts.mjs:53`).
- **Temp-root ownership check follows links.** `resolveConfinementTempRoot` uses `statSync` on a shared `/tmp` name (`cleanup.mjs:34`), so another local user's symlink to a directory this user owns passes the check. Use `lstat`.
- **Trust-store writes break symlinks.** The rename in `writeStoreAtomic` replaces a symlinked `~/.claude.json` (dotfile managers) with a plain file (`trust-store.mjs:81-85`).
- **Side file readable.** `protected/attempt-secrets.json` (`direct-launch.mjs:91,273`) holds the secret env and the run `controlToken`. In non-blind mode the worker can read its own and its peers' side files.
- **Shared network namespace.** Abstract unix sockets and localhost TCP stay reachable. This host has `@/tmp/.X11-unix/X1048` and `X1049`, mdview on `0.0.0.0:7700` and skillstation on `:7420`. The §9.3 masks cannot cover abstract sockets, and the threat list there should say so.

**Hypotheses rejected (recorded so the next review skips them):**
- **Settlement claim and report reads:** safe, because they use no-follow, bounded reads (`settlement.mjs:565,585`).
- **Hand-off copies:** cannot exfiltrate through a symlink. The source is pinned to the sha256 taken at settlement, after the agent is gone (`handoff-refs.mjs:313-316`).
- **Runner commits:** never stage `.fgos/**` (`write-scope.mjs:134`).
- **Rust run-result reads:** use `symlink_metadata` plus a cap on the files a worker could influence.
- **`/proc` of host processes:** hidden by `--unshare-pid` with a fresh `--proc` (`bwrap.mjs:560-565`).
- **Gateway token (`p-a189ff31`):** hidden. See the received items.

## Migration table (security-relevant parts only)

| Node part | What it decides | Move? | Reason | Order | Node budget after |
|---|---|---|---|---|---|
| Write-back authority (`finalizeAttemptHome` and `writeBackRenewedCredential`) | Which host store a renewed login replaces | Not to Rust now; first move the authority source to the host record (R-1) | Wrong input is the bug, not the language | 1 | About ±0 |
| Copy reads in `provider-credential-renewal.mjs` | Whether a copy is newer | No | Switch to `readAgentFileSync` | 1 | ±0 |
| `trust-store.mjs` claude path | Writing the operator's `~/.claude.json` | No | Q1(a) deletes the write rather than moving it | 2 | About −40 |
| Project-layer scope of executors and confinement | Who may lower a policy | Yes, into the Rust config schema (`x-fgos-scope`), which already exists | One authority for scope | 2 | Node −0; schema +4 lines |
| `.mcp.json` and `hooks.json` reads | MCP and hook approval | No | Switch to `readAgentFileSync` | 1 | ±0 |

## Delete list

- The in-home `credentialWriteBack` field, together with `extendOwnershipMarker`'s write-back use (`bwrap.mjs:96-105`). It is replaced by the descriptor field (R-1).
- With Q1(a): the claude branch of `seedAttemptTrust`, the `removeTrust` call in `cleanup-trust.mjs:28`, and the tests that prove the shared-store seed and removal.
- The dead doors `executeThroughConfinement` and `finalizeConfinementResources` (baseline §7). They hold a second, unreviewed copy of home-cleanup logic, which is a review surface for R-1-class bugs.

## Doctor table (conditions this lens cares about)

| Condition | Row that keeps it |
|---|---|
| Machine-private roots hidden (gateway token, accounts) | `confinement-blind-read` plus `confinement-probe-freshness` (the probe with stand-ins; my real-home read agrees) |
| A home kept or held with an unstaged login | `credential-copies-retained`; it must also count a v2 home whose run has neither an envelope nor an intent (R-6). No new row. |
| A temp root wider than 0700 | `confinement-orphaned-resources-reaped` |
| Trust-store readability (claude, codex, agy) | `trust-store-readable`, `non-claude-trust-stores-readable` and `agent-cli-project-trusted`; can merge into one row (simplicity seat) |
| A pulled config lowering confinement | None needed once R-3 makes it a config refusal (`config-*` rows already report refusals) |

## Tests table

| Behaviour | Owning proof to extend | Note |
|---|---|---|
| Write-back authority comes from the host record; a tampered marker home or runtimeDir is ignored | `test/runner/provider-credential-renewal.test.mjs:1230` | Extend it; no new file. |
| Copy reads are no-follow and capped | the same file (`:817`) | Extend. |
| Concurrent seeds keep every entry | `test/runner/dispatch/dispatch-trust-store.test.mjs` | One test; retire it if Q1(a) is chosen. |
| `.mcp.json` or hooks FIFO and symlink refused | `dispatch-trust-store.test.mjs` | One test. |
| No attempt home survives a pre-handover refusal | the `assignment-runner` launch test file (correctness seat names it) | R-6. |
| A project layer cannot lower confinement or replace a command | config crate scope tests (`packages/config/rust/tests/golden_scope.rs`) | Rust layer, not Node. |

`run.test.mjs` and `run-provider-failover.test.mjs` contain no waits. Each test sets up a git fixture and drives `runUnit` through the real supervisor, gate and fake agent for two or more attempts (`test/helpers/run-unit-with-port.mjs`, `failover-fixture.mjs`). The speed seat owns the cure.

## Received items (red-team answers; baseline §5 holds the state)

- **`p-a189ff31`: proven fixed in effect on this machine.** A confined read of the real `~/.fgos/private/gateway-token` returned `ENOENT` under both built-in policies, blind and not. The row is already `folded`; record this evidence there.
- **H-T4c:** reproduced as R-2 (High). No backlog row exists, so the sub-plan should add one, linked from R-2.
- **T3-04a addendum (outbox readers):**
  - The actual reads are now no-follow and capped (settlement and `readTail`).
  - Presence checks still follow links and accept leading zeros (R-7).
  - The `herdr-round.mjs:351-361` guard is still an `existsSync`.
- **`p-8da4b370`:** widened by R-3, because the same pulled file also lowers confinement. Attach R-3 to it.
- **H-T4e (`cliSpawnAdapter` short calls):** red-team note only. The probes run unconfined with real logins by design. No finding.
- **H-T4f (pane before envelope):** unchanged. R-6 is its credential twin (home before envelope); fix both in the same order change.
- **`executeThroughConfinement` dead door:** delete it (see the delete list).
- **Other received items** (grace rule, T2 §5, H20, wording lists, H-T4d): this lens has no answer; see the other seats.

## Proposed additions (owner picks; kept apart from the fixes)

- **P-1. Mask the stores the account inventory declares**, plus each executor's declared `credentialStore` home, through the existing `MACHINE_PRIVATE_ROOTS` mechanism ("a path another component owns enters here as one more entry", `resources.mjs:72`).
  - Problem: R-5.
  - Benefit: a worker sees only the login copied into its own private home.
  - Cost: unconfined-home seats that read a store in place must use the copy, which `credentialStore` already supports.
  - It changes the §3.2 non-goal (Q3).
- **P-2. Unshare the network namespace for read-only policies** whose capability needs no egress beyond the provider. Out of T5 scope; recorded because R-7's abstract-socket and localhost-service reach is otherwise unfixable by masks.

## Net size estimate (this seat's proposals)

| Area | Estimate |
|---|---|
| Node | −40 to +20. R-1 moves the field and adds the probe gate (about +30); R-4 swaps reads (about 0); Q1(a) deletes about 40; R-6 adds a finalize call on the failure path (about +10). |
| Rust | +4 schema lines (R-3), plus golden cases. |
| Tests | +100 to +150 lines across the existing owning files, −60 if Q1(a) retires the shared-store tests. |
| P-1 (if chosen) | about +20 Node. |

## Owner questions (decision-question form, batched)

- **Q1. Fix for R-2.**
  - Situation: concurrent seats lose trust entries in the operator's `~/.claude.json`.
  - Options:
    - (a) Derived private store for claude panes, as for codex: no shared write, about −40 lines. It needs a measured claude launch.
    - (b) A holder-lock with a re-read: smaller change, but the race with the live claude CLI remains.
  - Recommendation: (a).
  - Scope: T5 sub-plan.
- **Q2. Fix for R-3.**
  - Situation: a committed project file can set `unconfined` and replace commands.
  - Options:
    - (a) Make those paths global-only.
    - (b) The project layer may only raise confinement, and commands stay global-only.
    - (c) Leave it to `p-8da4b370`'s digest approval.
  - Recommendation: (b) now, (c) later.
- **Q3. Does the §3.2 non-goal still hold?** Confined workers can read every provider login on the machine (R-5).
  - Options:
    - (a) Keep the non-goal and document R-5 in §9.3.
    - (b) Take P-1.
  - Recommendation: (b), since the private-home copy already assumes it.

Status: DONE_WITH_CONCERNS
Summary: Proved `p-a189ff31` fixed with a real-home confined read. Reproduced four defects: a Critical where a confined worker overwrites arbitrary host login stores through the in-home write-back marker, the `~/.claude.json` lost update (297 of 400 seeds lost), a pulled config that sets `unconfined` and replaces commands, and FIFO hangs on host reads of agent-writable files.
Concerns/Blockers: R-1 is Critical and live on every confined dispatch that has a private home; it should be fixed before the rest of T5. R-6 is reasoned only and needs its owning test. Q1 to Q3 need the owner.
