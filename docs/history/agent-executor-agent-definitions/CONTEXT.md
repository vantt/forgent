# CONTEXT: platform-agnostic canonical root for forgent's own agent definitions (tsk-slq)

## Location note (post-D5)

Every reference to `.fgos/agents/<name>.yaml` below is the **historical
record** of the original scope wording and its reasoning up to
mid-`executing`. **D5 relocated the actual canonical root to
`agents/<name>.yaml`** (plain top-level directory, sibling to
`docs/`/`scripts/`/`src/`) — `.fgos/agents/` never actually works in this
repo (see D5). Nothing else D1-D4 decided changed; only the path prefix
did. Current code (`scripts/project-agents.mjs`) and the real files on
disk use `agents/`, not `.fgos/agents/`.

## Feature boundary

Establish `agents/<name>.yaml` as the platform-agnostic, canonical
source of forgent's own agent definitions (persona, decision-boundary,
model-tier preference, tool-scope), plus a small projection script that
generates `.claude/agents/<name>.md` from it with Claude-Code-specific
frontmatter filled in. `.claude/agents/*.md` is never hand-maintained
directly once this exists.

Out of scope (explicitly deferred, see design doc §4.3, §6, §7):
- A full N-platform converter/writer engine (YAGNI until a second real
  platform target exists — `multi-target-converter-engine` porting-log
  candidate stays deferred).
- Domain-2 enforcement hooks/markers for capacity dispatch (tsk-64p §6,
  unrelated axis).
- The dispatch-resolution mechanism itself (`capacities.<id>` schema,
  `resolveExecutorConfig` generalization) — that is tsk-62v, the companion
  item in the same cluster (tsk-64p). This item is only about WHERE agent
  definitions live and how they stay in sync.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `.fgos/agents/<name>.yaml`'s `tool-scope` field is **authoritative**: the projection script writes it straight into the generated `.claude/agents/<name>.md`'s `tools:` frontmatter, which is the real, harness-enforced tool restriction for Task-tool-dispatched subagents (domain 2). tsk-62v's `capacities.<id>.allowedTools` (design doc §9) stays a **separate, also-enforced** axis for domain-1 headless CLI dispatch (`--allowedTools` passed to a nested `claude -p`), keyed by `capacityId` rather than agent-type name. The two are not the same field named twice by accident — they gate different dispatch domains and never collide because they key differently. Neither is dropped, and neither is demoted to purely descriptive. |
