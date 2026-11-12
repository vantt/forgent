# Unit run result golden fixtures

What one Unit run hands up when it ends, one golden file per outcome of the closed outcome table, as the
`data` of `fgos run --json` carries it (`docs/platform/runner/contracts/unit-run-result.md`, sections 3 to 5).
A reader of the contract takes its results from these files instead of building them by hand.

## Files

| File | Outcome and what it pins |
|---|---|
| `unit-result.pass.v1.json` | `pass` with a passing verify round: a verdict, listed as an evaluation |
| `unit-result.findings.v1.json` | `findings` from a checker: a verdict, never infrastructure |
| `unit-result.findings-out-of-scope.v1.json` | a producer `pass` that wrote outside its scope ends `findings` before anything settles |
| `unit-result.execution-failure.v1.json` | a verify that timed out: infrastructure, a resume runs it again |
| `unit-result.policy-refusal.v1.json` | refused by policy: no verdict, not infrastructure |
| `unit-result.provider-limit.v1.json` | provider limit: no verdict, not infrastructure |
| `unit-result.blocked.v1.json` | waited on a person: no verdict, not infrastructure |
| `unit-result.not-started.v1.json` | no seat was given its brief: `started.value` false, infrastructure |
| `unit-result.undetermined.v1.json` | the summary value of a unit whose pattern was never recorded: no verdict |
| `unit-result.crash-recovered.v1.json` | the controller died, the resume bound the failed seat again and settled the run |

## A file

```json
{ "id": "kebab-case-outcome", "why": "one line naming the rule it pins", "data": {} }
```

`data` holds every field of section 3 that Execution writes (`outcome`, `infrastructure`, `outOfScope`,
`outOfScopeOnBranch`, `evaluations`, `started`, `launches`, `settled`, `warnings`) and, per attempt, `infrastructure`
`runResult.activity` and `output` (`report`, `claim`, `complete`, `incompleteReason`; a verify round has none). Ids and paths are fixed values, so a reader compares facts, never bytes of a real run.

## Owners

| Reader | Test |
|---|---|
| Node: the facts agree with the outcome module that writes them | `test/runner/execution/unit-run-result-fixtures.test.mjs` |
| Rust: each attempt's outcome agrees with `fgos_run_result::derive_outcome` of its classification | `rust/tests/unit_result_fixtures.rs` |
