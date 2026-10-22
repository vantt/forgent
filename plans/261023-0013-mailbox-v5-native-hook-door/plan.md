---
title: "Mailbox V5: the native `fgos hook mailbox` door, the hook install table, the real send and inbox verbs, and the hook cost in each CLI"
description: "Build rung V5 of the Agent Mailbox ladder on branch mailbox/v1-v3: the host serves `fgos hook mailbox` natively and hands every other hook kind to legacy-node; `fgos mailbox send|inbox [--claim]` become native verbs; the record directory comes from the existing main-checkout resolver; the four hook install functions become one table with the mailbox rows and the doctor probe; the mailbox keys register into setup; V4's live suite re-runs through the real entry with benign content; and the no-mail hook p95 is measured inside Claude Code and Codex against 50 ms."
status: pending
priority: P1
effort: ~4d (9 phases, strictly sequential)
branch: main (plan only); all code on branch mailbox/v1-v3 in linked worktree /home/vantt/projects/forgent-mailbox, never merged to main by this rung
tags: [mailbox, rust, hooks, host-routing, setup, doctor, live-test, claude, codex, feature, tdd]
blockedBy: [261022-1501-mailbox-v4-claude-live-end-to-end]
blocks: []
created: 2026-10-23
---

# Mailbox V5: the native hook door and the product verbs

Planned on main `dfe2fd2d1`, 2026-10-23 00:13 Asia/Saigon, from branch `mailbox/v1-v3` at `9bb562808`. That branch is behind `origin/main`, and a V4 fix step runs on it before V5 starts. Read the spec on the branch: `git -C /home/vantt/projects/forgent-mailbox show HEAD:docs/platform/agent-mailbox/spec.md`. The sections that matter are §4.1, §5.1, §6.1, §6.2, §6.4, §7.1, §7.3–7.4, §8, §11, §12, §14 (the V5 row and its prerequisites), §15.8 and §17.

Inputs:

- the V4 plan, [`../261022-1501-mailbox-v4-claude-live-end-to-end/plan.md`](../261022-1501-mailbox-v4-claude-live-end-to-end/plan.md);
- the V4 independent review, [`../261022-1501-mailbox-v4-claude-live-end-to-end/reports/code-review-v4.md`](../261022-1501-mailbox-v4-claude-live-end-to-end/reports/code-review-v4.md) (on main);
- the V4 closing report `plans/reports/closing-261022-2306-mailbox-v4-claude-live-end-to-end.md` (branch only);
- the probe report `plans/reports/research-261022-1751-mailbox-v4-hook-process-probe.md` (branch only);
- the live report `plans/reports/research-261022-1825-mailbox-v4-live-suite.md` (branch only).

Board row `MAIL`. The controller edits the board; a phase never does.

## Outcome

1. **The product hook door.** `fgos hook mailbox --cli <claude|codex> --event <stop|post-tool-use>` runs natively in the Rust host. Every other `hook` kind (`dispatch-decide`, `decision-question`) still goes to legacy-node through `legacy_exec`. The split is declared data in the route table (`native_kinds`), not a hidden branch.
   - The entry prints the CLI's hook shape and exits 0 on every path, usage errors included (review H1).
   - Its record directory is `<main checkout>/.fgos`, found by the Git component's disk-only read (no subprocess, no write), also from a linked worktree.
2. **The product verbs.** `fgos mailbox send --to <name> [--wake] [--reply-to <id>] <body>`, `fgos mailbox inbox` (read-only) and `fgos mailbox inbox --claim` (claim, emit, finish) are native verbs. They print the contract sentences and accept `--json`. The recipient's CLI version reaches the delivery report (the untested-version clause).
3. **The entry is correct in a real hook environment:**
   - a per-CLI caller check that a tool's login shell cannot pass where only the hook's shell should (M3);
   - a Codex head that must be the Codex executable, so a subreaper never registers (M4);
   - the Codex writer key comes from the payload, with the `WriterMismatch` guard kept;
   - `att-` runner heads are quiet and never registered;
   - a `PostToolUse` output bound taken from the adapter contract, so Claude Code never moves mail to a file while the mailbox marks it offered (blocker);
   - a circuit breaker;
   - limits come from a real loader: the embedded contract plus project config, never test support (L6);
   - the mailbox lock is taken with nothing else held.
4. **The install and setup door.** `src/setup/agent-hooks.mjs` becomes one table (CLI × kind × event × file × JSON shape). The table carries the `mailbox` rows for Claude Code and Codex, a `commandIsKind` that knows `--cli` and `--event`, and a doctor probe that runs the mailbox kind with benign input. Every `mailbox.*` key registers into `fgos setup` config-merge from the limits contract.
5. **Live proof through the real entry** (benign content only):
   - V4's L1 and L2 re-run on Claude Code, plus one Codex case, through a private shim and a private release directory that no shared activation sees;
   - the no-mail hook p95 measured inside each CLI's real hook environment against `mailbox.hook.p95TargetMs` (50 ms).

