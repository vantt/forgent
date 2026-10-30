# Phase 02: Gate log on the Event Store, frames and `require`; Workflow consent moves onto it

The door gets its log and its enforcing operation, and its first real consumer is the guard that already has this shape: Workflow's `human-consent`. That consumer move is what this phase deletes (L10).

## Context

- Workflow consent today: `fgos workflow answer --approve` writes a round file `gate-answers/<step>.rounds/*.json` with `approved` and `subjectDigest` (`src/workflow/case-runtime.mjs:170-187`, `src/workflow/case-verbs.mjs:166-181`), then a `gate.answer` ledger event; `projectCase` turns it into a milestone with `consent: true` (`src/workflow/case-projection.mjs:109-117`), stale when the subject digest changed (`:158-163`); `case-admission.mjs:153-162` refuses a writing activity with `consent-missing`, `consent-stale` or `consent-subject-unknown`.
- Event Store rules: approvals are shared truth, so `project` scope (`docs/platform/event-store/spec.md:191`); an unregistered type is refused (`:193`); a consumer may own a `project:<name>` stream (`:158`). Mailbox is a Rust consumer with no Node cache (`packages/event-store/contracts/consumers.v1.json`).
- Workflow ledger stays JSONL (RUL-WF-24, `docs/specs/workflow.md:283`); this phase does not touch it beyond what the consent guard reads.
- Node callers of the door run inside Work's hot mutex in later phases, where no process spawn is allowed (`exec-under-hot-lock`, `src/holder-lock/hot-guard.mjs:35-39`), so Node reaches the door through the native addon, as `src/util/identity-mint.mjs:10` reaches Identity.

## Requirements

1. **Stream and types.** Consumer `gate` in `consumers.v1.json`, contract `packages/gate/contracts/event-streams.v1.json`, stream `project:gate`, types `gate.asked`, `gate.auto`, `gate.granted`, `gate.declined`, all `project` scope; `gate.granted` and `gate.declined` with `sealOnWrite: true` so they leave the machine at the next sync. The door is the only writer (no other package appends these types; a test reads the contract and greps for appends).
2. **Subject.** `{kind: context|plan|merge|workflow-step|park, ref: {work?, case?, step?}, facts: {writes[], capabilities[], deletes[], outsideReach[], sizeLines?}, digest?, hint?}`. `hint` is title or description text, shown to people only (used by `decide_v0` until phase 04).
3. **Frame.** A grant carries `frame: {paths[], capabilities[], riskClass, budget?}` (vocabulary of `core/skills/_shared/decision-question.md:17-21` and RUL-WF-12) and, for kind `merge`, `digest`. Coverage rule: a grant covers a subject when `subject.digest == grant.digest` (when both present), or when every written path matches the frame's paths, every capability is in the frame, and the subject's risk class is not above the frame's. Merge requires the digest (phase 06).
4. **Operations** (crate functions; native ops; addon marshals): `decide(subject)` (appends `gate.auto` on `auto`), `ask(subject, question, approveOption)` (appends `gate.asked`, returns `askId` minted by `fgos_identity::mint::random`), `grant(askId, answer, channelFacts)` (this phase wires the `policy` source and the CLI channel, below; hook and dashboard come in phase 03 and are refused until then with `channel-not-wired`), `require(subject)` -> `ok` or a refusal `consent-missing | consent-stale | consent-subject-unknown | grant-outside-frame`, `show(ref)` and `list(pending)` (the projection, display only).
5. **Projection.** Pure fold of `project:gate` read through the Event Store read port, rebuilt on demand (no stored cache in this phase; add one only if `require` p95 exceeds 20 ms on the dogfood store, measured).
6. **Verbs.** `fgos gate-ask`, `fgos gate-show` (native, `--json`). `gate-check` (phase 01) now calls `decide` and therefore records `gate.auto`.
7. **CLI channel.** `grant` from a CLI caller accepts the answer only when Identity says the calling session is not an agent session: no agent session key in the environment (`packages/identity/rust/src/session.rs:50`, `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID` and the rest of `resolve::ENV_ORDER`) and no agent CLI in the process ancestry (`resolve.rs:210` `ancestry_cli`). Otherwise it refuses with `agent-session-cannot-grant` and writes nothing. The grant records `channel: cli`, the session id and the machine. Identity exposes one crate function for this check (`is_agent_session(pid)`); IDENT reviews it. The same-user limit is Q3.
8. **Workflow consent onto the door.** `case-admission.mjs` `human-consent` calls `require({kind: 'workflow-step', ref: {case, step}, digest: currentDigest, facts})`; the three refusal names stay. `workflow answer --approve` calls `grant` through the CLI channel. The round file keeps question and answer text for the case runtime; it stops writing `approved`.

## Files

