# Implementation report: holder-lock docs (doctor/setup/spec phase, docs half)

Branch `holder-lock/p11-doctor-docs`, worktree `.claude/worktrees/hl-p11`. This round covers only the documentation items of the phase file; the doctor checks, the setup registrations and the CHANGELOG lines wait for the code they describe (later dispatch).

## Files changed

| Action | File | What |
|---|---|---|
| created | `docs/platform/holder-lock/spec.md` | Platform spec, house shape of `docs/platform/session-identity/spec.md`: purpose, ownership boundary, the port (6 operations, results, invariants), drivers and guarantee levels (Linux kernel, macOS kernel measured on 26.6, Windows unsupported until its driver, network fs none), description rules incl. mandatory borrow vectors and no off switch, kinds, registry (file as authority, rank table, locks of this track), predecessor-domain rule (release rule step 0, `predecessor.json`, kill-at-once, `lock.predecessorKillWaitMs`, held result, `linux-gate` only), Node facade and `LockScope` throwing `lock-order-violation` at once, four internal routes with `--protocol 1`, one state root, stop-everything cutover with the kept-fences table and the `checkStopped`/`placeFences`/`checkStopped` order, setup/doctor/activation gate, known limits, "Lịch sử quyết định" (r1 to r6, kongming M4/N6, owner A1-A3, Lead D1-D8), related-files table |
| created | `docs/platform/process/spec.md` | Platform spec for process facts and control: judge table (both tables, zombie/missing-pid/anchor rules), control (signal by identity, spawn with fd map, domain primitives), OS-neutral port with the containment port left to the run supervisor, quiescence scan, known limits, decision history, related files |
| edited | `docs/platform/component-boundary.md` | Two rows in section 4 (Process Facts & Control L0, Holder-lock L1), two rows in the related-files table, `Last reviewed` |
| edited | `docs/specs/reading-map.md` | Two entries pointing at the specs, `packages/holder-lock/`, `packages/process/`, `src/holder-lock/`, the routes and the contracts |
| edited | `docs/specs/distribution.md` | Row 7: six checks added with their pass/warn/fail rules, `provider-capacity-lock-stale` removed; row 7b: `lock-fences` fix; new row 5g (lock directories, `lock.predecessorKillWaitMs`); Setup section creates the two directories and merges the `lock` default; RUL18 (fgctl activation gate: semantics probe + borrow vectors, Windows line, no flag, no floor); decision-history entry 2026-10-16; frontmatter `updated` |
| edited | `docs/specs/runner.md` | RUL101: the dispatch cwd lock is a kernel lock through holder-lock, no record/ttl/heartbeat/reclaim, resume guard and reconcile use `probe`, tombstone of the legacy path, `reconcile` lock, note that the composite-holder/ttl wording of RUL86/RUL96 is stale and is rewritten by the registry track; frontmatter `updated` |

No file outside the owned list was edited. `CHANGELOG.md`, `src/`, `test/` untouched as instructed.

## Grounding

Every claim traces to: the plan (`plan.md` A1-A3, D1-D8), the phase file, the contracts on this branch (`holder-lock.port.v1.json`, `predecessor.v1.json`, `lock-registry.v1.json` + schema, the four `internal-route.*.v1.json`, `state-root.vectors.v1.json`, `process-facts.judge.v1.json`), and the design sections the phase cites (5.1, 5.2, 5.3 for the deferred containment port, 6.0, 6.0.1, 6.1, 6.1.1, 6.1.2, 6.2, 6.3, 6.4, 6.5, 6.8, 6.9, 11 entry 4.2, 12.10-12.12, 14). Where a doc states what code will do, it is written as the contract (P02-P05, P10 phase files for names: `LockScope`, `lock-order-violation`, `lock-driver-unavailable`, `borrow-leftover-not-killed`, `checkStopped`/`placeFences`/`fenceStatus`, `v1-lock-present`, `lock-kernel-semantics-failed`/`lock-borrow-vectors-failed`).

## Checks run

| Check | Command | Result |
|---|---|---|
| Exactly one H1 per doc | `git grep --untracked -c "^# "` over the six docs | 1 each (observed) |
| Every relative link in the two new specs and component-boundary resolves | `git grep --untracked -o -h -E "\]\([^)#]+"` then `git ls-files` on the targets | all 21 tracked targets listed; the two untracked targets are the new specs themselves |
| `provider-capacity-lock-stale` no longer named in specs | `git grep -n provider-capacity-lock-stale -- docs/` | only the decision-history line that records its removal, plus one end-user how-to (see open items) |
| `fgos convention check` on the new docs | `fgos convention check docs/platform/holder-lock/spec.md docs/platform/process/spec.md` and `node bin/fgos.mjs convention check ...` | **not run: sandbox** (both invocations refused with "This command requires approval"). Lead to run |
| ak:cook workflow | skill loaded; code mode | Plan/scout/implement steps followed by hand inside the owned files. The mandatory `code-reviewer` subagent could not be spawned: `fgos dispatch decide --for review --needs-soul --has-live-task-access` was refused by the sandbox, and the repo hook forbids an Agent call without it. Self-review done instead (below). No commit, no plan created |

Self-review pass (claims re-read against the sources): macOS evidence figures (26.6, run of 2026-10-16), the r6 kill-at-once numbers (p50 5.9 ms, p95 6.9 ms, 0/50), exit codes of the four routes, the registry ranks and owners, the fence table, the doctor table and the config shape all match the cited files.

## Deviations from the phase file

- Phase lists `CHANGELOG.md`, `src/setup/*`, `test/setup/*`: deliberately excluded this round per the dispatch brief.
- The design (§11, 4.2) names the spec `docs/specs/holder-lock.md`; Lead D1 places it at `docs/platform/holder-lock/spec.md`, which is what was written.
- `docs/specs/runner.md`: the phase asked for the sentence on the dispatch cwd lock and to leave the old TTL drift for the registry track. Done as one new business rule (RUL101) that also names RUL86/RUL96 as the stale wording, rather than editing those rules.

## Open items for the Lead

1. **cwd key vs registry path.** The registry (`lock-registry.v1.json`) gives `v3Path: <fgosDir>/locks/dispatch--<encodeURIComponent(cwd)>.lock`, while the dispatch cwd phase file and design §6.9 key the cwd by `dev:ino` after `realpath` (`dispatch-cwd--<dev>-<ino>.lock`). The spec states the registry file as the authority for paths and the `dev:ino` rule for identity; one of the two sources should be amended when the cwd cutover lands.
2. `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:271` still documents `provider-capacity-lock-stale`; outside this phase's owned files, needs a one-row edit when the check is removed.
3. `docs/platform/README.md` (area portal) does not list the two new areas; not in the owned list.
4. `fgos convention check` and the reviewer subagent were not run (sandbox); the Lead's independent run is the proof.
