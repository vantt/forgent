---
title: "HARDEN T9 sub-plan: Host & Surface (CLI arms, main(), Rust host routing, gateway, dashboard, doctor/setup surface)"
description: "Step 4 of the HARDEN per-layer loop for T9: the accepted findings of the T9 arbitration and owner decision 81 split into twelve phases, four proposed Unit-contract phases awaiting owner approval, one close; bottom-up by layer, one writer per bin/fgos.mjs range, merged with the packaging sub-plan queue; Work arms untouched."
status: pending
priority: P1
effort: ~15d of lead work (16 phases); ~9.5d critical path (P02 -> P03 -> P04 -> P05 -> P06 -> P08 -> P10 -> P16); widest group 4 leads
branch: main (plan only; each phase runs on its own track branch `harden/t9-pNN-<slug>` in its own linked worktree from origin/main)
tags: [harden, host, surface, cli, gateway, dashboard, doctor, setup, hook, root-door, unit-contract]
blockedBy: []
blocks: [261021-1118-harden-low-layers-bottom-up]
created: 2026-11-09
---

# HARDEN T9 sub-plan: Host & Surface

Baseline: `origin/main` `26d42ca98` (2026-11-09 17:2x). Every `file:line` below was re-read on it. `bin/fgos.mjs` is 5 392 lines: the arbitration's lines hold up to 4231, then shift +10 (new `wire-agents` arm `:4232-4250`), then +13 in `main()`. Each phase lead re-reads its ranges by symbol, not by number, before the first edit.

Inputs: [arbitration](../reports/council-261109-1617-harden-t9-arbitration.md) (authority: §1 shapes, §2.1 accepted, §3 L-1..L-14, §6 split), [baseline](../reports/research-261109-1529-harden-t9-baseline.md), owner decisions 77, 78, 80, 81 in the [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md) (`^77\. `, `^78\. `, `^80\. `, `^81\. `), the [packaging sub-plan](../261109-1617-harden-packaging-distribution/plan.md), the [T8 sub-plan](../261109-1304-harden-t8-skill-domain/plan.md) for format. Where decision 81 differs from the arbitration's recommendation, decision 81 wins (table below). This plan reopens no owner decision.

Citations, glossed once: **RUL104** (D-ADR0062, "better, not bigger": no feature, layer or mechanism unless the owner chose it; a contract change moves every caller and deletes the old path); **RUL11** (D-ADR0054, "tum lum": gather the mess inside the scope; mess outside becomes its own item); **L10** (extend through the door, never beside it); design principles 1 (one door), 2 (bottom-up layering), 6 (KISS/DRY), 7 (one authority), 8 (one owning proof per behaviour); **D-ADR0035** (a defect hitting a project that uses fgOS outranks one hitting only this repo); **decision 76(b)** (no native Rust hook unless a CLI cannot carry it). L-n and T9-nn are the arbitration's ids.

## Outcome

When T9 closes: every non-Work arm of `bin/fgos.mjs` parses flags, builds the arguments of one call, calls one use case and prints; every refusal, default, composition and exit decision it held lives in the owning layer with its owning test there. `main()` names no verb: root, store admission, Event Store lifecycle, fault record and exit code come from one door each. One invocation-root door answers "which project does this invocation act on" for Node (and a shared fixture table proves Node and the Rust walk agree); `fgos list` from a subdirectory reads the real store and `fgos init` cannot create a phantom one. One hook verdict per kind, in-process, judged against the harness project dir, failing closed on an unusable config for Claude and agy alike. The host stops hashing itself and stops reading the addon twice. Gateway and dashboard run `fgos` only through the workspace shim or refuse; the gateway binds `127.0.0.1` unless the config says otherwise, records the caller of every mutating request and bounds `execute` and its spawns. `fgos preflight` is gone from the product CLI. Work arms (51 arms, 2 357 lines) and `external_process` are untouched. **Honest floor:** `bin/fgos.mjs` ends near 4 500 lines, not "thin"; the 51 Work arms are 2 357 of them.

