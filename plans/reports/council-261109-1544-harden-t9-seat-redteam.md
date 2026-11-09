# HARDEN T9 council: red-team seat (Host & Surface)

Main `25210a751` (origin/main when read; the baseline was cut at `992af5320`, no T9-relevant file differs). Written 2026-11-09 15:44 to 16:30 (Asia/Saigon) on fg-server2 in the linked worktree `t9-redteam`. Lens: adversarial. Threat model: a careless or prompt-injected agent with a shell, a hostile pulled branch or cloned project, a LAN or Cloudflare-Access caller of the gateway, and a foreign tool that shares our directories. Read-only: this report is the only repository file written. Gateway never started; no test suite run.

Citations glossed once: **RUL104** (better, not bigger: harden what exists, add no mechanism without the owner), **L10** (add through the door, not alongside it), **design principle 1/7/8** (one door, one authority, one owning proof per behaviour), **decision 77/78** (T9 moves arm logic down bottom-up and leaves arms thin; Work last, no Work change or plan here beyond listing).

## What I ran

- **Read:** baseline in full; decisions 77, 78 and ledger rows H17, H24; `apps/fgos-gateway/src/{gateway,mcp,cf_access,main}.rs` (router, auth, config load, every handler, run); `src/runner/gateway-control.mjs`; `bin/fgos.mjs` arms `uninstall`, `preflight`, `main-checkout-reset`, `handleHook`, `dataDir`, `main` catch; `scripts/{dispatch-decide,main-checkout-delete-guard}-hook.mjs`; `src/git/main-checkout-delete-guard.mjs` header; `src/setup/{project-launcher,mailbox-sync-timer,bin-discovery,git-hooks}.mjs`; `src/util/{host-bin,host-bin-path,session-identity}.mjs`; `src/cli/{detached-child,invocation-fault-log,parse-args}.mjs`; `packages/herdr-fgos-common/rust/src/fgos.rs` (resolve, run); `herdr-dashboard/src/pick.rs`; `core/config-standard/gateway.yaml`, `core/config-schema/*`.
- **Ran, all harmless and local:** the installed launcher `~/.local/bin/fgos` inside a scratch repo holding a committed shim (F1); `fgos hook dispatch-decide` through the installed host with three payload `cwd` values (F2); `judgeDeleteCommand` on 30 command strings (F8); `renderSystemd` with a newline value (F3); `fgos dispatch decide --for` to find a blocking case; `command-routes.json` counts; `wc -l`; the config schemas. Scratch dirs removed.
- **Not run:** gateway (no listener needed: every gateway claim is from code and the module's own tests), any Rhai script (F5 is from Rhai's documented defaults), the `.git`-file redirect probe (a tool hook refused the shell string, and I did not route around it), any test file, Cargo.

## Baseline claims, checked against code

