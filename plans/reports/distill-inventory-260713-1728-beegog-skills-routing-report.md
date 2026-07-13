# Beegog Skills Routing Inventory Report

**Scope:** All 15 SKILL.md files + 4 reference files in `upstreams/beegog/skills/`  
**Task:** Identify ROUTING MECHANISMS = rules that decide "what runs next"  
**Date:** 2026-07-13

---

## Executive Summary

This report maps 3 kinds of routing across the bee workflow ecosystem:

1. **state-routing**: state transitions within one workflow (condition → new state)
2. **task-routing**: choosing between multiple modes/workflows inside one skill
3. **skill-routing**: deciding which skill runs next in the ecosystem

All 15 SKILL.md files contain routing mechanisms. The flow is deterministic and chained: **bee-hive** is the router entry point; each skill hands off to the next via explicit routing rules.

---

## File-by-File Inventory

### 1. `skills/bee-briefing/SKILL.md`

**Routing found: YES**

| Type | Finding | Lines | Verbatim |
|------|---------|-------|----------|
| task-routing | Lane-based ceremony scaling | 28-37 | `\| Lane \| Brief \|... \| tiny / spike \| **none** ... \| small \| **none by default**... \| standard \| **on-demand** ... \| high-risk \| **mandatory** ...` — Decides which brief to render based on lane |
| task-routing | Mode dispatch: render/refresh/walkthrough/on-demand | 39-46 | `\| Mode \| Trigger \| Does \| **render** (chain) ... **refresh** (chain) ... **walkthrough** (chain) ... **on-demand** (user asks)` — Mode determines which section is rendered and when |
| skill-routing | Handoff: to bee-scribing after walkthrough | 152 | `Walkthrough mode (post-Gate-4) ... Invoke bee-scribing skill.` — After Gate 4 review passes, always hand off to scribing |

---

### 2. `skills/bee-bypass-gate/SKILL.md`

**Routing found: YES**

| Type | Finding | Lines | Verbatim |
|------|---------|-------|----------|
| task-routing | Argument dispatch: on/off/status | 36 | `Parse the argument: on \| off \| status (no argument → status, then ask which the user wants).` — Route based on user input |
| state-routing | Gate bypass toggle condition | 22-42 | `When gate_bypass: true, the agent stops asking the human at **Gates 1, 2, and 3** and instead takes the RECOMMENDATION option... What bypass **never** touches (the safety floor, all absolute): High-risk / hard-gate work... Gate 4... Privacy` — State changed ONLY for eligible lanes; hard-gate/G4/privacy exempt |
| state-routing | Safety floor gates bypass never touches | 26-30 | `- **High-risk / hard-gate work** — ...These stop for the human exactly as if bypass were off. - **Gate 4** — UAT items always go to the human... - **Privacy** — reading secret-shaped files always needs explicit human approval.` — Absolute exemptions from bypass |
| skill-routing | Handoff: return to current workflow or bee-hive | 65 | `Bypass set to \<on\|off\>. Return to whatever the user was doing (or bee-hive if idle).` — Route depends on context (in-progress task or idle) |

---

### 3. `skills/bee-compounding/SKILL.md`

**Routing found: YES**

| Type | Finding | Lines | Verbatim |
|------|---------|-------|----------|
| task-routing | Three parallel analyst subagents | 31-40 | `\| Analyst \| Focus \| Tier \| **pattern extractor** ... **decision analyst** ... **failure analyst**` — Dispatch three independent analysis tracks in parallel |
| state-routing | Guard the state layer: check scribing record | 69-75 | `Record present → note it in the run summary and move on. Record absent while behavior_change cells were capped → **invoke bee-scribing now**, then resume compounding. Never merge specs inline...` — If scribing record missing + behavior_change cells capped, MUST invoke bee-scribing before resuming |
| task-routing | Flush capture queue at decision points | 86-89 | `Flush points, whichever comes first: **wrap-up** (the working session is ending), the **PreCompact/close warning** (the hook fires when the queue is non-empty), or the **session-start offer**... At flush: oldest-first give each stub the full capture treatment` — Queue flushed at three possible points; oldest-first ordering |
| state-routing | Record compounding run | 101-103 | `node .bee/bin/bee_state.mjs set --phase compounding-complete --next-action "..." --summary "..."` — Phase transition recorded via state command |
| skill-routing | Handoff: to bee-hive | 136 | `Compounding complete: learnings at \<file\>, \<N\> critical promotions, state-layer guard checked. Invoke bee-hive skill.` — Always hand off to bee-hive after completion |

---

### 4. `skills/bee-evolving/SKILL.md`

**Routing found: YES**

| Type | Finding | Lines | Verbatim |
|------|---------|-------|----------|
| state-routing | Hard-gate: prove you are in bee repo | 27-45 | `Before anything else, run the guard: test -f skills/bee-hive/templates/lib/feedback.mjs && test -f skills/bee-writing-skills/SKILL.md... Only the bee repo... has \`skills/bee-hive/templates/\`. If the guard fails, **REFUSE and stop**` — Gate check blocks all downstream routing |
| task-routing | Gate A: human picks what to fix | 60-73 | `**STOP and wait**. The human picks one item to fix, or stops the loop. Both are complete, successful outcomes.` — User decision branches the loop (pick item vs. stop) |
| task-routing | Fix workflow: hand off to bee-writing-skills | 82-89 | `Hand the chosen item to the **bee-writing-skills** skill and follow its full discipline... bee-evolving itself NEVER implements the fix inline` — Route fix execution to external skill, never inline |
| task-routing | Suites green check prerequisite | 95-99 | `Run the repo's recorded verify command and require it green before Gate B:... A red suite returns the loop to step 3.` — Loop condition: red suite → return to step 3 (fix); green suite → proceed to Gate B |
| task-routing | Gate B: human reviews complete diff | 101-113 | `Show the human the **complete diff**... **STOP and wait** for an explicit approval of *this* diff.` — Gate B approval required before push; never auto-approved |
| task-routing | Push only after explicit Gate B approval | 115-126 | `Only after the human's explicit Gate B approval of the concrete diff, push... Push is NEVER automatic: No runbook step, scheduler contract, cron job, or automation framing authorizes a push.` — State transition (push) requires explicit human approval; never automatic |
| skill-routing | Handoff: to bee-hive | 162 | `Evolving loop complete: improvement shipped through both human gates (or cleanly stopped at one). Invoke bee-hive skill.` — End always returns to bee-hive |

---

### 5. `skills/bee-executing/SKILL.md`

**Routing found: YES**