**Non-goals (RUL104, decisions 78 and 81):** no new verb, flag, doctor row, layer or Rust arm; no native hook; no change to `packages/host-runtime` (decision 81 Q3: `external_process` is the plugin extension point; when it is wired into the product its provider processes must run confined, which is that future work's job); no host-verify fingerprint cache (Q4 b); no `fgos root` verb (idea F-3); the dashboard's `--dangerously-skip-permissions` default stays (Q2 option c not taken). Ideas stay in arbitration §5.

## Owner decision 81 applied

| Ask | Owner answer | Effect on this plan |
|---|---|---|
| Q1 | retire `fgos preflight` from the product CLI; it stays a repo-only script | P10 deletes the arm, registry entry, route, `test/cli/fgos-preflight.test.mjs`; the three checks stay as scripts and one `package.json` script chains them (`scripts/check-backlog-reconciliation.mjs` is **kept**, not deleted as the arbitration recommended; its 143 lines leave the net-size saving) |
| Q2 | gateway binds `127.0.0.1` by default; network exposure takes an explicit `--bind`/config; every request records its caller | P14. The standard `gateway.yaml` default flips; caller recorded; the arbitration's "refuse non-loopback without CF/TLS" rule is **not** added (owner text omits it; the existing non-loopback warning stays). `--bind` flag: see unresolved question 1. Dashboard `--dangerously-skip-permissions` untouched |
| Q3 | keep `external_process` | PR3 dropped; no phase touches `packages/host-runtime` |
| Q4 | no cache; drop self-hash and double addon read; re-measure | P12 is L-7 only (+15 Rust, not +70); the close re-measures and reports; revisit only if still slow |
| Layer names | Execution / Workflow / Domain (no "Coordination") | used in P05, P07, P09, P11 |
| COOK's four Unit-contract steps | proposed, awaiting approval | P05, P07, P09, P11, marked **proposed - awaiting owner approval** |

## Already landed or in flight (excluded; not re-planned)

| Item | State | Evidence | What it means here |
|---|---|---|---|
| The `~/.local/bin/fgos` shim execs only verified binaries; the root walk stops below `$HOME` | **in flight, landing now**: branch `harden/t9-shim-root` (tip `c0be6443b`, six commits `84896e342..e0b341c60` on top of `origin/main`) | `src/setup/project-launcher.mjs`, `apps/fgos/src/main.rs` walk, `apps/fgos/tests/cli_tests.rs`, `docs/platform/host-invocation-routing/spec.md`, `docs/platform/packaging-distribution/spec.md` | P02 and P12 (`main.rs`) start after it is on `origin/main`; P02's conformance table builds on its bounded walk; P10 does not touch `project-launcher.mjs` |
| No global agent writes; `fgos wire-agents` | **done, commits on `origin/main`** (`d1356df76`, `e1fca6f5f`, `21472f4ce`, `051cfb4ef`, `ed38755fd`); board landing line in flight | `src/setup/agent-wiring.mjs` (215 lines), `wire-agents` arm `bin/fgos.mjs:4232-4250`, registry entry, `main()` render and exit branches (`:5316-5318`, `:5346`) | P10 moves the arm body into `src/setup` (one step); it touches none of `agy-permissions.mjs`, `mailbox-claude-accept.mjs` or the host table of `agent-hooks.mjs` beyond the doctor probe memo |
| Packaging P03 fgctl command surface | **done** `dfa55aa1c` | `apps/fgctl/src/main.rs` | none (not T9) |
| Packaging P09 download safety | **landing** (branch `harden/pkg-p09-download-safety`, tip `689078a68`) | `install.sh`, `scripts/install.ps1`, `fetch.rs` | none (not T9) |
| T8 render, guards, doctor rows, domain-dirs door | done (T8 P01-P07, P10, P11 on main; P12-P13 pending) | [T8 plan](../261109-1304-harden-t8-skill-domain/plan.md) | P15 imports a leaf into `skill-wrappers.mjs` after T8's chain on that file |

## Phases

Order is bottom-up by layer (decision 77) and layers run one at a time (owner: inside a layer, every file-disjoint phase starts at once). P01 (shell) and P12-P15 (Rust, host, gateway, dashboard, leaf) are outside the layer chain and run beside it. **Phases marked "proposed" never gate a layer or the close**; if the owner has not approved them when the others land, they move to the hand-off with their text intact.

| # | Phase | Layer | Depends on | Hot files written | Net Node / Rust / tests (estimate) |
|---|---|---|---|---|---|
| 01 | [Shell leaves: error leaf, registry `store`/`landsWork`, lazy entry, dead arms](phase-01-shell-leaves.md) | shell | none (`version` arm step waits for packaging P04) | `bin/fgos.mjs` (imports, sets, `main()` prologue and exit map), `command-registry.mjs`, `store.mjs` (re-export), new `store-error.mjs` | -180 bin, +45 src / 0 / -10 |
| 02 | [Invocation-root door, host-bin leaf, lock-status](phase-02-root-door.md) | T0/T1 | shim-root landed | `paths.mjs`, `host-bin*.mjs`, `fanout-batch.mjs`, `lock-status.mjs`, `bin/fgos.mjs` root lines and lock arms | -90 bin, +5 src / 0 / +40 |
| 03 | [Git and worktree arms, store admission, reset guard](phase-03-git-worktree-arms.md) | T2 | 02 | `worktree.mjs`, `main-checkout-reset-guard.mjs`, `session.mjs`, `bin/fgos.mjs` T2 arms and `main()` guards | -60 bin, +50 src / 0 / -40 |
| 04 | [Event Store lifecycle, fault logs, init use case](phase-04-event-store-lifecycle.md) | T3 | 03 | `maintenance.mjs`, `src/observe/*`, `store.mjs` (init), `bin/fgos.mjs` init/events/rebuild and lifecycle helpers | -110 bin, +85 src / 0 / 0 |
| 05 | [One run-supervisor door to run under worktree custody](phase-05-custody-door.md) **proposed - awaiting owner approval** | T4 (Execution) | 04; COOK contract text; owner | `src/run-supervisor/*`, `src/workflow/case-*.mjs` (imports), `unit-handoff.mjs` | 0 / 0 / +25 |
| 06 | [Run, dispatch, hook verdicts, tool, agents](phase-06-run-dispatch-hook.md) | T5 | 05 (or 04 if 05 is not approved) | `run-request.mjs`, `dispatch/cli.mjs`, hook scripts, `decision-question.mjs`, `bin/fgos.mjs` T5 arms and `handleHook` | -300 bin, +260 src, -170 scripts / 0 / -150 |
| 07 | [Additive `unit-run-result` fields with per-outcome fixtures](phase-07-unit-run-result-fields.md) **proposed - awaiting owner approval** | T5 (Execution) | 05 or 04; COOK contract text; owner | `src/runner/execution/{run,unit-run-history,unit-sync}.mjs`, `loops/*` | +20 / 0 / +40 |
| 08 | [Workflow arm: frame, seats, resume refusals](phase-08-workflow-arm.md) | T6 | 06 | `src/workflow/index.mjs`, `propose.mjs`, `bin/fgos.mjs` workflow arm | -45 bin, +30 src / 0 / 0 |
| 09 | [Workflow reads the retry flag](phase-09-workflow-retry-flag.md) **proposed - awaiting owner approval** | T6 (Workflow) | 07; owner | `src/workflow/store.mjs`, its test | -10 / 0 / +10 |
| 10 | [Setup, doctor, wire-agents arms; retire `preflight`; shim probe once; timer binary](phase-10-setup-doctor-surface.md) | T8 | 08; packaging P02, P04, P08 landed (or their arms skipped) | `src/setup/*`, `bin/fgos.mjs` setup/doctor/wire-agents/preflight arms, `command-routes.json` | -160 bin, +60 src / 0 / -300 |
| 11 | [Architecture rule: `src/workflow` imports no holder-lock or cwd-lock; three-seat acceptance](phase-11-architecture-rule-acceptance.md) **proposed - awaiting owner approval** | T6 (Workflow) | 05, 07, 09 | `docs/architecture-manifest.json`, `test/architecture.test.mjs`, one new test | 0 / 0 / +45 |
| 12 | [Rust host: stop self-hash and double addon read; echo out of production (verify half landed; echo waits for packaging P04)](phase-12-rust-host-verify.md) | host | `legacy_exec.rs`/`verify.rs` now; `main.rs` step after shim-root and packaging P04 | `legacy_exec.rs`, `verify.rs`, `apps/fgos/src/main.rs` (echo only), `apps/fgos/tests` | 0 / +11 / 0 |
| 13 | [One shim-or-refuse command builder](phase-13-command-builder.md) | gateway, dashboard | none | `herdr-fgos-common/.../fgos.rs`, `herdr-dashboard/src/main.rs` | 0 / -100 / 0 |
| 14 | [Gateway: loopback default, caller record, Rhai limits, spawn cap, file reads](phase-14-gateway-hardening.md) | gateway | none; the call-site switch step after 13 | `gateway.rs`, `mcp.rs`, `cf_access.rs`, `core/config-standard/gateway.yaml` | 0 / +60 / 0 |
| 15 | [Symlink-refusal leaf](phase-15-refuse-symlink-leaf.md) | packaging leaf | T8 chain on `skill-wrappers.mjs` on main | new `src/util/refuse-symlink.mjs`, `build-rust-distribution.mjs`, `skill-wrappers.mjs` (one import) | -12 / 0 / +8 |
| 16 | [Close: spec, re-measure, Vietnamese guide, closing report, lessons](phase-16-spec-measure-close.md) | close | 01-04, 06, 08, 10, 12-15 landed; 05, 07, 09, 11 landed or handed off | spec, reading map, reports, `lessons.md` | 0 |

**Net size, honest.** Phase estimates sum to: `bin/fgos.mjs` about -945 (arbitration: about -860); Node `src` about +535 (the arbitration's +300 netted deletions that the phase table books under `bin`); `scripts/` about -170 (the arbitration's -310 assumed deleting the backlog script, which decision 81 keeps); Node total about -580 against the arbitration's -750; Rust about -30 (arbitration -90: Q4 (b) saves its +70 but the loopback default and caller record cost about +25); tests about -460 before P01's per-arm census (arbitration -700, low confidence). The four proposed phases add about +20 src and +120 tests, charged to the Unit contract, not to T9's ≤ 0 close rule, and reported on their own line. Layer net (HARDEN commits only) must measure ≤ 0 in Node and Rust and in tests; a language that misses names the deletion that pays or the owner accepts the gap, as T6 did.

## Parallel groups

```
start now (file-disjoint):
  P01 shell leaves   ∥  P12 Rust host (legacy_exec.rs, verify.rs)  ∥  P13 command builder  ∥  P14 gateway  ∥  P15 leaf
  (P14's call-site switch waits for P13; P12's main.rs step waits for shim-root + packaging P04)
layer chain (one layer at a time; inside a layer, disjoint phases together):
  P02 (T0/T1, after shim-root)  ->  P03 (T2)  ->  P04 (T3)  ->  P05 (T4, proposed)
  ->  P06 ∥ P07 (T5; P07 proposed)  ->  P08 ∥ P09 (T6; P09 proposed)  ->  P11 (proposed)  ->  P10 (T8)
close: P16 after everything else landed or handed off
critical path: P02 -> P03 -> P04 -> P05 -> P06 -> P08 -> P10 -> P16 (9.5d; 8.5d without P05)
```

P11 sits in the Workflow layer but runs after P10 only if P10 is late; it needs P05, P07 and P09 on main, nothing from P10, so it may land before P10 when the owner approves. Rust and gateway phases (P12-P14) are file-disjoint from every Node phase and from one another except `gateway.rs` (P14 only) and `apps/fgos/src/main.rs` (shim-root, packaging P04, P12 in that order).

## `bin/fgos.mjs` queue, merged with the packaging phases

One writer at a time on each range (lines on `26d42ca98`; re-read by symbol). Packaging phases P02, P04, P08, P07 take slots from the same queue (packaging plan "Coordination with T9"); decision: **they land before T9 opens the `doctor`, `setup`, `uninstall` and `version` arms**, and the rule for every packaging lead stands (logic goes down, the arm keeps a call plus its flag parse).

| Range (symbol) | Writers in order |
|---|---|
| imports `:1-144` | P01 converts the shell's cross-cutting imports (error leaf, parser, registry, envelope stay static; `hook` first); afterwards each phase deletes only the static import lines of symbols it moves (single-line deletes, resolved by the later merger). Work-only static imports stay, named in the guard allowlist until the Work phase |
| `version` arm `:1001-1004` | packaging P04 (turns it into a call or removes it) -> P01 last step (deletes it; `version` is a native route) |
| `init` `:1005-1044` | P04 |
| `git` `:1045-1058` | P03 (and its root line, P02) |
| dead `gate-bypass` arm `:2255-2269`, dead names in sets `:4865-5020` | P01 |
| `workflow` `:2270-2385` | P08 |
| `dispatch` `:2639-2789`, `run` `:2790-2952`, `retiredDispatchDoorMessage` `:979-997`, `adhocUnitFromPrompt` `:472-528` | P06 |
| `events` `:2953-2974`, `rebuild` `:2975-2985` | P04 |
| `worktree` `:3820-3861`, `session` `:3862-3913`, helpers `:161-231`, `resync-worktree` `:4450-4479`, `main-checkout-reset` `:4480-4549` | P03 |
| `gateway` `:3914-3940` | none (already thin) |
| `agents` `:3970-3977`, `tool` `:3978-4021` | P06 |
| `setup` `:4022-4160` | P10 |
| `uninstall` `:4161-4231` | packaging P08 (T9 never moves it) |
| `wire-agents` `:4232-4250`, `doctor` `:4251-4271`, `preflight` `:4317-4389` | packaging P02 (doctor arm: reads `ok`) -> P10 |
| `lock`, `lock-status` `:4390-4449` | P02 |
| help and usage `:4550-4700` | packaging P04 |
| `renderPretty` `:4721-4864` setup/doctor parts | P10 |
| store sets and lifecycle helpers `:4865-5020` | P01 (fields) -> P04 (`landsWork`, `handSealsToChild`, `opensEventStore`, `isEventStoreChild`) |
| `handleHook` `:5023-5161` | P06 |
| `main()` prologue `:5162-5197` | P01 |
| `main()` dir and guards `:5198-5300` | P02 (`dataDir` call `:5214`) -> P03 (`admitStoreAccess`) ; packaging P07 (one message `:5226`) between them or after, by board line |
| `main()` lifecycle `:5301-5310`, `:5374-5389` | P04 |
| `main()` render and exit map `:5312-5350` | P01 (`exitOf` per entry) ; P10 (the `wire-agents` branches); packaging P04 if it changes the exit surface (default: keeps 4, Q-A) |
| `main()` fault record `:5351-5373` | P04 |
| **Work ranges** (listed in the arbitration §6.3) | nobody; one-line exceptions, each with WORK told: the `decision` arm import line (P01), the `unclaim` arm root line (P02), the registry `store` values of Work entries (P01) |

Other hot-file chains: `src/cli/command-registry.mjs` (84 `requiresExistingStore` lines): P01's field change is mechanical and lands first on the board; a packaging phase that edits it first lands first and P01 re-runs its codemod on rebase; then packaging P04/P08 entries, then P10 (preflight entry out). `src/setup/registrations.mjs`: packaging P02 -> packaging P01 (2 rows) -> P10 (`createDoctorRun` shim memo `:197`, `:106` import) -> packaging P10 (pin-drift row), each by board line. `apps/fgos/src/main.rs`: shim-root -> packaging P04 -> P12. `docs/architecture-manifest.json`, `CHANGELOG.md`, `packages/git/contracts/mutation-census.v1.json`, `test/suite-baseline.json` (TEST's; report, never hand-edit): rebase-only.

