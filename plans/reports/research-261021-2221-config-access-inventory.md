# Config access inventory: who reads and writes fgOS config, and what a config door changes for JS

Researched 2026-10-21 by reading the working tree (`src`, `bin`, `scripts`, Rust crates, `docs/architecture-manifest.json`). No web sources: this is an internal inventory. Counts come from `grep` over those paths and are exact for the patterns named, not a proof that no other access exists.

## Outcome

Comments in config are documentation that travels with each value: what the key does, which values it takes, and why it holds the value it holds, so that a stranger, human or agent, can read and change config correctly without reading code (the L5 test). Every writer must therefore write them, including `fgos setup`, `doctor --fix` and an agent editing by hand. That makes comments data, not decoration, and points to the `$comment` key already specified in `docs/specs/seat-binding.md` §5.1, rather than to YAML comments. Sections 11 and 12 hold the decisions. One finding is a live defect: `fgos setup` writes this repository's own test command as the invariant check into every project, and that command fails where the file does not exist.

## 1. Config surfaces

| File | Written by | Read by | Notes |
|---|---|---|---|
| `.fgos/config.json` (project) | `fgos setup`, `doctor --fix`, runner bootstrap | Node (many), Rust (3 crates) | 15 top-level sections; `runner` is about 22.5 KB of about 23.3 KB |
| `~/.fgos/config.json` (global) | `fgos setup`, bin-discovery cache | Node, Rust gateway | holds `gateway.*`, `runner.llmAccounts`, `runner.providers` (global-only keys) |
| `.fgos/distribution.json` | Rust `fgctl` only | Rust only | already a clean single owner; out of scope for the door |
| `.fgos/gate-bypass.json` | legacy, never deleted | Node and Rust fallback | read only when `gateBypass` is absent from config |
| `.claude/settings.json` | Claude Code and setup hooks | Claude Code | not ours to reformat |
| codex `config.toml` | codex | `trust-store.mjs` | a foreign file; not part of this inventory |

Top-level sections of `.fgos/config.json`: `herdrOrchestrator`, `runner`, `gateBypass`, `cleanup`, `invariantChecks`, `workerSlots`, `ironLaw`, `gateway`, `herdrWebDashboard`, `checkpoint`, `docRegistry`, `worktreeSetup`, `lock`, `terminal`, `eventStore`.

## 2. Node readers

Through the door (`readSharedConfig`, `readSharedConfigOrEmpty`, `loadGlobalConfig`, `mergeWithGlobalConfig`): `setup/git-checks`, `setup/agy-permissions`, `setup/holder-lock-checks`, `setup/model-pool-checks`, `setup/run-supervisor-checks`, `setup/bin-discovery`, `setup/registrations` (about 40 call sites), `verbs/merge/iron-law-level`, `verbs/dispatch/reconcile` and `inspect`, `run-supervisor/gate-kill-grace`, `state/gate-bypass`, `runner/loop`, `runner/claim-port`, `runner/fanout-batch`, `event-store/config`, `terminal-control/config`, `holder-lock/protocol`, `scripts/project-agents`, `bin/fgos.mjs` (8 sites).

Bypassing the door (own path, own `JSON.parse`):

| Site | What it reads | Error policy |
|---|---|---|
| `src/runner/gateway-control.mjs:139` | global `gateway.port` | silent default 4170 |
| `src/state/events-compaction.mjs:170` | `checkpoint.compactionEventThreshold` | silent `null` |
| `src/state/events-jsonl-truncation-guard.mjs:467` | `checkpoint.fallbackIntervalSec` | silent ignore |
| `src/setup/registrations.mjs:6151` and `:6175` | `runner.coordination.orgPolicy` (check and fix) | `passed: true` on parse error; writes with its own `JSON.stringify` |
| `src/runner/dispatch/cli.mjs:383`, `:852` | `existsSync` on the project file to choose a root | n/a |
| `src/runner/dispatch/config.mjs:148` (`loadRunnerConfig(path)`) | an explicit `--config` path | throws `RunnerConfigError` |

