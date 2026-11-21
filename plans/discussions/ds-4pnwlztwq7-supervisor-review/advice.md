# Advice: fgOS supervisor orchestration against published experience

Date: 2026-11-19. Backlog `p-dkiyey4ttl`. Discussion: [DISCUSSION.md](DISCUSSION.md). Sources:
[external-research.md](external-research.md). V = verified (read in the source), I = inference.

## Verdict

The base of the design is sound. Its state lives outside the LLM, each worker gets a worktree under a lane cap, footprints
give one owner per file, and there is one landing door. All four match what published systems converged on.

Its weak point is where the decisions sit. Mechanical work (admission, starting, merging) was put in an LLM turn, and both
live-run windows failed exactly there. Merging also had no owner outside a plan, and no independent review inside one.
Five owner decisions (SR-D1..SR-D5) fix the direction.

## Round 2 update (rounds 8-19, 2026-11-19)

Round 1 put more mechanics into code: admission, a merge queue. Round 2 reverses that part.
- The live-run windows 1-5 stopped four times on the harness itself (confinement, a door refusal, a harness logic bug)
  and once on a weak head executor, not on the agents' judgement.
- The fix is not more rails. The supervisor and the plan layer stay domain-agnostic; each domain injects its own phase
  mechanics (SR-D7). The skeleton owns actors and time, never work states, unlike Work's fixed state table (SR-D8). The
  frame is a wide road with checkpoints, agents drive inside it, and the harness makes each step reliable (SR-D9).
- Standing: SR-D4, SR-D5, SR-D6..SR-D10. Superseded: SR-D1, SR-D2, SR-D3 (DISCUSSION.md §4).
- The foundation questions continue in a new discussion, `orchestration-skeleton`.

## Strengths
- **State outside the LLM; the supervisor is a stateless wake.** Matches Anthropic's long-running harness: a progress
  file, git and a feature list, re-read by each fresh session (V,
  anthropic.com/engineering/effective-harnesses-for-long-running-agents).
- **Worktree per worker, a lane cap, one file owner per worker, one merge door.** Matches Gas Town (Refinery; workers
  never push main), claude-squad, and Claude Code agent teams, which advise 3-5 workers each owning their files (V,
  github.com/steveyegge/gastown, code.claude.com/docs/en/agent-teams).
- **Events recorded once by a stable id, plus a handled flag.** This is the reconcile shape of Kubernetes controllers
  (V, kubernetes.io/docs/concepts/architecture/controller).
- **Owner questions batched, in five-part form, through one front session.** The single front door is common practice
  (V). The batching appears ahead of what others publish: none was found (I).
- **Every head, the supervisor included, is confined by its own persona grant.** This is stricter than agent teams,
  where teammates inherit the lead's permission mode (V, agent-teams).

## Differences, and the gaps they caused
- **Decisions in the LLM (D1).**
  - Kubernetes and Erlang/OTP put reconcile and restart in code (V).
  - Both fgOS windows stopped in the mechanical ritual, not in judgement. Window 1 failed on queue and plan reads.
    Window 2 failed on failing start commands and on an already-held plan that was still admissible (V, integration
    report).
  - Decision SR-D1 moves admit and start into the wake door.
- **No start preflight (G2).** The harness post proves its environment on every session start (V). Decision SR-D1 adds
  a sandbox proof of each head's ritual.
- **Nobody merges outside a plan, and the lead approves itself (M2, M3).** Gas Town gives merging to a dedicated role
  (V). Decisions SR-D2 and SR-D3 make merging one code-run queue with an independent verdict bound to the SHA, and make
  the supervisor its owner and arbiter.
- **Every failure goes to the lead or the owner.** Decision SR-D4 sets the L0-L3 ladder, so code heals mechanical
  failures and no refusal sits unowned.
- **No restart cap (G3).** Multi-agent work costs about 15x the tokens of chat (V, anthropic.com/engineering/
  multi-agent-research-system). OTP caps restart intensity (I, not read). Decision SR-D4 applies the cap.
- **"Done" is the lead's word (G4).** Early "done" claims are reported by both the harness post and agent teams (V).
  Decision SR-D5 adds a code close check before the supervisor's acceptance review.
- **Per-phase merging can leave half a feature on main, or an old path beside the new one.** Live example:
  `land-branch.sh` still sits beside `fgos land`. Decision SR-D5 adds an integration phase and a dormant switch that is
  removed in that phase.

## Failure modes others hit, and where fgOS stands
| Failure mode (source) | fgOS |
|---|---|
| Over-spawning and chatter, effort out of scale (V, multi-agent-research-system) | Lane cap and `maxLeads`; SR-D1 removes LLM turns spent on mechanical work |
| Context exhaustion mid-task (V, harness; Cognition) | State lives in files and git; `session rotate` exists |
| Early "done" (V, harness, agent-teams) | SR-D5 close check |
| Stale task state blocks dependents (V, agent-teams) | Event queue plus `supervisor-stuck`; SR-D4 stuck-X event |
| A resumed session does not restore its workers (V, agent-teams) | Lead resumes from the phase table and its tickets |
| Two agents editing one file (V, agent-teams) | Disjoint footprints are checked |
| Permission prompts bubbling up, inherited modes (V, agent-teams) | Per-persona grants; SR-D1 preflight proves them |
| Orphaned tmux sessions (V, agent-teams) | Supervisor stops the lead at close; worktree cleanup is in close (§6 step 10) |
| Conflicting implicit decisions between parallel agents (V, Cognition, cognition.com/blog/dont-build-multi-agents) | Partly: footprints separate files, not decisions. A plan-to-lead hand-off through files can lose implicit decisions (I). Not addressed here. |

## Limits of this review
- Not read: Temporal, OpenHands, Devin, AutoGen/Magentic-One, CrewAI, LangGraph supervisor, the OTP restart-strategy
  docs. The trunk-based/DORA point was not fetched in this session.
- No public postmortem of a confined supervisor exists to compare against.

## Follow-ups
DISCUSSION.md §7: ready now T0 small corrections, T2 harness preflight for heads, T6 repeated second doors; T7 opens
the discussion `orchestration-skeleton`; T1, T3, T4 and T5 wait for it.
