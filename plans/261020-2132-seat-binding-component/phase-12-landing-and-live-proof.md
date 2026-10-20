# Phase 12: landing (stop-everything) and live proof

Owner: the big lead (`forgentx-95`) on the owner's machine. Size 0.5d plus run time. After phase 11 merges, the big lead's independent full `npm test` on the track is green, and the pre-wave phase is **active** on every workspace and both machines [RT-15]. Owner picks the hour (board rule).

## Context

- Spec `docs/specs/seat-binding.md` §9 steps 1, 3, 4, 6 [RT-16b]; board "Luật chung" (stop-everything landings one at a time on forgentX, mdview, mcp-skill-hub); memory: global config changes wait for every activation; one cargo target per checkout; ff-only merge inside the main checkout.
- [RT-15] If GIT 07 (Land/Sync verbs) has landed by then, steps 5 and 8 use those verbs instead of raw git; otherwise raw git as written.

## Landing recipe

1. **Pre-checks.** The pre-wave release (forward record fence + dev-door fix) is active on forgentX, mdview, mcp-skill-hub and the second machine (`fgos doctor` `active-release-matches-checkout` and the release id on each).
2. **Final sync** [RT-15]. Merge main into the track; re-run the conversion drift check; full `npm test`; the criterion-1 grep from plan.md returns only the listed exclusions. Only then continue.
3. **Freeze.** Announce on the board; no new runs on any workspace.
4. **Drain, per workspace** [RT-4]: from each workspace root, `npm --prefix <track-worktree> run fgos:dev -- doctor </dev/null` (JSON by default) and read `seat-binding-drain`. Live records finish on the old release; dead ones are settled with the verb the row names (`fgos run --resume <unit>` or `fgos doctor --fix`). A record with no settling path stops the landing (reversal trigger).
5. **Live fence check** [RT-3]. On copies of all three workspaces' configs converted by the track's setup, run the **currently activated** (old) `fgos doctor </dev/null` with the real HOME: it must fail on config load, never bind. Record the bytes the old fill-missing writer added (only default keys, per the 09 test).
6. **Merge** the track into main inside the main checkout (`git merge --ff-only` or a merge commit; never `update-ref` from another worktree). Main now carries the converted forgentX `.fgos/config.json`; the old activation refuses it until step 7.
7. **Release first.** Build, stage, activate on forgentX; `fgos setup </dev/null` (heals anything the old release wrote, else a no-op); `fgos doctor </dev/null`: `seat-binding-route`, `seat-binding-config`, `seat-binding-dry-bind` (only the expected info lines), `active-release-matches-checkout` green.
8. **mdview, then mcp-skill-hub**: activate the new release **first**, then `fgos setup </dev/null` (backup + diff saved in the landing report), `fgos doctor </dev/null` green with the expected info lines [RT-16g], `fgos dispatch explain --for <their main capabilities> </dev/null` reviewed.
9. **Second machine** (`~/projects/forgent`) [RT-2]: pull main and activate **as one step** (no plain `fgos` run in between), then `fgos setup`, doctor; its agent records the result on its board row.
10. **Global `~/.fgos/config.json`**: not edited. Its `rigorToTier` stays in the file and is dropped at load by the sanitizer [RT-1]; its bare-verb entries `advise`, `execute`, `review` stay as exact keys.
11. Unfreeze; update the SEAT and MP-B1 rows (MP-B1 phase 06 unblocked); landing report via `fgos convention path --kind report --type landing --slug seat-binding-stop-everything --json </dev/null`.

## Live proof (after step 8, owner's machine)

- **`architecture-advisory`**: one real run on a small subject; every seat's explain line and run evidence match spec §10.2 (tier, `tierSource`, recommendation, `maxTier`, executor/model, independence); `system` at frontier with `architecture:shape.maxTier = frontier`; reviewer/red-team hard-independent of the critique producer.
- **Debate**: one `group-cognition` run reaching `dialectical-critique`; §10.3: sides spread, judge independent of both, rebuttal keeps executor + model + effort.
- Record unit run ids, explain output and refusals. A herdr launch flake (`p-d2dc4f2e`) is rerun; a refusal or a seat bound for a reason not in its explain line stops the rollout.

## Rollback

Per workspace, together: activate the prior release **and** restore the setup backup (`.fgos/config.json.pre-seat-binding-<ts>`). forgentX: `git revert -m 1 <landing merge>` on main, then activate the prior release. Records written by the new release carry `seatSchema`; the prior release (which includes the pre-wave fence) refuses to resume them with `record-from-newer-release` instead of misreading them, so they must settle first or be abandoned; no drain of new-release records is needed to re-activate. The global file needs nothing.

## After landing (out of scope here)

Model-config diff (MP-B1 phase 06 / SEAT step 7): new model ids, `mini` cells, empty flagship/frontier for deepseek and glm, removing the `code:review`/`code:debug` pins, effort vocabulary widening. Shown to the owner for approval.
