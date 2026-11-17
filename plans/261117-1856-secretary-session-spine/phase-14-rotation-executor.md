# Phase 14: Rotation executor — two-step replacement

## Inputs (read first)
- SM-D2, SM-D5, SM-D13; `reports/spike-rotation.md` (phase 2); research report §4b option 1 (new+close).
- Phase 8 library (`src/session-rotation/{measure,decide,handoff-store}.mjs`, config `sessionRotation`).
- Phase 12 `startHeadSession` (accepts `beside`), Session Host client (`alive`, `retire`), Identity reads.
- The one detach door for a process that outlives its caller: `rg -n "detached: true" src --glob '*.mjs' | head`
  (e.g. the gateway start); reuse it, never a raw `nohup` or `&`.

## Files this phase may write
`src/session-rotation/rotate.mjs`, `test/session-rotation/rotate.test.mjs`, `docs/platform/session-host/spec.md`
(rotation section; also fold in the sections phases 9, 11, 12 reported).

## Steps
1. `rotateHeadSession({ persona, name, reason: soft|hard|manual, stopFacts })`: write the handoff (phase 8 store), then
   `startHeadSession({persona, name, beside: old})` for a successor in the same tab, then wait until the successor answers
   (Identity holds its registration and its first assistant reply names the resumed question; bounded wait from config),
   then `retire(old, close)` and move the `head:` role to the successor.
2. Failure at any step (start refused, no answer within the bound, Identity mismatch): retire the successor if it exists,
   leave the old session alive, write one incident line under the lineage folder, return the reason. Never SIGKILL.
3. A lock per lineage (`holder-lock`, one rotation at a time per persona-name); a second request while one runs is a no-op.
4. `requestRotation(...)`: the hook-side entry; writes the request and starts `rotateHeadSession` detached through the
   detach door, returning at once (the Stop hook must not wait).
5. Owning test `test/session-rotation/rotate.test.mjs` with fake host, fake Identity and fake clock: success retires the
   old only after the successor answered; a successor that never answers is retired and the old stays; a second request
   while one runs is ignored.
6. Spec: rotation section (thresholds, file layout, two-step rule, `/clear` fallback status from the spike).

## Verify
- `node --test test/session-rotation/*.test.mjs`.

## Rollback
`git revert` the phase commit.
