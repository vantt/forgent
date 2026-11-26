# Gather fgOS rules to one owner: rerun 5 (independent audit)

Date: 2026-11-27 (Asia/Saigon). Read-only audit of the main checkout as on disk (HEAD `f68937f41`, which lands
`c82baf0af` "fifth gathering round after the fourth independent check"). The only file written is this report.
Line numbers are those of the source files on disk today.

Inputs: rerun 4 (`research-261127-0400-gather-rules-rerun-4.md`); the diff `cc3e06d26..HEAD` over the corpus;
`.fgos/instructions/effective/rules.json` (27 units: 24 `repo`, 2 `domain`, 1 `component`); AGENTS.md on disk
(hand-written top = lines 1-16; generated projection = lines 94-640, 24 `- id:` unit entries, all the `repo` units).
Corpus: 130 files (AGENTS.md top, 24 `core/instructions`, 1 `components/packaging-distribution/instructions`,
2 `domains/coding/instructions`, `core/skills/**`, `domains/coding/skills/**`, `core/agents/*`,
`core/prompt-templates/*`). No `core/instructions/head-*.md` exists today. Method: a script listed every `Rule: <id>`
pointer and every backticked path-like token (also `path:line` forms), resolving each against the repo root, the
file's own directory and both render surfaces (`.agents/skills/<skill>/`, `plugins/fgOS/skills/<skill>/`); every miss
was read in context. For duplicates, a token-overlap pass paired every sentence of the corpus against every other
(Jaccard >= 0.5, 133 pairs), and each cross-file pair was read and judged by meaning; targeted searches followed
(`--provider`/`prefer`, `questions ask`/`fgos ask`, `--reason`/selectors, event-log location, `lock-timeout`).

## Task 1: status of every item rerun 4 left open

| Rerun-4 item | Status | How fixed / where still open |
|---|---|---|
| (a)1 `fgos-run/SKILL.md:78` repeats the ad-hoc `prefer` sentence | Fixed | Now "Rule: capability-routing-rules (...), its ad-hoc `prefer` exception included." A pointer plus a clause that names the owner's exception (`capability-routing-rules.md:35`) without restating it. |
| (a)2 `fgos-routing/SKILL.md:178` restates domain-doctrine-read | Fixed | Now "Domain doctrine: Rule: domain-doctrine-read (...)." (`core/skills/fgos-routing/SKILL.md:178`); :179-182 keep only the local payload-relative fact. |
| (b)1 C4 residual: `fgos-lead/SKILL.md:48-51` "`--provider` optional, leave it out" | Fixed | Now "`--provider` naming the executor `decide` answered" (`core/skills/fgos-lead/SKILL.md:50-51`), agreeing with `dispatch-decide-door.md:40` ("names the executor `decide` answered, not a pin of your own") and `executor-dispatch-fallback.md:98-103`, `implement-and-collaboration.md:17`. The synopsis on :49 still brackets `[--provider <id>]`; read with :50 that is the tool-executor case, not a conflict. |
| (b)2 N3: `decision-question.md:45` "only `fgos questions ask`" vs `fgos ask` item parks | Fixed | Now scoped: "A session's own questions to the owner are asked only with `fgos questions ask` (a Work item parked with `fgos ask <id>` is that item's gate, a different door)" (`core/skills/_shared/decision-question.md:45-46`). Consistent with :4 and :50-52 of the same file and with the park steps in fgos-routing and the coding skills. |
| (b)3 Stale execution door in `fgos-group-thinking/SKILL.md:168` | Fixed | Now `packages/execution/engine/src/unit_run/` (exists), matching `fgos-run/SKILL.md:11`. |
| (d)1 `docs/how-to/preserve-shell-escapes-...` (2 sites) | Fixed | Both now cite `docs/knowledge/how-to-preserve-shell-escapes-when-transcribing-a-verify-com/preserve-shell-escapes-when-transcribing-a-verify-command.md` (exists) on one line: `verify-commit-and-iron-law.md:19-20`, `verify-sync-and-gap.md:49-50`. |
| (d)2 `executor-dispatch-fallback.md:292-293` cites deleted Node files as proof owners | Fixed | Now "proven by the decide door's own tests, and Step B's run by `fgos run`'s (`packages/execution/engine/src/unit_run/`; the retired Node `src/runner/dispatch.mjs` and `src/runner/execution/run.mjs` held them before)" (:292-294); the old paths are labelled retired. |
| (d)3 `fgos-group-thinking/SKILL.md:168` `src/runner/execution/run.mjs` | Fixed | See (b)3. |
| (d)4 `.fgos/events.jsonl` in `coding-worktree-safety.md:21` and `fgos-coding-discovering/SKILL.md:58` | Fixed | Rule 3 now says "stashing tracked `.fgos/` files" (`domains/coding/instructions/coding-worktree-safety.md:21`); discovering now says "khoá chia sẻ của event log" (`SKILL.md:57-58`). Neither names the retired file. See Task 2 (b)1 for rule 2 of the same unit. |
| (d)5 `fgos-secretary/SKILL.md:125` `_shared/friction-capture.md` | Fixed | Now `../_shared/friction-capture.md`, resolving in both render surfaces (`core/skills/_shared/friction-capture.md` exists). |

