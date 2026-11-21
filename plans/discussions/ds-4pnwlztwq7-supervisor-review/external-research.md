# External research: supervisor/lead/planner session orchestration

VERIFIED = I fetched the page and it says this. INFERENCE = my reasoning or not read directly.
Not fetched (so not cited as read): Gas Town Medium post (HTTP 403), Temporal AI blog (404), LangGraph HITL doc (redirect stub), OpenHands/Devin/Sweep/Sculptor/vibe-kanban/AutoGen/CrewAI/OpenAI Swarm pages (not attempted; budget). Erlang page fetched only gave the one-line definition.

## 1) Patterns and who uses them

1. Orchestrator-worker, LLM orchestrator. Central LLM splits task, delegates, synthesizes; subtasks decided from input. VERIFIED https://www.anthropic.com/engineering/building-effective-agents . Anthropic research system: lead (Opus) spawns 3-5 parallel subagents (Sonnet), lead synthesizes and decides whether to spawn more. VERIFIED https://www.anthropic.com/engineering/multi-agent-research-system
2. Single-thread with shared full context, no multi-agent. Cognition: "share full agent traces, not just messages"; dispersed decisions make fragile systems; recommends linear single-thread agent, history compression, or Claude-Code-style subagents that only answer bounded questions and do not run parallel to the main agent. VERIFIED https://cognition.com/blog/dont-build-multi-agents
3. Agent teams (Claude Code, experimental). Lead + teammates, each its own context, shared task list with file-lock claiming, JSON-file mailboxes, hooks (TeammateIdle/TaskCompleted exit 2 = keep working). Recommends 3-5 teammates, 5-6 tasks each, one file owner per teammate. VERIFIED https://code.claude.com/docs/en/agent-teams
4. Agent towns (Gas Town). Mayor (coordinator), Deacon (cross-rig supervisor patrol loop), Witness (per-rig, detects stuck/zombie workers, triggers recovery), Polecats (persistent identity, ephemeral sessions), Refinery (merge queue; workers never push main). State in git worktrees ("hooks") and a git-backed bead ledger; heartbeat daemon -> Boot triage -> Deacon -> Witness chain. Scales "20-30 agents" per project's own claim, no independent evidence found. VERIFIED https://github.com/steveyegge/gastown
5. Session pool wrappers: claude-squad = tmux session + git worktree per task, pause/resume, experimental `--autoyes` auto-accept; common failure is tmux startup timeout. VERIFIED https://github.com/smtg-ai/claude-squad
6. Initializer + worker harness for long runs: first session writes init.sh, progress file, git commit, JSON feature list (all failing); later sessions do one feature, commit, update progress. Same harness, different prompts. VERIFIED https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
7. Deterministic control loops. K8s controllers: non-terminating loop comparing desired state (spec) with current state and acting to close gap; controllers can fail and system tolerates it. VERIFIED https://kubernetes.io/docs/concepts/architecture/controller/ (page does not use "level-triggered"/"idempotent"; those are INFERENCE). Erlang: supervisors monitor workers and can restart them, in a tree. VERIFIED https://www.erlang.org/doc/system/design_principles.html#supervision-trees (restart intensity/strategies not read: INFERENCE that OTP has them).
8. Temporal durable execution for agents: INFERENCE only (page 404); known idea is deterministic workflow code + non-deterministic activities, signals for human input. Treat as unverified.
9. Failure taxonomy research: MAST, 14 failure modes in 3 groups (specification, inter-agent misalignment, task verification), 1600+ annotated traces over 7 frameworks; authors argue many failures are system-design, not model, problems. VERIFIED (search snippet only, paper not opened) https://arxiv.org/abs/2503.13657

## 2) Reported failure modes

- Over-spawning / effort not scaled: early agents spawned 50 subagents for simple queries; endless searches; excessive status chatter between agents; kept working after enough results. VERIFIED multi-agent-research-system URL above. Fix: explicit effort-scaling rules in the prompt.
- Vague delegation -> duplicated work and misread tasks; each subagent needs objective, output format, tool guidance, boundaries. VERIFIED same.
- Cost: agents ~4x chat tokens, multi-agent ~15x; token use explained 80% of BrowseComp variance. VERIFIED same. Agent teams "use significantly more tokens", cost scales linearly with teammates. VERIFIED agent-teams URL.
- Lead cannot steer running subagents; synchronous execution bottleneck. VERIFIED research-system URL.
- Context exhaustion: one-shotting runs out mid-feature leaving half-built undocumented work; Cognition: huge single-thread tasks overflow. VERIFIED harness + Cognition URLs. Anthropic mitigation: lead saves plan to external memory before truncation; fresh subagents with handoff. VERIFIED research-system URL.
- Declaring done early / marking done untested: later agents see progress and declare project finished; features marked complete after unit tests/curl only. VERIFIED harness URL. Agent teams: lead "can stop early too, deciding the team is finished before all tasks are complete"; teammates stop after errors instead of recovering. VERIFIED agent-teams URL.
- Stale task state: teammates fail to mark tasks completed, blocking dependents. VERIFIED agent-teams URL.
- No resume of in-process teammates after /resume; lead may message nonexistent teammates. VERIFIED agent-teams URL.
- Permission friction: teammate prompts bubble to lead; teammates inherit lead permission mode; no per-teammate mode at spawn; split-pane teammates do not receive `--allowedTools`; inter-agent messages cannot carry owner approval. VERIFIED agent-teams URL.
- File conflicts when two agents edit one file. VERIFIED agent-teams URL.
- Orphans: tmux sessions persist after the session ends. VERIFIED agent-teams URL. claude-squad tmux timeout on start. VERIFIED claude-squad URL.
- Error compounding and higher cost from autonomy; recommend stop conditions (max iterations), sandbox testing, human checkpoints. VERIFIED building-effective-agents URL.
- Parallel agents' implicit decisions conflict (Flappy Bird example). VERIFIED Cognition URL.
- Production errors: Anthropic runs deterministic retry + checkpoints, resumes from point of failure, tells agent when tool fails; rainbow deploys so running agents are not disrupted. VERIFIED research-system URL.
- Gas Town: states GUPP Violation/Stalled/Zombie exist as first-class problems; Codex runtime lacks hooks and needs a startup fallback. VERIFIED gastown URL.
- Sandbox-read failures like the two trial runs: no public postmortem found for "confined supervisor cannot read its own queue". NOT FOUND; closest are agent-teams permission notes above.

