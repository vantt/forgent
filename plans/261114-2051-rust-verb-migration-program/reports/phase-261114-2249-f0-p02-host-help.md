# F0 phase 02: host help door

Branch `rust-verb-migration-program/f0-p02`, rebased onto `origin/rust-verb-migration-program/f0-p10` (`8b100a44a`, the argument parser), which itself sits on the integration head `286017771`. The branch carries phase 10's two commits until phase 10 lands on the integration branch; after that a rebase onto the integration head drops them. Not landed.

## Done

- `apps/fgos/src/help.rs`: embeds `command-manifest.json`, renders text and JSON exactly as the Node renderer did (line order, labels, `DEPRECATED —` and Compatibility, guide sections, default notes). The whole-manifest JSON prints the file's own bytes (a unit test proves the file is the serializer's output); one entry or a narrowed sub-verb is re-serialized pretty with key order kept (`preserve_order`).
- Help words come from `fgos_host_runtime::cli_args::parse_args` (phase 10): `[--help value if a string, ...positional]` without `-h`, `--json` present anywhere. `hook` keeps its raw argv and reads only an exact `--json` token, as Node does. Top-level help filters `--dir` (and its value), `--json` and help tokens as `handleHelp` does. Arguments are decoded lossily before parsing, as Node receives them, so a non-UTF-8 token reads as it always did.
- `apps/fgos/src/main.rs`: a first token `--help`/`-h` is answered before the route lookup (after the empty/non-UTF-8 selector refusal); for a listed selector any exact help token after it is answered for every route kind (hook and native kinds included) before the native-kind and composition steps. The legacy help routing branch and the "help falls through to legacy" wording are gone. An unlisted selector still fails closed first (R3).
- Refusals: `fgos: <message>` on stderr, exit 4 (`exit_codes::validation()`), nothing on stdout; texts copied from Node.
- Tests: 15 unit tests in `help.rs` (real manifest: every entry as text and JSON, every sub-verb narrowed, route table and manifest name the same verbs, top-level text, deprecated string and structured, positional-only vs mixed parameters, flag defaults, guided sections and order, the `--dir`/`--json` word rules, `--help <word>`, `-h` as a flag value, hook raw argv, every refusal). `cli_tests.rs`: `test_every_help_form_starts_no_node` (PATH `node` spy, 14 forms: top level text and JSON, `-h`, `<verb> --help|-h [--json]`, `<verb> <sub> --help --json`, `hook mailbox --help [--json]`, native and legacy verbs; also runs with no release or manifest named); the spy creation became one helper shared with the existing one-node-child spy test; the three `add --help` legacy probes use `workflow list` (phase 00 U7). `mailbox_routes.rs`: "help for the native kind reaches legacy" now asserts the host answers it, starts no legacy payload (spy count stays 1), exit 0, manifest text.
- No Node help test retired; the Node help code is untouched (phase 09 deletes it).

## Where the facts differ from the phase text

- U7 applied as written (`workflow list`). The record assertion changed from `cli.legacy.add` to `cli.legacy.workflow`.
- Latency baseline: the installed release (117 ms) is the user-visible baseline; the dev-staged 2.4 s is payload verification and no longer applies to help (help skips the payload). Measured below.
- `help-routes.test.mjs` needed no change (it already compares host bytes with Node bytes for the forms it lists, now through the host-owned door).

## Gates

| Gate | Result |
|---|---|
| `cargo fmt --all --check` | clean |
| `cargo clippy -p fgos --all-targets -- -D warnings` | clean |
| `cargo test -p fgos` | green: 61 unit (15 new), 51 `cli_tests`, 8 + 50 + 2 other suites; log `/dev/shm/rvm-f0-p02-cargo-test-2.log` |
| `cargo check -p fgos` msvc, aarch64-apple-darwin | both exit 0 |
| Focused node gate: help-routes, harness, first-run-guide, exit-code-table, envelope-contract, architecture, git-mutation-census, plus fgos-manifest, command-routes, doc-health, decision-citation-drift, parse-args-vectors | 210 pass, 0 fail (`/dev/shm/rvm-f0-p02-gate-3.log`) |
| `git-one-door-scan --root .` | 0 undeclared; classes identical to baseline except `rust-test` 156 to 157 (the new help spawn test); census regenerated, working tree clean after |