**V5 does not prove:**

- idle wake (no `Nudge` channel is built; every tier stays `turn`; owner question 1);
- behaviour of models under adversarial or many-cell conditions (V6);
- the Codex adapter as supported (V7);
- agy (deferred in `adapters.v1.json`);
- `list` and `status` (V7 thresholds; not in the V5 row);
- the doctor check of spec §12 (V7);
- any guard against same-user processes;
- the install default after a merge to main (owner question 2).

## Where the code lives (owner, unchanged)

- Code, contracts and doc updates live only on branch **`mailbox/v1-v3`**, in the worktree **`/home/vantt/projects/forgent-mailbox`**. Every phase commits there and pushes the branch.
- **Nothing merges to main.** Only this plan directory goes to main, and the controller commits it.
- Never commit, stash or check out in `/home/vantt/projects/forgent`.

## Branch sync rule (owner)

Sync by merge, never rebase:

```bash
cd /home/vantt/projects/forgent-mailbox || exit 1
git fetch origin && git merge --no-edit origin/main
```

**At the start and at the end of every phase.**

- End-of-phase order:
  1. commit;
  2. fetch and merge;
  3. run the phase proof;
  4. commit any regenerated census, lock or route file;
  5. `git push origin mailbox/v1-v3`.
- If the merge brought changes, run the proof again.
- **A phase is done only when its proof is green on a fresh `origin/main` merge.**
- `Cargo.lock` conflicts: take main's lock, run `cargo build -p fgos-mailbox -p fgos` once without `--locked`, and commit the result in the merge.
- Mutation census: run `node scripts/git-one-door-scan.mjs --write-census` for every commit that adds or changes a hashed file.
- Generated routes: run `node scripts/export-command-selectors.mjs` (no flag writes; `--check` checks); never edit `command-routes.json` by hand.

**Shared-file check at every phase start and end:**

- run `git log --format='%h %ad %an %s' --date=iso origin/main -- <the phase's shared files>` since the previous sync;
- read the board's "File chung dễ va" and "Các luồng" rows;
- record what moved in the phase file's notes.

Owner rule: whichever lane lands later reviews the other's changes. MAIL does not land in V5, so MAIL is always the later side. On each merge, the phase lead reads every other lane's diff to these files and keeps both intents.

## Memory, process and shell rules (owner)

- Before every heavy gate, run `free -g | awk '/Mem:/{print $7}'`. It must print **8 or more**; otherwise stop and report.
- Heavy gates run one at a time: never `cargo test --workspace` together with `npm test`, and never during a live CLI run.
- Use `CARGO_BUILD_JOBS=4`, `cargo test … -- --test-threads=4` and `npm test -- --test-concurrency=4`.
- Long commands need an observable exit: the background-run facility, or `timeout` with output teed to `/home/vantt/projects/forgent-mailbox/.fgos/runtime/tmp/mailbox-v5/<step>.log` and `echo "exit=$?"` as the very next command. Never a bare `&`.
- Chain dependent steps with `&&`, and guard every `cd` with `|| exit 1`.
- Do not start an `fgos gateway`, herdr server or dev server unless a step names it. Stop what you start.

## Never activate a release from the branch (controller rule)

Plain `fgos` and the project shim `.fgos/installation/bin/fgos` are shared by every session on this machine.

- **Wiring and smoke checks** use `npm run fgos:dev -- <verb>` (AGENTS.md "Legacy-Node CLI Ownership Boundary"), or the host binary that `cargo test -p fgos` builds (`CARGO_BIN_EXE_fgos`).
- **Live runs** use a **private shim and a private release directory** inside each case's run directory:
  - the shim is a byte copy of the one `fgctl` writes, read-only from `/home/vantt/projects/forgent/.fgos/installation/bin/fgos`, with its sha256 recorded and compared with `fgos_distribution::shim::workspace_shims()`;
  - `activation.json` is the case's own and points `releasePath` at a directory whose `bin/fgos` is the branch-built host binary.
  - The hook command, and the `fgos` the model calls from a tool, go through that shim exactly as an installed project would, so the cost of the `sh` + `sed` + `exec` path is in the measurement.
  - Nothing under `~/.fgos`, the main checkout's `.fgos/installation`, `fgctl` or any activation is touched.
  - **Deviation from spec §14 V5 ("the V4 live suite through the shim"):** this is the same shim script over a release that is never activated anywhere. Phase 8 records the deviation in its report.

## Live-call rule

There is a fixed count and no retry loop anywhere. A failed case is reported with its evidence; it is re-run only when the controller says so, and the report then says it was a re-run. The harness writes `spawned.json` before each real CLI and refuses a case directory that already has one. Every case is dry-run first against a stub CLI.

**Benign content only (review H2).** No adversarial, hostile or untrusted peer text runs in V5. The live cases run full-bypass CLIs with the real `~/.claude` linked and no sandbox. Making that safe is a **precondition for V6**, which this plan records and does not build: confined CLI or no bypass, plus clean-up of `~/.claude/projects/<case>` (phase 9 writes it into spec §14 and the closing report).