## Test matrix

| Layer | What | Where (owner) |
|---|---|---|
| Unit | root policies, store admission, verdict per hook kind, `buildRunRequest` refusals, `runWithEventStoreLifecycle` start/end errors, `exitOf`, `runDoctor`, shim probe once, timer binary and control characters | beside the owner: `test/runner/paths.test.mjs`, `test/runner/worktree*.test.mjs`, `test/scripts/*hook*.test.mjs` (re-pointed at the verdict functions), `test/runner/execution/run-request.test.mjs`, `test/event-store/triggers.test.mjs`, `test/setup/checks.test.mjs`, `test/setup/mailbox-sync-timer.test.mjs` |
| Integration | one wiring case per arm (child process): prompt / `--unit` / `--resume` / `--case`, dispatch retired doors, disconnected-worktree guard, lock fence | `test/cli/*` (a case that asserts a decision through a spawned CLI moves to its unit proof and leaves one wiring case; P01 census lists them) |
| Cross-language | one fixture table (a tree, an expected root) run by the Node door and by the Rust walk | `test/rust-host/` (P02) |
| Rust | edited payload byte refused; shim present/absent/unconfined; Rhai doubling script ends in a script error; one `import` refused; loopback default; caller recorded | `apps/fgos/tests`, `herdr-fgos-common` unit, `gateway.rs`, `mcp.rs` |
| Architecture | entry static imports; `src/{event-store,workflow,observe,verbs,setup}` import nothing from `src/cli`; (P11) `src/workflow` imports no holder-lock or cwd-lock | `test/architecture.test.mjs` |
| Acceptance (P11, proposed) | a three-seat council through Workflow using only fields of the `unit-run-result` contract | one new test, `test/workflow/` |

