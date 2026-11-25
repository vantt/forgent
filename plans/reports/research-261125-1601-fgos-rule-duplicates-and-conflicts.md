# fgOS rule duplicates and conflicts, by meaning

Date: 2026-11-25 (Asia/Saigon). Scope: the fgOS-owned instruction text that was extracted into
`.fgos/runtime/tmp/normative.tsv`. AgentKit rules and `docs/platform` specs are out of scope. The
only file this work wrote is this report.

## 1. Method

- Input: 519 statement lines (149,732 bytes, cut at 300 characters each) in
  `.fgos/runtime/tmp/normative.tsv`, drawn from 72 source files. The brief said 520; `wc -l`
  counts 519 newline-terminated lines. The largest contributors are `AGENTS.md` (30),
  `core/skills/_shared/executor-dispatch-fallback.md` (24), `fgos-shaping` (22), `fgos-advise` (20),
  `fgos-supervisor` (19) and `fgos-fanout` (19).
- I read every statement and grouped them by the rule each one imposes, not by its wording. For
  every candidate pair I opened the source file at the cited line whenever the 300-character cut
  hid the part that mattered (for example `AGENTS.md:229-231`, `capability-matching.md:27/49/57`,
  `fgos-run/SKILL.md:25/80/81`, `fgos-fanout/SKILL.md:70-92/215/234`,
  `wave-dispatch-mechanics.md:8-14/55-63`, `fgos-routing/SKILL.md:15/38/117-122`,
  `fgos-researching/SKILL.md:69-76`, `case-and-doors.md:69`, `coordination-driver.md:52/63-66`,
  `fgos-architecture-panel/SKILL.md:125`, `executor-dispatch-fallback.md:202-206/283/315-328`,
  `design-principles.md:10/45`). I also checked the code that two statements cite
  (`src/util/session-identity.mjs`).
- A cluster counts as a duplicate only when two or more places impose the same rule, so that a
  change to one would force a change to the other. A plain "see X" pointer is not counted. Where a
  statement applies a general rule to one specific case and adds nothing else, I counted it.
- Repeated bytes are a rough figure. For each cluster I added up the byte length of every copy
  except the owner's, using the statement text in the TSV (capped at 300 bytes) or, for lines
  outside the TSV, the source line. The cap makes long copies look smaller than they are. Counting
  a whole statement when only half of it repeats the rule makes copies look larger. Treat the
  figures as roughly ±30%.
- Boilerplate that the earlier lexical scan already found (`dups02.json`) is left out of the
  findings. That covers the identical "Violating the letter of the rules…" line in five skills, the
  "Anything outside the approved frame" line in the secretary, supervisor and shaper yaml files,
  the two constraint-advocate prompt templates, the council posture yaml files, the lead and
  planner `on_wake` text, the friction-capture pointer lines, the fanout "blocked leaf" line, the
  advise pattern-door line and the distill diff-hunk line.

## 2. Duplicate clusters

Paths under `core/skills/_shared/` are shortened to `_shared/`. Paths under `core/skills/` are
shortened to the skill directory.