| Baseline claim | Result |
|---|---|
| 82 selectors, 8 native, 74 legacy | **Confirmed** (`command-routes.json`: 82; native `config convention friction gate-bypass identity mailbox metrics version`) |
| `bin/fgos.mjs` 5 379 lines | **Confirmed** (`wc -l`) |
| H24 branch now `gateway.rs:345-363` | **Confirmed** (`build_fgos_command` at 345), but the baseline misses that a *refused* tier-0 shim falls back silently (F10) |
| D3 agy hook logic duplicates the hook scripts | **Confirmed, and worse than a duplicate**: the two copies disagree on a security verdict (F2b) |
| D5 four Node resolvers plus the Rust walk | **Confirmed**; the Rust `resolve_target_root` (`apps/fgos/src/main.rs:160-177`, baseline says 166-181) returns `--dir` verbatim with no check that it is a project, and walks up for any `.fgos` dir |
| D6 shim-else-node builder copied three times | **Confirmed** (`fgos.rs:395-411`, `gateway.rs:345-363`, dashboard `main.rs:210-230`) |
| `ECHO_PROVIDER_DESCRIPTOR` in production table (H9) | **Confirmed** (`apps/fgos/src/main.rs:131`) |
| C6 lower layers spawn `node bin/fgos.mjs` through `detached-child.mjs` | **Confirmed**; the spawn uses `process.execPath` (absolute) and the module's own `bin/fgos.mjs` (`detached-child.mjs:11,24`), so it is **not** exposed to PATH or cwd (section on question 3) |
| Free-text gateway fields carry an argv-injection risk (my own suspicion, not the baseline's) | **Refuted for the required fields.** `parseArgs` (`src/cli/parse-args.mjs:13-21`) turns `--text --approve` into `text:true`, and `requireField` (`bin/fgos.mjs:321`) refuses `true`. A `--`-prefixed free text therefore fails its own field, and the gateway appends `--dir <root>` last so it wins. No finding |
| Gateway token comparison, file mode, symlink | **Sound**: `constant_time_eq` (`gateway.rs:495`), the token is 32 random bytes from `/dev/urandom` hex (`machine.rs:175-181`), file mode and symlink refusals are tested (`gateway.rs:1824`) |
| cf-access | **Sound for what it claims**: RS256 only, `iss`, `aud`, `exp`, `nbf` required (`cf_access.rs:233-243`), a fresh cache does not refetch on a bogus `kid` (`:176-184`) |

## Part A: target shapes (red-team view; line budgets are the other seats' call)

| Component | Authority (what it alone decides) | Contract and ports | Rust or Node | Delete list (this lens) | Security invariant a proof must keep | Size |
|---|---|---|---|---|---|---|
| **Launcher and shim chain** (`~/.local/bin/fgos`, `.fgos/installation/bin/fgos`, `fgctl`) | Which release binary runs for a project, **only for a project the user activated** | `activation.json` plus a per-user trust record written by `fgctl init`; the launcher refuses a shim not in that record | sh body written by `src/setup/project-launcher.mjs`, checked by a Rust test | the unconditional walk-up exec | a committed `.fgos/installation/bin/fgos` is never executed (F1) | +10 lines sh, +1 test |
| **Invocation root door** (D5/H17) | The one answer to "which repo does this invocation act on", with a named policy: `main-checkout`, `caller-tree`, `strict-cwd`. `--dir` is a request the door validates, never an answer | `resolveInvocationRoot({cwd, dirFlag, policy}) -> {root, fgosDir}` in `src/runner/paths.mjs`, mirrored by the Rust host `resolve_target_root` through the same Git trusted-root fact | Node leaf plus Rust | the six repeated `flags.dir !== undefined ? ... : ...` lines (`bin/fgos.mjs` 1047, 4027, 4169, 4248, 4264, 4445), `host-bin.mjs` cross-checkout fallback, one of the two host-bin resolvers | `--dir` that is not this repo's trusted main root is refused unless the verb is declared tree-local (F6) | about -80 net |
| **Hook adapters** (`fgos hook <kind>`) | The wire format of each agent CLI and nothing else; the verdict is one function per kind | `judge<Kind>(payload, ctx) -> {decision, reason}`; standard and agy are two serialisers of one verdict | Node, one process (no second `spawnSync`) | `handleHook` agy branches (`bin/fgos.mjs:5052-5125`), the second Node spawn | the same refusal gives the same verdict in both formats, and the project is resolved from the harness's project dir, never from a payload `cwd` (F2) | -90 lines, +2 tests |
| **Gateway (REST + MCP)** | Authentication and shape, nothing else. Every verb goes through `VerbGateway`; MCP `execute` is an allowlist of 13 bound functions inside a resource-capped engine | `VerbGateway::run_verb(args)` is the only spawner; one argv builder per verb shared by REST and MCP (D7) | Rust | the `node bin/fgos.mjs` branch (H24), `--` fallback in `post_runner_tick` | no request can allocate without bound (F5); bind default is an owner decision (F4); the caller identity is recorded (F4) | +20 lines in `mcp.rs` |
| **Dashboard (TUI)** | Display plus launching panes through the one fgos command builder | `herdr-fgos-common` command builder, no copy | Rust | the mirrored builder (`herdr-dashboard/src/main.rs:210-230`) | launched agents never default to `--dangerously-skip-permissions` without an explicit owner switch (F4c) | -30 |
| **Arms that run commands** (`preflight`, `uninstall`, `main-checkout-reset`, `setup`, `doctor --fix`) | They request; a lower use case decides and runs | use cases in `src/setup`, `src/runner` | Node | `preflight` verb (F7); `--remove-package` (H14) | no arm executes a script or binary taken from the working tree of a repo it did not prove is the fgOS checkout (F3, F7) | net negative |
| **Invocation-fault log** | A record of the misuse, not of the call's content | `recordInvocationFault({faultClass, verb, argvShape})` where the shape keeps flag names and verb and redacts values | Node, move under `src/observe` (C5) | raw `argv` field | no free-text value reaches disk; the file is 0600, size-capped (F9) | +15 |
| **Delete guard** | A best-effort refuser of mass deletes in listed forms | `judgeDeleteCommand` as today | Node | none | its header says "last line of defence" and lists the forms; the doc must say what it does not catch (F8) | text only |

Rust moves: none new. Agree with the baseline that T9 Rust work is deletion (H9) and the shared command builder.

**Work-owned, planned no change from this seat (decision 78):** the 41 Work and 10 Work/Knowledge arms of `bin/fgos.mjs` (`add submit discover plan move retrospective cleanup topic doc knowledge doc-registry compound edit resolve-park-reason ask answer handoff handoff-return decision decision-index context-render gate-approve list show ready graph gate-check stale slots report conflicts recheck-blocked schedule plan-lint merge rollup docs-index doc-sources authoritative-match take pick return review approve sync-root promote-to-component reject catchup triage goal unclaim`), their helpers (`submitWork`, `collect*`, `parse*Verdict`), `src/state/*`, `src/verbs/state/*`, `src/verbs/merge/*`, the gateway's `/work*` handlers and the MCP bound functions as *semantics*. Nothing in F1 to F12 requires a Work change; F4 and F5 touch the gateway adapter only. One Work-adjacent note for WORK, not an action: `return` (`bin/fgos.mjs` 3309-3673) has two near-copy branches that each write settle and friction records, a drift risk for whoever opens T7.

## Part B: findings, ranked

### F1 High, reproduced: the project launcher executes any `.fgos/installation/bin/fgos` it finds above the cwd, including one committed by a hostile repo

**Where.** `src/setup/project-launcher.mjs:21-32` (the body written to `~/.local/bin/fgos`, identical to the installed file). Walk up from `$PWD`, `exec "$dir/.fgos/installation/bin/fgos" "$@"` for the first executable. No ownership, trust or tracked-file check. The shim itself (`packages/distribution/rust/src/shim.rs:35-77`) then execs `<releasePath>/bin/fgos` for whatever `activation.json` names, with no path confinement (the Node reader `hostBinFromActivation` confines it, `host-bin-path.mjs:50-58`; the shim does not).

**Reproduced.** Scratch repo, `git add -f .fgos/installation/bin/fgos` (mode 100755), then `~/.local/bin/fgos doctor` printed `EXECUTED planted shim args=doctor`. Git preserves the exec bit, so `git clone` or `git checkout` of a hostile branch plants it. `.gitignore` in this repo lists `.fgos/installation/`, but the hostile repo ships its own.

**Scenario.** The user (or an agent, or a hook, or `fgos doctor` from the shell integration) runs `fgos <anything>` inside a cloned project: code runs as the user, with the user's tokens and `~/.fgos/private`. Hooks make it silent: Claude hooks call `fgos hook ...` from the project cwd on every tool call.

**Fix (S to M).** Trust on first use, direnv style: `fgctl init` appends the project's real path to `~/.fgos/trusted-installations`; the launcher execs only a project listed there (sh builtins only: `while read`, `case`, no new process, same budget as the shim). Not-listed gives one line naming `fgctl init`. The same record serves F3. Alternative with no new file: refuse when `$dir/.git` exists and the shim path is tracked (needs a git call; costs about 3 ms; worse). The shim's missing release confinement is a separate S (copy `insideRoot` into `sh_body`, or make `fgctl` write `releasePath` canonical and check `case $path in $HOME/.fgos/releases/*|<project>/.fgos/installation/releases/*)`).

### F2 Medium, reproduced for (a), read from code for (b): the dispatch guard is bypassed when the payload `cwd` is outside the project, and the agy copy fails open where the Claude copy fails closed

**(a) Where.** `scripts/dispatch-decide-hook.mjs:61` takes `data.cwd` from the payload and passes it to `decideExecutorCli`; any non-config failure returns `null` (allow) at `:64-70` and `:79-83`. Through the installed host, for the same Agent call (`subagent_type: "code:implement"`, which `fgos dispatch decide --for code:implement --needs-soul --has-live-task-access` resolves to `out-of-process`): payload `cwd` = the project gave exit 2 with `BLOCKED`; `cwd` = `/tmp`, `/nonexistent` and `/home/vantt` each gave exit 0, silent. The session's cwd is whatever a prior shell call left it as, so one `cd /tmp` before the Agent call turns the rule "never decide the mechanism yourself" (AGENTS.md) off. The same `cwd` feeds `main-checkout-delete-guard-hook.mjs:30-35`, which judges relative paths against that cwd (a command run from outside any checkout has nothing to refuse, correctly; the problem is only the dispatch guard).

**(b) Where.** `bin/fgos.mjs:5073-5078` (agy dispatch-decide): `catch { // fail-open }` swallows a `config-*` refusal, while the Claude script deliberately fails closed on it (`dispatch-decide-hook.mjs:27-33,87-92`, with a header explaining why). An agy session with a broken project config bypasses every dispatch rule the broken file declares. The agy `payloadCwd` is `workspacePaths[0]` or `process.cwd()` (`:5041-5045`), so (a) applies there too.

**Fix (S).** One verdict function used by both formats (this is baseline D3, now with a reason to do it first): take the project from the harness's project dir (`CLAUDE_PROJECT_DIR` or the hook process's launch cwd, which the harness fixes), never from the payload; a payload `cwd` outside that project is evaluated against the project, not skipped; the config-refusal rule lives once. Owning proof: one test per format over one fixture table (config refusal, cwd outside, malformed JSON).

