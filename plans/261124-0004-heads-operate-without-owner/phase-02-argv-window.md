# Phase 2: The fgos argv window and its permission table, in Rust

Capability: `code:implement`.

Builds PC-D6 (discussion §4) and the window part of PC-D3: one argv forwarder plus one data table, replacing the
hand-written forward-only branches in the same change (L10, RUL104). Per PC-D11 (owner, 2026-11-24
00:14), the table, the forwarder and `can-i` are Rust in `packages/session-host/rust`; this is the first slice of
plan 3 of the Node-to-Rust inventory, and nothing else of session-host is ported here.

## Inputs

- The discussion, §4 PC-D3 and PC-D6, §5 23:20 (the three holes to close), §6 "Lồng và ô cửa", and the paragraph
  "Chồng lấn với việc chuyển Node sang Rust".
- `src/session-host/head-grants.mjs`: `GRANTS`, the verb arrays, `grantOf` (`{ writes, verbs, mailbox, peers }`). Its
  comment on Miu says she "never closes an event, types into a pane, reads a session or tunes the watcher": the
  replacement text follows PC-D1.
- `src/session-host/head-start.mjs`: calls `grantOf` at launch and writes `session.verbs` and `session.writes` into the
  envelope.
- `src/session-host/head-request.mjs` `runHeadRequest` (about line 728): 28 `case` branches. Forward-only (they check
  argument shapes and call `hostCall`): `supervisor handled`, `supervisor raise`, `watcher tune`, `session read`,
  `session type`, `metrics prune`, `friction record`, `config patch`, `supervisor queue|plans|wake`, `slots`,
  `questions list`. Policy branches that stay in Node until inventory plan 3 ports them: `land`, `run`,
  `request result`, `session start`, `session stop`, the `questions ask|ack|cancel|answer` route,
  `session rotate|answered|restore role`, `worktree create`, `supervisor done` (it stops the caller), `metrics record`
  (the `fgos.coordination.*` kind rule). `session write` is already Rust.
- `packages/run-supervisor/rust/src/head_request.rs`: the transport, the check of `envelope.session.verbs`,
  `SUCCESSOR_READ_VERBS` (line 79), the hand-over to Node through `fgos internal head-request`.
- `packages/run-supervisor/contracts/head-request.v1.json`, `envelope.v3.json`.
- `packages/session-host/rust/src/` (the crate; `fgos-run-supervisor` already depends on it under `supervise`).
- `packages/git/node-addon/src/` (the one Node addon; `writeScope` is the pattern of a small door) and
  `src/native/door.mjs` (its version gate).
- `test/live/head-grant-probe.live.mjs`: reads the contract's `verbs`; it must read the table instead.

## Footprint

Rust: `packages/session-host/rust/src/lib.rs`, `packages/session-host/rust/src/permissions.rs` (new),
`packages/session-host/rust/src/forwarder.rs` (new), `packages/session-host/rust/tests/permissions.rs` (new),
`packages/session-host/rust/tests/forwarder.rs` (new), `packages/session-host/rust/Cargo.toml`, `Cargo.lock`,
`packages/run-supervisor/rust/src/head_request.rs`, `packages/run-supervisor/rust/tests/head_request.rs`,
`packages/git/node-addon/src/session_host.rs` (new), `packages/git/node-addon/src/lib.rs`,
`packages/git/node-addon/Cargo.toml`.
Data and contracts: `packages/session-host/contracts/head-permissions.v1.json` (new),
`packages/run-supervisor/contracts/head-request.v1.json`, `packages/run-supervisor/contracts/envelope.v3.json`.
Node: `src/native/door.mjs`, `src/session-host/head-grants.mjs`, `src/session-host/head-start.mjs`,
`src/session-host/head-request.mjs`, `src/session-host/head-request-client.mjs`, `test/session-host/head-grants.test.mjs`,
`test/session-host/head-request.test.mjs`, `test/session-host/head-start.test.mjs`, `test/live/head-grant-probe.live.mjs`.
CLI registration of `can-i`: `src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-manifest.json`,
`packages/host-runtime/contracts/command-routes.json`, `packages/host-runtime/contracts/command-route-annotations.json`,
`apps/fgos/src/routing.rs`. Envelope readers that drop `session.verbs` (owner answer `q-nog2h4wfjm`; these three
are also inside the footprint of draft plan `261122-2108-delete-dead-node-execution-closure`, which rebases onto this
phase): `src/runner/dispatch/session-attempt.mjs`, `apps/fgos/src/wiring/unit_run_host/session_attempt.rs`,
`apps/fgos/src/wiring/unit_run_host/tests/session_attempt.rs`. Docs: `docs/platform/run-supervisor/spec.md`. Authority model door rows (debt paid):
`packages/component-authority/model/doors/execution-s-node-seam.yaml`,
`packages/component-authority/model/doors/the-node-bind-facade-has-only-its-named-callers.yaml`,
`packages/component-authority/model/doors/node-callers-reach-execution-only-through-its-seam-never-into-the-node-execution-closure.yaml`.