| Phase | Run | CLI | Invocations |
|---|---|---|---|
| 2 | P1 Claude process probe: the hook's and the tool's ancestry (exe, comm, tty, session) | `claude -p` haiku | 1 |
| 2 | P2 Claude interactive probe in a herdr pane: the same facts in the REPL | `claude` haiku, pane | 1 |
| 2 | P3 Claude `PostToolUse` context ladder, 2,048 to 14,009 bytes, then a sibling-hook repeat | `claude -p` haiku | 1 |
| 2 | P4 Codex process probe: the hook's ancestry, the head's exe, a tool command's ancestry | `codex exec` | 1 |
| 2 | P5 Codex `PostToolUse` context ladder | `codex exec` | 1 |
| 8 | L1 Claude through the real entry: registration, mid-step, stop gate, `send`, `inbox`, `inbox --claim` | `claude -p` haiku | 1 |
| 8 | L2 Claude: the hook really ran (wrong-shape detector, mail retained) | `claude -p` haiku | 1 |
| 8 | C1 Codex through the real entry: registration from the payload, mid-step, stop gate, `send` | `codex exec` | 1 |
| 8 | T1 Claude hook cost: about 140 tool calls (N ≥ 80 steady no-mail, then held-back mail), traced | `claude -p` haiku | 1 |
| 8 | T2 Codex hook cost: the same as T1, traced | `codex exec` | 1 |
| | **Expected total** | | **10** (6 Claude, 4 Codex); at most 12, with only controller-authorized re-runs |

## Phases

| # | Phase | Proof | Live |
|---|---|---|---|
| 1 | [Sync, V4 fixes re-check, preconditions, shared-file announcement](phase-01-sync-v4-fix-recheck-and-preconditions.md) | baseline `cargo test -p fgos-mailbox -p fgos-mailbox-core -p fgos` green on fresh main; V4 fix checklist met; board text handed to the controller | 0 |
| 2 | [Measure first: resolver cost, process facts, output bound](phase-02-measure-resolver-process-facts-and-output-bound.md) | research report with the decision tables of this phase | 5 |
| 3 | [Contracts and core: adapter facts, keys, size-bounded claim, new texts](phase-03-contracts-and-core-bounded-claim-and-texts.md) | `cargo test -p fgos-mailbox-core`; `cargo test -p fgos-mailbox --test fixtures_contract` | 0 |
| 4 | [Store: real limits loader, breaker, runner heads, `inbox --claim`, versions](phase-04-store-limits-loader-breaker-runner-heads-and-claim.md) | `cargo test -p fgos-mailbox -p fgos-identity` | 0 |
| 5 | [Store: product ancestry, per-CLI caller check, Codex and Claude head finders](phase-05-store-ancestry-caller-check-and-head-finders.md) | `cargo test -p fgos-mailbox -p fgos-identity -p fgos-observe` | 0 |
| 6 | [Host: the native hook kind and the `mailbox` verbs](phase-06-host-native-hook-kind-and-mailbox-verbs.md) | `cargo test -p fgos`; `node --test test/rust-host/command-routes.test.mjs`; `npm run fgos:dev` smoke | 0 |
| 7 | [Hook install table, config registration, doctor probe](phase-07-hook-install-table-config-and-doctor-probe.md) | `node --test test/setup/agent-hooks.test.mjs test/setup/claude-code-hooks.test.mjs test/setup/registrations.test.mjs` | 0 |
| 8 | [Live through the real entry, and the hook cost in each CLI](phase-08-live-through-the-real-entry-and-hook-cost.md) | `node test/live/mailbox-claude.live.mjs run L1|L2|C1|T1|T2`; research report | 5 |
| 9 | [Branch docs, full gates, closing](phase-09-branch-docs-gates-and-closing.md) | workspace gates, run one at a time; `fgos convention check`; closing report | 0 |
| 10 | [V5 review fixes](phase-10-review-fixes.md) | `cargo test -p fgos-mailbox -p fgos-mailbox-core -p fgos -p fgos-git -p fgos-distribution`; `node --test test/setup/agent-hooks.test.mjs test/setup/registrations.test.mjs test/rust-host/command-routes.test.mjs`; workspace gates | 0 |

**Dependencies:** strictly sequential, and no phase runs in parallel with another (memory rule; the same shared files throughout).

- Phase 3 depends on phase 2's numbers: the hop shells, the head executable and the output bound go into the contract.
- Phase 6 depends on phase 2's resolver decision.
- Phase 8 depends on every earlier phase.

## Prior art (what existed, what is reused, what is missing)

Searched with `git log -S` on `native_kinds`, `hook mailbox`, `mint-attempt`, `resolve_workspace_root`, `CLAUDE_CONFIG_DIR`, `commandIsKind`, `registerConfigDefault`, `is_attempt_writer_id`, and on the V4 example name.

**Reused:**

