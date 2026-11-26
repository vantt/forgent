# Gather fgOS rules to one owner: rerun 3 (independent audit)

Date: 2026-11-27 (Asia/Saigon). Read-only audit of the main checkout as on disk. The only file written
in the repository is this report. Line numbers are those of the source files on disk today.

## 1. Method and inputs

- Old findings: `plans/reports/research-261125-1601-fgos-rule-duplicates-and-conflicts.md` (31 clusters,
  C1-C14). Each old location was looked up again by text, not by its old line number.
- Corpus (126 files): AGENTS.md hand-written top (lines 1-15 today; everything else in AGENTS.md is the
  generated projection or AgentKit blocks), `core/instructions/*.md` (24 units),
  `domains/coding/instructions/*.md` (2), `components/packaging-distribution/instructions/*.md` (1),
  `core/skills/**`, `domains/coding/skills/**`, `core/agents/*.yaml`, `core/prompt-templates/*.md`.
- `.fgos/runtime/tmp/normative-rerun.tsv` (1202 lines) was used to see which files carry normative
  text; every check below was then made by searching the source files directly (regex over the whole
  corpus per rule, then reading each hit in context).
- Projection check: every `core/instructions/*.md` body was compared byte for byte with AGENTS.md; all
  24 are present unchanged. `rules.json` holds 27 units: the 24 repo units (all rendered in AGENTS.md),
  `coding-worktree-safety`, `coding-verification-discipline` (domain) and `docs-only-verification`
  (component), which are not rendered in AGENTS.md.
- Pointers: 113 `Rule: <id>` lines in the corpus name 17 distinct ids. Every id exists in `rules.json`
  and every one is a repo unit rendered in AGENTS.md, so every "in AGENTS.md" claim is true. The one
  pointer to a domain unit (`core/skills/_shared/coding-worker-contract.md:95`, rule
  `coding-verification-discipline`) names its file and does not claim AGENTS.md. Relative paths in the
  corpus were also resolved (section 4).
- Judgement rule: a pointer whose lead-in label names the rule ("Never pin a provider ...: Rule: X")
  is a pointer. A separate sentence that repeats the owner's content and adds nothing local is a copy.
  A clause that applies the rule to a local case and adds a local fact is not a copy.

## 2. Task 1: status of the old clusters and conflicts

Status: (a) one owner plus pointers only, (b) still duplicated, (c) still conflicting, (d) kept by design.

