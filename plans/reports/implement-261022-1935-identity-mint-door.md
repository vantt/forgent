---
title: "Implement: mint door for every owner"
lane: IDENT
date: 2026-10-22
branch: ident/p07-mint-door
---

# Implement: mint door for every owner

Worktree `/home/vantt/projects/forgent-worktrees/identity-p07`, branch `ident/p07-mint-door`, base `3fcca3e68`. Nothing pushed, nothing merged.

## What shipped

| Piece | Where |
|---|---|
| Git port for counter refs: `sequence_home`, `sequence_tip`, `sequence_push` (`Claimed` or `Stale`), kind and claimant validation; `transfer_url` and the shared transport argv in `remote.rs` made reusable | `packages/git/rust/src/sequence.rs`, `remote.rs`, `lib.rs`, `tests/sequence.rs`; census regenerated |
| Mint door: `mint::{random, claim_sequence, claim_counter, release_sequence}`, kinds `work`, `backlog`, `d-adr`, `decision-file`; `random_bytes` in `text.rs` | `packages/identity/rust/src/mint.rs`, `tests/mint.rs` |
| Verb `fgos identity mint <kind> [--release <n>] [--json]` (operation `identity.write`), contract, projector, CLI registry, regenerated `command-routes.json` | `provider.rs`, `apps/fgos/src/cli_projector.rs`, `identity.write.v1.json`, `src/cli/command-registry.mjs` |
| Convention identifier kinds `work-item-id` and `backlog-id` (rules + golden) | `packages/convention/contracts/` |
| Node facade (verb spawn, refuses while a state lock is held via `stateLockHeld()`), callers moved: `fgos submit`, `fgos add` without `--id`, runner discovered work, `promote-to-component` | `src/util/identity-mint.mjs`, `bin/fgos.mjs`, `src/runner/loop.mjs`, `src/verbs/merge/promote-to-component.mjs` |
| Deleted (L10): `generateId` and its hash helpers; `nextFreeDecisionId`, `renumberDecisionText` and the whole decision-index collision self-resolve in `src/runner/merge.mjs` (`classifyDecisionIndexText`, `rebuildDecisionIndex`, `splitConflictSegments`, `treePaths`, `selfResolved` result field) | `src/intake/classify.mjs`, `src/runner/merge.mjs` |
| Doctor check `identity-ids-unique` | `src/setup/identity-checks.mjs`, `registrations.mjs` |
| One always-loaded rule `core/instructions/id-minting.md`; AGENTS.md block and `.fgos/instructions/effective/repo.json` regenerated with `materializeInstructionProjection` | |
| Docs: identity spec 4a and decision history, git spec, work-state, reading-map, setup-doctor registry, architecture manifest, CHANGELOG | |

## Finding the plan did not have

A claim commit built from the same tip, number and second is byte-identical, so two machines claiming the same number in the same second both get "accepted" (the second push is a no-op). The first race test caught it. Every claim commit now carries a random claimant (author name `claim-<64 random bits>`), passed by Identity into `sequence_push`. Spec 4a records it.

## Decisions made without asking

- Phase text said "the land path claims the number before its commit". The decision corpus is retired (`docs/decisions/` holds only the generated index), so no land path allocates a number. The renumbering and the whole decision-index collision self-resolve were unreachable in production; deleted with their tests rather than rewired.
- First claim on an existing project starts after the highest number its documents carry (`D-ADR####` in a heading of `docs/specs/*.md` or `docs/platform-foundations.md`; `NNNN-` prefix of a file in `docs/decisions/`), else the first `d-adr` would be `D-ADR0001` (seen in a scratch repo). On this repo the next `d-adr` is `D-ADR0073`.
- Counter home: the `origin` remote, else the repository's own ref. No other remote name is looked at.
- `--release <n>` added to the verb so the "push back" rule of 4a is reachable by agents; it is the only consumer of `release_sequence`.
- Convention kinds only check character set and length (the identifier rule schema has no prefix field); prefix and length live in the crate, and the crate test checks minted ids against the Convention kinds. Project id stays minted by `identity project`.
- `identity-ids-unique` reads the checkout it runs in (tracked docs), not the main checkout. It does not scan work item records: the store already refuses a duplicate `add`. A `D-ADR` heading repeated in two specs counts as one decision while the short title in parentheses is the same (D-ADR0070 sits in workflow.md and runner.md).
- Id minting never runs in a state lock: the facade throws `identity-in-lock` through `stateLockHeld()`; all four callers mint before `addWork`.

