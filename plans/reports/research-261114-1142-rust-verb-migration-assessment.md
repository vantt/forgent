# Research: moving legacy-cli verbs to the Rust host

Date 2026-11-14 (Asia/Saigon). Read-only research for the HARDEN lead (forgent-6a). Machine fg-server2 (24 cores). Nothing is committed.

**Baseline.** Code facts come from `origin/main` `4f76cb385`, which already holds T9 P10 (`daa6ef903`) and P25 (`47b721427`). I read it from a `git archive` copy in the scratchpad. The shared main checkout sits about 20 commits behind (`bdf4a6f98`), and I did not pull it. Timings come from the activated release `sha256:9d52c6af…` (`v0.2.0-rc.8`) at load 0.6 to 2.4, except where a row says otherwise.

**Corrections to the brief.**
- `origin/main` has **82** selectors: 74 `legacy-cli`, 8 native. `preflight` was retired by P10. `bin/fgos.mjs` is **4,310** lines.
- YAML parsing is **not** Node-only. RUL108 (2026-10-23) put every parse behind the Rust `fgos-yaml-doc` crate through the addon's `yaml` namespace. The lead's project memory note "YAML is vendored js-yaml" is out of date.
- `fgos hook` does **not** run on every git commit in a project that uses fgOS. It runs on agent tool calls:
  - `mailbox`: every tool call. Already native.
  - `dispatch-decide`: every Agent or Task call.
  - `decision-question`: every AskUserQuestion call.
  - `main-checkout-delete-guard`: every Bash call that matches the shell prefilter.

  The git `pre-commit` hook is this repository's own Node script, `.githooks/pre-commit`. `installGitHooks` wires it only into a repository that has a `.githooks/` directory. It calls native host routes (`internal lock-fd`, `identity`), not `fgos hook`.

## 1. Prior art (what exists and why)

| Source | What it settles |
|---|---|
| `docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md` §1–15 | The chosen direction is "Option B": the Rust host comes first and Node stays the legacy payload. The rules: migrate complete use-case boundaries, readers before writers, and never dual-run a write. Node is removed only when zero routes remain and replay, doctor and rollback have proof. §8: `ready` is not a first proof because it pulls the Work read model. §11 lists the gates a writer must pass. |
| `history/host-invocation-baseline.md` | The 2026-09 readiness classes: near-thin, partly-thin and not-thin. The doc itself marks them as stale ordering signals. |
| `host-invocation-routing/spec.md` §5 (Legacy Compatibility Rule) | A `legacy-cli` selector never enters `InvocationService`. The host may not parse its flags, mint a `legacy.<verb>` operation, or wrap its envelope. |
| `contracts/command-route-descriptor.md` | One descriptor per selector. `native_kinds` is allowed only on `legacy-cli`, and `command-routes.test.mjs` holds it to `hook` alone. |
| `git log -S route_kind` | Selectors flipped so far: version, gate-bypass, metrics/friction (`120af6b3d`, the only component moved wholly into Rust), convention (`7e5861303`), identity (`5e7e299ca`), mailbox and `hook mailbox` (`4cde1feee`), config (`5be65b72a`). `3a479738c` sent `--help`/`-h` to the **legacy-node manifest door**, so help for native verbs still needs Node. |
| `git log -S legacy_exec` | HARDEN T9 council (`4d70ac957` baseline, `10515af05` speed seat, `d6609d091` arbitration). Owner decision 81 Q4 dropped the host's self-hash and the double addon read (`verify_release_files_except_running`, now on main) and refused a fingerprint cache. |
| HARDEN owner decisions 76(b), 77, 78 | **76(b): "no native Rust hook unless a CLI cannot carry it"**, which today blocks hook ports. 77: the layer order is T0/T1 → T2 → T3 → T4 → T5 → T6 → T8, with Work last. 78: a Work council comes before any Work change. |
| `test/rust-host/harness.mjs` (1,012 lines) | A black-box differential harness, `node:` entry against `bin:` entry. It compares exact bytes, semantic JSON, fs-delta, the child-process spy, signals and timing. Its coverage floor is shallow: `--help` for each selector plus about 10 cases. This is the parity tool to reuse. Do not build a new one. |
| `test/rust-host/invocation-root-table.test.mjs` | A shared fixture table (T9 P02) that proves Node `resolveInvocationRoot` and the Rust walk agree. It is reusable as-is. |

