# Phase 04 report: the `fgos-execution` crate and the executor model

Status: DONE_WITH_CONCERNS. Branch `execution-read-door/p04`, based on origin/main `8b4602f5c`.

## What changed

- New crate `packages/execution/rust` (`fgos-execution`, workspace member, `Cargo.lock` by cargo). Modules:
  `ports` (trait `Machine`: `on_path`, `posture_backend`, `herdr_present`, `home_dir`), `executor_model`
  (default-executor merge, family, lookup, governance, capability confinement, credential store, effort levels,
  mechanism, posture, launch facts, missing CLI, tool entries) and `accounts` (account inventory, `llmAccounts`
  reader, state key). Pure: no file, clock or environment access.
- `tests/golden_executor_model.rs` reads `packages/execution/contracts/executor-model.v1.json` (the only owner, no
  copy) and replays 201 of 238 vectors; `knownDefect` vectors (path command is not reduced to its program) keep
  today's behaviour and pass.
- Docs: one clause each in `docs/reading-map.md` and the contract's "Implementation" line. Census regenerated.
- Machine port has `home_dir` beyond the three methods the phase text lists: the account inventory expands `~`,
  `${HOME}` and `$HOME` (vectors `llmAccounts` and `accountInventory`). `serde_json` uses `preserve_order`
  (account and executor declared order is semantic).

## Not replayed here (explicit, in `REPLAYED_LATER`: fact, field, owning module)

- `accountQuarantine` (8 vectors): reads the lease state file, owned by the bind phase.
- `validate` (29 vectors): the runner semantic check; the plan assigns `runner_check.rs` to the decision phase.
- `toolProviders` (28 vectors) is replayed for what the entry says (executor, capability, mcp tool, command); the
  `status` field needs the probe port of the decision phase and is dropped from the comparison on purpose.
No vector needed a behaviour change; the stop rule did not trigger.

## Review round (OPC changes)

- `REPLAYED_LATER` entries are (fact, optional field, module); the test drops only the listed fields, fails when a
  listed whole fact is already replayed ("replayed now; remove from REPLAYED_LATER") and when an entry matches no
  vector. Proven with throwaway wrong entries (a replayed fact and a field no vector has): both failed.
- Design note: the code walks `serde_json::Value` (with `preserve_order`) instead of a typed entry from the runner
  section, because the vectors pin Node's truthiness and nullish rules (`||` versus `??`, empty strings). The phase
  text called `preserve_order` unneeded; it is needed, since declared account and executor order is semantic.
- The crate reads a runner section only; the caller unwraps a config that nests it as `runner`.
- One predicate for "the default executor answers this id"; `Governance::of` reads the deny lists once;
  `executor_facts` uses `Mechanism::as_str`; `basename` splits on `\` too under Windows.
- New vector: an empty home makes `~/x` read `/x` (Node parity, recorded with the script; `--check` passes, 238
  vectors). The host `Machine` maps an empty home to `None` (noted in the route phase text).
- Plan text updated: acceptance of phases 04, 06, 07; `accounts.rs` is Modify in 06; PATH door and empty home in 09.

## Retired test -> owner now

None retired. The Node twin `test/runner/dispatch/executor-model-vectors.test.mjs` stays until S6a.

## Gates (private CARGO_TARGET_DIR `erd-p04-target`)

- `cargo fmt --all --check`: ok. `cargo clippy -p fgos-execution --all-targets -- -D warnings`: ok.
- `cargo test -p fgos-execution`: 1 test (all vectors), ok. A deliberate wrong family alias made it fail.
- `cargo check -p fgos-execution --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`: ok.
- `cargo tree -p fgos-execution`: no `fgos-config`, `fgos-git`, `fgos-holder-lock`. It does carry
  `fgos-host-runtime` and `tokio`, which `fgos-seat-binding` already depends on.
- Node: `git-mutation-census`, `architecture`, `doc-health`, `check-decision-citation-drift` tests pass;
  `git-one-door-scan` reports 0 undeclared sites.
- Not run: full `npm test`, `cargo test --workspace` (not allowed for a phase lead).

## Left / unresolved

- Rust size is about 1 700 lines after rustfmt (plan estimated 900); the account and validation text ports account
  for it.
- `fgos-yaml-doc` and `fgos-seat-binding` are declared but unused until the bind and agents phases (as the plan asks).
- Question for the plan lead: should phases 06 and 07 reuse the `REPLAYED_LATER` list (remove their fact from it) as
  their wiring step? That is what I assumed.
