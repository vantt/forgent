# Gather fgOS rules to one owner: rerun 4 (independent audit)

Date: 2026-11-27 (Asia/Saigon). Read-only audit of the main checkout as on disk (HEAD `cc3e06d26`, which lands
`7d71551cc` "fourth gathering round after the third independent rerun"). The only file written is this report.
Line numbers are those of the source files on disk today.

Inputs: rerun 3 (`research-261127-0330-gather-rules-rerun-3.md`); the diff `7d71551cc^..HEAD` over the corpus;
`.fgos/instructions/effective/rules.json` (27 units: 24 `repo`, 2 `domain`, 1 `component`); AGENTS.md on disk
(hand-written top = lines 1-16; generated projection = lines 94-642, 24 `####` unit headings, all `repo` units).
Corpus: 130 files (AGENTS.md top, `core/instructions`, `components/*/instructions`, `domains/*/instructions`,
`core/skills/**`, `domains/coding/skills/**`, `core/agents/*.yaml`, `core/prompt-templates/*.md`). Backticked paths
were extracted with a script and checked for existence (repo-root relative; `./`/`../` relative to the file and to
both render surfaces `.agents/skills/<skill>/` and `plugins/fgOS/skills/<skill>/`), then every miss was read in context.

## Task 1: status of every remaining item from rerun 3

