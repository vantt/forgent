# Gather table: one owner per fgOS rule

Built on the tree at commit 900ca945d (branch gather-rules/p01). Every line range below was re-read on this tree by
searching for the copy's text; the line numbers in the P2 report have drifted and are not reused. Method and corpus:
`plans/reports/research-261125-1601-fgos-rule-duplicates-and-conflicts.md`.

## 0. Conventions used in this table

- **Unit path.** A unit is one Markdown file in one of the three roots (`core/instructions/`,
  `components/<component>/instructions/`, `domains/<domain>/instructions/`). `owner:` is an id of the authority model
  (`packages/component-authority/model/components.yaml`); the root follows the owner. The two existing precedents use
  `owner: core` (repo-wide) and `owner: coding` (domain); both stay for repo-wide and coding rules.
- **No `when:`.** Every new unit has no `when:` key, so the rendered `AGENTS.md` keeps carrying the rule. Scoping is a
  later step and not part of this table.
- **Pointer form.** The line that replaces a copy is `Rule: <unit-id> (in AGENTS.md; set in .fgos/instructions/effective/rules.json).`
  followed by, only when the copy carries something the owner does not, that one local clause. A copy that adds nothing
  is deleted and the pointer goes in its place. The table writes the id after an arrow: `-> dispatch-decide-door`.
- **Owner shapes.** `UNIT` = a new or existing rule unit. `PERSONA` = a persona file stays the owner (section 6, risk 1).
  `SKILL-REF` = the rule lives inside one skill family and stays there (owner question 2, recommendation assumed).
- Line ranges are inclusive and written `file:from-to`; `core/skills/` is shortened to `S/`, `S/_shared/` to `S/_s/`.
- Severity labels C1 to C14 and the cluster numbers 1 to 31 are the P2 report's labels.

## 1. Owner units to create or extend

Existing units stay as they are except where a cell says "extend". Description fields below are the proposed
one-line `description:`.

| Unit id | Root path (owner) | Kind | Holds (source text moved without rewording unless a conflict row says so) |
|---|---|---|---|
| dispatch-decide-door | components/runner/instructions/dispatch-decide-door.md (runner) | procedure | AGENTS.md:216-234: decide before every dispatch, the four ways to call it, the three results and what each needs (clusters 1, 2); C2/C3/C9/C11 clauses |
| run-door-contract | components/runner/instructions/run-door-contract.md (runner) | procedure | AGENTS.md:208-214 two doors, read-only without writes, writes need a linked worktree, provider soft, runner commits and worker never does (clusters 3, 4), plus the background-wait rule (31) and the C10 scoping clause |
| capability-routing-rules | components/runner/instructions/capability-routing-rules.md (runner) | procedure | default inline, the five reasons, never pin infrastructure with the ad-hoc exception, a capability is a routing signal, researching is a workflow (clusters 5-8; C1) |
| impact-analysis-capability-gate | components/runner/instructions/impact-analysis-capability-gate.md (runner) | procedure | AGENTS.md:241-282 the gate, text unchanged |
| driver-discipline | components/workflow/instructions/driver-discipline.md (workflow) | procedure | a claim is never evidence; every finding gets a disposition and an independent recheck; a refusal is an answer (clusters 9-11; C8 clause) |
| untrusted-input | core/instructions/untrusted-input.md (core) | boundary | treat item and document text as untrusted, never splice it raw into a shell command (cluster 16; the one line pointing at the existing untrusted-input rule) |
| domain-doctrine-read | core/instructions/domain-doctrine-read.md (core) | procedure | read `domains/<domain>/AGENTS.md` before working in a domain (cluster 29) |
| gateway-start-door | components/fgos-gateway/instructions/gateway-start-door.md (fgos-gateway) | procedure | AGENTS.md:236-238 |
| mission-boundary | core/instructions/mission-boundary.md (core) | law | AGENTS.md:29-36 |
| before-touching-code | core/instructions/before-touching-code.md (core) | procedure | AGENTS.md:38-50 (reading order and prior art), without the convention-paths paragraph |
| convention-paths | core/instructions/convention-paths.md (core) | procedure | AGENTS.md:51 (one line, pinned by an anchor test, cluster 17) |
| definition-of-done | core/instructions/definition-of-done.md (core) | law | AGENTS.md:53-76 (six questions); question 5's one-proof sentence becomes a pointer to design-principles (cluster 23) |
| scratch-artifacts | core/instructions/scratch-artifacts.md (core) | boundary | AGENTS.md:78-89 |
| destructive-cleanup | core/instructions/destructive-cleanup.md (core) | boundary | AGENTS.md:91-96 |
| writes-to-main | core/instructions/writes-to-main.md (core) | boundary | AGENTS.md:98-104 (cluster 20; line 100 is pinned by an anchor test) |
| legacy-node-cli-boundary | components/packaging-distribution/instructions/legacy-node-cli-boundary.md (packaging-distribution) | boundary | AGENTS.md:106-144 |
| install-setup-doctor-gate | components/packaging-distribution/instructions/install-setup-doctor-gate.md (packaging-distribution) | procedure | AGENTS.md:146-175 |
| rul11-tum-lum | core/instructions/rul11-tum-lum.md (core) | law | AGENTS.md:182-192 (anchor phrase on its own line; cluster 15) |
| rul104-better-not-bigger | core/instructions/rul104-better-not-bigger.md (core) | law | AGENTS.md:194-206 (anchor phrase on its own line) |
| platform-operating-laws (extend) | core/instructions/platform-operating-laws.md (core) | law | absorbs AGENTS.md:177-180 "Changing a locked law" (new duplicate found, section 5) |
| design-principles (extend) | core/instructions/design-principles.md (core) | procedure | owner of clusters 23 and 30; fix the description from seven to eight principles (C13) |
| id-minting, coding-verification-discipline, decision-question-template | existing | - | owners of clusters 18, 24, and the law line of 14/15 as they stand; no text change except pointers into them |

