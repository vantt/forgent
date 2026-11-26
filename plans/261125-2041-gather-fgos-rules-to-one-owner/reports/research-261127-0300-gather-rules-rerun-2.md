# Gather fgOS rules to one owner: independent rerun audit 2

Date: 2026-11-27 (Asia/Saigon). Independent audit; I judged by meaning and checked every claim in
the files of the worktree `261125-2041-gather-fgos-rules-to-one-owner-p01` (HEAD `ecc52ee39`). The
earlier rerun report and `gather-table.md` were not read. The only file written is this report.

## Method and inputs

- Old audit: `plans/reports/research-261125-1601-fgos-rule-duplicates-and-conflicts.md`, which lists
  31 duplicate clusters and conflicts C1-C14. Its line numbers have drifted, so I found each
  location again by its text.
- Today's normative lines: `.fgos/runtime/tmp/normative-rerun.tsv` holds 1,207 lines (177,646
  bytes) from 115 files. Each line is cut at about 300 characters. The TSV picks lines by keyword
  (never/only/always/do not), so it leaves out many statements and many `Rule:` pointer lines.
  Only 21 of the 103 pointer occurrences in the corpus are in it. For that reason I also grepped
  the source files directly (`core/skills`, `domains/coding/skills`, `core/agents`,
  `core/prompt-templates`, the three instruction directories and the top of `AGENTS.md`), and I
  opened each candidate at its line.
- Instruction units: I read all 27 units: 24 in `core/instructions/`, 2 in
  `domains/coding/instructions/` and 1 in `components/packaging-distribution/instructions/`. I
  checked them against `.fgos/instructions/effective/rules.json` (26 rules) and against the
  projection block in `AGENTS.md` (lines 94-623).
- Pointers: there are 103 `Rule: <unit-id>` occurrences across 17 unit ids. Each one counts as a
  pointer. A pointer plus a short local clause counts as fine. A clause that only says again what
  the unit already says counts as a copy, even when a pointer sits next to it.
- Kept by design, checked only for conflict: clusters 22 and 25-28,
  `product-priority-order.md` and `definition-of-done.md` against the template and principle 8,
  the anchored frame sentence, and RUL104 against principle 1.

### An integrity finding that affects many pointers (read first)