What was reused, then: the route descriptor and its generator `scripts/export-command-selectors.mjs`, the `native_kinds` pre-composition lane, the native lane (`InvocationService`, `cli_projector`/`cli_presenter`), the parity harness and the root fixture table. What is missing is listed in §6.

## 2. Measured cost per call

Quiet machine (load 0.6 to 2.4), 13 to 15 runs per row, median wall time, through the workspace shim.

| Call | ms | Note |
|---|---|---|
| `node -e ''` | 19 | Node floor |
| `fgos config show --json` (native) | 24 | native floor. `version` swings 20 to 80 ms (sys time); that is not the host floor |
| `fgos hook mailbox` (native) | 24 | runs on every tool call |
| `fgos --help` (legacy) | 116 | payload run directly by node: 81. **Host overhead on a legacy route is now 35 ms** (it was 55 before P12) |
| `fgos hook decision-question` | 116 | the verdict needs 160 lines (`src/state/decision-question.mjs`, pure) |
| `fgos hook main-checkout-delete-guard` | 133 | the verdict needs 2 files, 563 lines |
| `fgos hook dispatch-decide`, Read payload | 122 | allowed early, but still pays the full import |
| `fgos hook dispatch-decide`, Agent payload | 180 | runs `decide` → `bind()` |
| `fgos dispatch decide --for judge` | 197 | |
| `fgos tool query`, `fgos agents list` | 172, 180 | |
| `fgos lock-status` | 368 | sandboxed Git and the store open dominate |
| `fgos ready`, `fgos schedule` | 719, 709 | the Work replay dominates |
| `fgos git status`, `fgos events status` | 4,473, 2,977 | the work itself dominates (load 2 to 7) |

**How often the hooks fire.** I took the last 22 Claude transcripts of this repository and replayed the Bash prefilter from `.claude/settings.json` over 31,000 Bash calls. **30 % (9,210) match** and start the delete guard. The same sessions made 909 Agent calls and 95 AskUserQuestion calls.

**Native vs legacy.** A native verb costs about 20 to 25 ms. A light legacy verb costs about 115 to 200 ms, of which about 35 ms is the host and about 60 to 160 ms is the Node import. The `main()` closure is still 366 files and 97k lines on `origin/main`.

**Value per port:**
- Delete-guard port: about 110 ms × 9,210 calls ≈ **17 minutes of agent wait** in those 22 sessions.
- `dispatch-decide` port: about 155 ms × 909 ≈ 2.3 minutes.
- `decision-question` port: about 95 ms × 95 ≈ 9 seconds.
- Heavy verbs (`git status`, `events status`, `ready`, `lock-status`): porting them saves at most about 100 ms, under 3 % to 25 %. Moving them buys "Node-free" and "one language", not speed.

## 3. Per-verb inventory

Column notes:
- **Node code.** The arm in `bin/fgos.mjs` (line count includes trailing comments), the use-case modules it calls, and the transitive static and dynamic import closure from those modules (my script, `scratchpad/closure.mjs`).
- **Rust today.** Crates or addon namespaces that already answer the facts the verb needs.
- **Effort.** Lead-days for one verb: port, parity cases, flip, then retire the Node arm and the Node tests that belong to it (design principle 8). Rough, ±50 %.

### 3.1 The verbs named in the brief