| Rerun-3 item | Status | How fixed / where still open |
|---|---|---|
| Cluster 5: `capability-matching.md:39` repeats the five reasons | Fixed | Parenthesised list removed; now "Only for one of the five reasons" plus pointer (`capability-matching.md:39`). |
| Cluster 6: `capability-matching.md:27` ad-hoc `prefer` sentence | Fixed | Sentence removed; line 26 is a bare pointer. |
| Cluster 6: `fgos-run/SKILL.md:78` "Only an ad-hoc Unit may carry a soft `prefer`." | Open (minor) | `core/skills/fgos-run/SKILL.md:78` unchanged: pointer, then a sentence that restates `capability-routing-rules.md:35` and adds nothing local. Its twin in `capability-matching.md` was removed in this round; this one was missed. |
| Cluster 13: `plan-contract.md:79` "decide whatever the evidence settles" | Fixed | Now carries `Rule: product-priority-order ... priority 2` (`core/skills/_shared/plan-contract.md:79`). |
| Cluster 15: `decision-question.md:26` repeats RUL11's tool clause | Fixed | Line deleted; `decision-question.md:25` is the pointer only. |
| Cluster 16: `fgos-coding-discovering/SKILL.md:79-81` full copy of untrusted-input | Fixed | Replaced by a pointer (`domains/coding/skills/fgos-coding-discovering/SKILL.md:79`). |
| Cluster 16: `scope-and-reclaim.md:37-40` local application without pointer | Fixed | Pointer added inline (`scope-and-reclaim.md:37-38`); the keyword-extraction clause is local. |
| Cluster 18: `fgos-shaping/SKILL.md:77-78` hedged mint sentence | Fixed | Now "Ids: Rule: id-minting ..." (`core/skills/fgos-shaping/SKILL.md:77`). |
| Cluster 21: `fgos-lead/SKILL.md:13-14, 85` repeat `lead.yaml` | Fixed | "never start or stop a session" removed from :13; Never list :84 now "Anything `core/agents/lead.yaml` puts outside the lead; change the plan footprint." Remaining "Your sandbox writes only the plan directory" sits beside "(boundary: `core/agents/lead.yaml`)" and adds the footprint fact (pointer plus short agreeing local clause). |
| Cluster 29: `fgos-routing/SKILL.md:178` restates domain-doctrine-read; `:231` | Open (minor) | `core/skills/fgos-routing/SKILL.md:178` unchanged: "Once the domain resolves, load its doctrine `domains/<domain>/AGENTS.md` before handing off to driving or loading the resolved stage skill" is the unit sentence (`domain-doctrine-read.md:16`) nearly word for word, followed by the pointer at :179. :180-183 add the payload-relative path (local). `:231` is the skill's own summary step and adds the payload fact; not counted. |
| Section-3 item 8: `fgos-secretary/SKILL.md:76-77` hand-copied priority list | Fixed | Now "Order the topics by the product priority (Rule: product-priority-order ...)" (`core/skills/fgos-secretary/SKILL.md:76`). |
| C4 residual: `--provider` always vs optional | Partly fixed, open (Low) | Units reconciled: `dispatch-decide-door.md:40` now says "Here `--provider` names the executor `decide` answered, not a pin of your own (`capability-routing-rules`)", so `capability-routing-rules.md:35` ("Otherwise leave it out") is about one's own preference. `executor-dispatch-fallback.md:99-103` follows the door. Still conflicting: `core/skills/fgos-lead/SKILL.md:48-51`, in the very `out-of-process` branch, says "`--provider` is optional and soft: name it only for one of the five reasons, otherwise leave it out and `fgos run` binds itself" with a pointer to capability-routing-rules. Per the commit's stated intent (keep `--provider` = decided executor) the lead line should pass the decided executor. |
| N1: architecture panel "do not poll" vs run-door "poll status" | Fixed | `fgos-architecture-panel/SKILL.md:24-25` now drops "poll in a loop" and says "read progress only through `fgos workflow status` (Rule: run-door-contract ...)". Agrees with `run-door-contract.md:29` and `fgos-group-thinking/SKILL.md:87-88`. |
| N2: docs-only verification vs DoD full suites | Fixed | `docs-only-verification.md:19` now scopes the exception "for their own verification; the definition of done's full suites still run at the integration gate", consistent with `definition-of-done.md:28-29`. |
| C12: stale "registry-sourced" identity contrast | Fixed | `executor-dispatch-fallback.md:181` now "the way the other sources are"; `resolveWriterIdentity` exists at `src/util/session-identity.mjs:25`. |
| Path: coding-planning/validating `../../../core/skills/_shared/...` | Fixed | Now `../_shared/...` (`fgos-coding-planning/SKILL.md:102,118,119,150`; `fgos-coding-validating/SKILL.md:107`); resolves in both render surfaces. |
| Path: `catchup-self-recovery.md:47` how-to | Fixed | Now `docs/knowledge/how-to-diagnose-an-fgos-approve-blocked-by-verify-fail-post/diagnose-a-verify-fail-post-merge-block-on-approve.md` (exists). |
| Path: `executor-dispatch-fallback.md:279` how-to | Fixed | Now `docs/knowledge/how-to-wire-an-existing-skill-s-inline-reasoning-step-throug/...executor-executor.md` (exists). |
| Path: `scope-and-reclaim.md:49`, `verify-sync-and-gap.md:16` how-to | Fixed | Both now `docs/knowledge/vi-t-verify-cho-m-t-item-thay-i-skill-prose/write-verify-for-a-skill-prose-change.md` (exists). |
| Path: `distill/references/consult-protocol.md:22` learning-system doc | Fixed | Path no longer named ("wherever the host keeps it", :19). |

## Task 2: fresh sweep

### (a) Rule stated in two places, neither a pointer

1. `core/skills/fgos-run/SKILL.md:78` vs `core/instructions/capability-routing-rules.md:35`: "Only an ad-hoc Unit may carry a
   soft `prefer`." after the pointer (carried from Task 1).
2. `core/skills/fgos-routing/SKILL.md:178` vs `core/instructions/domain-doctrine-read.md:16` (carried from Task 1).

