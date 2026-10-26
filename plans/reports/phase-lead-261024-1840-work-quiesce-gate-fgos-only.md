# Quiesce scan: a cwd counts only for a process that could be fgOS

Date 2026-10-24, branch `work/es-quiesce` (from d0734ca23).

## Change
- `packages/holder-lock/rust/src/route.rs`: new `quiesce::workspace_hit` (one predicate for cwd/cmdline membership); `scan` calls it. In non-workspace-only mode a cwd hit needs `could_be_fgos(argv)` (existing predicate, no new list); unreadable argv still counts; unreadable-process counter, `names_payload` and the `FGOS_STATE_ROOT` environ branch are untouched (environ already is its own, narrower predicate: the pinned-root env var).
- Test (owner of the behaviour): `quiesce::tests::a_cwd_in_the_workspace_counts_only_for_a_process_that_could_be_fgos` covers zsh and claude not reported; `node bin/fgos.mjs run` and `fgos run` reported; workspace-only still lists every cwd; unreadable argv counts; cwd outside the workspace not reported.
- Contract `packages/holder-lock/contracts/internal-route.quiesce-scan.v1.json`, spec `docs/platform/holder-lock/spec.md` (route table row), `CHANGELOG.md` Unreleased line updated.

## fgctl filter in git_gate.rs: kept
`validate_predecessor_scan` needs `--workspace-only`: that mode decides membership by execution roots (`workspace_argument`), not by installed payload path, so the release's own processes are not counted as workspace writers; the default mode's `names_payload` would count them. Its basename filter also differs from `could_be_fgos` (any argv element, including `fgos.mjs` / `fgos-runner.mjs` under node, vs argv[0] only, plus node/bun/deno). Moving it onto the host would change C5 semantics; left as is, no test moved.

## Tests
- `cargo test -p fgos-holder-lock --lib`: 21 passed, 0 failed.
- `cargo clippy -p fgos-holder-lock --all-targets -- -D warnings`: clean.
- `cargo check --target aarch64-apple-darwin -p fgos-holder-lock`: ok (pre-existing warnings only).
- fgos-distribution untouched, not run. Node: `test/event-store/migrate-cutover-grant.test.mjs` wraps the host with `--workspace-only`, so it is unaffected; not run.
