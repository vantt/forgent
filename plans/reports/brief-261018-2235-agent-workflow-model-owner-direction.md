# Agent ↔ workflow model: the owner's direction for the AGENT-WF council

Written 2026-10-18 22:35 (Asia/Saigon) by `forgentx-95`, from a discussion with the owner the same evening. This is an **input** to the council, not its answer. The council may challenge any point with evidence. The owner's wording is kept where it matters. Program board lane: AGENT-WF.

## The problem

fgOS will run other domains too (marketing, video production…), each with its own kind of plan. The owner wants:
- **agents** that are smart and flexible and respond to the situation in front of them;
- **workflows** that are what they were first meant to be: "một communication guide, một sơ đồ, hướng dẫn tác nghiệp cho một mảng business" (a communication guide, a map, an operating guide for a business area). A workflow guides, leads and sets constraints.

Today it is the reverse. A workflow is a step DAG that the Workflow runner executes as the only sequencer (decision 0049), so the agent becomes rigid. The owner calls this question the key to the project's success.

The first case is `fgos-cook`: an intelligent skill that drives the harness, stably and flexibly, to run an ak plan, and later any plan.

## Positions agreed with the owner

1. **A workflow holds three different things that must be separated:**
   - (a) **operating guide:** roles, stages, intermediate products, when to ask a person, what done means;
   - (b) **constraints:** what must hold;
   - (c) **the run order:** what runs first and what runs in parallel.

   The workflow carries (a) and (b). The agent produces (c), and the harness checks it against (b).
2. **(c) is a space of capabilities, not a script.** Owner: "khi bắt đầu thì nên vậy, tới chỗ đó anh có thể hoặc được phép làm việc với a, b, c nhưng không cho d, nhưng anh flexible đi đường a hoặc b" (at that point you may do a, b or c but not d, and you freely take route a or b).
3. **"That point" is a milestone state, never a step number.** The start is a milestone too ("request received", "case opened"), not "step 1". The machine reads milestones and conditions:
   - each activity declares the milestone it needs (entry criteria) and the milestone it produces (exit criteria);
   - order comes out of those conditions;
   - two activities whose entry criteria both hold may run in parallel without anyone declaring it.
4. **The numbered-list trap.** People write flows as numbered lists because language is linear. The list mixes required order (B needs A's output, or a MUST) with order that only reflects how it was written. A machine reading the list treats both as required.
   - Authors may still write a flow naturally, as prose or a list.
   - An agent turns it into milestones and conditions. For each pair of adjacent steps it asks: "is this order required (why?) or just habit?" The answer makes it a MUST, a SHOULD, or drops it.
   - A numbered list may remain as a description of the SHOULD path for human readers, never as a rule.
5. **Each decision point at a milestone has one structure**, following RFC 2119 wording:
   - **MUST / MUST NOT:** a hard constraint, enforced by the harness by machine, never by the agent's promise. Example: "MUST NOT publish before the client signs off."
   - **SHOULD:** the recommended default, **with its reason**. The agent follows it unless it has a reason not to. A deviation is logged with that reason, and above a set threshold it asks a person. Example: "SHOULD review a rough cut with the client first, because rework after color grading is expensive."
   - **MAY instead:** the approved alternatives to that SHOULD at the same point. The agent chooses freely, with no justification. Example: "MAY instead go straight to the fine cut when the change is small."
   - Test for SHOULD versus MAY instead: "if the agent takes the other route, do we want to know why?" Yes means SHOULD; no means MAY instead.
6. **A route that is not listed: option (b), chosen by the owner.** It is allowed, but it needs a justification exactly like a deviation from SHOULD. A workflow author can mark a high-risk point "listed routes only", which forbids unlisted routes at that point only.
7. **Enterprise knowledge must keep its reason.** A rigid DAG encodes knowledge as order and loses the why, so an agent cannot adapt when the case differs. Each kind of knowledge has its own home:
   - hard rules → MUST;
   - defaults with reasons → SHOULD;
   - definitions of done and checklists per milestone;
   - examples and past cases, which fgOS learns from across runs.
8. **Workflows improve over time.** When agents repeatedly take a MAY-instead or unlisted route with good results, that route is a candidate to become the SHOULD. When a SHOULD keeps failing, it is demoted. The logged justifications are the evidence.
9. **Pre-written workflows stay as playbooks.** Repeatable procedures (`council-lite`, `delphi`, the architecture panel) remain. An agent picks a playbook and adapts it, and each playbook states which parts are fixed (MUST) and which the agent may change.
10. **"Any plan" is just an intermediate product.** A person writes it (an ak plan), or an agent derives it from a domain's guide. One coordination loop runs both kinds. What differs is each domain's **route table**: coding has the 12 routes of `research-261016-2141-plan-conductor-coding.md`; marketing or video will have their own.

## Prior art the council must weigh

- **BPMN versus CMMN (adaptive case management).** BPMN is a scripted process. CMMN was built for knowledge work: a case with milestones, entry and exit criteria (sentries), and discretionary tasks the worker decides to run or not. The owner's model is close to CMMN, and today's fgOS Workflow is close to BPMN. Study CMMN seriously instead of rebuilding it.
- **Today's lead chains on the owner machine** (6.5, 6.2, 6.3, 6.4) are a working hand-made version of this model:
  - `common-rules.md` and the brief rules play (b), the phase files play (a), and the big lead's own ordering, routing of concerns and decisions play (c).
  - Rules that lived only in prose were missed: leads skipped guard tests outside their own files three times in 6.4, and some reported more than they did.
  - Rules the harness enforced by machine held: guard tests, `writes` scope, the adopt door.
  - Lesson: flexibility can go to the agent; constraints must be held by machine.

## How the council works (owner)

- **Do not ask the owner early.** Reach some consensus first, then work with him.
- **Output:** a design and a BA-level spec in `docs/specs/`, with decisions recorded. **No plan** until the owner approves the spec.
- **Depth:** `fgos-architecture-panel` at rigor critical, several rounds, reopen when needed.
- **Step 1 before the council:** review the original design intent of Workflow and its current state. Cover:
  - decision history, including 0049;
  - `src/workflow/`, `core/workflows/`, `domains/*/workflows`;
  - the two doors, patterns, presets and the route table.
- **Any change to existing mechanisms follows RUL104 (better, not bigger):** clean code and hexagonal where applicable, and no new layer unless it is truly worth it. Feature ideas go into one section of the report with their reason and benefit, for the owner to choose.

## Open questions for the council

1. Where does (b) live: inside each domain's workflow, or in a shared policy layer used by every domain, or both?
2. Who writes a new domain's guide (a): the owner, an agent through a council, or both together? What does a minimal guide for a new domain contain (roles, milestones, MUST / SHOULD / MAY instead, route table, gates, definitions of done)?
3. What is kept, changed or removed from the Workflow runner, the two doors, patterns and presets, under RUL104?
4. How are logged deviations measured and turned into workflow updates (who promotes a route, and with what evidence)?
5. How does a flexible agent stay inside the approved frame (scope and budget set at approval, priority #2), and when exactly does it ask a person?