| Verb | Node code it owns | Rust that already serves it | Still Node-only | Black-box parity candidates | Benefit to projects | Effort |
|---|---|---|---|---|---|---|
| `--help`, `-h`, `<verb> --help` | `src/cli/command-registry.mjs` 2,731 lines (manifest), render code in `bin/fgos.mjs` `publicManifestEntries`…`handleVerbHelp` (~150) | none; the host sends help to legacy for **native verbs too** | the whole verb manifest | `test/rust-host/help-routes.test.mjs` (159), `test/cli/fgos-help.test.mjs` (135), `fgos-manifest.test.mjs` (262), `fgos-verb-help-json.test.mjs` (218), harness coverage-help cases (exact bytes, every selector) | 116 → about 22 ms. **Prerequisite** for any Node-free verb, because help of a native verb needs Node today | 3 |
| `hook` (`decision-question`) | `src/runner/hook.mjs` 91 (normalizer, protocol) + `src/state/decision-question.mjs` 160; arm `handleHook` (~40) | none (the `mailbox` and `mailbox-sync` kinds are native) | the verdict | `test/scripts/decision-question-hook.test.mjs` (105), state unit tests; agy and standard payload vectors | 116 → about 24 ms on each AskUserQuestion | 1.5 |
| `hook` (`main-checkout-delete-guard`) | `scripts/main-checkout-delete-guard-hook.mjs` 58 + `src/git/main-checkout-delete-guard.mjs` 505 (a shell-text judge); spawned as a **second Node** | `fgos-git` for the main-checkout facts | the shell-command lexer/judge | `test/git/main-checkout-delete-guard.test.mjs` (194), `test/scripts/main-checkout-delete-guard-hook.test.mjs` (46); turn them into a shared vector file both sides read | 133 → about 24 ms on about 30 % of Bash calls (largest measured saving) | 3.5 |
| `hook` (`dispatch-decide`) | `src/runner/dispatch/hook.mjs` 65 → `decide.mjs` 272 → `bind()` 607 + runner config 787; closure 114 files, 29k lines | `fgos-seat-binding` (policy and rank, pure), `fgos-config` (effective values) | `bind()`, runner config normalization (`withDefaultExecutor`, capabilities), executor registry, herdr detection | `test/scripts/dispatch-decide-hook.test.mjs` (168), `test/runner/config-seat-binding-layers.test.mjs`, `fgos dispatch decide --json` vectors | 180 → about 25 ms on each Agent/Task. **Comes free once `dispatch decide` is native** | 1 after `dispatch decide` |
| `dispatch` | arm 152; `decide.mjs` 272, `cli.mjs` 303, `work-dispatch.mjs` 528, `explain.mjs` 122, `src/verbs/dispatch/*` 806; closure 203 files, 53k | seat-binding, run-supervisor (`internal supervise/adopt/attempt-step`), terminal-control, holder-lock, process | `bind()`, runner config, assignment and reconcile planners, provider probes, Work lookup (`--work`) | `test/cli/dispatch-*.test.mjs` (4 files), `fgos-disconnected-worktree-guard`, runner dispatch tests | `decide`/`explain`: 197 → about 25 ms and the hook above. `inspect`/`reconcile`/`recover`/`watch`/`show-run`/`probe-*` read the runner's run records and need the runner model | `decide`+`explain`: 10 (porting `bind`). The rest: part of the runner program |
| `run` | arm 25; `execution/run.mjs` 1,006, `run-request.mjs` 340, `case-admission-port.mjs` 329; **closure 190 files, 50k** (runner 32k) | run-supervisor (attempt process root, gate, step runner), agent-protocol, run-result, terminal-control, seat-binding, process, holder-lock, git (commit), durable-file | the whole Execution core: bind, assignment, provider adapters, confinement, prompt templates (`operation-prompt-templates.mjs` 562, `prompt-templates.mjs` 105), settlement, unit-run record, custody door | `test/workflow/workflow-runner-cli.test.mjs`, `test/runner/**`, e2e. Writer: fs-delta vectors only, never a dual run | Node-free `run` (Windows); start-up is noise next to an agent round | runner program (§5) |
| `workflow` | arm 111; `src/workflow/**` 7.3k (`propose.mjs` 631, loader 216, case-*); closure 208 files, 54k | as `run`; Workflow uses `runUnit` | Workflow loader and catalog, case store, gates, propose classifier; every sub reaches the runner | `test/cli/fgos-workflow*.test.mjs`, `test/workflow/**` | same as `run` | runner + workflow program |
| `schedule` | arm 12 → `computedSchedule` in `src/state/store.mjs` (2,069); closure 65 files, 14.6k | event-store (log), work-state (`gate-bypass` only) | the Work view and replay (`foldEvents`), dependency and footprint scheduling | `test/cli/fgos-setup.test.mjs` (incidental), `test/parity/*` (use case vs CLI), harness `coverage-read-ready` | 709 ms, dominated by replay; a Work verb | Work program |
| `tool` | arm 24; `src/state/tool-registry.mjs` 316 (closure 19 files, 2.7k) + `loadRunnerConfigForDir` (`dispatch/config.mjs` 787, closure 24k) | config (effective `runner.executors`), git (inspect), holder-lock | the executor normalization that `query` and `check` read; the probes in `check`; the local status overlay | `test/cli/fgos-tool.test.mjs` (231) | 172 → about 25 ms; agents and skills call `tool query` (AGENTS.md impact gate) | 4 (with a Rust executor-model subset shared with `bind`) |
| `init` | arm 5 → `src/verbs/state/init.mjs` 90; closure 73 files, 15k: machine id, legacy config settle, Event Store lock dirs, **`initStore` = `rebuild()` (Work replay)**, coexistence manifest, config files, Git recovery | identity (mint machine id), config (init and migrate), git (recovery), event-store (Linux) | Work store create/rebuild; coexistence manifest (`src/install/coexist.mjs`); harness detection | harness `coverage-isolated-write-init-then-add` (fs-delta), `fgctl-init*.test.mjs` (tail). **146 test files use `init` as a fixture step**, spawning `node bin/fgos.mjs` directly | Needed for a Node-free install: `fgctl init` runs `fgos init` → `doctor --json` → `doctor --fix` through the shim. Off Linux, init already skips the Work store (`628341ccf`) | 5 (hybrid, §6 contract 3); full native after Work |
| `setup` | arm 20 → `src/setup/setup-use-case.mjs` 92 (P10): rc line, hooksPath, Claude hook, `runFixes()` (**every doctor fix**), skill materialize (`skill-wrappers.mjs` 787); closure 202 files, 52k | config, git | everything `doctor --fix` does, plus skill rendering | `test/cli/fgos-setup.test.mjs` (300), `test/setup/checks-setup-*.test.mjs` | **Do not port.** It is deprecated, and the packaging vocabulary (host spec §9) says the target has no `setup` verb: `init` plus `doctor --fix` own its job. Retire it | 1 (delete and move callers) |
| `uninstall` | arm 12 → `src/setup/uninstall-project.mjs` 203; closure 84 files, 20k (agent hooks, git hooks, mailbox timer, shell rc, skill ownership) | distribution `uninstall.rs` (`fgctl uninstall` calls `fgos uninstall`), git (repository config) | removing agent hooks, skill ownership (`generatedSkillDirs`, marker), shell-rc detection, mailbox timer | `test/setup/uninstall-project.test.mjs` (213), `uninstall-wiring*.test.mjs` (3) | `fgctl uninstall` without Node; low frequency | 4 |
| `doctor` | arm 12 → `runDoctor` (`checks.mjs`) → `registrations.mjs` **3,819 lines, 91 `registerCheck`** + config rows from the Rust `doctor-rows.v1.json`; closure 201 files, 52k, **including `scripts/git-one-door-scan.mjs` 2.8k and `build-rust-distribution.mjs`** (maintainer scripts shipped in the product payload) | config (its rows already come from the crate), identity, holder-lock (`lock-borrow-vectors`), seat-binding (dry bind), run-supervisor, terminal-control, mailbox, distribution, event-store, git | every row that judges a Node component (runner config, confinement, workflow capabilities, skills, agent hooks, Work vocabulary) | `test/setup/**` (about 60 files), `doctor-fresh-run`, `doctor-strict-exit`, `fgctl-init-preflight-tail` | A Node-free install needs doctor (the fgctl tail). Speed: 17 s, dominated by rows, not start-up | 8 (hybrid composer, §6 contract 3); full native only when every component is native |
| `wire-agents` | arm 16 → `src/setup/agent-wiring.mjs` 242; closure 9 files, 1.2k; runs the external `claude` CLI | config | Claude, agy and omp settings writers, backup, plugin marketplace calls | `test/setup/agent-wiring.test.mjs` (268) | Node-free opt-in wiring; rare | 3 |
| `cleanup` | arm 74; `cleanup-harness.mjs` 589, `merge.mjs` 1,210, store; closure 77 files, 18k | git (branch delete), holder-lock | Work lifecycle move, cleanup readiness, beacon | `test/cli/fgos-post-merge*.test.mjs`, e2e | a Work verb | Work program |
| `agents` | arm 7; `src/runner/agent-listing.mjs` 119 (closure 10 files, 932); the arm imports `execution/run.mjs` (closure 177 files) **only for `resolveGitRoots`** | git (roots), convention, YAML door | three-tier persona reader | `test/runner/agent-listing.test.mjs`, `subcommand-flag-drift` | 180 → about 25 ms; small and self-contained | 2 |