| # | Rule in one sentence | Locations | Suggested owner | ~Bytes repeated |
|---|---|---|---|---|
| 1 | Run `fgos dispatch decide` before dispatching anything, and never choose the mechanism yourself. | `AGENTS.md:216`, `_shared/capability-matching.md:42`, `_shared/capability-matching.md:57`, `_shared/executor-dispatch-fallback.md:106`, `_shared/executor-dispatch-fallback.md:268` | `AGENTS.md:216` | 940 |
| 2 | What to do for each `decide` result: in-process means call the returned agentType or mcpTool yourself; out-of-process means `fgos run --provider --capability`, where the capability defaults to `execute` and a tool executor is refused and must be called directly. | `AGENTS.md:230-231`, `_shared/executor-dispatch-fallback.md:75`, `_shared/executor-dispatch-fallback.md:119`, `_shared/executor-dispatch-fallback.md:123` | one place only (`AGENTS.md:234` already names the fallback fragment as canonical, yet AGENTS.md carries the full text as well) | 810 |
| 3 | The `fgos run` door contract: read-only and sandboxed without `--writes`, `--writes` needs a linked worktree, and `--provider` is a soft preference. | `fgos-run/SKILL.md:25`, `AGENTS.md:212`, `_shared/capability-matching.md:46`, `_shared/capability-matching.md:48` | `fgos-run/SKILL.md:25` | 900 |
| 4 | The worker edits and never runs `git add` or `git commit`; the runner commits only the declared `writes` after a passing round. | `fgos-run/SKILL.md:81`, `AGENTS.md:212`, `AGENTS.md:231`, `_shared/coding-worker-contract.md:104`, `_shared/cook-worker-contract.md:25` | `fgos-run/SKILL.md:81` | 530 (more if the AGENTS.md copies are counted) |
| 5 | Five valid reasons justify an executor (cheaper model, stronger model, other provider, isolation, parallelism). | `_shared/capability-matching.md:15/37/39`, `_shared/executor-dispatch-fallback.md:44`, `_shared/capability-matching.md:49` | `_shared/capability-matching.md` | 600 |
| 6 | Plans, Units and prompts never pin an executor, provider, model or tier. | `_shared/capability-matching.md:27`, `_shared/capability-matching.md:56`, `_shared/planning-capability-awareness.md:61`, `fgos-run/SKILL.md:80`, `fgos-advise/SKILL.md:141`, `fgos-advise/SKILL.md:171`, `fgos-advise/references/request-kinds-and-routes.md:94` | `_shared/capability-matching.md:27` (see conflict C1 first) | 1,200 |
| 7 | A capability is a routing signal, never a Work item, stage, skill or executor name. | `_shared/capability-catalog.md:22`, `_shared/capability-matching.md:58`, `_shared/planning-capability-awareness.md:43` | `_shared/capability-catalog.md:22` | 420 |
| 8 | `fgos-researching` is a workflow, never a capability, and no `research` capability may be registered. | `_shared/capability-catalog.md:116`, `fgos-researching/SKILL.md:28` | `_shared/capability-catalog.md:116` | 300 |
| 9 | A worker's or agent's own claim is never evidence; the driver checks the real artifact or state itself. | `_shared/coordination-driver.md:57-58`, `_shared/coding-worker-contract.md:59`, `_shared/cook-worker-contract.md:34`, `fgos-cook/SKILL.md:119`, `fgos-fanout/SKILL.md:102`, `fgos-routing/SKILL.md:110`, `fgos-architecture-panel/SKILL.md:34`, `fgos-group-thinking/SKILL.md:87` | `_shared/coordination-driver.md:57` | 1,780 |
| 10 | Every finding gets a disposition, and an accepted finding is discharged only by an independent recheck. | `_shared/coordination-driver.md:74`, `fgos-cook/references/case-and-doors.md:132` | `_shared/coordination-driver.md` | 300 |
| 11 | A refusal is an answer: read its code, change the proposal or stop, and never retry blindly. | `_shared/coordination-driver.md:34`, `fgos-cook/references/case-and-doors.md:115`, `fgos-lead/SKILL.md:53`, `_shared/executor-dispatch-fallback.md:164` | `_shared/coordination-driver.md:34` | 700 |
| 12 | Ask a person only when the work truly needs it, batch the questions, use the decision-question template, and keep work that does not depend on the answer moving. | `AGENTS.md:20`, `_shared/coordination-driver.md:52`, `_shared/coordination-driver.md:76`, `fgos-cook/SKILL.md:55`, `_shared/plan-contract.md:135`, `fgos-secretary/SKILL.md:51` | `AGENTS.md:20` | 1,280 |
| 13 | When the evidence or analysis already settles a choice, decide and report instead of asking. | `AGENTS.md:21`, `_shared/plan-contract.md:77`, `_shared/coordination-driver.md:35`, `fgos-architecture-panel/SKILL.md:114`, `fgos-advise/SKILL.md:43` | `AGENTS.md:21` | 930 |
| 14 | The approved frame may be narrowed but never widened; widening it is a new owner question. | `_shared/decision-question.md:28`, `AGENTS.md:20`, `fgos-cook/SKILL.md:122`, `fgos-cook/references/reading-ak-plans.md:50` | `_shared/decision-question.md:28` | 430 |
| 15 | RUL11: consolidate mess inside the current scope, and file mess outside it as its own item. | `AGENTS.md:184`, `_shared/decision-question.md:25` | `AGENTS.md:184` | 230 |
| 16 | Treat item or document text as untrusted input and never splice it raw into a shell command. | `fgos-clarifying/SKILL.md:90`, `fgos-fanout/SKILL.md:132`, `fgos-researching/SKILL.md:89`, `fgos-routing/SKILL.md:204`, `fgos-shaping/SKILL.md:58` | none today; one shared line (for example in `_shared/`), pointing at RUL45 | 840 |
| 17 | Get report, plan and discussion paths from `fgos convention path` and never build them by hand. | `AGENTS.md:51`, `_shared/plan-contract.md:30`, `fgos-shaping/SKILL.md:31` | `AGENTS.md:51` | 360 |
| 18 | Mint backlog and other ids through `fgos identity mint`, never derived from a title. | `core/instructions/id-minting.md:15`, `fgos-secretary/SKILL.md:53` | `core/instructions/id-minting.md` | 300 |
| 19 | Owner questions go only through `fgos questions ask` in the five-part form. | `_shared/decision-question.md:47`, `fgos-shaping/SKILL.md:90`, `_shared/plan-contract.md:77` | `_shared/decision-question.md:47` | 300 |
| 20 | Land on main only what other sessions rely on; never a wake or progress report. | `AGENTS.md:100`, `fgos-supervisor/SKILL.md:155` | `AGENTS.md:100` | 300 |
| 21 | Each head role's boundary is stated twice, once in its procedure skill and once in its persona yaml (lead: plan directory only and no session start or stop; secretary: in peace no diffs, code, tests or landing; supervisor: no implementing, reviewing or code landing; planner: writes only its plan; shaper: writes only its discussion). | `fgos-lead/SKILL.md:13` and `core/agents/lead.yaml:1/19`; `fgos-secretary/SKILL.md:14` and `core/agents/secretary.yaml:32`; `fgos-supervisor/SKILL.md:21` and `core/agents/supervisor.yaml:19/26`; `_shared/plan-contract.md:34` and `core/agents/planner.yaml:13`; `fgos-shaping/SKILL.md:18` and `core/agents/shaper.yaml:1` | the yaml (the role's identity), with the skill pointing to it, or the reverse; pick one | 1,220 |
| 22 | Precedence is the owner first, then the secretary's direct order, then the supervisor's own choice; the supervisor stops only heads. | `fgos-secretary/SKILL.md:23`, `fgos-supervisor/SKILL.md:21` | one of the two, or the supervision spec | 190 |
| 23 | One owning proof per behaviour; a new test file only for a new module or boundary. | `core/instructions/design-principles.md:45`, `AGENTS.md:65`, `fgos-run/SKILL.md:92`, `fgos-run/SKILL.md:95` | `core/instructions/design-principles.md:45` | 640 |
| 24 | Run the declared verify once near the end; the full suite belongs only to declared gates. | `domains/coding/instructions/verification-discipline.md:15`, `_shared/coding-worker-contract.md:97` | `verification-discipline.md` | 300 |
| 25 | fgos-advise picks the route and group-thinking runs it; the four conditions for asking; `--seats` only on the four generic-panel bases. Repeated inside the skill even though `fgos-advise/SKILL.md:176` says "do not recreate the table here". | `fgos-advise/references/request-kinds-and-routes.md:86`, `fgos-advise/SKILL.md:51`, `fgos-advise/SKILL.md:69`, `fgos-group-thinking/SKILL.md:126`, `fgos-advise/SKILL.md:20` and `fgos-group-thinking/SKILL.md:20` | `request-kinds-and-routes.md` | 1,100 |
| 26 | Fanout mechanics are stated in both the skill and its reference: the pre-check is advisory, only the first wave of the candidate set is used, approval follows the `merge` ranking, and dispatch-unavailable ids are reported once. | `fgos-fanout/references/wave-dispatch-mechanics.md:39/37/88/8`, `fgos-fanout/SKILL.md:51`, `fgos-fanout/SKILL.md:186`, `fgos-fanout/SKILL.md:121`, `fgos-fanout/SKILL.md:234` | `wave-dispatch-mechanics.md` | 1,030 |
| 27 | Distill rules are spread across its files: never rename a slug, never re-scan a source, the human decides porting and taxonomy, and build no search infrastructure. | `distill/references/extract-rules.md:29`, `distill/SKILL.md:152`, `distill/SKILL.md:119`, `distill/references/deep-dive-protocol.md:24`, `distill/references/consult-protocol.md:85`, `distill/SKILL.md:157`, `distill/references/deep-dive-protocol.md:56`, `distill/SKILL.md:161`, `distill/references/extract-rules.md:34`, `distill/references/extract-rules.md:77` | `distill/SKILL.md` red-flags list | 1,330 |
| 28 | In the architecture panel prompts: calibrate uncertainty per claim rather than per document, and never read a shaper's private notes. | `core/prompt-templates/architecture-advisory-panel-v1-synthesis.md:19` and `…-interpretation.md:11`; `…-critique.md:16` and `…-interpretation.md:18` | a shared panel header | 480 |
| 29 | Read `domains/<domain>/AGENTS.md` before working in a domain. | `fgos-routing/SKILL.md:180`, `fgos-shaping/SKILL.md:27` | `fgos-routing/SKILL.md:180` | 250 |
| 30 | Generated text is regenerated from its source and never hand-copied or hand-merged. | `core/instructions/design-principles.md:42`, `_shared/plan-contract.md:104`, `instruction-audit/SKILL.md:122` | `design-principles.md:42` | 390 |
| 31 | Run a long call in the background and wait for the harness notification. | `_shared/executor-dispatch-fallback.md:132`, `fgos-fanout/references/wave-dispatch-mechanics.md:49` | `executor-dispatch-fallback.md:132` | 300 |