| # | Rule | Owner today | Status | Remaining copies / notes |
|---|---|---|---|---|
| 1 | decide before any dispatch | `dispatch-decide-door` | a | All former copies are pointers (`capability-matching.md:32,49`, `executor-dispatch-fallback.md:42,97`, `coordination-driver.md:44`). Skill lines that call decide for their own case add local detail. |
| 2 | what to do per decide result | `dispatch-decide-door` | a | `executor-dispatch-fallback.md:66-71` points to the unit and adds the fragment's own fallback heading (local). |
| 3 | `fgos run` door contract | `run-door-contract` | a | `fgos-run/SKILL.md:25`, `executor-dispatch-fallback.md:108-109`, `capability-matching.md:41` are pointers. |
| 4 | worker never commits; runner commits `writes` | `run-door-contract` | a | `coding-worker-contract.md:99`, `cook-worker-contract.md:26`, `fgos-run/SKILL.md:79` are pointers plus local detail; `implement-and-collaboration.md:24-27` explains the commit result fields (local). |
| 5 | five reasons for an executor | `capability-routing-rules` | b (minor) | `core/skills/_shared/capability-matching.md:39` repeats the list in a parenthesis ("a stronger or cheaper model, provider diversity, isolation, parallelism") next to its pointer. |
| 6 | never pin infrastructure | `capability-routing-rules` | b (minor) | Second sentences after a pointer that repeat the ad-hoc exception and add nothing: `core/skills/_shared/capability-matching.md:27` ("Plans and non-ad-hoc Units never pin; only an ad-hoc Unit may carry a soft `prefer`."), `core/skills/fgos-run/SKILL.md:78` ("Only an ad-hoc Unit may carry a soft `prefer`."). |
| 7 | capability is a routing signal | `capability-routing-rules` | a | `capability-catalog.md:22`, `planning-capability-awareness.md:46`, `capability-matching.md:50` are pointers. |
| 8 | research is a workflow | `capability-routing-rules` | a | `capability-catalog.md:114-115` and `fgos-researching/SKILL.md:28-29` are a label plus pointer; the catalog's "registers no `research` entry" is the catalog's own fact. |
| 9 | a claim is never evidence | `driver-discipline` | a | `coordination-driver.md:56-57`, `coding-worker-contract.md:96`, `cook-worker-contract.md:35`, `fgos-fanout/SKILL.md:99`, `fgos-routing/SKILL.md:111`, `fgos-cook/SKILL.md:118` are pointers. `fgos-coding-implement/SKILL.md:80-83` and the cook hook table (`fgos-cook/SKILL.md:106`) apply it to `fgos return` and slice checks (local). |
| 10 | disposition + independent recheck | `driver-discipline` | a | `coordination-driver.md:61,69` and `case-and-doors.md:132` are pointers; `case-and-doors.md:133-135` adds the local fix/recheck mapping. |
| 11 | a refusal is an answer | `driver-discipline` | a | `coordination-driver.md:34,106`, `case-and-doors.md:117`, `fgos-lead/SKILL.md:47`, `executor-dispatch-fallback.md:137` are pointers. |
| 12 | ask only when needed, batch, template | `product-priority-order` (priority 2) | a | `coordination-driver.md:52,71`, `fgos-cook/SKILL.md:59`, `fgos-advise/SKILL.md:51`, `fgos-architecture-panel/SKILL.md:115` point to it and add local triggers. `fgos-secretary/SKILL.md:32` and `fgos-run/SKILL.md:66` describe local batching procedures. |
| 13 | decide and report when the analysis settles it | `product-priority-order` (priority 2) | b (minor) | `core/skills/_shared/plan-contract.md:79` ("Decide whatever the evidence settles instead of asking.") has no pointer and adds nothing local. |
| 14 | frame narrowed, never widened | `_shared/decision-question.md:23` | a | `reading-ak-plans.md:50-51` cites it; `case-and-doors.md:30` is about flag defaults, a different subject. |
| 15 | RUL11 | `rul11-tum-lum` | b | `core/skills/_shared/decision-question.md:26` ("Consolidating by building a new tool or engine is a decision question.") repeats the law's own clause (`rul11-tum-lum.md:21-22`, "gom mà phải xây công cụ mới là một câu hỏi quyết định") right after the pointer at :25. |
| 16 | item text is untrusted | `untrusted-input` | b | `domains/coding/skills/fgos-coding-discovering/SKILL.md:79-81` is a full copy in Vietnamese (untrusted, RUL45 citation, never splice into a shell command, pass as a quoted argv element) with no pointer. `domains/coding/skills/fgos-coding-exploring/references/scope-and-reclaim.md:37-40` restates the core of the rule while applying it (extract one keyword); acceptable as a local application but it carries no pointer. All 12 other sites are pointers. |
| 17 | convention paths | `convention-paths` | a | Remaining mentions call `fgos convention path` for their own kind (local use). |
| 18 | ids from `fgos identity mint` | `id-minting` | b (minor) | `core/skills/fgos-shaping/SKILL.md:77-78` ("Mint ids through `fgos identity mint` where the repo requires it") has no pointer; its hedge "where the repo requires it" is looser than the unit's "every id that travels between machines". `fgos-secretary/SKILL.md:52` is a pointer. |
| 19 | owner questions only via `fgos questions ask` | `_shared/decision-question.md:46` | a | `fgos-shaping/SKILL.md:88`, `plan-contract.md:77-78`, `fgos-lead/SKILL.md:86` cite the fragment and add local detail (socket, `--ref`, `q-` ids in the plan). |
| 20 | land on main only what others rely on | `writes-to-main` | a | `fgos-supervisor/SKILL.md:178`, `fgos-lead/SKILL.md:22`, `fgos-shaping/SKILL.md:58` are pointers plus local detail. |
| 21 | head role boundary in skill and persona | persona yaml | b | Lead only: `core/skills/fgos-lead/SKILL.md:13-14` ("Your sandbox writes only the plan directory ... never change the footprint and never start or stop a session") and `:85` (Never list) repeat `core/agents/lead.yaml:5,17,19` although :13 already says "boundary: `core/agents/lead.yaml`". Secretary, supervisor and shaper skills now point to their yaml. `plan-contract.md:34-35` points to `planner.yaml` and adds what is read-only (local). |
| 22 | precedence owner > secretary > supervisor | persona yaml (both) | d | `fgos-secretary/SKILL.md:22-23` and `fgos-supervisor/SKILL.md:22-23` are pointers; `secretary.yaml:14-15` and `supervisor.yaml:10-11` agree. |
| 23 | one owning proof per behaviour | `design-principles` (8) | a | `definition-of-done.md:28` and `fgos-run/SKILL.md:87` are pointers; `fgos-run/SKILL.md:89-91` is a reviewer checklist with local items. |
| 24 | declared verify, full suite only at gates | `coding-verification-discipline` | a | `coding-worker-contract.md:95` points to it; "run it once, near the end" is a local timing rule the unit does not state. |
| 25 | advise route / four ask conditions / `--seats` | advise skill family | d | No conflict: the four `--seats` bases match in `request-kinds-and-routes.md:104`, `fgos-advise/SKILL.md:67-70`, `fgos-group-thinking/SKILL.md:108,124-125`. |
| 26 | fanout mechanics | fanout skill family | d | No conflict (see C5). |
| 27 | distill rules | distill skill family | d | Not re-read in depth; no hit across files contradicts another. |
| 28 | panel prompt headers | prompt templates | d | `critique.md:17` and `interpretation.md:20` agree. |
| 29 | read `domains/<domain>/AGENTS.md` | `domain-doctrine-read` | b (minor) | `core/skills/fgos-routing/SKILL.md:178` repeats the unit's sentence almost word for word ("Once the domain resolves, load its doctrine ... before handing off to driving or loading the resolved stage skill") before its pointer at :179; :180-183 add a real local fact (payload-relative path). `fgos-routing/SKILL.md:231` repeats it again in the summary. `fgos-shaping/SKILL.md:27` is a pointer. |
| 30 | generated text is regenerated, never hand-copied | `design-principles` (7) | a | `plan-contract.md:106`, `instruction-audit/SKILL.md:119` are pointers; `reading-ak-plans.md:19` applies it to slice `writes` (local). |
| 31 | run long calls in background, wait for notification | `run-door-contract` | a | `wave-dispatch-mechanics.md:49` points to it and adds why the fanout entry blocks. |
| C1 | `prefer` forbidden vs allowed for ad-hoc Units | `capability-routing-rules.md:33-35` | a | The unit now states the ad-hoc exception; `capability-matching.md:27`, `fgos-run/SKILL.md:37,78`, `capability-matching.md:39` agree. |
| C2 | `unavailable` = inline vs "ask the owner" | `dispatch-decide-door.md:38` | a | `case-and-doors.md:69-70` and `fgos-cook/SKILL.md:89-91` run it inline; `fgos-fanout/SKILL.md:81-82` and `wave-dispatch-mechanics.md:62` hand it back as work the caller runs inline. The fanout and cook reports go to their caller or ledger, not to the owner; not a conflict. |
| C3 | researching fan-out skipped decide | `dispatch-decide-door.md:23` | a | The unit now says the PreToolUse hook is the decide for a Task call; `fgos-researching/SKILL.md:60-63` points to it. |
| C4 | lead and `--provider` | see below | c (Low) | The lead now calls decide (`fgos-lead/SKILL.md:49`). A residual letter conflict remains between two units: `core/instructions/dispatch-decide-door.md:40` says an `out-of-process` answer runs `fgos run ... --provider <executorId>`, while `core/instructions/capability-routing-rules.md:35` says an ad-hoc Unit's `--provider` is named only for one of the five reasons, "Otherwise leave it out", and `core/skills/fgos-lead/SKILL.md:50-52` and `core/skills/_shared/capability-matching.md:39` follow the second reading (optional). `executor-dispatch-fallback.md:101` follows the first. Effect is small (both end in `bind()`), but an agent cannot follow both literally. |
| C5 | fanout out-of-process fired vs marked unavailable | `fgos-fanout/SKILL.md:78-82` | a | `fgos-fanout/SKILL.md:186,207,219-228` and `wave-dispatch-mechanics.md:8-14,57-63` all say only `unavailable` is reported. |
| C6 | routing by stage vs workflow run | `fgos-routing/SKILL.md:115` | a | Two routes chosen by `workflowRunId`; the stage table is labelled legacy (:117). |
| C7 | one question per turn vs batching | `fgos-shaping/SKILL.md:42-44` | a | Shaping now scopes "one question per turn" to the live conversation and batches formal owner questions with a pointer to priority 2. |
| C8 | two disposition vocabularies | `driver-discipline.md:33` | a | The unit names the generic set and allows a finer role-specific set (the panel's) with no mapping. |
| C9 | fanout decides twice | `dispatch-decide-door.md:25` | a | The unit says a batch re-confirmation is the same dispatch's bind check; `fgos-fanout/SKILL.md:72-73` points to it. |
| C10 | background-wait vs poll | `run-door-contract.md:27-29` | a | The unit separates `fgos run` (wait for notification) from `fgos workflow start` (poll status). A new, related conflict is listed as N1 below. |
| C11 | fallback fragment called canonical yet retired | `dispatch-decide-door.md:44` | a | The unit now names the fragment "only for its pattern"; the fragment says the same (:283-293). |
| C12 | stale session-identity citation | `executor-dispatch-fallback.md:173-182` | b (stale, Low) | The citation now names `resolveWriterIdentity` and `identityDoor().resolve()` correctly (:175-176), but :178-182 still contrast a "pid-sourced" scope with "a registry-sourced one". `source: registry` was removed (`docs/platform/identity/spec.md:288`, 2026-11-19); sources are `env`, `pid`, `unresolved` (:191-194). |
| C13 | design principles description says seven | `design-principles.md:10` | a | Description now says eight. |
| C14 | cook default vs coding `[BLOCKED]` | both contracts | a | `cook-worker-contract.md:16-19` and `coding-worker-contract.md:46-55` now separate a stage question with a documented default from a missing brief field, and point at each other. |

## 3. Task 2: per-unit sweep

For each of the 27 units I searched the corpus for its distinctive terms and read every hit. Units
with no restatement outside pointers and no conflict: `before-touching-code`, `convention-paths`,
`definition-of-done` (except N2), `design-principles` (the reviewer checklist in `fgos-run` is local),
`destructive-cleanup` (`coding-worktree-safety.md:20` points to it), `gateway-start-door`,
`impact-analysis-capability-gate` (the coding skills point to it and add where to record the posture),
`install-setup-doctor-gate`, `legacy-node-cli-boundary`, `mission-boundary`, `platform-operating-laws`,
`rul104-better-not-bigger`, `run-door-contract` (except N1), `scratch-artifacts`, `writes-to-main`,
`driver-discipline`, `coding-verification-discipline`, `coding-worktree-safety`.

Restatements outside pointers (all listed in section 2 except the last):

1. `capability-routing-rules`: `core/skills/_shared/capability-matching.md:27`, `:39`;
   `core/skills/fgos-run/SKILL.md:78` (clusters 5, 6).
2. `product-priority-order` (priority 2, "decide and report"): `core/skills/_shared/plan-contract.md:79`.
3. `rul11-tum-lum`: `core/skills/_shared/decision-question.md:26`.
4. `untrusted-input`: `domains/coding/skills/fgos-coding-discovering/SKILL.md:79-81` (full copy, no
   pointer); `domains/coding/skills/fgos-coding-exploring/references/scope-and-reclaim.md:37-40`
   (local application, no pointer).
5. `id-minting`: `core/skills/fgos-shaping/SKILL.md:77-78`.
6. `domain-doctrine-read`: `core/skills/fgos-routing/SKILL.md:178`, `:231`.
7. Persona boundary (lead): `core/skills/fgos-lead/SKILL.md:13-14`, `:85` vs `core/agents/lead.yaml:5,17,19`.
8. `product-priority-order` (the order itself): `core/skills/fgos-secretary/SKILL.md:76-77` copies the
   four names "(Ship Faster, Release con nguoi, DoD, Polish Sau DoD)" next to "the product priority in
   AGENTS.md". It agrees today, but it is a hand-copied list of the law (the kind
   `instruction-audit/SKILL.md:119-121` calls a finding). Not in the old report.