All ten rerun-4 items are fixed.

## Task 2: fresh sweep

### (a) Rule stated in two places, neither a pointer

1. **Run-door selector rules in a case (Low, new).** `core/skills/fgos-run/SKILL.md:26` ("In a case, omit selectors to
   inherit the activity's `unit`; a params request or an explicit swap away from its pattern requires `--reason`, but
   standalone params do not. Repeating the same selector is not automatically a swap. The result's pin records the
   effective pattern, loop, params and request reason.") and `core/skills/fgos-cook/references/case-and-doors.md:85-91`
   (the same four rules: inherit the activity's `unit`; `--reason` for a params request or swap, `request-reason-required`
   otherwise; an identical selector is not a swap; read the pin). Neither points to the other; case-and-doors:3-6 says
   it "only fixes which command each step of this skill runs", yet restates the door's semantics. One owner
   (`fgos-run`, the run-door driver, or `_shared/coordination-driver.md`, which already lists `--reason` at :40) and a
   pointer would gather it.
2. **Authority-map admission sentence (Low, new; predates the gathering, `99d6c7f4b`).**
   `core/skills/_shared/plan-contract.md:145-149` and `domains/coding/skills/fgos-coding-validating/SKILL.md:111-115`
   both state that the validating review rejects a missing or unproven map and that "Until documentation H2 admission
   exists, this review is the independent admission step for each `declare` in the map; a new component or decision
   kind still needs the owner's answered question" (near verbatim). Validating points to plan-contract only for the
   map's shape ("§3", :107-108), and plan-contract's sentence actually sits in §5 Rules; neither copy defers to the
   other for the admission rule.
3. **Coding stage-skill mechanics repeated across skills (Low; procedure text rather than a rendered rule, not counted
   by earlier rounds; listed so the owner can decide scope).**
   - The stop-reason rule "relay a known error category verbatim, never fold it into a generic blocked; the one category
     today is `lock-timeout` (the shared event log's lock is stuck), reported as `stop-reason: lock-timeout`" is written
     out in four stage skills: `fgos-coding-discovering/SKILL.md:52-63`, `fgos-coding-exploring/SKILL.md:34-46`,
     `fgos-coding-planning/SKILL.md:39-49`, `fgos-coding-validating/SKILL.md:29-40`; the receiving side lives in
     `fgos-coding-driving/SKILL.md:115-120`. No shared fragment owns it.
   - The `gate-check` call mechanics (resolve `root` and run `gate-check` as two separate tool calls; read
     `data.canAutoApprove`, anything other than exactly `true` is false; the CLI resolves its own import path) are
     written out in both `fgos-coding-exploring/references/gate-mechanics.md:5-22` and
     `fgos-coding-validating/references/gate-auto-approve-mechanics.md:6-43`; only the gate name differs.

Checked and not counted: `capability-matching.md:30-32` (heading plus pointers only); `implement-and-collaboration.md:22`
(reading `agentClaim.summary` is the local use of the door's output); `fgos-coding-shaping/SKILL.md:22` (local
application of domain-doctrine-read for the coding domain); the `authority: inactive` lines in fgos-shaping,
fgos-coding-planning, -implement, -validating and plan-contract (each says where its own artifact records it); the
"report in a file named with `fgos convention path --kind report`" lines of secretary, supervisor and lead (local
applications of convention-paths); "a wake is one turn" in supervisor, lead and coding-planning (each names its own
done step); "who wins when orders meet" in secretary and supervisor (pointers to the persona files, kept by design);
the role/holder reclaim lines (each names its own role); `selector-conflict` and lens rules across fgos-advise and
fgos-group-thinking (one skill family, kept by design); the council persona files and architecture-panel templates
(kept by design); the owner-question door lines in fgos-shaping:87, fgos-supervisor:170, fgos-lead:85,
plan-contract:77, fgos-coding-planning:111 (each points at `decision-question.md` or is the role's local door);
`coordination-driver.md:105` vs `case-and-doors.md` `data.case` field list (case-and-doors:4-5 points at
coordination-driver for the semantics; the field list is the read of the command's output).

### (b) Conflicting or stale statements

1. **Stale statement (Low, new).** `domains/coding/instructions/coding-worktree-safety.md:20` (rule 2): "`-A` stages
   every `.fgos/` file as deleted and the merge would destroy the live event log." Event truth moved to `refs/fgos` in
   `51bee6b53` (D-ADR0055); the tracked `.fgos/` files are 13 config/projection files plus the `.fgos/events` seal
   pointer (`git ls-files .fgos`). A merged deletion would remove config, the effective rules and the seal pointer, not
   the event log itself. Rule 3 of the same unit was corrected this round ("tracked `.fgos/` files"); rule 2 was not.
   The guard it cites (`.githooks/pre-commit:728`) words it as "fgOS's own runner state", which is the accurate form.
2. **Stale line anchor (Low, new).** `core/skills/_shared/executor-dispatch-fallback.md:158` cites `work.mjs`'s
   `ID_PATTERN` at `src/state/work.mjs:24`; the constant is at `src/state/work.mjs:27` today. The file exists; only the
   anchor drifted.

Checked and consistent: `--provider` across `dispatch-decide-door.md:40`, `capability-routing-rules.md:35`,
`run-door-contract.md:21-23`, `capability-matching.md:39`, `executor-dispatch-fallback.md:98-106,168,194`,
`fgos-run/SKILL.md:22,37,78`, `fgos-lead/SKILL.md:49-51`, `implement-and-collaboration.md:17`; `fgos questions ask`
vs `fgos ask` across decision-question, shaping, supervisor, lead, secretary, plan-contract and the coding park steps;
the head persona precedence sentences (`secretary.yaml:15`, `supervisor.yaml:11`, identical order); ticket waits
(`--wait 30` for secretary/supervisor, "at most 50" for the lead) are per-role values, not a conflict; run-door wait
(background, no polling) vs `fgos workflow status` polling and `fgos request result --wait` (different verbs);
the event-log wording in exploring, planning, validating, driving and discovering (all "the shared event log's lock").

### (c) Rule pointers

None dangling. 17 distinct ids are pointed to with `Rule: <id>` (119 occurrences): before-touching-code,
capability-routing-rules, convention-paths, decision-question-template, design-principles, destructive-cleanup,
dispatch-decide-door, domain-doctrine-read, driver-discipline, id-minting, impact-analysis-capability-gate,
legacy-node-cli-boundary, product-priority-order, rul11-tum-lum, run-door-contract, untrusted-input, writes-to-main.
Every one is in `rules.json` with scope `repo` and is rendered in AGENTS.md (`- id:` entry in the projection); every
`Rule:` occurrence carries "in AGENTS.md; set in .fgos/instructions/effective/rules.json" on the same or next line.
No pointer names a `domain`/`component` unit (coding-worktree-safety, coding-verification-discipline,
docs-only-verification) as being in AGENTS.md.

### (d) Backticked paths that do not exist

No real misses. Every unresolved token was read in context and is one of: a bare artifact name (`plan.md`,
`CONTEXT.md`, `DISCUSSION.md`, `RESEARCH.md`, `iron-law-evidence.md`, `result-1.json`, `intake.md` and the like);
a code-module short name whose file exists (`work.mjs` -> `src/state/work.mjs`, `frontier.mjs` ->
`src/state/frontier.mjs`, `nominal-group.yaml` -> `domains/council/workflows/nominal-group.yaml`,
`reading-map.md` -> `docs/reading-map.md`); a link text whose target resolves (`cook-worker-contract.md` ->
`core/skills/_shared/cook-worker-contract.md`); retired Node paths labelled "retired ... last at `85760c6f2`" or
"retired Node ... held them before" (`capability-catalog.md:95`, `capability-matching.md:23`, `fgos-run/SKILL.md:11,27`,
`executor-dispatch-fallback.md:293-294`); the canonical-source note `../_shared/executor-dispatch-fallback.md` in
`dispatch-decide-door.md:44` (rendered into AGENTS.md, names its canonical source beside it); examples
(`common/schema.py`, `docs/ops/queue.md`, `docs/pricing-v2.md`, `docs/finance/*`, `path/to/file`, `X-Y.md`,
`/home/me/projects/forgent-worktrees/`, `refs/heads/fgw/tsk-1`); a URL path (`/v1/contract`); a preset name
(`coding/feature`); project-side or runtime paths (`fgos/agents/`, `upstreams/`, `.fgos/authority/model/`,
`decisions/`, plan-relative `reports/`); payload-root `repo/...` paths in fgos-indexing and fgos-routing (exist under
the repo root); `approve/SKILL.md` in `catchup-self-recovery.md:3,21` (plugin-only skill); `../_shared/coding-worker-contract.md`
in `implement-and-collaboration.md:21,24` (relative to the skill directory). The AGENTS.md top's paths (README,
foundations, system overview, reading map, backlog, program board and its `log.md`, routing-handoff, decisions index,
governance, `domains/coding/AGENTS.md`) all exist. The one `path:line` citation in the corpus is reported in (b)2.

## Verdict

Yes, minor items remain beyond the kept-by-design list: duplicates (a)1 run-door case selector rules
(`fgos-run/SKILL.md:26` vs `fgos-cook/references/case-and-doors.md:85-91`) and (a)2 the authority-map admission
sentence (`plan-contract.md:145-149` vs `fgos-coding-validating/SKILL.md:111-115`); the stale "destroy the live event
log" in `coding-worktree-safety.md:20` and the drifted anchor `src/state/work.mjs:24` in
`executor-dispatch-fallback.md:158`; no dangling rule pointer and no missing path. Optional, scope for the owner:
(a)3 coding stage-skill mechanics repeated across skills (`lock-timeout` stop-reason in four stage skills; `gate-check`
mechanics in exploring and validating). All Low; all rerun-4 items are fixed.
