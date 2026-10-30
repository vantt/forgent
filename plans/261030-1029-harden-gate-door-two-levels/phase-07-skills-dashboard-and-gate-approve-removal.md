# Phase 07: Skills ask through the door; dashboard shows pending questions; `gate-approve` goes

The skills stop self-enforcing in prose, the last writer of the self-declared approval record goes, and the dashboard shows the questions asked in chat. Runs alongside phase 08 (docs only).

## Context

- Skill gates today: `domains/coding/skills/fgos-coding-exploring/SKILL.md:131-139` and `references/gate-mechanics.md` (contextApprove), `domains/coding/skills/fgos-coding-validating/SKILL.md:160,243` and `references/gate-auto-approve-mechanics.md` (validateApprove): run `gate-check`, ask in chat, then `fgos gate-approve --actor human|bypass` and `fgos decision`. The routing gate contract is `core/skills/fgos-routing/SKILL.md:83,206-237`; task specs `domains/coding/task-specs/lock-decisions.md:13,20`, `validate-plan.md:22`; also `fgos-coding-planning/references/approach-and-shape.md:58`, `fgos-coding-exploring/references/lock-decisions-and-write-context.md:159`, `fgos-coding-discovering/SKILL.md:84,203`.
- `gate-approve`: verb `bin/fgos.mjs:2151-2175`, `recordGateApprove` and its sets `src/state/store.mjs:1631-1660`, fold `src/state/replay.mjs:675-700`, registry `src/cli/command-registry.mjs:914` and its entry, route `packages/host-runtime/contracts/command-routes.json:401-409`; Rust observation `packages/work-state/rust/src/work_source.rs:562-573` and the scorecard count `packages/observe/rust/src/scorecard.rs:407,425-426,474`.
- The dashboard cannot show a skill-gate question asked in chat (`apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx:9`, `TaskDetail.tsx:402,510-513`); `docs/specs/herdr-web-dashboard.md:53,71` unions the ask and gate-approve channels.

## Requirements

1. **Skill flow (both gates):** `fgos gate-check` (decide). `auto`: continue and print the one visible line (gate-bypass D3 kept); the door already recorded `gate.auto`, so the separate `fgos decision` line goes. `ask`: `fgos gate-ask` with the decision-question text, then `AskUserQuestion` carrying the `gate:<askId>` marker (Claude) or a pointer to the dashboard and a human terminal (Codex, agy). A plain-chat answer is not a grant: re-ask through a channel. The verify command is set with `fgos edit <id> --verify` before the advance. The guarded verb refuses when no grant exists, so the prose no longer asks the agent to self-enforce.
2. **Routing contract** (`fgos-routing`): one paragraph naming the three channels and the refusal names; the "agent must obey the result" prose goes.
3. **Delete `gate-approve`** end to end (verb, store function and sets, registry entry and the `actor` description, route). The replay fold of old `work.gate-approve` events goes too; old events stay in the log, unread (replay's `default:` branch at `src/state/replay.mjs:796` ignores unknown types; confirm at build) and the type stays registered in the Work stream contract so history remains readable by the Event Store.
4. **Observe:** the Rust observation and the scorecard count human interventions from `gate.granted` events with a human channel, read through `fgos-gate`'s projection, instead of `work.gate-approve` (the reader moves to the new log; the count keeps its meaning). Old `work.gate-approve` events are no longer counted; the scorecard notes the change in its output once.
5. **Dashboard:** `NeedsAnswer` lists `GET /v1/gates?pending=true` (phase 03) beside `awaiting-human` items; `TaskDetail` shows the item's gate history from `fgos show`'s `gate` field (phase 05) and approves through `POST /v1/gates/{askId}/answer`. The "no durable pending state" comments go.
6. Regenerate render surfaces with `npm run build:skills`.

## Files

- **Modify:** the skill and task-spec files listed in Context; `core/skills/fgos-routing/SKILL.md`; `src/cli/command-registry.mjs` (remove `gate-approve`, describe `gate-ask`, `gate-show`); `packages/work-state/rust/src/work_source.rs:5,562-573,669-687`; `packages/observe/rust/src/scorecard.rs:407-474,847,890`; `apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx`, `TaskDetail.tsx`; generated `.agents/skills/`, `plugins/fgOS/skills/`, `.claude/skills/` (by `npm run build:skills` only).
- **Delete:** `bin/fgos.mjs:2151-2175` (`case 'gate-approve'`); `src/state/store.mjs:1631-1660` (`GATE_APPROVE_GATES`, `GATE_APPROVE_ACTORS`, `recordGateApprove` and its doc comment); `src/state/replay.mjs:675-700` (fold case); the `gate-approve` route in `command-routes.json:401-409`; the `fgos decision` "auto-approved ..." steps in both gate reference files.

## Tests to retire, and the test that now owns the behaviour

| Retired | Now owned by |
|---|---|
| `test/cli/fgos-gate-approve.test.mjs` (whole file, 128 lines) | behaviour removed; approval recording is owned by `packages/gate/rust/tests/require.rs` and `channel.rs` |
| `recordGateApprove` fixture uses in `test/intake/plan.test.mjs` (pre-redesign `planApprove` items) | behaviour removed in phase 05 (no reader of `planApprove.verify`) |
| `gate-approve` rows in `test/cli/command-registry.test.mjs`, `test/rust-host/command-routes.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs`, `test/cli/fgos-decision-kind.test.mjs` | the same files, rows removed; no new case |
| `work_source.rs` test asserting the `work.gate-approved` observation (`:669-687`) and `scorecard.rs` intervention test (`:847-890`) | same files, rewritten to read `gate.granted` (one case each) |

## Steps

1. Skill and task-spec prose; routing contract; `npm run build:skills`.
2. Delete `gate-approve` (verb, store, fold, registry, route) and its tests.
3. Observe and scorecard reader onto the gate projection.
4. Dashboard screens.

## Validation

- `npm run build:skills` then `git diff --stat` shows only generated files changing with their sources.
- Focused Node via `fr.mjs`: `test/cli/command-registry.test.mjs`, `test/rust-host/command-routes.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs`, `test/cli/fgos-decision-kind.test.mjs`, `test/intake/plan.test.mjs`, the skill render test that owns `build:skills` output
- `cargo test -p fgos-work-state`, `cargo test -p fgos-observe`; web build and its tests in `apps/fgos-gateway/web`
- `rg -n "gate-approve|recordGateApprove|canAutoApprove" src bin core domains packages apps -g '!**/history/**'` returns only the Work stream contract type entry.
- Live: the exploring gate on a scratch item from Claude (hook grant) and from Codex (dashboard grant).

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| A running agent on an older skill render calls the removed `gate-approve` | M x L | Unknown verb error names `gate-ask`; installed releases carry their own skill renders, so only a mixed install hits it |
| Scorecard history drops old self-declared approvals | L x L | Stated in CHANGELOG; those records were self-declared and never decided anything |

## Rollback

Revert with drop B; the previous release's skills and verb return together.

## Net size (estimate)

Node: about -120 (verb, store, fold, registry). Skill and task-spec prose: about -150. Rust: about ±20 (observe reader moved). TS: about +60 (dashboard lists asks). Tests: about -170.
