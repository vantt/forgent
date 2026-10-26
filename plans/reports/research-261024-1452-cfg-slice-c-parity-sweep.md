# Slice C phase 09: parity sweep and fixture refusal census (read-only)

Date 2026-10-24 (Asia/Saigon). Worktree `cfg/slice-c-c` (origin/main cff208ad1, then merged to 9a0656382). Paths and ids only; no value was printed. Real config files were never written (`~/.fgos/config.json` mtime unchanged, no `~/.fgos/private`); every write-capable verb ran against copies in `/tmp/fgos-work/cfg-sweep/`. Scripts: `.fgos/runtime/tmp/sweep-run.sh`, `sweep-compare.mjs`, `census-hook.mjs`, `census-run.mjs`, `census/analyze.mjs` (uncommitted).

## Method and which host

- `fgos config ...` does not exist in the installed release (`fgos: unknown verb "config"`). All verbs ran through the working-tree host (`scripts/run-rust-dev-host.mjs`, the same as `npm run fgos:dev`), with `HOME` and cwd pointing at copies. Note: `npm run` overrides `INIT_CWD`, so the script is called directly; fixtures must live outside the worktree, or the host resolves the worktree's own `.fgos`.
- Old effective value: `mergeWithGlobalConfig(readSharedConfig(root))` per top-level section, `loadRunnerConfigFromDir(root)` for `runner`. New effective value: `fgos config show` (the snapshot). Compared leaf by leaf; secret paths (`llmAccounts`, `token`) skipped.
- Projects on this machine: activation records found only for `~/projects/forgent`. `~/projects/forgent-mailbox` has a config (not activated); it is byte-identical to forgent's (`cmp`). `~/projects/mdview` has no config. So two config files plus the global file.

## Part 1 results

### As the files are today (refused)

Both projects and the machine alone are refused today. Every `fgos config show` / `migrate --dry-run` / `check` fails:

| Rule id | File | Path | Why | Handling |
|---|---|---|---|---|
| `config-key-in-wrong-file` (destination-absent) | global | `gateway.token` | account pools and token have no `~/.fgos/private` copy yet (precondition 3, stage 1 not run on this machine) | mechanical: `fgos config migrate --global` (stage 1; keeps the source). Dry-run says 2 paths, 1 token and 5 account entries pending |
| `config-key-in-wrong-file` (destination-absent) | global | `runner.llmAccounts` | same | same |
| `config-machine-files` (private-missing) | machine | n/a | same | same |
| `config-key-out-of-scope` | project (forgent, mailbox) | `gateway.port` | `gateway.port` is a global-only key; the project file holds it. `migrate --dry-run` counts it as `droppedOutOfScope` | owner decision, see O1 |
| `config-key-in-wrong-file` (warn after stage 1) | project | `gateway.token` | project token is `null`, a placeholder; belongs in the token file | migrate drops it (`droppedOutOfScope`); mechanical |
| `config-format-legacy-json` (warn) | project, global | n/a | still JSON | expected until migrate |

After stage 1 on a copy of the home: the machine alone (empty project) passes (`ok: true`, only warns). forgent and mailbox are still refused for `gateway.port` alone.

### Value parity, with the two out-of-scope gateway keys removed (what-if, copy)

| Project | same leaves | added-by-standard | dropped-by-rule | changed | refused |
|---|---|---|---|---|---|
| forgent (and mailbox, identical) | 251 in `runner`, 27 elsewhere | 7 | 0 | 0 | yes as-is (`gateway.port`) |
| bare project (`{}`), representing a fresh/short project on this machine | n/a | 167 | 0 | 0 | no |

