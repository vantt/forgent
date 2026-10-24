# Config Slice D, phases 00-02: facts, Confinement Authority amendment, machine-private mask

Branch `cfg/slice-d` (worktree `/home/vantt/projects/forgent-worktrees/cfg-slice-d`). Not pushed, not merged.

## Result

- Phase 00: facts re-verified; recorded in `phase-00-facts.md` ("Re-verification" section). Commit `97d4679fa`.
- Phase 01: spec amendment, before any code. Commit `cc463d668`. `docs/specs/confinement-authority.md` gains section 9.3 (machine-private roots), the section 12 decision row dated 2026-10-23, the 9.2 and 11.3 and header and S3/13 count amendments; Secrets question 4 answer (+ decision-history row); Config G6 row. Board line posted first (no lane held the confinement files: the "File chung dễ va" table does not list them; last commits `fc0cceec5`, 2026-10-22 and older).
- Phase 02: code and tests (commit after this report's parent; see git log).

## Phase 02 behaviour

- `MACHINE_PRIVATE_ROOTS = ['{home}/.fgos/private']` and `resolveMachinePrivateRoots({homeDir})` in `resources.mjs`; the token-filling loop of `resolveBlindHiddenRoots` is now one shared helper (`existingDirectories`), not two copies. `resolveConfinementResources` takes `homeDir` (default `os.homedir()`) and pushes one `hidden-root` resource (`machinePrivate: true`) per existing root for every request; blind adds its own roots after, skipping duplicates.
- bwrap driver: non-blind argv is `mounts, --tmpfs <root>, attempt binds, --remount-ro <root>`; with no root on the host it is byte-identical to before (existing pin passes). Blind branch unchanged except its `hidden` set now includes the machine-private roots. `blindRefusals` skips machine-private roots; new `machinePrivateRefusals` refuses cwd, repoRoot and any granted mount inside a root with `machine-private-hides-workspace`, for every request, before spawn.
- Attestation: no change needed; `hiddenRoots` already copies every `hidden-root`.
- Probe `machine-private-hidden` (standard set, 9 probes; blind adds `peer-run-hidden`, 10): one result that loops over `BUILTIN_POLICY_IDS` (and the same policies again under the blind override when `blind`). Falsifier `brokenConfig` drops the machine-private resources. Fingerprint carries `machinePrivate` (sha256 of the list).
- Doctor row `confinement-probe-freshness` message now prints the real probe count instead of a hard-coded "8".

## Evidence (real bwrap `/usr/bin/bwrap`, suite environment)

```
LIVE blind=false falsifier=false passed=true  (2 policy/hostRead combinations)
LIVE blind=false falsifier=true  passed=false host-write-denied: {"accounts":"ok","token":"ok","entries":2,"outbox":"ok","workspace":"EROFS"}; workspace-write: {"accounts":"ok","token":"ok","entries":2,"outbox":"ok","workspace":"ok"}
LIVE blind=true  falsifier=false passed=true  (4 combinations)
LIVE blind=true  falsifier=true  passed=false (all four combinations read the planted files)
LIVE all (blind) true: ... machine-private-hidden:true peer-run-hidden:true
```

Tests (via `runSelectedTests` from `scripts/run-tests.mjs`, `CARGO_BUILD_JOBS=4`, own target dir `/home/vantt/projects/forgent-worktrees/cfg-slice-d-target`): new `dispatch-confinement-machine-private.test.mjs` + credential hygiene = 18/18; the other 21 files that import the confinement modules (authority, backend-p03, blind, p04, p05, policies, reaper-fence, label, r9 cache, credential renewal and per-cli sources, handoff-refs, bwrap-driver, sweep, doctor checks, architecture, one-door and others) 293/293 + 218/218 earlier run. 0 failed, 0 skipped. No `npm test`, no `cargo test --workspace`.

## Pins updated (same change)

`dispatch-confinement-blind.test.mjs` (8 to 9, 9 to 10), `dispatch-confinement-backend-p03.test.mjs` (8 to 9, doctor message regex), spec counts. Behaviour owners: probe count and falsifier, `dispatch-confinement-machine-private.test.mjs` (resolver, argv order, refusal) and the harness probe; the existing non-blind argv pin in `dispatch-confinement-blind.test.mjs` still owns the no-root bytes. Credential delivery: one new case in the hygiene test.

## Caps

Node source delta +178 lines net (201 added, 23 removed; cap 260). No Rust touched.

## Deviations and concerns

1. **No `BWRAP_DRIVER_VERSION` bump.** The plan asked for one. `'local-bwrap-v1'` is also the proof profile and contract id printed in attestations, doctor messages and many tests; the new `machinePrivate` digest in the probe fingerprint already invalidates every cached proof once, which is the purpose of the bump. The spec text says exactly that. Reversible in one line if the owner wants the string bumped.
2. **`src/setup/registrations.mjs` touched (one message line, one description)**, a file outside the phase's ownership list: the hard-coded "all 8 ... probes passed" would be false at 9 probes. Does not touch the registrations other lanes are editing beyond that line.
3. **Probe scratch location.** The sandbox starts with an empty `/tmp`, which alone hides a file planted under `/tmp`. `probeMachinePrivateHidden` therefore builds its stand-in home under `/var/tmp` when the given scratch directory is under `/tmp`; the test passes a `/tmp` scratch on purpose so the falsifier proves the file is visible without the mask. Observation (not fixed, outside scope): the existing `peer-run-hidden` probe has the same weakness when `runAllConfinementProbes` uses the default `/tmp` scratch; its dedicated test uses `/var/tmp`.
4. **Two refusal helpers instead of one generalised `maskRefusals`.** Blind and machine-private refusals have different scopes (blind only vs every request, different codes); two small functions are simpler than one with a flag.
5. **Test hermeticity.** Existing tests that compare full non-blind resource or argv lists resolve `{home}` from `os.homedir()`; they pass on a host without `~/.fgos/private`, but would see a mask once phase 04 creates that directory on a developer machine. New tests inject `homeDir`/`HOME`; the older argv pin (`dispatch-confinement-blind.test.mjs` "non-blind argv ... no mask") should be pointed at a fixture `HOME` before phase 04 lands. Not changed here (behaviour pin of the byte-identical no-root case; changing it is a phase 04 or later task); flagged.
6. **Phase 00 step 8 (read-only sweep of owner machines' config files) and the gateway release build timing were not done** (the sweep needs a throwaway crate build and access to other workspaces; the release build exceeds this task's resource limits). Phase 08 owns the severities decision; recorded in phase-00 file.
7. Impact analysis inactive (`fgos tool query` returns no provider). Callers checked with `rg`: `resolveConfinementResources` (bwrap.mjs assess, harness, tests), `resolveBlindHiddenRoots` (handoff-refs.mjs x2, unchanged signature), `blindRefusals` (one call), `prepareBwrapSync` (harness x2, prepareBwrap), `runAllConfinementProbes` (registrations doctor check, authority via fingerprint, tests), `computeProbeFingerprint` (authority.mjs:154, tests).
8. `docs/specs/reading-map.md:31` still says "8 falsification probes"; left for the docs closeout phase. `fgos doctor` was not run live (`confinement-doctor-checks.test.mjs` passes).

## Unresolved questions

- Keep the driver-version string unbumped (deviation 1)?
