# HARDEN packaging P01: neutral release defaults

Date 2026-11-12. Branch `harden/pkg-p01-neutral-release-defaults`, based on origin/main `0b529fcf7`. Owner decision 80 Q1 (a).

## Outcome

- Seat Binding routes only to agent CLIs on PATH. An executor whose programs are all absent is skipped (`cli-missing`); `fgos run` on a machine with none exits 4 with `agent-cli-missing`, the CLIs looked for, and the fix (`install one of ..., then run "fgos doctor"`).
- Detection is stateless: probed at bind time and by the two doctor rows through one function (`isCommandAvailable`, `src/runner/paths.mjs`, built on `findExecutableOnPath`); nothing persisted, so a CLI installed later just works. Not reused: `planAgentWiring`/`firstOnPath` (they probe only claude and agy, live in `src/setup`, and the runner layer may not import upward).
- Shipped standard: `thehive` pool gone from the six z-ai and deepseek nano/standard/mini cells; no `ak:` string (COOK had already moved it). Tier-ladder doc lines are English (one source: `seat-binding.tier-ladder.v1.json`, regenerated in schema, standard, fixture, spec table).
- Owner guide: `plans/reports/guide-261112-0755-declare-agent-routing-in-machine-config.md` (Vietnamese; 6 cells per project file, why not the global file, explain diff steps, revert).

## Where the code went

| What | Where |
|---|---|
| presence probe | `src/runner/paths.mjs` `isCommandAvailable` |
| fact per executor, refusal builder | `src/runner/execution/bind.mjs` `missingClisOf`, `agentCliMissingRefusal` (launch view field `missingCli`) |
| rejection reason `cli-missing` | `packages/seat-binding/rust/src/{model,rank}.rs` + golden case (plan said Rust 0; a distinct reason beat labelling it `governance`) |
| run door error | `src/runner/execution/unit-run-start.mjs` `assertDoorChoicesBeforeRun` (pre-admission, no unit run left) |
| doctor | `model-pool-checks.mjs` (skills row), `registrations.mjs` `checkConfinedPaneAccounts`, `seat-binding-checks.mjs` (dry bind: no agent CLI is information) |

Exit: the existing validation category (4), same as `policy-refusal`; no new code.

## Tests

- New: bind with no CLI / claude only / omp only (`bind-committed-config.test.mjs`); `fgos run` door with no CLI (`test/cli/run-verb.test.mjs`); skills row and pane-accounts row skip an absent CLI; dry-bind info for a no-CLI machine; Rust golden case.
- Fixtures: about 25 test files now state their installed CLIs through `test/helpers/agent-clis.mjs`. Without it they passed here only because this machine has claude, codex, omp and pi, and would fail on CI. Checked again under a PATH with no agent CLI.
- Retired/reshaped: `spawn-worker` and `loop` "nonexistent executor" cases now use an executable whose interpreter is missing (bind refuses a path that does not exist, earlier and clearer; the spawn failure behaviour is still proven). Baseline snapshot and `herdr-claude-invocations` expect the OpenRouter-only z-ai cell. `golden_migrate.rs` counts 36 kept / 238 redundant (the pinned authoring source still holds the thehive cells).
- Standard-shape proof: `repo-differences.v1.json` scrub strings gained `thehive` (owning test `authoring_equivalence.rs`).
- Full `npm test`: 8763 tests, 1 fail (known V7n addendum), no run-tests ERROR lines. `cargo test -p fgos-config -p fgos-seat-binding -p fgos` green; fmt, clippy `-D warnings`, msvc and aarch64-apple-darwin `cargo check` (seat-binding) green.
- Scratch HOME (`/dev/shm`): no CLI -> exit 4 `agent-cli-missing`; stub `claude` only -> execute binds claude (`claude-cli-bwrap`); stub `omp` only -> gemini via `omp-cli-bwrap`. Owner-config copy: `dispatch explain --for execute|review` before (activated release) and after (branch) bind the same executor, model and tier.

## Measured net lines (origin/main...HEAD)

| | Estimate | Measured |
|---|---|---|
| Node (src) | +60 | +81 / -11 |
| Rust | 0 | +12 / -3 (crate) plus 1 test-count change |
| YAML (standard) | -50 to -150 | +22 / -28 (net -6; the thehive cells were 6 short lines) |
| Tests | +60 | +201 / -34 (fixtures stating CLIs dominate) |
| Contracts/fixtures (schema, ladder, golden, census) | n/a | +115 / -34 |

The YAML estimate was too high: after COOK's cook move only six cells were owner routing, and the `prefer` chains already list every CLI, so I did not reorder them (the filter decides). Node and tests exceed the estimate because every fixture naming a CLI now declares it.

## Authority

- Which CLIs exist on the machine: a machine fact, collected in the Execution facade (`bind.mjs`) and read by the crate as `missingCli`; the crate decides eligibility. Doctor rows read the same `isCommandAvailable`, they do not re-derive routing.
- Duplicate: `findExecutableOnPath` exists twice (`src/runner/paths.mjs`, `src/state/tool-registry.mjs`; the comment claims one implementation) plus four more PATH walkers (listed in the sub-plan). Belongs in one lowest-layer leaf; filed, not moved (outside P01 files).
- Confinement backend: a clean HOME has no `~/.fgos/confinement-backends.json`, so no confined invocation binds even with claude installed (`posture-unavailable`). First-contact gap that belongs to init/setup; it blocks the "claude alone binds claude" story on a truly clean HOME. Reported, not fixed here.

## Owner ideas (not done)

- Allow list and `model@pool` tier cells in the global config file. Reason: RUL102 and doctor `global-model-policies-portable` exist to protect older releases reading the global file; machines now upgrade together, and the rule blocks the owner from keeping thehive routing machine-wide (the guide has to use each project's file). Benefit: owner routing lives in one place per machine. Needs an owner pick (changes a documented rule, loader and a doctor row).
- Reorder the shipped `prefer` chains claude-first (they are gemini-first, the owner's cost taste). Reason: a machine with omp installed but not logged in binds gemini and fails at lease. Benefit: neutral defaults. Not done: about 40 chains, pinned tests, and owner routing change for every project.

## Lessons

- A PATH-dependent filter makes tests depend on the machine that runs them; 32 tests failed here and a PATH with no agent CLI showed 26 more that passed by luck. Run any new environment-reading rule once under a stripped PATH before landing.
- A stripped PATH must keep the real node dir: bwrap re-executes `node` from PATH inside the sandbox (a symlink in a scratch dir fails).
- Reading the schema before the plan's wording paid off: the global file cannot hold list cells, which the plan's "move it to the global config" did not know. Plans that move config between layers should name the scope rule they rely on.
- `fgos dispatch explain` shows `omp-herdr` or `omp-cli-bwrap` depending on whether the shell is inside herdr; compare before/after from the same environment.
