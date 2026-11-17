# Phase 15: Head verb binding — start and rotate

Owner answer 2026-11-17: the verb is **`fgos head`** (a new noun; the existing `fgos session` worktree verb is untouched).
Status `draft` until the ready plans `261117-1553` and `261117-1524` are `done` (shared command registry, manifest,
`bin/fgos.mjs`, `test/cli/**`).

## Inputs (read first)
- Existing `fgos session` verb (left as is; read only to avoid clashing names and flags): `apps/fgos/src/wiring/session.rs`,
  `src/cli/command-registry.mjs:2195`, `apps/fgos/src/routing.rs:90`.
- `startHeadSession` (phase 12), `rotateHeadSession` (phase 14). A new verb needs its spec entry before code: step 0 writes it into `docs/platform/session-host/spec.md`.

## Files this phase may write
`src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-manifest.json`, `packages/host-runtime/contracts/command-routes.json`,
`bin/fgos.mjs`, `test/cli/head-verb.test.mjs`, `docs/platform/session-host/spec.md` (verb section).

## Steps
0. Write the verb section of `docs/platform/session-host/spec.md` (synopsis, subcommands, refusals, exit codes) first.
1. Registry entry with subcommands `start <persona> --name <name>` and `rotate <persona> --name <name> [--now]`
   (`--now` = manual `/handoff`), examples `fgos head start secretary --name miu`, `fgos head start shaper --name <slug>`.
2. `bin/fgos.mjs` arm calling the two use cases; exit codes per the host's conventions; `--json` result.
3. Regenerate command manifest and routes. Fix the stale DISCUSSION.md location comment at `bin/fgos.mjs:1816` (moved by phase 4).
   A Node verb needs no `apps/fgos` change; if the host refuses the verb without one, stop and report `NEEDS_CONTEXT`.
4. One CLI wiring proof `test/cli/head-verb.test.mjs` (flags, exit codes, refusal of a missing `--name`); no use-case cases.

## Verify
- `node --test test/cli/head-verb.test.mjs` and the manifest freshness test.
- `npm run fgos:dev -- head start --help` is served by the host.

## Rollback
`git revert` the phase commit; regenerate manifest and routes.