### 3.2 The remaining 74 selectors, in groups

| Group | Selectors | Node owned | Rust today | Blocker | Effort |
|---|---|---|---|---|---|
| **Already native (8)** | config, convention, friction, gate-bypass, identity, mailbox, metrics, version | — | own crates | their `--help` still goes to Node | — |
| **T0–T3 platform verbs over existing crates** | `lock` (fence), `lock-status`, `git` (status, recover), `worktree` (create, remove), `events` (sync, status, seal, export), `session`, `gateway` (start, stop, status), `resync-worktree`, `main-checkout-reset` | arms 7 to 36 lines each; use cases `lock-status.mjs` 342, `lock-fence.mjs` 197, `git/status.mjs` 116, `verbs/worktree/*` 85, `verbs/events/*` 73, `session.mjs` 517, `gateway-control.mjs` 401. Each closure is about 15k lines **only because `src/runner/paths.mjs` → `worktree.mjs` → `src/state/store.mjs` pulls the Work store** | holder-lock, git (inspect, recovery, Worktree port, sync), event-store (seal, publish, sync, export), process, durable-file | `lock-status` reads claims (`runtime-coordination`) and run-supervisor records. `session` keeps a registry. `main-checkout-reset`/`resync-worktree` mix policy (the old not-thin class). Store-touching verbs need F0d | 2 to 3 each; about 18 for the group |
| **Execution/Workflow** | `run`, `workflow`, `dispatch` (except decide/explain), `hook dispatch-decide` | §3.1 | §3.1 | the runner (43k) and workflow (7k) | runner program |
| **Work lifecycle (about 41)** | add, submit, discover, plan, move, edit, list, show, ready, graph, gate-check, gate-approve, stale, slots, report, conflicts, recheck-blocked, schedule, take, pick, return, merge, review, approve, reject, catchup, sync-root, promote-to-component, triage, goal, cleanup, retrospective, ask, answer, handoff, handoff-return, resolve-park-reason, rollup, unclaim, rebuild, plan-lint | about 2,350 arm lines (`return` alone is 365) + `src/state` 11k, `src/intake` 2k, `src/verbs/state`, `merge.mjs` | event-store (log transport), work-state (gate-bypass read) | the Work core (replay, frontier, lifecycle FSM, claims). Decision 78: Work council first; decision 77: Work last. `ask`/`answer` must return `parked` (migration doc §9) | Work program |
| **Knowledge/docs (about 11)** | topic, doc, knowledge, doc-registry, compound, decision, decision-index, context-render, docs-index, doc-sources, authoritative-match | about 800 arm lines + `src/report` 2k; the `decision` arm statically imports a maintainer scanner (F-2 of the T9 speed seat) | none | Work-store writers (`*DocStore`, `addDecision`); owner U1 left them with Work | Work program |