- **V4 library code:**
  - `hook::shell::{run, arm_budget, silence_panics}`;
  - `head::{Ancestry, Topology, caller_is_head}`;
  - `adapters::claude_head::find_head`;
  - `verbs::{send, inbox}`;
  - the V2 `Record` hold API and `record/paths.rs`.
- **The main-checkout read:** the Git component's disk-only topology read (`fgos_git` `resolve_topology`, `driver.rs:418-463`), exposed as one public function (decision 3). `resolve_workspace_root`, the spec §6.4 correction's candidate, was rejected by the red team, because it spawns `git` and writes state (RT1).
- **Process facts:** `fgos_process::facts::{relation_of, view_of, identity_of}`. These give the parent, tty, session, start time and the `exe` path, so the product ancestry reader needs no new `/proc` parser.
- **Identity:** `fgos_identity::{resolve_current, ATTEMPT_PREFIX}`.
- **The shim text** from `fgos_distribution::shim::workspace_shims()`.
- **Host precedents:**
  - the `internal` routes, dispatched before the composition root;
  - the native `identity` selector with sub-command flags through `InvocationService`;
  - the "zero node child" process tests in `apps/fgos/tests/cli_tests.rs`.
- **Setup:**
  - `registerConfigDefault` and the agent-hook checks already registered in `src/setup/registrations.mjs`;
  - the existing installer tests `test/setup/agent-hooks.test.mjs` (12) and `claude-code-hooks.test.mjs` (10).
- **The V4 live harness** `test/live/mailbox-claude.live.mjs`, its guards in `scripts/lib/mailbox-live-cli.mjs` and `scripts/lib/codex-auth-guard.mjs`, and the recorder `scripts/record-mailbox-hook-fixtures.mjs`. That recorder already dumps the hook's `.proc.json`.

**What existed and went away:** the host branch `internal identity` (added in `e5f965259`, later removed by HARDEN T1). It was a raw pre-route dispatch. Today's identity verb uses the native route. V5 keeps both shapes, each where it fits: the raw shape for the hook kind (decision 1), the native route for the verbs (decision 2).

**Missing, built here:**

- any split of one selector between native and legacy;
- a production limits loader (V4 loads limits from `core/tests/common/support.rs`);
- a production ancestry reader (V4 has it in `tests/common/ancestry.rs`);
- `is_attempt_writer_id` (only `ATTEMPT_PREFIX` is exported, and `session.rs:52` compares the string by hand);
- one shared Claude config-directory resolver (`packages/observe/rust/src/sources/claude_transcripts.rs:136` has its own copy);
- a circuit breaker;
- an output bound;
- the `mailbox` route, catalog entries and registry verb.

**No host-invocation-routing lane is running.** The board has no row for it. `docs/platform/host-invocation-routing/` is a draft area spec with no open plan. V5 does the prerequisite itself and updates that spec (phase 9), as spec §14 names the host as its owner.

## Decisions (planning lead, inside the signed frame)

1. **The hook kind is a raw branch declared in the route table.**
   - `command-route-annotations.json` gives the `hook` selector `native_kinds: ["mailbox"]`. The export script carries it into `command-routes.json`, and the drift test asserts that only `hook` has the field, with exactly `mailbox`.
   - `apps/fgos/src/main.rs`, after the route lookup and before the composition root: if `cli_args[1]` is listed in `native_kinds` and no `--help`/`-h` token is present, call `wiring::mailbox_hook::main(&cli_args[2..])` and `exit(0)`. Every other kind keeps the legacy route.
   - It bypasses `InvocationService` because the hook protocol needs exact stdout bytes, exit 0 on every path (spec §6.1, §8 item 7, review H1), and no snapshot or tokio runtime on the hot path. The precedent is the `internal` routes.
   - The host-invocation spec gets a row for the split (phase 9).
2. **The verbs go through the native door.** The `mailbox` selector is `native`, with sub-commands `send` and `inbox` and three operations: `mailbox.send` (write), `mailbox.inbox` (read) and `mailbox.inbox.claim` (write, chosen by the projector when `--claim` is present).
   - The operations get catalog entries, a provider in `apps/fgos/src/wiring/mailbox_verbs.rs` and a presenter case.
   - Default output is the contract text only. `--json` gives the `fgos.v1` envelope `{recorded|claimed, text, ...}`.
   - Exit codes: 0 recorded, listed or claimed; 1 refused or record error; 4 usage.
   - The legacy registry (`src/cli/command-registry.mjs`) gets the `mailbox` verb entry (it owns help) and the `mailbox` hook kind.
