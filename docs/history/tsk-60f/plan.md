# tsk-60f — plan

Mode: **standard** (tier `standard`, risk `heavy` — heavy because it changes
a locked hard-gate contract: every dispatch must go through `decide`, enforced
by a new blocking hook). No lane re-derivation needed: `tier`/`risk` were
already set correctly on the item before this plan (confirmed at discovery,
no `fgos edit` needed).

This item has **no `CONTEXT.md`** — its 13 decisions (D1-D13) were locked
directly via `fgos decision` in the event log during the planning session
that produced `plans/reports/from-dispatch-enforcement-discussion-to-
autonomous-execution-260816-1340-sequential-implement-review-merge-prompt.md`,
never through a formal `fgos-coding-exploring` round (discovery verdict was
`clear`, skipping `exploring`). Every D-ID citation below refers to that
locked decision log (`fgos show tsk-60f`), not a `CONTEXT.md` file.

## Impact-analysis capability gate

`fgos tool query --capability impact-analysis --status present` → gitnexus
present. Posture: **full**. `impact()` MUST run before editing
`decideCapacityCli`/`decideCapacityDispatchMechanism`/`resolveCapacityCli`/
`executeCapacityCli`, per CLAUDE.md. Known false-negative on file-level
`EXECUTOR_ADAPTERS` (an `export const` object, not a function) — cross-check
its 2 call sites (`resolveExecutorCommand:1210`, `executeCapacityCli:1783`)
with `grep` regardless of what `impact()` reports for it.

## Approach

Single item, no split (D13 already drew the tsk-60f/tsk-45f boundary; nothing
further to divide). Six pieces, done in dependency order — later pieces read
signals earlier pieces add:

1. **`--needs-soul` on `decide`** (D2) — `decideCapacityCli` gains a
   `needsSoul` option. When `!capacityIdArg && !purpose && !workIdArg &&
   needsSoul`, short-circuit straight to
   `decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess,
   forceCliSpawn: false })` and return `{ mechanism }` with no `capacityId`
   (there is none — this is a bare Agent/Task call, not a named capacity).
   CLI: new `--needs-soul` boolean flag alongside existing `--for`/`--work`/
   `--has-live-task-access` in the `decide` branch (`dispatch.mjs:1946-1959`).
   D2 also names `--work`'s existing `hasExplicitCapacity === false` branch
   (`dispatch.mjs:1871-1875`) as "the same signal, already hardcoded" — this
   piece generalizes that inline `hasNativeMechanism: true` into the same
   needs-soul concept, but D2 does NOT ask to literally refactor `--work`'s
   branch to call through a shared helper; it only asks that no 4th door
   (`--subtask`) gets added. Read `--work`'s branch as already-compliant
   precedent, not a piece that itself needs editing.

