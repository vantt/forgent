# Phase 04: Parser evaluation (three candidates), supply-chain review, upgrade record, OWNER GATE

Depends on phase 02 (fixtures). Does not need 03. Suggested executor: opus for the source read and the recommendation; sonnet may run the mechanical measurements. **This phase ends by stopping.** Phase 05 and later do not start until the owner answers the decision question below.

## Context

Spec section 9: the implementation picks one candidate, behind its port. The spike (G1) compared `yaml-rt` 0.3.3 and `noyalib` 0.0.58 only. The coordinator added a third, widely adopted candidate on the owner's request (2026-10-22): `saphyr` (or `saphyr-parser` alone), used only for parsing and node byte spans, while our crate does the surgical edits and reads comments from the source text between spans. That fits spec Shape A: byte fidelity comes from never re-rendering untouched bytes.

Adoption numbers (crates.io API and GitHub, fetched 2026-10-22 by the coordinator). They are a secondary signal only; spec section 9 says download counts are not a trust signal.

| Candidate | Total downloads | Last 90 days | Created | Reverse deps | Stars | Notes |
|---|---|---|---|---|---|---|
| `yaml-rt` 0.3.3 | 4,028 | 4,028 | 2026-07-24 | 1 (convco) | 2 | one `unsafe` in core (spike) |
| `noyalib` 0.0.58 | 952k | 816k | 2026-05-10 | 57 | 11 (12 open issues, 56 versions) | downloads inflated by the `serde_yml` shim (same author); `#![forbid(unsafe_code)]` |
| `saphyr` 0.2.2 | 2.6M | 1.0M | n/a | 112 | 339 (52 forks), pushed 2026-10-15 | successor line of yaml-rust/yaml-rust2; never evaluated by the spike |
| `yaml-rust2` 0.13.0 | 67M | 19M | n/a | 239 | 265 | context only: older sibling of saphyr, not a candidate unless saphyr fails and the executor finds it exposes spans |

## Files it may touch

Scratch only until the decision: `.fgos/runtime/tmp/yaml-eval/` (a standalone Cargo workspace outside the repo workspace, one adapter per candidate behind a minimal trait, a fixture driver). Committed output: `packages/yaml-doc/upgrade-record.md` (and nothing else; no parser dependency enters the repo before sign-off).

## Evaluation steps (same checks for all three; evidence goes into the record)

1. **Fetch and pin.** `cargo vendor` each candidate's exact version into scratch (not the repo). Record version, crates.io checksum (matches `Cargo.lock`), publish date, repository, and whether the published crate matches the tagged source (`cargo package --list` vs `git ls-tree`, or diff the `.crate` against the tag).
2. **saphyr gate first (rejection rule).** Using `saphyr-parser` events (and `saphyr` loader if it carries markers), verify whether exact start AND end byte offsets are available for every key and every value, including block scalars (`|`, `>`), flow collections, quoted scalars, aliases and empty values, and how comments are treated (dropped, or reported). Method: a probe program that prints `(kind, start_byte, end_byte)` for the fixture inputs and checks each span against the source text. The end offset is the common gap in event-based parsers (they report a start marker and sometimes an end marker in characters, not bytes). If exact byte starts and ends cannot be derived for all node kinds, for example only a start index or character indexes exist, or a derived end is wrong for block scalars or flow collections, **saphyr is rejected with that evidence in the record** and the comparison continues between the other two. If derived from start of the next token plus a trailing-trivia rescan of the source text, say so and measure whether every fixture agrees; a derived rule that needs a second parser pass counts against it.
3. **Round trip.** Parse and print every fixture input and the 937-line spike config shape with each adapter's own lossless path (or our splice-from-spans path for saphyr); expect byte-identical output for all fixtures with no edit. Then apply one change per edit fixture by splicing (our design is to splice by spans for all three, so the record also states whether the candidate's own edit API is needed at all).
4. **Tree facts needed by the profiles.** Does the adapter expose per node: tag, anchor, alias target, scalar style, raw scalar text, mapping key node (to detect complex keys), duplicate keys (not collapsed), multiple documents, empty documents? Which of the profile rules would need the parser rather than our tree walk?
5. **Comments.** How are comments exposed (none, per node, trivia)? Whether our "block above" and "inline on line" definitions (phase 06) can be derived from the source text between spans alone. Probe: comment between key and value, comment after `-`, comment above first key, comment after block scalar header.
6. **Syntax-error position** of `a: [1,\nb: }` (D7) and error message content (do messages echo source text? spec section 8 forbids values in our errors, so adapters must drop the message body if so).
7. **Safety and cost.** `rg -n "unsafe"` over the crate and every new transitive crate, listing each site with a reason; dependency tree (`cargo tree -e normal`) with count of new crates beyond what the workspace already locks; `build.rs` and proc-macro presence in each; `cargo deny --config .github/cargo-deny.toml check advisories bans sources` on a scratch lock including the candidate; license; parse time and memory on the 937-line config and on a 1 MiB document (with `/usr/bin/time -v`); behaviour with 200 000 nested brackets with and without the pre-scan (a stack overflow is recorded, not worked around).
8. **Source diff read.** Read the crate and every new transitive crate in full for: file or network access, `std::process`, environment reads, `include_bytes!` of binary blobs, `build.rs` actions, obfuscated code, macros that generate unsafe. Record what was read, by whom, and the file list size (lines). For `noyalib`, check the claimed link to the archived `serde_yml` (RUSTSEC-2025-0068) in code, not just in authorship.
9. **Swap cost.** Lines in the adapter and whether our crate's public API leaks any parser type (it must not).
10. **Vendoring layout options** for the chosen crate (see question below), with the exact `cargo vendor` output size and the files it adds.

