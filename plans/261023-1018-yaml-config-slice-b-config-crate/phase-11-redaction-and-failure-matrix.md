# Phase 11: Redaction and the failure-code matrix

Depends on 09, 10 (so on the validator crate gate). Suggested executor: sonnet (haiku for fixture transcription).

## Context

Spec section 9 bullets that need no confinement change: Config stores references to secrets, never values; a `secret-reference` is never expanded in a snapshot, diff, explanation, doctor output or generated comment; a `secret-value` (only the gateway token, until it moves into Secrets) is carried in the in-process snapshot to the consumer that needs it and rendered `<redacted>` by `show`, `explain`, `check`, doctor output, diffs, migration reports and every error message; no error echoes a value: fixtures break the line next to an account entry in an accounts file, and next to a value in a global file, and check the error contains no bytes of either value. Acceptance 7 and 15. Section 14: the failure cases the crate can produce.

Not here: the `~/.fgos/private` hiding from confined workers (G6, confinement spec), the verbs, doctor output (Slice C/D).

## Files it may touch

`src/redact.rs`, `contracts/fixtures/{no-echo,failure-matrix}.v1.json`, `tests/golden_no_echo.rs`, `tests/failure_matrix.rs`.

## Design

- `Display` / `Debug` of every public error and finding type: built from codes, roles, paths, positions and schema paths only. This phase audits rather than adds: the types come from earlier phases; the audit is one test over their output.
- `render_for_display(&Snapshot, &Schemas) -> Value`: every leaf whose resolved sensitivity is `secret-value` becomes the string `<redacted>`; `secret-reference` leaves stay exactly as stored (they are references; Config has no resolver and the crate does not depend on `fgos-secrets`, asserted by `cargo tree` in the test via `Cargo.toml` text). A `command` value is shown as is (spec section 3: it is data a reader needs to audit).
- `describe(value, entry) -> String`: used by phase 08's doc line (built from the node's `description`), so a generated `@fgos:doc` never prints a secret kind's value (those have none by lint) and truncates nothing else.
- Diff and explain renderers are Slice C's; they must call `render_for_display`, which is why the function is public and pinned here.

## Steps

1. Merge `origin/main`.
2. `no-echo.v1.json` (about 18 cases): each input carries a sentinel secret (`SENTINEL-` plus a random-looking suffix, different per case) on a line adjacent to the fault: syntax error next to an account entry in `accounts.yaml`; type mismatch on the value of a global key whose neighbour holds the sentinel; duplicate key with a sentinel value; complex key; bidi character in a value; scope refusal of a project `gateway.token` whose value is the sentinel; `config-key-in-wrong-file` for an account pool in the project file; `merge-type-mismatch`; oversize scalar; the sentinel inside a `secret-value` leaf rendered by `render_for_display`; the sentinel in a reason text (grammar refusal). The runner asserts `Display`, `Debug` and the JSON form of the error contain no byte of the sentinel, and that the snapshot display form has `<redacted>` where the sentinel was.
3. `failure-matrix.v1.json` / `failure_matrix.rs`: reads `failure-codes.v1.json` and every golden fixture's `expect.code` and asserts each producible id is produced by at least one case (one meta-proof of coverage, not a re-run of behaviours); the ids under `not-produced-here` must not appear. Add the missing fixture in the owning phase's file when this test fails (the case belongs to the owner of the behaviour, design principle 8), never a copy here.
4. Confirm acceptance 7's first half in the crate's own terms: no `secret-reference` is expanded (no code path in `snapshot` or `redact` calls a resolver); no `secret-value` is rendered outside `render_for_display`'s opt-out for the in-process consumer (`Snapshot::value()` is the in-process accessor and says so in its doc).

## Owning proofs

| Behaviour | Proof |
|---|---|
| No error, finding or display echoes a value; `<redacted>` | `golden_no_echo.rs` over `no-echo.v1.json` |
| Every producible failure id has an owning case | `failure_matrix.rs` (coverage only) |

## Validation

`cargo test -p fgos-config --test golden_no_echo --test failure_matrix --jobs 4`, clippy, fmt.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| A later change adds a value to an error | M x H | the no-echo runner runs every refusal path with a sentinel; new refusal paths add a case in their phase's fixture and the matrix test names uncovered ids |
| yaml-doc errors echo text from a parser message | L x H | yaml-doc owns that guarantee (spec section 8) and tests it; the no-echo cases pass its refusals through to confirm |
| `Debug` of a `Snapshot` prints the whole tree | M x M | `Debug` for `Snapshot` and `Document` wrappers prints counts and roles only; a case asserts it |

## Rollback

Revert: new files only.