| Type | Finding | Lines | Verbatim |
|------|---------|-------|----------|
| state-routing | Finite state machine: Initialize → Accept → Reserve → Implement → Verify → Advisor Consult (if stuck) → Cap → Release → Return | 21-23 | `Initialize -> Accept assigned cell -> Reserve -> Implement -> Verify -> (Advisor Consult, if stuck) -> Cap -> Release -> Return` — Sequential state machine with conditional branch (Advisor Consult) |
| task-routing | Assigned cell acceptance: exactly one, never self-select | 34-39 | `Require exactly **one** assigned cell id from the parent. Never choose work yourself — do not browse \`ready\` or \`list\` for candidates.` — Cell assignment is parent-driven; no self-selection routing |
| state-routing | Deviation auto-routing by severity | 54-60 | `1. Found a bug in touched code → **auto-fix**, record as a deviation. 2. Missing critical functionality... → **auto-add**, record as a deviation. 3. Blocking issue... → **auto-fix**, record as a deviation. 4. Architectural change needed → **STOP**, return \`[BLOCKED]\`...` — Four condition branches with different outcomes |
| task-routing | Advisor Consult trigger: first serious failed verify attempt | 72-101 | `**Trigger** — consult only when both are true: the dispatch prompt carries an \`Advisor\` line... and the worker has just hit its **first serious failed verify attempt**... **Canonical loop (D3), max 2 consults per claim:** fail 1 -> consult 1 -> advised retry -> (fail) -> consult 2 (follow-up, same advisor) -> final retry -> (fail) -> [BLOCKED]` — Max 2-consult loop with budget tracking |
| state-routing | Verify pass recorded before cap | 65-71 | `Cap only after the verify pass is recorded (the helper refuses otherwise):... On failure: fix the root cause and rerun the exact command.` — Cap helper gate-checks verify pass first; cap blocks if missing |
| state-routing | Cap-time evidence collection mandatory for behavior_change | 107-111 | `If the cell is \`behavior_change: true\`, add \`--behavior-change --evidence-stdin\` and **pipe** the structured \`verification_evidence\`... It lands in the cell trace; **do not write an evidence file**` — State constraint: behavior_change cells MUST include verification_evidence via stdin; no separate files |
| skill-routing | Handoff: to bee-swarming parent (orchestrator) | 148 | `One status token returned and the report written; the parent orchestrator collects it. Invoke bee-swarming skill (parent side) to continue the wave.` — Return status token; parent (bee-swarming) decides next routing |

---

### 6. `skills/bee-exploring/SKILL.md`

**Routing found: YES**

| Type | Finding | Lines | Verbatim |
|------|---------|-------|----------|
| task-routing | Scope classification: Quick / Standard / Deep | 27-32 | `Classify: \`Quick\`, \`Standard\`, or \`Deep\`. Read \`docs/history/learnings/critical-patterns.md\` and \`.bee/state.json\` if present. If the request spans independent subsystems, pick one and defer the rest.` — Mode selected based on scope complexity; multi-subsystem requests split and deferred |
| task-routing | Domain type classification: SEE / CALL / RUN / READ / ORGANIZE | 34-40 | `Classify each applicable type: \`SEE\`: user-visible surface; \`CALL\`: API, CLI, webhook, SDK, service interface; \`RUN\`: job, script, service, or pipeline; \`READ\`: docs, emails, reports, notifications; \`ORGANIZE\`: data model, file layout, taxonomy, config` — Multi-type classification determines question probes |
| task-routing | Socratic locking: one outcome-framed question per message | 52-61 | `One concise question per message, preferably single-choice, **outcome-framed** ("what breaks for users if…"), using the standard CONTEXT / QUESTION / RECOMMENDATION / options format. Start broad, then narrow into constraints.` — Question pattern fixed; one per message loop |
| state-routing | Backlog flip condition: D11a | 31 | `when this feature matches an existing \`docs/backlog.md\` row, flip that row to \`in-flight\` and add the feature slug, same turn; if the request never passed through the backlog, create the \`proposed\` row first, then flip it. This is the only place a row goes \`in-flight\`` — State transition rule: match existing row → flip to in-flight; no match → create proposed then flip |
| state-routing | Fresh-eyes review background dispatch | 65-68 | `spawn one reviewer with no conversation history (slot: \`review\`, decision 0021 — default opus on Claude, falls back to generation) — **in the background where the runtime supports it** (decision 0017): keep assembling CONTEXT.md, keep talking to the user; the review blocks nothing until Gate 1.` — Reviewer spawned in background; blocks nothing until Gate 1 verdict required |
| state-routing | Context Assembly writes CONTEXT.md | 63-68 | `Write \`docs/history/<feature-slug>/CONTEXT.md\` from \`references/context-template.md\`.` — Artifact creation point; source for all downstream decisions |
| state-routing | Update state before gate presentation | 71-74 | `node .bee/bin/bee_state.mjs set --phase exploring-complete --feature "<feature>" --summary "Exploring complete. CONTEXT.md is ready for planning." --next-action "Gate 1, then invoke bee-planning."` — Phase transition recorded; next action documented |
| skill-routing | Present Gate 1, then route to bee-planning | 75, 99 | `Present **Gate 1** per the Gate Presentation Contract... Decisions locked. Approve CONTEXT.md before planning?... Decisions captured and CONTEXT.md written. Invoke bee-planning skill.` — Gate approval required; always hand off to bee-planning |

---

### 7. `skills/bee-grooming/SKILL.md`

**Routing found: YES**

| Type | Finding | Lines | Verbatim |
|------|---------|-------|----------|
| task-routing | 5-step workflow: Hive housekeeping → Hunt debt → Propose → Execute → Close loop | 17-76 | `run when the hive is idle. It carries dead weight out in a fixed cycle: **hunt the project → propose → execute → close the loop**, with a quick hive-housekeeping check on the side.` — Fixed 4-step cycle (entropy → hunt → propose → execute) |
| task-routing | Entropy score calculation | 38-41 | `ENTROPY SCORE = orphaned cells ×10 + unverified cells ×5 + stale decisions ×5 + stale specs ×5 + backlog-without-outcome ×2 + stale work ×3 + broken tools ×8, cap 100` — Scoring formula determines trend and action level |
| state-routing | MANDATORY user approval before deletion | 66 | `**MANDATORY user approval before any deletion. Grooming never deletes on its own initiative.** No approval, no kill — regardless of how obvious the candidate looks.` — Delete state transition blocked until human approves |
| task-routing | Execute kills as cells only | 68-72 | `Approved kills run as normal tiny/small cells through the \`bee-executing\` worker loop — reserve, verify, cap. Grooming never edits files directly.` — Kill execution routed through bee-executing, never inline |
| task-routing | Outcome recording at close | 75-76 | `node .bee/bin/bee_backlog.mjs add --type kill-outcome --severity <P1|P2|P3> --layer <layer> --title "<outcome>" --detail "<predicted vs actual>"` — Outcome record filed based on prediction vs. actual |
| skill-routing | Handoff: to bee-compounding | 100 | `Grooming pass complete: entropy score reported, approved kills executed, outcomes recorded. Invoke bee-compounding skill.` — Always hand off to bee-compounding |

---

### 8. `skills/bee-hive/SKILL.md`

**Routing found: YES — this is the primary router**

