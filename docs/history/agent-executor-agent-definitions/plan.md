# Plan: platform-agnostic canonical root for forgent's own agent definitions (tsk-slq)

Status: built (D5 relocated the canonical root mid-`executing`, D6 registered the new dependency + fixed `verify`; see Revision notes below). Final paths: `agents/fgos-placeholder.yaml`, `scripts/project-agents.mjs` (not `project-agent-definitions.mjs` as first drafted — renamed to match the engine's own `judgeDiscovery`-generated `verify` command literally, per fgos-coding-implement's "run the verify command exactly as recorded" rule). Final `verify`: `npm install && npm test && node scripts/project-agents.mjs && git diff --exit-code -- .claude/agents/`.
Decisions: `docs/history/agent-executor-agent-definitions/CONTEXT.md` (D1, D2, D3, D4, D5, D6).

## Revision note 3 (post-executing, D6)

Mid-build, `fgw/tsk-slq` merged `main` (31+ commits ahead at the fork
point) to pick up `tsk-2cs`'s real extensible doctor-check registry
(`src/setup/registrations.mjs`), and registered D4's new `yaml` dependency
there as `dependencies-installed` — required by `AGENTS.md`'s own
install/setup/doctor gate, not optional. Also discovered `fgos return`'s
disposable detached-worktree goal-check never runs `npm install`, so
`verify` now starts with it. See `CONTEXT.md` D6 for full evidence.

## Revision note 2 (post-executing)

D5 moved the canonical root from `.fgos/agents/<name>.yaml` to
`agents/<name>.yaml` — discovered live during `fgos-coding-implement`, not
predicted here: `.fgos/` is structurally reserved for runner state
(`src/runner/worktree.mjs` wipes it on every worktree checkout,
`src/runner/merge.mjs` rejects any merge touching it). Every `.fgos/agents/`
reference below is the plan as shaped before that discovery; the paths in
the Status line above are what actually shipped. See `CONTEXT.md`'s
"Location note (post-D5)" for the same caveat applied to that document.

## Revision note (post-validating)

The first pass of this plan assumed a hand-rolled YAML parser without
verifying the repo's dependency posture. `fgos-coding-validating` FAILed that
assumption: `package.json` has zero `dependencies`/`devDependencies` today
(confirmed by reading it) and no built-in Node YAML support exists. This
was material (changes data shape / dependency footprint), so it went back
through `fgos-coding-exploring` to lock **D4**: keep the `.yaml` extension as
originally named, and take on a real YAML npm dependency — forgent's
first-ever — by explicit user choice. Every section below reflects D4;
`git log`/diff between the two `plan.md` commits shows exactly what
changed if a byte-level comparison is ever needed.

## Mode: high-risk

Flags counted against the mode-gate checklist:

| flag | applies? | why |
|---|---|---|
| auth | no | — |
| authorization | no (folded into audit/security below) | — |
| data model | yes | `.fgos/agents/<name>.yaml` is a new, persisted schema shape other items will read/write |
| audit/security | **yes — hard gate** | D1 makes `tool-scope` a real, harness-enforced least-privilege grant (which tools a subagent may call). Getting the mapping wrong over- or under-privileges a subagent — a genuine security-relevant mistake, not a cosmetic one |
| external systems | no | — |
| public contracts | yes | this item establishes the schema convention tsk-62v's sibling work and any future N-platform adapter depend on |
| cross-platform | yes | the entire point of the item — platform-agnostic root vs. platform-specific adapter |
| existing covered behavior | no | net-new, nothing regresses |
| weak proof around the area | no | net-new, no prior tests to be weak |
| multi-domain | no | single domain (`coding`) |

4 flags counted, and `audit/security` alone is a hard-gate per the mode-gate
rule — either fact alone forces **high-risk**. A `standard` plan would
under-cover the tool-scope enforcement risk (D1); a `small`/`tiny` plan would
skip writing the idempotency and platform-agnostic-content proof points the
acceptance criteria explicitly require.

## Approach

**Chosen path:**

