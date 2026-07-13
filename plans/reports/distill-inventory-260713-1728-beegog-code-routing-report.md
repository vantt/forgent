# beegog Routing Mechanisms Inventory

**Report Date:** 2026-07-13  
**Scope:** Mechanical workflow routing in beegog bee state machine  
**Coverage:** state.mjs, cells.mjs, guards.mjs, reservations.mjs, bee.mjs, hooks (chain-nudge, prompt-context, write-guard, model-guard), AGENTS.md, 03-workflow.md

---

## Phase State Machine

**Kind:** state-routing (phase transitions within the workflow)

### Phase Enum and Transitions

**File:** `skills/bee-hive/templates/lib/state.mjs`, lines 14–25

```javascript
export const PHASES = [
  'idle',
  'exploring',
  'planning',
  'validating',
  'swarming',
  'reviewing',
  'scribing',
  'compounding',
  'grooming',
];
export const KNOWN_PHASES = [...PHASES, 'compounding-complete'];
```

**Rule:** Legal phase values; 'compounding-complete' is the terminal alias written at feature close (line 12). Unknown phases trigger an agent-drift flag (bee_status decision 0004).

**Preconditions for startFeature()** (lines 483–562):
- Current phase must be 'idle' **or** 'compounding-complete' (line 498)
- Blocks if prior feature has nonterminal cells (open/claimed/blocked) (lines 537–550)
- Blocks if workers remain registered (line 512)
- Blocks if active reservations exist (line 519)
- Blocks if claimed cells exist (line 529)
- Blocks if HANDOFF.json exists (line 505)
- On success: atomically sets feature/mode/phase, **resets all four gates to false**, writes summary/next_action (lines 555–561)

### Gate Approval State

**File:** `skills/bee-hive/templates/lib/state.mjs`, lines 292–294; `state.json` schema

```javascript
export function gateApproved(state, gateName) {
  return Boolean(state && state.approved_gates && state.approved_gates[gateName] === true);
}
```

**Gate Names** (line 9): `['context', 'shape', 'execution', 'review']`

**Transitions:**
- context → shape → execution → review (linear progression)
- Gates 1–3 (context/shape/execution) block execution in gated phases
- Gate 4 (review) only exists inside user-invoked bee-reviewing session (decision 565e68d0)
- Gate bypass (optional, config: `gate_bypass: true`) auto-approves Gates 1–3 for tiny/small/standard work only; high-risk and secrets always require explicit approval

---

## Cell Status State Machine

**Kind:** state-routing (cell lifecycle transitions)

### Cell Status Values and Legal Transitions

**File:** `skills/bee-hive/templates/lib/cells.mjs`

**Status enum:**
- `open` → (`claimed` OR `blocked` OR `dropped`)
- `claimed` → (`capped` OR `blocked` OR `dropped`)
- `capped` → terminal (frozen audit record)
- `dropped` → terminal (frozen audit)
- `blocked` → (`open` OR `dropped`) (via manual re-open, not machine-enforced)

### Preconditions and Enforcement

**claimCell()** (lines 290–317):
- Requires execution gate approved (line 295): throws if unapproved
- Cell must be status 'open' (line 302)
- All deps must be 'capped' (lines 307–311)
- Sets status='claimed', records worker + claimed_at timestamp (lines 313–315)

**capCell()** (lines 336–432):
- Requires passing verify result recorded (line 359)
- For small+ lanes: requires verify output OR verification_evidence (lines 398–414)
- For small+ lanes: requires non-empty files_changed (lines 409–413)
- For high-risk lane: requires outcome summary (lines 415–419)
- If behavior_change=true: must have red_failure_evidence OR deliberate_exceptions (lines 364–395)
- Sets status='capped', records files_changed, deviations, friction, verification_evidence, outcome (lines 420–430)

**blockCell()** (lines 434–443):
- Requires reason string (line 436)
- Sets status='blocked', records blocked_reason (lines 440–441)

**dropCell()** (lines 445–454):
- Requires reason string (line 446)
- Sets status='dropped', records dropped_reason (lines 451–452)

### Dependencies and Ready Cells

