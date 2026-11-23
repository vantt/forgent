# Phase 1: re-applied on main, reviewed, land blocked by land-target-ahead

Date: 2026-11-23, lead `head:lead-forgent-261123-0726-contra-e554b`.

## What ran

1. The unread land ticket `c-64694-1795400008286` (branch `contract-check-in-confined-heads/p01`, tip bb720938a) had
   failed `runner-gone`; main did not contain the branch.
2. Re-land `c-1416-1795405229425` refused `land-conflict-aborted` on `scripts/lib/git-addon-stage.mjs`: main commit
   7c1ae9c09 added `ensureOrtStatic(cwd)` to the cargo env after the branch was cut.
3. Rebasing was impossible from the head (`.git` is read-only in confinement). `fgos run ... --sync main` reached the
   runner without `--sync` (the ticket argv drops it; `unit.json` has no `syncBase`), and `fgos run --sync main
   --writes ...` and `fgos run --unit <file>` both refuse `bad-args: run takes one prompt`. Defect in the head's run
   client, outside this plan's footprint; reported to the supervisor.
4. Workaround inside the footprint: a fresh worktree from main
   (`/home/vantt/projects/forgent-worktrees/261123-0726-contract-check-in-confined-heads-p01b`, branch
   `contract-check-in-confined-heads/p01b`) and a unit that re-applied the reviewed diff `854dc523d..bb720938a`
   (commit 91d819cf9). The changed lines equal the reviewed diff exactly, plus main's import and spread.
5. Code review (subagent) of `main...p01b`: re-application faithful, door correct, one blocking finding. In the new
   test's stale fixture, `ensureOrtStatic` fails before cargo with a raw "Command failed" error, so the named
   stale-addon error never fires (also true for a confined head on a linked worktree with an empty `target/`).
6. Fix unit 3f811b9fe: the leaf marks an ort-static failure (`err.step = 'ort-static'`), `isTargetUnwritable` accepts
   that marker (the write probe still has to confirm); the owning test seeds a verified ort cache so the stale case
   still reaches the cargo stub, and adds a no-cache sub-case asserting the named error. Lead review found that
   sub-case would download the 120 MB archive before failing; fix unit 3a9ab48bc makes it fail offline (a directory at
   the archive path). Branch tip: 3a9ab48bc.

## Verification

- Units could not run node ("This command requires approval" in the worker sandbox), and this confined head cannot
  stage an addon for the worktree payload (`target/` read-only), so the phase tests were not run by hand. A
  `node --test` run here with the main checkout's staged addon failed only on loading that addon (`git-addon-not-shipped`,
  payload mismatch) and on the then-unfixed ort-static path.
- The land door runs `--test test/distribution/native-addon.test.mjs --test test/architecture.test.mjs` and the
  configured gates before it lands, so the land itself is the proof.

## Land block

`fgos land contract-check-in-confined-heads/p01b` refused twice `land-target-ahead`: local `main` at 369906c4e
("docs(plan): park component-authority-doors phase 1 ...", 10:46) is not on the remote tip 4c0524b64. That commit
belongs to the component-authority-doors lead; this lead may not push or reset it. Raised to the supervisor.

## Follow-ups (not this plan)

- The head's `fgos run` client drops `--sync` and refuses `--unit` and the sync-only form.
- Unit workers are denied node commands, so units cannot verify their own work.
- The old worktree `.../261123-0726-contract-check-in-confined-heads-p01` (branch `contract-check-in-confined-heads/p01`) is superseded by p01b.

## Next

On resume: `fgos land contract-check-in-confined-heads/p01b --test test/distribution/native-addon.test.mjs,test/architecture.test.mjs`
once main is pushed; then set phase 1 `done` and run phase 2.
