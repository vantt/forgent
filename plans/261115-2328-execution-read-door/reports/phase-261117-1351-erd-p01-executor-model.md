# Phase report: the executor-model contract (erd-p01)

Branch `execution-read-door/p01`, cut from `origin/execution-read-door/integration` (03c9be920). Date 2026-11-17.

## What changed

- `docs/platform/runner/contracts/executor-model.md` (new): the executor entry, 17 derived facts each with one definition, the
  runner semantic validation (which rules, which codes), the config root rule, the machine facts a derivation reads, the bind
  request, answer, refusals, walk, explain answer, pre-admission facts and seat-config digest, the decide answer and purpose
  rule, the hook (payload, verdict, exit contract), who decides what, the version, and four observed differences. Written by
  hand: `fgos doc` manages knowledge-slot docs (reserve, register), not hand-named contracts, so it has no create path for
  this file; the header block follows `unit-run-result.md`.
- `packages/execution/contracts/executor-model.v1.json` (new): 239 vectors over 17 facts (`defaultExecutor`, `family`,
  `executorLookup`, `governance`, `capabilityConfinement`, `credentialStore`, `effortLevels`, `mechanism`, `posture`,
  `launchFacts`, `missingCli`, `accountQuarantine`, `accountInventory`, `llmAccounts`, `stateKey`, `toolProviders`,
  `validate`), recorded from today's Node functions by the committed `scripts/executor-model-vectors.mjs` (rewrites only
  `expect`; `--check` exits non-zero on drift), the one regenerate path for 06, 07, 08 and 15. Each vector carries its own `machine` block (PATH programs, confinement registry,
  home, lease state, files, a git repository), so no vector depends on the machine. Every vector was read by hand against the
  code path; the notable ones are in the doc, section 11.
- `test/runner/dispatch/executor-model-vectors.test.mjs` (new, 1 test): "Node launch code derives the same executor facts as
  the executor-model contract". Also asserts the file's fact list equals the facts covered and vector names are unique.
- `test/helpers/executor-model-vectors.helper.mjs` and `scripts/executor-model-vectors.mjs` (new, listed in the phase file now): the
  evaluator the script and the test share, and the record/`--check` script.
- `docs/platform/component-boundary.md` (one row), `docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md` (one Pointers
  line), `docs/reading-map.md` (one row), `test/suite-baseline.json` is NOT changed on this branch (regenerated once at landing).
- Not recorded here, by design: bind, decide, hook and listing vectors (phases 06, 07, 08). Their shapes are in the doc.
  The seat-config digest is a bind fact; its shape is in the doc and its vectors belong with bind.

## credentialStoreOf case recorded

Phase 15 had not landed on `origin/execution-read-door/integration` when I reached it, so the vectors include the
`resourceBindings` inference (two vectors). They carry no special mark: the change that removes the inference deletes them,
and until then a port keeps today's behaviour, as for a `knownDefect`. The doc and the file's `about` say so.

## Retired test -> owner now (vectors of `executor-model.v1.json` are the owner)

| Retired test | Owner now (vector, fact) |
|---|---|
| `default-executor-merge.test.mjs`: keeps a registered executor's invocations; fills the entry named by its command; unchanged registry without a default; another program replaces the entry; absolute path keeps the entry (5 tests) | `defaultExecutor` vectors (7). The non-mutation test stays: no vector observes the input |
| `credential-store.test.mjs`: `credentialStoreOf` declared / older env binding / none | `credentialStore` vectors (9). `credentialStoreProblem` and the config-check tests stay |
| `tool-providers.test.mjs`: two-capability read, spelling fold, agent ignores `for`, cli present/missing, unknown, mcpTool+command, config order, no capability, no executors (9 tests) | `toolProviders` vectors (28). Kept: `forEntriesOf`, `servedCapabilitiesOf`, absolute-path cli (a vector cannot name a temp path), the mcp probe test (needs the real HEAD sha for "index records HEAD") |
| `llm-accounts.test.mjs`: old state key of a pool | `stateKey` vectors (9) |
| `dispatch.test.mjs`: five `decideExecutorDispatchMechanism` tests; `lookupExecutor` literal id (x2) and nothing resolves | `mechanism` (+1 tool-with-command vector) and `executorLookup` vectors. Kept: "lookupExecutor never binds a purpose", and every `validateRunnerConfigShape` test (each asserts a specific message or a mixed scenario; not a same-layer duplicate of one vector) |
| `run-posture.test.mjs`: `resolvePostureInvocation` first carrying invocation | `posture` vectors (+1 id-less vector). `canApplyPosture` stays (another function) |

Kept on purpose, not duplicates: `capability-config.test.mjs` (every case mixes other readers, wrapped configs or prototype
names around `capabilityConfinementOf`), `dispatch-confinement-policies.test.mjs` posture test (directory and absolute-path
executables are not expressible as a vector).

## Gates run

All green: `test/runner/dispatch/executor-model-vectors.test.mjs` (1/1), `test/setup/git-mutation-census.test.mjs`,
`test/architecture.test.mjs` (71), `test/scripts/doc-health.test.mjs` (8), `test/scripts/check-decision-citation-drift.test.mjs`
(33), `test/runner/dead-vocabulary-guard.test.mjs` (10), `test/scripts/test-proof-inventory.test.mjs` (31), and each touched test file
and its neighbours one per run (`default-executor-merge`, `credential-store`, `tool-providers`, `llm-accounts`, `dispatch` 215,
`run-posture`, `capability-config`, `dispatch-confinement-policies`, `provider-per-cli-credential-sources`,
`provider-pool-lease`, `dispatch-config-patterns`), all green; `scripts/executor-model-vectors.mjs --check` passes. `node scripts/doc-health.mjs`: 0 findings. `node scripts/git-one-door-scan.mjs --root .`: 0 undeclared; the
census regenerated byte-identical (no census hunk). No Rust changed; no cargo gate besides the host build the test needs
(debug host built once in `erd-p01-target`). Red first: the test and helper were pushed (a93a23b19) before the vector file existed.

## Things to know

- The twin test needs the Seat Binding host (it reads the launch view through `explainSeat`, the only door that builds it)
  and the Git addon (tool staleness), like `bind.test.mjs`; both come from `scripts/run-tests.mjs`. No test-only switch.
- Vectors set PATH to a temporary directory holding only the stubbed programs a vector lists, and HOME only when a fact
  expands it.

## Backlog candidates (found, not fixed; 12 proposes rows)

1. A semantic runner-config refusal carries no `config-*` code (only retired pattern keys do), so `decide` refuses a project
   whose config breaks e.g. a `prefer` target but the dispatch hook allows the guarded call, against its own header comment.
2. `familyOf` does not reduce a command given as a path (`/usr/bin/codex` is its own family): vector marked `knownDefect`.
3. `dispatch explain` reads the family with no command while the bind passes the first cli invocation's command: an entry
   with no `providerModel` reads as `claude` in explain.
4. The config root rule (`configRootFor`) is private and has no vector (it needs a linked worktree); described in the doc only.

## Unresolved questions

- Should semantic refusals carry a `config-*` code (item 1)? The port keeps today's behaviour until the owner decides.
- The doc stays Draft: the owner has not reviewed it.

Status: DONE_WITH_CONCERNS
Summary: Contract doc, 239 recorded vectors over 17 facts and the Node twin test are in; gates green.
Concerns: credentialStoreOf vectors include the legacy inference until its removal change deletes them.