| Type | Finding | Lines | Verbatim |
|------|---------|-------|----------|
| skill-routing | First-skill routing table: vague request → exploring, clear scope → planning, etc. | 71-87 | `\| Vague or new feature \| \`bee-exploring\` \| ... \| Research task, clear scope \| \`bee-planning\` \| ... \| Review request (explicit) \| \`bee-reviewing\` \| ... \| Document a screen/API/job/area \| \`bee-scribing\` \| ...` — Request type determines which skill is invoked first |
| state-routing | Mode gate: mechanical risk-flag counting | 92-106 | `Classification is **mechanical**. Count these risk flags: > auth · authorization · data model · audit/security · external systems · public contracts · cross-platform · existing covered behavior · weak proof around the area · multi-domain. \| Mode \| Trigger \| tiny \| 0–1 flags, ≤2 files, no API/data change, one direct task \| ... \| high-risk \| 4+ flags **or any hard-gate flag**` — Flag count determines lane (tiny/spike/small/standard/high-risk) |
| state-routing | Lane-scaled ceremony: docs/tiny/small/standard/high-risk | 109-121 | `\| Lane \| Plan \| Validate \| Execute \| Review \| Human stops \| \| docs \| none — announce one line \| format check \| direct, in-session \| none \| 0 \| \| tiny \| short \`plan.md\` direct note \| 2-minute reality check \| direct, in-session (solo) \| self-review + done-report \| 1 — the merged shape+execution gate \| ...` — Each lane has predetermined ceremony level |
| state-routing | Tiny/small merged gate: shape + execution approved together | 125-126 | `**Gate 2 and 3 are presented as **one merged question** — "Work shape + execution: I'm about to do X via Y, verified by Z. Approve?" — approval records both \`shape\` and \`execution\`.` — For tiny/small, Gates 2 and 3 merge into one state transition |
| state-routing | The Four Gates and when they apply | 127-138 | `Gate 1: "Decisions locked. Approve CONTEXT.md before planning?" Gate 2: "Work shape is ready. Approve before current-work preparation?" Gate 3: "Feasibility validated. Approve execution?" Gate 4: P1 > 0 → "P1 findings block merge. Fix before proceeding?" ; P1 = 0 → "Review complete. Approve merge?"... **Gate 4 lives only inside a user-invoked review session**` — Gate presence and order varies by lane; Gate 4 only in review sessions |
| state-routing | Gate bypass conditions | 129 | `the opt-in gate-bypass switch (\`bee-bypass-gate\` skill → \`.bee/config.json\` \`gate_bypass: true\`), which auto-approves Gates 1-3 for \`tiny\`/\`small\`/\`standard\` work only; high-risk/hard-gate work, secrets, and Gate 4 UAT always stop` — Bypass auto-approves only low-risk Gates 1-3; high-risk/G4/secrets always stop |
| task-routing | Baseline gate: verify command runs once per session | 55 | `if \`.bee/config.json\` records \`commands.verify\`, run it once per session before any cell is claimed. A red baseline is surfaced to the user and becomes its own fix-first tiny cell` — Red baseline blocks cell work; becomes new fix cell |
| skill-routing | Resume logic: if HANDOFF.json exists, present and wait | 57 | `**HANDOFF:** if \`.bee/HANDOFF.json\` exists, present its phase, feature, cells in flight, and next action to the user and **wait for confirmation. Never auto-resume.**` — Handoff presence branches to resume, never auto-continues |
| skill-routing | Surface unreviewed high-risk | 61 | `When \`high_risk_unreviewed > 0\`, surface it plainly — a hard-gate change (auth, data loss, security, external provider) is sitting unreviewed — state the merge/release consequence and offer to start a review` — Unreviewed high-risk count surfaced; review offered (not auto-triggered) |
| state-routing | Priority rules: P1 blocks, context budget applies, CONTEXT.md is truth, Gate 3 critical, reset on failure, validate always, critical-patterns mandatory, evidence before claims, settlement capture unprompted, machinery runs by agent, silent bookkeeping, never hand-edit .bee JSON | 144-157 | Lines listing 11 priority rules — core invariants of bee's routing and state model |
| skill-routing | Handoff to selected bee-<skill> | 194 | `Session oriented and route chosen. Invoke bee-<selected-skill> skill.` — Route chosen by hive; selected skill invoked |

---

### 9. `skills/bee-planning/SKILL.md`

**Routing found: YES**

| Type | Finding | Lines | Verbatim |
|------|---------|-------|----------|
| task-routing | Mode gate: count risk flags mechanically | 49-61 | `- **Every touched file is knowledge, not runtime** (docs/, specs, README, sample/example configs, plans) → \`docs\` lane: exit planning ... **0–1 flags** → \`tiny\` or \`small\` ... **2–3 flags** or story-sized behavior → \`standard\` ... **4+ flags or any hard-gate flag** → \`high-risk\` ... One yes/no proof decides whether the plan is real → \`spike\`` — Risk count determines lane; early exit if docs lane |
| state-routing | Discovery level selection: L0/L1/L2/L3 | 36-45 | `Pick the lowest level that removes real uncertainty: **L0 — skip:** pattern already exists in repo or learnings; cite it. **L1 — quick verify:** confirm one API/version/behavior with a command or doc check. **L2 — standard:** compare 2–3 candidate approaches; note trade-offs. **L3 — deep dive:** unfamiliar territory, external systems, or hard-gate flags.` — Uncertainty level routes to discovery depth |
| task-routing | Artifact fan-out: discovery and approach | 47 | `**Artifact fan-out (decision 0009).** Only **L2/L3** discovery earns a separate \`docs/history/<feature>/discovery.md\`... At **L0/L1**, record the finding in \`plan.md\`'s \`## Discovery\` note and cite it` — Discovery level routes to separate file (L2+) or inline section (L0/L1) |
| state-routing | Approach storage: section or separate file | 65-69 | `Write it as an \`## Approach\` section **inside \`plan.md\`** by default. Graduate it to a standalone \`docs/history/<feature>/approach.md\` only for **high-risk** lanes or **L2+** discovery` — Lane and discovery level route approach to inline section or separate file |
| state-routing | Plan.md shape by mode | 90-95 | `**Shape bodies by mode:** ... \`tiny\` / \`small\` — a direct note: current work outcome, proof command, out of scope. \`spike\` — the one yes/no question, what proves YES, what NO implies, location. \`standard\` (milestone-shaped) — **phase plan**: ... \`standard\` / \`high-risk\` (capability/risk-shaped) — **epic map**:` — Mode determines plan.md body structure |
| state-routing | Tiny/small merged gate: shape + execution | 85-86 | `For \`tiny\` and \`small\`, run the validating reality check inline first — MODE FIT / REPO FIT / ASSUMPTIONS / SMALLER PATH / PROOF SURFACE, each with one line of file/command evidence, 2 minutes not a report — then present **one merged question** in place of Gates 2 and 3` — Inline reality check precedes merged gate; validating not separately invoked |
| state-routing | Prep: cells created only after Gate 2 approval | 87-99 | `Write **one** \`docs/history/<feature>/plan.md\` with frontmatter... Then present **Gate 2** per the Gate Presentation Contract... then **stop**. No pseudo-cells in markdown, no prep, no cells... Only after Gate 2 approval (§6 Prep): 1. Enrich the **same** \`plan.md\` in place... 2. Create cells for the current slice only` — Gate 2 approval gates cell creation; cells created only in Prep phase |
| state-routing | Update state by lane | 99 | `\`tiny\`/\`small\` (merged gate already approved) → \`node .bee/bin/bee_state.mjs set --phase validated --next-action "Invoke bee-swarming (solo execution)."\`; every other lane → \`node .bee/bin/bee_state.mjs set --phase planning-complete --next-action "Invoke bee-validating."\`` — Phase state differs by lane; routes to different next skill |
| skill-routing | Handoff: tiny/small to bee-swarming, others to bee-validating | 122 | `Plan shaped and current-slice cells prepared. \`tiny\`/\`small\`: invoke bee-swarming skill (solo execution — the merged gate already covers execution approval). All other lanes: invoke bee-validating skill.` — Lane determines handoff destination |