## 3) Practices that worked

- Scale effort to complexity with explicit rules in the lead prompt. VERIFIED (research-system).
- State outside the LLM: progress file + git + JSON feature list with only `passes` mutable; fresh session reads state at start and runs a smoke check first. VERIFIED (harness).
- Hand off by reference: subagents write to external storage and return a pointer. VERIFIED (research-system).
- Deterministic gates on completion: hooks that block "task complete" / "teammate idle" with exit 2. VERIFIED (agent-teams). Require end-to-end verification before marking pass. VERIFIED (harness).
- Separate watchers by scope with a heartbeat chain, ephemeral sessions with persistent identity, and a merge queue so workers never write main. VERIFIED (gastown).
- Task claiming through file locks. VERIFIED (agent-teams). Pre-approve common permissions before spawning to cut prompts. VERIFIED (agent-teams).
- Start with 3-5 workers; start with read-only/research/review tasks before parallel implementation. VERIFIED (agent-teams).
- Keep LLM use minimal: simplest workable design, add complexity only when needed. VERIFIED (building-effective-agents).
- Human approval batching: no source I read describes batching owner questions into sets. Agent-teams routes every teammate prompt to one lead (a single front door, not batched). VERIFIED for the routing only. Batching itself: INFERENCE that it is uncommon/under-documented.

## 4) Contrasts with the reviewed design

Matches common practice
- Single front session for human interaction (agent-teams lead takes all prompts; Gas Town Mayor/Overseer escalation). VERIFIED sources above.
- Worktree + per-session isolation + lane limit (claude-squad, Gas Town, agent teams guidance 3-5). VERIFIED.
- Durable state in files/git, stateless restartable sessions (harness; Gas Town beads/hooks). VERIFIED.
- Restart/park of vanished workers by a watcher (Gas Town Witness; Erlang supervisor). VERIFIED.
- Per-plan lead owning a unit of work with file ownership (agent teams "own a different set of files"). VERIFIED.

Differs
- A deterministic no-LLM watcher exists, but the admission/restart/close decisions sit in an LLM supervisor woken by it. K8s and Erlang put the reconcile decision itself in deterministic code; Gas Town's Daemon/Boot are partly deterministic with LLM Deacon/Witness above them. VERIFIED for each system's shape; the judgement that this costs reliability is INFERENCE.
- Supervisor is "stateless" and woken per event: closest analogue is K8s reconcile from desired-vs-current state (VERIFIED concept). Needs its inputs (queue, plan files) readable at wake; your trial failure is precisely a failed read of that state. INFERENCE.
- No public source reports a supervisor that is itself sandboxed more tightly than the workers it starts; agent teams inherits the lead's permission mode to teammates (VERIFIED), i.e. the opposite direction. Per-persona grants are an unusual choice. INFERENCE.

Likely gaps
1. Admission/restart/close are mechanical (ready? lane free? pid alive? plan state done?). Candidate to move into the watcher; LLM only for judgement (park-vs-restart reasons, closing evidence). Matches K8s/OTP and "simplest solution" advice. INFERENCE grounded in VERIFIED sources.
2. Completion claims: both the harness post and agent-teams docs report agents claiming done early. Closing a plan should be gated by deterministic evidence (hook/test), not lead say-so. VERIFIED problem, INFERENCE mapping.
3. Restart loops: Erlang-style restart intensity (max N restarts in T, then escalate) is not mentioned in your description; unbounded restart is a cost-blowup risk (agents ~15x tokens, VERIFIED). Erlang intensity itself not read: INFERENCE.
4. Stuck/zombie detection as explicit states (Gas Town GUPP/Stalled/Zombie). VERIFIED they exist; check your watcher distinguishes "process gone" from "alive but idle/waiting on answer".
5. Resume semantics: agent-teams cannot restore teammates after /resume (VERIFIED); verify your resume-for-owner-answer path re-reads state from files rather than relying on session memory.
6. Start-up smoke check: harness runs init.sh + e2e check at every session start (VERIFIED). A preflight (can I read queue/plan, run start commands under this grant?) at supervisor start would have caught both trial stops. INFERENCE.
7. Context/handoff loss (Cognition): lead-per-plan with planner/lead/secretary roles passes context by files; risk of lost implicit decisions between planner and lead. VERIFIED principle, INFERENCE applicability.
8. Orphan cleanup for tmux/panes on session end (VERIFIED problem in agent-teams docs).

## Limitations
Mostly vendor/maintainer sources, few independent postmortems; no benchmark of deterministic-vs-LLM supervisors found; Temporal, OpenHands, Devin, AutoGen/Magentic-One, CrewAI, OpenAI handoffs, LangGraph supervisor not read.

## Unresolved questions
- Does any published system batch human questions across agents? None found.
- Do published agent harnesses sandbox the supervisor separately from workers? None found.
