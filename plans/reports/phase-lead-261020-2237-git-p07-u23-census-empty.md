# Git phase 07 unit 23: make the census empty, the doctor green

Worktree `.claude/worktrees/git-p07`, branch `git/p07-switch`, from tip `fe6992580`. No `git add` or `commit` was run. All the work stayed in this session; no subagents.

## Result

- `node scripts/git-one-door-scan.mjs --write-census` finds **0 sites** in about 7 s.
- `packages/git/contracts/mutation-census.v1.json` is rewritten from this tree.
- Doctor `git-mutation-one-door` (`checkMutationOneDoor`) is **green** on it: "no Git writer outside the fgos-git driver (827 files scanned, payload digest d694974f6219)".
- The nine original shapes and every later probe still report their site.
- Seven new probes cover the new flows. Each must report a Git spawn.

No path allowlist, env switch or test-only branch was added. Every class is reached by value flow.

## Before → after

Sites:

| Site family | Before | After |
|---|---|---|
| unresolved-binary | 198 (194 from one cliSpawnAdapter flow, 3 Rust, 1 Windows `HelperExe`) | 0 |
| spawn (`power-loss-driver.mjs`, from main) | 2 | 0 |
| shell (`forge-probe.sh`, from main) | 1 | 0 |
| **total** | **201** | **0** |

Named classes:

| Class | Before | After |
|---|---|---|
| hook-read-context | 21 | 21 |
| configured-binary | 76 | 96 |
| rust-test | 93 | 93 |
| standalone-skill-script | 2 | 2 |
| argv-runner | 3 | 10 |
| production-sandbox-probe | 2 | 4 |
| git-driver | 1 | 1 |
| uncalled-wrapper | 6 | 20 |
| sandbox-door | 2 | 2 |

Why the classes moved:
- **configured-binary** grew because the executor flow now reaches its parsed config files.
- **argv-runner** grew with the resolved bwrap locations and the running executable behind `HelperExe`.
- **production-sandbox-probe** grew with the holder-lock borrow vectors through `run_borrowed`.
- **uncalled-wrapper** grew with dormant event verbs and similar callers. They are now reached because the flow is sound, see below.

## What closed each group

### cliSpawnAdapter (194 rows), by value flow (coordinator decision)

The rows were not 194 real gaps. The evaluator dropped the property path at every element or index read, so `invocation.command` widened to the whole runner config and then to model and pattern fields. The fixes, all in `scripts/git-one-door-scan.mjs` (Git spec §12, dated unit 23):
- **Property paths keep exact keys.** `*` is any element, `**` is one or more nested elements, and `argv[0]` picks that item of an array literal. This keeps a recursive deep merge (`mergeInto`) finite.
- **Recursion and cycles.** A recursive function may be re-entered a bounded number of times. Within one site's share, results are memoised. A cycle uses a small fixpoint: it starts empty, re-runs until its values stop growing, and keeps no tainted entries.
- **No program.** String, object, array and function values are no program, since `child_process` refuses a non-string. `a && b` is `b`.
- **Function values.** A name bound to a function is a function value. A call of a parameter holding a function (the global config `sanitizeGlobal`), or a method on a parameter (`driver.prepare`), is resolved where callers pass the function.
- **Map registries.** A module-private `Map`/`WeakMap` read through `get` yields everything the module `set`s (confinement `DRIVER_REGISTRY`).
- **Nested call contexts.** An object read out of a call-bound object keeps its calls. This was the bug that left `prepareBwrapSync` parameters unbound.
- **More callers found:** namespace imports, `await import`, re-exports, `...fn(x)` spreads, and unparenthesised `x => ..` arrows. `referenced()` counts only importers and ignores `obj.name` properties.

The command now ends at `JSON.parse` of the runner, shared and global config files (`configured-binary`, for example `authority.mjs:1142`, `cli.mjs:735`) or at the literal default `claude`. That is the operator configuration that `resolveExecutorConfig` reads.

### Functions with direct callers that also travel as values (soundness)

A wrapper is now resolved at its callers by name **and** at the places its value is called. Unresolved still means a site. About 40 wrappers have both kinds of call, and all of them resolve. Unit 22's 140 rows came from the path loss above, not from this rule.

### Rust

Covered forms: `if let`/`let .. else`, `match` arms with `Some(x)`, `.then(|| v)`, iterator picks from a const list, closure parameters, first `it.next()`, `self.method()` locals, `vec![first, ..]`, tuple structs (`HelperExe(p)`, `.map(HelperExe)`), and `use unix as os`.