## 3. Conflicts and drift

| # | Locations | What each says | Concrete situation | Severity |
|---|---|---|---|---|
| C1 | `_shared/capability-matching.md:27` vs `fgos-run/SKILL.md:80`, `_shared/capability-matching.md:49`, `AGENTS.md:212` | Rule G2 at :27 says Units must never pin infrastructure and names `prefer` in the forbidden list. `fgos-run/SKILL.md:80` (its own copy of G2) and :49 of the same file say an ad-hoc Unit may carry a soft `prefer` or `--provider`. This is drift: the fgos-run copy gained the ad-hoc exception and the capability-matching copy did not. | An agent writes a `--units` file with `prefer: codex` for one step that needs provider diversity. Under :27 that is forbidden; under fgos-run :80 it is allowed. | Medium |
| C2 | `AGENTS.md:229` and `_shared/capability-matching.md:42` vs `fgos-cook/references/case-and-doors.md:69` and `fgos-fanout/SKILL.md:84` | AGENTS.md says `unavailable` is not an error: do the work inline and report nothing. case-and-doors says `unavailable` "is a blocker to ask about". fanout reports such an id to the caller "as needing a person". | A fgos-cook slice whose capability has no configured executor. AGENTS.md says do it inline. The cook reference says stop and ask the owner. | Medium |
| C3 | `AGENTS.md:216` vs `fgos-researching/SKILL.md:69-75` | AGENTS.md says to run `decide` before any dispatch, including your own direct Agent/Task call, and a PreToolUse hook enforces it. fgos-researching says every fan-out branch goes to the native Task tool "always", with "no decide/resolve round trip". | fgos-researching splits a question into two independent branches and fires two Task calls without calling `decide`. The hook then refuses the call, or the agent breaks one of the two rules. | Medium-High |
| C4 | `AGENTS.md:216/231` and `_shared/capability-matching.md:49` vs `fgos-lead/SKILL.md:51` | AGENTS.md says `decide` first, then pass the executor it returned to `fgos run --provider`. capability-matching says leave `--provider` out unless one of the five reasons applies. The fgos-lead step always passes `--provider <id>` "(only these pass)", and the lead skill never calls `decide` (no match for `decide` in the file). | A lead dispatches a phase that has no reason to prefer a provider. It cannot follow all three statements at once, and it does not know where the `<id>` comes from. | Medium |
| C5 | `fgos-fanout/SKILL.md:81-84` and `wave-dispatch-mechanics.md:59` vs `fgos-fanout/SKILL.md:215`, `fgos-fanout/SKILL.md:234`, `wave-dispatch-mechanics.md:8-14` | :81-84 and :59 say an out-of-process candidate is fired by `fanout-batch.mjs`, which picks, runs and returns it, and only `unavailable` is reported. :234 and :8 say every non-in-process candidate is marked dispatch-unavailable and stays `todo`, never claimed. This is drift inside one skill: the out-of-process path was added and the older "non-in-process means unavailable" text was not updated. | A candidate resolves to `out-of-process`. One passage says fire it; the other says mark it unavailable and report it. | Medium |
| C6 | `fgos-routing/SKILL.md:117` vs `fgos-routing/SKILL.md:15`, `:38`, `:121` | :117 says Work items have no `stage` and step progression belongs to Workflow runs. The rest of the skill routes by stage (`discovery → exploring → planning → executing`), decides lanes "at stage planning", and says "every item carries a `workflowStep` field". This is drift: one paragraph describes the new model and the rest describes the old one. | A session claims an item that has a `workflowRunId`. It cannot tell whether to route by stage or resume the workflow run. | Medium |
| C7 | `fgos-shaping/SKILL.md:44` vs `AGENTS.md:20`, `_shared/coordination-driver.md:52`, `fgos-advise/SKILL.md:51` | Shaping says one question per turn and never several questions in one message. Priority #2 and the driver say to batch questions so that each time the owner comes back they answer as many as possible. | A shaper has three open points that only the owner can settle. Shaping says ask one per turn; AGENTS.md says gather them into one batch. Part of the tension is resolved by `fgos-shaping/SKILL.md:90` (formal questions go through the question store), but the conversational rule is still the opposite of priority #2. | Low-Medium |
| C8 | `_shared/coordination-driver.md:63-66` vs `fgos-architecture-panel/SKILL.md:125` | These give two vocabularies for one thing, the disposition of a finding. The driver uses accepted, rejected and deferred. The panel uses accepted, mitigated, answered, invalidated-by-evidence, deferred and unresolved. | An architecture-advisory run driven through fgos-advise's generic driver (`fgos-advise/SKILL.md:33`) records "mitigated", which the driver does not define. | Low |
| C9 | `_shared/capability-matching.md:57` and `_shared/executor-dispatch-fallback.md:106` vs `fgos-fanout/SKILL.md:75` plus `wave-dispatch-mechanics.md:59` | The first two say `decide` is called once per unit and that deciding again means deciding twice. Fanout calls `decide --work` per candidate, and then `fanout-batch.mjs` "re-confirms each candidate's mechanism". | Any fanout batch decides twice for each candidate. | Low |
| C10 | `_shared/executor-dispatch-fallback.md:132` vs `fgos-group-thinking/SKILL.md:87` | The fallback says run long calls in the background, wait for the harness notification, and do not poll. group-thinking says poll `fgos workflow status` until the run completes. The two apply to different doors (`fgos run` and `workflow start`), but neither says so. | An agent starts a council workflow and must choose between waiting for a notification and polling. | Low |
| C11 | `AGENTS.md:234` vs `_shared/executor-dispatch-fallback.md:3`, `_shared/executor-dispatch-fallback.md:315-322` | This is drift. AGENTS.md tells every dispatching skill to reference the fallback fragment as the canonical procedure. The fragment itself says it has no live consumer of its Steps A-C and survives only as a pattern and a list of reasons. | A skill author follows AGENTS.md and builds on a procedure that the fragment calls retired. | Low |
| C12 | `_shared/executor-dispatch-fallback.md:204` vs `src/util/session-identity.mjs:25-31` | This is a stale citation. The fragment cites `session-identity.mjs:134` and a "four-tier registry/env/pid/unresolved fallback". The function is at line 25 and resolves through the Rust identity door (`identityDoor().resolve()`). | An agent following the fragment builds the `<scope>` id from a fallback chain that no longer exists. | Low |
| C13 | `core/instructions/design-principles.md:10` vs `core/instructions/design-principles.md:45` | This is drift in the description field. It says "the owner's seven design principles" and lists seven, but the file now holds eight; principle 8, "One proof", was added at :45. | A projection or index built from the description leaves out the one-proof principle. | Low |
| C14 | `_shared/cook-worker-contract.md:16` vs `_shared/coding-worker-contract.md:46` | The cook worker contract says a stage that would ask a question takes its documented default and keeps going. The coding worker contract says that when the brief is not enough, do not guess and report `[BLOCKED]`. | A coding Unit run with a cook skill reaches a question about unclear scope. The two contracts give opposite instructions, and both can apply to the same worker. | Low |