## Upgrade record (`packages/yaml-doc/upgrade-record.md`)

Sections: candidates and versions; adoption signal table (secondary); results per check above with commands and raw numbers; unsafe sites table; dependency tree; `build.rs` and proc-macro table; `cargo deny` result; fixtures passed or failed per candidate (ids listed); source-diff scope; recommendation; **owner sign-off line (blank, filled after the answer)**; integrity hash (filled in phase 05); fuzz result line (filled in phase 09).

## Owner gate: decision question (core/skills/_shared/decision-question.md)

Posted to the owner when the record is complete (one batched question; via `fgos ask` or the board, per the lane's channel):

**What is happening.** Slice A needs one YAML parser crate under `fgos-yaml-doc`. Three candidates were measured on the same golden fixtures and source-reviewed. Nothing downstream (phases 05-10) starts until you choose.

**Cause (what was checked).** Fixtures pass/fail per candidate, exact byte spans (saphyr), `unsafe` sites, dependency tree, `build.rs` and proc-macros, `cargo deny`, source diff read, cost on 937 lines and 1 MiB, adoption numbers (secondary). Evidence is in `packages/yaml-doc/upgrade-record.md`. [Executor fills in the findings per option here, one line each, before posting.]

**Options.** (final text written by the executor from the measurements; expected shape)
- **A. `saphyr-parser` (span only) + our splicing.** Gain: by far the widest adoption (2.6M downloads, 112 dependents, 339 stars), active upstream; byte fidelity is ours by construction. Harm: only valid if exact start and end byte spans are available (step 2); we own comment reading and edit splicing (about 600-900 lines in our crate, the same lines we write for the other two). Cost: adapter about 150-250 lines.
- **B. `noyalib` 0.0.58.** Gain: round-trips byte-identically, `forbid(unsafe_code)`, comment API, built-in alias limit. Harm: created 2026-05, fast churn (56 versions), shared author with archived `serde_yml`, downloads inflated. Cost: adapter about 150 lines.
- **C. `yaml-rt` 0.3.3.** Gain: smallest and fastest (0.22 ms on 937 lines), byte-identical. Harm: created 2026-07, 4 k downloads, one `unsafe` in core, one dependent. Cost: adapter about 150 lines.
- (D. none of them: stay on `serde_yaml` is not an option; spec section 8 and the advisory forbid it.)

**Recommendation.** Executor writes one, with the reason. Prior from the plan author, to be overturned by evidence: A if step 2 passes (adoption and maintenance are the strongest independent signals available, and our crate already owns the byte-level work so the parser's lossless claim is not load-bearing); otherwise B, because of `forbid(unsafe_code)` and the only measured comment-block and newline-refusal behaviour, with the churn risk contained by exact pin plus committed copy plus fixtures.

**Scope of the answer.** A yes on option X authorizes: adding that crate (and the listed transitive crates) at the exact recorded versions, committing a vendored copy and its integrity test, building phases 05-10 on it, and running the fuzz targets. It does not authorize: any other crate, a version bump, dropping the golden fixtures as the arbiter, or skipping the fuzz run. Sub-question in the same message, same recommendation style: **vendoring layout** (a) committed copy of the parser and its new transitive crates under `packages/yaml-doc/third-party/<crate>-<version>/` with `[patch.crates-io]` path entries, `exclude` in the root workspace, and a Rust integrity test comparing a digest of each tree with the record (follows the js-yaml precedent; spec section 9 "vendored"); versus (b) exact pin `=x.y.z` plus `Cargo.lock` checksum only, with `cargo vendor` used for the review (smaller repo, but the bytes read are not stored in the repo). Recommendation: (a), because spec section 9 asks that the bytes read are the bytes built. Fuzz timing: sign-off is given before the first fuzz run (phase 09); a fuzz finding in the parser reopens this gate.

## Steps summary

1. Build scratch workspace; run checks 1-10 for all three; if saphyr fails step 2, say so and drop it.
2. Write the upgrade record with the recommendation; fill the decision question.
3. Post the question; set the board row CFG note "Slice A waits for owner parser sign-off (phase 04)".
4. **STOP.** Resume only with the owner's answer; record it verbatim in the record's sign-off line with date.

## Owning proofs

Fixture results per candidate are produced by the scratch driver reading `packages/yaml-doc/contracts/fixtures/*.json`; the committed owning proof of fixture correctness against the chosen parser is phase 05's runner (no second copy here). The record cites phase 05's run once available.

## Validation

Record complete: every check has a command and a result; no `TBD`; `rg -n "TBD|TODO" packages/yaml-doc/upgrade-record.md` finds nothing except the sign-off, integrity-hash and fuzz lines, which are filled by phases 05 and 09.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Review shallow because the crates are large | M x H | list lines read per crate; flag unread parts; owner decides with that stated |
| saphyr spans insufficient and the owner prefers it | M x M | rejection rule is evidence-based; the record states what would be needed upstream |
| Scratch results not reproducible | L x M | commands and versions in the record; scratch folder kept until phase 10 |
| Owner unavailable | M x L | phases 01-03 land meanwhile |

## Rollback

Delete the record and the scratch folder; no repository dependency was added.