| Row | Resolved to |
|---|---|
| `containment/linux.rs:28` `bwrap` | The envelope's `bwrapPrefix` (`supervise.rs:415`, configured-binary) or `/usr/bin/bwrap`, `/bin/bwrap`, `/usr/local/bin/bwrap` (argv-runner) |
| `containment/linux.rs:128` `prefix[0]` | The same values, through `BwrapPidns::new` and the given prefix |
| `semantics.rs:118` `HelperExe` (Windows) | The running executable (`current_exe`, argv-runner) |

For `HelperExe` the coordinator's Node-caller rule is now general. A parameter of a `#[napi(constructor)]` is also the argument at the same position of each `new <addon>.Type(..)` in the JS payload, and it continues through the JS callers. `GitPublication`'s helper resolves to the manifest's `entries.fgos` (configured-binary).

The Node side wrote the helper path onto the addon's exports object (`addon.helperExe = ..`). It now keeps it in a module `WeakMap` read through `nativeHelperExe(addon)`, which makes the contract explicit:
- `src/git/native.mjs` and `src/git/index.mjs` changed.
- `test/git/native-load.test.mjs` now asserts through `nativeHelperExe`.

The holder-lock borrow vectors run real `git` through `run_borrowed` (`route.rs:514`, `init.rs:1115`). They surfaced once the flows above resolved. An argv `[program, "-C", repo, ..]` now keeps its repository with the program it resolves to. The repository here is proven to be the probe's own `temp_dir()` directory, so these spawns are `production-sandbox-probe`. The same argv on a caller-named repository stays a site, and the `rust-sandbox-argv` probe asserts both cases.

### Three new rows from main

`scripts/event-store/power-loss-driver.mjs` and `forge-probe.sh` now go through the sandbox door: `sandboxGit(root)` in JS, and `sandbox-git.mjs --root` for the shell clones. I checked `power-loss-driver.mjs init` by hand: it creates the seed commit and sets `fgos.machineId`.

## E4 (coordinator decision)

Unit 22's rule is kept: park only when a marked descendant survives on `linux-pgroup`. Spec §15 E4 has a dated coordinator note that keeps the residual gaps: `env -i` or other-user descendants, an escapee behind a failing hook, and `macos-tree`.

## Proofs (design principle 8)

- **Owning proof** is `test/git/one-door.test.mjs`. Seven shapes were added to `SHAPES`: `config-path-flow`, `function-param-call`, `map-registry`, `both-ways-value`, `rust-option-match`, `rust-sandbox-argv`, `napi-node-caller`. The second test also asserts the sandbox pair: one site at line 22, and one `production-sandbox-probe` for `probe`. No assertion was weakened, and the fixtures README was updated.
- **Command:** `node scratchpad/t.mjs test/git/one-door.test.mjs test/architecture.test.mjs test/git/native-load.test.mjs`. `t.mjs` sets the addon env through `ensureGitAddon` and runs under umask 077. Result: **42 pass, 0 fail, 1 skip**.
- **Doctor:** `node -e 'import("./src/setup/git-checks.mjs").then(m=>console.log(m.checkMutationOneDoor(process.cwd())))'` gives `passed: true`.
- **Rust:** no Rust source changed, so no cargo or clippy run was needed.
- **Sandbox-only failure:** `test/setup/git-checks.test.mjs` "an unused controller fence ..." fails here with `git-driver-io: Read-only file system`. It fails the same way with HEAD's `native.mjs` and `index.mjs` restored, so this change did not cause it.

## Concerns

- **Scan time:** about 7 s, up from about 4 s. The per-site budget went to 300k steps and the depth bound to 200, with memoisation.
- **Not run here:** full `npm test` and E3 are host-only, as the brief says.
- **GitNexus:** impact analysis was not run for the scan, native-loader and script edits. The blast radius was checked by grep instead: `nativeHelperExe` and `helperExe` have one reader each.
- **Wide over-approximation:** module-global `WeakMap` state makes every `loadNativeAddon` caller a source of the helper path. It is sound, but it is why dormant event verbs now show as `uncalled-wrapper`.

Status: DONE
Summary: The census is empty (201 → 0 sites) and doctor `git-mutation-one-door` passes on it: executor commands are traced by value flow to the runner config files, the scan follows functions with direct callers both ways and handles the bwrap, `HelperExe` (N-API) and borrow-vector Rust flows, and two event-store scripts now use the sandbox door. Seven new probes keep false negatives out.
Concerns/Blockers: Scan takes about 7 s; one setup test fails only in this sandbox (read-only state root) and fails the same way on HEAD.
Context refs:
- plans/reports/phase-lead-261020-2126-git-p07-u22-close-the-census.md
- plans/reports/phase-lead-261020-2046-git-p07-u21-empty-the-census.md
