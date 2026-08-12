# capacity cross-provider governance (domain 1) — locked decisions

Item: `tsk-62v`. Cluster: `tsk-64p` (agent-executor: capacity-aware backend
dispatch, design + proof-of-concept). Depends on `tsk-62v` (capacities
schema this item extends). Design origin: `plans/reports/agent-executor-design-260801-1159-synthesis-goal-constraints-gaps-report.md`
section 4.1 (first raises the gap), whose "Câu hỏi mở" #1 explicitly asks
whether a governance field is needed now or can wait — this item's own
submission is the "yes, now" answer, already scoped in the item's own
`description`.

No prior `judgeDiscovery` verdicts exist for this item (`view.discovery`
empty) — this is the first clarify pass.

## Feature boundary

Add explicit data-governance to `capacities.<id>` (`.fgos-runner.json`
schema, `src/runner/dispatch.mjs`'s `resolveExecutorConfig`) so a
capacity's prompt content cannot silently cross from the Claude ecosystem
to a third-party LLM provider when routed through a `kind: "cli"` capacity
(e.g. `agy`/`gemini`). Scope floor: `capacities.<id>.kind === "cli"` only
— `mcp`/`http`/`skill`/`task` kinds are out of this item's scope (D4).

## Dependency-branch gap found and resolved this session

Before any of the below could be scouted, `fgw/tsk-32n` (forked from
`main` @ `6a7d210`) had **zero** `capacities` code — `tsk-62v` is a leaf
child of root `tsk-64p`; its commit (`1f1788a`) merged into `fgw/tsk-64p`
(the root branch), not into `main` (root `tsk-64p` itself is still
`status: todo`). `tsk-32n` has no `parent`, so `claim-port.mjs`'s
`deps-not-merged` guard (which only fires for `isolate && isLeaf` claims
forking from a *shared* root branch) never caught this cross-root gap.
Resolved by merging `fgw/tsk-64p` into `fgw/tsk-32n` this session (user
decision, in-conversation) — `git merge fgw/tsk-64p --no-edit`, clean
merge, `npm install` picked up a new `yaml` dependency the merge brought
in, full suite green after (2024 pass / 0 fail). `capacities` code now
present in `src/runner/dispatch.mjs` (`resolveExecutorConfig(cfg, tier,
capacityId, fgosDir)`).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `capacities.<id>` gains a boolean `allowCrossProvider` field. Absent or `false` = blocked (restrictive-by-default, per the item's own requirement). Rejected `sensitiveData: true/false` (the design report's own suggested name) — its polarity runs opposite the required safe default: absent reads as "not sensitive" = allowed, backwards from what's needed. Rejected a central allowlist-of-safe-capacities shape as overbuilt (YAGNI) — `tsk-5l2` is the only real consumer today (item's own point 4). |
| D2 | Non-Claude detection checks the **final resolved executor `command`** — after `capacities.<id>` > `executors.<tier>` > `executor` precedence (D4, tsk-62v) resolves — against a small known-Claude-CLI allowlist (`'claude'` today), never `capacity.kind === 'cli'` alone. Gating on declared `kind` alone would false-positive: a capacity can declare `kind: 'cli'` without overriding `command`/`adapter`, falling through to the global executor, which is Claude's own CLI (`command: 'claude'`, `.fgos-runner.json`/`DEFAULT_RUNNER_CONFIG`). Never reuse `KNOWN_ASSISTANT_CLI_NAMES` (`dispatch.mjs:174`, `['claude', 'codex']`) for this — it wrongly includes `'codex'` (OpenAI's own CLI, not Claude), so it is the wrong list for a Claude-vs-non-Claude check. Never check `provider` (the display-alias field, defaults to `command` but freely overridable) — spoofable: a config author could set `provider: 'claude'` while `command` actually spawns `agy`. |
| D3 | A governance violation throws `RunnerConfigError` at resolve time — no dispatch happens at all, never a silent auto-fallback-and-send. Already locked by the item's own acceptance-criteria text ("fails loudly at resolve time rather than dispatching"); the scope text's looser "refuse/fall back to the Claude-only executor" phrasing describes the same outcome (no risky dispatch proceeds), not an automatic silent substitution. |
| D4 | Scope floor: `capacities.<id>.kind === "cli"` only. Already locked by the item's own description ("a non-Claude kind: cli provider"). |