Every phase lists "Red tests first": written, run, seen failing, then code. Each new test names its behaviour and why no existing test proves it; each retired test names its new owner (plan loop step 4).

## Risks across phases

| Risk | L x I | Mitigation |
|---|---|---|
| Registry codemod (84 entries) collides with packaging P04/P08 | H x M | P01 re-runs the codemod on rebase; first-lander rule; board line before the commit |
| Line ranges drift while packaging and T9 phases land alternately | H x L | ranges by symbol; each lead re-reads before its first edit; one range, one writer |
| Fail-closed agy hook locks a user out when their config is broken | M x M | the refusal names the file and the fix; Claude has behaved this way since the script was written; CHANGELOG line; guide covers it |
| Root door changes which store a command reads for users who relied on strict cwd | M x H | policy parameter; default walk bounded by the Git top level (a linked worktree is still refused); cross-language fixture table; guide names the subdirectory case |
| Loopback default breaks a LAN or Tailscale user | M x M | guide before landing (one config line); non-loopback warning stays; owner machines named |
| Proposed phases depend on COOK text that is not written | H x L | they never gate anything; each starts only when the text exists and the owner approved; step 1 of each re-reads the contract and stops if it disagrees with the plan |
| Eight leads at once overload the machine | M x M | board HOLD lines first; start order in the groups; layers serial |

