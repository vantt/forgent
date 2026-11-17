# Phase 18: Integration, live checks and full gate

Status `draft` until the ready plans `261117-1553` and `261117-1524` are `done` (shared CHANGELOG, census, run-supervisor spec).

## Inputs (read first)
- `plan.md` acceptance criteria 1-8; every phase report under `reports/`.
- AGENTS.md install gate (CHANGELOG `[Unreleased]`), memory rules: ask the owner before a full suite on the shared
  machine; never SIGKILL a gate; read run-tests ERROR lines and the fail count.

## Files this phase may write
`CHANGELOG.md`, `docs/reading-map.md`, `docs/platform/run-supervisor/spec.md`, `packages/git/contracts/mutation-census.v1.json`,
`plans/261117-1856-secretary-session-spine/reports/integration.md`.

## Steps
1. Merge the phase branches in wave order onto one integration branch; on conflict in a generated file (renders,
   command manifest/routes, census, `Cargo.lock`), regenerate on the merged tree, never hand-merge.
2. `CHANGELOG.md` `[Unreleased]`: head verb, `/handoff`, session rotation and its config keys, discussions moved to
   `docs/discussions/`, worker placement through the Session Host (no behaviour change for users), Terminal Control focus.
3. Apply the run-supervisor spec change phase 11 wrote into its report. Note in the report that `p-pgmxt7n7hx` and
   `p-r4u2ewexvn` are delivered, for the backlog owner to move.
4. `docs/reading-map.md`: the Session Host spec, the core shaper, the secretary skill.
5. Regenerate the census. Run the contract check through the activated release's YAML door (plain `node scripts/...`
   fails with `git-addon-unavailable` in a source checkout): copy `scripts/plan-contract-check.mjs` and
   `scripts/lib/is-main-module.mjs` into a scratch dir whose `src` links to `<releasePath>/libexec/legacy-node/src`
   (`releasePath` from `.fgos/installation/activation.json`), and run it from the main checkout with the plan's absolute
   path. Paste the output into the report.
6. Ask the owner for a full-suite slot, then `npm test` and `cargo test --workspace`; record both results with ERROR
   lines and fail counts.
6b. List every literal `fgos head` (`rg -n "fgos head" --glob '!plans/**'`) in the report as input for `p-g2iprtzptz`.
7. Live checks (precondition as in phase 12: the integration tree's host, not the activated release), recorded in the report: (a) `fgos head start secretary --name miu` opens a tab, persona typed visibly (visible means the same as a worker
   inline brief, including Claude Code's collapsed-paste chip that `confirm_submitted` handles),
   Identity lists `head:secretary-miu`; (b) with `sessionRotation.soft` set to 0.01 in a scratch project config, a turn
   at rest rotates Miu: successor answers and names the resumed question before the old pane closes; (c) kill the
   successor before it answers: the old session stays; (d) `/handoff` rotates on demand; (e) a marketing request is
   classified and shaped by the core shaper; (f) restore the config and retire the probe sessions.

## Verify
- Both suites green; the contract check prints `ok`; every acceptance criterion has its proof line in `reports/integration.md`.

## Rollback
Revert the integration merge set in reverse wave order; regenerate census, manifests and renders.
