---
contract: plan-v1
title: "Give `fgos session` back to agent sessions: retire the session worktree lifecycle, rename `fgos head` to `fgos session`"
status: ready
priority: P1
blockedBy:
  - 261117-1856-secretary-session-spine
  - 261115-2328-execution-read-door
  - 261118-1455-s6a-worktree-door
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
  - packages/run-supervisor/rust/**
  - packages/distribution/contracts/doctor-registry.v1.json
  - packages/session-host/**
  - packages/questions/rust/**
  - packages/git/node-addon/**
  - packages/config/rust/**
  - packages/observe/rust/**
  - apps/fgos/src/wiring/**
  - packages/run-supervisor/contracts/**
  - core/config-standard/sessionRotation.yaml
  - core/config-schema/sessionRotation.schema.yaml
  - apps/fgos/src/wiring/session_rotation_hook.rs
  - apps/fgos/src/wiring/mailbox_identity.rs
  - packages/mailbox/rust/**
  - docs/platform/agent-confinement/**
  - docs/platform/agent-mailbox/spec.md
  - docs/platform/run-supervisor/**
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
  - p-zgbqe2bpig
  - p-ktnvgs2ozm
  - p-cymvjb6nrc
  - plans/261118-0947-session-verb-for-agent-sessions/reports/scan-261118-0947-session-worktree-verbs.md
  - docs/discussions/secretary-miu/DISCUSSION.md
created: 2026-11-18
---

> Hold lifted (owner 2026-11-18 20:4x, option A after the S6a worktree door 1455 landed); ready since account lease 261118-1847 is done (supervisor).

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
| SV-9 | Every head-request socket verb `head <x>` becomes `session <x>` (start, rotate, answered, restore role); the contract file, "head session", Identity's `head:` role and `FGOS_HEAD_ROLE` keep their names | the socket verbs mirror the CLI verbs by design (`head-request.v1.json`: "`fgos head rotate` calls the same one"); "head" stays the Session Host's word for the session kind (secretary phase 15) |
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
8. A launched secretary head (owner decision 2026-11-18: raise the grants): edits `docs/backlog.md` and the other files
   its skill writes, sends mail, reaches its peers' sockets, and `fgos identity session` resolves it as its `head:` role;
   a path outside its grant stays read-only (phase 7 tests plus one live check on fg-server2).
9. A manual rotation (`fgos head rotate`, `fgos session rotate` after phase 5) records `rotation: manual` in log, handoff and `latest.json`, and its handoff carries
   the last assistant message (where the secretary batches its open questions) and the secretary portfolio; `sessionRotation.personas.secretary.reload`
   is non-empty (phase 8).
10. A launched head has no pid namespace and read-only binds of `/run/user/<uid>/cc-socks` and `~/.claude/sessions`
    (workers keep `--unshare-pid`); the run-supervisor gate reaps a head's whole tree in its subreaper mode plus PDEATHSIG (decided 2026-11-18, supervisor ack; no cgroup) with an owning
    Rust proof replacing "empty namespace means a dead tree"; the confinement spec records the peer `.key` exposure;
    Miu's `ListAgents` shows peers alive and her SendMessage arrives (phase 7b).
11. The context window of the secretary head's model is proven and written down; if it is not 1M, the rotation measure
    uses the per-model window and a 200k-model test crosses soft (phase 9). Backlog `p-zgbqe2bpig`, `p-ktnvgs2ozm`,
    `p-cymvjb6nrc` are done (or the last closed as not a bug with its proof).
12. A secretary head writes `docs/backlog.md` only through `head write` (Rust door, path checked against the grant,
    atomic write); `docs/` is read-only in the head again and a host-replaced sibling stays read-only (phase 7c).

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
| 1 | [Node readers stop reading the session registry](phase-01-node-readers.md) | - | src/runner/session.mjs, src/runner/merge.mjs, src/runner/worktree.mjs, src/verbs/merge/approve.mjs, src/verbs/merge/sync-root.mjs, src/state/postland-drift.mjs, src/state/graph-harness.mjs, src/setup/registrations.mjs, packages/distribution/contracts/doctor-registry.v1.json, bin/fgos.mjs, test/cli/**, test/runner/session.test.mjs, test/runner/merge.test.mjs, test/runner/merge-quoted-paths.test.mjs, test/runner/paths.test.mjs, test/direct/merge-gate.test.mjs, test/test-ownership.mjs, test/suite-baseline.json, test/verbs/merge/**, test/setup/checks.test.mjs, test/state/**, test/architecture.test.mjs, docs/architecture-manifest.json, docs/platform/runner/** | 1 | done |
| 2 | [Gateway session routes refuse](phase-02-gateway-routes-refuse.md) | - | apps/fgos-gateway/**, docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml | 1 | done |
| 3 | [Host drops the session worktree verb](phase-03-host-drops-session-verb.md) | 1, 2 | apps/fgos/src/wiring/session.rs, apps/fgos/src/main.rs, apps/fgos/src/routing.rs, apps/fgos/src/cli_projector.rs, apps/fgos/tests/**, packages/host-runtime/**, packages/holder-lock/contracts/lock-registry.v1.json, docs/platform/holder-lock/spec.md, packages/git/rust/src/store_admission.rs, packages/git/contracts/mutation-census.v1.json, docs/platform/git/spec.md, src/cli/command-registry.mjs, test/rust-host/**, test/util/host-bin.test.mjs, test/cli/fgos-manifest.test.mjs | 2 | done |
| 4 | [Identity stops reading sessions.json](phase-04-identity-drops-registry.md) | 3, 8 | packages/identity/**, packages/mailbox/rust/store/src/hook/resolve.rs, src/util/session-identity.mjs, src/git/inspect.mjs, src/observe/invocation-fault-log.mjs, src/runner/dispatch/**, src/runner/merge.mjs, src/state/**, bin/fgos.mjs, apps/fgos/src/wiring/mailbox_verbs.rs, apps/fgos/src/wiring/doctor/identity.rs, apps/fgos/src/cli_projector.rs, apps/fgos/tests/**, src/cli/command-registry.mjs, packages/host-runtime/contracts/**, test/util/session-identity.test.mjs, test/git/**, test/state/**, docs/platform/identity/spec.md, packages/identity/contracts/**, packages/questions/rust/**, packages/git/node-addon/**, packages/config/rust/**, packages/observe/rust/**, apps/fgos/src/wiring/**, docs/architecture-manifest.json, docs/platform/runner/**, packages/git/contracts/mutation-census.v1.json | 6 | draft |
| 5 | [Rename `fgos head` to `fgos session`](phase-05-rename-head-to-session.md) | 4, 9 | src/cli/command-registry.mjs, packages/host-runtime/contracts/**, bin/fgos.mjs, test/cli/**, src/session-host/**, src/session-rotation/**, test/session-host/**, packages/run-supervisor/contracts/head-request.v1.json, packages/run-supervisor/rust/**, core/skills/**, domains/coding/skills/**, .agents/skills/**, .claude/skills/**, plugins/fgOS/skills/**, docs/platform/session-host/spec.md | 7 | draft |
| 6 | [Integration, docs and full gate](phase-06-integration.md) | 1, 2, 3, 4, 5, 7, 7b, 7c, 8, 9 | CHANGELOG.md, docs/reading-map.md, docs/backlog.md, plans/261118-0947-session-verb-for-agent-sessions/reports/integration.md | 8 | draft |
| 7 | [The secretary head gets the grants its role needs](phase-07-secretary-head-grants.md) | - | src/session-host/**, src/runner/dispatch/confinement/**, packages/run-supervisor/rust/**, packages/run-supervisor/contracts/**, packages/identity/**, packages/mailbox/rust/**, apps/fgos/src/wiring/mailbox_identity.rs, apps/fgos/src/wiring/mailbox_verbs.rs, src/runner/dispatch/session-attempt.mjs, .agents/skills/**, .claude/skills/**, plugins/fgOS/skills/**, core/skills/fgos-secretary/**, test/session-host/**, test/runner/**, test/session-identity/**, docs/platform/agent-confinement/**, docs/platform/agent-mailbox/spec.md, docs/platform/run-supervisor/**, docs/platform/session-host/spec.md, plans/261118-0947-session-verb-for-agent-sessions/reports/phase-07.md | 2 | done |
| 7b | [Heads keep the host pid space and reach their peers](phase-07b-head-peer-messaging.md) | 7 | packages/run-supervisor/rust/**, src/runner/dispatch/confinement/**, src/session-host/**, core/skills/fgos-secretary/**, .agents/skills/**, .claude/skills/**, plugins/fgOS/skills/**, test/runner/**, test/session-host/**, docs/platform/agent-confinement/**, docs/platform/run-supervisor/**, plans/261118-0947-session-verb-for-agent-sessions/reports/phase-07b.md | 3 | done |
| 7c | [A host-side write door for a head's granted files](phase-07c-head-write-door.md) | 7b | packages/run-supervisor/rust/**, packages/run-supervisor/contracts/**, src/session-host/**, src/runner/dispatch/confinement/**, bin/fgos.mjs, src/cli/command-registry.mjs, packages/host-runtime/contracts/**, core/skills/fgos-secretary/**, .agents/skills/**, .claude/skills/**, plugins/fgOS/skills/**, test/runner/**, test/session-host/**, test/run-supervisor/**, docs/platform/agent-confinement/**, docs/platform/run-supervisor/**, docs/platform/session-host/spec.md | 4 | done |
| 8 | [A manual rotation says so and hands off real context](phase-08-manual-rotation-handoff.md) | 7c | bin/fgos.mjs, src/session-host/**, src/session-rotation/**, packages/session-host/**, apps/fgos/src/wiring/session_rotation_hook.rs, core/config-standard/sessionRotation.yaml, core/config-schema/sessionRotation.schema.yaml, test/session-host/**, test/session-rotation/**, docs/platform/session-host/spec.md, src/cli/command-registry.mjs, packages/host-runtime/contracts/**, apps/fgos/src/wiring/**, CHANGELOG.md | 5 | done |
| 9 | [Rotation measures against the model's real window](phase-09-rotation-window-per-model.md) | 8 | packages/session-host/rust/**, core/config-standard/sessionRotation.yaml, core/config-schema/sessionRotation.schema.yaml, test/session-rotation/**, plans/261118-0947-session-verb-for-agent-sessions/reports/phase-09.md | 6 | done |

**Waves.** 1: phases 1, 2 (done). 2: phases 3, 7 (done). 3: phase 7b. 4: phase 7c. 5: phase 8. 6: phases 4, 9. 7: phase 5. 8: phase 6.
Phase 7c (owner option B 2026-11-18: close the `docs/` hole phase 7 documented) follows 7b and precedes 8 (all share `src/session-host/**`).
Phase 7b (owner 21:5x: option A right after C, in this plan) follows 7 and precedes 8 (shares `src/session-host/**`).
Owner priority 2026-11-18 21:4x (via supervisor, "Miu sai là sai hết"): unblocking the secretary head comes first, so
phases 7 and 8 (added 21:4x for backlog rows found on Miu's rotations) run on the current `head` names before the
rename; phase 5 then renames what they touched. 7 runs beside 3 (disjoint: session-host/confinement/identity vs host
verb/registry). 8 follows 7 (shares `src/session-host/**`) and precedes 4 (shares `bin/fgos.mjs`). 9 follows 8 (shares
the session-host crate and rotation config) beside 4 (disjoint). 5 waits for 4 and 9. Phase 6 integrates all.

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

- 2026-11-18 owner approved the plan. `plan-contract-check` (run with the staged addon) passes every rule but one: footprint
  overlap with the still-`ready` secretary plan; the check does not count `blockedBy`. Status stays `draft` and turns
  `ready` when the secretary plan is `done` and the check prints ok.
- 2026-11-18 planner: scan report written; owner answered SV-1, SV-7; owner rule "new code in Rust" folded into SV-10 and leader rules; plan status `draft` until the owner approves and
  the two blocking plans land.