Also green before the rebase: fgos-version, native-addon (except the item below), subcommand-flag-drift, unknown-flag-rejection, fgos-help, fgos-verb-help-json.

## Parity (phase step 3)

- Harness coverage floor, method U5 (`runParitySuite`, entryA `node:bin/fgos.mjs`, entryB `bin:<host>`, exact bytes): the 82 `coverage-help-*` cases, **82 pass, 0 fail**.
- Wider ad hoc check, node vs host binary, comparing stdout, stderr and exit code: **1487 forms, 0 differences**. Forms: top level `--help`/`-h` with `--json`, `--dir`, repeated tokens, unknown verb/option/too many words/sub on a sub-less verb/unknown sub; for every manifest verb and every sub-verb `--help <verb> [<sub>]`, `<verb> [<sub>] --help|-h`, `<verb> --help <sub>`, `--dir /x <sub> -h`, `<sub> --title --help`, each with and without `--json`; `hook` forms; `config --json show --help`; `config --title -h`. (Scripts were scratch, not committed.)

## Latency (phase step 4)

Release host binary of the staged release, cwd `/tmp`, 1 warm-up and 15 runs, load average about 20 on the machine (other leads building), so absolute numbers carry noise. Median / min / max ms:

| Form | Now (host answers) | Phase 00, installed release | Phase 00, dev-staged |
|---|---|---|---|
| `--help --json` | 1.6 / 1.5 / 1.8 | 117 | 2456 |
| `add --help` | 2.3 / 1.8 / 2.8 | 118.5 | 2433 |
| `config show --json` (from `/tmp`, same run) | 28.9 / 25.2 / 38.2 | 27 | 181 |

Help is now well inside the exit criterion (within 5 ms of `config show --json`). Log `/dev/shm/rvm-f0-p02-time-1.log`.

## Findings outside this phase

1. **Integration branch regression from the manifest step:** `test/distribution/native-addon.test.mjs` "development host carries and loads the addon from its per-invocation manifest" fails on the integration head. The fixture copies a fixed list of scripts (line 159) that lacks `scripts/lib/rust-source.mjs`, which the scan now imports (`ERR_MODULE_NOT_FOUND`). One-line fix: add that path to the list. Not in this phase's file list, so not touched. Nobody has it in a file set.
2. The one-door scan class `rust-test` grows by one for the help spawn test; a help-only spawn test cannot be avoided (it is the phase's required proof of "no Node").

## Suggested `[Unreleased]` line (CHANGELOG.md not edited)

- `fgos --help`, `fgos <verb> --help` and `fgos <verb> <sub> --help` (text and `--json`) are now answered by the host without starting Node, in about 2 ms instead of about 120 ms; the output is unchanged.

## Authority

None found. One twin remains by design until phase 09: the Node help renderer and the Rust renderer both exist, both reading the one manifest file; the help case table (phase 07/08) is the guard.

## Lessons

- The pre-commit census check fires on any staged Rust or test file change here, so budget a `--write-census` run (it compiles Rust, needs `CARGO_TARGET_DIR` in the same command) before every commit, and again after a rebase.
- A phase that depends on a sibling phase's unmerged module can be built against a local copy of the file, but the pushed head only builds once the sibling's commits are under it; check the sibling branch before the first push and base on it.
- Checking Node against the host over every manifest verb and sub-verb (a 30-line script) found no drift at all in one pass and is cheaper than reasoning about each Node quirk; keep such a table (phase 07) rather than per-quirk tests.
- A fixture that copies a hand-listed set of scripts (native-addon test) breaks silently when a script gains an import; the scan's new import is the cause here.