### F3 Medium, read from code plus a renderer check: `doctor --fix` can install a persistent timer that runs a binary taken from the project tree

**Where.** `src/setup/mailbox-sync-timer.mjs:204-206`: `shim = <cwd>/.fgos/installation/bin/fgos`, else `bin(cwd)` = `resolveFgosBin` (`bin-discovery.mjs:143-157`): tier 0 workspace shim, tier 1 `<cwd>/bin/fgos.mjs`, tier 2 the first `node_modules/.bin/fgos` walking up from cwd to `/`, tier 3 a PATH probe. The chosen path is written into a systemd user unit or launchd plist (`:46-72`) that runs every `intervalSec`, with no session running. The trigger is `mailbox.crossMachine.enabled` plus `eventStore.sync.intervalSec` and `remote` in the **project** config (`mailbox` is scope `both`, `mailbox.schema.yaml:11-16`; `remote` is pattern-limited to `^[A-Za-z0-9_-]+$`, `eventStore.schema.yaml:10`).

**Scenario.** Clone a hostile project whose committed config turns cross-machine mail on; the user runs `fgos doctor --fix` (the suggested repair for a failing doctor row). A committed `.fgos/installation/bin/fgos` or `node_modules/.bin/fgos` becomes a persistent job outside any sandbox.

