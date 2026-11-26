# Gather-rules rerun: duplicates and conflicts after the gather

Date: 2026-11-27 (Asia/Saigon). Tree: worktree `261125-2041-gather-fgos-rules-to-one-owner-p01`, HEAD `123d46c79`,
read as on disk. The only file this audit wrote is this report.

## Method and inputs

- Old audit: `plans/reports/research-261125-1601-fgos-rule-duplicates-and-conflicts.md` (31 clusters, C1-C14). Its line
  numbers have drifted; every location below was found again by searching for the text and re-read on disk.
- Statement corpus: `.fgos/runtime/tmp/normative-rerun.tsv`, 1,228 lines (180,630 bytes) from 115 files: hand-written
  top of `AGENTS.md` (1 normative line left; the rest of the old AGENTS.md text now lives in units), `core/instructions`
  (24 units), `components/packaging-distribution/instructions` (1 unit), `domains/coding/instructions` (2 units),
  `core/skills`, `domains/coding/skills`, `core/agents`, `core/prompt-templates`. The TSV cuts long lines, so every
  candidate was re-read in its source file. Searches ran over the same directories, so lines the normative filter
  missed are covered too.
- Pointer lines (`Rule: <unit-id> (in AGENTS.md; ...)` or the comma form) in the corpus: 71 (19 of them are in the
  TSV). Most-cited units: capability-routing-rules 16, driver-discipline 14, dispatch-decide-door 11,
  run-door-contract 8, product-priority-order 7.
- Classification rules used:
  - **a**: one owner; every other place is a pointer, a pointer plus a local clause that adds something, or a use
    of the command in a local procedure without restating the rule.
  - **gloss** (listed, does not change the status): a pointer followed by at most one short clause that restates
    the owner and agrees with it.
  - **b**: the rule is restated without a pointer, or restated at length next to a pointer.
  - **c**: two places give instructions that cannot both be followed.
  - **d**: kept by design (clusters 25-28, and 21-22 where a persona yaml owns the rule and the skill points to it).
    These were still checked for conflicts.

## Task 1: the 31 clusters and C1-C14

Short paths: `S/` = `core/skills/`, `S/_s/` = `core/skills/_shared/`, `D/` = `domains/coding/skills/`, `I/` =
`core/instructions/`, `A/` = `core/agents/`.