## 4. Proposed order (foundational first)

This order follows decision 77's layering. A step that only moves a verb is a thin port over an existing crate. A step that needs a shared Node module ported first is marked **needs a port**.

| Step | Contents | Blocked by | Days |
|---|---|---|---|
| **F0 Host foundations** (no verb flips; every later step needs them) | **(a)** The verb manifest becomes generated data that the host embeds, generated from `command-registry.mjs` the way `command-routes.json` is. The host answers `--help`/`-h`/`<verb> --help` for **every** selector, so help stops needing Node. **(b)** The descriptor grows from `native_kinds` (hook only) to per-subcommand native routing, so `dispatch decide`, `worktree create` and `tool query` can move without their siblings. **(c)** Parity lane: per-verb case tables in `test/rust-host/harness.mjs`, and `test/cli/helpers/fgos-cli-harness.mjs` `run()` able to go through the dev host, because 117 test files spawn `node bin/fgos.mjs` directly. **(d)** The cross-cutting `main()` doors move into the host, done once: invocation root (P02 table), store admission (`admitStoreAccess`), fault record (`recordInvocationFault`), and the Event Store lifecycle trigger (spec §16 seal and publish). Needed only before the first store-touching native verb. | T9 close (`main()` doors settled by P02/P04); owner Q3 only for the bridge | 11.5 (+2 for F0e if Q2 = a) |
| **S1 Hook verdicts** | `hook decision-question`, `hook main-checkout-delete-guard`, through `native_kinds` (no new route type) | **owner decision 76(b)** (Q1) | 5 |
| **S2 T0–T2 verbs** | `lock`, `lock-status`, `git`, `worktree` | F0 (a, b, c); F0d for `lock-status` | 8.5 |
| **S3 T3 verbs** | `events`, `session`, `gateway`, `agents` | F0d | 10 |
| **S4 Install surface** | retire `setup`; `wire-agents`; `uninstall`; `init` (hybrid); `doctor` (hybrid composer; rows that Rust components own are answered natively) | Q3 (bridge) for `init`/`doctor`; Q2 decides whether `requires.node` becomes per-route | 21 |
| **S5 Execution read door (needs a port)** | `bind()` + the runner executor model in Rust (Execution authority; reuses `fgos-seat-binding`) → `dispatch decide`, `dispatch explain`, `hook dispatch-decide`, and `tool` on the same executor model | T5 authority settled (AU-15/16/17 landed in T9); executor-model contract (§6 contract 5) | 15 |
| **S6 Execution and Workflow (needs a port)** | runner (43k), workflow (7k), remaining `dispatch` subs, `run`, `workflow`, the `fgos-runner` entry | S5; Q2 | 60 to 120 (very rough) |
| **S7 Work and Knowledge (needs a port)** | the Work core in Rust (replay first, writers later, with §11 writer gates), then the about 52 Work and Knowledge arms | Work council (decision 78); migration doc §10–11 | 40 to 80 (very rough) |