| D2 | tsk-slq authors exactly **one minimal, honestly-labeled proof-of-mechanism placeholder agent** — not tied to any real current dispatch need. Its only job is proving the `.fgos/agents/` → `.claude/agents/` projection pipeline is real and idempotent (byte-identical on a re-run over an unchanged source, per acceptance). The exact name/persona content of this placeholder is an implementer detail, deferred to `fgos-coding-planning`. |
| D3 (pre-existing, ported from design doc "Đã chốt" #7) | The exact field set inside `.fgos/agents/<name>.yaml` is not a clarify-stage question — it was already settled at submit time: build follows marketing-cockpit's `agent.schema.yaml` shape (see Scout evidence below) as the reference pattern, adapted to drop anything Claude-Code-specific. `fgos-coding-planning` picks the concrete field list from that pattern; this item does not re-litigate it. |
| D4 (added mid-`decompose`, surfaced by `fgos-coding-validating`'s reality gate) | `.fgos/agents/<name>.yaml` keeps the `.yaml` extension and format as originally named in scope. This requires a real YAML parsing library — the user explicitly chose to take this on as forgent's **first-ever npm dependency**, a deliberate break from the repo's zero-dependency convention (`package.json` has no `dependencies`/`devDependencies` field today, confirmed by reading it), rather than hand-rolling a scoped parser or switching the format to JSON. Rejected alternatives: (a) hand-rolled minimal YAML parser — real parsing code with real correctness risk for no clear benefit once a dependency is on the table; (b) switching to `.json` to match every other fgOS config file — would have silently overridden the extension named in the original submit text, which is exactly the kind of user-decision reversal that needs asking, not assuming. |
| D5 (added mid-`executing`, discovered live) | The canonical root moves from `.fgos/agents/<name>.yaml` (original scope wording) to **`agents/<name>.yaml`**, a plain top-level directory. Reason: `.fgos/` is structurally reserved for runner state, enforced at two points — `src/runner/worktree.mjs`'s `createWorktree()` unconditionally `fs.rmSync`'s the entire `.fgos/` directory from every freshly-created worktree (ADR0020), confirmed live when the already-committed `.fgos/agents/fgos-placeholder.yaml` vanished from a freshly recreated worktree; and `src/runner/merge.mjs` (~line 735) outright rejects any merge that stages a change under `.fgos/` (`outcome: 'fgos-write-rejected'`, `git merge --abort`). A canonical root under `.fgos/` could never survive a worktree cycle or be merged back to main — this is not a style preference, it is a hard wall the item's original scope wording did not anticipate. User chose the plain top-level `agents/` over the alternative `.fgos-agents/` (sibling dotfile, matching `.fgos-runner.json`'s own precedent). |
| D6 (added mid-`executing`, user-redirected: "check seriously, we have a new setup system coming into operation") | D4's new `yaml` dependency registers into the doctor-check registry per `AGENTS.md`'s own install/setup/doctor gate — never optional, already-written doctrine. Mid-build, discovered `main` had advanced 31+ commits past `fgw/tsk-slq`'s fork point (`1ac5a85`), including `tsk-2cs`'s real extensible doctor-check registry (`src/setup/registrations.mjs`'s `registerCheck`/`registerConfigDefault` — `checks.mjs` is now a thin re-export shim, never hand-edited again). Merged `main` into `fgw/tsk-slq` (clean, no conflicts) and registered a new `dependencies-installed` check there, the correct current mechanism — not a direct `checks.mjs` edit, which was this item's own first (wrong, reverted) attempt. Separately, `fgos return`'s disposable detached-worktree goal-check (`src/runner/goal-check.mjs`, shared by `return`/`merge`/the runner loop) never runs `npm install` — confirmed live when `npm test` failed there with `ERR_MODULE_NOT_FOUND: yaml` despite passing cleanly in this item's own worktree. Fixed by prepending `npm install` to **this item's own** `verify` command; fixing the shared `goal-check.mjs`/worktree-provisioning gap itself is explicitly out of scope for `tsk-slq` (touches shared runner infrastructure never named in this item's footprint) — flagged here as a real follow-up concern for the next dependency-needing item, not silently absorbed. |

## Pinned terms

- **"Canonical root"** = `agents/<name>.yaml` (D5 — was `.fgos/agents/<name>.yaml`
  in the original scope wording, moved because `.fgos/` cannot hold it, see
  D5). Content must never name a specific platform ("Claude", "Codex", etc.)
  anywhere in the file.
- **"Adapter"** = `.claude/agents/<name>.md`, generated output only, carries
  the Claude-Code-specific frontmatter (`name`, `description`, `model`,
  `tools`).
- **"Projection"** = the one-directional generation step, `agents/` →
  `.claude/agents/`. Never the reverse.
- **domain 1 / domain 2** — per the agent-executor design doc §0: domain 1 is
  forgent's own headless process-spawn (`src/runner/dispatch.mjs`,
  `child_process.spawn`); domain 2 is an interactive Claude Code session's
  own Task/Agent tool dispatch, owned by the harness, not forgent's Node
  code.

## Scout evidence

- `/home/vantt/projects/forgentX/.claude/agents/` does not exist in the main
  checkout — forgent has authored zero agent definitions of its own so far.
