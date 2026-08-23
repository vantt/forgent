# tsk-62d — CONTEXT.md

## Feature boundary

Give `judgeDiscovery` (`src/intake/discovery.mjs`) and `judgeDecompose`
(`src/intake/plan.mjs`) — the two nested-`claude -p` real-model judges
gating stage `clarify`/`decompose` — real autonomous scout capability
(grep/read the repo for grounding evidence) that they run BEFORE ever
parking an item in `awaiting-human`. Only fall through to `fgos-coding-exploring`'s
human conversation when the item is still unclear after that scout attempt.
Boundary excludes: changing what the judges are allowed to decide, changing
the picker/dispatch selection loop, changing worker (`spawnWorker`)
permissions, and building a reusable Skill-tool artifact (ruled out, D3).

Sibling items (same problem area, filed separately, not hard dependencies):
`tsk-4xr` (fgos-coding-exploring re-scout mid-conversation — cheaper, SKILL.md-only
fix) and `tsk-3go` (discover-loop skill — shares a per-run cost concern with
this item, see D5).

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | Purpose confirmed: judges gain scout capability to gather grounding evidence themselves before parking to `awaiting-human`; falls to human conversation only when still unclear after scout. |
| D2 | Permission mechanism: **Option A — role-scoped executor override**. Add a `role`-keyed override (e.g. `cfg.executors.judge`) parallel to the existing `cfg.executors[tier]` per-tier override (P41, `dispatch.mjs:404-411`), carrying its own `allowedTools` (e.g. adds `Bash(rg:*)` to the existing `Bash(git add:*),Bash(git commit:*)`). Rejected: hard-coding args directly in `judge-executor.mjs` (Option B) — breaks the "template in config, not code" precedent (RUL44) and would require code changes to tune/disable scout instead of config. `resolveExecutorCommand` gains a `role` dimension alongside its existing `tier` dimension; `DEFAULT_RUNNER_CONFIG.executor` (used by `spawnWorker`) stays untouched. |
| D3 | No dedicated Claude Code Skill for scout. Reason: RUL6 (`docs/specs/runner.md:853`) — headless `claude -p` defends via minimal explicit `--allowedTools` + instructions, never a sandbox; the Skill tool is a distinct, broader surface than a scoped `Bash(rg:*)` grant, and would violate the "TỐI THIỂU" (minimum) discipline. Also wrong execution layer: `judgeDiscovery`/`judgeDecompose` spawn as a nested `claude -p` **subprocess**, which does not inherit the parent session's interactive skill catalog — a Skill artifact would not even be reachable from inside that subprocess. `fgos-coding-exploring`'s own step-1 scout (relevant to sibling `tsk-4xr`) needs no such mechanism either — it already runs inside a live interactive session with Grep/Bash on hand. |
| D4 | DRY for the "how to run one scout pass" wording, shared across `fgos-coding-exploring` SKILL.md step 1, `judgeDiscovery`'s prompt, and `judgeDecompose`'s prompt: **a committed prompt-template file**, following the existing pattern at `src/runner/prompt-templates/*.txt` (RUL44 — substitution only, no logic in the template). Not a Skill artifact (see D3). |
| D5 | Confirmed non-decision / settled question: RUL42 (`docs/specs/runner.md:893`) does not block this feature. RUL42 locks the **picker/dispatch selection loop** mechanical forever; `judgeDiscovery`/`judgeDecompose` are the "bộ não thông minh ở giai đoạn làm-rõ/chia-việc" — RUL42's own named door (1) for intelligence to enter the system. The judges still only write conclusions through the standard doors (`addDiscovery`/`addDecision`/`moveStage`) exactly as before; adding scout capability changes their input, not their write surface or the picker. |

## Pinned terms