## Proof

- `cargo test -p fgos-git --test sequence`: port cases (local counter, remote counter with stale lease, unreachable remote, bad kind, bad claimant). `cargo test -p fgos-identity --test mint`: format and alphabet against Convention, 10 racing claims from 5 clones give 1..10, floor from documents, release only while tip, no-remote, unreachable remote refuses. Repeated 3 times, green.
- `cargo test --workspace --no-fail-fast`: one failure, `fgos-git` `worktree::killed_move_repairs_only_the_recorded_destination_and_preserves_bytes` ("lock-acquire-unavailable: Timeout waited_ms 0"); it passes alone 6 of 6 and fails about 1 of 3 under the parallel run. An earlier fail-fast run stopped on `recovery_matrix` with the same lock timeout, green on two reruns. Neither touches the sequence code.
- Full `npm test` (first run): 22 red = 17 fgctl + codex `cli-bypass` (known) + 4 mine (architecture manifest row and import check, registry sub-verb drift, my D-ADR floor test fed a file the narrowed floor does not read). Fixed; second run found the generated `command-routes.json` stale (4 more, regenerated). The affected files (architecture, subcommand-flag-drift, unknown-flag-rejection, rust-host routes, help, release-tree, harness, mint-door, intake, merge) pass.
- Final full `npm test`: see the last section.
- `rg -n 'nextFreeDecisionId|renumberDecisionText' src test` finds nothing.
- `npm run fgos:dev -- doctor --json`: `identity-ids-unique` passes ("57 backlog ids, 4 D-ADR numbers and 0 decision files, none repeated").
- Retired tests and who owns the behaviour now: five `generateId` tests in `test/intake/classify.test.mjs` (format, fixed prefix, collision retry, stability: the behaviour was removed; random format and uniqueness are owned by `packages/identity/rust/tests/mint.rs`, Node wiring by `test/identity/mint-door.test.mjs`, `fgos add` wiring by `test/cli/fgos-intake-2.test.mjs`); seven decision-collision tests in `test/runner/merge.test.mjs`, one in `merge-land.test.mjs`, `nextFreeDecisionId` in `merge-quoted-paths.test.mjs`: the mechanism was removed; two machines never getting the same number is owned by the concurrent claim test in `mint.rs` and by `identity-ids-unique`.

## Live forge check

`cargo test -p fgos-identity --test mint -- --ignored live_forge --nocapture` against `https://github.com/vantt/forgent.git` (the checkout's `origin`), probe counter `refs/fgos/seq/probe-3164330`, two fresh repositories racing:

```
live forge probe refs/fgos/seq/probe-3164330: two racing claims got [1, 2]
cleanup rc=0
test live_forge_two_machines_race_a_probe_counter ... ok
```

`git ls-remote origin` before and after lists no `refs/fgos/seq*` ref and no `refs/fgos/seq-probe/*` ref. The real `d-adr` and `decision-file` counters were never touched; no counter exists on the remote yet (the first agent claim creates it, starting after the highest number in the specs).

## For the lead

- Main's `AGENTS.md` has an uncommitted edit (git status at start); this branch regenerates the same file's projection block, so a merge may need a hand look at the block end.
- `docs/id-systems-audit.md` row 1 still describes `generateId` (historical audit, left as is).
- Plan phase status and the program board row were not changed (no landing).
- Pre-existing `autostash` stash in the shared repo dates from Oct 21; not mine.
- Rust files I did not format-clean (`apps/fgos/src/cli_projector.rs`, `provider.rs`, others) were already off `rustfmt`; only my four new files are formatted.