2. **`configured: true|false` on `decide` output** (D3) — every returned
   shape (`{mechanism}`, `{mechanism, agentType}`, `{mechanism, capacityId}`,
   `{mechanism: 'unavailable'}`) gains `configured`. `false` exactly when the
   resolution found no registered capacity for the given name/purpose/work
   (i.e. today's silent fall-through to the global executor); `true`
   otherwise, including the existing `unavailable` (nothing registered, but
   that itself IS a configured, expected answer — D3 rejects throwing).
   Never throws.

3. **Retire `resolve`** (D4) — delete `resolveCapacityCli` (`dispatch.mjs:
   1634-1719` incl. its docblock) and the `subcommand === 'resolve'` CLI
   branch (`dispatch.mjs:1913-1928`), update the usage string
   (`dispatch.mjs:1981`) to drop `resolve`. Port the ~15 `resolve`-specific
   tests in `test/runner/dispatch.test.mjs` onto `execute` — keep coverage of
   `providerModel` via `modelForTier` (D9 tsk-5tm), `--tier`/`--model`
   override (tsk-2k1 D10), and gate-carries propagation; do not delete
   coverage, retarget it. Fix the 3 how-to docs D9 names precisely
   (`wire-a-skill-to-a-capacity-by-purpose-not-name.md`,
   `wire-a-skills-classify-step-through-an-agent-executor-capacity.md`,
   `configure-a-capacity-to-dispatch-via-a-named-agent.md`) — replace
   `resolve` calls with `decide` → `execute`, drop any "agent runs the
   resolved command itself via Bash" framing. Never touch
   `diagnose-a-blocked-return-from-an-unrelated-verify-failure.md` (D9 — it
   only narrates tsk-5l2-1 history).

4. **`AGENTS.md` `## Dispatch` section** (D7, corrected by D12) — replace the
   whole section verbatim with D7's text, substituting D12's replacement
   sentence for the `"in-process"` bullet. Copy exactly; no rephrasing, no
   added doc references beyond the one `_shared/capacity-dispatch-fallback.md`
   path D7 itself names.

5. **`_shared/capacity-dispatch-fallback.md` rewrite** (D8) — both mirrors
   (`.agents/skills/_shared/capacity-dispatch-fallback.md`,
   `plugins/fgOS/skills/_shared/capacity-dispatch-fallback.md`) get the exact
   Step A/B/C shape D8 specifies, byte-identical between the two paths
   (verify with `diff`, not eyeballing).

6. **`PreToolUse` hook enforcing decide on Agent/Task calls** (D1/D5) —
   new hook script (`scripts/dispatch-decide-hook.mjs`) registered under
   `.claude/settings.json`'s `hooks.PreToolUse` for matcher `Agent|Task`.
   Contract confirmed against a REAL working hook already installed on this
   machine (`~/.claude/hooks/scout-block.cjs`, verified live: it blocked one
   of this session's own `Bash` calls during planning) rather than assumed
   from memory: read stdin synchronously (`fs.readFileSync(0, 'utf-8')`),
   `JSON.parse` it, read `data.tool_name`/`data.tool_input`
   (fail-open — `process.exit(0)` — on empty/unparseable input or an
   unexpected `tool_name`, same as `scout-block.cjs`'s own fail-open
   branches); block by writing a message to stderr and `process.exit(2)`;
   allow by `process.exit(0)` with no stdout. On invocation: read
   `tool_input.subagent_type` (fallback to a generic label when absent),
   call `node src/runner/dispatch.mjs decide --for "<subagent_type>"
   --needs-soul --has-live-task-access` against the main checkout, and
   block (exit 2, stderr names `execute` as the way out) when `mechanism
   !== 'in-process'`; allow (exit 0) otherwise. A `decide` call that itself
   errors (e.g. lock-timeout) fails OPEN — same fail-open discipline
   `scout-block.cjs` uses for its own unexpected-error branch — never blocks
   every Agent/Task call in the repo because dispatch.mjs hiccuped once.
   Per AGENTS.md's install gate, this is a new infra dependency (a file that
   must exist wired into a config file), so it needs: (a) a new
   `registerCheck` entry in `src/setup/registrations.mjs` (sibling to
   `checkMainCheckoutHookWired`) verifying the hook is present in
   `.claude/settings.json`; (b) a merge step run from `fgos setup`
   (`bin/fgos.mjs`'s `case 'setup'`, alongside the existing `installGitHooks`
   call) that adds the hook entry fill-only — never overwrites the existing
   `SessionStart` entry already in `.claude/settings.json`. New small module
   `src/setup/claude-code-hooks.mjs` (parallel to `src/setup/git-hooks.mjs`:
   `installClaudeCodeHook`/`claudeCodeHookWired`, same fill-only contract).

## Risk map

| Piece | Risk | Proof point |
|---|---|---|
| 1-2 (`decide` signature) | medium — touches a function every other piece and every existing `decide` caller reads | `impact({target:"decideCapacityCli", direction:"upstream"})` before editing (posture: full); `npm test -- dispatch` green with existing `decide` tests unchanged in behavior |
| 3 (retire `resolve`) | medium — deletion, but impact already confirmed LOW/exact (D4: 0 production consumers) at decision time | re-run `impact({target:"resolveCapacityCli", direction:"upstream"})` immediately before deleting (D4's confirmation is from the discussion session, not this implementation session — re-verify, don't just cite); cross-check `EXECUTOR_ADAPTERS`-style false negatives with `grep -rn resolveCapacityCli` across `src/` `test/` `docs/` |
| 4-5 (docs) | low — no runtime behavior, but must be byte-exact | word-for-word diff against D7/D12/D8's quoted text; `diff` between the two fragment mirrors |
| 6 (hook) | high — a live blocking gate; a bug here blocks EVERY future Agent/Task call in this repo, including the one running this plan | prove with two REAL calls, not fixtures (per item's own `verify` field): one Agent call that should be allowed (in-process), one that resolves to a purpose with no in-process mechanism (out-of-process) and must be blocked — captured in the same session before `return` |

## Shape

No split. `plan.md` alone; six commits, one per piece above, on `fgw/tsk-60f`.

## Outstanding questions

None