---

### 10. `skills/bee-reviewing/SKILL.md`

**Routing found: YES**

| Type | Finding | Lines | Verbatim |
|------|---------|-------|----------|
| skill-routing | Trigger: explicit user intent only | 22-36 | `Dispatch this skill only when the user names one of these intents (R1): "review this / review this feature" / "review all of today's work" / "review feature A and B" / "review the diff from X to Y" / "review everything unreviewed before release"... None of the following are triggers...` — No auto-dispatch on feature finish; only explicit user request triggers review skill |
| task-routing | Scope resolution: 5 types | 39-50 | `The user owns the review boundary (R4). A request resolves to exactly one of five scope types: 1. the current feature, or a named feature ... 2. a named list of features/cells ... 3. everything completed and unreviewed since the last review baseline ... 4. an explicit range with a stated start and end point ... 5. everything completed within a stated time window` — User input categorized into 5 scope types |
| state-routing | Scope freeze and verification preflight | 54-63 | `Before any reviewer is dispatched, the scope is frozen (R5):... Create the session: \`node .bee/bin/bee_reviews.mjs create --file <scope.json>\`. This runs the verification preflight over every included behavior-change cell and **fails closed** — non-zero exit, zero files written — when evidence is missing (A10).` — Session creation gates on verification preflight; missing evidence blocks reviewer dispatch |
| task-routing | Specialist review dispatch: 4 core + conditional reviewers | 91-109 | `\| Reviewer \| Focus \| Slot \| Order \| **code-quality** \| correctness, readability, type safety \| review \| parallel \| **architecture** ... \| review \| parallel \| **security** ... \| review \| parallel \| **test-coverage** ... \| review \| parallel \| **Conditional reviewers** join the same parallel wave when the diff mechanically matches their trigger: \`performance\` (queries in loops, caching), \`api-contract\` (routes, public shapes), \`data-migration\` (spawn gate: migration/schema files only), \`reliability\` (retries, queues, external calls).` — Diff scanned for conditional reviewer triggers; all matching reviewers spawned in parallel (capped at 6) |
| state-routing | Severity: P1/P2/P3 synthesis | 112-122 | `- **P1** — security breach, data loss, breaking change, production blocker. Blocks session approval. **P2** — real performance, architecture, reliability, or important test gap. **P3** — cleanup, docs, future debt.` — Finding severity determines blocking status; corroboration across reviewers may promote severity |
| state-routing | Verification evidence gate: missing → P1 | 124-131 | `For every capped cell in scope with \`behavior_change: true\`, inspect the recorded \`verification_evidence\`... Missing or vague evidence ("tests pass", "should be covered") is itself a P1 finding` — Evidence check becomes P1 if missing/vague; work rejected |
| state-routing | Artifact verification: EXISTS/SUBSTANTIVE/WIRED | 132-140 | `For everything CONTEXT.md and plan.md promised... verify three levels: - **EXISTS** — the artifact is present **SUBSTANTIVE** — not a stub, placeholder, TODO-only, fake static path, or empty handler **WIRED** — imported and used on the integration path. All three = OK. EXISTS + SUBSTANTIVE only = P2. Missing or EXISTS-only = P1.` — Artifact maturity levels route to different findings (P1 or P2) |
| task-routing | Human UAT: walk every SEE/CALL/RUN decision | 142-145 | `Walk the user through every SEE/CALL/RUN decision in CONTEXT.md, for every feature in scope... Failure → P1 fix cell + rerun the item. Skip requires a recorded reason` — UAT failure blocks merge; skip must be recorded |
| task-routing | Delta re-review protocol | 146-154 | `After a P1 fix is capped: 1. Re-review the fix delta AND sweep the whole scope diff for the finding's defect class ... 2. Record the resolution to the session... 3. Do not re-run the full panel for the whole batch unless the fix crosses a scope boundary, changes a public contract, or destabilizes an assumption the rest of the scope relied on.` — P1 fix triggers minimal delta re-review (not full panel) unless boundary crossed |
| state-routing | Gate 4: P1 > 0 blocks merge | 161-169 | `P1 > 0 → "P1 findings block merge. Fix before proceeding?" ; P1 = 0 → "Review complete. Approve merge?"... Never continue past open P1s without explicit user acknowledgment. Silence is not acknowledgment. A session stays \`blocked\`... until every P1's fix and delta re-review (§6) pass.` — P1 existence gates merge approval; session marked blocked until resolved |
| state-routing | Gate bypass inside review session | 173 | `Inside a running session, UAT items (the SEE/CALL/RUN decisions) are always presented to the human, and any P1 finding always stops. The merge is auto-approved only when P1 = 0 **and** every UAT item was confirmed pass by the human; otherwise Gate 4 stops as normal.` — Gate 4 inside session never auto-approved if P1 > 0 or UAT fail/skip |
| state-routing | Re-review avoidance: unchanged ranges | 175 | `before creating a new session, check \`node .bee/bin/bee_reviews.mjs status\` — a candidate already reporting \`reviewed (covered by <review-id>)\` for an unchanged range is not re-reviewed; only genuinely new or \`review stale\` delta gets a new session, unless the user explicitly asks for a re-review.` — Scope status check avoids re-review of unchanged reviewed ranges |
| skill-routing | Handoff: to bee-briefing (walkthrough) or bee-scribing | 204 | `For \`standard\`/\`high-risk\` scope, invoke \`bee-briefing\` in walkthrough mode to write \`docs/history/<feature>/walkthrough.md\` per feature in scope, as an audit artifact of what the session found. If a P1 fix inside the session settled new behavior worth documenting, that triggers \`bee-scribing\`...` — After session close, route to bee-briefing (for walkthrough) or bee-scribing (if behavior settled) |

---

### 11. `skills/bee-scribing/SKILL.md`

**Routing found: YES**

