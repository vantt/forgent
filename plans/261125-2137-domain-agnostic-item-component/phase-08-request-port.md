# Phase 8: Request port

Status: draft. Decision: A6 (guarantees 3 and 5).

## Inputs
- Discussion §6 "Boards", six guarantees.
- The door (phase 5) and card versions (phase 6).

## Footprint
- `packages/portfolio/rust/**`, `apps/fgos/**`, `packages/portfolio/contracts/portfolio-requests.v1.json`
- `packages/host-runtime/contracts/command-manifest.json`

## Steps
1. Add the `portfolio-requests` contract at `packages/portfolio/contracts/portfolio-requests.v1.json`: identity, base version, idempotency key, the requested fact; answer accepted or refused with a reason code.
2. Turn an accepted request into a door fact; the door's own kind rules apply to the caller.
3. Refuse a stale base version (first write wins), a replayed key (answer the first result again), and an unknown caller.
4. Expose the port as `fgos portfolio request --json` and register it in the command manifest.
5. Write tests for each refusal and for one accepted request.

## Verify
`cargo test -p fgos-portfolio request_port` passes.

## Rollback
`git revert` the phase commit.
