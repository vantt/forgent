# Phase 12: landing (stop-everything) and live proof

Owner: the big lead (`forgentx-95`) on the owner's machine. Size 0.5d plus run time. After phase 11 merges and the big lead's independent full `npm test` on the track is green. Owner picks the hour (board rule).

## Context

- Spec §8 steps 1, 3, 4, 6; board "Luật chung" (stop-everything landings run one at a time, on forgentX, mdview, mcp-skill-hub); memory: global config changes wait for every activation; one cargo target per checkout; ff-only merge inside the main checkout.

## Landing recipe

1. **Freeze.** Announce on the board; no new runs on any workspace.
2. **Drain, per workspace** (forgentX, mdview, mcp-skill-hub): run the new drain row with the track code against that workspace, e.g. from the workspace root `npm --prefix <track-worktree> run fgos:dev -- doctor </dev/null` (JSON by default) and read the `seat-binding-drain` row (`fgos:dev` keeps the caller cwd via `INIT_CWD`). Wait or settle until empty. Old-release runs settle on the old release.
3. **Live fence check.** In a scratch copy of forgentX's converted config, run the **currently activated** (old) `fgos doctor </dev/null`: it must fail on config load, never bind. Record the output.
4. **Merge** the track into main inside the main checkout (`git merge --ff-only` or a merge commit; never `update-ref` from another worktree). Main now carries the converted forgentX `.fgos/config.json`; the old activation refuses it (fail closed) until step 5.
5. **Release first.** Build, stage and activate the release from main on forgentX (the repo's release procedure); `fgos doctor </dev/null` shows `seat-binding-route` green, `seat-binding-config` green (already converted), `seat-binding-dry-bind` green, `active-release-matches-checkout` green.
6. **mdview, then mcp-skill-hub**: activate the new release there first; only then `fgos setup </dev/null` (backup + printed diff, saved into the landing report); `fgos doctor </dev/null` green; `fgos dispatch explain --for <their main capabilities> </dev/null` reviewed.
7. **Second machine** (`~/projects/forgent`): pull main, build/stage/activate in the same sitting, `fgos setup`, doctor; its agent records the result on its board row. Until then that machine's old release refuses the pulled config (fail closed).
8. **Global `~/.fgos/config.json`**: untouched (P4).
9. Unfreeze; update the SEAT lane row and the MP-B1 row (phase 06 unblocked); landing report via `fgos convention path --kind report --type landing --slug seat-binding-stop-everything --json </dev/null`.

## Live proof (after step 6, owner's machine)

- **`architecture-advisory`**: one real run on a small subject. Check every seat's explain line and run evidence against spec §9.2 (tier, `tierSource`, workflow recommendation, `maxTier`, executor/model, independence); `system` seat at frontier with `architecture:shape.maxTier = frontier`; reviewer/red-team hard-independent of the critique producer.
- **Debate**: one `group-cognition` run reaching `dialectical-critique`. Check §9.3: sides spread, judge hard-independent of both, rebuttal keeps executor + model + effort.
- Record unit run ids, explain output and any refusal in the landing report. A herdr launch flake (backlog `p-d2dc4f2e`) is rerun, not counted against Seat Binding; a refusal or a seat bound for a reason not in its explain line stops the rollout (plan reversal trigger).

## Rollback

Per workspace, together: activate the prior release **and** restore the `fgos setup` backup (`.fgos/config.json.pre-seat-binding-<ts>`). forgentX: `git revert -m 1 <landing merge>` on main restores its committed config, then activate the prior release. In-flight units started on the new release carry `seatSchema` and are refused by the old release (they must settle or be abandoned first; the drain row lists them).

## After landing (out of scope here)

The model-config diff (MP-B1 phase 06 / SEAT step 7): new model ids, `mini` cells, empty flagship/frontier for deepseek and glm, removing the `code:review`/`code:debug` pins, effort vocabulary widening. Shown to the owner as a diff for approval.