| Type | Finding | Lines | Verbatim |
|------|---------|-------|----------|
| task-routing | Mode dispatch: sync / capture / flush / harvest / bootstrap | 26-36 | `\| Mode \| Trigger \| Does \| **sync** (chain default) \| execution completed with \`behavior_change\` cells capped \| merge the feature's behavior deltas into the touched areas' specs \| **capture** \| any discuss → build → test → adjust loop **settles an outcome**, any phase \| log the decision same turn, then: **high-risk lane → merge into the spec immediately**; every other lane → append a capture stub; the merge happens at flush \| **flush** \| capture queue non-empty at a flush point \| drain the queue oldest-first: full merge of each stub... \| **harvest** \| user asks to document an existing area, or grooming files a missing-spec item \| write the first spec for an area built before/outside bee \| **bootstrap** \| \`docs/specs/\` lacks \`system-overview.md\` or \`reading-map.md\` \| offer — never auto-run...` — Mode selected based on trigger; routes to different spec-merge depth (sync/harvest) or queue management (capture/flush/bootstrap) |
| state-routing | Capture mode: lane-scaled merge depth | 71-83 | `When the user says the settlement out loud — "chốt", "final", "ok ship it", any equivalent — capture happens **in that same turn**, never deferred (decision 0003). What "capture" costs in that turn is lane-scaled (decision 0017): high-risk = the full spec merge; every other lane = decision log + a one-line queue stub, with the merge at flush` — Lane determines capture merge timing: high-risk immediate, others deferred |
| task-routing | Flush at three predetermined points | 86-89 | `Flush points, whichever comes first: **wrap-up** (the working session is ending), the **PreCompact/close warning** (the hook fires when the queue is non-empty), or the **session-start offer** (decision 0017)... At flush: \`node .bee/bin/bee_capture.mjs list\`, then oldest-first give each stub the full capture treatment` — Three flush points; oldest-first ordering enforced |
| task-routing | Deferred request routing to product backlog | 90-94 | `When the user pushes work out of the current scope — "để sau", "phase 2", "later", "not now" — or a Deferred Idea leaves exploring, the agent appends a \`proposed\` row to \`docs/backlog.md\`... At sync, close the loop the other way: when this scribing run closes a feature that matches a backlog row, flip that row to \`done\`...` — Deferred work routes to backlog rows; sync closes loop with done-flip |
| state-routing | Update state after scribing run | 110-113 | `Record the scribing run: \`node .bee/bin/bee_state.mjs scribing-run --feature <feature> --areas "<a,b>" --next-action "<next action>"\`. This stamps \`last_scribing_run\` (\`feature\`, \`date\`, an **ISO-precise \`at\` timestamp**, \`areas_synced\`, \`next_action\`) and mirrors \`next_action\` plus advances \`phase\` to \`compounding\` at the top level.` — Timestamp recorded; phase advanced; scribing debt cleared |
| skill-routing | Handoff: to bee-compounding | 151 | `Scribing complete: <N> area specs synced (<coverage>), <M> open gaps, reading map refreshed. Invoke bee-compounding skill.` — Always hand off to bee-compounding |

---

### 12. `skills/bee-swarming/SKILL.md`

**Routing found: YES — orchestrator routing**

| Type | Finding | Lines | Verbatim |
|------|---------|-------|----------|
| task-routing | Solo execution for tiny/small lanes | 21-22 | `For \`tiny\` and \`small\`, **no workers are spawned** — you implement the cell(s) directly in-session, keeping the cell discipline intact: claim the cell, read its \`read_first\`, implement within its \`files\`, run its \`verify\` command and quote the fresh output, record \`verification_evidence\`..., cap it.` — Lane determines solo vs. worker routing |
| state-routing | Preconditions gate | 24-28 | `Gate 3 is approved: run \`node .bee/bin/bee_status.mjs --json\` and confirm \`gates.execution\` is true. If not, stop — return to bee-validating. Never spawn workers before execution approval.` — Gate 3 check gates worker spawn; failure routes back to bee-validating |
| task-routing | Wave analysis: walk deps and files for parallelization | 32 | `List claimable cells... and walk their deps: cells with all deps capped and no shared files run in parallel within one wave; dependent or file-overlapping cells go to later waves.` — Dep/file analysis determines wave grouping and ordering |
| task-routing | Assign exactly one cell per worker | 33 | `The orchestrator picks exactly **one cell per worker**. Workers never self-select, browse the ready list, or take a second cell.` — Parent-driven cell assignment; no worker self-selection |
| task-routing | Model tier judgment at dispatch | 35-40 | `Judge each cell's model tier at dispatch — you (the orchestrator) assess the task in front of you and pick the fitting tier... **extraction** — pure retrieval or mechanical edits... **generation** — normal implementation, wiring, writing tests... **ceiling** — integration across modules, architecture/design calls, security-sensitive or \`high-risk\`-lane work...` — Cell characteristics (lane, action, must_haves, files) route to tier (extraction/generation/ceiling) |
| task-routing | Advisor dispatch condition: degenerate check | 42-46 | `After the tier choice, resolve the advisor slot... only when the advisor resolves AND passes the check: No advisor configured, or the advisor resolves to the **same model name** as the worker's resolved model → skip, no \`Advisor\` line. The worker is dispatched at **ceiling** tier → always skip... Otherwise, for distinct names: judge by the known claude order...` — Advisor presence gated on degenerate check; ceiling tier skips advisor |
| state-routing | Record workers before results arrive | 47 | `node .bee/bin/bee_state.mjs worker add --nickname <n> --cell <id> --tier <tier> --status <status>` per worker.` — Worker registry state written before dispatch |
| task-routing | Goal-check every [DONE]: re-run verify | 49-52 | `Run the cell's verify command yourself (fresh output, your own shell). \`tiny\`/\`small\` lanes may spot-check one representative cell per wave; \`standard\`/\`high-risk\` re-run every behavior-change cell. Failure → the cell is NOT done: re-dispatch to the same tier with the failing output` — [DONE] verdict requires fresh verify run; failure triggers re-dispatch at same tier |
| state-routing | Frozen judge check blocks [DONE] acceptance | 51 | `**Frozen judge:** \`node .bee/bin/bee_cells.mjs judge --id <id>\`. Hits (undeclared test/CI/lockfile/verify-config changes) → the cell never auto-counts toward a clean wave: record the hits in the cell trace and carry them into any review session that later covers this scope` — Judge hits flag cell for review; blocks clean-wave count |
| task-routing | Wave clean check | 53 | `A wave is clean only when every cell is capped, goal-checked, and judge-intact (or explicitly flagged and carried to review). All waves clean → completion.` — Wave state check gates move to next wave or completion |
| state-routing | [BLOCKED] Rescue Ladder: escalate in order | 59-67 | `1. **More context** — re-dispatch the same cell with the specific missing information... 2. **Stronger tier** — re-dispatch at the next model tier up (extraction → generation → ceiling)... 3. **Escalate** — surface the blocker to the user...` — Three-rung escalation ladder for [BLOCKED] cells; each rung tested in order |
| state-routing | Context budget at 65% | 70-71 | `At roughly 65% context, write \`.bee/HANDOFF.json\` (phase, feature, mode, cells_in_flight, done, remaining, next_action) and pause safely. Never push through the budget mid-wave.` — Context threshold triggers pause with HANDOFF artifact |
| state-routing | Completion signal routing by slice | 73-81 | `Swarming is complete when either: the current slice is executed and more approved work remains → return to bee-planning for the next slice, or the final slice is executed → tell the user...` — Slice completion routes to bee-planning (next slice) or bee-scribing (final) |
| task-routing | Wave parallelization: all spawns in one message | Reference swarming-reference.md, line 9 | `send all spawns of a wave in one message` — Parallelization tactic for wave dispatch |
| skill-routing | Handoff: to bee-scribing (final) or bee-planning (next slice) | 78, 109 | `Swarm execution complete for the final slice. Invoke bee-scribing skill.` or return to bee-planning for next slice — Slice status determines handoff destination |

---

### 13. `skills/bee-validating/SKILL.md`

**Routing found: YES**