**Also.** `quote()` (`:44`) escapes `"` and `\` only. I confirmed by running `renderSystemd` that a newline in `remote` starts a new unit directive (`ExecStartPost=`). The config pattern blocks it today; a project path with a newline or `%` is not checked at all. Defence in depth, not a live hole.

**Fix (S).** The timer names only the host the same trust record of F1 vouches for, or the activated release's `bin/fgos` read through `hostBinFromActivation` (confined); never tier 1 to 3. Reject control characters and `%` in every interpolated value (`projectRoot`, `bin`, `remote`).

### F4 Medium, read from code; a decision for the owner, not a reversal: the gateway default is `0.0.0.0`, cleartext, one token for everything, and nothing records who called

**Where.** `core/config-standard/gateway.yaml:7-8` (`bind: 0.0.0.0`, "reachable on the LAN and Tailscale by design"); `gateway.rs:1298-1326` warns on a non-loopback bind and serves plain HTTP; `require_token` (`gateway.rs:447-489`) accepts the one machine token or a valid CF assertion and discards the assertion's identity (`cf_access.rs` returns it, `gateway.rs:470` ignores it); no route has a rate limit, and each authenticated request spawns a Node process.

**What a caller reaches.** Unauthenticated: `GET /v1/contract` (the OpenAPI file, `gateway.rs:1153`), the embedded dashboard bundle, and a 401 whose message names `~/.fgos/private/gateway-token`. With the token (or any identity your CF Access policy admits): submit, edit, move, ask, answer, take, return, approve, reject, session start and end, and `/runner/tick` (spawns `fgos-runner --once`). MCP `execute` runs Rhai over 13 bound functions only (`mcp.rs:200-410`); it **cannot** run arbitrary verbs, a shell or the filesystem: every function funnels to `run_verb` with a fixed verb name, leading-dash guarded ids. The brief's question "can `execute` run arbitrary verbs" is therefore no, on the code read (limits in F5).

**Why it matters.** (1) The token crosses the LAN in cleartext; anyone on the segment captures it once and holds full authority. (2) With CF Access, every admitted user is the owner and the log cannot tell them apart. (3) Chain, not traced end to end: `submit_work(text)` puts attacker text into a work item; `herdr-dashboard/src/pick.rs:92-98` launches agents with `--dangerously-skip-permissions` **on by default** (`FGOS_HERDR_SKIP_PERMISSIONS` unset means on). Whether the unattended auto-launcher consumes a fresh item without a human is not something I traced.

**Owner options (this reverses nothing yet).** Original decision: bind `0.0.0.0` by design (config doc, D7 in the gateway comments). Concern: cleartext token plus full authority plus default-on skip-permissions. Options: (A) keep the default, record the caller (CF identity, else a short token fingerprint) in the verb's `--source`, and cap concurrent spawns; (B) default `127.0.0.1`, and `0.0.0.0` becomes an explicit setting that also requires `cfAccess*` or a TLS terminator (Tailscale and CF both give one); (C) A plus default-off skip-permissions in the dashboard. Red-team recommendation: C now (S, no behaviour change for the owner), B as the owner's call. Fix size: A S, B S (a default and a refusal), C S.

### F5 Medium, from Rhai's documented defaults, not run: MCP `execute` has no memory or module limit, and REST has no spawn cap

**Where.** `mcp.rs:213-220` sets only `set_max_operations(500_000)`. `Engine::new()` leaves string, array and map sizes unlimited and, outside `no_module` builds, installs a file module resolver (so `import "x" as m;` reads `x.rhai` from the gateway's cwd, `apps/fgos-gateway`). The module comment at `mcp.rs:229-233` claims nothing beyond the bound functions is reachable.

**Scenario.** `let s = "aaaaaaaa"; for i in 0..45 { s += s; }` is 45 operations and a 2^45-byte string: the allocator aborts the whole gateway (REST, MCP, dashboard). Any holder of the token (or a CF identity) can do it. Separately, `post_runner_tick` and every verb handler use `spawn_blocking`, so a request flood fills Tokio's blocking pool with Node processes (each waits up to `VERB_SPAWN_TIMEOUT`).

**Fix (S, +20 lines).** `set_max_string_size`, `set_max_array_size`, `set_max_map_size`, `set_max_call_levels`, `set_max_expr_depths`, and `set_module_resolver(rhai::module_resolvers::DummyModuleResolver::new())`; a `tower` concurrency limit on the authenticated router; a wall-clock bound on `execute`. Owning proof: one Rust test running the doubling script and asserting a script error, not an abort. If the Rhai default is already bounded in the pinned version, the test shows it in one run and the finding closes; I could not build to check.

### F6 Medium-Low, read from code: `main-checkout-reset --dir <anything>` skips the main-checkout guard

**Where.** `bin/fgos.mjs:4472-4480`: the refusal runs only when `flags.dir === undefined`. With `--dir` the verb resets `path.dirname(dir)` to `--sha`, whatever that directory is (a linked worktree, another project). `dataDir` (`:145-152`) accepts any non-empty path; the Rust `resolve_target_root` (`apps/fgos/src/main.rs:160-177`) returns it verbatim. The refusal text itself tells the caller to pass `--dir`. SafeRestore still refuses a dirty tree and a lossy move without `--confirm`; with `--confirm` it discards.

**Scenario.** An agent in worktree A runs `fgos main-checkout-reset --sha <x> --confirm --dir /home/u/projects/other`; the safety the verb exists for is conditional on the argument that defeats it.

**Fix (S).** Part of the root door of Part A: the verb declares policy `main-checkout`, the door compares `--dir` with the Git trusted main root of the cwd's repo, and refuses a different repo or a linked worktree. About -10 lines in the arm after the door exists.

### F7 Medium-Low, read from code: `fgos preflight` runs `npm run build:skills` and `scripts/*.mjs` from whatever repo the cwd or `--dir` is in

**Where.** `bin/fgos.mjs:4307-4379`: `repoRoot = facts.worktreeRoot` of `--dir` or cwd; `spawnSync('npm', ['run','build:skills'], {cwd: repoRoot})`, then `node scripts/check-decision-citation-drift.mjs` and `scripts/check-backlog-reconciliation.mjs` in `repoRoot`. Nothing checks it is the fgOS checkout. In any other project, `fgos preflight` executes that project's `package.json` script and its `scripts/` files, and `build:skills` writes tracked files.

**Fix (S, negative lines).** Baseline question 4: retire the verb from the registry and the route table (82 to 81 selectors) and keep it as an `npm run preflight` script in this repo (it serves mission 3 only, D-ADR0035). If the owner keeps the verb: refuse unless `package.json` `name` is `forgent` and the root is the trusted main root or a linked worktree of it.

### F8 Low, run: the delete guard catches the listed forms and misses the ones it does not list

**Run.** 30 strings through `judgeDeleteCommand` with the main checkout as cwd. Refused: `rm -rf *`, `rm -rf ./*`, `find . -delete`, `find -exec rm`, `git clean -fdx`, `xargs rm`, `bash -c`, `eval`, `\rm`, `command rm`, `env rm`, `rm --recursive --force`, `cd nonexistent; rm -rf *`, `D=.; rm -rf $D/*`. **Allowed:** `rsync -a --delete /empty/ ./`, `python3 -c "shutil.rmtree('.')"`, `node -e "fs.rmSync('.',{recursive:true})"`, `mv * /tmp/x`, `shred -u *`, `git reset --hard`, `git checkout -- .`. The header (`main-checkout-delete-guard.mjs:1-24`) states its scope ("mass deletes", the forms listed) honestly, but also calls itself "the last line of defence".

**Also.** `SHELL_TOOLS` (`scripts/main-checkout-delete-guard-hook.mjs:16`) is an exact-name set; a harness that names its shell tool otherwise gets no guard (for example `PowerShell`, `BashOutput`-style wrappers). The hook reads stdin without a size bound.

**Fix (text, S).** Say in the header and in `worktree-safety.md` that interpreters, `rsync --delete`, `mv` and `shred` are not judged; add `rsync ... --delete` and `mv <glob>` to the listed forms only if the owner wants (a new rule is a feature: see the idea list). No code change is required by this lens.

### F9 Low, run (the live file): the invocation-fault log records every argv value unredacted, with no size cap

**Where.** `src/cli/invocation-fault-log.mjs:68-80` writes `{message, cwd, argv: process.argv.slice(2), writer}` for every pre-handler fault (`bin/fgos.mjs:5340-5349`); the live file `.fgos/logs/invocation-faults.jsonl` shows full argv and the writer id. A typo in `fgos run "<prompt carrying a key or a customer name>" --bogus` stores the prompt. The file is created with the process umask (0664 here), is gitignored (`.gitignore:15`), and is never rotated. `message` echoes flag values too.

**Fix (S, +15 lines).** Record `argvShape`: verb, subcommand, flag names, and for each value only its length; keep the unknown-flag and store-missing detail in `message` with values removed; create 0600; cap the file (drop the oldest half past 1 MB). Move the module under `src/observe` as baseline C5 says; the redaction lands in the same change.

### F10 Low, read from code: H24 is an unverified-code fallback and it is also fail-open

**Where.** `gateway.rs:345-363`; `fgos.rs:380-390`. `resolve_fgos` returns the tier-0 shim only if it is executable **and** confined; **if the confinement check fails** (a symlink escaping the installation root) it returns `root/bin/fgos.mjs` as if nothing happened, and the gateway runs `node <root>/bin/fgos.mjs` from the working tree, with `node` from PATH and the inherited `NODE_OPTIONS`. No manifest digest is checked on that path, unlike the host (`legacy_exec.rs:145-150`). `post_runner_tick` (`gateway.rs:1096-1130`) runs `<root>/bin/fgos-runner` the same way. `fgos gateway start` (`gateway-control.mjs:211`) builds the binary from the working tree with `cargo build --release`, so a hostile checkout's `build.rs` runs at start. The incremental risk is low (the working tree is already trusted to build the gateway; owner decision 10 calls the node channel unsupported and the process, lock and identity verbs refuse on it), but the silent downgrade turns a refused shim into a quiet run of different code.

**Fix (S, negative lines).** The baseline's T9-08 plan (drop the branch per decision 10): `resolve_fgos` returns `Err(NoActivatedRuntime)`, the gateway maps it to a 503 with the `fgctl init` hint, and the dashboard shares the one builder. One test: a symlinked shim yields the refusal, not a node command.

### F11 Low: smaller gateway items, read from code

- `get_work_docs` (`gateway.rs:~700`) confines the **directory** of `docsRef` under `docs/history` by `canonicalize`, but reads `CONTEXT.md` and `plan.md` with `read_to_string(resolved.join(name))`, which follows a file symlink. A pulled branch that commits `docs/history/x/plan.md -> ~/.fgos/private/gateway-token` lets a CF-Access identity read it through `/v1/work/{id}/docs` once an item points at `docs/history/x` (PATCH accepts `docs-ref`). S fix: canonicalize the file and recheck the prefix.
- `CfAccessVerifier` is built with `reqwest::Client::new()` (no timeout, `config load`); when the JWKS cache is unseeded or stale each garbled assertion with a `kid` header starts an outbound fetch to the team domain. Bound: one fetch per hour once it succeeds; unbounded when the fetch fails. S fix: a client timeout and a negative cache of 30 s.
- The CLI's stderr becomes the HTTP error body (`gateway.rs:~380`): paths and refusal text reach the caller. Acceptable for a trusted caller; with CF Access it is every admitted user.
- `with_static_serving(router, enabled, Path::new("static"))` serves an on-disk `static/` relative to the gateway's cwd with `ServeDir` (follows symlinks) ahead of the embedded bundle, unauthenticated. The cwd is `apps/fgos-gateway` under `fgos gateway start`; a gateway started by hand from a project with a `static/index.html` would publish that directory. S fix: use the embedded bundle only, or an absolute path from the crate.

### F12 Low, not run: a `.git` file can redirect the trusted main root

A directory containing a `.git` file `gitdir: /path/to/victim/.git` is read by Git itself as that repository's git dir. `resolveMainCheckoutRoot` (`runner/paths.mjs:74`) derives from Git's own answer, so verbs run from inside the hostile directory may resolve the victim as the main root. I could not run the probe (a tool hook blocked the shell string and I did not route around it). Whether the Git component's Inspect rejects a back-link mismatch is a question for the T2 owner; the fix, if needed, is one check in the root door of Part A (`gitdir` must point at a `worktrees/<n>` whose `gitdir` file points back).

### Checked and sound (no finding)

- Hook kind dispatch is a closed set before it builds the script path (`bin/fgos.mjs:5014,5027`); no traversal.
- `spawnDetachedCli` uses `process.execPath` and its own module-relative CLI, so a lower layer's detached child is not exposed to PATH or cwd (`detached-child.mjs:11,24`); the inherited environment is the same identity by design.
- `uninstall` removes only configuration with an ownership proof and deletes `.githooks/pre-commit` only when untracked (`git-hooks.mjs:46-60`); `--remove-package` shells `npm uninstall -g forgent` after an existence check (`bin/fgos.mjs:4181-4213`), which H14 deletes anyway.
- Config: `runner.executor.command` is `global-only` (`runner.schema.yaml:16-21`), so a project file cannot name a binary for `fgos run`.
- The gateway token file refuses a missing, loose-mode, symlinked or malformed file (`gateway.rs:1824` tests); `GET /v1/runtime` and every `/v1/*` route except `/v1/contract` sit behind the bearer layer.

## Positions on the baseline's five open questions

| # | Position | Evidence |
|---|---|---|
| U1 knowledge, doc, decision arms | **Follow Work** (decision 78: last, after T7); no security reason to move them earlier. Only edge: `decision` statically imports `scripts/check-decision-citation-drift.mjs` (`bin/fgos.mjs:39`), a `scripts` import from the entry; handle when Work opens | arm table |
| U2 root policy | **One door, named policies.** Per-verb policy (tsk-49i) stays as a *parameter* (`main-checkout`, `caller-tree`, `strict-cwd`), not as six copies and two language implementations. `--dir` becomes a validated request. Without this F6 and F12 stay open, and H17's two resolvers keep disagreeing | `bin/fgos.mjs` 1047, 4027, 4169, 4248, 4264, 4445; `main.rs:160-177`; F6 |
| U3 detached entry for T3/T6 | **Keep the shell as the entry, move the spawn door down and add nothing else.** It is already absolute-`execPath` plus own module; PATH and cwd are not an attack surface. Add one guard test: no caller passes a `cliPath` other than the default outside tests | `detached-child.mjs:11-24` |
| U4 `preflight` | **Retire the verb**, keep an `npm run` script for this repo. A verb that runs the cwd repo's npm scripts is a code-execution door under a name that sounds read-only | F7 |
| U5 gateway and dashboard scope | **In scope** for H24, D6, D7, the argv-once cleanup and every finding above: they are driving adapters, and the Work semantics of what they call stay untouched. Out of scope: any change to which Work verbs exist | F4, F5, F10 |

## Suggested order for the T9 phases (security-driven, inside the baseline's bottom-up order)

1. T9-00 and the launcher: F1 first (it gates every other trust claim), with F3 reusing its trust record. Both live in T8's `src/setup` and `fgctl`: tell the T8 owner.
2. T9-01 root door: F6, F12, then the H17 merge.
3. T9-05 hooks: F2 together with D3 (one verdict, one process).
4. T9-07 setup arms: F7 (retire `preflight`), F3 timer, H14.
5. T9-08 Rust: F5 limits, F10 (drop the node branch), F11, H9, H13; F4 after the owner picks A, B or C.
6. T9-03: F9 rides the move of the fault log into `src/observe`.

Every fix has an owning proof at the lowest layer: F1 a launcher test, F2 a hook-fixture test per format, F5 a Rust unit test in `mcp.rs`, F6 a root-door test, F9 a log test.

## Feature ideas (separate; the owner chooses; RUL104)

| Idea | Problem and evidence | Benefit |
|---|---|---|
| A `fgos trust <project>` verb (the user-facing side of F1's record) | today trust is implicit in being activated; a cloned project has no way to say "I looked at this" | one place to review and revoke which projects may run their own fgos |
| Gateway audit line per mutating request (caller fingerprint, verb, item) | F4: no record of which token or CF identity wrote | answers "who approved this" |
| Delete-guard rules for `rsync --delete` and glob `mv` | F8: both wipe a checkout and pass | closes the two plausible accidents; a new rule, so owner's call |
| Doctor row `launcher-trust-record` | F1: a machine with a launcher and no record cannot tell | the doctor finds the gap |
| A `Host` header allowlist on the gateway | DNS rebinding is blocked today only by the bearer check | defence in depth if cookies are ever introduced |

## Unresolved questions

- F4: which of A, B or C does the owner want, and is the unattended dashboard auto-launcher allowed to take freshly submitted items?
- F5: is the pinned Rhai version bounded by default? One Rust test answers it; I could not build.
- F12: does Git Inspect reject a `.git` file whose gitdir does not point back? T2 owner.
- F1: is `~/.fgos/trusted-installations` the right home for the record, or does the existing `fgctl` registry already hold one?