- **Create:** `packages/gate/rust/src/{log.rs, frame.rs, project.rs, ops.rs, channel.rs}` (`channel.rs` with the CLI check only), `packages/gate/rust/tests/{frame.rs, require.rs, cross_store.rs}`, `packages/gate/contracts/event-streams.v1.json`, gate op contracts; `packages/git/node-addon/src/gate.rs` (the whole Node surface: `decide`, `ask`, `grant`, `require`, `show`, and `riskOf(paths)` for the Iron Law, fixed now so phases 03 and 04 change only crate internals; `riskOf` has no Node caller until phase 04); `src/gate/door.mjs` (one thin Node adapter over the addon, the only Node importer of it).
- **Modify:** `packages/gate/rust/src/lib.rs`, `Cargo.toml`; `packages/identity/rust/src/lib.rs` and `resolve.rs` (export `is_agent_session`); `packages/event-store/contracts/consumers.v1.json`; `packages/git/node-addon/src/lib.rs`, `Cargo.toml`; `apps/fgos/src/main.rs` and projector for the two verbs; `packages/host-runtime/contracts/command-routes.json`, `packages/host-runtime/rust/src/catalog.rs`; `src/workflow/case-admission.mjs:153-162`; `src/workflow/case-projection.mjs:109-117,158-163` (consent milestone derivation removed; the milestone keeps `achieved` for input answers); `src/workflow/case-verbs.mjs:166-181`; `src/workflow/case-runtime.mjs:170-187`; `src/cli/command-registry.mjs` (two verbs); `docs/architecture-manifest.json` (`src/gate/door.mjs`).
- **Delete:** the `consent` flag and the digest-stale consent branch in `case-projection.mjs`; `approved` in the round record (`case-runtime.mjs:187`) and its read; the `subjectDigest` stamping in `case-verbs.mjs:181` moves into the grant.

## Tests to retire, and the test that now owns the behaviour

| Retired or rewritten | Now owned by |
|---|---|
| consent cases in `test/workflow/case-admission.test.mjs` (consent-missing, consent-stale, consent-subject-unknown) | `packages/gate/rust/tests/require.rs` owns the three refusals; `case-admission.test.mjs` keeps one wiring proof that the guard calls `require` and passes its refusal through |
| `test/workflow/stale-approval-reapproval.test.mjs` (113 lines, digest change asks again) | `packages/gate/rust/tests/frame.rs` (digest mismatch and outside-frame cases); the file keeps one end-to-end case through `workflow answer` |
| consent-milestone cases in the case-projection tests, if any (`rg -n consent test/workflow`) | `require.rs` |

New owning proofs, each because nothing proves it today: CLI channel refuses an agent session and accepts a plain one (`packages/gate/rust/tests/channel.rs`, process-tree fake through Identity's existing `ProcessTree` trait); cross-machine grant (`cross_store.rs`: two stores, grant on A, sync, `require` on B passes); frame coverage (`frame.rs`); single writer (contract grep test in `packages/gate/rust/tests/require.rs`).

## Steps

0. IDENT agrees the `is_agent_session` export; tell MAIL nothing changes for it.
1. Register the consumer and types; prove append, seal and read of `project:gate` with two stores (lead:ES reviews).
2. Frame, projection, `decide` (wrapping `decide_v0`), `ask`, `grant` (policy only), `require`, `show`, `list`.
3. Addon module and `src/gate/door.mjs`; Git/OPC reviews the addon change (owner decision Q1 on the combined addon, `docs/platform/git/spec.md:211`).
4. Move Workflow consent: admission calls `require`; answer calls `grant`; delete the projection's consent branch and the round's `approved`.
5. Verbs `gate-ask`, `gate-show`.

## Validation

- `cargo test -p fgos-gate`, `cargo test -p fgos-identity`, `cargo test -p fgos-event-store`, `cargo test -p fgos-node-addon`
- Focused Node via `fr.mjs`: `test/workflow/case-admission.test.mjs`, `test/workflow/stale-approval-reapproval.test.mjs`, `test/workflow/playbook-proposer.test.mjs`, `test/architecture.test.mjs`, `test/rust-host/command-routes.test.mjs`
- Manual: `npm run fgos:dev -- gate-ask ...` then `gate-show --json` shows the pending ask; `fgos events status` lists `project:gate`.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| A Workflow case approved under the old rounds format is refused after upgrade (no grant exists) | M x M | No fence (HARDEN owner decision 1: add no new fence). The refusal is `consent-missing`, toward asking; the owner-machine guide lists open cases (`fgos workflow status`) before activation so the owner re-approves each once |
| CLI channel check wrongly calls a human terminal an agent session (for example a terminal opened from inside an agent's tmux) | M x L | Refusal names the ancestor it found; the human uses the dashboard instead |
| Fold cost on every `require` | L x M | Measured; cache only if p95 > 20 ms |
| Addon change collides with Git lane work | M x M | Announce on the board before merge; Git/OPC reviews |

## Rollback

Revert with drop B. New stream events stay in the store and are ignored by the previous release (checked by the rollback rehearsal in plan.md "Landing").

## Net size (estimate)

Rust: about +730 (crate log, frame, projection, ops, CLI channel, addon module, Identity export). Node: about +40 adapter, -60 Workflow consent code, net -20. Tests: about +300 Rust, -120 Node. This phase grows the system; phases 05-07 pay for it (approval fields, `gate-approve` verb, skill self-enforcement prose).