**readyCells()** (lines 284–288):
- Returns open cells whose all deps are capped (depsAllCapped checks each dep's status === 'capped')
- Used to determine which cells can be claimed next

---

## Gate and Execution State Routing

**Kind:** state-routing (phase-based access control)

### Write Access Guards by Phase

**File:** `skills/bee-hive/templates/lib/guards.mjs`, lines 81–152

**checkWrite()** precondition checks (first hit wins):

1. **Direct-edit deny** (lines 84–94, every phase):
   - `.bee/state.json` → "use bee_state.mjs set/gate/worker/scribing-run"
   - `.bee/backlog.jsonl` → "use bee_backlog.mjs add"

2. **Idle intake gate** (lines 98–114):
   - If phase='idle' and NOT underAllowedPrefix(path), deny unless idle_gate disabled in config
   - Writable always: `.bee/`, `docs/`, `plans/`, `AGENTS.md`
   - Message: "route the request through bee-hive first"

3. **Gated phases** (lines 116–129):
   - If phase in ['exploring', 'planning', 'validating'] AND execution gate NOT approved AND NOT underAllowedPrefix(path): deny
   - Allowed prefixes same as intake gate
   - Message: "get execution approval (bee-hive) before touching source files"

4. **Swarming reservation check** (lines 131–149):
   - If phase='swarming': check findConflicts(root, agent, [normalized])
   - If conflicts found: deny with conflict list
   - Message: "return [BLOCKED] to the orchestrator"

5. **Reviewing and other phases** (line 151): allow by default

### Gate-allowed prefixes

**File:** line 31: `['.bee/', 'docs/', 'plans/', 'AGENTS.md']`

---

## File Reservation State Machine (Swarming)

**Kind:** state-routing (same-session concurrent agent conflict detection)

**File:** `skills/bee-hive/templates/lib/reservations.mjs`

### Reservation Active State

**isActive()** (lines 37–39):
```javascript
function isActive(reservation, nowMs = Date.now()) {
  return reservation.released_at == null && !isExpired(reservation, nowMs);
}
```

- Reservation expires if: `released_at != null` OR TTL exceeded
- TTL default: 3600 seconds (line 7)

### Path Overlap Detection

**pathsOverlap()** (lines 53–69):
- Exact match: `left === right`
- Directory prefix: `leftBase.startsWith("${rightBase}/")`
- Glob suffix match: if left ends with `*`, its prefix must contain the other path
- Bare `*` (empty base) covers everything

### Conflict Finding

**findConflicts()** (lines 79–87):
- Returns active reservations held by **other agents** (line 84: `reservation.agent !== agent`)
- Filters by path overlap with requested paths
- Used by checkWrite() in swarming phase

### Reservation Lifecycle

**reserve()** (lines 89–115):
- Precondition: no conflict with other agents' paths (lines 99–102)
- On conflict: returns `{ ok: false, conflicts }`
- On success: appends to store.reservations, returns `{ ok: true, reservation }`

**release()** (lines 117–133):
- Marks all matching agent's (optionally filtered by cell) reservations released_at = now
- Only releases unreleased entries (line 125: `if (reservation.released_at != null) continue`)

**sweepExpired()** (lines 135–148):
- Scans reservations, marks expired ones released_at = now

---

## Task Routing: Command Dispatch

**Kind:** task-routing (routing to command handlers within bee.mjs)

### Unified Dispatcher and Handler Map

**File:** `skills/bee-hive/templates/bee.mjs`

**HANDLERS map** (lines 1310–1361): 41 entries mapping command names to handler functions:
- `status` → handleStatus
- `cells.list`, `cells.ready`, `cells.show`, `cells.add`, `cells.update`, `cells.claim`, `cells.verify`, `cells.cap`, `cells.block`, `cells.drop`, `cells.tier`, `cells.judge`
- `reservations.reserve`, `reservations.release`, `reservations.list`, `reservations.sweep`
- `decisions.log`, `decisions.supersede`, `decisions.redact`, `decisions.active`, `decisions.search`
- `state.set`, `state.gate`, `state.worker.add`, `state.worker.update`, `state.worker.remove`, `state.worker.clear`, `state.worker.prune`, `state.scribing-run`, `state.start-feature`
- `backlog.counts`, `backlog.rank`, `backlog.badges`, `backlog.add`
- `capture.add`, `capture.list`, `capture.flush`, `capture.count`
- `reviews.create`, `reviews.list`, `reviews.show`, `reviews.record`, `reviews.candidate.add`, `reviews.candidates`, `reviews.status`
- `feedback.digest`, `feedback.count`, `feedback.collect`, `feedback.rank`

### Command Resolution

**resolveCommand()** (lines 1397–1406): longest-prefix match over COMMAND_REGISTRY
```javascript
for (let n = leading.length; n >= 1; n -= 1) {
    const candidate = leading.slice(0, n).join('.');
    if (names.has(candidate)) return { commandName: candidate, extra: leading.slice(n) };
}
```

- For `state worker add`: matches `state.worker.add` (3-segment name)
- For `cells ready`: matches `cells.ready`
- For `status`: matches `status`
- Falls back to legacy 2-segment guess if no registry match found

### Flag Parsing

**parseFlags()** (lines 1413–1442):
- Distinguishes boolean-alone flags (line 1376): `['json', 'stdin', 'behavior-change', 'evidence-stdin', 'active-only', 'dry-run', 'write']`
- Boolean-alone flags take no explicit value (e.g., `--json`)
- All other flags require values (e.g., `--passed true`)

---

## Skill-Level Routing: Workflow Chain

**Kind:** skill-routing (choosing which skill/phase runs next across the ecosystem)

### Phase Chain (Declared in AGENTS.md and 03-workflow.md)

**File:** `AGENTS.md`, lines 24–37; `docs/03-workflow.md`, lines 8–22

```
bee-hive (bootstrap & routing)
  → bee-exploring     [GATE 1] "Decisions locked. Approve CONTEXT.md?"
  → bee-planning      (shape)
                      [GATE 2] "Work shape is ready. Approve?"
  → bee-validating    [GATE 3] "Feasibility validated. Approve execution?"
  → bee-swarming      (+ bee-executing × N workers)
  → bee-scribing      (BA spec sync, feature closes unreviewed)
  → bee-compounding   (candidate report, learnings)
  (on demand) bee-reviewing  [GATE 4] "Review complete. Approve merge?" (P1 findings block)
  (on demand) bee-scribing   (capture settled outcomes)
  (on demand) bee-grooming   (audit entropy, hunt debt)
```

**No auto-resume rule:** If `.bee/HANDOFF.json` exists, surface it and **wait** for explicit user confirmation (AGENTS.md rule 4).

**Stale onboarding blocks startup:** If `.bee/onboarding.json` missing or bee_version != plugin_version, run onboarding (AGENTS.md rule 2).

### Mode-Driven Lane Selection

**File:** `docs/03-workflow.md`, lines 53–71

Mechanical classification by repository-harness flags:

| Mode | Trigger | Workflow |
|------|---------|----------|
| `docs` | only knowledge files touched | no cells, no gates |
| `tiny` | 0–1 flags, ≤2 files, direct task | merged shape+execution gate, solo execution, no reviewer |
| `spike` | one yes/no proof | spike cell → answer → return to planning |
| `small` | 0–1 flags, ≤3 files | light plan + inline reality gate + merged shape+execution gate |
| `standard` | 2–3 flags, story-sized | full chain with all gates |
| `high-risk` | 4+ flags **or hard-gate flag** | epic map → mandatory spikes → detailed traces |

**Hard-gate flags:** auth, authorization, data loss, audit/security, external provider, validation removal

### Gate Progression and Bypass

**File:** `AGENTS.md`, lines 39–42; `docs/03-workflow.md`, line 34

- **Gates 1–3** block by default; never self-approve in any mode
- **Gate 4** exists **only inside** user-invoked `bee-reviewing` session; never after unreviewed feature close; never for merge requests that haven't explicitly asked for review
- **Gate bypass** (config: `gate_bypass: true`): auto-approves Gates 1–3 for tiny/small/standard work only; high-risk/hard-gate work, secret reads, and Gate 4 UAT always require explicit approval

### Resumption and Handoff Routing

**File:** `AGENTS.md`, rules 4–6; `docs/03-workflow.md`, line 122–127

- **bee-hive** reads `.bee/HANDOFF.json` if present, **surfaces it and waits** — never auto-resumes
- **bee-swarming** writes HANDOFF at ~65% context usage (rule 6)
- **bee-swarming to bee-scribing** (line 127): "phase clean → next planning slice, or final slice done → Invoke bee-scribing"
- **bee-reviewing never part of swarming handoff** (line 127, decision 565e68d0): user invokes on demand

### Decision Capture Routing

**File:** `docs/03-workflow.md`, lines 9, 49–50

- Explicit user settlement signals ("chốt", "final", "ok ship it") trigger **same-turn capture** (decision 0003, rule 9)
- Lane-scaled capture (decision 0017, rule 9):
  - `high-risk`: full spec sync inline (bee-scribing)
  - Every other lane: queued stub (`bee_capture.mjs add`)
  - Full merge flushed at wrap-up/PreCompact warning/next session's offer

---

## Hook-Driven Routing

**Kind:** skill-routing (nudging the next step based on event and state)

### bee-chain-nudge.mjs (SubagentStop)

**File:** `hooks/bee-chain-nudge.mjs`, lines 49–114

**Routing logic** (lines 72–99):

```javascript
if (phase === "reviewing") {
  msg = "bee chain-nudge: a review agent finished. Collect its findings report, ... synthesize findings, then present Gate 4.";
} else if (isRegisteredWorker || phase === "swarming") {
  msg = "bee chain-nudge: ${who} returned - collect its [STATUS] token, update the cell, check/release reservations. When the wave is clean, move to the next wave or the next chain step.";
  // Decision 0011: if scribing debt (behavior_change cells capped since last run), nudge capture NOW
}
```

**Worker registration check** (lines 68–69):
```javascript
const isRegisteredWorker = agentName !== "" && 
  workers.some((entry) => workerName(entry) === agentName);
```

**Scribing debt nudge** (lines 88–98):
- Checks `cellsLib.scribingDebt(root)` (cells capped since last_scribing_run.at)
- If count > 0: "⚠ Scribing debt: ${count} behavior_change cell(s) — run bee-scribing capture now (decision 0011)"

### bee-prompt-context.mjs (UserPromptSubmit)

**File:** `hooks/bee-prompt-context.mjs`, lines 15–48

**Routing logic:**
1. Calls `inject.buildPromptReminder(root)` (line 33)
2. Checks `inject.shouldInject(root, "prompt", reminder.hash)` (line 37) — dedup via cache
3. If should inject: writes reminder.text to stdout, marks injected (lines 38–39)

**Reminder content** (implicit, via buildPromptReminder): phase/mode/next_action/gate status

### bee-write-guard.mjs (PreToolUse)

**File:** `hooks/bee-write-guard.mjs`, lines 1–276

**Four-layer routing** (first hit wins):

1. **Direct-edit deny** (lines 84–94, every phase):
   - CLI-owned files (state.json, backlog.jsonl) → "use the CLI instead"

2. **Gate guard** (via guards.mjs checkWrite, adapted lines 294–307):
   - Idle intake gate, gated phases, swarming reservation conflicts
   - Deny → exit 2 with reason on stderr

3. **Privacy/scout read guard** (lines 308–333, via guards.mjs checkRead):
   - Secret patterns (`.env*`, `*.pem`, `*.key`, `id_rsa*`, `*.p12`, `credentials*`, `secrets.*`) → emit `@@BEE_PRIVACY@@` marker
   - Scout dirs (node_modules/, dist/, build/, vendor/, coverage/, .next/, __pycache__/, .git/objects) → deny

4. **CLI-shape validation** (lines 336–369, additive):
   - Recognizes `bee_*.mjs` or `bee.mjs` invocations
   - Resolves to command-registry entry via resolveCliCommandName (lines 167–208)
   - Validates parsed flags against entry's JSON-Schema parameters via parseCliFlags (lines 214–240)
   - Unknown/unrecognized shapes: fail open (silent)
   - Malformed CLI: deny with corrective message (lines 262–269)

### bee-model-guard.mjs (PreToolUse for Agent/Task)

**File:** `hooks/bee-model-guard.mjs`, lines 1–154

**Tier routing logic** (lines 100–151):

1. Filter: only DISPATCH_TOOLS = {Agent, Task} (line 29)
2. Check if `toolInput.model` is explicit string (line 123) → allow (transport: "model-param")
3. Check for anchored tier marker in prompt/description (line 127, ANCHORED_TIER_MARKER_RE line 33):
   - `^\s*\[bee-tier:\s*(ceiling|generation|extraction|review)\]`
   - Must be at start of string (no mid-text match, P1-1)
   → allow (transport: "marker")
4. If neither: **deny** (exit 2, line 146) with message:
   - "every Agent/Task dispatch needs an explicit tier — a `model` param or a `[bee-tier: <tier>]` marker"
   - "A bare dispatch would silently inherit the most expensive session model"
   - FIX: "pass model: "${generationModel}" or add [bee-tier: ...] to the prompt/description"

**Dispatch audit log** (lines 64–85, logDispatch):
- One line per evaluated Agent/Task dispatch (allowed or denied)
- Written to `.bee/logs/dispatch.jsonl`: `{ts, tool, transport, model, tier, subagent_type, description}`
- Fail-open: log failure never changes guard decision

---

## Model Tiering and Resolution

**Kind:** state-routing (tier → model selection)

**File:** `skills/bee-hive/templates/lib/state.mjs`, lines 350–418

### Tier Hierarchy

**MODEL_TIERS** (line 61): `['extraction', 'generation', 'ceiling']`

**Configurable tiers** (line 65): `['extraction', 'generation']`

**Ceiling tier** (lines 373–374):
```javascript
if (slot === 'ceiling') return { type: 'inherit' };
```
- Never configured; always inherits session/orchestrator model (decision 0015)
- Kept scarce to control costs (decision 0012, P7)

### resolveTier()

**File:** lines 373–391

Returns `{ type, model?, effort?, command? }`:

```javascript
if (slot === 'ceiling') return { type: 'inherit' };          // inherit session model
if (value == null) return { type: 'budget' };               // no per-agent switch; enforce via budget/cap
if (typeof value === 'string') return { type: 'model', model: value };
if (value.kind === 'cli') return { type: 'cli', command: value.command };
if (typeof value.model === 'string') return { type: 'model', model: value.model, effort: value.effort? };
```

**Fallback for review slot** (lines 379–381): if null, falls back to generation tier

### Ceiling Scarcity Warning

**File:** `skills/bee-hive/templates/lib/cells.mjs`, lines 586–616

**CEILING_MAX_SHARE** = 0.4 (line 589)

**ceilingScarcityWarning()** (lines 610–616):
- If ceiling share > 40% of tiered cells (and tiered count ≥ 3): returns `{ pct, ceiling, tiered }`
- Advisory only, never a blocker (P7)

---

## Scribing Debt Tracking

**Kind:** task-routing (determining capture urgency)

**File:** `skills/bee-hive/templates/lib/cells.mjs`, lines 470–496

**scribingDebt()** returns `{ count, cells }`

- Reads `state.last_scribing_run` (line 481)
- Threshold: `last_scribing_run.feature === current feature` AND recent (parsed from .at or .date) (lines 483–485)
- Counts capped cells with `behavior_change === true` AND `capped_at > threshold` (lines 487–494)
- Empty while idle (line 480)

**Chain-nudge uses this** (bee-chain-nudge.mjs lines 88–98) to advise capture in-flight (decision 0011)

---

## Frozen-Judge Checks

**Kind:** state-routing (worker verification constraint)

**File:** `skills/bee-hive/templates/lib/cells.mjs`, lines 498–575

**FROZEN_JUDGE_PATTERNS** (lines 504–526): regex rules for file classes:
- test sources (`tests?/`, `__tests__/`, `specs?/`)
- test files (`.test.*`, `.spec.*`)
- snapshots (`__snapshots__/`, `.snap`)
- CI config (`.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `azure-pipelines.yml`, `.circleci/`)
- lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, etc.)
- package manifests (`package.json`, `pyproject.toml`, `Cargo.toml`, etc.)
- test config (`jest.config`, `vitest.config`, `pytest.ini`, etc.)
- bee config (`.bee/config.json`)

**frozenJudgeHits()** (lines 563–575):
- Compares changed files against declared scope (cell.files)
- Returns hits where a judge-pattern file was changed but NOT declared
- Decision 0018 (P12): worker that changes test/CI/lockfile without declaring is flagged for review

---

## Summary Table: Routing by Kind

| Kind | Primary Files | Transition/Routing Logic | Key Constraint |
|------|---------------|--------------------------|-----------------|
| **state-routing** | state.mjs, cells.mjs, guards.mjs, reservations.mjs | Phase transitions (startFeature), cell status (claim→cap), gate approval, write access by phase | Phase must be legal; gates enforce execution approval; cell deps must be capped |
| **task-routing** | bee.mjs | Command dispatch (resolveCommand → HANDLERS), flag parsing (parseFlags with boolean-alone set), verify/cap preconditions | Longest-prefix match; boolean-alone flags; cap requires passing verify + proof |
| **skill-routing** | bee-chain-nudge.mjs, bee-prompt-context.mjs, AGENTS.md, 03-workflow.md | Phase chain (exploring→planning→validating→swarming→scribing→compounding), mode-driven lane selection, resume logic (handoff), gate progression | Phase chain is linear; gates 1–3 required; gate 4 user-invoked only; no auto-resume; scribing debt nudges capture urgently |

---

## Unresolved Questions

1. **What enforces the linear phase chain** (exploring → planning → validating → swarming) after Gate 3? The skills themselves call each other by name, but no central state machine enforces rejection if the chain is skipped. Reliance on human (or skill) integrity.

2. **How does bee-swarming know when a "wave" is clean?** The chain-nudge hook advises "check/release reservations. When the wave is clean, move to the next wave" — but clean is not defined in code (no threshold on reservation count or cell status). Wave management is implicit in the orchestrator's judgment.

3. **Tier marker positioning** (bee-model-guard): ANCHORED_TIER_MARKER_RE requires start-of-string, but no enforcement of position within the prompt string's logical boundaries — if a prompt says "example: [bee-tier: ceiling] means X", that substring is a valid marker, even though it's part of explanation text. Reliance on prompt authorship discipline.

Status: DONE

