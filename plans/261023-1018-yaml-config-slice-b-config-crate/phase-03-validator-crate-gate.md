# Phase 03: Adopt the validator crate (owner gate)

Depends on 01. Suggested executor: sonnet for the conformance probe and the record; **this phase ends by stopping** until the owner signs. Mirrors Slice A's parser gate ([phase 04](../261022-1342-yaml-config-slice-a-yaml-document/phase-04-parser-evaluation-and-owner-gate.md)): no third-party validator enters the repo before sign-off.

## Context

Owner decision 2026-10-23 (spec section 4): section schemas are JSON Schema draft 2020-12 authored as YAML, and validation uses an existing validator crate, "the validator crate". The owner chose it separately, after a supply-chain review: `plans/reports/research-261023-1109-json-schema-validator-crate-choice.md` (read it first; this plan does not repeat its content or name the crate before the owner's sign-off). The owner's pick (2026-10-23 11:45) is `jsonschema` 0.60.0, conditional on the source review `plans/reports/review-261023-1145-jsonschema-supply-chain-review.md` (in progress when this plan was amended): read that report's verdict first, and treat a failed or open review as the decision question's option C, not as something to patch around. This phase does not re-open the choice otherwise. It proves the chosen crate fits how Config uses it, records the exact pin, and asks for the adoption sign-off in the decision-question template. No custom type dialect and no custom value checker are built here or later.

## Files it may touch

Scratch only until sign-off: `.fgos/runtime/tmp/validator-probe/` (a standalone Cargo project outside the repo workspace). Committed after sign-off: `packages/config/upgrade-record.md` (short), the validator dependency line in `packages/config/rust/Cargo.toml`, `Cargo.lock`, and, if the owner picks a committed copy, `packages/config/third-party/<crate>-<version>/` with the same integrity test pattern as `packages/yaml-doc/third-party/` (follow Slice A's settled layout; do not invent a second one).

## Conformance probe (what Config needs from the crate; each is one probe case with a verdict)

1. Draft 2020-12 is supported (`$schema`, `$defs`, `$ref`, `additionalProperties`, `required`, `enum`, `minimum`/`maximum`, `type` as a list).
2. Unknown `x-fgos-*` keywords, `$comment` and a non-resolvable `$id` (`urn:fgos:config-schema:<section>:v<N>`) are ignored as annotations and never change a result or trigger a fetch.
3. A schema with no `default` keyword validates a value exactly as one with it would (nothing in Config relies on `default`; the lint refuses it).
4. Offline: no network, no file read, no remote `$ref` resolution; local `$ref` and `$defs` work, and the composite root reaches every section schema by its `$id` through resources registered in memory (one composite schema built by Config from the section files, no retriever).
5. Errors expose the keyword, the instance path and the schema path as data, so Config can drop the message text (which can quote a value, spec section 9).
6. Compile once, validate many; time on the 40 KB effective config and on the largest expected catalog value, informational only.
7. Bounded: recursion depth and `$ref` cycles end with an error, never a stack overflow or a hang (one cycle case, one 32-deep case).
8. Safety and cost facts for the record: `unsafe` sites, new transitive crates beyond what `Cargo.lock` already holds, `build.rs` and proc-macros, `cargo deny --config .github/cargo-deny.toml check advisories bans sources` on a scratch lock, license.

A failed item is not patched around in Config: it goes into the question as a cost or a reason to pick another candidate from the report's shortlist.

## Upgrade record (`packages/config/upgrade-record.md`, after sign-off)

Crate, exact version, crates.io checksum (equals `Cargo.lock`), publish date, repository, the probe results (command and verdict per case), unsafe and dependency facts, link to the review report, the vendoring layout chosen, and the **owner sign-off line** (verbatim answer and date).

## Owner gate: decision question (core/skills/_shared/decision-question.md)

Posted when the probe and record draft are complete, one batched question:

**What is happening.** Slice B needs one JSON Schema validator crate under `fgos-config`. You chose it after the supply-chain review; the plan adopts it only on your sign-off. Phases that need validation (04b, 09-13) wait for the answer; the rest of the slice continues.

**Cause (what was checked).** The eight probe items above against the exact version of the reviewed crate, plus the review report's own findings. Evidence: `packages/config/upgrade-record.md` and the report. [Executor fills one line per failed or notable item before posting.]

**Options.**
- **A. Adopt the reviewed crate at the exact version, committed copy under `packages/config/third-party/` (Slice A's layout).** Gain: the bytes read are the bytes built. Harm: repo size, a copy to keep in step. Cost: the copy plus an integrity test (about 40 lines).
- **B. Adopt the same crate, exact pin `=x.y.z` plus `Cargo.lock` checksum only.** Gain: smaller repo. Harm: the reviewed bytes are not stored in the repo. Cost: the dependency line.
- **C. Another candidate from the review's shortlist** (only if a probe item failed). Gain: passes the item. Harm: a second review. Cost: re-run the probe, one more day.

**Recommendation.** A when the probe passes (same reasoning as Slice A: the bytes read are the bytes built); C only on a failed probe item.

**Scope of the answer.** A yes authorizes: adding that crate (and the listed transitive crates) at the recorded versions, building phases 04b and 09-13 on it, and the integrity test. It does not authorize: any other crate, a version bump, a custom keyword or format hook, remote reference resolution, or a custom value checker.

## Steps

1. Read the review report; build the probe project for the reviewed crate; run items 1-8.
2. Write the record draft and fill the question; post it; set the board's CFG note "Slice B waits for owner sign-off on the validator crate (phase 03)".
3. **STOP** for 04b and 09-13. Phases 01, 02, 04a, 06, 07, 08 continue.
4. After the answer: record it verbatim in the record, add the dependency, run `cargo tree -p fgos-config -e normal --jobs 4` (new crates equal the record's list) and `cargo deny`.

## Owning proofs

The probe is evidence, not a test. The committed proof that Config uses the validator correctly is phase 04b's `golden_validate.rs`; if a third-party copy is committed, its integrity test (same pattern as Slice A) proves the bytes.

## Validation

Record has no `TBD` outside the sign-off line; `cargo build -p fgos-config --jobs 4` passes with the dependency; `Cargo.lock` differs by the listed packages only.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| The crate quotes values in error text | M x H | probe item 5; Config never forwards message text; a no-echo case in phase 11 |
| The crate resolves remote `$ref` or reads files by default | L x H | probe item 4; the composite schema is built in memory and the crate is configured without a retriever |
| Unknown keywords rejected in strict mode | L x M | probe item 2; if only a strict flag does it, the flag stays off and the record says so |
| Owner unavailable | M x L | the gate parks only 04b and 09-13 |

## Rollback

Delete the record, the dependency line and the copy; no repository dependency existed before.