1. Design `.fgos/agents/<name>.yaml`'s field set following
   `upstreams/marketing-cockpit/.fgOS/schemas/agent.schema.yaml`'s shape (D3)
   — `name`, `version`, `description`, `role`, `persona`, `decision_boundary`
   at minimum — dropping anything Claude-Code-specific (no `category`
   funnel-stage concept, no marketing-specific `quality_gates` enum), and
   **adding** the `tool-scope` field D1 introduces (not present in the
   marketing-cockpit reference — forgent's own addition). Content must never
   name a platform ("Claude", "Codex", etc.) anywhere in the file — this is
   the literal meaning of "canonical root" and matches the user's own note
   mid-session: forgent stays agent-provider agnostic, `.claude/`/`.codex/`
   stay thin compatibility wrappers, never the place data actually lives.
2. Add a real YAML parsing library as a runtime dependency (D4) — this is
   forgent's first-ever npm dependency; `package.json` gains a
   `dependencies` field for the first time, and a `package-lock.json` gets
   generated (none exists today). Write one small projection script,
   `scripts/project-agent-definitions.mjs` (kebab-case `.mjs`, matches
   `scripts/`'s existing naming — e.g. `migrate-actor-to-role.mjs`), that
   reads every `.fgos/agents/*.yaml` and writes a matching
   `.claude/agents/<name>.md` with Claude-Code-specific frontmatter
   (`name`, `description`, `model`, `tools`) filled in. `tools:` is filled
   directly from the source yaml's `tool-scope` list per D1 — no
   reinterpretation, no filtering, no silent addition. This is a
   copy/convert step only, not a converter engine (explicitly out of scope,
   `CONTEXT.md`'s Feature boundary).
3. Author exactly one placeholder agent definition (D2) —
   `.fgos/agents/fgos-placeholder.yaml` — whose persona/description says
   plainly it exists only to prove the projection mechanism, not to be
   invoked for real work. Run the projection script to generate
   `.claude/agents/fgos-placeholder.md`.
4. Prove idempotency: run the projection script twice over the same
   unchanged source and diff the two output runs — must be byte-identical
   (this is the acceptance criterion's own wording, becomes a real test, not
   a manual check).
5. Document the D1 field-authority reconciliation somewhere durable and
   discoverable beyond `CONTEXT.md` alone (acceptance requires this
   "explicitly documented") — a short note at the top of the projection
   script itself (the one place a future editor of either field will
   actually be looking) stating: `tool-scope` here is source-of-truth for
   `.claude/agents/<name>.md`'s `tools:` frontmatter (domain-2 Task-dispatch
   grant); `capacities.<id>.allowedTools` (tsk-62v, `.fgos-runner.json`) is
   a separate, also-enforced grant for domain-1 headless CLI dispatch,
   keyed by `capacityId` not agent-type name.

**Alternatives rejected:**

- **Full multi-target converter/writer engine** (compound-engineering
  plugin's pattern) — rejected per the design doc's own YAGNI call (§4.3,
  §6, porting-log `multi-target-converter-engine`): only one real platform
  (Claude Code) exists today; build the engine when a second one does.
- **Hand-maintaining `.claude/agents/*.md` directly, no generation step** —
  rejected; this is precisely what the item exists to stop (`CONTEXT.md`'s
  Feature boundary, scope point 2).
- **Borrowing/reusing ClaudeKit's global `~/.claude/agents/*.md` personas as
  forgent's own canonical source** — rejected; design doc's locked decision
  #1 ("Đã chốt") is that forgent owns its own agent definitions distinct
  from ClaudeKit's global ones, and the user's own agnostic-platform note
  reinforces the same boundary from the other direction (never let the data
  live inside a platform-named folder).

## Risk map

| component | risk | proof point (carried to `fgos-coding-validating`) |
|---|---|---|
| `tool-scope` → `tools:` frontmatter mapping (D1) | high (security) | test asserting the projected `.md`'s `tools:` field exactly matches the source yaml's `tool-scope` list — no silent add, no silent drop |
| Projection idempotency | medium | test running the script twice over an unchanged source, asserting byte-identical output (acceptance's own wording) |
| Platform-agnostic content | medium | test scanning every `.fgos/agents/*.yaml` for forbidden platform-name substrings (`Claude`, `Codex`, `Anthropic`, etc.) |
| Schema field completeness vs. reference pattern | low | manual citation-check against `upstreams/marketing-cockpit/.fgOS/schemas/agent.schema.yaml` in the PR/commit description, no new test needed |
| D1 documentation discoverability (acceptance requires it be "explicitly documented") | low | grep confirms the reconciliation note exists in the projection script header, not only buried in `CONTEXT.md` |
| First-ever dependency addition (D4) | medium | run `npm install <chosen-yaml-package>` in the worktree, confirm `npm test` still passes green afterward, and confirm the package has zero (or minimal, audited) transitive dependencies of its own before picking it — a heavy dependency tree would undercut the reason zero-dep was worth deliberately breaking for |

Impact-analysis capability gate (`fgos tool query --capability
impact-analysis --status present`): GitNexus registered and `present` →
posture **full**. Nothing existing is being *edited* by this item's own new
files (`.fgos/agents/*.yaml`, `.claude/agents/*.md`, the new projection
script are all net-new) — so `impact()` has no existing symbol to run
against for the creation work itself. If the projection script ends up
reusing `tool-registry.mjs`'s `commandExistsOnPath`-style helper or any
other existing exported symbol, `impact()` on that symbol is required
before editing it, per `AGENTS.md`'s MUST rule — this applies only if that
reuse actually happens during build, not as a blanket requirement here.

## Files touched (all new; nothing existing edited)

- `.fgos/agents/fgos-placeholder.yaml` — the one placeholder agent (D2).
- `.claude/agents/fgos-placeholder.md` — generated adapter output.
- `scripts/project-agent-definitions.mjs` — the projection script.
- `test/scripts/project-agent-definitions.test.mjs` (or equivalent under
  `test/`, matching the existing `test/<area>/*.test.mjs` layout) — the
  three proof-point tests from the risk map (tool-scope mapping,
  idempotency, platform-agnostic content).
- `package.json` — **edited** (not new): gains its first `dependencies`
  entry (D4).
- `package-lock.json` — **new**: generated by `npm install`, did not exist
  before.

`fgos graph --what-if tsk-slq` shows this item unblocks only `tsk-64p` (the
milestone) — it is not on the tracked critical path (`fgos graph`'s
`criticalPath` does not include `tsk-slq` or `tsk-62v`) and has no declared
dependency on or from `tsk-62v`, its sibling under `tsk-64p` — the two can
build in either order.

## Split decision

One honest piece of work — no split. All four numbered scope items in the
original submit (schema, projection script, first agent, D1 reconciliation)
are tightly coupled: the script cannot be proven idempotent without a real
agent instance to run it against, and the D1 documentation is only
meaningful once the mapping it describes actually exists in code. Splitting
would create artificial dependencies between fragments that only make sense
together.

## Assumptions (implementer-level, not re-litigated here)

- Placeholder agent's exact name/wording beyond "must say plainly it's a
  proof-of-mechanism placeholder" (D2) — builder's call.
- Whether the projection script needs registration in `fgos tool query`'s
  capability registry — only applies if it shells out to something not
  already on PATH by default (it doesn't; pure Node `fs`/`yaml` parsing) —
  so no registration needed under this plan's design; if build discovers
  otherwise, `fgos doctor`'s existing generic tool-registry check already
  covers it once registered.
- Exact YAML package choice (e.g. `yaml` vs. an alternative) — builder's
  call at install time, constrained by the risk-map row above (must pass
  `npm test` green, must not drag in a heavy transitive dependency tree).

## Final verify confirmation (post-D6)

`npm install && npm test && node scripts/project-agents.mjs && git diff
--exit-code -- .claude/agents/` — the item's own recorded `verify` command,
run in full after D6: **2016 tests, 2011 pass, 0 fail, 0 cancelled, 5
skip**, projection re-ran clean, `git diff --exit-code` confirmed
byte-identical (idempotent). Exit code 0.
