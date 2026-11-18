# Phase 7: Gateway and S04

## Inputs
- `plan.md`, decisions QP-14 and QP-17.
- `apps/fgos-gateway/src/gateway.rs`: `run_verb_blocking` (:432) and the routes (:1270-1273). The work-ask handlers
  (:940) are the pattern.
- `apps/fgos-gateway/src/mcp.rs:300`, the tools `ask_work` and `answer_work`.
- `apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx` and its test, and `web/src/api/{client,types}.ts`.
- The S04 screen spec and `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml`.
- The gateway is outside the root workspace. Build and test it in its own directory.

## Footprint
See the phase table in `plan.md`, row 7.

## Steps
0. Re-grep. The session-verb plan changed the gateway's session routes.
1. Add `GET /v1/questions`, which shells `fgos questions --json`, and `POST /v1/questions/{id}/answer` with body
   `{option?, text?}`, which shells `fgos questions answer <id> …`. Both sit behind `require_token`. The gateway
   answers as the owner, because the gateway token is the owner's.
2. Add the MCP tools `list_questions` and `answer_question` over the same two calls.
3. Add the client methods and types in the web app. In `NeedsAnswer.tsx`, list the store questions with a "needs
   you" count, show each question by its `headline`, recommended option and `blocks` first, expanding to the five parts with the
   cost next to each option (QP-20), with a radio group that preselects the recommended option, and add an optional
   note. The `fgos ask` items stay listed beside them.
4. Update the API yaml and the S04 screen spec.
5. Tests:
   - the gateway route test answers a question and gets the refusal on a second answer;
   - `NeedsAnswer.test.tsx` shows both kinds of row and preselects the recommended option.

## Verify
- `cargo test` in `apps/fgos-gateway`
- the web test command in `apps/fgos-gateway/web` (the `NeedsAnswer` test)

Pass condition: both are green.

## Rollback
Revert the phase commit.