## Rollback

Each phase is one track branch merged as a unit: `git revert` of its merge commit. Rust phases (P12-P14) also need the previous release re-activated (`fgctl repair` / the recorded prior release id in the guide). P14's loopback default reverts by that route; a machine that needs LAN sets `gateway.bind` regardless. Once a later phase merged on top, roll forward with a fix. No phase changes the `~/.fgos/config.json` schema, so no all-machines activation is needed.

## Landing

Self-land each phase on fg-server2 when its gate passes (decision 79 Q8 precedent, owner ask 5 a of the arbitration): `npm test` and `cargo test --workspace` green, `convention check`, `test/architecture.test.mjs`, census scan `node scripts/git-one-door-scan.mjs --root .`, read both the ERROR lines and the fail count; focused runs through the FR one-liner, private `CARGO_TARGET_DIR` under `/home/vantt/projects/forgent-worktrees/<name>-target` (never tmpfs); board HOLD lines first; never SIGKILL a gate. Reviewers: OPC for P02 and P03 (Git facts, SafeRestore), lead:ES for P04 (spec §16), TEST pinged for P12, MAIL told for P10 (`mailbox-sync-timer.mjs`), WORK told for the Work one-liners (P01, P02), DOC told before the spec edits (P16), COOK told for P05, P07, P09, P11. Owner machine and fg-server follow one Vietnamese guide written in P16 (one section per landed phase, started at the first landing).

