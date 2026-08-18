# submit-assist-classify wired through agent-executor capacities — locked decisions

Item: `tsk-5l2`. Cluster: `tsk-64p` (agent-executor: capacity-aware backend
dispatch, design + proof-of-concept). Depends on `tsk-62v` (domain 1 —
headless runner capacity resolution; done, `docs/history/agent-executor-capacity-dispatch/CONTEXT.md`).
`tsk-5l2` is domain 2 (in-session skill dispatch) — explicitly called out as
a separate item in tsk-62v's own CONTEXT.md ("in-session Agent/Task tool
dispatch (domain 2) is a separate item (`tsk-5l2`), deliberately out of
scope here").

Source request (title, untrusted per RUL45): "Wire fgos-submit-assist's
tier/kind/risk classification step through the new capacity-executor
mechanism as the first real, end-to-end proof it works." Full 7-point scope
is in the item's own `description` field (`fgos list --id tsk-5l2 --json`).

`view.discovery["tsk-5l2"]` is empty — no prior `judgeDiscovery` verdicts.
A prior decision-log note (2026-08-01T06:14Z, pre-dates this clarify
session) already flags the same two gaps addressed below as "not yet
decided, build with awareness" — it does not answer them; this session
answers them.

## Impact-analysis gate posture

`fgos tool query --capability impact-analysis --status present` → one
provider, `gitnexus`, `status: "present"` → **full** per `AGENTS.md`'s
gate: `impact()` MUST be run (and risk reported) before editing
`resolveExecutorConfig`, `resolveExecutorCommand`, `spawnWorker`, or
`fgos-submit-assist/SKILL.md`'s classify step, once this item reaches
`fgos-coding-implement`.

## Feature boundary