F0 through S4 is about **56 lead-days** (with S5, about 71). Each flipped verb drops to the about 20 to 25 ms native floor.

**Verbs that can never leave Node without porting a large shared module:**
- `run`, `workflow`, `dispatch` (except decide/explain), and `fgos-runner` need the runner and workflow.
- About 52 Work and Knowledge arms, and full `doctor`/`init`, need the Work core (`src/state`).
- `hook dispatch-decide`, `dispatch decide` and `tool` need the runner's `bind()` and executor model (S5; a bounded slice of about 1.4k Node lines plus its config closure).

**Addon seams.** S1 to S5 remove the Node→addon crossing for each verb they move, but **no addon namespace can be deleted** until the runner and Work move. Every namespace (git, eventStore, holderLock, process, config, yaml, runResult, durableFile, sessionIdentity, canonicalJson) still has callers there.

## 5. Benefit for projects, by goal

| Goal | Reached at | Honest limit |
|---|---|---|
| Hook latency (every agent session) | S1: delete guard −110 ms on about 30 % of Bash calls, decision-question −95 ms. S5: dispatch-decide −155 ms per Agent call | `mailbox` is already native (24 ms) |
| Help and light-verb latency | F0a (help for all 82), S2–S4 | Heavy verbs are dominated by Git, replay and rows, not start-up |
| Windows install without Node | F0 + S4 + contract 4 (`requires.node` per route): `fgctl init` → `init`/`doctor` and the hooks run without Node | **A Node-free Windows project still cannot `run` or `workflow`**, nor use any Work verb, until S6/S7. Skills call `fgos run`, `workflow` and `dispatch decide`, so the product is not usable without Node before S6 |
| Fewer Node/Rust seams | each moved verb stops crossing Node→addon and Node→host-internal-route | The addon and its staging stay until S6+S7 |

## 6. Contracts that must change

1. **Command route descriptor** (`contracts/command-route-descriptor.md`, `scripts/export-command-selectors.mjs`, `command-routes.test.mjs`): per-subcommand native routing replaces "`native_kinds` on `hook` only". One field, and the generator and the drift test move with it (L10: no second field beside it).
2. **Help/manifest door** (`3a479738c`; `contracts/legacy-payload.md`; `help-routes.test.mjs`): help moves from the legacy-node payload to a host-embedded, generated manifest. `command-registry.mjs` stays the single source. The JSON is generated, never hand-kept (design principle 7).
3. **Legacy Compatibility Rule** (host spec §5): it has no shape for a native verb that still needs one Node sub-step (`init`'s Work store rebuild, `doctor`'s Node-owned rows). Migration doc §7.4 names a "per-operation Node semantic bridge" for the gateway only. If Q3 = a, it needs a contract: one bridge operation, structured output (never parsed `fgos.v1` stdout), deleted when its last user goes (L10).
4. **Release manifest `requires.node` and the `fgctl init` preflight** (`packages/distribution/rust/src/init.rs` `check_node_requirement` → `runtime-dependency-missing`): today install refuses without Node. A Node-free install needs Node to become a dependency of the legacy routes only, with the host refusing a legacy route by a named error when Node is absent (`legacy_exec.rs` runs `Command::new("node")` from `PATH`, not the `resolvedDependencies.node` the activation records). This is a packaging-spec change and needs a doctor row (Install/setup/doctor gate).
5. **Runner executor model** (S5): `loadRunnerConfigForDir` normalization (defaults, `withDefaultExecutor`, capabilities) is today a Node-only reading of `runner.*` on top of the config crate. A Rust port needs it written down as a versioned contract (owned by Execution per decision 82) so that Node `bind()` and Rust `bind()` cannot drift while both exist.
6. **Test-harness contract** (not a product contract): CLI tests spawn `node bin/fgos.mjs`. Each flip moves that verb's tests to the host or to Rust vectors, and retires the Node copies in the same change (design principle 8).