Checked and not counted: `domains/coding/skills/fgos-coding-planning/SKILL.md:119` ("Never pin executor, provider, or
model names in `plan.md`") follows a skill-fragment pointer to `../_shared/planning-capability-awareness.md`, which
points to the unit; `core/skills/_shared/capability-catalog.md:101-110` adds the catalog's own identity rule and points
on; `core/skills/fgos-advise/references/request-kinds-and-routes.md:95-96` is a pointer. The "five-part form" mentions
(secretary, supervisor, shaper, cook) all name or point at `decision-question.md`. Searches for the distinctive terms
of untrusted-input, convention-paths, id-minting, scratch-artifacts, destructive-cleanup, writes-to-main,
driver-discipline (caveat, recheck, refusal, retry), RUL11, RUL104, mission boundary, DoD/full suite and
generated-surface rules found no other restatement outside pointers or local applications.

### (b) Conflicting statements

1. **C4 residual (Low)**, `core/skills/fgos-lead/SKILL.md:48-51` vs `core/instructions/dispatch-decide-door.md:40`
   (see Task 1). After an `out-of-process` answer the door runs `fgos run --provider <executorId>` (the decided
   executor, explicitly not a pin); the lead skill says leave `--provider` out unless one of the five reasons.
2. **N3 (Low, new)**, `core/skills/_shared/decision-question.md:45` "Owner questions are asked only with
   `fgos questions ask`" vs the same file's :4 and :50 (`fgos ask` is a named channel and is checked by
   `src/state/decision-question.mjs`) and the item park procedure in `core/skills/fgos-routing/SKILL.md:205-209,236`,
   `domains/coding/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md:66-82`,
   `domains/coding/skills/fgos-coding-implement/SKILL.md:150` and
   `domains/coding/skills/fgos-coding-implement/references/implement-and-collaboration.md:53,95` (park the item
   with `fgos ask <id> --text`). `docs/platform/questions/spec.md:17,48,159` keeps `fgos ask` items in the Work layer,
   outside the question store, so the "only" sentence is too broad: it should be scoped to a session's owner
   questions (heads), leaving item gates to `fgos ask`.
3. **Stale statement (Low, new)**, `core/skills/fgos-group-thinking/SKILL.md:168` says `src/runner/execution/run.mjs`
   "is the unit execution door"; the file is gone (deleted in `a0aafd8e2`), and `core/skills/fgos-run/SKILL.md:11`
   names the door `packages/execution/engine/src/unit_run/` (retired Node `run.mjs`). The two skills disagree on
   the current door.

Checked and consistent: `--provider` semantics between the two units now; run-door wait vs workflow poll
(`fgos-advise/SKILL.md:110`, `fgos-group-thinking/SKILL.md:87`, architecture panel); the lead's ticket wait loop
(`fgos request result --wait`) is a different verb from a backgrounded `fgos run`; worker never commits vs the inline
commit in `verify-commit-and-iron-law.md:44-45` (inline session, not a worker); shaping "one question per turn"
(live conversation only) vs batching; shaping "ask the person one line" for an unknown domain vs
`domain-doctrine-read` (fgos-clarifying); docs-only verification vs DoD; the secretary's backlog copy under
`${TMPDIR:-/tmp}/backlog.md` (`fgos-secretary/SKILL.md:54-56`) is outside the repository root, so it does not breach
`scratch-artifacts` (its fallback name differs from `${TMPDIR:-/tmp}/fgos-work/`, but the secretary sandbox is the
local reason; not counted).

### (c) Rule pointers

None dangling. 17 distinct ids are pointed to with `Rule: <id>` (before-touching-code, capability-routing-rules,
convention-paths, decision-question-template, design-principles, destructive-cleanup, dispatch-decide-door,
domain-doctrine-read, driver-discipline, id-minting, impact-analysis-capability-gate, legacy-node-cli-boundary,
product-priority-order, rul11-tum-lum, run-door-contract, untrusted-input, writes-to-main). Every one is in
`rules.json` with scope `repo` and rendered in AGENTS.md; every `Rule:` line carries the "in AGENTS.md; set in
.fgos/instructions/effective/rules.json" form. The only reference to a non-rendered unit
(`core/skills/_shared/coding-worker-contract.md:95`, `coding-verification-discipline`) names its domain file and does
not claim AGENTS.md. Persona files named as owners (`core/agents/lead.yaml` and the others) exist.