Project plus global merging is done in three different ways: `mergeWithGlobalConfig` (fill-missing-only, used by git-checks, event-store, gate-kill-grace, holder-lock, and the runner with a `sanitizeGlobal` filter), a hand-written `sectionOf(project)` then `sectionOf(global)` pick (terminal-control, holder-lock-checks, run-supervisor-checks twice), and no merge at all.

## 3. Node writers

`writeSharedConfig` at `registrations.mjs` lines 282, 2850, 3098, 3169 (the last writes the home directory's file); `writeGlobalConfig` at `bin-discovery.mjs:121`; `ensureRunnerConfigForDir` (`runner/dispatch/config.mjs:399`) writes a default `runner` section when absent; one direct `fs.writeFileSync(JSON.stringify(...))` at `registrations.mjs:6190`. All use `JSON.stringify(config, null, 2)`, so any comment would be lost on the first write.

## 4. Rust readers

| Site | Section | Scope | Policy |
|---|---|---|---|
| `packages/work-state/rust/src/lib.rs:72` | `gateBypass.level` plus legacy file | project | invalid gives `None`; mirrors Node `gate-bypass.mjs` |
| `packages/herdr-fgos-common/rust/src/settings.rs:78`, `:100` | `herdrOrchestrator` (fail closed), `herdrWebDashboard` (fail open) | project | by design |
| `herdr-dashboard/src/main.rs:565` | `herdrOrchestrator` again | project | a second implementation of the same read |
| `apps/fgos-gateway/src/gateway.rs:143` | `gateway.*` | global | refuses to start on missing token |

All use `serde_json`. No Rust code writes `config.json`. `serde_yaml 0.9` is present in `fgos-gateway`, `host-runtime` and `observe` for other YAML.

Duplicated logic across languages: `gateBypass` (Node `gate-bypass.mjs` and Rust `work-state`), `herdrOrchestrator` (two Rust copies), gateway port (Node `gateway-control.mjs` says it reads "the SAME way" as `gateway.rs`, by comment only).

## 5. Key-default registry

`registerConfigDefault({ id, key, shape })` has 15 registrations, all inside `src/setup/registrations.mjs` (6650+ lines). It is the de facto section registry and is what `fgos setup` merges and `doctor` checks. It sits in the setup layer while the readers sit in `src/config/`, so no single place says, for a section: owner, scope, merge rule, fail policy.

## 6. What a config door means for JS

1. **Callers.** About 21 JS files change import or call shape; about 7 bypass sites join them. About 100 test files mention config paths or readers; I did not count how many only write fixtures, which stay valid while the file stays JSON.
2. **Bridge choice.** Foundations reach Node three ways: an N-API addon (`src/event-store/native.mjs`, in-process, Linux only), a subprocess route (`src/terminal-control/client.mjs`, one process per call; a cold `fgos` start measured 97 to 110 ms in the 2026-10-16 decision), or plain JS. Config is read on hot paths: `registrations.mjs` re-reads and re-parses the file about 40 times in one doctor run, and the runner loop reads `workerSlots` every tick. A subprocess per read is not viable.
3. **Bootstrap.** `event-store/config.mjs` reads config to configure the addon, and `fgos setup` and `doctor` run from checkouts and global npm shims with no activated release (AGENTS.md, legacy-node boundary). So the Node reader cannot depend on a native addon, for the same reason js-yaml was vendored: the parser must always be present.
4. **Windows.** RUL16 makes Windows a native target while the event-store addon is Linux-only. A config addon would have to ship on Windows, or JS keeps its own implementation. My inference: JS keeps its reader, Rust gets a second implementation, and a shared contract with golden fixtures keeps them equal. That matches how `packages/*/contracts` already work.
5. **Parse once per process.** A door can cache the parsed file per process and invalidate on write; this is a speed gain for doctor. Risk: `doctor --fix` writes and then re-reads, so invalidation on write must be part of the contract.
6. **YAML.** The door `src/util/yaml.mjs` has no stringify. Keeping comments across a rewrite needs a comment-preserving writer, which is a new capability, not a refactor. The five `JSON.stringify` writers collapsing into one write path is what would make any format change a one-place edit.
7. **Architecture manifest.** `src/config/global-config.mjs` is `infra` and `shared-config-file.mjs` is `domain`; a facade needs a layer entry and the one-door test in `test/architecture.test.mjs` needs a rule that blocks new direct reads.
8. **Do not absorb the runner schema.** `src/runner/dispatch/config.mjs` is 1842 lines of `runner` section validation; it stays with the runner. The door stores and returns sections; each owner validates its own.

## 7. Write paths

| Path | Trigger | Writes | Source |
|---|---|---|---|
| `ensureSharedConfigDefaults` | `fgos setup` (project file and `~/.fgos/config.json`) | fills missing registered keys; writes only if a key was added or the file is new | `registrations.mjs:275`, `bin/fgos.mjs:4047-4050` |
| `runFixes` | every `fgos setup` run (unconditional) and `doctor --fix` | read, change, rewrite the whole file when a value is missing or invalid: `gateBypass.level`, `ironLaw.level`, `orgPolicy.dischargeOn`, `gateway.token` (random 256-bit secret, in `~/.fgos/config.json`) | `registrations.mjs:2850, 3098, 3169, 6190`, `bin/fgos.mjs:4071, 4223` |
| `ensureRunnerConfigForDir` | every `fgos run`, dispatch, runner loop and `fgos-runner` start (23 call sites) | adds missing `runner` default keys, or creates the file with a probed executor; reports on stderr | `runner/dispatch/config.mjs:399` |
| `refreshGlobalBinCache` | `fgos setup` | `bin.globalFgosPath` in `~/.fgos/config.json` | `bin-discovery.mjs:108` |

## 8. Does anything run setup or `doctor --fix` automatically?

Checked and found no automatic trigger in the repository's own hooks:

- `.claude/settings.json` hooks run only `.claude/hooks/*.cjs`, `fgos hook dispatch-decide`, `fgos hook decision-question` and `scripts/fgos-session-start-hook.mjs`. That last script imports only `detectRcFiles` from `shell-rc.mjs`; it does not read or write config.
- `package.json` scripts contain `setup:hooks` (git hooks only), `release:*`; no `postinstall` or `prepare` that runs `fgos setup`.

Found two automatic triggers:

1. **Install and upgrade tail.** `fgctl` runs `init`, `doctor --fix`, `doctor` after activation (`packages/distribution/rust/src/init.rs:555-561`, `run_tail`, called from 7 sites in `init.rs`), so installing or upgrading a release rewrites config through the fix list. I did not trace which of the 7 sites are init, upgrade or recovery.
2. **The runner bootstrap** (row 3 above), which writes on any ordinary command. This contradicts the header of `shared-config-file.mjs` ("never triggered implicitly by a read") and the RUL9 rule it cites that `setup` is the one write verb.

## 9. Are read-time defaults already applied for every section?

Not for every section. Result per section of `.fgos/config.json`, comparing what the reader does when the key is absent with what setup writes:

| Section | Absent key at read time | Same as the value setup writes? |
|---|---|---|
| `gateBypass`, `ironLaw`, `cleanup`, `checkpoint.fallbackIntervalSec`, `lock`, `terminal`, `eventStore`, `workerSlots` | default applied in code | yes |
| `herdrOrchestrator`, `herdrWebDashboard`, `docRegistry` | Rust and Node apply the same constants | yes (the constants are duplicated across Rust and `registrations.mjs`) |
| `worktreeSetup` | `[]` | yes (default is `[]`) |
| `invariantChecks` | `[]`, by design: "that default belongs to what `fgos setup` WRITES, never to what a reader silently assumes" | **no**: setup writes `node --test test/architecture.test.mjs` |
| `runner` | defaults merged in memory by `mergeConfigDefaults` | partly: the executor is probed from `PATH` at first run and written (`bootstrapDefaultExecutor`) |
| `gateway` | port and bind default in Rust; token has no default | **no**: `gateway.token` is a generated secret that must persist |

So moving defaults to read time is safe for 11 of 15 sections, but not for three kinds of value: a project-specific template (`invariantChecks.commands`), a probed machine value (`runner.executor`), and a generated secret (`gateway.token`), plus the cached `bin.globalFgosPath`. These four need a different home, not a read-time default.

## 10. Facts checked for the decisions

- **Prior art for system-written comments.** `docs/specs/seat-binding.md` §5.1 already specifies it for the tier ladder: the text is one constant in the code, `fgos setup` writes it as a `"$comment"` key beside `modelPolicies`, `tierFallback` and `maxTier`, the loader ignores `$comment` at every level, it is removed before validation and before the semantic config hash, and doctor reports a `$comment` that differs from its source. Its plan (`plans/261020-2132-seat-binding-component/`, phase 05) is pending; no code uses `$comment` yet.
- **The registry has no place for a comment.** `registerConfigDefault({ id, key, shape })` (`src/setup/registrations.mjs:199`) carries values only.
- **A comment-preserving YAML writer would need a second library.** js-yaml cannot keep comments on rewrite. The `yaml` package (2.9.1, ISC, no dependencies) can, but it is the library the 2026-10-16 decision removed, it ships as many files rather than one bundle, and it would replace js-yaml behind the same door. Rust is not a constraint: it never writes `config.json`, and it has maintained options anyway, both serde parsers (`serde-saphyr`, `serde_norway`, `noyalib`) and comment-preserving editors (`yaml-edit`, `noyalib`'s CST, `yaml-rt`). An earlier draft of this report said Rust had none; that was wrong. `serde_yaml`, used by three crates here, has been archived since March 2024 and should move to one of these regardless (RUSTSEC-2025-0068 lists the maintained forks).

- **The direction is already accepted.** `docs/platform/secrets/spec.md` (2026-10-19, decision history: "accepted in direction" by the owner) says credentials and config loading are two components, `secrets` is the lower one, config loading depends on it for `${VAR}` expansion, and consolidating the scattered loaders is a separate item. Secrets is decided as Rust (2026-10-20); its Node bridge is still open there.
- **The `invariantChecks` default breaks other projects.** `fgos setup` writes `node --test test/architecture.test.mjs` into every project, and `src/runner/merge.mjs:1216` and `:1246` run it before merge. In a directory without that file, `node --test test/architecture.test.mjs` exits 1 (checked in a scratch directory). So a project that ran setup and did not replace the value gets a failing invariant gate. This hurts mission #1 (projects that use fgOS), not only this repo.
- **The dashboard reader is a leftover.** Its own comment says it was written before the shared settings module landed, and `herdr-dashboard` already depends on `herdr-fgos-common` and imports `settings` (`main.rs:15`).
- **Test footprint.** 19 test files call the config readers or writers; 100 more only reference the `config.json` path, almost all to write fixtures. A file rename touches those 100, so fixtures should be written through one test helper before any format change.
- **Machine-local state already has a home**: `~/.fgos/runtime/` is used by Node code today.

## 11. Decisions

1. **Comments are data: `$comment` keys in the config file.** This generalizes the seat-binding rule from the tier ladder to every section. It survives every read-modify-write in Node and Rust and any hand edit, needs no new parser or library, and Rust serde readers ignore unknown keys unless a struct denies them, which the contract fixtures will check.
2. **Two kinds of comment, two sources.** What a key means, which values it takes and its default come from one source in code: `registerConfigDefault` gains a comment per key, and `setup` writes it. Doctor reports a generated comment that drifts from its source (principle 7). Why a key holds a non-default value comes from whoever set it. The door's write operation refuses a change without that reason, and doctor reports a non-default value with no reason, which catches hand edits by people and agents alike.
3. **Withdrawn: "tools never rewrite a file a person edits".** That rule protected comments from writers. When every writer carries comments, through `$comment` data or a comment-preserving YAML editor, and `setup` filling missing keys is useful again, because each added key arrives with its explanation.
4. **Format: owner decision pending.** Two viable shapes. (a) `$comment` keys in JSON: cheapest, already specified for the tier ladder, no library change; but a 1500-line file with comment strings is harder to read, and reading is the purpose of the comments. (b) YAML with real comments: reads cleanly; costs vendoring the `yaml` package as one bundled file in place of js-yaml (reversing the library choice of 2026-10-16, not its zero-dependency rule), moving the Rust readers to a maintained crate, rewriting the test fixtures through one helper, and a read-both window for the global file. Recommendation: (b), because the cost is one-time and the benefit is the goal itself. Either way, decisions 2 and 5 hold, and comments are generated from the registry and required on every write.
5. **Still standing from the first round**, each for its own reason: the `invariantChecks` default becomes empty (live defect in other projects); `runner.executor` is detected from `PATH` at read time instead of probed into a tracked file shared across machines; `bin.globalFgosPath` moves to `~/.fgos/runtime/` because it is a cache; `gateway.token` moves once into the secrets component because it is a secret.

## 12. Order of work

| Step | Content | Depends on |
|---|---|---|
| 1 | One JS door: move the 7 bypass readers onto it, remove the `sectionOf` copies, parse once per process, strip `$comment` before validation; architecture rule against direct reads; one fixture helper for tests; replace the dashboard's duplicate Rust reader | nothing |
| 2 | Comments: comment per key in the registry, `setup` writes them, the write operation requires a reason for a non-default value, doctor checks drift and missing reasons; the seat-binding ladder comment becomes one user of this, not its own mechanism | 1 |
| 3 | `invariantChecks` default empty | nothing; can land first |
| 4 | Executor detected at read time, bin cache to `~/.fgos/runtime/` | 1 |
| 5 | Section contract and golden fixtures shared by Node and Rust, including `$comment` | 1, 2 |
| 6 | `gateway.token` into the secrets component | secrets component |

Step 2 must be coordinated with the seat-binding plan's phase 05 so that `$comment` has one definition.

## Sources

- [yaml-edit on docs.rs](https://docs.rs/yaml-edit), [yaml-rt](https://docs.rs/crate/yaml-rt/0.2.0), [noyalib lossless edit example](https://docs.rs/crate/noyalib/0.0.17/source/examples/lossless_edit.rs)
- [RUSTSEC-2025-0068](https://rustsec.org/advisories/RUSTSEC-2025-0068), [serde_yml 0.0.13](https://docs.rs/crate/serde_yml/latest), [serde-yaml deprecation thread](https://users.rust-lang.org/t/serde-yaml-deprecation-alternatives/108868)

## 13. Owner direction for the panel (2026-10-21)

The owner set the shape: two tools. A YAML tool that reads, writes and merges YAML, keeping comments. Above it, a config tool that carries a schema and applies it downward (types, defaults, generated comments, scope, merge rules). Comments are mandatory and every writer, including agents and `fgos setup`, writes them.

The owner also challenged one constraint in this report: these are very low layers, so JS should not depend on them heavily; find a way to remove that dependence. Section 6 point 3 and decision 8 above assumed Node must keep its own zero-dependency reader because `fgos setup` and `doctor` run without a native addon. That assumption is open for the panel to test, together with Rust-first foundations (design principle 4), the component authority and boundary of the two tools, and where the schema lives.