## 4. Totals

- Duplicate clusters: 31 paraphrase clusters across about 123 statement locations, which is
  roughly a quarter of the 519 statements. The lexical scan's boilerplate is excluded.
- Repeated bytes: about 20.7 KB out of a 149.7 KB corpus, about 14% (roughly 10-18% given the
  ±30% error). Most of it sits in four families: dispatch and `fgos run` doctrine (clusters 1-6,
  about 5 KB), verification and asking-a-person doctrine (9-14, about 5.4 KB), role boundaries in
  skill and yaml pairs (21-22, about 1.4 KB), and skills that restate their own reference files
  (25-27, about 3.5 KB).
- Conflicts and drift: 14 in total, all from the scope given. 6 are Medium or above (C1-C6), and 4
  of those are drift where one copy was updated and another was not (C1, C5, C6, plus the partial
  drift in C4). The other 8 are Low or Low-Medium.

## 5. What this implies for ACE

Checks by id are not enough. Almost every conflict found here, including the ones that matter
most (C1, C2, C3, C5, C6), sits between statements that share no id and no wording. Each is a
paraphrase of one rule that was updated in one place and left behind in another, which is the
exact case that id checks and word-overlap checks cannot see. Declared relations ("this
statement applies rule X") would have caught them only if someone had declared the link, and
nobody did. That said, the volume is small: about 31 clusters and 14 conflicts in 520 statements.
So ACE does not need a heavy semantic engine on day one. Two things are enough now. First, store
each rule once and make the copies pointers. Clusters 1-6, 9, 12 and 21 alone remove most of the
repeated bytes and four of the six Medium conflicts. Second, run a content-based check at write
time that compares a new or edited rule against existing rules in the same topic (embedding
nearest neighbours plus a model judgement on the top few matches) and asks the author to link or
merge. A full periodic sweep like this one can stay a scheduled audit rather than a gate.

Status: DONE_WITH_CONCERNS
Summary: Found 31 paraphrase duplicate clusters (about 20.7 KB, roughly 14% of the statement corpus) and 14 conflicts or drift items, 6 of them Medium or above, mostly in the dispatch and fgos-run doctrine. These show that ACE needs content-aware duplicate detection at write time, not only checks by id.
Concerns: Byte figures are approximate because the TSV cuts statements at 300 bytes. Severity and owner choices are my judgement and have not been confirmed with the owner.