### (d) Backticked paths that do not exist

Real misses:

1. `domains/coding/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md:18-19` and
   `domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md:49-50`:
   `docs/how-to/preserve-shell-escapes-when-transcribing-a-verify-command.md` (wrapped across two lines). Missing; the
   doc now lives at `docs/knowledge/how-to-preserve-shell-escapes-when-transcribing-a-verify-com/preserve-shell-escapes-when-transcribing-a-verify-command.md`.
   This is the fourth moved how-to; the last round fixed the other three.
2. `core/skills/_shared/executor-dispatch-fallback.md:292-293`: `src/runner/dispatch.mjs` (missing, deleted in
   `a0aafd8e2`) and `src/runner/execution/run.mjs` (missing) cited as the current proof owners, without the
   "retired ... last at" label the other skills use.
3. `core/skills/fgos-group-thinking/SKILL.md:168`: `src/runner/execution/run.mjs` (missing; see (b)3).
4. `domains/coding/instructions/coding-worktree-safety.md:21` and
   `domains/coding/skills/fgos-coding-discovering/SKILL.md:58`: `.fgos/events.jsonl` does not exist; event truth moved
   to `refs/fgos` in `51bee6b53` (2026-10-24, D-ADR0055) and `.fgos/events` is now a small seal pointer. Rule 3 of
   coding-worktree-safety ("stashing `.fgos/events.jsonl` rolls the repository's `.fgos` state back") and the
   discovering skill's `lock-timeout` note (lock "của `.fgos/events.jsonl`") describe a file that is gone.
5. `core/skills/fgos-secretary/SKILL.md:125`: `_shared/friction-capture.md` does not resolve from the skill directory
   in either render surface; every other skill writes `../_shared/friction-capture.md`.

Not counted (resolve, or are not repo paths): retired-Node paths labelled "retired ... last at `85760c6f2`"
(`capability-catalog.md:95`, `capability-matching.md:23`, `fgos-run/SKILL.md:11,27`); examples
(`common/schema.py`, `docs/ops/queue.md`, `docs/pricing-v2.md`, `docs/finance/*`, `/home/me/...`); project-side or
runtime directories (`fgos/agents/`, `upstreams/`, `.fgos/authority/model/`, `decisions/`, plan-relative
`reports/`); `repo/...` payload-root paths in `fgos-indexing` and `fgos-routing` (exist under the repo root);
`approve/SKILL.md` in `catchup-self-recovery.md:3,21` (resolves in `plugins/fgOS/skills/`, the plugin-only skill);
`../_shared/coding-worker-contract.md` in `implement-and-collaboration.md:21,24` (relative to the skill directory).

## Verdict

Yes. Beyond the kept-by-design list: duplicates `fgos-run/SKILL.md:78` and `fgos-routing/SKILL.md:178`; conflicts
C4 residual (`fgos-lead/SKILL.md:48-51` vs `dispatch-decide-door.md:40`), N3 (`decision-question.md:45` "only
`fgos questions ask`" vs `fgos ask` item parks) and the stale execution door in `fgos-group-thinking/SKILL.md:168`;
no dangling rule pointer; missing paths `docs/how-to/preserve-shell-escapes-...` (2 sites),
`src/runner/dispatch.mjs` + `src/runner/execution/run.mjs` (`executor-dispatch-fallback.md:292-293`,
`fgos-group-thinking/SKILL.md:168`), `.fgos/events.jsonl` (`coding-worktree-safety.md:21`,
`fgos-coding-discovering/SKILL.md:58`), and `_shared/friction-capture.md` (`fgos-secretary/SKILL.md:125`). All Low.