| id | status | evidence (file:line) |
|---|---|---|
| 1 decide before dispatch | **b** | Owner `I/dispatch-decide-door.md:21,25`. Pointers: `S/_s/coordination-driver.md:44`, `S/_s/capability-matching.md:32,49`, `S/_s/executor-dispatch-fallback.md:66,97,107,239`. Still copies: `S/_s/executor-dispatch-fallback.md:42` ("Activation doctrine": call decide before executing any unit; `unavailable` means inline), `S/_s/planning-capability-awareness.md:67-73` (decide once right before execution, never while planning; names the fallback fragment as the owner), `D/fgos-coding-implement/SKILL.md:58-66` (decide first, no pointer; it adds "config wins over live Task access"). |
| 2 what each decide result means | **c** (low) | Owner `I/dispatch-decide-door.md:36-40`. Pointer plus local clause: `S/_s/executor-dispatch-fallback.md:66-71,106-107`. Copy that disagrees: `D/fgos-coding-implement/references/implement-and-collaboration.md:10-17`. It says `in-process` is "same as `unavailable`" (do the work yourself) and the agentType is optional. The owner says `in-process` means call your Agent/Task tool with the returned agentType. |
| 3 fgos run door contract | **b** | Owner `I/run-door-contract.md:21,23`. Pointers: `S/fgos-run/SKILL.md:25`, `S/_s/executor-dispatch-fallback.md:108-109`, `S/_s/capability-matching.md:41`. Copy: `S/_s/capability-matching.md:36` (read-only and sandboxed unless `--writes`, linked worktree, runner commits, `--capability` defaults to `execute`), and `:38` (`needsWrites`, read-only posture), both just before the pointer at :41. |
| 4 worker never commits | **b** | Owner `I/run-door-contract.md:25`. Pointers: `S/fgos-run/SKILL.md:81`, `S/_s/coding-worker-contract.md:107`, `S/_s/cook-worker-contract.md:26`. Copy: `S/_s/capability-matching.md:36` ("the runner commits only those paths, the worker never commits"). |
| 5 five reasons for an executor | **a** | Owner `I/capability-routing-rules.md:23-29`. Pointers: `S/_s/executor-dispatch-fallback.md:44-45`, `S/_s/capability-matching.md:17,32`, `S/fgos-lead/SKILL.md:52-53`. Gloss: `S/_s/capability-matching.md:39` (re-lists the reasons in a parenthesis). |
| 6 never pin infrastructure | **b** | Owner `I/capability-routing-rules.md:31-35` (it now carries the ad-hoc exception). Pointers: `S/_s/capability-matching.md:48`, `S/_s/planning-capability-awareness.md:59-60`, `S/fgos-advise/SKILL.md:141-142,171`, `S/fgos-advise/references/request-kinds-and-routes.md:94-96`. Glosses: `S/_s/capability-matching.md:27`, `S/fgos-run/SKILL.md:80`. Full copy: `S/_s/capability-matching.md:39` (soft preference tried first then failed over, never a pin; otherwise leave it out; presets and plans never name one; only a human `--override` pins). This is the owner's :35 almost word for word. |
| 7 capability is a routing signal | **a** | Owner `I/capability-routing-rules.md:37-39`. Pointers: `S/_s/capability-catalog.md:22`, `S/_s/capability-matching.md:50`, `S/_s/planning-capability-awareness.md:43-45`. |
| 8 research is a workflow | **a** | Owner `I/capability-routing-rules.md:41-43`. Pointer: `S/fgos-researching/SKILL.md:28-29`. Gloss: `S/_s/capability-catalog.md:114-115`. |
| 9 a claim is never evidence | **a** | Owner `I/driver-discipline.md:19-24`. Pointers: `S/_s/coordination-driver.md:56-57`, `S/_s/coding-worker-contract.md:101`, `S/fgos-fanout/SKILL.md:98`, `S/fgos-routing/SKILL.md:111`, `S/fgos-architecture-panel/SKILL.md:34`, `S/_s/cook-worker-contract.md:34-35`. Glosses or local applications without a pointer: `S/fgos-cook/SKILL.md:107` (facade hook value), `S/_s/coding-worker-contract.md:63-64`, `S/fgos-fanout/SKILL.md:243-244` (red-flag line). |
| 10 disposition and recheck | **a** | Owner `I/driver-discipline.md:26-35`. Pointers: `S/_s/coordination-driver.md:61,69`, `S/fgos-cook/references/case-and-doors.md:132` (plus a cook-local mapping). `S/fgos-cook/SKILL.md:108` is a cook facade value that adds cook-specific criteria. |
| 11 a refusal is an answer | **b** | Owner `I/driver-discipline.md:37-39`. Pointers: `S/_s/coordination-driver.md:34`, `S/fgos-lead/SKILL.md:49`, `S/_s/executor-dispatch-fallback.md:137-138`. Copy: `S/fgos-cook/SKILL.md:93-94` ("a refusal is an answer. Read its code and condition, re-observe, change the proposal, or stop"), plus `:77-78`. Local "never retry blind" lines that apply the rule to one failure kind: `S/fgos-lead/SKILL.md:54`, `S/fgos-fanout/SKILL.md:54`, `D/fgos-coding-driving/SKILL.md:58`, `D/fgos-coding-driving/references/loop-mechanics.md:43`. |
| 12 ask only when needed, batch | **a** | Owner `I/product-priority-order.md:21`. Pointers: `S/_s/coordination-driver.md:52` (plus local triggers), `S/fgos-cook/SKILL.md:59`, `S/fgos-advise/SKILL.md:51`, `S/fgos-shaping/SKILL.md:44`. Gloss: `S/fgos-supervisor/SKILL.md:170-171` ("batched: collect what you need, ask once"). Local applications: `S/fgos-cook/SKILL.md:55-58`, `S/_s/plan-contract.md:134-136`. |
| 13 decide and report instead of asking | **b** | Three places own the frame form of the rule: `I/product-priority-order.md:21-22` (inside the approved frame decide; about to leave it, stop and ask), `I/decision-question-template.md:16` (same sentence), and `S/_s/decision-question.md:23-24` (same two bullets). Gloss: `S/_s/plan-contract.md:79`. |
| 14 frame narrowed, never widened | **a** | Owner `S/_s/decision-question.md:24-28`. `S/fgos-cook/SKILL.md:121-122` cites it and adds the cook consequence (a widened frame is a new proposal). Gloss: `S/fgos-supervisor/SKILL.md:172`. |
| 15 RUL11 | **a** | Owner `I/rul11-tum-lum.md`. Pointer: `S/_s/decision-question.md:25`. Gloss: `:26` (building a new tool to consolidate is a decision question, which the unit already says). |
| 16 untrusted input | **b** | Owner `I/untrusted-input.md`. Core skills all point to it (`S/fgos-clarifying/SKILL.md:90`, `S/fgos-fanout/SKILL.md:126`, `S/fgos-researching/SKILL.md:77`, `S/fgos-routing/SKILL.md:201`, `S/fgos-shaping/SKILL.md:57`). The coding skills still carry their own copy with no pointer: `D/fgos-coding-planning/SKILL.md:70-71`, `D/fgos-coding-validating/SKILL.md:71-73`, `D/fgos-coding-exploring/SKILL.md:62-63`, `D/fgos-coding-implement/SKILL.md:95-97`, `D/fgos-coding-shaping/SKILL.md:48-50` (cites a runner spec, not the unit), `D/fgos-coding-knowledge/SKILL.md:21` (adds the tmp-file method). Local applications with no pointer: `D/fgos-coding-exploring/references/scope-and-reclaim.md:37-40`, `D/fgos-coding-driving/references/loop-mechanics.md:79-81`. |
| 17 convention paths | **a** | Owner `I/convention-paths.md`. `S/_s/plan-contract.md:30-31` and `S/fgos-shaping/SKILL.md:29-31` point to it. Other hits only use the command for one path kind. |
| 18 id minting | **a** | Owner `I/id-minting.md`. Pointer: `S/fgos-secretary/SKILL.md:52`. |
| 19 owner questions only through `fgos questions ask` | **b** (minor) | Owner `S/_s/decision-question.md:46`. These cite the fragment: `S/fgos-supervisor/SKILL.md:170`, `S/fgos-shaping/SKILL.md:88`, `S/_s/plan-contract.md:77-78`. Restated with no pointer: `S/fgos-lead/SKILL.md:87` ("there is no other channel"). |
| 20 writes to main | **b** | Owner `I/writes-to-main.md`. Pointer: `S/fgos-supervisor/SKILL.md:178`. Copies with no pointer: `S/fgos-lead/SKILL.md:22-26` (do not land a wait, progress, review note or owner answer; repeats the "main starved" evidence), `S/fgos-shaping/SKILL.md:58-62` (land at a checkpoint, not every round; repeats the commit-count evidence). Both add local details but restate the rule and its evidence. |
| 21 head role boundary (skill vs persona) | **c** | The secretary, supervisor and planner skills point to their yaml (`S/fgos-secretary/SKILL.md:15`, `S/fgos-supervisor/SKILL.md:18`, `S/_s/plan-contract.md:34`). The shaper boundary lives only in `A/shaper.yaml`. Lead: `S/fgos-lead/SKILL.md:7-8,13-14` restates `A/lead.yaml:4-5,19` and does not point to it. Conflict: `A/lead.yaml:20-21` (`on_wake`) says end the wake with the plan-file update "(phase `done`, or parked with a reason) landed by `fgos land --paths`". `S/fgos-lead/SKILL.md:16,18-26` says parking is an event, never a commit of the plan file (the one exception is a ticket still running after 12 waits). Minor restatements: `S/fgos-secretary/SKILL.md:15-19` (lands only portfolio files, holds the supervisor's powers asleep). |
| 22 precedence; supervisor stops only heads | **d** (one copy left) | Both skills point to the yaml: `S/fgos-secretary/SKILL.md:22-23`, `S/fgos-supervisor/SKILL.md:21-22`. The precedence sentence is still in two persona files, which agree: `A/secretary.yaml:14-15` and `A/supervisor.yaml:10-11`. "Stops only heads": `A/supervisor.yaml:9-10,19`, plus `S/fgos-supervisor/SKILL.md:21`, which adds that `session stop` refuses other sessions. No conflict. |
| 23 one owning proof | **b** | Owner `I/design-principles.md:46-56` (principle 8). Pointer: `S/fgos-run/SKILL.md:90`. Copy: `S/fgos-run/SKILL.md:92-93` (only a new module or boundary gets a new file; the test title names the behaviour; the reason no existing test proves it). Items 3-4 and the suite quote at `:94-98` add review steps. Partial overlap: `I/definition-of-done.md:29-32` points to principle 8, then restates "find the owning proof and extend it". |
| 24 run declared verify; full suite at gates | **a** | Owner `domains/coding/instructions/coding-verification-discipline.md:16`. Pointer: `S/_s/coding-worker-contract.md:102`. `S/fgos-cook/references/reading-ak-plans.md:27` applies it to cook slices and agrees. |
| 25 fgos-advise routes | **d** | The `--seats` bases (`S/fgos-advise/references/request-kinds-and-routes.md:104`, `S/fgos-advise/SKILL.md:69-70,95-96`, `S/fgos-group-thinking/SKILL.md:108,124-125`) and the four ask conditions (`request-kinds-and-routes.md:86`, `S/fgos-advise/SKILL.md:51`) agree. No conflict. |
| 26 fanout mechanics | **d** | `S/fgos-fanout/SKILL.md:81-83,186` and `S/fgos-fanout/references/wave-dispatch-mechanics.md:8-14,57-63` now agree: out-of-process is fired by the fanout entry, and only `unavailable` is reported. No conflict. |
| 27 distill rules | **d** | `S/distill/SKILL.md:152,161,163` and `S/distill/references/extract-rules.md:29,34`, `deep-dive-protocol.md:24`, `consult-protocol.md:86` agree, and the references cite the SKILL.md red-flags list. No conflict. |
| 28 panel prompt templates | **d** | `core/prompt-templates/architecture-advisory-panel-v1-synthesis.md:19` and `-interpretation.md:11` (calibrate per claim or inference, not per document); `-critique.md:16-17` and `-interpretation.md:20` (never a shaper's private notes). They agree. |
| 29 read domain doctrine | **a** | Owner `I/domain-doctrine-read.md`. Pointers: `S/fgos-routing/SKILL.md:179`, `S/fgos-shaping/SKILL.md:27`. Glosses: `S/fgos-shaping/SKILL.md:27-28` (ask one line, never assume a domain, which the unit already says), `S/fgos-routing/SKILL.md:178`. |
| 30 generated text is regenerated | **a** | Owner `I/design-principles.md:44-45`. `S/instruction-audit/SKILL.md:123` is the audit's own check. `S/fgos-cook/references/reading-ak-plans.md:19` and `I/dispatch-decide-door.md:44` are specific applications. |
| 31 background, wait for notification | **a** | Owner `I/run-door-contract.md:27-29`. Pointers: `S/fgos-fanout/references/wave-dispatch-mechanics.md:49`, `S/_s/executor-dispatch-fallback.md:108-109`. `S/fgos-advise/SKILL.md:110` and `S/fgos-group-thinking/SKILL.md:87` poll `workflow status`, which agrees with the owner's `workflow start` clause at :29. |
| C1 `prefer` in Units | **a** | `I/capability-routing-rules.md:33-35` carries the ad-hoc exception, and every other copy agrees with it. |
| C2 `unavailable` in fgos-cook | **c** | `S/fgos-cook/SKILL.md:89-91`: "`unavailable` ... is a blocker to ask about, not permission to do it inline." Against it: `S/fgos-cook/references/case-and-doors.md:69-70` ("`unavailable` means you run the slice inline in this session", with a pointer) and `I/dispatch-decide-door.md:38`. The cook's own reference was fixed; its SKILL.md was not. |
| C3 fgos-researching Task fan-out | **a** | `I/dispatch-decide-door.md:23` makes the PreToolUse hook the decide for each Task call. `S/fgos-researching/SKILL.md:69-72` points to it. |
| C4 fgos-lead `--provider` and decide | **c** (low) | The `--provider` half is fixed: `S/fgos-lead/SKILL.md:51-53` makes it optional, used only for the five reasons, with a pointer. What remains: the lead dispatches through `fgos run` without ever running `fgos dispatch decide` (no `decide` in `S/fgos-lead/SKILL.md`). `I/dispatch-decide-door.md:21` says to run decide before any dispatch out of the turn. |
| C5 fanout out-of-process | **a** | See cluster 26. `S/fgos-fanout/references/wave-dispatch-mechanics.md:8-10` and `S/fgos-fanout/SKILL.md:81-83` agree. |
| C6 fgos-routing stage vs workflow run | **a** | `S/fgos-routing/SKILL.md:115` routes by `workflowRunId` first, and `:117` labels stage routing as legacy for items without it. |
| C7 one question per turn vs batch | **a** | `S/fgos-shaping/SKILL.md:42-44` now splits the cases: one question per turn applies in live conversation, and formal owner questions are batched in the store with a pointer to priority 2. `A/shaper.yaml:10` ("batched") refers to the formal questions. The tension between the two is low and stated openly. |
| C8 disposition vocabularies | **a** | `I/driver-discipline.md:33` names the generic set and lets a role skill use a finer set (the architecture panel's), with no mapping invented. |
| C9 decide twice in fanout | **a** | `I/dispatch-decide-door.md:25` says a batch re-confirmation is the same dispatch's bind check. `S/fgos-fanout/SKILL.md:72-73` points to it. |
| C10 notification vs polling | **a** | `I/run-door-contract.md:29` says which wait rule applies to which door. |
| C11 fallback fragment as canonical | **c** (low drift) | `I/dispatch-decide-door.md:44` says the fragment is named "for its pattern and its list of reasons", and `S/_s/executor-dispatch-fallback.md:286-294` says six skills cite its "Valid reasons to dispatch" list "above". The fragment no longer holds that list: `:44-45` is only a pointer to `I/capability-routing-rules.md`. The coding skills cite the fragment for "different backend" (`D/fgos-coding-planning/SKILL.md:56`, `D/fgos-coding-validating/SKILL.md:65`, `D/fgos-coding-exploring/SKILL.md:51`), not the owner unit. |
| C12 session-identity citation | **a** | `S/_s/executor-dispatch-fallback.md:176-177` cites `resolveWriterIdentity` and `identityDoor().resolve()`, which matches `src/util/session-identity.mjs:16-32`. The `pid` source it mentions exists (`packages/identity/rust/src/resolve.rs:28,68-69`). |
| C13 design-principles count | **a** | `I/design-principles.md:9` says "eight" and names all eight. |
| C14 cook vs coding worker on questions | **a** | `S/_s/coding-worker-contract.md:53-55` and `S/_s/cook-worker-contract.md:17-19` cite each other: a stage question takes its documented default, and a missing brief field means BLOCKED. |

Counts: clusters a 14 (5, 7, 8, 9, 10, 12, 14, 15, 17, 18, 24, 29, 30, 31), b 10 (1, 3, 4, 6, 11, 13, 16, 19, 20,
23), c 2 (2, 21; both also still hold copies), d 5 (22, 25-28). C-items: a 11 (C1, C3, C5-C10, C12-C14), c 3 (C2, C4,
C11).

## Task 2: each core/instructions unit, copies outside pointers

| unit | copies or overlaps elsewhere (not pointers) |
|---|---|
| before-touching-code | `S/_s/plan-contract.md:138` ("say what the plan reused and what was missing" is the unit's last sentence, with no pointer). |
| capability-routing-rules | `S/_s/capability-matching.md:39` (ad-hoc exception, full copy). New cluster N1, "never delegate your own reasoning to an Agent/Task sub-dispatch; route through the executor mechanism only when another backend is needed": this is the unit's default-inline rule plus reason 3. It appears in `D/fgos-coding-planning/SKILL.md:51-56`, `D/fgos-coding-validating/SKILL.md:57-65`, `D/fgos-coding-exploring/SKILL.md:46-51` and `D/fgos-coding-implement/references/implement-and-collaboration.md:10-16`. All of them point to the fallback fragment, not the unit. |
| convention-paths | none. |
| decision-question-template | `S/_s/decision-question.md:23-24` and `I/product-priority-order.md:21` restate its frame sentence (cluster 13). The five parts in the unit are a summary of the fragment it points to, which is by design. |
| definition-of-done | Overlaps `I/design-principles.md` principle 8 at `:29-32` (cluster 23). |
| design-principles | Principle 1-2 copied: `S/_s/coding-worker-contract.md:75-85` (rule 5: search before adding, import the shared module the guard names, never copy, move every consumer and delete the old path), `D/fgos-coding-implement/SKILL.md:75-90` (same, says "same rule as ... AGENTS.md 'Design principles'" but is not in pointer form). Principle 1's "move every consumer, delete the old path (L10)" is also in `I/rul104-better-not-bigger.md:23-24` ("đổi một contract thì chuyển mọi caller và xoá đường cũ trong cùng đợt (L10)"), so two units carry it. Principle 8: `S/fgos-run/SKILL.md:92-93`. |
| destructive-cleanup | Partial overlap with `domains/coding/instructions/coding-worktree-safety.md:20` ("delete named paths, assert the directory before any destructive step, remove a worktree with `fgos worktree remove`"). That unit adds what the delete guard does and does not catch. |
| dispatch-decide-door | `S/_s/executor-dispatch-fallback.md:42`, `S/_s/planning-capability-awareness.md:67-73`, `D/fgos-coding-implement/SKILL.md:58-66` (cluster 1). `D/fgos-coding-implement/references/implement-and-collaboration.md:10-17` restates the three results and disagrees on `in-process` (cluster 2). `S/fgos-cook/SKILL.md:89-91` disagrees on `unavailable` (C2). |
| domain-doctrine-read | Glosses only (cluster 29). |
| driver-discipline | `S/fgos-cook/SKILL.md:77-78,93-94` (refusal, cluster 11). Glosses: `S/fgos-cook/SKILL.md:107`, `S/_s/coding-worker-contract.md:63-64`, `S/fgos-fanout/SKILL.md:243-244`. |
| gateway-start-door | none. |
| id-minting | none. |
| impact-analysis-capability-gate | The three postures and what each means are restated in `D/fgos-coding-implement/references/implement-and-collaboration.md:44-50` (Full: run it; Degraded: proceed and say the blast radius is unconfirmed; Inactive: proceed without it) and `D/fgos-coding-planning/references/approach-and-shape.md:17-23` (inactive drops it, degraded marks it weak, full keeps it). These refer to "`CLAUDE.md`'s impact-analysis capability gate" rather than the unit's pointer form, as do `D/fgos-coding-exploring/references/scope-and-reclaim.md:57-69` and `D/fgos-coding-validating/references/bootstrap-and-reality-gate.md:41-45`. Those two only name the posture line to record, so they count as pointers. |
| install-setup-doctor-gate | none. |
| legacy-node-cli-boundary | No copy. Low tension: `S/_s/fgos-cli-fallback.md:5-8,16-24` falls back to `node bin/fgos.mjs` with no caveat. The unit says that channel is unsupported for the process, lock and identity verbs, and that checkout code runs through `npm run fgos:dev`. |
| mission-boundary | none. |
| platform-operating-laws | none. |
| product-priority-order | Cluster 13 (frame sentence in three places). Glosses: `S/fgos-supervisor/SKILL.md:170-172`. |
| rul104-better-not-bigger | Overlaps design-principles 1 (see above). |
| rul11-tum-lum | Gloss: `S/_s/decision-question.md:26`. |
| run-door-contract | `S/_s/capability-matching.md:36,38` (clusters 3-4). |
| scratch-artifacts | none. |
| untrusted-input | Six coding-skill copies and two local applications (cluster 16). |
| writes-to-main | `S/fgos-lead/SKILL.md:22-26`, `S/fgos-shaping/SKILL.md:58-62` (cluster 20). |

New conflicts this rerun found, outside the old C-list:

- **N-c1** `D/fgos-coding-implement/references/implement-and-collaboration.md:17` vs `I/dispatch-decide-door.md:39`: what to
  do on `in-process` (cluster 2).
- **N-c2** `A/lead.yaml:20-21` vs `S/fgos-lead/SKILL.md:16,18-26`: whether a park is landed as a plan-file commit (cluster 21).

## Verdict

**Yes.** Duplicates outside pointers remain, and so do conflicts:

- Still duplicated: clusters 1, 3, 4, 6, 11, 13, 16, 19, 20, 23, plus N1 (never delegate reasoning, 4 places), the
  impact-gate posture (2 places), design principles 1-2 (2 skill copies, plus rul104 carrying principle 1's L10
  clause) and prior art (`S/_s/plan-contract.md:138`).
- Still conflicting: C2 (`S/fgos-cook/SKILL.md:89-91`), C4 (low: the lead never runs decide), C11 (low drift: a stale
  "list of reasons" reference), and the new N-c1 (implement `in-process`) and N-c2 (lead.yaml `on_wake` vs fgos-lead
  parking).
- Resolved: C1, C3, C5, C6, C7, C8, C9, C10, C12, C13, C14. Kept by design and free of conflict: clusters 22 (one
  persona-to-persona copy left), 25, 26, 27, 28.

Status: DONE