3. **The record directory: a disk-only main-checkout read, from a pinned start directory** (red team RT1, RT2).
   - **Start directory.** For a Claude Code hook and for any tool process that carries it, use `CLAUDE_PROJECT_DIR` when it is set and is a directory. Otherwise use the process cwd: Codex runs each tool in a fresh shell, so its hook process keeps the session's launch directory. Phase 2 P1 and P4 measure the hook's cwd and the variable after a tool-side `cd`. If either CLI's hook cwd follows the `cd`, the rule above stands and the measurement is cited; if `CLAUDE_PROJECT_DIR` is absent in a tool process, the verbs fall back to cwd, and that residual is written down.
   - **Root.** `resolve_workspace_root` is **not** used on the hook path or by the verbs. `GitDriver::open_at` creates `~/.local/state/fgos` and an empty-hooks directory, runs a git floor probe that can write a record, and spawns `git config --list` and `git rev-parse` in every fresh process (`packages/git/rust/src/driver.rs:244-264`, `:289-300`, `:347-353`, `:703-706`, `:741-749`, `:1314-1374`). That breaks the write-free no-mail path, and it puts several child processes on a 50 ms path.
   - Instead, `fgos-git` exposes the disk-only part it already has as one public, side-effect-free function: `fgos_git::main_checkout_root(start: &Path) -> Result<Option<PathBuf>, …>`, cut out of `resolve_topology` (`driver.rs:418-463`). It reads `.git`, `gitdir:`, `commondir` and the `gitdir` back-link, with no subprocess, no state root and no lock. `resolve_topology` then calls it, so no second resolver exists (L10).
   - That diff lands on the branch and is announced. Per the owner rule on the board's OPC row, HARDEN reviews Git diffs, and GIT/HARDEN review it when MAIL lands.
   - The record root is `<main checkout>/.fgos`. No repository or no `.fgos` means quiet for the hook, and exit 1 with `[record.error]` for the verbs (review L2 wording checked in phase 3).
   - Phase 2 measures the new function's cost and proves it is write-free. Spec §6.4's stale "None exists" text is replaced by this.
4. **Limits loader (review L6), aligned with the Config spec** (RT10).
   - `fgos-mailbox` embeds `packages/mailbox/contracts/limits.v1.json` with `include_str!` in `src/` and overlays the `mailbox` section of `<record root>/.fgos/config.json`, keyed by the contract's dotted names.
   - A missing key takes the contract default.
   - **An unknown key is ignored,** as the Config spec treats one (a doctor warning, kept on write; Config spec §4). The verbs print one warning line on stderr; the hook stays silent.
   - **A wrong type or a value the core rejects** makes the whole section invalid. The hook is quiet `ConfigInvalid`, **not counted by the breaker**. The verbs exit 1 naming the key, so the error is visible the first time anyone runs `fgos mailbox`.
   - Range limits on values are not added: a tracked `config.json` has the same trust as tracked code, and the spec signs no numbers.
   - Project config only, like every Rust config reader today (`work-state`, `herdr-fgos-common`). The Config component (CFG lane) moves Rust readers onto its crate (Config spec §12). If that crate is on main when phase 4 starts, the loader uses it instead, and phase 4 records which. Either way the CFG lane is told about this reader (board announcement).
   - Test support stops being a path dependency of anything outside `tests/`.