Unchanged and reused as-is: the `fgos.v1` envelope (`cli_presenter`, `envelope-contract.test.mjs` vectors), the exit-code table (P01/P12), and the invocation-root fixture table.

## 7. Trade-offs of the two design forks

| Fork | Option | Speed for projects | Complexity | Risk | Fit (L10, RUL104) |
|---|---|---|---|---|---|
| Hybrid verbs (`init`, `doctor`) | (a) bridge one Node sub-step | Node-free install possible on non-Work paths early | +1 bridge contract, removed later | two code paths live during the window | allowed if it is the door's own transitional shape and is deleted with its last user |
|  | (b) wait until every dependency is Rust | `init`/`doctor` move last (after S7) | none now | install stays Node-bound for the whole program | strictest; contradicts "foundational first" for these two |
| Node-free Windows | (a) foundation only (install, diagnose, hooks) | install friction removed; tasks still need Node | contract 4 + doctor row | users may read "Node-free" as "usable without Node" | moderate |
|  | (b) keep Node required until S6 | none for Windows until the runner moves | none | none | simplest |
|  | (c) commit S6 now | full Node-free product at the end | 60 to 120 days | largest port; replay and writer gates | the actual end state of the migration doc §12 |

## 8. Owner decisions

**Q1. Native Rust hooks (supersede decision 76(b)).**
- *What is happening:* the cheapest and largest measured win of the whole migration is moving two hook verdicts into the host: the delete guard (−110 ms on about 30 % of Bash calls, about 17 minutes of agent wait across the last 22 sessions) and decision-question (−95 ms).
- *Cause:* decision 76(b) (2026-11-09) says "no native Rust hook unless a CLI cannot carry it". It was made for the T0–T6 open items, before a Rust-verb program existed.
- *Options:*
  - (a) Supersede 76(b) for the migration program. Cost: 5 lead-days (S1); the guard's 505-line judge gets one shared vector file.
  - (b) Keep 76(b) and leave the hooks in Node. Cost: about 110 to 180 ms per guarded call stays. The T9 in-process hook fix (F-3, no second Node) lowers it to about 55 to 70 ms at best.
- *Recommendation:* (a). The verdicts are pure, the native `hook mailbox` lane already exists, and the saving is per agent call in every project.
- *Scope of the answer:* the hook kinds `decision-question` and `main-checkout-delete-guard` now; `dispatch-decide` when S5 lands.

**Q2. What "Windows without Node" commits the program to.**
- *What is happening:* the owner's order is foundational verbs, then Windows. A Node-free Windows install is reachable after F0+S4 plus contract 4. A Node-free Windows *product* needs the runner and workflow (S6, 60 to 120 days), because skills and users call `run`, `workflow` and `dispatch`.
- *Cause:* the runner (43k Node lines) is the shared module under `run`, `workflow` and most of `dispatch`.
- *Options:*
  - (a) Target Node-free install, diagnose and hooks only. Change `requires.node` to per-route (contract 4). Cost: about 2 days plus a doctor row; projects still install Node to run tasks.
  - (b) Keep Node required everywhere until S6. Cost: none now; no Windows benefit before S6.
  - (c) Put S6 (runner and workflow) into this program's scope now. Cost: 60 to 120 lead-days after S5.