Conflicts:

- **C4 residual (Low):** `core/instructions/dispatch-decide-door.md:40` vs
  `core/instructions/capability-routing-rules.md:35` (and `core/skills/fgos-lead/SKILL.md:50-52`,
  `core/skills/_shared/capability-matching.md:39`). Always pass the decided executor as `--provider`,
  or leave `--provider` out unless one of the five reasons applies. Detail in section 2.
- **N1 (Low, new):** `core/skills/fgos-architecture-panel/SKILL.md:24` ("Do not ... poll in a loop")
  vs `core/instructions/run-door-contract.md:29` ("poll `fgos workflow status <workflowRunId>` until the
  run is `completed`, `failed` or parked") and `core/skills/fgos-group-thinking/SKILL.md:87-88`, which
  lists `architecture-advisory` among the workflows to start and poll. An agent that starts
  `architecture-advisory` (`fgos-architecture-panel/SKILL.md:31`) gets "poll until settled" from the
  unit and "do not poll in a loop; read reports supplied by the workflow/operator" (:22, :35) from the
  panel skill. Neither says which applies to that route.
- **N2 (Low, new):** `components/packaging-distribution/instructions/docs-only-verification.md:16`
  ("Docs-only changes may use doc and render checks instead of runtime test suites") vs
  `core/instructions/definition-of-done.md:28-29` (L5 question 5: done means `npm test` and
  `cargo test --workspace` green). Both units are `mode: append`; nothing in either text says the
  narrower component unit wins, and the component sentence is not visibly limited to the component
  (it reads as any docs-only change). Possibly intended as a scoped exception; if so, it should say
  so, because the DoD is a locked law.
- No other pair in the corpus was found to conflict. Checked in particular: decide `unavailable`
  handling across cook, fanout and the fallback fragment (C2); the coding worker's verify timing vs
  `coding-verification-discipline`; the session that commits in
  `fgos-coding-implement/references/verify-commit-and-iron-law.md:44-45` (inline path, not a worker)
  vs the worker never-commit rule; the shaper's "ask one line" for an unknown domain vs
  `domain-doctrine-read.md:16` (fgos-clarifying returns the one-line question, `fgos-clarifying/SKILL.md:87-89`;
  consistent).

## 4. Dangling pointers

- Rule pointers: none. All 17 pointed ids exist in `.fgos/instructions/effective/rules.json`; all
  are repo units rendered in AGENTS.md; the persona files named as boundary owners
  (`core/agents/lead.yaml`, `secretary.yaml`, `supervisor.yaml`, `planner.yaml`) exist; every
  `../_shared/...` link from a domain skill resolves in the rendered surfaces (`.agents/skills/_shared`,
  `plugins/fgOS/skills/_shared`).
- Path references that do not resolve (not rule pointers, but pointers to owners of a rule or procedure):
  - `domains/coding/skills/fgos-coding-planning/SKILL.md:102,118,119,150` and
    `domains/coding/skills/fgos-coding-validating/SKILL.md:107`:
    `../../../core/skills/_shared/{plan-contract,planning-capability-awareness,capability-catalog}.md`.
    From the source file this resolves to `domains/core/...`; from `.agents/skills/<skill>/` to a path
    outside the repository. It resolves only from `plugins/fgOS/skills/<skill>/`. The other domain
    skills use `../_shared/...`, which resolves in both render surfaces.
  - `core/skills/_shared/catchup-self-recovery.md:47` → `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md` (missing).
  - `core/skills/_shared/executor-dispatch-fallback.md:279` → `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-executor.md` (missing).
  - `domains/coding/skills/fgos-coding-exploring/references/scope-and-reclaim.md:49` and
    `domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md:16` →
    `docs/how-to/write-verify-for-a-skill-prose-change.md` (missing; moved to the knowledge-registry
    layout in `0c32f3433`).
  - `core/skills/distill/references/consult-protocol.md:22` → `docs/reference-learning-system.md`
    (missing in this host).
  These were outside the old report's scope; listed so the next pass can decide whether they count.

## 5. Verdict

Yes. Beyond the kept-by-design list, these remain: duplicates outside pointers in
`capability-matching.md:27,39`, `fgos-run/SKILL.md:78`, `plan-contract.md:79`,
`decision-question.md:26`, `fgos-coding-discovering/SKILL.md:79-81` (the only full copy),
`scope-and-reclaim.md:37-40`, `fgos-shaping/SKILL.md:77-78`, `fgos-routing/SKILL.md:178,231`,
`fgos-lead/SKILL.md:13-14,85`, `fgos-secretary/SKILL.md:76-77`; conflicts C4-residual
(`dispatch-decide-door.md:40` vs `capability-routing-rules.md:35`), N1 (`fgos-architecture-panel/SKILL.md:24`
vs `run-door-contract.md:29`) and N2 (`docs-only-verification.md:16` vs `definition-of-done.md:28-29`),
all Low; stale drift C12 (`executor-dispatch-fallback.md:178-182`); no dangling rule pointer, but five
unresolvable path references (section 4).
