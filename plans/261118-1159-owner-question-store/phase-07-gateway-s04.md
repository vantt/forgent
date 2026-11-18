# Phase 7: Gateway and S04

## Inputs
- `plan.md` QP-14, QP-16, QP-17 and QP-20.
- `apps/fgos-gateway/src/gateway.rs`:
  - `run_verb_blocking` (:427);
  - `Caller` (:441) and `require_token` (:481);
  - the routes (:1237-1268, `/work/{id}/answer` at :1242);
  - the work-ask handlers (:940).
- `apps/fgos-gateway/src/mcp.rs`, read only. No binding is added.
- `apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx` and its test, plus `web/src/api/{client,types}.ts`.
- The S04 screen spec and `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml`.
- The gateway sits outside the root workspace, so build and test it in its own directory.

## Footprint
See the phase table in `plan.md`, row 7.

## Steps
0. Re-grep the inputs. Session-verb phase 2 changed the gateway.
1. Add `GET /v1/questions`, which shells `fgos questions --json` and returns its store and `work` sections.
2. Add `POST /v1/questions/{id}/answer`, body `{option?, text?}`, shelling `fgos questions answer <id> …` with the
   gateway's existing `--source gateway:<caller>` (`gateway.rs:447,952`), the way its work routes do.
   - `fgos gateway start` spawns the gateway detached, so it is reparented away from any agent CLI. Its children
     therefore pass the ancestry owner rule (QP-16).
   - The verb accepts `--source gateway:<name>` only from a caller with no agent ancestor. Write a test for it.
   - In step 0, confirm the detach: `fgos gateway start` spawns through `spawn_detached`
     (`apps/fgos/src/wiring/gateway_control.rs:454`), confirmed at the re-check. If it no longer holds, stop with
     `NEEDS_CONTEXT`.
3. Do not add an MCP binding. Record that choice in the API yaml's description.
4. Change `NeedsAnswer.tsx` so it renders `/v1/questions` only, and drop its own `listWork` call.
   - Rows come in three groups: store questions, `fgos ask` items and gates.
   - Each store question shows its headline, recommended option and `blocks`. Expanding it shows the five parts, each
     option with its cost, a radio group with the recommended option preselected, and a note field.
   - `fgos ask` items keep the existing answer route.
   - Gates show their `fgos workflow answer` command.
   - The screen leads with a "needs you" count.
5. Update the API yaml and the S04 spec.
6. Tests:
   - a gateway test answers a question, records `via` as `gateway:<caller>`, and gets the refusal on a second answer;
   - `NeedsAnswer.test.tsx` shows all three groups with no duplicates and the recommended option preselected.

## Verify
- `cargo test` in `apps/fgos-gateway`
- the web test command in `apps/fgos-gateway/web` for `NeedsAnswer`

Pass condition: both are green.

## Rollback
Revert the phase commit.
