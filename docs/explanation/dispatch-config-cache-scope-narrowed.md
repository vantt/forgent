---
authoritative_for: proposed per-process cache for .fgos/config.json in the dispatch decision engine cannot deliver fan-out savings because every dispatch/execute/PreToolUse-hook call runs in a fresh node process; scope narrowed to intra-invocation memoization of the one real redundant resolveExecutorAndOverrides call
---

# A caching proposal whose motivating scenario the target architecture cannot support

`tsk-4sr` started as a proposal to cache `.fgos/config.json` reads and
memoize `resolveExecutorAndOverrides()` across the fgOS dispatch decision
engine (`src/runner/dispatch/cli.mjs`'s `decideExecutorCli`/
`executeExecutorCli`, `scripts/dispatch-decide-hook.mjs`), motivated by an
estimated ~7-15ms/call re-read cost that "adds up under fan-out (10 agents
~70-150ms cumulative)."

## What research confirmed and what it didn't

`docs/history/dispatch-config-cache/RESEARCH.md` confirmed the underlying
read-cost claim is real: `ensureRunnerConfigForDir`
(`src/runner/dispatch/config.mjs:245-274`) does an unconditional
`fs.readFileSync` with zero caching. But two other parts of the original
proposal didn't survive scrutiny:

1. **The "2-3 redundant calls" claim overstated the general case.** The
   redundant `resolveExecutorAndOverrides()` call was real only in
   `decideExecutorCli`'s `--work` door (`cli.mjs:668` then `:695`, same
   `cfg`/`executorId`). `executeExecutorCli`'s own equivalent bug had
   already been fixed — its own code comment at `cli.mjs:392-404`
   documents removing a second call there previously.

2. **The headline fan-out savings claim cannot work as designed.**
   `.claude/settings.json:24` registers
   `scripts/dispatch-decide-hook.mjs` as `node ".../dispatch-decide-hook.mjs"`
   — Claude Code spawns a fresh node process per Agent/Task-tool call, and
   every CLI door (`decide`/`execute` via `bin/fgos.mjs`) is likewise a
   fresh process per invocation. A per-process, module-level cache resets
   to empty on every one of these calls — it structurally cannot deliver
   savings across N separate Task-tool calls in a fan-out, only within a
   single process handling multiple calls internally (which, checked,
   mostly already happens correctly: `fanoutBatchExecutorCli` already
   reads config once at `cli.mjs:741`, before its per-candidate loop).

3. **The item's cited safety justification, "D3 no-trust guarantee,"
   doesn't exist.** `grep -rn "no-trust" docs/ src/` returns zero hits
   anywhere in the repo. Separately, per
   `.agents/skills/_shared/citation-format.md`'s locked rule (decision
   0017), a `D<n>` id may never be cited outside its own feature's
   `docs/history/<feature>/CONTEXT.md` — and this item had no `CONTEXT.md`
   of its own at the time (`docsRef` unset), so the citation was
   out-of-scope by convention even setting aside whether "D3" was real.

## The scope decision

Discovery came back unclear and parked the item at `awaiting-human` with
these findings. The human answer narrowed scope decisively:

- **Drop the cross-process/per-process config-read cache entirely** — it
  cannot deliver the fan-out savings the item claimed, given the
  fresh-process-per-call architecture confirmed above.
- **Keep only the one real, safe win**: memoize the two redundant
  `resolveExecutorAndOverrides(cfg, executorId)` calls inside
  `decideExecutorCli`'s `--work` door, scoped to that single invocation
  only — no cross-invocation persistence.
- **Correct a premise error**: only `.fgos/config.json` is ever read —
  `.fgos/runner.json` doesn't exist, retired by `tsk-5hv`
  (`src/config/shared-config-file.mjs`).
- **Drop the "D3 no-trust guarantee" citation** as a safety justification;
  if a real security note is needed, cite `config.mjs:13-19`'s actual
  "TRUSTED-CONFIG NOTE" comment by its real content, never by a fabricated
  id.

## What shipped

In `decideExecutorCli`'s `--work` door, the `resolveExecutorAndOverrides(cfg,
executorId)` result computed while resolving a work item's executor is now
bound to a local (`workResolved`/`workResolvedInputId`) and reused later in
the same function instead of being recomputed with the identical
`cfg`/`executorId`:

```js
const { executor, configured } = workResolved && workResolvedInputId === executorId
  ? workResolved
  : resolveExecutorAndOverrides(cfg, executorId);
```

No config-file caching, no cross-process memoization — a pure
intra-invocation dedup of one call site, exactly the scope the human
answer locked.

## A same-day data-loss note

The driver's own closing report on this item notes: "this exact stop was
first reached and reported earlier (~10:51 UTC) but the underlying
event-log entries for that return/report were lost — re-ran and
reconfirmed at 10:55 UTC." Recorded here as a live data point, not
resolved by this item — the same class of `events.jsonl` data-loss concern
several other retrospective items from this period reference independently
(e.g. `tsk-1vc`).
