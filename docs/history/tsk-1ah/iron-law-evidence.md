# Iron Law evidence — tsk-1ah

`classifyIronLaw` result against the real committed diff (`14aa281b`):
`{"required":true,"matchedFlags":["audit"],"matchedModules":[]}` — the
item's own description cites the audit report filename.

Verify command: `cargo test --manifest-path herdr-plugin/Cargo.toml`.

## Failing-before

With `reject_leading_dash`'s check disabled (`if false &&
value.starts_with('-')`):

```
$ cargo test --manifest-path herdr-plugin/Cargo.toml reject_leading_dash_rejects_only_a_leading_dash

thread 'gateway::tests::reject_leading_dash_rejects_only_a_leading_dash' panicked at src/gateway.rs:820:9:
assertion failed: reject_leading_dash("-x", "id").is_err()
test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 122 filtered out; finished in 0.00s

$ cargo test --manifest-path herdr-plugin/Cargo.toml a_dash_prefixed_id_is_rejected

thread 'gateway::tests::a_dash_prefixed_id_is_rejected_before_it_ever_reaches_the_verb_chokepoint' panicked at src/gateway.rs:846:9:
assertion `left == right` failed: a dash-prefixed id must be refused as validation, never reach spawn_fgos_verb where it could be misread as a flag
  left: 200
 right: 400
test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 122 filtered out; finished in 0.00s

$ cargo test --manifest-path herdr-plugin/Cargo.toml execute_move_work_rejects_a_dash_prefixed_to

thread 'mcp::tests::execute_move_work_rejects_a_dash_prefixed_to_before_it_ever_reaches_the_verb_chokepoint' panicked at src/mcp.rs:543:9:
a dash-prefixed 'to' value must be refused as validation, never reach the verb chokepoint where it could be misread as a flag
test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 122 filtered out; finished in 0.00s
```

The middle failure is the sharpest evidence: a real HTTP request to
`GET /work/--force` returned `200`, not `400` — proving the pre-fix
gateway really would have handed `--force` straight into `spawn_fgos_verb`'s
argv as an id, where `bin/fgos.mjs`'s `parseArgs` would misread it as a
flag.

## Passing-after

With the check restored (the real committed state, `14aa281b`):

```
$ cargo test --manifest-path herdr-plugin/Cargo.toml

test result: ok. 123 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s
test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
```

Full crate suite (no filter): 165 passed, 0 failed.
