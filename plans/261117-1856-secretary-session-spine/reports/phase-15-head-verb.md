# Phase 15: `fgos head start|rotate`

Status: DONE (live check done; `help-routes.test.mjs` needs a release build, run at landing).

## What changed
- Registry entry `head` (`start <persona> --name`, `rotate <persona> --name`) with a guide naming the exit codes; manifest and routes regenerated (`legacy-cli`, no Rust change). Arm `case 'head'` in `bin/fgos.mjs`: `start` calls `startHead`, `rotate` calls `rotateHead` with reason `manual`; the arm only maps errors to exit codes (malformed argument 4, refusal or not-started 2, `rotation-in-progress` 3). Stale DISCUSSION.md comment near `decision-index` now names `docs/discussions/canonical-decision-projection/DISCUSSION.md`.
- Session Host spec: section 8.7 (verb, exit table), 8.3 sentence, decision-history line. CHANGELOG line already added (phase 18 must not add a second).
- Proof: `test/cli/head-verb.test.mjs` (2 tests: malformed calls exit 4 naming the cause; a confined caller without a socket exits 2 for both subcommands). Fixtures updated by their generator: `test/rust-host/vectors/envelope/version.json`; `subcommand-flag-drift.test.mjs` lists `head`.

## Deviations
1. `rotate` calls `rotateHead`, not `requestRotation`: a confined head running the verb must go through its socket (same shape as `startHead`).
2. No `--now`: a CLI rotation is always reason `manual` (the use case requires a reason; `--now` would name the same thing). The phase file still names `--now`; the spec and help do not.
3. No `mutatesStore` on the entry: the verb writes no work store, and the declaration made the host refuse it in a linked worktree.
4. Out-of-footprint, approved: CHANGELOG.md, subcommand-flag-drift test, envelope vector file.

## Live (this machine, real herdr, gemini; planner persona stands in, no secretary persona yet)
- `head start planner --name p15live`: tab opened, `{already:false, role:head:planner-p15live}`; again: `{already:true, fronted:true}`.
- `head rotate planner --name p15live`: `{started:true,pid}`, successor `head-planner-p15live-2` opened beside it with `rotation.json`/handoff written. Both panes closed; both attempts have `closed.json`; no process or tab left.
- Observed, not from this phase: after both panes were closed the detached executor printed "unsettled top-level await" at `rotate.mjs:344` in `rotation.log`, removed `rotation.json` and wrote no `incidents.jsonl` line. Owner of phase 14 should check that an executor whose old and successor panes both vanish still records an incident.