- *Recommendation:* (b) for now. Run F0–S5 for speed and foundations, then decide (c) with S5's measured port pace in hand. (a) alone gives Windows users an install that still cannot run a task.
- *Scope of the answer:* program scope and the packaging contract for `requires.node`. The order F0–S5 does not depend on it.

**Q3. Hybrid native verbs with one Node sub-step.**
- *What is happening:* `init` (Work store rebuild) and `doctor` (rows that judge Node-owned components) cannot be fully native until S7, but they sit on the install path.
- *Cause:* host spec §5 forbids routing legacy work through the native kernel, and the only named bridge (migration doc §7.4) is for the gateway.
- *Options:*
  - (a) Allow one "Node semantic bridge" contract (§6 contract 3), deleted with its last user. Cost: about 2 days of contract and proof inside S4; two paths live during the window.
  - (b) No bridge: `init` and `doctor` move after S7. Cost: the install stays Node-bound for the whole program, and `init`/`doctor` stay the slow legacy path.
- *Recommendation:* (a) only if Q2 = (a) or (c). With Q2 = (b) the bridge buys nothing, so take (b) and keep `init`/`doctor` in Node until their components move.
- *Scope of the answer:* `init` and `doctor` only; no other verb needs a bridge in F0–S5.

## 9. Settled here (no owner ask)

- **`setup` is retired, not ported.** The packaging vocabulary (host spec §9; `fgctl init` runs `init` → `doctor --fix`) already says the target has no `setup` verb, and the registry marks it deprecated.
- **Parity tool.** Use the existing `test/rust-host/harness.mjs` (`node:` against `bin:`, fs-delta for writes in isolated temp stores). Do not dual-run writes (migration doc §11). Every flip retires the Node arm, its Node tests and its registry entry in the same change (L10, design principle 8).
- **Order inside F0.** (a) manifest → (b) descriptor → (c) parity lane → (d) host cross-cutting, the last only before the first store-touching verb.
- **The `agents` arm.** It imports `execution/run.mjs` (closure of 177 files) only for `resolveGitRoots`. Whoever ports it reads roots from `fgos-git`. The same tangle (`src/runner/paths.mjs` → `worktree.mjs` → `store.mjs`, which drags the Work store into every non-Work verb) is a RUL11 mess inside T9's scope. I report it to T9 and propose no fix here.
- **Maintainer scripts in the payload.** `src/setup/registrations.mjs` imports `scripts/build-rust-distribution.mjs` → `scripts/git-one-door-scan.mjs` (2.8k lines) into the shipped payload. It does not block the migration, but a native doctor must not copy it. Noted for the packaging lane.

## 10. Limits of this research

- Effort figures are judgement (±50 %) and are not calibrated against past Rust ports. A calibration point would be Observe (7k Rust lines, `120af6b3d`) or config (`5be65b72a`); I did not reconstruct their lead-days.
- I ran no Rust build or Rust tests: a cargo build is heavy on a shared machine, and the brief is read-only.
- Import closures are static and dynamic-import text scans. Lines are counted with comments, so they overstate Node logic. Run-time module counts (the T9 speed seat measured 207, 263 and 272) are a better load signal.
- The hook frequency comes from this repository's own 22 transcripts, an agent-heavy fgOS-on-fgOS workload, not from external projects. The payload was rebuilt from transcript inputs, so the 30 % prefilter rate is approximate.
- I did not measure on Windows. The Windows claims come from code (`init.rs` Node preflight, `628341ccf`) and the packaging spec.
- I measured `git status`, `events status` and `session list` at load 2 to 7, while another lane started work.

## 11. Unresolved questions

- Is the Execution executor model (§6 contract 5) owned by the T5 Execution spec or by Config? Decision 82 points to Execution, but no spec section names `runner.executors` normalization.
- Does `lock-status` need the claims runtime (`src/state/runtime-coordination`), which is Work-adjacent? If so, it moves with Work, not in S2. I did not trace it to the end.
- Does the release manifest schema carry `requires.node` as a versioned field that fgctl of an older release reads? If so, contract 4 needs an fgctl compatibility note (decision "machines upgrade together" may make this moot).
- Evidence scripts: `/tmp/claude-1000/-home-vantt-projects-forgent/8e8e56bb-00a0-4158-ad04-ec29cabf8204/scratchpad/{bench.py,closure.mjs,path.mjs,prefilter.py}` (session scratchpad, not committed).
