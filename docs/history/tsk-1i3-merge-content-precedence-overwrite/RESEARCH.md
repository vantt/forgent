# tsk-1i3 — merge-content-precedence-overwrite — RESEARCH

## Round 1 (2026-08-21, discovery stage)

**Asked:** Item's stated premise is that `fgos`'s merge-into-main mechanism
only *warns* (never blocks) when a branch's `.fgos/*.jsonl` content would
overwrite main's live content with older/frozen data — evidence cited:
commit `e921fdb4` (2026-08-20 22:51:58 +0700, "Merge branch 'fgw/tsk-6al'")
overwrote 4 live `.fgos/*.jsonl` files on main, requiring manual restore
58s later (`165bc0cb`). Is this premise accurate — does the CLI's own
merge path (`src/runner/merge.mjs`) actually lack a content-precedence
check, or does one already exist and something else let the incident
through?

**Checked (repo, direct read + git forensics — this session, not
delegated, per fgos-researching's own mechanical-routing gate: the term
was already named in the item text, a direct repo search):**

1. `src/runner/merge.mjs:1-26` (module header) + `:1264-1330`
   (`mergeRunnerItem`'s post-stage check): the CLI's own merge path
   **already** does `git merge --no-commit --no-ff <branch>`, then checks
   `git diff --name-only --cached` for any path under `.fgos/`
   (`isFgosPath`, line 159) — non-empty → `git merge --abort` +
   `outcome: 'fgos-write-rejected'` (line ~1268-1277). This is a REFUSE,
   not a warn: the merge is aborted, main is left byte-for-byte unchanged
   (comment lines 16-26, "ADR0020"). Verify itself also runs on the staged,
   uncommitted tree (`runGoalCheck`, line ~1297-1305) before any commit —
   a red verify also aborts (`git merge --abort`), never commits.
2. `git log -S"fgos-write-rejected" -- src/runner/merge.mjs` (reverse):
   first introduced `2026-08-17 22:44:13 +0700` (commit `91fdceb6`) — over
   3 days BEFORE the incident. Confirmed via
   `git show e921fdb4^1:src/runner/merge.mjs | grep fgos-write-rejected`
   (exit 0): the guard was present in main's own tree at the exact commit
   (`94746624`) that became the incident merge's first parent. The guard
   was live and should have applied.
3. `git show --stat e921fdb4`: parents `94746624` (main, "ours") and
   `6e47455c` (fgw/tsk-6al tip, "theirs"). `git merge-base 94746624
   6e47455c` == `94746624` — main's pre-merge tip is an ancestor of the
   branch tip, i.e. this was a `--no-ff`-forced ancestor merge (matches
   `mergeRunnerItem`'s own `--no-ff` flag), not an ordinary divergent
   3-way merge.
4. `.fgos/events.jsonl` (main checkout, live) event history for `tsk-6al`
   around the incident window (all `ts` fields UTC; incident commit
   `22:51:58 +0700` = `15:51:58Z`):
   - `seq 22679` @ `15:33:06Z` (`22:33:06+07`): `work.move` ->
     `blocked`, `reason: merge-failed-unclassified`. `work.friction`
     (`seq 22680`) detail: `"git merge --no-commit --no-ff fgw/tsk-6al
     failed without a real conflict (exit 128): Your local changes to the
     following files would be overwritten by merge: .fgos/events.jsonl;
     merge aborted, main unchanged"` — this is git's own pre-merge dirty-
     working-tree refusal (not the `fgos-write-rejected` content check —
     a different, earlier fail-safe), and it worked correctly: **main
     unchanged**, matches the module's own contract.
   - No further `tsk-6al` event appears until `seq 22759` @ `17:11:43Z`
     (`2026-08-21 00:11:43+07`, next day), which moves `tsk-6al` from
     `blocked` back to `awaiting-approval` — still **before** any
     `mergedSha`/`delivered` event for it. The actual `delivered` event
     for `tsk-6al` (`seq 22793`) is `2026-08-21T01:45:16Z`
     (`08:45:16+07`), `mergedSha: 2f72ca22...` — **a completely different
     SHA from `e921fdb4`**, and 7 hours after the incident.
   - **No `fgos`-engine event of any kind (`work.move`, `decision`,
     `work.friction`) exists in the shared event log for the window
     `15:33:07Z`–`16:50:47Z`, which contains the incident commit
     (`15:51:58Z`).** The incident merge commit produced zero footprint
     in `.fgos/events.jsonl`.

**Found — premise correction (contradicts the item's own stated
mechanism):** `mergeRunnerItem`'s content-precedence guard already
existed, was live in main's tree at the time, and is a hard refuse (git
merge --abort), not a warn. The blocked-merge attempt at `22:33+07`
(`fgos approve`, real, logged) was correctly aborted with main untouched.
The incident commit `e921fdb4` at `22:51+07` — 18 minutes later — left
**no corresponding engine event at all**, strongly indicating it did not
go through `fgos approve`/`mergeRunnerItem` — i.e. a manual `git merge
fgw/tsk-6al` (or equivalent) was run directly against the shared main
checkout, bypassing the CLI entirely, most plausibly as a hand attempt to
unblock the `22:33` failure. A raw manual merge bypasses every guard this
module has, by construction — no in-`merge.mjs` content-precedence check
(existing or new) can close a gap that isn't in `merge.mjs`'s call path
at all.

**Still open (genuinely unclear, not resolvable from evidence alone):**
who/what ran the `e921fdb4` merge and by what means (interactive `git`
command, a different script, an out-of-process agent — `tsk-43z`, a
similar-shaped dispatch-cwd bypass, is documented for a different item the
same day) is not recoverable from git/event-log evidence alone; and
whether the item's scope should be re-aimed at "prevent/detect a raw git
merge run directly on the shared main checkout, outside `fgos approve`"
instead of "harden `mergeRunnerItem`'s own content check" is a real scope
decision, not a discovery-stage verdict this skill is allowed to make
silently.

**Verdict for this round: unclear.** Evidence contradicts the item's own
premise (guard already refuses, not warns) and points to a different root
mechanism (CLI bypass) than the one the item's stated scope targets
(in-CLI content-precedence check). Routing to `exploring` for a person to
confirm/re-aim scope before any plan is written.