The 7 added for forgent/mailbox: `eventStore.seal.intervalSec`, `eventStore.sync.intervalSec`, `eventStore.rebuild.maxAttempts`, `gateway.bind`, `secrets.projectFile`, `secrets.sources`, and `runner.$comment` (old loader strips `$comment`; the snapshot keeps it, the loaders ported in phase 10 must strip it, the migrate converts it to a doc line). The first six are standard entries that old code supplied as code defaults (equal values; B's `registry_defaults` proof).

The bare project gains 161 `runner` paths: `modelPolicies` 34 (gemini, z-ai, xai, deepseek, `openai.standard` and others: the global file holds only `claude` and `openai.nano`), `capabilities` 70, `executors` 49, `tierFallback` 6, `patterns` 1 (seatBinding schema), `defaults` 1. This is the stale-catalog class; it is the intended effect of the standard. Every project on this machine with a short `runner` gets it at the first snapshot.

No `changed` path in any case. `rigorToTier` is already gone from the global file (backup `config.json.bak-261024-drop-rigortotier` exists); no extended tier cell in the global file; so the dropped-by-rule class is empty here.

`migrate --dry-run` (forgent, after stage 1): kept 15, droppedRedundant 257, droppedRetired 1 (`lock.predecessorKillWaitMs`, no reader, undescribed key, the snapshot tolerates it meanwhile), droppedOutOfScope 2 (`gateway.port`, `gateway.token`), docConverted 1 (`runner.$comment`), machineOverrides 28 (paths needing `--accept-machine-overrides`: mostly capability `description`/`confinement.mode` differing from the standard), unknownKept 0. Mailbox identical.

### Items for the owner (behaviour other projects could see)

- O1. `gateway.port` in a project file is refused after cutover (global-only key). Today the old readers took the project value over global (they are equal here). Options: migrate drops it (the global one applies; recommended, equal values), or schema allows it in project scope. Any other project that holds a project-level `gateway.port` (check on design-lap and fg-server2) changes behaviour if the two differ.
- O2. 28 machine overrides in forgent/mailbox: migrate needs `--accept-machine-overrides`; the owner decides keep (stay as project overrides) or drop to the standard. This is the forgent project's own choice, not another project's.
- O3. Stale-catalog gain (161 paths on a short-runner project): expected by design, but it changes what other projects dispatch (new executors, model policies, capabilities appear). Owner reads and accepts before G-C1.
- O4. Standard-vs-code-default equality for `eventStore`, `gateway.bind`, `secrets` is by B's proof; no action.

Mechanical: stage 1 per machine, migrate project (drops the gateway keys, `$comment`, redundants), the `$comment` strip in the ported runner loader.

## Part 2: fixture refusal census

Method: no `npm test` (per brief). The 188 test files that write a config (`rg` on config-fixture, `.fgos/config.json`, `config.json`, plus tests importing helpers that do) ran one at a time, sequentially, in the staged test environment (`buildTestEnv`), `HOME` pointing at an empty scratch home, with a preload that, after every in-process `writeFileSync` of `.fgos/config.json`, runs `checkConfig` and logs rule ids and paths. Run on the pre-merge tree (the merged commits touch only `scripts/run-tests.mjs`, its test and docs). 1671 writes judged in 114 files. Limits: writes made inside spawned subprocesses (the CLI) are not seen; 2 files (`agent-cli-trust-check`, `credential-copies-retained-check`) hit `config-trusted-root-unresolved` (non-repository fixture dirs) and were not judged; 4 files exited non-zero (`dispatch-retired-doors`, `dispatch-run-timeout`, `loop`, `direct-crash-matrix`), not compared with the 18-red baseline.

**60 distinct test files have a fixture the strict snapshot refuses** (59 project-scope, 1 global; 746 of 1671 writes). Well under the 120 stop line.

| Group (distinct files) | Rule | Path(s) | Fix kind |
|---|---|---|---|
| 39 (31 only this) | `config-schema minimum` | `runner.timeoutMs` (schema floor 60000, fixtures use 30000 and smaller) | fixture wrong, OR schema floor question (S1) |
| 4 | `config-schema minimum` | `checkpoint.fallbackIntervalSec` (fixtures use 0 to disable) | same (S2) |
| 10 | `config-key-out-of-scope` | `gateway.port` (8), `bin.globalFgosPath` (2) | fixture wrong: global-only keys written with the project writer; use the global writer |
| 11 | `config-key-in-wrong-file` | `runner.llmAccounts`, `runner.providers.<id>.accounts` | fixture wrong: account pools need the accounts file; needs an accounts-fixture helper |
| 9 | `config-parse` | whole file | the test intends malformed bytes (raw writers); asserts a refusal, so they keep failing by design, assertion must name the new id |
| 10 | `config-schema` type/enum/required/minItems/oneOf/uniqueItems/const | `invariantChecks.commands`, `gateBypass.level`, `ironLaw.level`, `runner.executors.*.kind`, `modelPolicies.*`, `tierFallback`, `runner.defaults.tier`, `maxTier`, capability `tier`/`prefer`/`seats` | mixed: incomplete fixtures (executors without `kind`, empty `prefer`), or tests that intend an invalid value and assert the refusal (iron-law, gate-bypass, tier-cell, tier-fallback, doctor-config checks) |

Groups overlap (60 distinct files; 31 files hit only the timeout floor, 5 only B, 3 only C, 3 only D, 3 only E). By directory: `test/runner` 25, `test/setup` 10, `test/e2e` 6, `test/cli` 5, `test/run-supervisor` 4, `test/config` 2, `test/scripts` 2, `test/state` 2, `test/workflow` 2, `test/helpers` 1, `test/seat-binding` 1.

Static counts: tests that read config bytes raw (`readFileSync` of a config path) 15, plus 10 that `JSON.parse` a config path (phase 00 counted 21; overlap); tests using the raw writers 19; tests writing `config.json` by hand 3; tests importing `readSharedConfig`/`loadRunnerConfigFromDir`/`mergeWithGlobalConfig`/`loadGlobalConfig` 24; tests importing `src/config/(shared-config-file|global-config)` directly 12; tests mentioning `ensureRunnerConfigForDir` (write-on-read) 8.

### Phase 18 re-estimate

Planned 12h. Refused fixtures 60 files (limit 120). If the 60000 floor stays: 39+4 files need a fixture value change, mostly mechanical sed-like work, but tests that need short timeouts (`dispatch-run-timeout`, loop) need a different lever; with the other groups, the helper moves (15+10 raw readers, 12 direct importers, 8 write-on-read) and an accounts helper: estimate 14-16h. If S1/S2 relax the floors in the schema: about 9-11h. Both under the 20h stop line, so no decision question is required before scheduling 18; S1/S2 are the one thing to settle first.

## Questions for Config's owner

- S1. Is `runner.timeoutMs` minimum 60000 intended? 39 fixtures (30000 and smaller) and any test of timeout behaviour conflict with it. Real files are unaffected (forgent uses 2100000).
- S2. Is `checkpoint.fallbackIntervalSec` minimum 1 intended, given fixtures (and possibly users) set 0 to disable the fallback?

## Not checked on other machines (design-lap, fg-server2)

Run on each, with the release that has the `config` verbs (or the dev host), reading only:

```
find ~ -maxdepth 4 -path '*/.fgos/installation/activation.json' -not -path '*/node_modules/*'
# for each project root P, on a copy (cp -r P/.fgos/config.json to a scratch dir outside any repo, HOME=scratch home with a copy of ~/.fgos/config.json):
fgos config check
fgos config migrate --dry-run
fgos config migrate --global --dry-run      # machine: pending stage-1 paths
fgos config show 2>&1 >/dev/null            # lists every refusal (id, file, path)
```

Report per project: refusal ids and paths, counts of kept, droppedRedundant, droppedOutOfScope, droppedRetired, machineOverrides, and whether the project file holds `gateway.port`, `bin.globalFgosPath`, `runner.rigorToTier` or an extended tier cell in the global file. Compare effective values with `.fgos/runtime/tmp/sweep-compare.mjs` (copy it with the two scripts) after stage 1 on a scratch home.

Unresolved: the 4 non-zero-exit test files were not compared to the 18-red baseline; the 2 unjudged files are in non-repository fixture dirs.

Status: DONE_WITH_CONCERNS
