# P04 half A: a project config may only tighten confinement

Branch `harden/t5-p04`, commits `7cfb3f4e0` (red) and `81a0ec844` (fix). Half B (executor command/args global-only) NOT done: waits on the owner question.

## What changed
- New `x-fgos-merge: tighten` (annotations list, meta schema). Merges like `replace`; after the merge `snapshot.rs::lowered` compares the project layer's value at each `tighten` path with the merge of the layers beneath it and refuses a lowering as `config-confinement-lowered` (path + project file/line/column, no value). Registered in `failure-codes.v1.json` and `failure-matrix.v1.json` (proven in `golden_snapshot.rs`).
- Order: mode `required` > `preferred` > `unconfined`; same mode: a policy name other than the lower layer's counts as lowering (lower names none: accepted); `strict` true is not lowered to false. Nothing beneath: accepted. Only the project layer is judged.
- Schema: `tighten` on `capabilityConfinement` and `confinement.strict`; `confinementPolicies` now `global-only` (justification comment rewritten).
- Found while testing: `judge` never refused a project policy entry, because the keys inside an entry are undescribed (`locate` none) and were skipped. `scope.rs` now refuses an entry of a global-only map whole when any of its keys is undescribed. Without it `confinementPolicies: global-only` would have been a no-op.
- `migrate.rs` `differing` treats `tighten` like `replace` (whole entry).
- Spec section 4 table + new paragraph, section 14 row; CHANGELOG line.

## Red to green
- Red (first commit, run before fix): `a_project_file_cannot_lower_a_capability_confinement` FAILED "lowered ... to unconfined and was accepted". Green after fix.
- Hunks of the adopt_matrix row not brought.
- Rewritten test (it pinned the hole): `an_unconfined_capability_does_not_inherit_the_standard_policy` now sets `unconfined` in the global file (replace-whole still proven). New: `a_project_file_may_equal_or_raise_a_capability_confinement` (equal, raise, same), `a_project_file_cannot_swap_the_confinement_policy_of_the_layer_below`, `a_project_file_cannot_turn_strict_confinement_off` (also proves on accepted), and `golden_scope.rs::a_project_cannot_define_an_entry_of_a_global_only_map`.
- Node: `test/setup/confinement-doctor-checks.test.mjs` had 4 tests that wrote project files lowering advise to `preferred`, defining policies, or anchoring everything `unconfined`; they asserted the hole. Policy tests now write the (scratch HOME) global file via a local `withGlobalConfig`; advise uses the standard's mode; strict readiness keeps each capability's existing confinement. Rust owner of the refusals: `golden_snapshot.rs` and `golden_scope.rs`. No test retired.

## Census (read-only; counts only; key-name greps, no values)
Every `.fgos/config.{yaml,json}` under `/home/vantt/projects` (31 files: 9 in `forgent`, 22 in `forgent-worktrees/*`) plus `~/.fgos/config.{yaml,json}`: `confinementPolicies` = 0, `confinement:` entries = 0, `strict:` = 0, mode unconfined/preferred = 0 in every file. No project defines a policy or sets confinement on this machine. Second machine (fg-server2 / owner machine) NOT reachable from here: census still owed there before landing (grep the same four keys in every workspace's project file).

## Gates
- `cargo test -p fgos-config` all green; clippy `-D warnings` clean; `cargo check` msvc + aarch64-apple-darwin ok; `cargo fmt -p fgos-config --check` ok. (`cargo fmt --all --check` shows a pre-existing diff in `apps/fgos/src/wiring/mailbox_remote.rs`, not mine.)
- Node focus (config-seat-binding-layers, dispatch-confinement-policies, dispatch-config-patterns, confinement-doctor-checks, test/config/*, architecture, doc-health, decision-citation-drift) green.
- Full suite (`/dev/shm/p04-full.log`): pass 8710, fail 1 = the known frozen V7n addendum test only; no `run-tests: ERROR`.
- One-door scan 0 undeclared (census file regenerated and committed).
- Not run: `fgos config check` on this checkout with the built host (would read real config); the full-suite Node door tests cover the crate.

## Size vs budget (Rust +44, tests +40)
Rust src +111 (snapshot +89 incl. docs and two small helpers `rule_at`/`docs_of` that also removed the inline merge-rule closure, scope +20, migrate 0). Tests +~210 (4 snapshot cases + scope case; fixture setup helper). Over budget: the `allowInvocationOverride` rule, the undescribed-entry fix and per-case coverage were not in the estimate.

## Deviations
1. Added `allowInvocationOverride: true` over a lower non-true value (same mode) as lowering: it widens an invocation's reach over the policy; the phase file did not list it. Easy to drop (one clause in `lowers`).
2. The undescribed-entry fix in `scope.rs` (above) is needed for the `global-only` change to mean anything.
3. The `confinement.strict` schema description not extended (rendered into standard docs lines, breaks a render test); rule is in spec and the `capabilityConfinement` description.

## CFG review: what a reviewer must check
1. Meta schema + annotations: `tighten` added in exactly the two places; `golden_meta`/lint unchanged and green.
2. `snapshot.rs::lowered`: runs after validation, judges only layers[0] when it is `project`; the "below" merge uses the same rules; trusted-root `command` swap (confinement is sensitivity `command`, so the project layer holds the main checkout's value) is compared as is.
3. Ordering/policy semantics in `lowers` (policy name different = lowered; lower names none = accepted; override rule, deviation 1).
4. `scope.rs::hides_undescribed`: widens refusals for any global-only map entry with undescribed keys in the project file; check no existing global-only subtree (gateway, secrets, bin) now refuses a file that was valid (all config tests green; second-machine census).
5. Schema YAML diff: three nodes only (`strict`, `confinementPolicies`, `capabilityConfinement`); `confinementPolicies` keeps sensitivity `command`.
6. Activation: a schema change activates on every machine at once (plan Landing). A project file accepted by the new release is accepted by the old one (rollback safe).
7. Second-machine census (above).

## For other phases / owner
- Half B waits on the owner question; this checkout's committed project config holds executor commands (plan fact 2), not touched.

Status: DONE_WITH_CONCERNS
