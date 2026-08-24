# CONTEXT.md — dispatch-config-cache (tsk-4sr)

## Feature boundary

`decideExecutorCli`'s `--work <id>` door (`src/runner/dispatch/cli.mjs`)
calls `resolveExecutorAndOverrides(cfg, executorId)` twice with the same
`cfg`/`executorId` — once at `:668` (only checking `.configured`) and
again, unconditionally, at `:695`. This item fixes exactly that: memoize
the result within one `decideExecutorCli` invocation so the second call
reuses the first's result instead of recomputing it.

Nothing else is in scope. The item originally proposed a broader
per-process, mtime-invalidated cache over `.fgos/config.json`/
`.fgos/runner.json` reads, motivated by fan-out overhead ("10 agents
~70-150ms cumulative"). Research (see `RESEARCH.md`) found that design
cannot deliver that motivating benefit and the item's own premise
contained three factual errors — see Locked decisions below.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | scope narrowed to intra-invocation memoization only -- dedupe the two resolveExecutorAndOverrides(cfg, executorId) calls in decideExecutorCli's --work door (src/runner/dispatch/cli.mjs:668, :695) within a single invocation. No cross-process/config-file caching in scope: confirmed structurally ineffective since every dispatch call (CLI subcommand or PreToolUse hook) runs in a fresh node process, so no in-memory cache survives across the fan-out calls the item's original motivation targeted. Also corrects the item's premise: only .fgos/config.json is ever read -- .fgos/runner.json does not exist (retired by tsk-5hv). |
| D2 | drop the 'D3 no-trust guarantee' citation as safety justification for this item -- not a real decision id in this repo (grep -rn no-trust docs/ src/ returns zero hits). If a security note is needed here, cite src/runner/dispatch/config.mjs:13-19's real TRUSTED-CONFIG NOTE comment by its actual content, never by a fabricated id. |

## Outstanding questions

None
