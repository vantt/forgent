---
phase: 06
title: "fgctl init closing block: Ready and the next step, or the numbered list of what needs the user; one result line for status, upgrade, repair, verify"
status: completed
depends_on: ["P02 landed (doctor ok and next)", "P09 landed on the consumer scripts if they need a line changed", "P01 landed for the clean-HOME acceptance run"]
parallel: "group G3 with P04; first writer of init.rs"
effort: ~0.75d
net_size: "Rust about +90 / Node 0 / tests about +50 (estimate)"
---

# Phase 06 - `fgctl init` ends visibly (F1)

## Context

ONB-10, ONB-12, CMD-03, ONB-08. `run_tail` (`packages/distribution/rust/src/init.rs:559-596`) runs `["init"]`, `["doctor","--fix"]`, `["doctor"]` (`:565`) and prints only on a non-zero exit, so `fgctl init` is silent, exits 0 with 5 failing checks, and a re-run is silent and takes about 9 s (live steps 5, 11-13). The Node check exists and fails with a message (`check_node_requirement :371`). The installer's last lines say `fgctl init` (`install.sh:204-206`) and the README says four commands; the three must match (ONB-12).

## Requirements

1. The tail's last call is `fgos doctor --json`; `run_tail` reads `ok` and `next[]` (P02). It prints on stdout:
   - ok: `Ready: fgOS <tag> active (<digest12>)` and `Next: fgos run "<prompt>"`;
   - not ok: `<N> checks need you:` then one line per check `<id>: <fix>`, and the command exits 1.
   `init`, `upgrade` and `repair` share the block. Intermediate output goes to stderr (CMD-09).
2. `status`, `verify` and an already-current `upgrade`/`init` print one result line (`already up to date at <digest12>`; `verified <digest12>`).
3. The three steps in the installer, this block and the README are the same: install, `fgctl init`, `fgos run "<prompt>"`. The block uses the absolute path of `fgos` only when the launcher dir is not on PATH.
4. Node >= 18 and git: the existing failures carry a fix line (where to get them); no new check.
5. After `init` alone nothing else is required: step 1 reads what `fgos setup` writes (`bin/fgos.mjs:4022`, two header-only config files in the live run) and makes `init`'s tail produce the same files through the registered fixes, so the README can drop `fgos setup` (CMD-04). If `setup` writes outside the registry, the write moves into a registered fix (CMD-01), not a new path.
6. Acceptance run: on a scratch HOME with a local-only repo and no agent CLI, `fgctl init --yes` ends in `ok` (after P01 the "no agent CLI" row is `warn` with `Next` naming what to install) or lists exactly what is missing.

## Files

**Modify:** `packages/distribution/rust/src/init.rs` (`run_tail`, the entry points' result lines); `scripts/ci-external-consumer.{sh,ps1}` only if the proof asserts init's old silent exit 0 (at most a few lines, after P09, before P11); `CHANGELOG.md`.
**Create:** `closing_block` as a pure function inside `init.rs` unless step 1 shows it is over about 60 lines (then a leaf).
**Delete:** the swallow-unless-nonzero capture path in `run_tail`.
**Tests to retire:** none.

## Red tests first

Unit tests of `closing_block(doctor_json)`: ok -> Ready plus Next, exit 0; failing -> numbered list, exit 1; malformed JSON -> a clear error and exit 1. `apps/fgctl/tests/cli_surface.rs` (from P03): one wiring case with a stub `fgos` that prints a canned doctor JSON. Why new: no test reads the tail's output.

## Net size

Rust about +90 (block 40, result lines 25, tail 25); tests about +50.

## Steps

1. Read `run_tail`, the `setup` arm and the consumer proof's init expectations. 2. Red tests. 3. Block and lines. 4. Live acceptance in scratch HOME; paste before and after.

## Validation

`cargo test -p fgos-distribution` (focused) and the new cli case; the scratch-HOME run; `scripts/ci-external-consumer.sh` locally if it was edited.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Exit 1 on not-ok breaks callers | Med x High | acceptance is a clean-HOME run ending `ok`; every caller found by `rg "fgctl init" scripts .github docs` and moved in this change |
| `init.rs` (2 393 lines) collides with P10 and P12 | Med x Med | chain P06, P10, P12 |
| Dropping `fgos setup` loses a write nobody registered | Med x Med | step 1 diff of files before and after `setup` on a post-init tree |

## Rollback

Revert the merge; activate the previous release if a machine already has the exit-1 behaviour.

## Closes

ONB-10, ONB-12, CMD-03, ONB-08 (with P01, P07); CMD-01 partial.