- `rg subagent_type` / `Task tool` / `Agent tool` across
  `.agents/skills/` (forgent's own fgOS skill set) → **zero hits**. No
  existing forgent skill dispatches a custom `subagent_type` today.
- tsk-5l2 (same cluster, tsk-64p) — the roadmap's own designated "first
  real, end-to-end proof" of the capacity-executor mechanism — dispatches
  via `kind: "cli"` (an external CLI like `gemini`/`agy`), **not**
  `kind: "task"`. Confirms no concrete plan anywhere in the cluster yet
  needs a Task-dispatched custom persona.
- `~/.claude/agents/code-simplifier.md` (real, currently-active Claude Code
  agent definition) frontmatter:
  ```
  ---
  name: code-simplifier
  description: ...
  model: opus
  tools: Glob, Grep, Read, Edit, MultiEdit, Write, NotebookEdit, Bash, ...
  ---
  ```
  Confirms `tools:` in `.claude/agents/*.md` frontmatter is a real,
  harness-enforced grant for that agent-type, not documentation.
- `plans/reports/agent-executor-design-260731-1758-capacity-backend-dispatch-proposal-report.md`
  §4.3 ("Đã chốt" #1, #7): agent-type root belongs at `.fgos/agents/`, not
  `.claude/` (the latter name means "Claude-Code-specific", contradicting
  the platform-agnostic goal); exact yaml fields deferred to build,
  following marketing-cockpit's schema.
  §9: introduces `capacities.<id>.allowedTools` as a *separate* tool-scope
  axis for domain-1 CLI dispatch — this is the field tsk-slq's own
  scope point 5 flags as a same-name-different-concept collision with this
  item's own `tool-scope` field (resolved as D1 above).
- `upstreams/marketing-cockpit/.fgOS/schemas/agent.schema.yaml` — the
  reference schema design doc §4.3 points at. Required fields: `name`,
  `version`, `description`, `role`, `category`, `persona`, `skills`,
  `autonomy`, `decision_boundary`, `status_protocol`, `quality_gates`,
  `escalation_rule`. Notably **has no `tool-scope`/`allowedTools` field at
  all** — forgent's own addition of a tool-scope concept to its agent
  schema is new, not copied from marketing-cockpit, and is exactly why D1
  needed to be decided rather than assumed from the reference pattern.
- `upstreams/marketing-cockpit/.claude/agents/copywriter.md` — an actual
  projected adapter example from the reference implementation. It is a
  thin prose file with **no YAML frontmatter at all** (no `tools:`,
  `model:`) — confirms marketing-cockpit's own adapter projection does not
  wire tool-scope into Claude Code's real enforcement mechanism today,
  which is exactly the gap D1 closes for forgent's version.
- `package.json` (repo root): no `dependencies` or `devDependencies` field at
  all — confirmed by reading it directly. No `node:yaml` built-in exists
  either (checked against the running Node v24.18.0). This repo is
  deliberately zero-dependency today (matches `AGENTS.md`'s note that the
  `distill` skill is "Node zero-dep"); D4 is the point where this item
  knowingly breaks that convention, by explicit user choice, not by drift.
- `CLAUDE.md`'s impact-analysis capability gate: queried
  `fgos tool query --capability impact-analysis --status present` →
  GitNexus registered and `present`. Posture: **full** — the MUST rules in
  `CLAUDE.md`/`AGENTS.md`'s GitNexus section apply as written for whoever
  builds this item.

## Canonical references

- `plans/reports/agent-executor-design-260731-1758-capacity-backend-dispatch-proposal-report.md`
  — primary design doc, §4.3 (agent-type ownership), §9 (tool-scope/permission
  axis), "Đã chốt" #1/#7/#9.
- `plans/reports/distill-consult-260731-1733-agent-executor-backend-dispatch-report.md`
  — prior consult this design doc followed.
- `upstreams/marketing-cockpit/.fgOS/schemas/agent.schema.yaml` — reference
  schema shape for `.fgos/agents/<name>.yaml`'s eventual field set.
- tsk-62v (same cluster) — companion item, defines `capacities.<id>` schema
  and generalizes `resolveExecutorConfig`; this item's D1 depends on that
  schema's `allowedTools` field existing there, not here.

## Outstanding questions deferred to planning

- Exact field list for `.fgos/agents/<name>.yaml` (name/persona/skills/etc.)
  — per D3, follow marketing-cockpit's `agent.schema.yaml` shape, drop
  anything Claude-Code-specific; `fgos-coding-planning` picks the concrete set.
- Name and persona content of the D2 placeholder agent.
- Projection script mechanics (language/location/invocation) — implementer
  detail, not a product decision.
- Whether the projection script itself needs to be registered anywhere
  (e.g. `fgos tool query` capability, per `AGENTS.md`'s install/setup/doctor
  gate) — only applies if the script shells out to something not already
  on PATH by default (Node itself); `fgos-coding-planning` verifies.