## Pinned terms

- **allowCrossProvider** — boolean field on a `capacities.<id>` entry.
  `true` explicitly permits that capacity's resolved executor to be a
  non-Claude command; absent or `false` blocks it (D1).
- **non-Claude** — for this item's scope, a resolved executor `command`
  that is not in the small Claude-CLI allowlist (`'claude'` today),
  evaluated on the FINAL resolved command after precedence, not on
  declared `kind` (D2).

## Scout evidence cited

- `src/runner/dispatch.mjs:453-478` (`resolveExecutorConfig`, current
  signature post-tsk-62v-merge: `(cfg, tier, capacityId, fgosDir)`,
  precedence `byCapacity ?? perTier ?? cfg.executor`) — read in full this
  session.
- `src/runner/dispatch.mjs:174` (`KNOWN_ASSISTANT_CLI_NAMES = ['claude',
  'codex']`) — read this session; ruled out as the detection allowlist
  since it includes a non-Claude CLI (`codex`).
- `src/runner/dispatch.mjs:203` / `.fgos-runner.json` (tracked, this repo)
  — `DEFAULT_RUNNER_CONFIG.executor.command === 'claude'` confirms the
  global-fallback case genuinely resolves to Claude's own CLI, grounding
  D2's false-positive concern.
- `test/runner/dispatch.test.mjs:397,473,830` — existing capacity-aware
  dispatch tests already model the non-Claude case as `command: 'agy'`,
  confirming `command` (not `provider`) is the field this feature must
  check.
- `docs/history/agent-executor-capacity-dispatch/CONTEXT.md` (tsk-62v's
  own clarify doc, brought in by this session's merge) — D1-D9 there
  define the `capacities.<id>` schema and `resolveExecutorConfig`
  precedence this item extends; read in full this session.
- `plans/reports/agent-executor-design-260801-1159-synthesis-goal-constraints-gaps-report.md`
  section 4.1 (design origin of the governance gap) and section 5 /
  "Câu hỏi mở" #1 (confirms the field is optional-now, not a build
  blocker for the 4 original cluster items — this item is the deliberate
  yes-now follow-up) — read in full this session.
- `git merge-base --is-ancestor` / `git log --oneline --all --grep`
  checks this session — established the dependency-branch gap above
  (tsk-62v's commit `1f1788a` reachable from `fgw/tsk-64p`, not `main`).
- `fgos tool query --capability impact-analysis --status present` → one
  provider, `gitnexus`, `status: "present"` — AGENTS.md's impact-analysis
  gate reads **full**: `impact()` MUST be run (and its risk level
  reported) before editing `resolveExecutorConfig`/`resolveExecutorCommand`
  once this item reaches `fgos-coding-implement`. Note: GitNexus's own index is
  currently stale (last indexed `1ac5a85`, predates this session's merge)
  — `fgos-coding-implement` should re-run `gitnexus analyze` before relying on
  impact output for the post-merge code.

## Deferred to planning

- Exact placement of the D2 check inside `resolveExecutorConfig` vs a
  wrapper at its caller (item's own description explicitly leaves "or its
  caller" open — implementation choice, not a product decision).
- Exact `RunnerConfigError` message wording (style precedent: existing
  messages in `dispatch.mjs` are already specific and instructive, e.g.
  line 460's `fgos tool register` hint).
- New-test placement/naming for D1-D3's precedence + refusal invariants,
  mirroring how `tsk-62v`'s own capacity-keyed precedence tests are laid
  out in `test/runner/dispatch.test.mjs`.
- Whether `tsk-5l2` (the first real capacity expected to set
  `allowCrossProvider: true`, per the item's own point 4) needs a
  companion edit in the same change or a separate follow-up commit —
  the item's acceptance criteria only requires the mechanism, not
  necessarily flipping `tsk-5l2`'s own config in this same diff.

## Outstanding questions

None — D1-D4 above resolve every material gray area found this session.
The dependency-branch gap (above) was a process/environment blocker, not
a product decision, and is already resolved (merge done, tests green).
