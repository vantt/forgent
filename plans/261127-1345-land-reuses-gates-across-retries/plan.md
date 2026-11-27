---
contract: plan-v1
title: "A land reuses its gates across retries, builds against a shared Cargo target, and scans the census once"
status: running
lead: session:fg-server-claude-2026-11-27
priority: P1
blockedBy: []
base: 9840cdd1c915e454ce02661f74d9071f3821bd77
created: 2026-11-27
footprint:
  - plans/261127-1345-land-reuses-gates-across-retries/**
  - packages/supervision/rust/src/land.rs
  - packages/supervision/rust/tests/land.rs
  - docs/platform/supervision/spec.md
  - .fgos/config.yaml
  - CHANGELOG.md
source:
  - owner request 2026-11-27 12:54 ("lâu quá, land xong tìm cách nào để mỗi lần land nhanh hơn")
---

# A land reuses its gates across retries, builds against a shared Cargo target, and scans the census once

## Outcome

A land on a busy trunk finishes in about one attempt's time instead of many. On 2026-11-27, one attempt took
2 to 5 minutes, while a successful land often took 15 to 30, because every "remote moved" retry ran regenerate and
every gate again on a fresh candidate that compiled the whole Rust workspace from nothing.

Measured on fg-server, 2026-11-27, from the land logs and by running each step alone:

| Step of one attempt | Time |
|---|---|
| Cargo build in the fresh candidate: 208 external crates plus 61 workspace crates, every time | 40 to 60 s |
| Census scan: regenerate, then the same scan again as a gate | about 18 s each, warm |
| The seven gate test files | about 37 s |
| `cargo fmt --all --check`, `export-command-selectors --check` | under 5 s |

## Acceptance criteria

1. A retry whose trunk moved only by paths that no gate `when` and no regenerate `when` matches skips regenerate and
   the gates, and pushes the new candidate with the gates it already passed. A retry whose trunk moved by any matching
   path runs everything again, as today. The owning proof is in `packages/supervision/rust/tests/land.rs`.
2. Regenerate and gate commands run with `CARGO_TARGET_DIR` set to one shared directory under the main checkout's
   `.fgos/runtime/`, unless the caller already set it. A second land compiles no external crate again.
3. The project config's gate that reruns `git-one-door-scan` is removed. The regenerate run already fails a land on
   an undeclared site, and its `when` covers every path that gate's `when` does.
4. Before and after times of one land, on fg-server, are recorded in `reports/`.
5. The land tests and `cargo test -p fgos-supervision` pass; `npm test` and `cargo test --workspace` are green.

## Non-goals

- No gate is weakened: every gate still runs whenever a path it names changed, on the landed branch or on the trunk
  it lands on.
- The candidate checkout's path and Land's crash-recovery design in `packages/git/rust/src/land.rs` stay as they are.
- No new tool (sccache or prebuilt libraries).

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Gate results reused across a retry when the trunk moved outside every gate's `when` | `supervision` | survivor: the retry loop of `land_branch` in packages/supervision/rust/src/land.rs; nothing else decides when a land re-gates |
| The shared Cargo target of land commands | `supervision` | set where the land door runs its `sh -c` commands; nothing else sets it |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Gates are reused across a retry the trunk moved outside them](phase-01-reuse-gates-across-retries.md) | - | packages/supervision/rust/src/land.rs, packages/supervision/rust/tests/land.rs | 1 | done |
| 2 | [Land commands build against one shared Cargo target](phase-02-shared-cargo-target.md) | 1 | packages/supervision/rust/src/land.rs, packages/supervision/rust/tests/land.rs | 2 | done |
| 3 | [One census scan per land, measurements, docs](phase-03-one-census-scan-and-measure.md) | 2 | .fgos/config.yaml, docs/platform/supervision/spec.md, CHANGELOG.md, plans/261127-1345-land-reuses-gates-across-retries/reports/** | 3 | running |

## Owner questions

None. The owner approved the plan on 2026-11-27 ("ok mở plan làm đi") and chose a shared Cargo target over sccache
or prebuilt libraries.

## Risks and rollback

- **Reusing a gate after a trunk change it should have seen.** The reuse rests on each gate's `when` globs. A gate
  whose `when` misses a path it depends on would also miss that path on a first land, so this adds no new gap. Every
  gate without `when` always runs again.
- **A shared target dir shared by two lands.** Lands of one target hold its merge slot one at a time, and Cargo
  locks its own target directory.
- **Rollback:** revert the phase commits. Retries then run every gate again, and candidates build in their own
  target.
