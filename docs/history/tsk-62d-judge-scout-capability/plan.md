# tsk-62d — plan.md

## Mode

**high-risk** — driven by a hard-gate flag (audit/security), not by flag
count alone (count itself lands at 3, which alone would only be
`standard`).

Flags counted:
- **audit/security — YES (hard-gate).** This item expands what a nested,
  LLM-driven headless process (`judgeDiscovery`/`judgeDecompose`'s `claude
  -p` subprocess) is permitted to execute (`Bash(rg:*)`). RUL6
  (`docs/specs/runner.md:853`) frames the existing minimal `--allowedTools`
  allowlist explicitly as the security boundary for this exact process
  class ("Chống đỡ bằng CHỈ DẪN... KHÔNG PHẢI sandbox") — widening it is a
  security-relevant change by the area's own stated threat model, even
  though `rg` is read-only.
- **existing covered behavior — YES.** Touches `resolveExecutorCommand`/
  `resolveExecutorConfig` (`dispatch.mjs`, shared with `spawnWorker`,
  covered by `dispatch.test.mjs`) and `judge-executor.mjs`'s retry/fail-safe
  path (str68-hardened, covered by `judge-executor.test.mjs`).
- **weak proof around the area — YES.** Tool-use inside a judge attempt is
  an untested surface against the existing retry mechanism (CONTEXT.md's
  outstanding-questions section); needs a real measurement, not an
  assumption.
- auth, data model, external systems, public contracts, cross-platform,
  multi-domain — no.

Why not `standard`: a smaller mode would treat "we're letting an
LLM-driven subprocess execute more shell commands" as routine plumbing.
It isn't — RUL6 exists because this exact class of change (subprocess
`allowedTools`) was already the site of a prior real failure mode (`git
commit` hanging without the allowlist, per RUL6's own root-cause note).
The extra rigor `high-risk` buys (fuller risk map, explicit proof points
per component, no proof-point guessing left to `fgos-coding-validating`) is
proportionate to that history, not decorative.

## Approach

**Chosen path** (per CONTEXT.md D2/D4, cited not reopened) — REVISED after a
`fgos-coding-validating` "smaller path" catch (below): `resolveExecutorConfig`
(`dispatch.mjs:404-411`) already resolves `cfg.executors[tier]` as a fully
generic string-keyed map — `validateRunnerConfigShape` (`dispatch.mjs:350-357`)
validates every key in `cfg.executors` uniformly, with no restriction to
real tier names. `judge-executor.mjs`'s `spawnAttempt` today calls
`resolveExecutorCommand(cfg, { prompt, model })` **without a `tier` at
all** — meaning `cfg.executors.judge` is already reachable through the
EXISTING `tier` parameter, no new dimension needed: pass the literal
string `tier: 'judge'` from `spawnAttempt`, and `dispatch.mjs` needs zero
changes. (Original plan proposed adding a distinct `role` param to
`resolveExecutorCommand`/`resolveExecutorConfig` — dropped as unnecessary
duplication of a mechanism the code already generalizes; CONTEXT.md D2's
actual decision — config-based, role-scoped override, not hard-coded args
— is unaffected, only the implementation mechanic simplifies.) Extract the
"how to run one scout pass" instruction into a committed prompt-template
file (D4), following the existing `RUL44`
(`src/runner/prompt-templates/*.txt`) pattern, referenced from both
`discovery.mjs`'s and `decompose.mjs`'s prompt builders.

**Existing precedent that de-risks the biggest open question in
CONTEXT.md** ("does headless `claude -p` support the model autonomously
invoking a tool mid-session before its final output?"): it already does,
today, for the WORKER — RUL6's own text describes the worker's headless
`-p` session editing files AND then running `git commit`, sequential tool
calls inside one spawn, gated by the SAME `--allowedTools` mechanism this
plan reuses. This is running, tested behavior, not a hypothesis — no
separate spike needed to answer that question; it's evidence, cited here
so `fgos-coding-validating` doesn't have to re-derive it.

**Alternatives rejected** (both already closed in CONTEXT.md, cited here
for the plan's own audit trail):
- Hard-coding judge-specific `allowedTools`/args directly in
  `judge-executor.mjs` (Option B) — rejected: breaks the
  config-not-code precedent RUL44 set for exactly this kind of
  operator-tunable surface.
- A dedicated Claude Code Skill for scout — rejected: the nested `claude
  -p` subprocess does not inherit the parent session's skill catalog, and
  RUL6's minimal-allowlist discipline argues against a broader tool
  surface than a single scoped `Bash(rg:*)` grant.

**Ordering.** `fgos graph tsk-62d --json` shows tsk-62d as its own
isolated one-item component (`componentCount` entry `{"size":1,"items":
["tsk-62d"]}`) — not on `criticalPath`, absent from `topUnblock`, no
`deps`. No other item's sequencing is affected by this one, and no other
item needs to land first — ordering below is purely internal to this
item, no cross-item constraint to honor.

1. **Wire judge-executor.mjs (no behavior change yet, no dispatch.mjs
   edit).** `spawnAttempt` passes `tier: 'judge'` to
   `resolveExecutorCommand` — reuses the existing generic
   `cfg.executors[tier]` lookup (`dispatch.mjs:404-411`, already
   string-keyed, already validated generically by
   `validateRunnerConfigShape`). `DEFAULT_RUNNER_CONFIG` and
   `spawnWorker`'s own call site are untouched — `dispatch.mjs` gets zero
   edits this step. Absent `executors.judge` in a caller's config → falls
   back to `cfg.executor`, identical to today's behavior (fail-safe by
   construction, the same fallback path `tier`-based overrides already
   exercise for real tiers).
2. *(folded into step 1 — no separate config-plumbing step needed; the
   smaller path found at `fgos-coding-validating` removed this as its own
   phase.)*
3. **Shared prompt-template file + prompt wiring.** New
   `src/runner/prompt-templates/judge-scout-instructions.txt` (RUL44
   shape: substitution only, no logic), referenced from
   `discovery.mjs`'s `buildDiscoveryPrompt` and `decompose.mjs`'s
   equivalent, instructing the judge to scout (one bounded `rg` pass)
   before rendering a verdict when its `allowedTools` includes it.
4. **Grant the capability + verify.** Add `executors.judge` (with
   `Bash(rg:*)` added to today's `Bash(git add:*),Bash(git commit:*)`) to
   this repo's own tracked `.fgos-runner.json` (dogfooding — this repo is
   itself a judge-call site). This is the step that actually changes
   observable behavior — pairs with the proof points below, not a
   separate item.

**Impact-analysis posture:** `full` (GitNexus present — see CONTEXT.md).
Every symbol touched in steps 1-2 (`resolveExecutorCommand`,
`resolveExecutorConfig`, `spawnAttempt`) gets `impact()` run before edit,
per `CLAUDE.md`'s binding rule at this posture level — not optional here.

## Risk map

| Component | Risk | Proof point (carried to `fgos-coding-validating`) |
|---|---|---|
| `dispatch.mjs` (`resolveExecutorCommand`/`resolveExecutorConfig`) | None — file not edited (smaller-path finding: existing generic `tier`-keyed lookup already covers this need) | `dispatch.test.mjs` stays green unmodified — the absence of a diff here IS the proof; no `impact()` needed since no symbol in this file changes |
| `judge-executor.mjs`'s call site (passes `tier: 'judge'`) | Low — a 1-line change to which string is passed, not to resolution logic itself | `impact({target: "spawnAttempt", direction: "upstream"})` before editing (full posture); existing `judge-executor.test.mjs` green; new test asserting `tier: 'judge'` reaches `resolveExecutorCommand` and resolves `cfg.executors.judge` when present |
| `judge-executor.mjs` (`spawnAttempt`/`runJudgeExecutor`) | Medium — str68's retry/fail-safe discipline must survive a tool-using attempt, unproven today | existing `judge-executor.test.mjs` green; new test exercising a tool-call-containing response through the full 3-attempt retry path; a real measured parse-fail-rate delta (scout-enabled vs baseline), not assumed |
| `discovery.mjs`/`decompose.mjs` prompt builders | Low-medium — prompt wording change can shift verdict behavior, including re-litigating already-passing cases | existing `discovery.test.mjs`/`decompose.test.mjs` green; one live end-to-end discover/decompose run observed manually (same pattern already exercised on tsk-62d itself this session) |
| new prompt-template file | Low — mechanical, mirrors `RUL44`'s already-proven `worker-prompt-default.txt` shape | template hash pinned the same way `hashTemplate`/`templateName` already pin the worker's template |
| `.fgos-runner.json` (this repo's own tracked config) | Low — additive key, absent-safe fallback already proven at the `tier` override | config-shape test (`validateRunnerConfigShape`) covers the new key; repo's own dogfood loop is the live proof |

## Concrete cases to prove against

- Scout returns no matches (empty `rg` result) — judge must still resolve
  clear/unclear, never hang or crash on empty evidence.
- Scout tool call itself errors/times out — must fold into "not clear",
  never a thrown exception (existing fail-safe discipline, `discovery.mjs`
  header D4, must extend to this new failure surface).
- A config with no `executors.judge` block — unaffected, exact today's
  behavior (regression guard).
- Retry path (`MAX_JUDGE_ATTEMPTS = 3`) with a tool-using attempt that
  returns prose instead of JSON — confirms `JUDGE_STRICT_JSON_SUFFIX`/
  `stripCodeFence` still recover it.
- Cost/latency: one measured before/after timing sample per judge call,
  recorded as evidence, not assumed acceptable.

## Split decision

No split. This is one coherent, sequenced change (config dimension →
wiring → shared template → capability grant + verification) with a single
real verify command already proposed at `clarify`
(`npm test test/intake/judge-executor.test.mjs -- --timeout 30000`,
`fgos discover` verdict) — broadened here to also cover
`test/runner/dispatch.test.mjs`, `test/intake/discovery.test.mjs`, and
`test/intake/plan.test.mjs`, since all four are touched. Splitting
into separate items would separate config plumbing from the capability
grant it exists to serve, with no independent value for either half on
its own (per CONTEXT.md's own feature boundary — this is not a project
that unblocks other work, `fgos graph` confirms it, so there is no
unblock-ordering reason to split either).

## Outstanding (unchanged from CONTEXT.md, still deferred)

- Exact tool list beyond `Bash(rg:*)` — resolved at `clarify` via answer:
  v1 scope is `Bash(rg:*)` only, broader tooling is out of scope /
  follow-up.
- Exact config key name — settled here as `cfg.executors.judge`, matching
  the existing `cfg.executors[tier]` naming convention (no new naming
  pattern introduced).
