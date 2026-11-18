---
contract: plan-v1
title: "Give `fgos session` back to agent sessions: retire the session worktree lifecycle, rename `fgos head` to `fgos session`"
status: draft
priority: P1
blockedBy:
  - 261117-1856-secretary-session-spine
  - 261115-2328-execution-read-door
footprint:
  - plans/261118-0947-session-verb-for-agent-sessions/**
  - apps/fgos/src/wiring/session.rs
  - apps/fgos/src/main.rs
  - apps/fgos/src/routing.rs
  - apps/fgos/src/wiring/mailbox_verbs.rs
  - apps/fgos/src/wiring/doctor/identity.rs
  - apps/fgos/src/cli_projector.rs
  - apps/fgos/tests/**
  - apps/fgos-gateway/**
  - packages/host-runtime/rust/src/catalog.rs
  - packages/host-runtime/contracts/**
  - packages/holder-lock/contracts/lock-registry.v1.json
  - packages/git/rust/src/store_admission.rs
  - packages/git/contracts/mutation-census.v1.json
  - packages/identity/**
  - packages/run-supervisor/contracts/head-request.v1.json
  - packages/run-supervisor/rust/**
  - packages/distribution/contracts/doctor-registry.v1.json
  - src/**
  - bin/fgos.mjs
  - test/**
  - core/skills/**
  - domains/coding/skills/**
  - .agents/skills/**
  - .claude/skills/**
  - plugins/fgOS/skills/**
  - docs/platform/runner/**
  - docs/platform/git/spec.md
  - docs/platform/holder-lock/spec.md
  - docs/platform/identity/spec.md
  - docs/platform/session-host/spec.md
  - docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml
  - docs/architecture-manifest.json
  - docs/reading-map.md
  - docs/backlog.md
  - CHANGELOG.md
base: 554082bab6dd5216309a227d5388953e0e36effc
source:
  - p-g2iprtzptz
  - plans/261118-0947-session-verb-for-agent-sessions/reports/scan-261118-0947-session-worktree-verbs.md
  - docs/discussions/secretary-miu/DISCUSSION.md
created: 2026-11-18
---

# Give `fgos session` back to agent sessions

Evidence for every claim below: [scan report](reports/scan-261118-0947-session-worktree-verbs.md) (sections cited as §n).

## Outcome

- `fgos session` means one thing: an agent head session. `fgos session start <persona> --name <n>` and
  `fgos session rotate <persona> --name <n> [--now]` are the verbs the secretary plan shipped as `fgos head`; `fgos head`
  no longer exists.
- The per-session detached worktree lifecycle (`session start|end|list|gc`, `.fgos/sessions.json`, the `sessions` lock,
  `<tmp>/fgos-sessions/`) is gone with every reader. Making and removing a checkout has one door: `fgos worktree`.
- Identity resolves a writer id from env, pid or nothing; it no longer reads `.fgos/sessions.json`, so `source:
  registry` and the `--fgos-dir` option are gone.
- The gateway keeps `POST /v1/sessions`, `DELETE /v1/sessions/{id}`, `GET /v1/sessions/{id}/slots` as routes that answer
  a clear refusal without calling any `fgos` verb, until the gateway work rebuilds them on the new verb.

## Decisions (settled by evidence or the owner)

| id | decision | ground |
|---|---|---|
| SV-1 | Retire the worktree lifecycle, do not merge `list`/`gc`/`--item` into `fgos worktree` | owner 2026-11-18; no skill/hook/script caller, live registry `[]` (§1); `worktree` already creates/removes (§2); `gc` liveness is the start process's own pid, dead at once (§8) — RUL104 |
| SV-2 | `return` (main-source) runs from the main checkout only; the registered-session exemption and its "run `fgos session start --item`" advice go | the exemption serves only registry rows (§1); branch-source return is unaffected |
| SV-3 | `approve` keeps only the structural `isMainWorktree` refusal | the registry loop is subsumed by it (§1, `approve.mjs:232-258`) |
| SV-4 | Post-land drift keeps only the `stale` outcome; the `notify` (owning session) outcome, `postland-drift.mjs` and doctor row `leaf-notify-drift` go | both are gated on live registry rows, so they never fire without the registry (`graph-harness.mjs:454`, `postland-drift.mjs:57`) |
| SV-5 | Store admission drops the symlinked-`.fgos` session case | only `session start` makes such a checkout (§1, `store_admission.rs:161`) |
| SV-6 | Identity drops registry confirmation, `Source::Registry`, the `fgos_dir` argument through the crate, the facade parameter and `--fgos-dir` | `session start` never exports `FGOS_SESSION_ID`, no code branches on `registry` (§1); a dead parameter is RUL104 debt; every caller moves (L10) |
| SV-7 | Gateway routes stay and refuse (HTTP 501, the gateway's own error body, naming the retirement) | owner 2026-11-18; the gateway will come back and owns its routes; no web screen calls them |
| SV-8 | Old spellings vanish: no alias, no refusal pointer for `fgos head`, `session end|list|gc` | L10; only the owner runs fgOS and all machines upgrade together (owner 2026-11-09); the host's unknown-verb/sub-verb answer already lists what exists |
| SV-9 | The head-request socket verbs `head start`/`head rotate` become `session start`/`session rotate`; the contract file, "head session", Identity's `head:` role and `FGOS_HEAD_ROLE` keep their names | the socket verbs mirror the CLI verbs by design (`head-request.v1.json`: "`fgos head rotate` calls the same one"); "head" stays the Session Host's word for the session kind (secretary phase 15) |
| SV-10 | The renamed verb stays a Node verb in this plan; any new code a phase must write is Rust, Node only a thin caller | owner 2026-11-18: new code in Rust when it does not disturb what exists, landed code is not rewritten; the head verb landed in Node (`f36f5620d`) and a rename is not new code |

Prior art reused: `fgos worktree` (Git Worktree port) as the only checkout door; the host's unknown-verb answer as
the refusal; secretary phase 15's provisional naming note. Missing and not added: any worktree list/gc (git's own list
suffices).

## Acceptance criteria

1. `rg -n "fgos head\b|'head'" src bin core domains docs/platform packages/run-supervisor/contracts` finds no verb use
   (Identity's `head:` role and the "head session" term excepted); `npm run fgos:dev -- head --help` answers unknown verb.
2. `npm run fgos:dev -- session start --help` and `session rotate --help` describe the head-session verbs;
   `session end|list|gc` answer unknown sub-verb.
3. `rg -n "sessions\.json|listSessions|fgos-sessions|is_session_worktree|Source::Registry|registry_confirms" apps packages src bin test docs/platform`
   finds nothing but CHANGELOG/history text.
4. `curl -X POST /v1/sessions` against a started gateway returns 501 and spawns no `fgos` child (gateway test).
5. `node scripts/plan-contract-check.mjs --plan plans/261118-0947-session-verb-for-agent-sessions` prints ok.
6. `npm test` and `cargo test --workspace` green on the combined tree; `cargo clippy --workspace -- -D warnings` clean.
7. `CHANGELOG.md` `[Unreleased]` names the verb change; backlog `p-g2iprtzptz` is done, `p-5x37olszki` closed as obsolete.

## Non-goals

- Moving `fgos session` (head) or `fgos worktree` to Rust (S6a owns `worktree`).
- Any `fgos worktree list|gc`, item binding, or new drift notification keyed on something else.
- Rebuilding the gateway `/v1/sessions` routes on the new verb (gateway work, later).
- Renaming Identity's `head:` role, `FGOS_HEAD_ROLE`, the Session Host's "head session" term, or the `fgos identity session` sub-verb.
- Deleting leftover `.fgos/sessions.json` files or `<tmp>/fgos-sessions` dirs in user projects (inert; CHANGELOG says so).

## Leader rules (every phase)

- Step 0 of every phase re-greps its inputs: this plan was written before secretary waves 8-10 and S5 09-12 landed;
  file and line numbers move. A finding that changes a decision above stops the phase with `NEEDS_CONTEXT`.
- Deleting a mechanism retires its tests in the same phase; a retired test names the test that now owns the behaviour
  or says the behaviour was removed (design principle 8).
- Generated files (command manifest, routes, annotations, skill render surfaces) are regenerated, never hand-merged.
- New code goes in Rust (owner 2026-11-18): if a step needs code that does not exist yet (a helper, a refusal, a check), write it in the owning Rust crate and keep any Node side a thin caller. Edits and deletions of landed Node code stay in Node; do not port landed code as part of this plan.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Node readers stop reading the session registry](phase-01-node-readers.md) | - | src/runner/session.mjs, src/runner/merge.mjs, src/verbs/merge/approve.mjs, src/state/postland-drift.mjs, src/state/graph-harness.mjs, src/setup/registrations.mjs, packages/distribution/contracts/doctor-registry.v1.json, bin/fgos.mjs, test/cli/**, test/runner/session.test.mjs, test/verbs/merge/**, test/setup/checks.test.mjs, test/state/**, test/architecture.test.mjs, docs/architecture-manifest.json, docs/platform/runner/** | 1 | draft |
| 2 | [Gateway session routes refuse](phase-02-gateway-routes-refuse.md) | - | apps/fgos-gateway/**, docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml | 1 | draft |
| 3 | [Host drops the session worktree verb](phase-03-host-drops-session-verb.md) | 1, 2 | apps/fgos/src/wiring/session.rs, apps/fgos/src/main.rs, apps/fgos/src/routing.rs, apps/fgos/tests/**, packages/host-runtime/**, packages/holder-lock/contracts/lock-registry.v1.json, docs/platform/holder-lock/spec.md, packages/git/rust/src/store_admission.rs, packages/git/contracts/mutation-census.v1.json, docs/platform/git/spec.md, src/cli/command-registry.mjs, test/rust-host/**, test/util/host-bin.test.mjs | 2 | draft |
| 4 | [Identity stops reading sessions.json](phase-04-identity-drops-registry.md) | 3 | packages/identity/**, src/util/session-identity.mjs, src/git/inspect.mjs, src/observe/invocation-fault-log.mjs, src/runner/dispatch/**, src/runner/merge.mjs, src/state/**, bin/fgos.mjs, apps/fgos/src/wiring/mailbox_verbs.rs, apps/fgos/src/wiring/doctor/identity.rs, apps/fgos/src/cli_projector.rs, apps/fgos/tests/**, src/cli/command-registry.mjs, packages/host-runtime/contracts/**, test/util/session-identity.test.mjs, test/git/**, test/state/**, docs/platform/identity/spec.md | 3 | draft |
| 5 | [Rename `fgos head` to `fgos session`](phase-05-rename-head-to-session.md) | 4 | src/cli/command-registry.mjs, packages/host-runtime/contracts/**, bin/fgos.mjs, test/cli/**, src/session-host/**, src/session-rotation/**, test/session-host/**, packages/run-supervisor/contracts/head-request.v1.json, packages/run-supervisor/rust/**, core/skills/**, domains/coding/skills/**, .agents/skills/**, .claude/skills/**, plugins/fgOS/skills/**, docs/platform/session-host/spec.md | 4 | draft |
| 6 | [Integration, docs and full gate](phase-06-integration.md) | 1, 2, 3, 4, 5 | CHANGELOG.md, docs/reading-map.md, docs/backlog.md, plans/261118-0947-session-verb-for-agent-sessions/reports/integration.md | 5 | draft |

**Waves.** 1: phases 1, 2 (disjoint: Node/runner vs gateway). 2: phase 3. 3: phase 4. 4: phase 5. 5: phase 6.
Serial reasons: phase 3 deletes the host verb the Node readers of phase 1 still call, so 1 lands first; the gateway of
phase 2 shells the verb, so it lands first too. Phase 4 changes `resolve_current`'s signature, which `session.rs`
calls until phase 3 deletes it. Phase 5 needs the name `session` free (phase 3) and shares the command registry,
manifest and `bin/fgos.mjs` with phase 4.

**Hot files.** `src/cli/command-registry.mjs` and the generated `packages/host-runtime/contracts/command-*.json`: phases 3, 4, 5,
one per wave. `bin/fgos.mjs`: phases 1, 4, 5, one per wave. `src/runner/merge.mjs`: phases 1, 4. Skill render surfaces:
phase 5 only (`npm run build:skills`). CHANGELOG, reading-map, backlog: phase 6 only.

**Contract check (by reading, script run below).** Every phase sits in a later wave than each dependency; wave 1's two
footprints share no path or prefix.

## Owner questions

None open. Answered 2026-11-18: retire outright (SV-1); gateway routes stay and refuse (SV-7). SV-8 (old spellings
vanish) is decided from the owner's standing rule that all machines upgrade together; say so if a refusal pointer is
wanted instead.

## Risks and rollback

- **Secretary phases 15-16 already landed** (`f36f5620d` head verb, `e72263ebd` secretary and /handoff skills; board
  `9979a0de0`): `fgos head` is live. Phases 17-18 may add more `head` uses. Step 0 of phase 5 reads the landed tree, not
  the secretary phase files; the rename follows what landed.
- **A hidden reader of `sessions.json`** (outside the greps of §1). Phase 3's acceptance grep over the whole repo
  catches it; a reader found there joins phase 3 or stops it.
- **Identity callers in hot paths** (`withStateTx` resolves the writer each call): the cache key becomes env-only;
  phase 4 keeps the existing session-identity tests as the owning proof.
- **Rollback**: each phase is one commit set on its branch; revert phase 6..1 merges in reverse wave order. Reverting
  phase 5 restores `fgos head` while `session` stays free; reverting 3 needs 4 and 5 reverted first.

## Validation Log

- 2026-11-18 planner: scan report written; owner answered SV-1, SV-7; owner rule "new code in Rust" folded into SV-10 and leader rules; plan status `draft` until the owner approves and
  the two blocking plans land.