5. **Adapter facts live in `adapters.v1.json`, policy values in `limits.v1.json`.**
   - The contract gains a per-CLI object `hookFacts.<cli>`, not per version: a Codex hook cannot know its head's version without a spawn, and an untested version keeps draining by owner decision (spec §17, 2026-10-20). Each object holds `measuredOn` (versions, each also in `testedAgainst`, plus the platform, `linux`), and:
     - `hookTopology` (`direct` or `one-shell-hop`);
     - `hookShell`: the path the CLI invokes for the hook command (for example `/bin/sh`, read from the shell's `cmdline` in phase 2), or `null` for `direct`. It is **not** a basename list (RT7), and it is pinned by test;
     - `headExecutables`: the exe basenames accepted at the `direct` head position (a list, with the full measured path kept in the report);
     - `postToolUseContextMaxBytes`: the bound of decision 6.
   - These are measured facts recorded beside the fixtures, so `HOP_SHELLS` stops being a shared constant with `zsh` in it (review M3).
   - `limits.v1.json` gains `mailbox.hook.breaker.failures` (3), `mailbox.hook.breaker.pauseSec` (60) and `mailbox.hook.p95TargetMs` (50, reader `harness`): spec §12 values, owner-set or placeholder, none invented. The breaker keys live inside the `hook` object that `HookCallLimits` deserialises (`deny_unknown_fields`, `store/src/hook/limits.rs:31`). The loader drops `harness`-reader keys before deserialising (RT12).
6. **The output bound applies at claim time, with the worst case and a margin** (RT5, RT6).
   - A `PostToolUse` drain claims eligible items, in order, **skipping** any item whose worst case alone does not fit and continuing with the later ones (no head-of-line blocking). It stops only when the next fitting item would overflow.
   - The budget is `postToolUseContextMaxBytes` **minus the pointer line's own length**, so a reply that carries the pointer still fits.
   - The core computes each frame's worst-case rendered size from the frame contract and the header: the body escape grows a byte to at most 5 bytes (`&amp;`), plus the gutter.
   - **The bound has a margin.** Phase 2's ladder tells whether the CLI's threshold is per hook or summed across the hooks of one event. It runs with a sibling `PostToolUse` hook emitting a fixed 2,048-byte context.
     - **Per hook:** the bound is the largest inline step minus one ladder step (1,024 bytes, the measurement's resolution).
     - **Summed:** the bound is half the largest inline step, and spec §6.1 states the residual that other hooks' context can still push it over.
   - An item whose worst case alone exceeds the budget is not claimed at `PostToolUse`. The drain prints one contract line `[message.too-large-for-channel]` ("N message(s) too large for this channel are waiting; read them with: fgos mailbox inbox --claim"). That item is still taken by a Stop drain (when effective wake is set; the `Stop` reason is not shortened, V4 L3b) or by `inbox --claim`. The pointer repeats at each tool call until claimed: stopping it would need per-message state and a schema change, which is accepted and stated.
   - A CLI without a measured bound gets no `PostToolUse` drain at all, only Stop.
7. **Caller check per CLI (review M3).** `head_of` takes the adapter's `hookFacts`.
   - `one-shell-hop` is accepted only when the parent's exe equals the resolved real path of `hookShell` (for example `realpath(/bin/sh)`) and its `cmdline[0]` is `hookShell`.
   - A tool's login shell (`zsh` on this machine) is refused unless it is literally what the CLI invokes for hooks.
   - **The installed hook command must not `exec`** (decision 14), so the shell stays between the CLI and the host.
   - If phase 2 finds the hook shell and the tool shell indistinguishable on this machine (for example, a login shell that is `/bin/sh` itself), the tty or session facts it recorded decide it, using the narrowest predicate that separates every measured mode. If none separates them, the check stays a topology and pid-reuse guard as spec §6.1 says, and the residual is written down. The `att-` and writer checks still run.
8. **Codex head (review M4).**
   - The head position must be a process whose exe basename is in `headExecutables`. It is compared again by `caller_is_head` just before hold 1.
   - A subreaper (`systemd --user`, a herdr pane process) is `NoHead::WrongExecutable` and is never registered.
   - No start-order check: a parent is always older than its child, so that check would separate nothing (RT8).
   - The writer key is the payload's `session_id`. A session variable in the entry's own environment that names another session is `WriterMismatch` (phase 5).
9. **Runner heads.** `fgos-identity` exports `is_attempt_writer_id(&str) -> bool`, and `session.rs` uses it instead of its own `starts_with` (one door). The shell checks the resolved writer before any hold: an `att-` writer is quiet with `QuietReason::RunnerHead` and nothing is registered, so a `send` to it is refused as unknown. `fgos-identity` becomes a normal dependency of `fgos-mailbox` (spec §4 already lists it).
10. **One Claude config-directory resolver.** `fgos-identity` gains `cli_dirs::claude_config_dir(env_home, env_claude_config_dir) -> Option<PathBuf>` (`CLAUDE_CONFIG_DIR`, else `$HOME/.claude`), a pure function over the two values. Observe's `claude_transcripts.rs:136` and the mailbox's Claude head finder (sessions dir = config dir + `sessions`) both call it, and Observe's copy is deleted in the same change (L10).
    - Whether Claude Code writes `sessions/<pid>.json` under a custom `CLAUDE_CONFIG_DIR` is not measured. A live probe would put the owner's Claude credentials in a directory that refresh-by-rename could split, the same risk class as review M2. The unset case, the only measured one, behaves as before.
    - Identity is the lowest crate both already reach: Observe depends on it, and the mailbox will.
11. **Circuit breaker** (RT3).
    - `record/paths.rs` names `<fgosDir>/runtime/mailbox/breaker.json`, beside `record/` and not inside it (spec §4.1). It is read and written only after the same directory-trust chain check the record applies (`record/mod.rs:562-592`), reached through one `Record` or `Paths` function, never a raw path.
    - **What counts as a failure:** a record error other than lock contention (`lock-busy` is a wait outcome, not a fault), and a caught panic. Config errors, budget exits and every benign quiet reason are not counted.
    - **No write inside the watchdog's `on_exit`.** A stalled disk must not keep the process from exiting.
    - **State:** `{"schema":1,"failures":u32,"openedAtMs":u64|null}`. "Open" is computed as `openedAtMs <= now < openedAtMs + pauseSec` from the loaded config. A stored time in the future by more than a small fixed skew reads as closed, so a planted value cannot extend the pause.
    - After `hook.breaker.failures` counted failures, calls within the pause return quiet `BreakerOpen` before reading stdin.
    - **Concurrency:** one file per project, written without the mailbox mutex through `durable-file`. Lost increments under concurrent failures only delay opening, which is stated and accepted.
    - A success writes only when the stored count is non-zero. The no-mail path therefore stays breaker-write-free.
12. **The untested-version clause.** At `send`, the recipient's CLI version is read through its adapter: Claude Code from `version` in its session file (found from the binding's head pid); Codex from the installed `codex --version` (spawned with a 2 s timeout). It is compared with `testedAgainst`. The snapshot schema stays 1, because nothing new is stored.
    - An untested version adds `[report.untested-version]`.
    - An unknown version adds `[report.version-unknown]`.
    - The hook drain keeps running at an untested version (spec §4.1, §17 2026-10-20).
13. **Lock order.** The host process takes the mailbox lock with nothing else held. The disk-only resolver takes no lock, the config read takes none, and no other `LockScope` exists in the host at that point. Both wiring modules are straight-line functions, documented and reviewed; no trace-based test (see phase 6). `LockScope::seeded(vec![])` stays.
14. **Install rows: Claude Code and Codex only, guarded, never `exec`** (RT4, RT9). The table carries mailbox rows for Claude Code (`Stop`, flat; `PostToolUse`, all tools) and Codex (`Stop`, `PostToolUse`), in the shapes `adapters.v1.json` recorded.
    - The Claude command follows the guarded style this repository's own hooks use (`.claude/settings.json`), without `exec`, so the shell stays as the hop:
      ```sh
      S="${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos"; [ -x "$S" ] || exit 0; "$S" hook mailbox --cli claude --event <e> || true
      ```
      A missing shim, or a not-ready activation (shim exit 3), then never shows an error. The Codex command keeps `shimCommand`'s form (Codex starts it directly; phase 2 measures whether Codex accepts shell syntax there, and if it does, the same guard is used).
    - **Ownership:** an entry's hook object is ours only when its command equals this row's canonical string for this project, or one of our legacy markers. The installer replaces only that hook object inside an entry's `hooks` array, never the whole entry, so sibling user hooks survive.
    - agy stays deferred, so it gets no mailbox row. Its existing `PreToolUse` groups move into the table unchanged, and the "wrong file shape is skipped silently" test runs on them.
    - Adding agy at V7 is one table row. Spec §7.1 is updated to say this.
15. **Legacy fallback.** The legacy payload's `handleHook` treats `mailbox` as quiet: it prints nothing and exits 0. A hook line run through the npm-bin or `node bin/fgos.mjs` channel, which has no native host, then never blocks or errors.
    - Releases built before V5 cannot be fixed this way. With a tracked settings file and an older release, the guarded Claude Code command exits 0 silently; an unguarded Codex row shows "Unknown hook kind" (exit 1). That is owner question 2.
16. **No CHANGELOG line in V5.** V5 is not merged, so no user sees it, and spec §12 and §14 put the line at V7. `CHANGELOG.md` is not touched.

## Acceptance criteria

- [ ] `fgos hook mailbox` runs natively; `dispatch-decide` and `decision-question` still reach legacy-node unchanged, proven by one host process test each. `cli_tests.rs` shows the native kind spawns no Node child.
- [ ] Every `fgos hook mailbox` usage error, missing repository or `.fgos`, and config error exits 0 with empty stdout (host process test). Panic and budget exits are owned at store level (`tests/hook_shell.rs`), because a host panic trigger would be a test-only switch.
- [ ] From a linked worktree, from a subdirectory and with `CLAUDE_PROJECT_DIR` set, the hook and the verbs use `<main checkout>/.fgos/runtime/mailbox`. The main-checkout read spawns no process and writes nothing (host process test on a real `git worktree`; the state root is unchanged).
- [ ] `fgos mailbox send`, `inbox` and `inbox --claim` work through `npm run fgos:dev` and through the host binary. `--json` gives an envelope; exit codes are as in decision 2.
- [ ] The accepted hop shells for each CLI are pinned by a test and come from the contract; `zsh` is accepted only if measured as a hook shell (M3).
- [ ] A Codex head position whose exe is not `codex` is never registered (M4, store test with a real subreaper-shaped ancestry).
- [ ] An `att-` writer registers nothing and is quiet (store test using `is_attempt_writer_id`).
- [ ] A `PostToolUse` drain never emits more than `postToolUseContextMaxBytes`; an oversize message gets the pointer line and stays recorded (core and store tests); a live L1 step shows nothing moved to a file.
- [ ] Production code reads limits through the real loader; the drift between the loader and `registerConfigDefault`'s shape is guarded by one test.
- [ ] The breaker opens after the configured counted failures (lock contention excluded), stays open for `pauseSec` (a planted future time cannot extend it), and writes nothing on the no-mail path.
- [ ] The install table writes and checks the mailbox rows for Claude Code and Codex, preserves user hooks (sibling hooks in the same entry included), owns only exact canonical commands, and the doctor probe runs the mailbox kind and creates nothing.
- [ ] L1, L2 and C1 pass through the private shim. T1 and T2 give, inside the CLI, the steady-state no-mail `PostToolUse` p95 over N ≥ 80 calls (the first, registering call reported apart), plus a held-back-mail p95. **Pass when the steady-state p95 ≤ 50 ms**; otherwise owner question 3.
- [ ] Spec §4.1, §6.1, §6.4, §7.1, §11, §12, §14 and §17, and the host-invocation spec, are updated on the branch; `fgos convention check` is clean on every file the rung adds.
- [ ] Workspace gates pass one at a time on a fresh main, and any failure is shown to also fail on clean main.

## Câu hỏi cho owner

Each question follows `core/skills/_shared/decision-question.md`. None blocks V5; each has a provisional default that this plan follows until the owner answers.

**Q1. Which rung builds the wake channel?**

- *What is happening:* the V4 D4 demo stalled. An idle interactive recipient (Codex) never saw a reply sent without wake until it ran a tool, and interactive Codex 0.161.0 ended its turn instead of running scripted waits. The fix is the `Nudge` wake channel: the Claude Code session socket for a session started with scoped `accept`, and `codex queue` (spec §6.2).
- *Cause:* the signed V5 row (spec §14) lists no wake channel. §11 says only "3 idle wake (a later rung with the wake channels)". §15.8 covers only agy's typed nudge. No rung currently owns wake.
- *Options:*
  - (a) V7, together with the Codex adapter. No new rung; V6 runs its cells in print mode, where a recipient's turn ends naturally, as D2 did. Cost: interactive two-way use stays unproven until V7.
  - (b) A new rung V5b, before V6. Cost: about 2 days and about 4 live runs; it touches the K1 gate (scoped `accept`) and `codex queue` on a busy session, which S0 never measured.
  - (c) Inside V5 now. Cost: it widens a signed row and doubles V5's live spend.
- *Recommendation:* (a). V6 does not need wake for its stop-rule cells, and wake on Codex is useless if V6's stop rule fails.
- *Scope of the answer:* the rung that owns idle wake for Claude Code and Codex, and spec §14's V5–V7 rows.

**Q2. Install the mailbox hook by default, once the lane merges?**

- *What is happening:* `fgos setup` / `doctor --fix` would write the mailbox `Stop` and `PostToolUse` rows into each project's `.claude/settings.json` and `.codex/hooks.json`. These files are tracked (this repository commits `.claude/settings.json`).
- *Cause:* every Claude Code and Codex tool call in every fgOS project then pays one hook call (target p95 50 ms, measured in phase 8). A machine still on a release older than the native kind runs the row through legacy-node, which answers "Unknown hook kind" with exit 1. The guarded Claude Code command (decision 14) turns that into a silent exit 0 that delivers nothing, so mail to that head waits unseen. A Codex row is guarded only if phase 2 shows Codex runs a shell; otherwise it shows that error on each call.
- *Options:*
  - (a) Install by default at merge, after every machine activates a release with the native kind.
  - (b) Install only when a project opts in (`mailbox.enabled: true` in config). Cost: a new key and one more step for a user.
  - (c) Install by default now. Cost: silent non-delivery (Claude Code) or visible errors (an unguarded Codex row) on machines with older releases.
- *Recommendation:* (a). The lane is not merged in V5, so the branch installs only in tests and live run directories.
- *Scope of the answer:* the install default at merge, not V5's code.

**Q3 (conditional, only if phase 8 measures a no-mail hook p95 above 50 ms in a CLI). What to do with the target?**

- *What is happening:* the owner's target (spec §17, 2026-10-20) would be missed in a real hook environment.
- *Cause:* whatever phase 8 attributes it to: the shim, the resolver, the snapshot read, or the CLI's own spawn.
- *Options:*
  - (a) Optimise the named cost inside V5 (for example the shim's `sed` pipeline, through `fgctl`'s shim owner, or the snapshot read).
  - (b) Accept the measured number as the target for that CLI.
  - (c) Pause the lane.
- *Recommendation:* (a) when one cost dominates, otherwise ask. The V5 closing report states the status as DONE_WITH_CONCERNS until then.
- *Scope of the answer:* `mailbox.hook.p95TargetMs` and the V5 close.

## Validation and red team

- Validation, session 1: 31 claims checked, 28 verified; 3 failed and were corrected in the plan. Log: [reports/validation-log.md](reports/validation-log.md).

## Red Team Review

Four reviewers (security, failure modes, assumptions, scope/contract) produced 36 findings, deduplicated to 21: 17 accepted (some in part), 4 rejected with reasons. Log: [reports/red-team-log.md](reports/red-team-log.md).

The changes that moved the design:

- **RT1:** a disk-only `fgos_git::main_checkout_root` replaces `resolve_workspace_root`, which spawns `git` and writes state.
- **RT2:** the start directory is `CLAUDE_PROJECT_DIR`.
- **RT3:** the breaker counts only real faults, after the directory-trust check, with no `on_exit` write.
- **RT5 and RT6:** the bounded claim skips and continues, reserves the pointer's length, and keeps a margin from a sibling-hook ladder.
- **RT7:** `hookShell` is a path, not a basename list.
- **RT9:** exact-string hook ownership.
- **RT11:** no `==` on `Checkpoint`.
- **RT13:** the example is retired in phase 6.
- **RT15:** every native-route consumer is listed.
- **RT18:** a real pass condition for the hook-cost cases.

Whole-plan sweep: no unresolved contradiction.