Wire `fgos-submit-assist`'s classify step (`.claude/skills/fgos-submit-assist/SKILL.md`
step 2) to optionally dispatch to an external CLI backend via the
capacity-executor mechanism (`cfg.capacities.submit-assist-classify`,
schema from `tsk-62v`), instead of always reasoning inline. Domain 2
(in-session skill self-dispatch via Bash) — no enforcement hook, no
change to domain 1's headless runner path.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `.fgos-runner.json` gains `capacities.submit-assist-classify`: `kind: "cli"` (not `invocation`/`cli-spawn` — that vocabulary is stale per tsk-62v's own rename), `adapter: "cli-spawn"` (the `EXECUTOR_ADAPTERS` selector, reused as-is), `tier: "light"`. Restated from the item's own scope point 1 and tsk-62v's D1/D2/D4 — not a new judgment. |
| D2 | Which real CLI backend the entry's `command` points at (`agy`, `codex`, `gemini`, or whatever else) is a build-time probe, not a clarify-time guess — the item's own scope point 1 says so explicitly ("pick whatever is really available on this machine at build time... do not hardcode a guess now"). Scouted this session: `agy` and `codex` are present on this machine, `gemini` is not — informational for `fgos-coding-implement`, not a lock on which one gets picked. |
| D3 | The external CLI must be registered via `fgos tool register --kind cli --capability submit-assist-classify ...` before `resolveExecutorConfig` can resolve `kind: "cli"` capacities (tsk-62v D6) — this also satisfies `AGENTS.md`'s install/setup/doctor gate for free via `checkToolRegistryConfigured` (`src/setup/checks.mjs`), same mechanism tsk-62v already relies on. Restated from the item's own scope point 2. |
| D4 | `dispatch.mjs` gains a small CLI entry point, `node src/runner/dispatch.mjs resolve <capacityId>`, printing `{command,args,provider,model}` as JSON by reusing `resolveExecutorConfig`/`resolveExecutorCommand` verbatim — confirmed this session that `dispatch.mjs` currently has **no** CLI entry point at all (no `process.argv` handling), so this is new, not a rename. No second argv-building implementation. Restated from the item's own scope point 3. |
| D5 | `fgos-submit-assist/SKILL.md`'s step 2 branches: `submit-assist-classify` configured AND its registered backend is `present` → shell out via Bash using the resolved command/args to get the external suggestion. Not configured, or configured but backend missing → fall back to **exactly** today's inline-reasoning behavior — a regression test pins this as byte-identical for the default/no-config case. Restated from the item's own scope point 4. |
| D6 | Announce line printed immediately before the Bash dispatch (matches design doc §4.2's "text right before the tool-call, since the tool-call itself isn't visible"), literal format from the item's own acceptance text: `submit-assist-classify - <provider> - <model>` (plain hyphens, not design §8's em-dash example — the item's own literal spec is the concrete acceptance criterion here, takes precedence). Restated from the item's own scope point 5. |
| D7 | **(New, this session — governance, synthesis report §4.1).** Add a minimal `sensitiveData: false` field to the `capacities.submit-assist-classify` config entry now, rather than shipping this first cross-provider capacity with no governance vocabulary at all. `false` reflects that the routed content is only the free-text submit ask (no repo/code content by design). Metadata-only for now — no enforcement logic reads this field yet; a real safe/unsafe gate and its enforcement are out of this item's scope (YAGNI until a second, riskier cross-provider capacity exists). User confirmed: "Add a minimal field now" over "document only, no field." |
| D8 | **(New, this session — quality/escalation, synthesis report §4.4).** When the external CLI actually runs but its output can't be parsed into a sane tier/kind/risk suggestion (distinct from "backend missing" — this is "backend present, ran, answered badly"), the skill falls back to the same inline-reasoning path as D5's missing-backend branch. No separate retry/escalate loop (unlike `judge-executor.mjs`'s `MAX_JUDGE_ATTEMPTS`/`JUDGE_STRICT_JSON_SUFFIX` pattern) — justified by the item's own framing that output here is non-authoritative and equally cheap to fix via `fgos edit` either way. User confirmed: "Fall back to inline reasoning" over "pass through best-effort." |
| D9 | **(New, `tsk-1o7`, supersedes D3's own claim.)** D3 read as though `resolveExecutorConfig` needed `--capability submit-assist-classify` to match — it does not: the resolver's own error message (`dispatch.mjs`) has only ever required `--name` to match the capacity's id; the tool's free-text `capability` label was never consulted for the presence check before this session. D3's registration invocation is otherwise still correct (`--kind cli`, the rest of its flags) — only the "before `resolveExecutorConfig` can resolve" causal claim about `--capability` is corrected. After `tsk-1o7`, `--capability` becomes a REAL match key, but only once the owning capacity also declares its own `needs` field naming that same capability (US-027/D5/D6, `docs/history/dispatch-concept-boundary/DISCUSSION.md` §4) — a capacity naming no `needs` still resolves by name alone, exactly as D3 originally observed. Setting `capacities.submit-assist-classify.needs` for real is `tsk-53n`'s own scope, not this correction's. |

D1-D6 are restatements of already-locked upstream decisions (item scope +
tsk-62v), logged here for completeness. D7/D8 are new decisions made in
this clarify pass, both logged via `fgos decision` for `view.decisions`
visibility. D9 is a later correction (`tsk-1o7`), appended rather than
edited into D3 in place.

## Pinned terms

- **capacityId** (for this item) — the literal string `"submit-assist-classify"`,
  a skill-owned identity, not `skillForStage(domain, stage)` like tsk-62v's
  domain-1 identity (D3 in `agent-executor-capacity-dispatch/CONTEXT.md`) —
  `fgos-submit-assist` is a standalone-invoke skill outside the
  `clarify`/`decompose`/`executing` stage graph, so it owns its own capacity
  name rather than deriving one from `domain`/`stage`.
- **provider** — same meaning as tsk-62v's pinned term: the resolved
  executor's `command` field, defaulting to `command` verbatim unless the
  executor block declares its own `provider` alias.
- **"malformed output"** (D8) — anything the external CLI returns that
  cannot be parsed into a value for at least one of tier/kind/risk
  (unparseable text, missing expected shape, or values outside the known
  vocabularies `light/standard/heavy`, `bug/feature/chore/task`, or the
  risk scale) — exact detection method is implementation, deferred to
  planning/executing below.

## Scout evidence cited

- `src/runner/dispatch.mjs:335-478` (`CAPACITY_KINDS`, `validateCapacityShape`,
  `resolveExecutorConfig`, `resolveExecutorCommand`) — read in full this
  session; confirms the capacities schema from tsk-62v is live on this
  branch (`fgw/tsk-5l2` descends from `fgw/tsk-62v`'s merge).
- `.fgos-runner.json` (current) — no `capacities` block yet; today's
  `executor`/`executors.judge`/`models` config is what D5's "byte-identical
  when not configured" invariant must hold against.
- `.claude/skills/fgos-submit-assist/SKILL.md` (full file, read this
  session) — step 2 is today's 100%-inline classify step this item must
  preserve as the fallback path.
- `plans/reports/agent-executor-design-260731-1758-capacity-backend-dispatch-proposal-report.md`
  §4.0 (kind/vocabulary unification), §4.2 (domain 2: resolve + dispatch +
  announce, no enforcement), §8 (announce line format/example).
- `plans/reports/agent-executor-design-260801-1159-synthesis-goal-constraints-gaps-report.md`
  §4.1 (data-governance gap — cross-provider content), §4.4 (no
  escalation path when a cheap backend fails) — the two gaps D7/D8
  resolve; §5 confirms these are flagged, not blocking, for the 4
  existing cluster items.
- `docs/history/agent-executor-capacity-dispatch/CONTEXT.md` (tsk-62v's own
  locked decisions, read in full) — D1-D9 there are the upstream source
  for D1-D6 above; confirms tsk-5l2 is domain 2, explicitly out of
  tsk-62v's own scope.
- Local shell probe this session: `agy` and `codex` found on `PATH`
  (`/home/vantt/.local/bin/`), `gemini` not found — informational for D2,
  not a lock.
- Global decision log, entry at `2026-08-01T06:14:01Z` ("Three updates to
  this item's original scope text...") — pre-existing note flagging the
  same D7/D8 gaps as unresolved; this session is what resolves them.

## Deferred to planning

- Exact malformed-output detection method for D8 (JSON-parse failure vs.
  vocabulary-mismatch vs. empty output) and where in `SKILL.md`'s flow the
  check sits.
- Test placement/naming for D5's byte-identical-when-absent regression
  pin, mirroring how tsk-62v's own capacities-absent invariant gets tested.
- Whether `dispatch.mjs resolve <capacityId>` (D4) needs its own unit test
  file or extends an existing `dispatch.mjs` test suite.
- Exact registration invocation for D3 (`fgos tool register` flags beyond
  `--kind cli --capability submit-assist-classify`) once D2's real CLI
  target is picked at build time.

## Outstanding questions

None — D1-D6 trace to already-locked upstream decisions (item scope +
tsk-62v), and D7/D8 (this session's genuinely open gray areas) are now
locked above with the person's explicit answers.