## Owner answer q-nog2h4wfjm (2026-11-24 22:32)

Option "Widen footprint, allow cargo". Retiring `envelope.session.verbs` needs three files outside the footprint:
`src/runner/dispatch/session-attempt.mjs` (owned by draft plan `261122-2108-delete-dead-node-execution-closure`, which
rebases on this change), `apps/fgos/src/wiring/unit_run_host/session_attempt.rs` and
`apps/fgos/src/wiring/unit_run_host/tests/session_attempt.rs`. A planner adds them to the plan and phase 2 footprint
and records the overlap with 2108; cargo and node run in the phase unit's sandbox; the lead reruns phase 2 in the same
worktree. The answer allows only that footprint edit and the rerun; nothing else of scope or decision changes.

**Unit sandbox.** The phase 2 unit's sandbox must allow `cargo` and `node`: the verify commands below
(`cargo test -p fgos-session-host`, `cargo test -p fgos-run-supervisor`, `node --test ...`) run inside the unit, and
the first run came back blocked because the sandbox refused both. Start the rerun with a unit that can run them.

## Owner answer q-qzcq5xti2k (2026-11-24 23:04)

Option "Allow cargo and node for claude workers in project config": add `--allowedTools 'Bash(cargo:*)' 'Bash(node:*)'
'Bash(npm test:*)'` to the `claude-cli-bwrap` invocation. Applying it was refused: `runner.executors.<id>.invocations[].args`
is `x-fgos-scope: global-only` (`core/config-schema/runner.schema.yaml`), and lists are leaves, so `fgos config patch`
of `runner.executors.claude.invocations` into `.fgos/config.yaml` returns `config-key-out-of-scope belongs-in=global`.
The answer's scope covered the project file only, so the supervisor wrote nothing and asked follow-up `q-owq4jhwng7`
(supersedes it). Phase 2 stays parked on it.

## Owner answer q-owq4jhwng7 (2026-11-25 09:33)