- **Scout (in this item's scope)** — one bounded, tool-using pass (grep/read,
  not open-ended browsing) a judge runs against the checked-out repo to
  gather grounding evidence before rendering its clear/unclear verdict.
  Mirrors the shape `fgos-coding-exploring` step 1 already uses ("one keyword
  pass"), not a new investigative capability.
- **Role-scoped executor override** — a `cfg.executors.<role>` config key
  (role = `judge` here) read by `resolveExecutorCommand` ahead of the
  existing `cfg.executor` default, parallel to (not replacing) the existing
  `cfg.executors[tier]` per-tier override from P41.

## Scout evidence (paths cited)

- `src/runner/dispatch.mjs:207-220` — `DEFAULT_RUNNER_CONFIG.executor.args`
  carries the single `allowedTools` string (`Bash(git add:*),Bash(git
  commit:*)`) used today.
- `src/runner/dispatch.mjs:404-411` — `resolveExecutorConfig(cfg, tier)`:
  existing per-tier override precedent (`cfg.executors[tier]` before
  `cfg.executor`), the pattern D2 extends with a `role` dimension.
- `src/runner/dispatch.mjs:423-438` — `resolveExecutorCommand`: confirmed
  (GitNexus call-graph) shared by BOTH `spawnWorker` (real worker dispatch)
  and `judge-executor.mjs`'s `spawnAttempt` — today's `allowedTools` is one
  string serving both call sites, which is why D2 is a config change, not a
  flip of an existing flag.
- `src/intake/judge-executor.mjs` — `runJudgeExecutor`/`spawnAttempt`:
  `MAX_JUDGE_ATTEMPTS = 3`, `JUDGE_STRICT_JSON_SUFFIX`, `stripCodeFence`
  already handle the nested-session prose-vs-JSON failure mode (str68).
  `spawnSync` here passes no `cwd` — runs at the outer fgOS process's cwd
  (repo root, since clarify/decompose run before an item has its own
  worktree), so a scoped `rg` scout naturally scans the right tree with no
  extra cwd-selection logic needed.
- `src/intake/discovery.mjs:19-23` (fail-safe header) and `:230-286`
  (`resolveDiscovery`) — judges never throw, any failure folds to "not
  clear"; and the **existing** `docsRef` → non-empty `CONTEXT.md` trust
  signal (tsk-ozl D1-D3, shipped 2026-07-31) that skips `judgeDiscovery`
  entirely once a human has already locked decisions here — this is the
  same doc this CONTEXT.md is an instance of.
- `src/intake/plan.mjs:43-57` (`readLockedContext`) and `:377-379` —
  `judgeDecompose` reads the same `CONTEXT.md`/`plan.md` as grounding
  context passed into its own prompt (no auto-skip like discovery, but
  avoids re-deriving blind).
- `docs/specs/runner.md:853` (RUL6) and `:893` (RUL42) — cited above under
  D3/D5.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → 1
provider (`gitnexus`, kind `mcp`, status `present`). Posture: **full** — the
GitNexus "Always Do"/"Never Do" rules in `CLAUDE.md` apply as written for
whatever code change implements D2/D4 (run `impact()` on
`resolveExecutorCommand`/`resolveExecutorConfig` before editing, `impact()`
on any prompt-template consumer before editing).

## Outstanding questions deferred to planning

- Exact tool list for the judge's scoped `allowedTools` beyond `Bash(rg:*)`
  — e.g. whether a `Read`-shaped tool is also needed, or `rg` alone covers
  the scout's needs. Not decided here — implementation detail.
- Exact config field name (`cfg.executors.judge` vs a standalone
  `judgeExecutor` key) — naming call, left to planning/implementation.
- Whether `claude -p --allowedTools` supports the judge autonomously
  choosing to call the tool mid-session before emitting its final JSON
  verdict (multi-step tool use in headless mode) — needs a hands-on
  verification spike before/during planning; not assumed here.
- Reliability delta: parse-fail rate with scout-enabled judges vs baseline,
  and whether `MAX_JUDGE_ATTEMPTS = 3` still suffices — needs measurement
  during/after implementation, not a product decision.