## Acceptance criteria (layer)

1. Every accepted finding T9-01..T9-22 is closed by a phase here or routed (arbitration §2.3); T9-23 is the packaging sub-plan's. Every High (T9-01..04) has its red test or measurement in its phase report before the fix.
2. Doors, scanned: `rg -n "agy" bin/fgos.mjs` shows no inline hook branch; `rg -n "resolveMainCheckoutRoot\(.*\) \?\? " bin/fgos.mjs` nothing; `rg -n "faultClass = " bin/fgos.mjs` nothing; `rg -n "preflight" bin src scripts packages/host-runtime/contracts` nothing outside the `package.json` script; `rg -n "bin/fgos.mjs" apps/fgos-gateway/src/gateway.rs herdr-dashboard/src packages/herdr-fgos-common/rust/src/fgos.rs` only comments; `rg -n "from '.*\.\./cli" src/event-store src/workflow src/observe src/verbs src/setup` nothing.
3. Behaviour, each by its owning test: payload `cwd` `/tmp`, `/nonexistent`, `$HOME` all judged against the project; a broken config blocks in both hook formats; `fgos list` from `docs/` reads the real store; `fgos init` from a subdirectory refuses; `main-checkout-reset --dir <other repo>` is refused; Event Store start and end errors are both recorded; the doctor runs one shim probe per shim; the three `claude` calls run in parallel; the gateway default is loopback and the caller is recorded; the Rhai doubling script ends in a script error; no `node <root>/bin/fgos.mjs` command is built by gateway or dashboard.
4. Measured in P16 on the activated release, same machine and load class as the baseline (quiet): host overhead per legacy call at most 30 ms (55 today; target 25-30 ms with L-7 alone, Q4 b says revisit only if still slow); `fgos --help` and version-class verbs about -30 to -65 ms; `dispatch decide` about -35 ms; Agent/Task `PreToolUse` about 110-130 ms (262 today); delete-guard Bash call about 55 ms (148 today); entry static import closure reported against the 10 ms target with the Work-only allowlist named; doctor with one shim probe per shim reported against 12 s. Targets are speed's estimates; a miss is reported, not hidden.
5. Sizes as the net-size paragraph; per-function budget: no new use case over 130 lines.
6. Every retired test names its new owner (or says the behaviour was removed) in its phase report and commit body.
7. Land gate green at each land; doctor row ids and count unchanged (no new row; no condition lost: arbitration §1.8).
8. If the four proposed phases are approved and landed: the three-seat council scenario of P11 passes using only contract fields, and `rg` finds no `holder-lock` or `cwd-lock` import under `src/workflow`.

