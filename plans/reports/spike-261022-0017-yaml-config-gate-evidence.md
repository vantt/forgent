# YAML Document and Config: gate evidence (G1, G2, G3, G5)

Run 2026-10-22 on the owner's Linux machine, against HEAD of `main` and the active release `sha256:8522b6bd…`. Scratch only; no source file, config file or commit changed. G4 (Windows run) needs a Windows machine and was not run.

## Outcome

`yaml-rt` 0.3.3 and `noyalib` 0.0.58 both keep every untouched byte of the real config (converted to 937 lines of YAML with doc, why and free comments) when one value changes, including keys with `:` and inline comments. `yaml-edit` is out. A raw N-API call costs about 12 µs against 3 to 40 ms for a process spawn, so the owner's choice of the native door holds on measurement, not only on structure. No real config file has duplicate keys.

## G1. Rust round-trip spike and costs

Fixture: `.fgos/config.json` dumped to block YAML, plus a `# @fgos:v1` header, `# @fgos:doc`, `# @fgos:why` and free comments above `gateBypass.level` and `workerSlots.ceiling`, and an edge file with inline comments, quoted strings, `|` and `>-` block scalars, a flow list and a `"code:implement"` key. Spike source: `${scratchpad}/g1/spike/src/main.rs` and `src/bin/hazards.rs` (not kept in the repo).

| Check | noyalib 0.0.58 | yaml-rt 0.3.3 | yaml-edit 0.3.2 |
|---|---|---|---|
| Parse then print, no edit | byte-identical | byte-identical | refused: top-of-file comments need a different entry type |
| Set `gateBypass.level` | only that line changed | only that line changed | not reached |
| Set a value under `"architecture:frame"` | only that line changed | only that line changed | not reached |
| Set a value with an inline comment, block scalars nearby | only that line changed | only that line changed | not reached |
| Write a comment block above a key | `set_comment(Before)` replaces the whole contiguous block; the caller composes doc plus why | `insert_mapping_entry_with_comment` family (not exercised) | |
| Newline inside comment text | refused, cannot inject a key | not exercised | |
| Duplicate key | last wins by default; `duplicate_key_policy` configurable | parsed; detection is the caller's | |
| Tags, anchors, `<<` merge | accepted; `<<` merges by default | parsed losslessly, not expanded | |
| Multi-document | refused by the value loader | parsed | |
| Alias bomb (10^7 nodes) | refused by expansion limit, 39 ms | parse only, nothing expanded | |
| Parse and print 937 lines | 0.88 ms | 0.22 ms | |
| `unsafe` in crate source | none; `#![forbid(unsafe_code)]` | facade none; core one `get_unchecked` | one `transmute`; depends on `rowan` (56 sites) |
| Maturity (crates.io) | created 2026-05, 56 versions, ~0.9 M downloads, many of them through the `serde_yml` shim | created 2026-07, 12 versions, ~4 k downloads | created 2025-08, 8 versions |

Consequences for the spec:

- Both viable candidates leave the strict profile to us: refusing duplicate keys, tags, anchors and aliases, `<<`, and multiple documents on config files is a check the YAML Document component runs on the parsed tree, not a parser setting to trust.
- Writer shape A (surgical edit, byte-identical outside the edit) is achievable, so B (deterministic re-render) is not needed as a floor.
- The crate choice stays an implementation detail behind the component's port. Risk on each: `noyalib` is young with fast release churn and shares an author with `serde_yml` (archived, RUSTSEC-2025-0068); `yaml-rt` is young with low adoption and one `unsafe` call in core. The spec requires a pinned version, a golden-fixture suite and an upgrade procedure like the vendored js-yaml one, so either can be replaced.

Costs (Node 24.21, Linux x64):

| Operation | Cost |
|---|---|
| `require` of the release addon | 0.5 ms, once per process |
| sha256 verify of the addon file, as the door does | 8.4 ms, once per process, already paid by every Git door user |
| One N-API call (`versions()`) | 11.7 µs |
| stat + read + sha256 of the 40 KB config | 24.3 µs |
| stat only | 0.6 µs |
| Today's reader: read + `JSON.parse` | 59.3 µs |
| Spawn `/bin/true` from Node | 2.8 ms |
| `fgos version` through the host | 40 ms |

A doctor run reads config about 40 times: about 2.4 ms today, about 1.4 ms through one N-API call plus a digest check each time, and 0.1 to 1.6 s if each read spawned a process. The digest-keyed snapshot cache is therefore cheap enough to keep as the correctness default.

## G2. Releases sharing `~/.fgos` on this machine

One staged release (`fgctl status`), one activated project (`/home/vantt/projects/forgent`, found by searching `~` to depth 5), and `~/.local/bin/fgos`, a launcher script that runs whatever the nearest project activated. So on this machine no older release reads or writes `~/.fgos/config.json`. This does not cover the owner's other machine or other projects outside `~`, so the global format change stays deferred until the same check runs there.

## G3. Parse of real config files

Scanned with a duplicate-key detector that prints key paths only, never values: `.fgos/config.json` (1,507 lines, 706 keys, depth 8), `~/.fgos/config.json` (376 lines, 236 keys, depth 7) and `~/.fgos/confinement-backends.json`. No duplicate keys, no integers beyond 2^53. Keys like `code:implement` are valid plain YAML keys (a colon is an indicator only before a space), so a migration can keep them unquoted. Migration can abort on semantic inequality instead of needing a repair step.

## G5. Tests that write config files by hand

104 test files write a `config.json` themselves (32 in `test/runner`, 18 in `test/setup`, 9 each in `test/e2e` and `test/cli`, the rest spread out). Several files already carry their own small helpers (`test/cli/helpers/fgos-cli-harness.mjs` and others), so one shared fixture helper replaces them before any format change.

## Unresolved

- G4: build and load the combined addon and the host on Windows.
- G2 on the owner's second machine.
- Which crate to adopt is left to implementation with the spec's replacement rule; the spike does not pick one.
