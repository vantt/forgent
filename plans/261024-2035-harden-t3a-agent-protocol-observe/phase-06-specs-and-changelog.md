---
phase: 06
title: "Specs, contracts prose, component boundary and CHANGELOG follow the code"
status: pending
depends_on: [02, 03, 04, 05]
parallel: "none; the only writer of CHANGELOG.md and of the spec files in this plan"
effort: ~0.5d
net_size: "docs only (Node 0 / Rust 0 / tests 0)"
---

# Phase 06 — Specs and CHANGELOG

## Context

Arbitration §2 ("written into each spec"), §4.2 item 5, owner decision 31 (supersede the observe.md independence line), AGENTS.md L5 q6 (settled spec facts go into the area spec), install/setup/doctor gate (user-visible change → `CHANGELOG.md` `## [Unreleased]`). The parent plan's dependency table: before merging, message the DOC lead (`forgentx-5f`) with every spec and boundary path changed.

## Requirements

**`docs/platform/agent-protocol/spec.md`**
- §3 IO gate table (`:41-48`): drop the `read()` and `activity()` rows; say outbox reads take the port's `pause`.
- §4 Named results (`:52-71`): `blocked(usage-limit)` is named in both modes; delete the sentence "A usage limit is a `blocked` reason in direct mode only…" (`:71`); state the wording rule (a wording joins only with a recorded vector; terminal screens match login and quota from the line start after an `error` prefix; direct mode reads the last 5 capture lines); state the one-rule-for-every-path fact (ready gate, detector-blocked, idle); list the receipt reasons the protocol renders, including the four supervisor stop reasons, and that the direct `direct:blocked:<reason>` arm arrives with T4's wiring of `classify`.
- §5/§5.1: outbox reads are bounded (16 MiB), no-follow, regular files only, through `fgos-durable-file` on Unix; on other targets the opened file's type and size are checked; leading-zero result numbers are refused.
- §7 Activity (`:112-122`): `Event` row goes; a JSON line is `Output`.
- §8 Boundaries (`:124-128`): stdin policy is the envelope's (gate), not the protocol's; new dependency on the L0 leaf `fgos-durable-file`; the protocol is the one place that names an outcome, and Node's remaining screen re-read in the settle step is T4's to delete (D-T3A-1).
- §9 Lịch sử quyết định: one dated entry (2026-10-2x) for the T3-04a changes, citing the arbitration and owner decision 30.

**`docs/specs/observe.md`**
- §3 Storage (`:38-40`): one shard door for the four stores (store directories must be real directories; shard no-follow, regular-only; under the lock, torn tail healed (eval: refused) then one `write_all`; bounded reader that names and skips a bad line); Windows refuses reparse points through `fgos-durable-file`; known limits: the directory check and the open are separate calls, and `pid-*` shards never settle on an equal instant; lock wait 4 s; store root is the main checkout (Git's trusted main root; a resolver error is `observe-root-unresolved`).
- §5 § Metrics, the independence line (`:58` "Hermetic consumer invariant") and the doctor line (`:74`): **superseded** per owner decision 31: the shared fixture `test/fixtures/run-layout/expected.json` is the one proof of admission; the doctor checks the host's accounting and compares directory counts, without re-admitting runs in Node. Write the supersession in §6, never edit the old entry's meaning in place.
- § Friction (`:66-67`): migration is explicit (`friction migrate`, locked, fails closed) and leaves the write path; settlement compares instants, ties broken by file order within one writer shard; **known limit**: across machines, clock skew can make a resolve miss the records it meant to settle; refusals are named `friction-invalid-input:`.
- `metrics` verbs: one flag grammar; `--json` accepted as a no-op.
- §6 Lịch sử quyết định: one dated entry citing the arbitration, decisions 30–31.

**`docs/platform/holder-lock/spec.md:173`** and the matching sentence in `observe.md` §3: the observe lock waits at most 4 s (so the host names `observe-lock-timeout` before `invokeHost`'s 5 s kill).

**`docs/platform/component-boundary.md`**
- `:90` Agent protocol row: drop "decide stdin policy"; add "names `blocked(usage-limit)` in both modes; renders the receipt reason".
- `:75` Observe row: one shard door; root is the main checkout.

**`docs/specs/reading-map.md:66`**: drop "stdin theo CLI (codex luôn null)".

**`CHANGELOG.md` `## [Unreleased]`** (`:8`), user-visible lines only:
- A terminal attempt stopped on a used-up quota now records `terminal:blocked:usage-limit` instead of `terminal:needs-human`.
- `fgos friction` and `fgos metrics` stores: one bad line no longer breaks `friction list|show|rank` (the line is named on stderr and skipped); a symlinked or non-regular shard is refused in every store; `friction record`/`resolve` no longer re-read the legacy event log; `friction migrate` takes the store lock.
- `fgos metrics coverage|runs|harness` answer in about a third of the time.
- `metrics` verbs accept `--k=v` everywhere and `--json` as a no-op; an unknown flag or a bad number is an error.
- Doctor: `observe-host-resolvable` now reads the friction store; `observe-run-coverage` checks the host's accounting and directory count, without re-admitting runs in Node.

## Steps

1. Edit each file above; re-read it; verify every claim against the merged code (`rg` the symbol for each sentence).
2. Message the DOC lead with the file list (parent plan dependency row "DOC 260925").
3. One commit `docs(observe,agent-protocol): …`.

## Validation

```sh
node --input-type=module -e "import {runChosenTests} from './scripts/run-tests.mjs'; runChosenTests(['test/runner/dead-vocabulary-guard.test.mjs','test/docs/agents-doctrine-anchors.test.mjs','test/docs/decisions-corpus-retired.test.mjs'])"
```

`test/runner/dead-vocabulary-guard.test.mjs:498` reads `component-boundary.md`; no other test reads the changed specs (`rg -l` over `test/`). Every changed sentence names code that exists on the track branch (checked by `rg`), and every relative link resolves (`ls` each target).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| DOC lane patches the same docs | M × M | Message before merge; DOC rebases on HARDEN's text (parent plan rule) |
| A spec claim drifts from code merged in an earlier phase | M × M | Step 1 re-verification by `rg`, after phases 02–05 are on the track branch |

## Rollback

Revert the docs commit.