## Lead rules (every brief carries these)

- One Sonnet lead per phase, own linked worktree from `origin/main` (never local main), ext4 `CARGO_TARGET_DIR`, deleted when the phase lands; stop every process you started; assert the worktree path before any cleanup `cd`.
- Find the owning test before writing a new one; never weaken an assertion of a behaviour that still exists; a deleted mechanism retires its tests in the same change; Green never comes from an env switch or test-only branch.
- Red first for every fix whose finding was not reproduced; structure-only findings start with a recorded failing scan.
- Callers by `rg` before editing any exported symbol (impact analysis is degraded unless `fgos tool query --capability impact-analysis --status present` says otherwise; name the gap). Enumerate callers with `file:line`; if more than 10, list ten and give the total.
- Change a contract: move every caller and delete the old path in the same change (L10). No new compatibility fence.
- `git diff --cached --stat` before every commit; explain any large deletion; stage explicit paths; user-visible change adds a line under `## [Unreleased]` in `CHANGELOG.md`.
- No plan ids, phase numbers or finding codes in code, tests, config or commit messages; trim existing ones in code you touch.
- Report: delta lines per language next to the estimate, test-cost line, red evidence per fix; name from `fgos convention name --kind report --type phase-lead --slug harden-t9-pNN-<slug> --json`; only what you ran; end with `Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`; a `## Lessons` section (the ledger asks for it).

## Unresolved questions

1. `--bind`: decision 81 says "explicit `--bind`/config". `fgos gateway start` has no flag today (`bin/fgos.mjs:3920-3924`, registry `:2110-2114`) and the config key `gateway.bind` exists. Plan: config only (no new flag, RUL104). Does the owner want a `--bind` flag too?
2. Decision 81 labels the gateway answer "Q2 (a)" while its text is the arbitration's option (b) (change the default). Plan follows the text, minus the "refuse non-loopback without CF/TLS" clause. Confirm the omission is intended.
3. `check-backlog-reconciliation.mjs` and the `package.json` preflight script: decision 81 says the check "stays a repo-only script". Plan keeps the three scripts and adds one `package.json` line; the drift diff of `.claude/skills` and `plugins/fgOS/skills` is dropped (owned by `test/skills/fgos-mirror.test.mjs`). OK?
4. Red-team F12 (a `.git` file whose `gitdir` does not point back): OPC answers whether Git Inspect refuses it; P02 adds the check inside the root door if not.
5. COOK's `unit-run-result` text decides the exact field names (P07), the retry flag's name (P09), the door's signature (P05) and which lock scopes the door covers: `src/workflow/case-lock.mjs:9`, `case-gate.mjs:18`, `unit-handoff.mjs:15` import `holder-lock` for scopes the custody door does not obviously cover. P05 step 1 reconciles; P11 cannot land before it does.
6. Whether `hook` kinds still left in the Node entry after P06 should be refused by name when reached on the unsupported direct-node channel (`mailbox`, `mailbox-sync`): plan says yes (T9-14); DOC confirms the wording.
7. The T9 crates' Rust test time was not measured by any seat; P16 measures it on a quiet machine or reports "not measured, suite running".