Not moved (and why):

| AGENTS.md lines | Section | Disposition |
|---|---|---|
| 1-15 | title, intro, documentation index | stays: navigation, one line per pointer; the only behavioural line (line 10, read the program board only when starting, finishing, blocking or landing a lane) is stated nowhere else |
| 17-27 | Product priority order | PARKED (section 3): it is the owner text of clusters 12 and 13 |
| 240-313 area `mdview` markers, 315-358 GitNexus block, 360-459 projection block, 461-826 AgentKit blocks | tool-owned or generated | out of scope; see risk 6 for the stray marker at line 240 |

## 2. Duplicate clusters 1 to 31

Clusters 12, 13, 14 and 19 are listed in section 3 and nothing of them moves. Everything else is below.

| # | Rule | Owner (shape, id, path) | Copies: path:lines -> pointer (or stays) |
|---|---|---|---|
| 1 | decide before every dispatch; never choose the mechanism yourself | UNIT dispatch-decide-door | AGENTS.md:216-217 (moves into the unit, then cut); S/_s/capability-matching.md:42 (the "never decides the mechanism itself" sentence) -> dispatch-decide-door; S/_s/capability-matching.md:57 (no double decide; keep `decide-before-execute`, risk 4) -> dispatch-decide-door; S/_s/executor-dispatch-fallback.md:106-111 (Step B: deciding a second time) -> dispatch-decide-door; S/_s/executor-dispatch-fallback.md:268-271 (mechanism stays decide's own) -> dispatch-decide-door |
| 2 | what to do for each decide result; tool executor refused as provider; capability defaults to execute | UNIT dispatch-decide-door | AGENTS.md:229-231 (into the unit, then cut); S/_s/executor-dispatch-fallback.md:72-80 -> dispatch-decide-door; :119-121 -> dispatch-decide-door; :123-125 -> dispatch-decide-door; AGENTS.md:234 rewritten per C11 |
| 3 | the `fgos run` door: read-only without writes, writes need a linked worktree, provider is a soft preference | UNIT run-door-contract | S/fgos-run/SKILL.md:25 (the two sentences; the command syntax stays) -> run-door-contract; AGENTS.md:212 (into the unit, then cut); S/_s/capability-matching.md:46 (keep the one-liner and `--writes`, pinned by a doctrine test, risk 3) and :49 (`--provider` soft preference, keep) -> run-door-contract added after them; S/_s/executor-dispatch-fallback.md:125-127 -> run-door-contract |
| 4 | worker edits and never runs git add or git commit; runner commits only declared writes | UNIT run-door-contract | S/fgos-run/SKILL.md:81 (the rule; the "brief lists its write scope" part stays) -> run-door-contract; AGENTS.md:212, :231 (into the unit, then cut); S/_s/coding-worker-contract.md:104-106 -> run-door-contract; S/_s/cook-worker-contract.md:25 (keep the extra bans on push, branch, worktree) -> run-door-contract |
| 5 | five valid reasons justify an executor | UNIT capability-routing-rules | S/_s/capability-matching.md:17, :34-40 (owner text, into the unit; the file keeps the Q0/Q1/Q2 table and points), :49 (the "only for one of the five reasons" clause); S/_s/executor-dispatch-fallback.md:44-50 -> capability-routing-rules |
| 6 | plans, Units and prompts never pin an executor, provider, model or tier (ad-hoc Unit may carry a soft prefer, C1) | UNIT capability-routing-rules | S/_s/capability-matching.md:27 and :56; S/_s/planning-capability-awareness.md:61-64; S/fgos-run/SKILL.md:80 (keep the "G2" word and the prefer exception, pinned, risk 3); S/fgos-advise/SKILL.md:141-143 and :171-172; S/fgos-advise/references/request-kinds-and-routes.md:94-95 (text continues past the cut; step 3 re-reads it) -> capability-routing-rules |
| 7 | a capability is a routing signal, never a Work item, stage, skill or executor name | UNIT capability-routing-rules | S/_s/capability-catalog.md:22 (owner text; the catalog keeps the vocabulary and points); S/_s/capability-matching.md:58; S/_s/planning-capability-awareness.md:43-46 -> capability-routing-rules |
| 8 | researching is a workflow, never a capability; no `research` capability may be registered | UNIT capability-routing-rules | S/_s/capability-catalog.md:114-119 (owner text, into the unit); S/fgos-researching/SKILL.md:28-30 -> capability-routing-rules (the skill keeps its own "this skill is a workflow" sentence as the pointer's local clause) |
| 9 | a worker's or agent's own claim is never evidence; the driver checks the artifact itself | UNIT driver-discipline | S/_s/coordination-driver.md:57-59 (owner text, into the unit); S/_s/coding-worker-contract.md:97-101 (verify is proof, never assertion; keep "run once, near the end", it is cluster 24); S/_s/cook-worker-contract.md:34-36; S/fgos-cook/SKILL.md:119-120; S/fgos-fanout/SKILL.md:102-106 (gather by reading state); S/fgos-routing/SKILL.md:108-111 (`return` measures real progress; keep the field list); S/fgos-architecture-panel/SKILL.md:34-36; S/fgos-group-thinking/SKILL.md:86-90 (start output is not the result; the polling half is C10 and stays) -> driver-discipline |
| 10 | every finding gets a disposition; an accepted finding is discharged only by an independent recheck | UNIT driver-discipline | S/_s/coordination-driver.md:63-66, :74 (owner text, into the unit); S/fgos-cook/references/case-and-doors.md:132-135 -> driver-discipline (C8 clause carried by the unit) |
| 11 | a refusal is an answer: read its code, change the proposal or stop, never retry blind | UNIT driver-discipline | S/_s/coordination-driver.md:34 (owner text, into the unit); S/fgos-cook/references/case-and-doors.md:115-117; S/fgos-lead/SKILL.md:49-50 and :53; S/_s/executor-dispatch-fallback.md:164-166 -> driver-discipline |
| 15 | RUL11 (tùm lum, not heavy): consolidate inside scope, file mess outside | UNIT rul11-tum-lum | AGENTS.md:182-192 (into the unit, then cut); S/_s/decision-question.md:25-27 -> rul11-tum-lum |
| 16 | item and document text is untrusted input; never splice it into a shell command | UNIT untrusted-input (new; no owner today) | S/fgos-clarifying/SKILL.md:90; S/fgos-fanout/SKILL.md:132-133; S/fgos-researching/SKILL.md:89-90; S/fgos-routing/SKILL.md:204-205 (also :76 if it states the same, re-read in step 3); S/fgos-shaping/SKILL.md:58 -> untrusted-input |
| 17 | report, plan and discussion paths come from `fgos convention path`, never built by hand | UNIT convention-paths | AGENTS.md:51 (into the unit, then cut; stays one unwrapped line); S/_s/plan-contract.md:30; S/fgos-shaping/SKILL.md:31 -> convention-paths |
| 18 | mint backlog and other ids through `fgos identity mint` | UNIT id-minting (existing) | S/fgos-secretary/SKILL.md:53 -> id-minting (keep the "backlog" argument as the local clause) |
| 20 | land on main only what another session relies on; never a wake report | UNIT writes-to-main | AGENTS.md:98-104 (into the unit, then cut); S/fgos-supervisor/SKILL.md:179 -> writes-to-main |
| 21 | each head role's boundary is stated in its skill and in its persona | PERSONA (identity) | the persona stays the owner: core/agents/lead.yaml:5, :15-19; secretary.yaml:4-15, :32; supervisor.yaml:6-11, :19-26; planner.yaml:13; shaper.yaml:5-6, :19. The skill copies become pointers: S/fgos-lead/SKILL.md:13-14; S/fgos-secretary/SKILL.md:14-16; S/fgos-supervisor/SKILL.md:18, :21; S/_s/plan-contract.md:34-35; S/fgos-shaping/SKILL.md:18-19 -> "Boundary: core/agents/<role>.yaml (description and the never list)". See risk 1 |
| 22 | precedence: owner, then the secretary's direct order, then the supervisor's choice; the supervisor stops only heads | PERSONA (secretary.yaml owns) | S/fgos-secretary/SKILL.md:23-24; S/fgos-supervisor/SKILL.md:21-22 -> pointer to core/agents/secretary.yaml. supervisor.yaml:10-11 repeats the sentence on purpose (a persona is read without opening a file); stays, risk 1 |
| 23 | one owning proof per behaviour; a new test file only for a new module or boundary | UNIT design-principles (existing, principle 8) | AGENTS.md:65-71 (the sentence inside question 5, in the definition-of-done unit) and S/fgos-run/SKILL.md:90-95 (the review checklist: keep the four numbered checks, which are procedure, and replace only the restatement in line 90) -> design-principles |
| 24 | run the declared verify once near the end; full suite only for declared gates | UNIT coding-verification-discipline (existing) | S/_s/coding-worker-contract.md:97-101 (the "once, near the end" clause) -> coding-verification-discipline |
| 25 | fgos-advise picks the route, group-thinking runs it; four conditions for asking; `--seats` only on four bases | SKILL-REF S/fgos-advise/references/request-kinds-and-routes.md:86-96 | S/fgos-advise/SKILL.md:20, :51-56, :69-72; S/fgos-group-thinking/SKILL.md:20, :126-128 -> pointer to the reference. Stays inside the skill family: no second skill states a different rule, so a unit would add always-loaded bytes for a rule one family owns |
| 26 | fanout mechanics repeated in skill and reference: advisory pre-check, first wave only, approval in the merge ranking, report-once | SKILL-REF S/fgos-fanout/references/wave-dispatch-mechanics.md | S/fgos-fanout/SKILL.md:51, :121-123, :186, :235-237 -> pointer to the reference (the reference's lines 40, 37, 89, 8-14); same skill family, stays |
| 27 | distill rules: never rename a slug, never re-scan, human decides porting and taxonomy, no search infrastructure | SKILL-REF S/distill/SKILL.md red-flags list (:152-161) | S/distill/references/extract-rules.md:29-30, :34-36, :73-77; S/distill/references/deep-dive-protocol.md:24; S/distill/references/consult-protocol.md:87; S/distill/SKILL.md:119-122, :134 -> pointer to the red-flags list; same skill, stays |
| 28 | panel prompts: calibrate uncertainty per claim; never read a shaper's private notes | STAYS in each prompt template | core/prompt-templates/architecture-advisory-panel-v1-synthesis.md:19, -interpretation.md:11 and :18-20, -critique.md:16-17. Reason: each template is a separate model call with no file access, so a pointer would drop the rule from the prompt; sharing the text needs template composition, a new mechanism (RUL11 says a gather that needs a new tool is a decision question). Listed as an owner idea in the report, not done |
| 29 | read `domains/<domain>/AGENTS.md` before working in a domain | UNIT domain-doctrine-read | S/fgos-routing/SKILL.md:180-181; S/fgos-shaping/SKILL.md:27; AGENTS.md:15 stays (index line) -> domain-doctrine-read |
| 30 | generated text is regenerated from its source, never hand-copied or hand-merged | UNIT design-principles (existing, principle 7) | S/_s/plan-contract.md:104-106 (keep the hot-files sentence, drop the restatement); S/instruction-audit/SKILL.md:122-124 (it is the audit's own check; keep the check, point for the rule) -> design-principles |
| 31 | run a long call in the background and wait for the harness notification | UNIT run-door-contract | S/_s/executor-dispatch-fallback.md:132-136 (owner text, into the unit); S/fgos-fanout/references/wave-dispatch-mechanics.md:49-53 -> run-door-contract |

Same-skill and same-family rows (25, 26, 27, 28) are the "stays" rows for owner question 2; so are the rules stated
in exactly one skill, none of which is listed (no change) as they have no second copy.

## 3. PARKED on owner question 1 (the draft communication-standard plan also rewrites the asking-a-person doctrine)

Nothing here moves in any later step. The recommendation recorded in plan.md is that the other plan lands first.

| Item | Rule | Copies on this tree | What would move once answered |
|---|---|---|---|
| 12 | ask a person only when the work truly needs it, batch, use the decision-question template, keep independent work moving | AGENTS.md:20; S/_s/coordination-driver.md:52, :76; S/fgos-cook/SKILL.md:55-59; S/_s/plan-contract.md:135; S/fgos-secretary/SKILL.md:51 | the Product priority order section (AGENTS.md:17-27) to a unit `product-priority-order` (owner platform-foundations, core root); copies become pointers to it |
| 13 | when the agent's own analysis settles a choice, decide and report | AGENTS.md:21; S/_s/plan-contract.md:77; S/_s/coordination-driver.md:35; S/fgos-architecture-panel/SKILL.md:114; S/fgos-advise/SKILL.md:43-45 | same unit; four pointers |
| 14 | the approved frame may be narrowed, never widened | S/_s/decision-question.md:28-30; AGENTS.md:20; S/fgos-cook/SKILL.md:122-123; S/fgos-cook/references/reading-ak-plans.md:48-50 | owner stays `decision-question-template`'s fragment; three pointers |
| 19 | owner questions go only through `fgos questions ask` in the five-part form | S/_s/decision-question.md:47-50; S/fgos-shaping/SKILL.md:90; S/_s/plan-contract.md:77 | pointers to the same fragment |
| C7 | one question per turn (shaping) vs batch the questions (priority 2, driver, advise) | S/fgos-shaping/SKILL.md:44 vs AGENTS.md:20, S/_s/coordination-driver.md:52, S/fgos-advise/SKILL.md:51-56 | one kept rule for the conversational case; shaping:90 already sends formal questions to the store |

Files that belong only to parked items and are not edited: the lines named above in plan-contract.md,
coordination-driver.md (:35, :52, :76), fgos-cook/SKILL.md (:55-59, :122-123), reading-ak-plans.md, decision-question.md
(:28-30, :47-50), fgos-secretary (:51), fgos-advise (:43-45, :51-56) and fgos-shaping (:44, :90). Other lines in the same
files are edited by other rows; a batch that touches such a file touches only its own lines.

## 4. Conflicts C1 to C14

SETTLED: the evidence decides it and no owner decided otherwise. OWNER QUESTION: the evidence does not settle it, or
the choice changes a behaviour an owner already decided. Commit body line for each: "C<n>: kept <rule>, because <evidence>".

| # | Statements (path:lines) | Kept | Evidence | Status |
|---|---|---|---|---|
| C1 | S/_s/capability-matching.md:27 and :56 (Units never pin, `prefer` in the forbidden list) vs S/fgos-run/SKILL.md:80 and :37, S/_s/capability-matching.md:49, AGENTS.md:212 (an ad-hoc Unit may carry a soft prefer or `--provider`) | the ad-hoc exception: plans and non-ad-hoc Units never pin; an ad-hoc Unit may carry a soft `prefer` or `--provider`, only for one of the five reasons. Written once in capability-routing-rules | `test/docs/run-doors-doctrine.test.mjs:32-48` asserts the G2 line mentions `prefer` and refuses the stale "Units never pin" sentence; capability-matching.md:49 says the same in its own file; the decide contract treats a provider as a soft preference (`docs/platform/runner/contracts/executor-model.md` section 7) | SETTLED |
| C2 | AGENTS.md:229 and S/_s/capability-matching.md:32, :42 (unavailable is not an error: do it inline, report nothing) vs S/fgos-cook/references/case-and-doors.md:69-70 (unavailable is a blocker to ask about) and S/fgos-fanout/SKILL.md:84-85, wave-dispatch-mechanics.md:64 (report to the caller as needing a person) | for AGENTS.md and the matching fragment: inline. For the cook door and fanout: question below | executor-model.md section 7 answers `unavailable` for a name nothing serves and calls no error; `src/runner/fanout-batch.mjs:74-75, :172, :187` returns such ids under `unavailable` and the loop's report-once bound depends on it. Evidence does not say whether the cook guide's "blocker to ask about" was chosen on purpose | OWNER QUESTION |
| C3 | AGENTS.md:216 (decide first, including your own Agent/Task call; a hook enforces it) vs S/fgos-researching/SKILL.md:69-75 (every fan-out branch goes to the native Task tool, no decide round trip) | AGENTS.md:216; researching is reworded to "the PreToolUse hook is the decide for each Task call; no purpose check of its own" | executor-model.md section 8: the hook runs `decide --for <subagent type> --needs-soul --has-live-task-access` for every Agent or Task call and blocks unless `in-process`; section 7: an unregistered name answers `in-process` under `--needs-soul`. So the fan-out passes with no extra call and the two statements are one rule | SETTLED |
| C4 | AGENTS.md:216, :231 and S/_s/capability-matching.md:49 (decide first; `--provider` only for one of five reasons) vs S/fgos-lead/SKILL.md:51-52 (always `--provider <id>`, "only these pass", no decide) | `--provider` is optional and soft; the lead names it only for one of the five reasons and otherwise omits it; `fgos run` binds itself | AGENTS.md:212 and :231, capability-matching.md:49, the doctrine test line 44-48. NOT verified in this read: that the lead's sandbox accepts `fgos run` without `--provider` (no match in `src/session-host/head-grants.mjs`). Step 3 runs that check first; if the sandbox refuses, this row becomes an owner question | SETTLED (check first) |
| C5 | S/fgos-fanout/SKILL.md:81-85 and wave-dispatch-mechanics.md:56-64 (out-of-process is fired by `fanout-batch.mjs`; only `unavailable` is reported) vs S/fgos-fanout/SKILL.md:216, :232-237 and wave-dispatch-mechanics.md:8-14 (every non-in-process candidate is marked dispatch-unavailable) | the first: out-of-process is fired and returned; only the ids in the call's `unavailable` key go to `dispatchUnavailable` | `src/runner/fanout-batch.mjs:74-75` (only `mechanism === 'unavailable'` is classed unavailable), `:172`, `:187` (returns fired, mechanismChanged, unavailable, deferred). Code decides it | SETTLED |
| C6 | S/fgos-routing/SKILL.md:117 (Work items have no stage; step progression belongs to Workflow runs) vs :38, :119-121, :142-161 (route by stage; `workflowStep`) | not chosen yet | `docs/platform/workflow/spec.md:781` keeps "Work has no stage" and the routing paragraph at :117 says so; but `src/state/replay.mjs:41-51` still derives `workflowStep` from a legacy `stage` field, so items without a `workflowRunId` still carry one. Spec and code disagree; the choice rewrites the lane routing a session follows | OWNER QUESTION |
| C7 | S/fgos-shaping/SKILL.md:44 vs AGENTS.md:20 and others | - | - | PARKED (section 3) |
| C8 | S/_s/coordination-driver.md:63-66 (accepted, rejected, deferred) vs S/fgos-architecture-panel/SKILL.md:126 (accepted, mitigated, answered, invalidated-by-evidence, deferred, unresolved) | both, each in its place: the driver's three are the generic set; a role-specific skill may define a finer set that applies in that skill. One clause in driver-discipline says so. No mapping is invented | the panel set is the one its rubric uses (`docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md`); the driver does not forbid finer names | SETTLED |
| C9 | S/_s/capability-matching.md:57 and S/_s/executor-dispatch-fallback.md:106-108 (decide once per unit, never twice) vs S/fgos-fanout/SKILL.md:75 and wave-dispatch-mechanics.md:56-59 (decide per candidate, then the batch call re-confirms) | decide once per dispatch, immediately before execution, never during planning; a batch entry that re-confirms the mechanism inside the same dispatch is that dispatch's own bind check, not a second decide | `src/runner/fanout-batch.mjs:74` re-resolves the mechanism and returns `mechanismChanged`; the fragment's "twice" refers to Step A then Step B of one call path | SETTLED |
| C10 | S/_s/executor-dispatch-fallback.md:132-136 (background, wait for the notification, no polling) vs S/fgos-group-thinking/SKILL.md:86-90 (poll `fgos workflow status`) | both, scoped by door: `fgos run` calls wait for the notification; `fgos workflow start` returns at once with a detached run, so it is polled. One clause in run-door-contract | group-thinking.md:86-88 says `start` returns at once with a `detached` block; the fallback text is about a call that blocks until the Unit settles | SETTLED |
| C11 | AGENTS.md:234 (reference the fallback fragment as the canonical procedure) vs S/_s/executor-dispatch-fallback.md:3-6, :315-332 (no live consumer of its Steps A-C; it survives as a pattern and a list of reasons) | the fragment: AGENTS.md's line is replaced by a pointer to dispatch-decide-door and run-door-contract, and names the fragment only for its pattern and reasons | the fragment's own history lines :315-332; `fgos-lead`, `fgos-run` and the stage skills call the doors directly. Test `test/setup/capability-catalog-doctrine.test.mjs:84-99` pins the file name in two places, so the reference stays there | SETTLED |
| C12 | S/_s/executor-dispatch-fallback.md:204-206 (cites `session-identity.mjs:134` and a four-tier fallback) vs `src/util/session-identity.mjs:25-31` | the code: the id comes from `identityDoor().resolve()`; the citation is rewritten as the function name without a line number | the code at :25-31 | SETTLED |
| C13 | `core/instructions/design-principles.md:9` ("seven design principles") vs :19-46 (eight numbered) | eight: the description is fixed, and lists "one proof" | the file's own body, principle 8 at :46 | SETTLED |
| C14 | S/_s/cook-worker-contract.md:16-18 (a stage that would ask takes its documented default) vs S/_s/coding-worker-contract.md:46-50 (brief not enough: do not guess, report `[BLOCKED]`) | both, with their scope stated: a documented default is taken when a skill stage has one; a brief that lacks a field is `[BLOCKED]`. One sentence in each file names the other's case | the two apply to different questions (a skill stage's prompt vs the brief's missing field); neither forbids the other | SETTLED |

### 4.1 Owner questions (the six of Medium or above first; only C2 and C6 are open)

C1 to C5 are SETTLED, so only C2 and C6 need the owner. Both are drafted in the five-part form
(`core/skills/_shared/decision-question.md`); the owner's language may be Vietnamese, the draft is English.

**Question for C2. Headline: A skill step with no executor for its capability: run it inline, or stop and ask? (112 chars)**

1. **What is happening.** One rule says an unconfigured capability is not an error: `fgos dispatch decide` answers
   `unavailable` and the agent does the work inline and reports nothing (AGENTS.md:229). Two skills say the opposite:
   the cook door guide calls `unavailable` "a blocker to ask about", and the fanout skill reports such an item back
   "as needing a person".
2. **Cause.** I read both sides. The inline rule is stated in the platform contract (executor-model section 7) and in
   the capability fragment. The two skill sentences have no recorded decision; the fanout half is also tied to a code
   path (`fanout-batch.mjs` returns these ids under `unavailable`, and the loop reports each once so it ends).
3. **Options.**
   - A. Inline everywhere. The cook door runs the slice in its own session; fanout still reports each id once but
     says "the caller runs it inline" instead of "needing a person". Gain: matches the law and priority 2 (no one waits).
     Harm: a slice meant for a separate executor runs in the live session. Cost: about 6 lines in 3 skill files.
   - B. Ask in both. AGENTS.md's inline rule gets an exception for cook and fanout. Gain: nothing runs where it was
     not planned. Harm: a person is pulled in for the common unconfigured case. Cost: about 10 lines in 4 files.
   - C. Inline for cook, report-and-ask for fanout (its batch has no live session to run it). Cost: about 8 lines.
4. **Recommendation.** A: it keeps one rule and the owner's priority of not waiting; fanout's report-once code stays
   untouched.
5. **Scope of the answer.** A yes to A authorizes rewording S/fgos-cook/references/case-and-doors.md:69-70 and the fanout
   skill and reference passages (and no code change). It does not change `fanout-batch.mjs`, the `unavailable` key
   name, or any other `unavailable` handling. Until answered, those lines stay as they are and every other row lands.

**Question for C6. Headline: Do work items still route by stage, or only by their workflow run? (74 chars)**

1. **What is happening.** The routing skill has one paragraph saying work items have no `stage` and progress belongs to
   a workflow run (S/fgos-routing/SKILL.md:117), and the rest of the skill (lines 38, 119-161) routes by stage and a
   `workflowStep` field.
2. **Cause.** The workflow spec (line 781) keeps "Work has no stage", but the state code (`src/state/replay.mjs:41-51`)
   still derives `workflowStep` from a legacy `stage`, so older items still carry one. So the skill is half in each model.
3. **Options.**
   - A. Both, named: an item with a `workflowRunId` is driven through its run; an item without one is routed by its
     `workflowStep`, called the legacy-item route. Gain: describes what the code does today. Harm: the legacy route
     stays documented. Cost: about 15 lines in one skill, no code.
   - B. Run-only: rewrite the skill to the new model and drop the stage table. Gain: one model. Harm: older items have
     no instructions; needs a decision on what happens to them. Cost: about 60 lines and an item for the legacy path.
   - C. Stage-only: revert line 117. Gain: matches the code. Harm: contradicts the spec. Cost: 1 paragraph.
4. **Recommendation.** A: it is true of both spec and code and loses no rule.
5. **Scope of the answer.** A yes to A authorizes edits to S/fgos-routing/SKILL.md lines 38, 117-121 and 142-161 only.
   It does not remove the stage field from the state code, change the spec, or touch other skills. Until answered,
   fgos-routing keeps those lines and its other rows (9, 16, 29) still land.

## 5. Other duplicates and gaps found (not in the 31)

- AGENTS.md:177-180 ("Changing a locked law") repeats the last paragraph of `core/instructions/platform-operating-laws.md`
  (changing a locked law supersedes its decision id). Owner: platform-operating-laws; the AGENTS.md section is cut
  with the rest and nothing is added to the unit if its paragraph already carries the rule (check word for word).
- Persona descriptions in `core/agents/*.yaml` are copied by hand into `.claude/agents/*.md` (for example
  `.claude/agents/lead.md` repeats lead.yaml's "Writes only its plan directory"); that copy is generated by
  `scripts/project-agents.mjs`, so it follows any change to the yaml and needs no row.

## 6. Risks found

1. **Persona text cannot become a pointer.** A persona's description is what an agent reads at start without opening a
   file (it is also the text shown in the agent list). Rows 21 and 22 therefore keep the persona as the owner, which
   is not a rule unit and so does not meet plan criterion 2 ("every rule has an owner unit in `rules.json`") as worded.
   Options for the lead: read criterion 2 as "owner unit or owner persona file", or build the five role boundaries
   as one unit and generate the persona descriptions from it, which is a new mechanism and a decision question.
   `packages/agent-start-context/goldens/` does not exist on this tree, so no golden pins persona text today; when the
   start-context goldens land, persona text becomes pinned and a later change regenerates them.
2. **Prompt templates cannot hold pointers** (cluster 28): same reason; the row stays.
3. **Doctrine tests that pin a phrase in a place this table empties.**
   `test/docs/run-doors-doctrine.test.mjs` reads the `## Dispatch` section of AGENTS.md (:24-30), requires the `fgos run "`
   one-liner and `--writes` and a "provider ... soft preference" sentence inside capability-matching's
   `## Ad-hoc one-shot delegation` section, and a G2 line with `prefer` in fgos-run; it also scans AGENTS.md, skills,
   instructions and templates for removed door patterns, so a pointer or unit text must not reintroduce them.
   `test/docs/agents-doctrine-anchors.test.mjs` needs exactly one AGENTS.md line holding each of two anchors
   (convention paths at :51, land on main at :100) with named phrases on that line; the unit body must keep each as
   one line and no copy may be left in the hand-written part or an AgentKit block. `rul11-anchor-phrase.test.mjs`
   and `rul104-anchor-phrase.test.mjs` need the anchor phrase alone on a line in AGENTS.md; both survive if the unit
   body keeps the line and the projection copies it unchanged. Each test is repointed to the unit that now holds its
   phrase and asserts at least what it asserted.
4. **`test/setup/capability-catalog-doctrine.test.mjs` is outside plan.md's footprint** (`test/docs/**` only) and pins the
   token `decide-before-execute` in capability-awareness and the dispatch fragment, plus the file names
   `capability-catalog.md`, `executor-dispatch-fallback.md` and `planning-capability-awareness.md` (:75-99). The
   pointers keep those tokens; if one has to go, the footprint grows by that test file.
5. **The projection grows.** Every new unit has no `when:`, so every moved rule that today lives only in a skill (clusters
   1-11, 16, 29) becomes always-loaded text in AGENTS.md. Measure `wc -c AGENTS.md` before and after; scoping them is a
   later step, but the byte growth is real now.
6. **A rule that only one anchor test pins, and a stray marker.** The RUL104 phrase is pinned by one test only. In
   AGENTS.md there are two `<!-- mdview:START -->` lines (:240 and :284) and one `<!-- mdview:END -->` (:313): the
   Impact-analysis gate (:241-282) sits inside an unclosed marked block. The gate is moved first, the markers are not
   touched (tool-owned, out of scope).
7. **Near-duplicate refusal.** The new runner units (dispatch-decide-door, run-door-contract, capability-routing-rules)
   share vocabulary and may reach the 0.93 search threshold; each declares `related` to the other two. `compile` and the
   structural checks need no model; the semantic check needs the embedding model (`rule-search-unavailable` otherwise).
8. **Fallback fragment.** It describes its Steps A-C as having no live consumer but six stage skills still cite it
   (lines 315-332). Rows 1-4 and 31 turn its copies into pointers; deleting the fragment is a separate item.
9. **Local ids in text we touch.** S/fgos-researching/SKILL.md:69-75 and S/_s/executor-dispatch-fallback.md:200-206 carry
   task and local decision labels; where a row rewrites those lines the labels go, because the citation checker refuses them.
10. **Concurrent plans.** Rows touching S/fgos-lead, S/fgos-secretary, S/fgos-supervisor wait on the heads-operate-without-owner
    plan; S/fgos-run, capability-matching and capability-catalog wait on the dead-node-closure plan. Rebase before each
    such batch and re-read the lines named here.
11. **Generated copies.** `.agents/skills/**`, `plugins/fgOS/skills/**` and `.claude/skills/**` copy each skill; edit
    `core/skills/**` only and run `npm run build:skills` once per batch.

## 7. Batches (at most 8 files each; no file twice inside a batch; run one at a time, in this order)

Order: new units first (so no pointer names a missing unit), then pointer edits, then the AGENTS.md cut with its
anchor tests last. After every batch: `npm run build:skills`, `fgos internal context-engine compile`, and
`fgos internal context-engine check` over the staged units. Generated files (render surfaces, `rules.json`, the
projection block) are not counted.

| Batch | Files (all repo-relative) | Rows |
|---|---|---|
| U1 (new units, 8) | components/runner/instructions/dispatch-decide-door.md; components/runner/instructions/run-door-contract.md; components/runner/instructions/capability-routing-rules.md; components/runner/instructions/impact-analysis-capability-gate.md; components/workflow/instructions/driver-discipline.md; core/instructions/untrusted-input.md; core/instructions/domain-doctrine-read.md; components/fgos-gateway/instructions/gateway-start-door.md | 1-11, 16, 29, 31, C1, C3, C8-C11 text |
| U2 (new units, 8) | core/instructions/mission-boundary.md; core/instructions/before-touching-code.md; core/instructions/convention-paths.md; core/instructions/definition-of-done.md; core/instructions/scratch-artifacts.md; core/instructions/destructive-cleanup.md; core/instructions/writes-to-main.md; core/instructions/rul11-tum-lum.md | AGENTS.md sections, 15, 17, 20, 23 |
| U3 (units and extends, 5) | core/instructions/rul104-better-not-bigger.md; components/packaging-distribution/instructions/legacy-node-cli-boundary.md; components/packaging-distribution/instructions/install-setup-doctor-gate.md; core/instructions/design-principles.md; core/instructions/platform-operating-laws.md | AGENTS.md sections, C13, 30 |
| P1 (dispatch skills, 7) | core/skills/_shared/capability-matching.md; core/skills/_shared/executor-dispatch-fallback.md; core/skills/fgos-run/SKILL.md; core/skills/fgos-researching/SKILL.md; core/skills/fgos-lead/SKILL.md; core/skills/_shared/coding-worker-contract.md; core/skills/_shared/cook-worker-contract.md | 1-6, 8, 9, 11, 16, 23, 24, 31, C1, C3, C4, C9, C11, C12, C14 |
| P2 (fanout and advise, 5) | core/skills/fgos-fanout/SKILL.md; core/skills/fgos-fanout/references/wave-dispatch-mechanics.md; core/skills/fgos-group-thinking/SKILL.md; core/skills/fgos-advise/SKILL.md; core/skills/fgos-advise/references/request-kinds-and-routes.md | 6, 9, 16, 25, 26, 31, C5, C9, C10 (C2 half waits) |
| P3 (capability fragments and heads, 8) | core/skills/_shared/capability-catalog.md; core/skills/_shared/planning-capability-awareness.md; core/skills/_shared/plan-contract.md; core/skills/fgos-shaping/SKILL.md; core/skills/fgos-clarifying/SKILL.md; core/skills/fgos-secretary/SKILL.md; core/skills/fgos-supervisor/SKILL.md; core/skills/fgos-routing/SKILL.md | 5-8, 16, 17, 18, 20, 21, 22, 29, 30, 9 (routing) (C6 lines wait) |
| P4 (driver and cook, 5) | core/skills/_shared/coordination-driver.md; core/skills/fgos-cook/SKILL.md; core/skills/fgos-cook/references/case-and-doors.md; core/skills/fgos-architecture-panel/SKILL.md; core/skills/instruction-audit/SKILL.md | 9, 10, 11, 30, C8 (C2 and parked lines untouched) |
| P5 (distill, 4) | core/skills/distill/SKILL.md; core/skills/distill/references/extract-rules.md; core/skills/distill/references/deep-dive-protocol.md; core/skills/distill/references/consult-protocol.md | 27 |
| A (AGENTS.md cut and anchors, 5 plus generated) | AGENTS.md; test/docs/rul11-anchor-phrase.test.mjs; test/docs/rul104-anchor-phrase.test.mjs; test/docs/agents-doctrine-anchors.test.mjs; test/docs/run-doors-doctrine.test.mjs | every AGENTS.md section except 1-15 and 17-27 |
| After answers | C2 files (case-and-doors.md, fgos-fanout/SKILL.md, wave-dispatch-mechanics.md) and C6 file (fgos-routing/SKILL.md) | C2, C6; the parked items stay parked on owner question 1 |

Persona files, prompt templates (`core/prompt-templates/**`) and `.claude/agents/**` are not edited by any batch.
`CHANGELOG.md` belongs to the second phase.