- **`product-priority-order` is not in force anywhere an agent reads it.** The unit
  `core/instructions/product-priority-order.md` exists (valid_from 2026-11-27, last changed
  00:11 +07). It is missing from `.fgos/instructions/effective/rules.json`, which was regenerated at
  01:08 +07, and from the `AGENTS.md` projection. The top of `AGENTS.md` no longer carries the
  priority text either. Seven pointers say "Rule: product-priority-order, in AGENTS.md":
  `fgos-shaping/SKILL.md:44`, `coordination-driver.md:35,52,71`, `fgos-cook/SKILL.md:59`,
  `fgos-advise/SKILL.md:51` and `fgos-architecture-panel/SKILL.md:115`. Three prose references
  point at the same missing text: `capability-routing-rules.md:29` ("priority #1 in
  `AGENTS.md`"), `decision-question.md:49` ("AGENTS.md product priority #2") and
  `core/agents/secretary.yaml:29` ("by the product priority in AGENTS.md"). All ten point at
  nothing until the set is regenerated. The likely cause is that valid_from is later than the
  generation date in UTC. I did not verify this.
- **`coding-verification-discipline` is not in AGENTS.md.** It is in `rules.json` with domain
  scope, but the `AGENTS.md` projection renders only the repo key. The pointer at
  `core/skills/_shared/coding-worker-contract.md:95` says "in AGENTS.md", which is wrong.

## Task 1: the old clusters and conflicts now

Status: (a) one owner plus pointers only; (b) still duplicated; (c) still conflicting; (d) kept by design.

| # | Rule | Status | Owner now / remaining copies (file:line) |
|---|---|---|---|
| 1 | Run `decide` before dispatch; never choose the mechanism | a | Owner `dispatch-decide-door.md:21`. Every old copy is now a pointer: `capability-matching.md:32,49`, `executor-dispatch-fallback.md:42,97`, `coordination-driver.md:44`, `fgos-lead/SKILL.md:49`, `fgos-coding-implement/SKILL.md:58`. The unit itself now has an internal tension; see new conflict X4. |
| 2 | What to do with each `decide` result | b (minor) | Owner `dispatch-decide-door.md:38-40`. `executor-dispatch-fallback.md:134-135` ("nothing to log by hand: the run's provenance … is already under `.fgos/assignments/<unitRunId>/`") says again what `dispatch-decide-door.md:40` says. The fragment's own branches (`:66-71`) and `implement-and-collaboration.md:10-17` are local applications and are fine. |
| 3 | `fgos run` door: read-only without writes, writes need a linked worktree, provider is soft | b | Owner `run-door-contract.md:21,23`. Remaining copies: `fgos-run/SKILL.md:83` ("every file mutation runs strictly inside an isolated linked git worktree") and `fgos-run/SKILL.md:82` (herdr default, also stated in `run-door-contract.md:27`). Between units: `dispatch-decide-door.md:40` repeats the `--capability` default (`execute`) and "runner commits only those paths" from `run-door-contract.md:23,25`. |
| 4 | Worker never commits; runner commits declared writes | a | Owner `run-door-contract.md:25`. `fgos-run/SKILL.md:81`, `coding-worker-contract.md:100` and `cook-worker-contract.md:26` are pointers with local additions. The unit-to-unit overlap in `dispatch-decide-door.md:40` is listed under 3. |
| 5 | Five reasons justify an executor | a | Owner `capability-routing-rules.md:23-29`. `capability-matching.md:39` is a pointer with a short gloss. `executor-dispatch-fallback.md:44-45` and `fgos-lead/SKILL.md:51-52` are pointers. |
| 6 | Plans and Units never pin infrastructure | b (minor) | Owner `capability-routing-rules.md:33-35`. `fgos-cook/SKILL.md:36` ("You never set a provider, model or tier.") and `fgos-cook/SKILL.md:96` ("pin an executor") say the rule again with no pointer. `capability-catalog.md:101-110` (a catalog entry's identity) is local and fine. |
| 7 | A capability is a routing signal, not a Work item | a | Owner `capability-routing-rules.md:39`. `capability-catalog.md:22` and `capability-matching.md:50` are pointers. `planning-capability-awareness.md:71-74` adds a local nuance. |
| 8 | Research is a workflow, not a capability | a | Owner `capability-routing-rules.md:43`. `capability-catalog.md:114-115` (a pointer plus the catalog's own content) and `fgos-researching/SKILL.md:28-29` are fine. A new conflict with `instruction-audit` is listed as X5. |
| 9 | A worker's claim is never evidence | b (minor) | Owner `driver-discipline.md:19-24`. `coordination-driver.md:108` (invariant 4, "Independent Proof") says it again in the same file that points at `:56-57`. Other places are pointers or local fills: `fgos-cook/SKILL.md:106,118`, `fgos-fanout/SKILL.md:99`, `fgos-coding-implement/SKILL.md:80-83` (adds the `fgos return` detail). |
| 10 | Every finding gets a disposition and an independent recheck | a | Owner `driver-discipline.md:26-35`. `coordination-driver.md:61,69` and `case-and-doors.md:132` are pointers. `fgos-cook/SKILL.md:107` is a hook-slot fill. |
| 11 | A refusal is an answer; never retry blind | b (minor) | Owner `driver-discipline.md:39`. `coordination-driver.md:106` (invariant 2: "the driver re-observes instead of retrying blind") says it again. Local applications are fine: `fgos-lead/SKILL.md:53`, `fgos-fanout/SKILL.md:54`, `fgos-coding-driving/SKILL.md:58`. |
| 12 | Ask a person only when needed, batched, in the template | b (minor) | Owner `product-priority-order.md:21`, which is not in force (see above). `fgos-supervisor/SKILL.md:168-169` ("Ask the owner except through `fgos questions ask`, in the five-part form …, batched: collect what you need, ask once.") is a copy with no pointer. `coordination-driver.md:52`, `fgos-cook/SKILL.md:55-60` and `fgos-advise/SKILL.md:51` are pointers with local triggers. |
| 13 | When the analysis settles a choice, decide and report | b (minor, borderline) | Owner `product-priority-order.md:22`. `plan-contract.md:77-78` ("Decide whatever the evidence settles instead of asking.") is a copy with no pointer. The contract does say it also serves projects without fgOS (`:18`). `coordination-driver.md:35` and `fgos-architecture-panel/SKILL.md:115` are pointers. |
| 14 | Approved frame: may narrow, never widen; leaving it is a question | b | Owners: `decision-question-template.md:16` and `decision-question.md:17-27`. Copies: `fgos-cook/SKILL.md:120-121`, `fgos-cook/references/reading-ak-plans.md:50-51`, `fgos-cook/references/propose.md:56-57` ("never a quiet widening"), `fgos-coding-planning/references/approach-and-shape.md:41-42` ("never a silent overrun") and `fgos-supervisor/SKILL.md:172`. The two cook lines cite `decision-question.md` for "narrowed, never widened", but that fragment has no "narrowed" clause. `case-and-doors.md:29-31` (frame flags narrow the guide's defaults) is local and fine. |
| 15 | RUL11 | b (minor) | Owner `rul11-tum-lum.md`. `decision-question.md:24` is a pointer, but `:25` ("Consolidating by building a new tool or engine is a decision question.") says again the unit's "gom mà phải xây công cụ mới là một câu hỏi quyết định". |
| 16 | Item text is untrusted input | b (minor) | Owner `untrusted-input.md:16`. There are 11 pointers. `fgos-coding-driving/references/loop-mechanics.md:80-81` ("treating both fields as untrusted text — display as plain text only, never executed or interpreted") is a copy, and the driving skill has no pointer. `fgos-coding-exploring/references/scope-and-reclaim.md:37-40` adds local detail (pick one keyword) and is fine. |
| 17 | Report and plan paths come from `fgos convention path` | a | Owner `convention-paths.md:18`. `plan-contract.md:31` and `fgos-shaping/SKILL.md:31` are pointers. Other lines only call the door. |
| 18 | Mint ids through `fgos identity mint` | a | Owner `id-minting.md:16`. `fgos-secretary/SKILL.md:52` is a pointer. |
| 19 | Owner questions go only through `fgos questions ask` | b (minor) | Owner `decision-question.md:45`. `fgos-supervisor/SKILL.md:168-169` is the same copy as in 12. `fgos-shaping/SKILL.md:87` (adds flags and socket detail) and `fgos-lead/SKILL.md:86` are fine. |
| 20 | Land on main only what other sessions rely on | a, with conflicts X1 and X3 | Owner `writes-to-main.md:16-20`. `fgos-supervisor/SKILL.md:178`, `fgos-lead/SKILL.md:22` and `fgos-shaping/SKILL.md:58` are pointers. |
| 21 | Each head's boundary is stated in both the skill and the persona yaml | b | Every skill now says "Boundary: core/agents/<x>.yaml", then repeats part of it. Lead: `fgos-lead/SKILL.md:7-8`, `:13-15` and `:85` against `core/agents/lead.yaml:5,19`. Supervisor: `fgos-supervisor/SKILL.md:8` and `:166-170` against `supervisor.yaml:10,26`. Secretary: `fgos-secretary/SKILL.md:15-16` against `secretary.yaml:12`. Planner: `plan-contract.md:34-35` against `planner.yaml:13`. Shaper: resolved. |
| 22 | Precedence: owner, then secretary, then supervisor | d | `secretary.yaml:12`, `supervisor.yaml:10-11`. The skills point at them (`fgos-secretary/SKILL.md:22-23`, `fgos-supervisor/SKILL.md:21-22`). No conflict. |
| 23 | One owning proof per behaviour | a | Owner `design-principles.md:46-56`. `fgos-run/SKILL.md:90` is a pointer. Its checklist at `:92-94` adds the reviewer and evidence detail. `definition-of-done.md:29-30` is a pointer. |
| 24 | Declared verify per unit; full suite only at gates | a (pointer location wrong) | Owner `coding-verification-discipline.md:16`. `coding-worker-contract.md:95-96` is a pointer plus "once, near the end", but it says "in AGENTS.md", where the unit is not rendered. |
| 25 | fgos-advise and group-thinking routing | d | Consistent (`request-kinds-and-routes.md:86-95`, `fgos-advise/SKILL.md:51`). |
| 26 | Fanout skill and its mechanics | d | Consistent (`fgos-fanout/SKILL.md:66-82,186` and `wave-dispatch-mechanics.md:8-14,57-63`). |
| 27 | Distill rules | d | No conflict found. |
| 28 | Panel prompt templates | d | No conflict found. |
| 29 | Read `domains/<domain>/AGENTS.md` | b (minor) | Owner `domain-doctrine-read.md:16`. `fgos-shaping/SKILL.md:27-28` copies the unit's last sentence word for word after its pointer. `fgos-routing/SKILL.md:178-179` and `:231` say the unit's first sentence again (the payload-path detail at `:180-183` is local and fine). |
| 30 | Generated text is regenerated, never hand-copied | a | Owner `design-principles.md:44-45`. `plan-contract.md:105` and `instruction-audit/SKILL.md:122` are pointers. |
| 31 | Background a long call and wait for the notification | b (minor) | Owner `run-door-contract.md:27-29`. `wave-dispatch-mechanics.md:49` is a pointer. `fgos-coding-implement/references/return-mechanics.md:5-9` gives the full wait rule again for `fgos return`, with no pointer. `fgos-run/SKILL.md:56-59` repeats the `workflow start` detach-and-poll rule of `run-door-contract.md:29`. |
| C1 | `prefer` in a units file | resolved | `capability-routing-rules.md:35` names the ad-hoc exception. `capability-matching.md:27` and `fgos-run/SKILL.md:37,80` agree. |
| C2 | `unavailable` means inline or ask | resolved | `case-and-doors.md:69-70` and `fgos-cook/SKILL.md:89-90` run the work inline. `fgos-fanout/SKILL.md:82` hands it to the caller to run inline. One wording difference remains: the unit says "report nothing", while the cook "reports it as an inline slice" for the ledger. I do not count this. |
| C3 | Researching fan-out without `decide` | resolved | `dispatch-decide-door.md:23` makes the hook the decide for each Task call. A new tension, X4, comes from this. |
| C4 | Lead `--provider` and decide | resolved | `fgos-lead/SKILL.md:49-52`: decide first; the provider is optional, only for the five reasons. |
| C5 | Fanout out-of-process versus unavailable | resolved | `fgos-fanout/SKILL.md:78-82,186` and `wave-dispatch-mechanics.md:8-14,57-63` agree. |
| C6 | Routing by stage versus Workflow run | resolved | `fgos-routing/SKILL.md:115-119` splits items into those with `workflowRunId` and legacy items. |
| C7 | Shaping asks one question per turn versus batching | resolved | `fgos-shaping/SKILL.md:42-44` keeps one question per turn in the live chat and batches formal questions in the store. |
| C8 | Two disposition vocabularies | resolved | `driver-discipline.md:33` allows a finer set inside a skill. |
| C9 | Fanout decides twice | resolved | `dispatch-decide-door.md:25`: a batch re-confirmation is a bind check. |
| C10 | Notification versus polling | resolved | `run-door-contract.md:29` splits `fgos run` from `workflow start`. |
| C11 | Fallback called canonical but retired | resolved | `dispatch-decide-door.md:44`: the fallback is named only for its pattern. |
| C12 | Stale `session-identity` citation | resolved | `executor-dispatch-fallback.md:176-177` cites `identityDoor().resolve()`, which matches `src/util/session-identity.mjs:25-32`. The pid source still exists (`packages/identity/rust/src/resolve.rs:28`). |
| C13 | "Seven principles" | resolved | `design-principles.md:10` says "eight". |
| C14 | Cook default versus coding `[BLOCKED]` | resolved | `cook-worker-contract.md:16-19` and `coding-worker-contract.md:54-56` now separate a stage question with a default from a missing brief field. |

## Task 2: findings per unit and conflicts across the corpus

### Copies of a unit outside pointers (all from the sweep)

| Unit | Copy (file:line) | What repeats |
|---|---|---|
| capability-routing-rules | `fgos-cook/SKILL.md:36`, `:96` | Never pin a provider, model, tier or executor |
| decision-question-template | `fgos-cook/SKILL.md:120-121`, `fgos-cook/references/reading-ak-plans.md:50-51`, `fgos-cook/references/propose.md:56-57`, `fgos-coding-planning/references/approach-and-shape.md:41-42`, `fgos-supervisor/SKILL.md:172` | Leaving the approved frame is a stop and a question |
| design-principles (principle 1) | `before-touching-code.md:27-29` (between units) | "Reuse or extend what is found; say in the plan what was reused" |
| dispatch-decide-door | `executor-dispatch-fallback.md:134-135` | Nothing to log by hand; provenance under `.fgos/assignments` |
| dispatch-decide-door / run-door-contract | `dispatch-decide-door.md:19` and `run-door-contract.md:27` (between units), plus `fgos-run/SKILL.md:82` | herdr is the default transport / watched pane |
| run-door-contract | `dispatch-decide-door.md:40` (between units); `fgos-run/SKILL.md:83`; `fgos-run/SKILL.md:56-59`; `fgos-coding-implement/references/return-mechanics.md:5-9` | Capability default, runner commit, linked-worktree writes, detach and poll, background and notification |
| run-door-contract / capability-routing-rules | `capability-routing-rules.md:35` and `run-door-contract.md:23` (between units) | "a soft preference that `bind()` tries first and fails over from" |
| driver-discipline | `coordination-driver.md:106`, `:108` | Re-observe and don't retry blind; independent proof |
| product-priority-order | `fgos-supervisor/SKILL.md:168-169`; `plan-contract.md:77-78` (borderline) | Batch owner questions and ask once; decide what the evidence settles |
| rul11-tum-lum | `decision-question.md:25` | Consolidating by building a new tool is a decision question |
| untrusted-input | `fgos-coding-driving/references/loop-mechanics.md:80-81` | Item text is untrusted, never executed or interpreted |
| domain-doctrine-read | `fgos-shaping/SKILL.md:27-28`; `fgos-routing/SKILL.md:178-179,231`. The unit's own last sentence (`domain-doctrine-read.md:16`, "When the domain is unknown, ask the person one line; never assume one") repeats `fgos-clarifying/SKILL.md:86-89,134`, which owns domain classification | Read the domain doctrine first; ask one line when the domain is unknown |
| destructive-cleanup | `coding-worktree-safety.md:20`, last sentence (between units) | Delete named paths, assert the directory, remove a worktree with `fgos worktree remove` |
| run-door-contract (inside the unit) | `run-door-contract.md:21` and `:23` | Read-only without writes, linked worktree, soft provider, said twice in one unit |

Units with no copy outside pointers: convention-paths, definition-of-done (overlap kept by design),
gateway-start-door, id-minting, impact-analysis-capability-gate (the coding skills point and only
record the posture), install-setup-doctor-gate, legacy-node-cli-boundary, mission-boundary,
platform-operating-laws, rul104-better-not-bigger, scratch-artifacts, writes-to-main (see the
conflicts below), coding-verification-discipline, coding-worktree-safety and docs-only-verification.
Three persona `must_escalate` lines ("Anything outside the approved frame", in `shaper.yaml:20`,
`secretary.yaml:31` and `supervisor.yaml:24`) restate the frame rule as a persona boundary. The old
audit excluded them as boilerplate; I list them here and do not count them.

### Conflicts

| # | Locations | What each says | Severity |
|---|---|---|---|
| X1 | `writes-to-main.md:20` vs `fgos-shaping/SKILL.md:59-61` | The unit says never leave an edit uncommitted in the main checkout while you wait. Shaping says a round that ends waiting for the owner does not land, and between checkpoints the file stays in the main checkout. | Medium |
| X2 | `fgos-shaping/SKILL.md:60` vs `fgos-coding-shaping/SKILL.md:37-39,56-57` | The shared text puts the discussion file in the main checkout. The coding overlay writes only in a linked worktree on a plain branch and commits there at the end of every round that changed the file. Shaping `:22-23` says the shared part "lives only here", so the overlay contradicts it instead of adding to it. | Low-Medium |
| X3 | `core/agents/lead.yaml:21` ("a park raised as an event … (never a commit)") and `writes-to-main.md:16` (never a "parked" note) and `fgos-lead/SKILL.md:15-16,65` vs `fgos-lead/SKILL.md:24` ("The one allowed park commit is a ticket still `running` after 12 waits") and `:56` ("park the phase in the plan file with the ticket id") | The persona file and the unit allow no park commit. The skill allows one. | Low |
| X4 | `dispatch-decide-door.md:21` vs `:23`; in practice `instruction-audit/SKILL.md:96-98` vs `fgos-researching/SKILL.md:60-62` | Line 21 says to run `decide` before your own Agent/Task call. Line 23 says the hook is the decide, so a fan-out needs no further decide. instruction-audit runs a manual `decide` before spawning; researching runs none. | Low-Medium |
| X5 | `instruction-audit/SKILL.md:96` vs `capability-routing-rules.md:43` | instruction-audit runs `fgos dispatch decide --for research --needs-soul`. The unit says research is "never a valid `decide --for` argument" and makes no exception for a `--needs-soul` label. | Low |

These do not conflict: `fgos ask` (Work-item gate) and `fgos questions ask` (owner store) are two
doors by design (`docs/platform/questions/spec.md:17`); the fanout retry after re-entering the
worktree (`fgos-fanout/SKILL.md:143-146`) follows a corrective step, so it is not a blind retry; and
the skip in `verify-commit-and-iron-law.md:7-10` is covered by `fgos return`, which re-runs verify.

## Verdict

Yes. Duplicates outside pointers and conflicts remain beyond the kept-by-design list:
- **Pointers that point at nothing:** product-priority-order is out of the set in force and out of
  `AGENTS.md`, so 7 pointers and 3 prose references dangle. The coding-verification-discipline
  pointer names `AGENTS.md`, where the unit is not rendered.
- **Conflicts:** X1-X5.
- **Duplicates still open:** clusters 3, 14 and 21, plus the minor copies in clusters 2, 6, 9, 11,
  12/19, 13, 15, 16, 29 and 31, and the unit-to-unit overlaps in Task 2.
- **Resolved:** C1-C14 all hold.