| Type | Finding | Lines | Verbatim |
|------|---------|-------|----------|
| task-routing | Lane scaling: tiny/small inline, standard/high-risk full protocol | 19-20 | `For \`tiny\` and \`small\`, this skill is **not separately invoked**: the reality check runs inline inside bee-planning before the merged shape+execution gate... This skill's full protocol below applies from \`standard\` upward — \`standard\` runs the plan-checker and cell reviewer; \`high-risk\` scales the checker to a persona panel.` — Lane determines whether skill is invoked or folded inline |
| task-routing | Operating contract: 7-step workflow | 33-42 | `1. **Orient**... 2. **Reality gate**... 3. **Feasibility matrix**... 4. **Spikes**... 5. **Plan-checker subagent**... 6. **Cold-pickup cell review**... 7. **Decide** using the decision vocabulary, then ask Gate 3.` — Fixed 7-step sequence with subagent branching points |
| task-routing | Reality gate: 5 dimensional scorecard | 36 | `MODE FIT / REPO FIT / ASSUMPTIONS / SMALLER PATH / PROOF SURFACE — each scored PASS\|FAIL with file/command evidence. Fail on nonexistent code paths, unsupported commands, stale versions, missing credentials, hidden architecture work, or excess ceremony. A failed reality gate halts the pipeline and returns to bee-planning.` — FAIL on any dimension blocks pipeline; route back to bee-planning |
| task-routing | Feasibility matrix per assumption | 37 | `every blocking assumption gets a row — assumption \| risk \| proof required \| evidence \| result.` — Assumption-by-assumption structure; evidence-only acceptance |
| task-routing | Spike trigger and routing | 49-54 | `One spike answers exactly one yes/no question... **NO** → return to bee-planning with the failed assumption and the required plan change. **YES** → record the discovered constraints for planning and execution.` — Spike result (YES/NO) branches: NO → back to planning; YES → constraints recorded, continue |
| task-routing | Plan-checker subagent: max 3 structural iterations | 57-61 | `Dispatch a subagent on the \`review\` slot... It assumes the plan is flawed and verifies 5 dimensions... Every finding carries **BLOCKER** or **WARNING**. Maximum 3 structural-verification iterations; a BLOCKER still open after iteration 3 escalates to the user.` — 3-iteration loop with escalation on persistent BLOCKER |
| task-routing | Plan-checker scaling by lane | 61 | `**High-risk lane:** scale to a persona panel — coherence + feasibility lenses always, plus conditional lenses (security, product, scope-guardian) chosen by the diff of concerns.` — High-risk lanes spawn multi-persona checker wave |
| task-routing | Cell review: CRITICAL vs MINOR flags | 63-65 | `Dispatch the cell reviewer... **CRITICAL** flags — assumed context, vague acceptance, scope overload, unproven feasibility, broken verify — must be fixed before approval. **MINOR** flags may ship with a recorded note.` — Flag severity determines gate condition (CRITICAL blocks, MINOR allowed with note) |
| state-routing | Decision vocabulary and verdict routing | 67-73 | `READY / READY WITH CONSTRAINTS / NOT READY - RUN SPIKE / NOT READY - RETURN TO PLANNING. READY is a feasibility verdict, not execution approval — Gate 3 still requires the user.` — Four routing options; each has different next action |
| state-routing | Gate 3: execution approval and state write | 78-84 | `On approval, update state: \`node .bee/bin/bee_state.mjs gate --name execution --approved true\` then \`node .bee/bin/bee_state.mjs set --phase validated --summary "<summary>" --next-action "Invoke bee-swarming for the validated work."\`` — Gate 3 approval gates state transitions to validated phase |
| state-routing | Gate bypass for validating | 84 | `If \`.bee/config.json\` \`gate_bypass: true\` AND the lane is \`tiny\`/\`small\`/\`standard\` with no hard-gate flag, do not ask: take the recommendation, set \`approved_gates.execution: true\` yourself... If the lane is \`high-risk\` or the work carries any hard-gate flag..., bypass does not apply — present Gate 3 to the human` — Hard-gate/high-risk lanes bypass never applies; low-risk lanes bypass auto-approves |
| skill-routing | Handoff: to bee-swarming | 104 | `Validation complete and Gate 3 approved. Invoke bee-swarming skill.` — Always hand off to bee-swarming |

---

### 14. `skills/bee-writing-skills/SKILL.md`

**Routing found: YES**

| Type | Finding | Lines | Verbatim |
|------|---------|-------|----------|
| task-routing | TDD core cycle: RED → GREEN → REFACTOR | 20-23 | `\| TDD Concept \| Skill Equivalent \| Test case \| Pressure scenario with subagent \| Production code \| SKILL.md \| Test fails (RED) \| Agent violates rule without skill \| Test passes (GREEN) \| Agent complies with skill present \| Refactor \| Close loopholes, maintain compliance \|` — Three-phase cycle required for every skill change |
| task-routing | Phase 1 RED: write failing test | 31-40 | `1. Define the skill's purpose... 2. Create 3–5 pressure scenarios combining ≥3 pressures... 3. Run the scenarios WITHOUT the skill — give agents the realistic task under pressure. 4. Document exact rationalizations verbatim. 5. Identify patterns: which excuses repeat?` — RED phase: 5-step scenario discovery without skill |
| task-routing | Phase 2 GREEN: write minimal skill | 42-90 | `Write SKILL.md addressing the **specific rationalizations documented in RED only.**... After writing: re-run the same pressure scenarios WITH the skill. The agent must now comply. Still failing → the skill is unclear or incomplete. Revise and re-test. Do not proceed.` — GREEN phase: skill written, re-tested; failure loops back to revision |
| task-routing | Phase 3 REFACTOR: close loopholes | 92-102 | `An agent violating a rule despite having the skill is a test regression — the skill has a bug... **Meta-testing technique:** after an agent chooses wrong, ask: "You read the skill and chose Option C anyway. How could the skill have been written differently..." Three diagnoses: "The skill WAS clear, I chose to ignore it" → add "Violating the letter of the rules..."... "The skill should have said X" → add their exact suggestion... "I didn't see section Y" → make the key point more prominent...` — Three branches based on root cause; each triggers specific skill revision |
| task-routing | Phase 4 VALIDATE: manual checks and CREATION-LOG | 108-120 | `Manual checks (every item, every time): frontmatter parses and starts on line 1; \`name\` = directory; description is trigger-only;... If the skill owns a repo-local test script, run it and quote the output.` — Validation checklist; test script output required |
| skill-routing | Handoff: to bee-hive | 153 | `Skill pressure-tested, validated, and logged. Invoke bee-hive skill.` — Always hand off to bee-hive |

---

### 15. `skills/bee-xia/SKILL.md`

**Routing found: YES**

