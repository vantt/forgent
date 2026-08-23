# RESEARCH.md — tsk-3kl (wire Step B.5 dispatch-log call into executor-dispatch-fallback.md)

## Round 1 — 2026-08-18

**Asked:** verify the four technical claims behind tsk-3kl before judging
discovery clear/unclear — is the gap real, and is everything needed to fix
it already known (no further research required)?

**Checked:**

1. **Fragment structure / missing logging step.**
   `.agents/skills/_shared/executor-dispatch-fallback.md:81-121` — Step B
   ("execute (out-of-process only)") runs `dispatch.mjs execute
   <EXECUTOR_ID> --prompt ... 2>&1` via Monitor, reads back the final JSON
   line (`{"mechanism":"out-of-process", status, stdout, stderr, tier,
   model, provider, command}`), prints the announce line, and reads
   `stdout`. Nothing after that calls `dispatch.mjs log`. Confirmed: no
   B.5 step exists today.

2. **`logExecutorDispatch` / CLI `log` verb.**
   `src/runner/dispatch.mjs:1786` — `logExecutorDispatch(fgosDir, { id,
   executorId, provider, command, model })` appends an `executor.dispatch`
   event to `.fgos/events.jsonl` (`baseCommit`/`headRef` always `null` for
   this in-session entry point, by design per its own docblock at
   `1772-1785`). Wired to a CLI subcommand at `dispatch.mjs:2179-2197`:

   ```
   node src/runner/dispatch.mjs log <executorId> --id <workItemId> \
     --provider <p> --command <c> [--model <m>]
   ```

   All four required fields (`executorId`, `provider`, `command`, plus
   optional `model`) are already present verbatim in Step B's own final
   JSON result — nothing new needs to be resolved to fill this call in.
   `id` is the currently claimed item id, already known to any consuming
   skill's own reasoning step.

3. **Which skills cite the fragment.** `grep -rl
   "executor-dispatch-fallback" .agents/skills/` returns exactly:
   `fgos-coding-validating`, `fgos-fanout`, `fgos-coding-planning`,
   `fgos-coding-exploring`, `fgos-coding-implement`, `fgos-researching`
   (plus the fragment file itself) — matches the item's claim exactly.
   The fragment's own "Precedent" section (`executor-dispatch-
   fallback.md:268-289`) names the same six skills, and states none of
   them currently call `dispatch.mjs log` — confirmed by a second `grep`
   for `dispatch.mjs log` across the same six `SKILL.md` files: zero
   hits. The gap is real, not theoretical: Step B is live (the item's own
   cited evidence, tsk-1up commit `ccdd71e4`, and `AGENTS.md`'s own
   top-level "Dispatch — routing work to a executor" section both
   corroborate Step A/B are exercised for real work), and nothing on that
   path persists the dispatch.

4. **`loop.mjs`'s own automatic-dispatch logging.**
   `src/runner/loop.mjs:834-836` calls `appendEvent(...,  { type:
   'executor.dispatch', ... })` directly (not through
   `logExecutorDispatch`, but the same event `type`/shape per
   `logExecutorDispatch`'s own docblock, D9/tsk-5td) for the async
   claim/dispatch cycle. Confirmed: only the automatic loop path logs
   today: the manual in-session Step A/B path does not.

**One discrepancy noted, not blocking:** the fragment's "Precedent"
section literally says "No live consumer of this fragment's own Steps A-C
remains today" — worded as if Step A/B is dormant. The item's own cited
evidence (tsk-1up, commit `ccdd71e4`) and `AGENTS.md`'s top-level dispatch
section both show Step A/B IS exercised for real out-of-process dispatch
today. This looks like stale prose in the fragment (written when the only
consumer was the since-retired `submit-assist-classify` skill, before the
six current citers existed) rather than a fact that changes this item's
scope — out of scope for tsk-3kl to correct; noted here in case a future
item wants to fix that sentence too.

**Real copies of the fragment (mirror discipline, per `test/skills/
fgos-mirror.test.mjs`'s own header comment):** `.agents/skills` is the
canonical source; `plugins/fgOS/skills/` is a hand-maintained,
byte-identical mirror (`.claude/skills/<name>/SKILL.md` is a GENERATED
thin wrapper now, tsk-1qi — it carries no `_shared/` fragment copy of its
own, confirmed: no `.claude/skills/_shared/` directory exists). Confirmed
`diff -q .agents/skills/_shared/executor-dispatch-fallback.md
plugins/fgOS/skills/_shared/executor-dispatch-fallback.md` — currently
identical (exit 0). Any edit to the fragment must land on BOTH copies.

**Real verify command found:** `node --test
test/skills/fgos-mirror.test.mjs` — the test that would have caught a
single-copy edit on `docs/history/executor-dispatch-fallback-live-
monitor/RESEARCH.md`'s own prior round (tsk-37ij hit exactly this gap
once, documented there as a lesson).

**Verdict:** `clear`. Premise confirmed accurate on all four claims, no
open question — the fix is a mechanical prose addition (a "Step B.5"
section, calling `dispatch.mjs log <EXECUTOR_ID> --id <id> --provider
<provider> --command <command> [--model <model>]` using Step B's own
already-returned JSON fields) applied identically to both real copies of
the fragment, verified by the existing mirror test.