Option "Lead pins the existing full-confinement bypass invocation". The lead reruns the phase 2 unit once, pinned to
the standard invocation `claude-herdr-bypass-bwrap` (bwrap with private home, isolated session, own worktree;
permission bypass) through `fgos run --override`, so `cargo` and `node` run inside the unit. No config change. If
`--override` cannot pin an invocation, the lead asks again (fallback: the owner's one global config patch). The answer
allows only that one rerun; it forbids any change to confinement policies, project executor args, git write grants for
workers, other phases or the plan's scope. Phase 2 is unparked.

## Owner answer q-3svd4ttdn7 (2026-11-25 10:59)

Option "Commit by hand". The 32 finished but uncommitted paths in worktree
`261124-0004-heads-operate-without-owner-p02` are committed outside any head, on branch
`heads-operate-without-owner/p02` only. The answer allows that one commit of exactly those paths and forbids pushing,
landing on main or touching other files; the lead then reviews and lands the branch through `fgos land`. Done:
commit `8c51967e4` "feat(session-host): one argv window and one permission table in Rust for head requests", tree clean.

## Owner answer q-ulx4nkztpq (2026-11-25 10:59)

Option "Follow-up item". Phase 2 lands as is and is marked done with step 9 recorded as partly met. One new backlog
item takes the leftovers: the execution engine's `session.verbs` writes and gate
(`packages/execution/engine/src/transport_round/session_attempt.rs`, `tests/transport_round.rs`), the
`bin/fgos.mjs` "unknown verb" answer for `fgos can-i` outside a head, and the 4 door-row allowance lines step 9 could
not pay (head-start's seam import; `bind` and `readAccountStateOverlay` with no door; head-request's three imports
without a seam-row entry). The answer forbids editing the engine files or `bin/fgos.mjs` inside this plan. The lead
writes only its plan directory, so the backlog row is raised to the supervisor.

## Decisions taken in this phase (planner's, within PC-D6 and PC-D11)

- **Where the table lives:** `packages/session-host/contracts/head-permissions.v1.json`, compiled into the crate
  (`include_str!`) and read only by `permissions.rs`. It is not a config key, so `config patch` can never widen it; it
  changes only through a landed code change.
- **Table shape:** per persona: `writes`, `mailbox`, `peers` (the cage size), and rules
  `{ prefix, decision: allow|ask|deny, read?: true, args?: {...} }`. Personas inherit `head < supervisor < secretary`
  (lead, planner and shaper are `head` plus their own rows; a lead's `writes` stays its plan dir, filled in by the
  caller as today). The most specific prefix wins; on a tie the strictest decision wins (`deny` > `ask` > `allow`). An
  argv no rule matches is `ask`. `read: true` marks the verbs a rotation successor may use before it holds the role.
  `args` limits a flag's value (used by phase 3 for `--kind` and `--to`).
- **Who decides:** the run supervisor resolves the caller's persona from `envelope.session.role` (digest-protected)
  and asks `permissions.rs`; the sandbox cannot change the answer. `envelope.session.verbs` is retired in the same
  change. `fgos can-i <argv...>` is answered by the run supervisor itself from the same function, with no route child,
  like `session bind session`.
- **`allow`:** `forwarder.rs` validates the argv and the run supervisor execs the host's own `fgos` (envelope hostBin)
  with that argv plus `--json`, from the project root, no shell, no Node hop. A verb whose rule says `policy: node`
  (the kept Node branches) still goes to `fgos internal head-request` as today.
- **`ask`:** the run supervisor files one five-part question (`fgos questions ask`, form of
  `core/skills/_shared/decision-question.md`) whose body carries the exact argv, and replies `asked` with the `q-` id.
- **Refused for every persona (`deny`, code `argv-not-allowed`):** any flag that changes the project root, cwd or
  environment (`-C`, `--cwd`, `--root`, `--project`, `--env`) and any argv element that is not a plain string; an argv
  that is not an `fgos` verb (raw shell is never a row); activation of a release (phase 6 replaces this with its
  policy branch); `config patch` whose edits touch a key under the grant, confinement or `release` prefixes (the
  forwarder reads the patch file before the call; the key prefix list is a constant in `permissions.rs`, named in the
  contract).
- **Node reads the cage size through a thin port:** `grantOf` keeps its signature and becomes a call to the addon's
  `sessionHost.grantOf` (new door, gated in `door.mjs`), until inventory plan 3 ports the launch.

## Steps

1. Write `head-permissions.v1.json` with rows that reproduce today's grants exactly (cage size and verbs per persona),
   then add for the supervisor and, through inheritance, the secretary: `config patch` (allow, with the key deny
   above), `worktree remove --delivered-to` (allow; the verb refuses itself when not landed), `git recover` (allow),
   `dispatch probe-account` (allow). `session write plans/backlog.md` is already a write grant in source.
2. Write `permissions.rs` (load, inherit, match, decide, cage size) and `forwarder.rs` (argv validation, the deny rules,
   the exec description), exported from `lib.rs`. Owning proofs in `tests/permissions.rs` (inheritance, most specific
   prefix, strictest tie, default `ask`, the successor `read` flag, the parity of today's grants) and
   `tests/forwarder.rs` (one test per deny rule: grant/confinement/release key in `config patch`, a cwd/root/env flag,
   a non-`fgos` argv, activation).
3. In `head_request.rs`: decide with `permissions.rs`; for `allow` exec through the forwarder; for `ask` file the
   question; for `deny` refuse; serve `can-i`. Delete `SUCCESSOR_READ_VERBS` and the `session.verbs` check. Wiring proof
   in `packages/run-supervisor/rust/tests/head_request.rs`: one allowed forward, one ask, one deny, one `can-i`.
4. Delete the forward-only `case` branches of `runHeadRequest` and their argument tests in
   `test/session-host/head-request.test.mjs`, naming in the commit the Rust test that now owns each behaviour. Update
   `head-request-client.mjs` so every head-side verb sends the forwarder frame.
5. Add the addon door `sessionHost.grantOf` and gate it in `door.mjs`; make `grantOf` in `head-grants.mjs` call it and
   delete `GRANTS` and the verb arrays; drop `session.verbs` from the envelope in `head-start.mjs` and
   `envelope.v3.json`. `test/session-host/head-grants.test.mjs` keeps one wiring proof (the port answers a persona's
   cage size); `head-start.test.mjs` drops its `session.verbs` expectation.
6. Contracts: `head-request.v1.json` gets the forwarder frame (`verb: "fgos"`, `args.argv`), the decisions and refusal
   codes (`argv-not-allowed`, `asked`) and `can-i`, and loses the per-verb entries of deleted branches. Register
   `can-i` in the CLI registry, the host-runtime contracts and `apps/fgos/src/routing.rs`.
7. Point `test/live/head-grant-probe.live.mjs` at the table: expected outcomes come from the persona's rules, and it
   adds one `can-i` call per decision.
8. Update `docs/platform/run-supervisor/spec.md` for the new frame and decisions.
9. Pay the authority debt of the two files this phase rewrites, in place (owner's split, 2026-11-24): the three door
   lines of `src/session-host/head-start.mjs` (`execution-s-node-seam`, `the-node-bind-facade-has-only-its-named-callers`,
   `node-callers-reach-execution-only-through-its-seam-never-into-the-node-execution-closure`) and the one line of
   `src/session-host/head-request.mjs` (`node-callers-reach-execution-only-through-its-seam-never-into-the-node-execution-closure`).
   Move each import the allowance covers to the door the row names (or drop it where step 4 deleted the branch that
   used it), then delete the allowance line. If one line cannot be paid without a new mechanism, stop and ask the
   supervisor; never raise a count.

## Verify

```bash
cargo test -p fgos-session-host
cargo test -p fgos-run-supervisor
node --test test/session-host/head-request.test.mjs test/session-host/head-grants.test.mjs test/session-host/head-start.test.mjs
node --test test/cli/subcommand-flag-drift.test.mjs
```

Pass: all green; `rg -n "SUCCESSOR_READ_VERBS|const GRANTS" packages src` finds nothing; `rg -c "case HEAD_" src/session-host/head-request.mjs`
counts only the kept Node policy branches listed above; `rg -n "session-host/head-(start|request).mjs" packages/component-authority/model/doors`
finds nothing; `node --test test/architecture.test.mjs` is green.

## Rollback

`git revert` the phase's commits; the Node table, branches and constant come back together, since they were removed in
the same commits. Rebuild the addon.

## Lead notes

- 2026-11-25 09:39: the pinned rerun allowed by `q-owq4jhwng7` did not happen. Ticket `c-1632-1795574308428`
  (unit run `unit-run-1795574308869-401c052f`) ended `blocked` after 19 s on the default `claude-cli-bwrap`: the
  request window forwarded `run` without `--override` and `--timeout`, and the worker could not read this brief
  in the main checkout (the p02 worktree is still on base `f999c4018`; `--sync` is dropped too). No file changed.
  Asked the owner `q-nt7ptsq2nd`. The command of its recommended option, to be run by the owner from the main
  checkout (outside the window, so every flag passes):

```bash
cd /home/vantt/projects/forgent && fgos run "Implement phase 2 of plan plans/261124-0004-heads-operate-without-owner from its brief plans/261124-0004-heads-operate-without-owner/phase-02-argv-window.md and plans/261124-0004-heads-operate-without-owner/plan.md (merged into this worktree by --sync). The worktree holds a half-done, uncommitted start (permissions.rs, forwarder.rs, the contract, head_request.rs edits); review it against the brief, keep what is right and finish steps 1-9. Run the phase's Verify commands and rg pass checks and make them green. Write only inside the listed paths." --provider claude --capability execute --plan plans/261124-0004-heads-operate-without-owner --phase 2 --sync main --worktree /home/vantt/projects/forgent-worktrees/261124-0004-heads-operate-without-owner-p02 --writes "packages/session-host/rust/src/lib.rs,packages/session-host/rust/src/permissions.rs,packages/session-host/rust/src/forwarder.rs,packages/session-host/rust/tests/permissions.rs,packages/session-host/rust/tests/forwarder.rs,packages/session-host/rust/Cargo.toml,packages/session-host/contracts/head-permissions.v1.json,packages/git/node-addon/src/session_host.rs,packages/git/node-addon/src/lib.rs,packages/git/node-addon/Cargo.toml,src/native/door.mjs,Cargo.lock,src/session-host/head-grants.mjs,src/session-host/head-start.mjs,src/session-host/head-request.mjs,src/session-host/head-request-client.mjs,packages/run-supervisor/contracts/head-request.v1.json,packages/run-supervisor/contracts/envelope.v3.json,packages/run-supervisor/rust/src/head_request.rs,packages/run-supervisor/rust/tests/head_request.rs,src/cli/command-registry.mjs,packages/host-runtime/contracts/command-manifest.json,packages/host-runtime/contracts/command-routes.json,packages/host-runtime/contracts/command-route-annotations.json,apps/fgos/src/routing.rs,src/runner/dispatch/session-attempt.mjs,apps/fgos/src/wiring/unit_run_host/session_attempt.rs,apps/fgos/src/wiring/unit_run_host/tests/session_attempt.rs,test/session-host/head-grants.test.mjs,test/session-host/head-request.test.mjs,test/session-host/head-start.test.mjs,test/live/head-grant-probe.live.mjs,docs/platform/run-supervisor/spec.md,packages/component-authority/model/doors/execution-s-node-seam.yaml,packages/component-authority/model/doors/the-node-bind-facade-has-only-its-named-callers.yaml,packages/component-authority/model/doors/node-callers-reach-execution-only-through-its-seam-never-into-the-node-execution-closure.yaml" --override '{"executor":"claude","invocation":"claude-herdr-bypass-bwrap"}' --timeout 3h --json
```

- 2026-11-25 10:15 (supervisor): the owner answered `q-nt7ptsq2nd` with the global config patch for claude workers.
  The exact patch is `reports/claude-worker-global-patch.yaml` (all four claude invocations copied from the
  standard, since lists are leaves; only `claude-cli-bwrap` gains `--allowedTools "Bash(cargo:*),Bash(node:*),Bash(npm test:*)"`).
  The owner applies it from the main checkout with
  `fgos config patch --global plans/261124-0004-heads-operate-without-owner/reports/claude-worker-global-patch.yaml --reason "owner q-nt7ptsq2nd: claude-cli-bwrap workers may run cargo, node and npm test"`.
  Phase 2 waits on that apply; then the lead reruns its unit on the default `claude-cli-bwrap` (sync p02 with main first).
- 2026-11-25 10:05 (lead): acked `q-nt7ptsq2nd`; its answer was already written above by the supervisor. The patch is
  not applied yet: `fgos config explain runner.executors.claude.invocations` still resolves to the `standard` layer and
  `~/.fgos/config.yaml` is unchanged since 2026-11-19. Phase 2 is parked on the owner's apply question
  `q-aucsjasc25`. On `Applied`, the lead syncs p02 with main and reruns the unit on the default `claude-cli-bwrap`.
- 2026-11-25 10:18 (supervisor): the owner answered `q-aucsjasc25` with `Applied`. Verified: `~/.fgos/config.yaml`
  changed at 10:14 and carries the `--allowedTools` grant. Phase 2 is unparked: the lead syncs p02 with main and reruns
  the unit on the default `claude-cli-bwrap`.
- 2026-11-25 10:32 (lead): after the owner applied the global claude worker patch (`3490ee75c`), the unit was rerun on
  the default `claude-cli-bwrap`: ticket `c-4030-1795576677441`, unit run `unit-run-1795576677937-017b4e0f`, started
  10:17:57. The window dropped `--sync main` again, which is harmless because the p02 worktree already holds the brief
  (12 commits behind main, none of them in the phase's paths). The worker is live and progressing: 32 paths changed
  across every step, the latest at 10:25. It was still `running` after the lead's 12 waits, so phase 2 is parked on this
  ticket. On wake the lead reads `fgos request result c-4030-1795576677441`, reviews `git diff origin/main...HEAD` of
  `261124-0004-heads-operate-without-owner/p02` against this brief, and lands it.
- 2026-11-25 10:55 (lead): ticket `c-4030-1795576677441` settled at 10:39 as `execution-failure`,
  `commit-failed:git-error`. The producer (claude, sonnet, 21.6 min) passed. It reports steps 1-8 done, green
  `cargo test -p fgos-session-host` and `-p fgos-run-supervisor`, clippy clean, and the three session-host node tests green.
  Its work is uncommitted in the p02 worktree: 32 paths, all inside `--writes`, none outside.
  What the lead found about the commit:
  - The native scoped commit (operation `77035353-68e4-41c3-8049-dabd4d24013f`) ran `git commit`; git refused it and the
    door rolled the index back (p02 reflog `reset: moving to HEAD` at 10:39:40). The WAL keeps only the cause
    `commit-rejected`. That is the cause the driver gives (`checkout_commit_failure`, `packages/git/rust/src/driver.rs`)
    when git fails and the pre-commit replay does not report `hook-refused`. Git's stderr reached neither the unit record
    nor the WAL, so the exact git message is lost. The doc-health check of the staged
    `docs/platform/run-supervisor/spec.md` remains a suspect; the lead cannot run it inside its sandbox (it needs a cargo build).
  - Separately, the runner could never have committed the whole phase. The commit baseline listed 9 paths that were
    already dirty before the round (the earlier half-done start: `permissions.rs`, `forwarder.rs`, both tests,
    `lib.rs`, `Cargo.toml`, the contract, `head_request.rs` and its test), and the scoped commit excludes baseline-dirty
    paths (`scoped_commit.rs`, `excluded`). Every rerun in this worktree now has all 32 paths as baseline-dirty and would
    commit nothing.
  Worker's open items: the step 9 `rg` pass check still finds 4 allowance lines (head-start's seam import; `bind` and
  `readAccountStateOverlay` have no door; head-request's three imports need a seam-row entry). It also says
  `packages/execution/engine/src/transport_round/session_attempt.rs` with `tests/transport_round.rs` and `bin/fgos.mjs`
  (`can-i` outside a head) need edits outside the plan footprint, and that the `CHANGELOG.md` line belongs to phase 7.
  The commit by hand, from outside any confined head:
  `git -C /home/vantt/projects/forgent-worktrees/261124-0004-heads-operate-without-owner-p02 add -- Cargo.lock apps/fgos/src/routing.rs apps/fgos/src/wiring/unit_run_host/session_attempt.rs apps/fgos/src/wiring/unit_run_host/tests/session_attempt.rs docs/platform/run-supervisor/spec.md packages/git/node-addon/Cargo.toml packages/git/node-addon/src/lib.rs packages/host-runtime/contracts/command-manifest.json packages/host-runtime/contracts/command-routes.json packages/run-supervisor/contracts/envelope.v3.json packages/run-supervisor/contracts/head-request.v1.json packages/run-supervisor/rust/src/head_request.rs packages/run-supervisor/rust/tests/head_request.rs packages/session-host/rust/Cargo.toml packages/session-host/rust/src/lib.rs src/cli/command-registry.mjs src/native/door.mjs src/runner/dispatch/session-attempt.mjs src/session-host/head-grants.mjs src/session-host/head-request-client.mjs src/session-host/head-request.mjs src/session-host/head-start.mjs test/live/head-grant-probe.live.mjs test/session-host/head-grants.test.mjs test/session-host/head-request.test.mjs test/session-host/head-start.test.mjs packages/git/node-addon/src/session_host.rs packages/session-host/contracts/head-permissions.v1.json packages/session-host/rust/src/forwarder.rs packages/session-host/rust/src/permissions.rs packages/session-host/rust/tests/forwarder.rs packages/session-host/rust/tests/permissions.rs  && git -C /home/vantt/projects/forgent-worktrees/261124-0004-heads-operate-without-owner-p02 commit -m "feat(session-host): one argv window and one permission table in Rust for head requests"`
- 2026-11-25 11:45 (lead): fix unit `c-29218-1795579848109` (unit run `unit-run-1795579848585-91460c18`) passed on its
  fallback round (`producer/1-fb1`, claude sonnet, 8 min) and closed the reviewer's holes: `--dir` refused,
  `protectedConfigPaths` as real key paths compared by segment, `config patch <file> [--reason]` with a private copy.
  The runner's commit failed again (`commit-failed:git-error`), and this time git's error was kept: the pre-commit
  doc check refused `docs/platform/run-supervisor/spec.md:377` with "`fgos can-i` is not a verb of the command
  listing". The listing is the ACTIVE release's `fgos --help --json`, which cannot have `can-i` until this branch
  ships, so this was also the lost cause of the first commit failure. 9 paths are uncommitted and baseline-dirty, so a
  rerun would commit nothing. Asked the owner `q-hwtikojjei`. Its recommended option, run from outside any head:

```bash
sed -i '377s/`fgos can-i` hỏi cùng hàm đó/khung `can-i` hỏi cùng hàm đó/' /home/vantt/projects/forgent-worktrees/261124-0004-heads-operate-without-owner-p02/docs/platform/run-supervisor/spec.md
git -C /home/vantt/projects/forgent-worktrees/261124-0004-heads-operate-without-owner-p02 add -- Cargo.lock docs/platform/run-supervisor/spec.md packages/run-supervisor/contracts/head-request.v1.json packages/run-supervisor/rust/src/head_request.rs packages/session-host/contracts/head-permissions.v1.json packages/session-host/rust/Cargo.toml packages/session-host/rust/src/forwarder.rs packages/session-host/rust/src/permissions.rs packages/session-host/rust/tests/forwarder.rs && git -C /home/vantt/projects/forgent-worktrees/261124-0004-heads-operate-without-owner-p02 commit -m "fix(session-host): close the argv window's deny-rule holes for --dir, real protected config paths and the patch file"
```
- 2026-11-25 11:40 (lead): review of the uncommitted fix (both crates' tests green). Closed: `--dir` and the other
  root flags in both forms, segment comparison through `fgos_yaml_doc::path::parse_path`, the `config patch` shape and
  private copy, the `supervisor raise --kind` and `--delivered-to main` limits, and the value checks (the host owns
  `--text` 4096, `watcher tune --set` and `metrics prune --settled`). One blocking gap, verified by the lead in
  `core/config-schema/`: `protectedConfigPaths` misses keys marked `x-fgos-sensitivity: command` with scope `both`
  (`worktreeSetup.commands`, `invariantChecks.commands`, `runner.capabilities.*.verify`, `runner.executor`), so a
  supervisor's `config patch` could plant shell the host runs outside the sandbox. Next, after the owner's commit
  (`q-hwtikojjei`): one more fix unit in p02, which commits normally from a clean baseline. It derives the guard from the
  schema's `x-fgos-sensitivity: command` marker (one source) or adds those four paths. It also points the contract prose
  in `head-request.v1.json` at the table instead of copying the list (`runner.confinementPolicies` is missing there),
  removes the stage file only on a successful `create_new`, and opens intermediate path components with no-follow.