| Type | Finding | Lines | Verbatim |
|------|---------|-------|----------|
| task-routing | Depth selection: Quick / Standard / Deep | 32-34 | `\`Quick\` / \`Standard\` / \`Deep\` — mirroring planning's L1/L2/L3. Quick: one API/version/behavior confirmed. Standard (default): the full four-step flow. Deep: cross-cutting, version-sensitive, or architecture-heavy territory. If unsure, Standard.` — Uncertainty level routes to research depth |
| task-routing | Flow order: Stack Ledger → Local Reuse → Upstream Patterns → Current Docs | 36-43 | `1. **Stack ledger** — classify the repo and map languages, frameworks, and *installed versions*... 2. **Local reuse** — search feature-adjacent code, tests, scripts, config, docs... 3. **Upstream patterns** — only after local evidence is clear... 4. **Current official docs** — version-matched to the repo. When local behavior and docs disagree, local behavior is current truth; record the mismatch.` — Fixed 4-step sequence; later steps only after prior ones complete |
| task-routing | Evidence labeling: Local / Upstream / Docs / Inference | 45-54 | `\| Label \| Meaning \| Local \| proven from this repository's files or command output \| Upstream \| observed in a public repository or official starter \| Docs \| stated by official, version-matched documentation \| Inference \| concluded from the above; not directly observed \|` — Every claim labeled by evidence source; Inference flagged as second-hand |
| task-routing | Recommendation ladder: Reuse → Built-in → Adapt → Build | 56-65 | `Lightest credible path, in order; each skipped rung needs a stated reason: 1. **Reuse**... 2. **Built-in**... 3. **Adapt**... 4. **Build**... State why the chosen rung beats the next-best alternative, and what evidence would change the recommendation.` — Rung selection with fallthrough reasoning required |
| task-routing | Output routing: in-chain vs standalone | 67-72 | `**In-chain** (invoked from \`bee-planning\` discovery L2/L3): no separate file — findings merge into the feature's \`approach.md\`... **Standalone** (no feature underway): write \`docs/history/research/<topic-slug>.md\`... suggest the next step — \`bee-exploring\` if the topic is becoming a fuzzy feature, \`bee-planning\` if scope is already clear.` — Invocation context (in-chain vs. standalone) determines output artifact location and format; suggests next skill |
| skill-routing | In-chain handoff: to bee-planning | 93 | `In-chain: findings merged into \`approach.md\`. Return to bee-planning.` — In-chain research returns to planning |
| skill-routing | Standalone handoff: suggest bee-exploring or bee-planning | 94 | `Standalone: brief written to \`docs/history/research/<topic-slug>.md\`. Suggest bee-exploring or bee-planning as the next step; the user chooses.` — Standalone research offers routing choice to user |

---

## Reference Files Summary

### `bee-hive/references/routing-and-contracts.md`

**Routing found: YES — core routing infrastructure**

| Type | Finding | Line range | Summary |
|------|---------|-----------|---------|
| skill-routing | Skill catalog and first-skill routing table | 7-41 | 14-skill catalog + routing table deciding which skill to invoke first based on request type; includes explicit routes for new features, research, small fixes, review, documentation, cleanup, learning capture, skill authoring, and bee self-evolution |
| state-routing | State bootstrap on session start | 45-68 | Sequence: confirm onboarding, run bee_status.mjs, check HANDOFF.json, read critical-patterns, surface recent decisions, check active reservations; default state.json shape shown |
| state-routing | Resume logic: HANDOFF.json presence gates | 72-79 | If HANDOFF.json exists, present and wait for confirmation; never auto-resume |
| state-routing | Scout contract: reading budgets by lane | 84-92 | Token budgets and reading order specified per lane (tiny/small ≈2K, standard ≈5K, high-risk ≈10K); spec→decisions→history order required |
| state-routing | Chaining contract: read/write per skill | 97-111 | For each skill, lists what it reads and writes; defines single source of truth: cells and PBI rows in repo, never session todo list |
| state-routing | Gate presentation contract: human layer + machine layer | 152-168 | Gates presented in chat (plain language) with linked report; user must restate approval in own words (litmus test) |
| state-routing | Gate bypass: safety floor (high-risk/G4/privacy exempt) | 170-183 | Bypass auto-approves Gates 1-3 for eligible lanes only; high-risk/hard-gate/G4 UAT/privacy always stop; audit logged; silent bookkeeping rule |
| state-routing | Delegation contract: decide-altitude on orchestrator, gather on I/O workers | 185-193 | D2 rubric: >3 files or digest-only → delegate down-tier; D3 lane rule applies everywhere; I/O workers exempt from ceremony caps; audit logged |
| task-routing | Question format: CONTEXT → QUESTION → RECOMMENDATION → options | 195-206 | Standard format for all gate and Socratic questions; one question per message; never bundle |
| state-routing | Priority rules and file quick reference | 144-233 | 11 priority rules codifying core invariants; file/helper CLI reference |

### `bee-swarming/references/swarming-reference.md`

**Routing found: YES**

| Type | Finding | Lines | Summary |
|------|---------|-------|---------|
| task-routing | Worker prompt template | 95-128 | Standard template structure: identity, inputs, contract, startup sequence; includes optional Advisor line when degenerate check passes |
| task-routing | Model tiers config-driven: extraction/generation/review/ceiling | 26-50 | Tiers keyed by runtime (Claude vs Codex); ceiling always = session model; null tier means prompt-enforced budget; per-agent reasoning effort supported (P17) |
| task-routing | External executor dispatch: CLI workers | 54-90 | Dispatch to external CLIs (GPT/GLM/Kimi) via prompt file + result.json transport; goal-check always re-runs verify; rescue via resume-then-re-dispatch pattern (max 2 failed resumes before escalation) |
| state-routing | Result formats: [DONE] / [BLOCKED] / [HANDOFF] / [NOOP] | 134-170 | Four status tokens with field spec; orchestrator updates cell state and clears worker registry on each result |
| state-routing | Handoff.json near 65% context | 172-179 | Template with phase, feature, mode, cells_in_flight, done, remaining, next_action, written_at; includes resume commands |

### `bee-executing/references/worker-details.md`

**Routing found: YES**

| Type | Finding | Lines | Summary |
|------|---------|-------|----------|
| state-routing | Assigned cell check preconditions | 28-37 | Status must be `open`, all deps capped, files clear, verify runnable, no decision conflict; [NOOP] if unavailable; [BLOCKED] if ambiguous |
| state-routing | Trace field tiers by lane | 39-47 | Trace depth scales by lane (tiny = one-line outcome; small = outcome+files; standard = +deviations+friction when triggered; high-risk = full + spike evidence + verification_evidence; behavior_change = mandatory evidence) |
| task-routing | Friction triggers: 6 verbatim conditions | 49-58 | Triggers: inferred missing rule, unclear/expensive validation, stale/contradictory doc, repeated manual step, out-of-scope but important, unattributable failure; record only when triggered |
| state-routing | verification_evidence structure and red_failure_evidence capture | 60-88 | Evidence object structure (tests_inspected, tests_added_or_changed, red_failure_evidence, verification_run, deliberate_exceptions); red_failure_evidence captured at cap time via git show of prior state; evidence lives in trace only, never parallel files |

### `bee-planning/references/planning-reference.md`

**Routing found: YES**

| Type | Finding | Lines | Summary |
|------|---------|-------|----------|
| task-routing | Artifact fan-out: separate file earned by discovery level and lane | 5-16 | plan.md always; discovery separate at L2+ (L0/L1 inline section); approach separate at high-risk or L2+ (small/standard inline section); implement-plan via bee-briefing only when warranted (high-risk mandatory, standard on-demand, small optional, tiny/spike none) |
| task-routing | Shape bodies by mode | 90-95 | Mode determines body: tiny/small = direct note; spike = one yes/no question; standard = phase plan or epic map (capability-driven); high-risk = epic map (risk areas) |
| task-routing | Phase plan vs epic map selection | 97-99 | Phases if work has observable user-demo milestones in order; epic map for capability/risk areas or high-risk (default); never force phases as architecture layers |
| state-routing | Cell quality rules and batch creation | 101-152 | Cell discipline: directive action (no code), bounded files, testable exit, must_haves (truths/artifacts/links/prohibitions), behavior_change honesty, real deps, current slice only, evidence in trace (no parallel evidence files); batch creation all-or-nothing via stdin |

---

## Findings Summary by Routing Kind

### State-routing (state transitions within workflows)

1. **Mode gates** (bee-hive, bee-planning, bee-validating): Risk flag counting → lane (tiny/spike/small/standard/high-risk)
2. **Lane-scaled ceremony** (bee-hive): Lane → depth of planning, validation, execution, review
3. **Gate conditions** (bee-hive, bee-exploring, bee-planning, bee-validating, bee-reviewing): Approval gates trigger state transitions; Gate 4 lives only in review sessions
4. **Gate bypass safety floor** (bee-bypass-gate, bee-hive): High-risk/hard-gate/G4 UAT/privacy exempt; low-risk Gates 1-3 auto-approved
5. **Advisor consultation** (bee-executing, bee-swarming): First serious verify failure + Advisor line present → consult (max 2 per claim); no Advisor line → proceed to [BLOCKED]
6. **Spike routing** (bee-validating): NO result → back to bee-planning; YES result → record constraints, continue
7. **Plan-checker iterations** (bee-validating): Max 3 structural iterations; BLOCKER still open after iteration 3 → escalate to user
8. **Verification evidence gate** (bee-reviewing): Missing/vague evidence → P1 finding; works rejected; P1 > 0 blocks merge
9. **Artifact maturity levels** (bee-reviewing): EXISTS+SUBSTANTIVE+WIRED=OK; missing/EXISTS-only=P1; route by maturity
10. **Frozen judge check** (bee-swarming): Judge hits flag cell; blocks clean-wave count
11. **Context budget** (bee-swarming, bee-executing): At ~65% context, pause and write HANDOFF.json
12. **Backlog state transitions** (bee-exploring, bee-scribing): Feature matches → flip row to `in-flight`; scribing closes → flip row to `done`
13. **Capture mode lane-scaling** (bee-scribing): High-risk = immediate spec merge; others = queue stub for flush
14. **Flush points** (bee-scribing): Three predetermined points (wrap-up, PreCompact warning, session-start offer); oldest-first ordering
15. **Phase transitions** (bee-hive, bee-planning, bee-validating, bee-swarming, bee-scribing, bee-compounding): Each skill records phase change via bee_state.mjs set command

### Task-routing (choosing modes/workflows within skills)

1. **Brief rendering by lane** (bee-briefing): Ceremony scales with lane; tiny/spike none, small optional, standard on-demand, high-risk mandatory
2. **Brief modes** (bee-briefing): render/refresh/walkthrough/on-demand based on trigger
3. **Scribing modes** (bee-scribing): sync/capture/flush/harvest/bootstrap routed by trigger
4. **Discovery level** (bee-planning): L0-L3 routes to separate file (L2+) or inline section (L0/L1)
5. **Approach artifact routing** (bee-planning): High-risk or L2+ → separate file; else → inline section
6. **Plan.md shape by mode** (bee-planning): tiny/small = direct note; spike = yes/no question; standard = phase plan or epic map; high-risk = epic map
7. **Solo vs worker execution** (bee-swarming): tiny/small = solo in-session; standard/high-risk = spawn workers
8. **Wave parallelization** (bee-swarming): Dep/file analysis determines parallel grouping and wave ordering
9. **Model tier judgment** (bee-swarming): Cell characteristics (lane, action, must_haves, files) → extraction/generation/ceiling
10. **Scope resolution** (bee-reviewing): Five scope types (feature, list, unreviewed batch, range, time window) routed to session creation
11. **Reviewer dispatch** (bee-reviewing): Diff scanned for conditional triggers (performance, api-contract, data-migration, reliability); all matched reviewers spawned (capped at 6)
12. **Delta re-review** (bee-reviewing): P1 fix triggers minimal delta re-review (not full panel) unless boundary crossed
13. **Analyst subagents** (bee-compounding): Three parallel analysts (pattern extractor, decision analyst, failure analyst) for parallel finding synthesis
14. **Friction triggers** (bee-executing): Six conditions; record friction only when triggered
15. **Xia depth and flow** (bee-xia): Depth (Quick/Standard/Deep) and 4-step flow (Stack Ledger → Local Reuse → Upstream → Docs) with evidence labeling

### Skill-routing (which skill runs next)

1. **bee-hive entry routing** (routing-and-contracts.md): Vague feature → bee-exploring; clear scope → bee-planning; research → bee-xia; review request → bee-reviewing; documentation → bee-scribing; cleanup → bee-grooming; learnings → bee-compounding; skill authoring → bee-writing-skills; self-evolution → bee-evolving
2. **bee-exploring → Gate 1 → bee-planning**: Always hand off to bee-planning after context locked
3. **bee-planning → tiny/small to bee-swarming; others to bee-validating**: Lane determines handoff destination
4. **bee-validating → bee-swarming**: Gate 3 approval gates handoff to swarming
5. **bee-swarming → bee-scribing (final slice) or bee-planning (next slice)**: Slice completion determines routing
6. **bee-reviewing → bee-briefing (walkthrough) or bee-scribing (if behavior settled)**: Session close routes by artifact type
7. **bee-scribing → bee-compounding**: Always hand off to compounding after sync/capture/harvest/flush
8. **bee-compounding → bee-hive**: Always hand off to bee-hive after learnings captured and state guarded
9. **bee-grooming → bee-compounding**: Always hand off to compounding after kills executed and outcomes recorded
10. **bee-executing → bee-swarming parent**: Worker returns status token; parent decides next routing
11. **bee-evolving → bee-hive**: Loop complete or stopped; hand off to bee-hive
12. **bee-writing-skills → bee-hive**: Skill tested and validated; hand off to bee-hive
13. **bee-xia in-chain → bee-planning**: Findings merged into approach.md; return to planning
14. **bee-xia standalone → user chooses bee-exploring or bee-planning**: Brief written; user picks next step
15. **bee-bypass-gate → current workflow or bee-hive**: Route depends on context (in-progress or idle)

---

## Unresolved Questions

None. All 15 SKILL.md files and all 4 reference files contain routing mechanisms. Coverage is complete.

---

## Coverage Status

| Type | Total Files | Routing Found | Files with Routing |
|------|-------------|---------------|--------------------|
| SKILL.md files | 15 | YES | All 15 |
| Reference files | 4 | YES | All 4 (routing-and-contracts.md, swarming-reference.md, worker-details.md, planning-reference.md) |
| **Total** | **19** | **YES** | **19/19 (100%)** |

---

## Report Completion

Status: DONE  
Summary: Comprehensive routing inventory completed across all 15 beegog skills and 4 reference files. All three routing kinds (state-routing, task-routing, skill-routing) identified with verbatim quotes and line numbers. No gaps found.  
Concerns: None.
