---
name: fgos-architecture-panel
user-invocable: false
description: >-
  Help one real person make one real software-architecture decision, by
  running an advisory panel (framing, 3-panelist shaping, critique with
  red-team, synthesis, explanation) through the registered
  `architecture-advisory` Workflow (`fgos workflow start architecture-advisory`)
  instead of a single agent opining. Takes raw, ambiguous intent directly;
  never requires a person to write a problem brief or name a protocol. Use
  when someone wants a second opinion on an architecture direction, wants
  competing designs argued honestly before committing, or wants to keep
  talking to a recommendation after it lands. Examples: "should we split
  this service or keep it one", "get me a real panel opinion on this pipeline
  redesign, not just your take", "I disagree with the recommendation,
  here's why", "what would change your mind about that Postgres call".
  This is advisory and can be selected by fgos-panel; it never implements
  the chosen architecture.
---

# fgos-architecture-panel

This is the specialist surface for software-architecture advice. Generic
business/product/policy panels start at
[`fgos-panel`](../fgos-panel/SKILL.md). A coding design question belongs here
when it needs repository-grounded alternatives and a recommendation; an
explicit request to implement a concrete change belongs to `fgos-run`
only after the advice/implementation boundary is clear.

Dispatches through the registered
[`core/workflows/architecture-advisory.yaml`](../../../core/workflows/architecture-advisory.yaml)
Workflow definition using the unified `fgos workflow` door (`fgos workflow start architecture-advisory`,
`fgos workflow status <workflowRunId>`, `fgos workflow answer <workflowRunId>`).
That workflow declares the execution steps and DAG dependencies: framing, 3-panelist
shaping, reviewed critique with red-team, synthesis, and explanation. It does **not** know
what a good architecture recommendation looks like, what a premature
question looks like, or what a shaper producing a designated-loser
alternative looks like — that intelligence is this file, condensed from
the real doctrine proven across live sessions.
**Deep reference, not restated here in full:** the four Phase 01
playbooks are the canonical doctrine and stay unchanged —
[coordinator prompt](../../../docs/architect/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md),
[role doctrine](../../../docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md),
[artifact templates](../../../docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md),
[evaluation rubric](../../../docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md).
This file condenses enough of all four that a fresh agent with no other
context can run a good session from this document alone; it links out
for the full worked examples, the complete anti-pattern catalogue, and
the twelve-dimension rubric. If a judgment call here and the deep
doctrine ever disagree, the deep doctrine wins — this file is a
projection of it, not a replacement.

This facade also builds on the shared **Generic Driver Discipline**:
[`../_shared/coordination-driver.md`](../_shared/coordination-driver.md) defines
the domain-neutral cycle (`observe -> choose legal action -> dispatch -> verify
evidence -> disposition -> adapt -> explicit close -> continuity artifact`). The
Facade Hook Values table below fills that cycle's 9 hook slots from this file's
own existing sections, verbatim rather than restated — this file's six-value
disposition vocabulary and Fresh-Session Resume packet are not reconciled away
into something new; they *are* the fragment's `disposition criteria` and
`continuity artifact` hook values.

## Facade Hook Values

| Hook Slot | Value |
|---|---|
| `unit of iteration` | One `architecture-advisory` workflow run (one `workflowRunId`), from `framing` entry through `explanation` and human dialogue review. |
| `open inputs` | (a) result kind: advisory, never work-product -- this skill never implements the chosen architecture (frontmatter; Bounds #1, #5). (b) canonical capabilities resolved as `architecture:frame`, `architecture:shape`, `architecture:critique`, `architecture:synthesize`, `architecture:explain`. (c) raw case intake. |
| `evidence verification` | Never describe an outcome to the person until it has come back through the real workflow door -- `fgos workflow status <workflowRunId>`, an executed unit result, or human gate questions. |
| `disposition criteria` | Findings are dispositioned as accepted, mitigated, answered, invalidated-by-evidence, deferred, or unresolved visible dissent. |
| `adaptation bounds` | Synthesis revision is bounded. If a fundamental revisit is needed beyond the workflow DAG, open a new workflow run with prior intake as context. |
| `human-escalation triggers` | Material information gaps or genuine visible dissent escalate to the person via human gates or decision requests. |
| `close criteria` | Explanation step complete, all questions answered, and no unresolved items without visible dissent. |
| `after-close action` | No git mutation inside PROJECT_ROOT -- advisory recommendation only. |
| `continuity artifact` | `fgos workflow status <workflowRunId>` state plus step artifacts. |
## What This Skill Does Not Require Of The Person

- No problem brief. Raw words, however vague ("EOD and intraday
  evolution is becoming difficult" is a real, sufficient CASE — see
  P01.3) are the whole input.
- No protocol id, no role list, no roster choice. The skill resolves all
  of that from the case and the proven-safe executor allowlist before
  any advisor has an opinion.
- No answer up front to a question the repository can answer itself.
  Investigation always precedes any question reaching the person
  (SCOUT BEFORE ASK, below) — a majority of real sessions to date
  (P01.2, P01.3) sent **zero** Decision Requests and said so with
  evidence, not silence.
- No follow-up ceremony. A short, low-ceremony reply is still a complete,
  actionable dialogue turn — but getting its classification right matters
  more than treating brevity as decisiveness. Real precedent, read
  correctly: P01.2 Turn 2's "làm luôn cũng được" was classified as
  **permission, not instruction** — the lead advisor's own
  `dialogue/2-impact.md` states it explicitly: "if we proceed, we proceed
  on our own recommendation with their consent. I don't want the panel
  recording this as 'the person decided to build.'" A skill that treated
  that phrase as a decision would have misclassified it.

## Unified Workflow Execution Door

This skill invokes the registered `architecture-advisory` workflow through the unified `fgos workflow` CLI door:

- **Start workflow:** `fgos workflow start architecture-advisory` (or with `--dir <repoRoot>`).
  Returns at once with `{ workflowRunId, detached: { pid, logPath, statusCommand } }`; the run continues
  in a detached process and its log is `.fgos/workflow-runs/<workflowRunId>/advance.log`. It does NOT return
  the finished run: poll `fgos workflow status <workflowRunId>` until the run is `completed`, `failed` or
  parked at a gate. Add `--foreground` only when the caller must wait in place.
- **Check status / inspect outputs:** `fgos workflow status <workflowRunId>` (or with `--dir <repoRoot>`).
  Reports status of every step (`framing`, `shaping`, `critique`, `synthesis`, `explanation`),
  active units, and any pending questions at gates.
- **Answer human gate or questions:** `fgos workflow answer <workflowRunId> --step <stepId> --answer "<answer>"`.
  Resumes the workflow execution after answering.
- **Resume workflow execution:** `fgos workflow resume <workflowRunId>`.

Never describe an outcome to the person until verified through `fgos workflow status`.

## Entry Flow: The Five Workflow Steps

The workflow executes along a clean DAG of 5 steps:

| Step | Purpose | Capability | Pattern & Roles |
|---|---|---|---|
| `framing` | Intake, context investigation & framing | `architecture:frame` | `solo` (advisor) |
| `shaping` | Diverge into 3 independent proposals | `architecture:shape` | `panel` (3 panelists: panelist-1, panelist-2, panelist-3) |
| `critique` | Attack proposals & stress-test constraints | `architecture:critique` | `reviewed` (with red-team) |
| `synthesis` | Converge into coherent recommendation | `architecture:synthesize` | `solo` (synthesizer) |
| `explanation` | Actionable explanation for ownership | `architecture:explain` | `solo` (advisor) |

Each step's outputs are clean inputs for downstream steps, ensuring independent divergence during shaping and rigorous review during critique before synthesis.
## Executor Roster, With Cognitive Rationale

> **Executor registration — verified live.**
> `claude-bwrap`, `agy-bwrap`, and `codex-bwrap` are registered in this
> repository's `.fgos/config.json` and dispatch for real through `fgos
> coordination run`. Reconfirm before a session if the config may have
> changed since: `node src/runner/dispatch.mjs decide claude-bwrap
> --has-live-task-access` (and the other two) should return
> `{"mechanism":"out-of-process","configured":true}`. A `configured:false`
> result means `resolveExecutorConfig`'s fallback
> (`src/runner/dispatch/resolve.mjs:399`) is silently substituting the
> **global default executor** instead — in this repository that is
> `claude -p {prompt} --model {model} --permission-mode acceptEdits`, a
> mutating, unconfined invocation (it can write files in the worktree), the
> exact shape P00.1 spent its whole cell falsifying and excluding
> (`claude-reviewer`); do not forward the roster through `fgos
> coordination run` while that is the answer.
>
> **`codex-readonly` is retired for dispatch — never bind it to a role.**
> `-s read-only` has no writable-exception mechanism, so a dispatched
> agent can never write the `agent-result.json` that
> `assignment-runner.mjs` requires: every dispatch settles `no-evidence`
> no matter how good the findings were. Confirmed live (a real panel
> dispatch failed exactly this way and had to be retried on another
> executor) and by probe — `-s read-only --add-dir <dir>` still grants no
> write, matching the CLI's documented design (`--add-dir` is meaningful
> only under `workspace-write`, and `workspace-write` would make the
> target project writable, which is the thing confinement exists to
> prevent). `codex-bwrap` replaces it: same provider family, OS-level
> confinement, real write path for its own result.
>
> Three real caveats already folded into the registered config rather
> than left as manual workarounds. (1) `claude-bwrap`/`agy-bwrap`'s bwrap
> mount adds one additive writable exception, this repository's own
> `.fgos/assignments` — the coordination engine writes/reads
> `agent-result.json` there regardless of the target project's own
> `--cwd`, so a fully read-only mount left every dispatch stuck at
> "no-evidence" even with a correct agent-side result. (2) `agy-bwrap`
> carries `--print-timeout 30m`; without it agy's own print-mode default
> (~5 min) kills a long advisory dispatch mid-run — observed live on a
> red-team assignment. (3) `codex-bwrap` cannot run with a read-only
> `CODEX_HOME` (codex writes `models_cache.json`, `installation_id`,
> `tmp/arg0/*` and several SQLite DBs at that root during startup;
> neither `--ephemeral` nor `-c sqlite_home` relocates all of them), so
> `CODEX_HOME` is redirected to a **per-run tmpfs** with only
> `auth.json` read-only bound in. Do not "simplify" that to a writable
> bind of the real `~/.codex`: that directory's `AGENTS.md`,
> `AGENTS.override.md`, `config.toml`, `hooks.json`, `rules/`, `skills/`
> and `plugins/` are all loaded as **instructions** at startup, so a
> writable `CODEX_HOME` is a genuine cross-run prompt-injection and
> persistence vector. The tmpfs also means no goals/memories/thread
> state carries between advisory dispatches, and none of the operator's
> own hooks/rules/skills load into an advisory agent. Verified live by
> falsification: writes to `~/.codex/AGENTS.md`, `~/.codex/config.toml`
> and to the target repo all return `read-only file system`, with no
> file appearing on the host, while the agent's own
> `agent-result.json` writes normally.

Every role below is bound to one of the proven-safe allowlist pairs
([P00.1](../../../docs/architect/agent-coordination/verification/architecture-advisory-panel/P00.1.md)):
`claude-bwrap`, `agy-bwrap` and `codex-bwrap` — all three an OS
`bwrap --ro-bind / /` mount over the real checkout, each with one
narrow, named writable exception (this repo's `.fgos/assignments`, plus
a per-run tmpfs `CODEX_HOME` for `codex-bwrap`). Do not use any other
executor for an advisory role — no other pair has a live-proven
confinement envelope for this project's read-only advisory work, and
`codex-readonly` in particular cannot report a result at all.

**Bwrap runnability — proven fixed, not an open question.** A bare
`--ro-bind / /` alone breaks the agent CLI's own init (no writable
scratch for its private state) — but the working fix is proven and
already used live 13 times across P01.2 and P01.3 without a runnability
failure: place `--tmpfs /tmp` **before** re-pinning `--ro-bind
PROJECT_ROOT PROJECT_ROOT`/`--bind EVIDENCE_DIR EVIDENCE_DIR`, because
bwrap mounts apply in argument order and a later bind shadows an earlier
tmpfs
([P02.1](../../../docs/architect/agent-coordination/verification/architecture-advisory-panel/P02.1.md)
B7). Use that mount order every time; it is an operating recipe, not a
runnability gap left open.

**Role name -> real actor id.** The roles named below (`lead-advisor`,
`system-shaper`, ...) map exactly to the protocol's own `<role>-actor`
ids — `lead-advisor` -> `lead-advisor-actor`, `context-investigator` ->
`context-investigator-actor`, and so on through all 8 statically-declared
actors. An `actors[]` override entry's `id` field must carry the real
`-actor` id, never the bare role name — `run.mjs` hard-refuses an
undeclared `actors[].id` (`src/verbs/coordination/run.mjs:395-400`) with
the exact list of declared actors in the error, so a wrong id fails
loudly rather than silently.

| Role | Executor | Tier | Derived model | Persona | Why this binding fits the cognitive job |
|---|---|---|---|---|---|
| lead-advisor | `claude-bwrap` | frontier | `opus` | `person-facing-advisory-lead` | Intent interpretation and the human-facing explanation both need the strongest calibration available, plus a stable single voice across intake -> explain -> every dialogue turn; this role never sees a sibling's private notes, so provider diversity buys it nothing. **Leave `actors[].tier` unset for `lead-advisor-actor`**: tier resolution is monotonic-max (`assignment-policy.mjs`), so pinning the actor at `frontier` drags `close-dialogue` — pure bookkeeping — up to opus too. Unpinned, each operation derives from its own `rigor`: `interpret`/`explain`/`revise-explanation` at critical, `close-dialogue` at standard |
| context-investigator | `claude-bwrap` | standard | `sonnet` | `disconfirmation-seeking-scout` | Read-heavy, shallow-reasoning work, but its output feeds every downstream role, so reliability of tool-use and absolute-path discipline matters more than raw depth. Do **not** drop this to `nano`/haiku: measured against this exact role's real objective, haiku got every line citation right and reached the same central finding, but over-claimed a caveat sonnet caught (`fallbackMutationForAssignment` returns `undefined` on a malformed operation, so "always present" is false) and — worse — added an architecture recommendation, the one thing this packet's Avoid list forbids, because three independent shapers read this report |
| system-shaper | `claude-bwrap` | flagship | `opus` | `direct-response-architect` | Provider family A — deep, direct-response architecture synthesis under the evidence as framed. Note the claude ladder maps BOTH `flagship` and `frontier` to opus, so this shaper and the synthesizer now derive the same model; their independence rests on brief and context isolation, not on a model difference |
| alternative-shaper | `agy-bwrap` | flagship | `gemini-3.1-pro-low` | `different-priors-designer` | Provider family B, deliberately distinct from the system shaper — this is where the doctrine says diversity earns the most, because the alternative shaper's whole value is *different priors*, and a different model family is a real hedge against both shapers reaching for the same solution class |
| constraint-advocate | `codex-bwrap` | flagship | `gpt-5.6-terra` | `production-reality-advocate` | Third family; operations/security/migration reasoning is well-served by a careful, read-heavy pass, and this role runs twice (Phase 5 candidate, Phase 6 findings) so a reliable executor is a real advantage |
| architecture-critic | `agy-bwrap`, fresh assignment, distinct prompt package | **frontier** | `gemini-3.1-pro-high` | `cross-proposal-attacker` | Attacking three proposals at once is the panel's second-largest quality lever after synthesis, so it gets a strong model — and pro-high is cheaper than opus. Must never inherit a shaper's private context — the fresh assignment with a new prompt package is the isolation guarantee, not the executor choice, which is why sharing a family with the alternative shaper (at a different model) is acceptable |
| synthesizer | `claude-bwrap` | frontier | `opus` | `whole-ledger-integrator` | Strongest derived model for whole-ledger integration; sees only what visibility windows grant it |
| red-team | `codex-bwrap` | frontier | `gpt-5.6-sol` (this family's top rung for automated dispatch) | `process-and-authority-attacker` | Deliberately off the synthesizer's family — its entire job is catching what a mind resembling the synthesizer's would not. Specifically **not** `agy-bwrap`, even though that also satisfies the off-family rule: agy's structured result wrapper can come back a useless one line with the real findings only in the unstructured text (see Known Gaps), and this is the one role where trusting that wrapper manufactures exactly the ceremonial-`APPROVE`-with-nothing-checked appearance its own Avoid list warns against. Restoring a third provider family is what buys this placement — it is the concrete reason the third family is worth its config surface, not "more diversity" in the abstract |
| specialist | **no static actor id at all — see note below** | as the slot requires | as derived | `<topic>-bounded-expert` | Bound only after driver authorization for one named, bounded question; never a standing panel member. Default to `codex-bwrap` unless the topic argues for another lane |

**Specialist binding works differently from the other 8 roles — do not
treat this row as "the same shape, just filled in later."** The 8
roles above are static, named actors (`role: lead-advisor` etc. in the
protocol's own `actors[]`), each bindable up front in the request's own
`actors[]` override. The specialist has **no such actor id to bind at
all** — it is authorized on demand through the specialist-slot mechanism
(`specialistSlotRef: specialist-answer-slot`, `authorizeSpecialistSlot`,
reached via a `specialist-authorize` step in a raw coordination request —
see "Never Reimplements The Kernel" above for the exact doors), naming the
executor/tier/persona for that one question at
authorization time, not in the session's opening roster. Never
pre-declare a specialist actor id the way you would for the other 8.

`persona` is free-form prose framing the executor receives, not a closed
vocabulary (matching `fgos-run`'s own convention) — sharpen any
of these for a specific case, but keep the roster shape and the
executor/tier mapping unless there is a real reason to diverge.

**Reporting rule, not optional:** report the model as **derived from
executor + tier** (`resolveExecutorConfig`/`deriveProviderFamily`, per
[P02.1](../../../docs/architect/agent-coordination/verification/architecture-advisory-panel/P02.1.md)'s
own confirmation this is the real channel). Never emit an `actors[].model`
field in a request. Precisely: the request schema's own
`ACTOR_ALLOWED_KEYS` (`src/verbs/coordination/schema.mjs:133`) *does*
accept a `model` key at the validation layer — the real refusal is
`assertModelSupportedForKind` (`src/verbs/coordination/run.mjs:166-175`),
which rejects any `actors[].model`/global `--model` specifically for
`kind:"declared-protocol"` requests (which this protocol always is),
because `dispatchDeclaredOperation`'s PolicyPatch scope stack has no
model-override channel today. Cite that function, not the request
whitelist, if asked to verify this rule — the whitelist alone would
wrongly suggest the field is accepted. Never collapse the panel onto one
provider and never silently default every role to the same model when
alternatives are configured — if the roster genuinely cannot satisfy
diversity (e.g. only one safe provider family reachable), say so and
name what was given up, per the coordinator prompt's STOP CONDITIONS
("fewer than two safe provider families" is a real stop, not a shrug).

**Diversity is a hedge, not a decoration — audit it at the end of every
session.** State plainly what the diversity actually bought: which
advisor saw something its counterpart did not. If the honest answer is
"nothing distinguishable this time," say that — a roster listing three
providers that produced three interchangeable outputs spent budget on
the appearance of independence, not the substance of it (role doctrine,
Role-Routing Roster).

## Per-Role Task Packets

Full doctrine — purpose, posture, anti-patterns, and a real good/bad
example per role — lives in the
[role doctrine](../../../docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md).
The operating packet per role — what to notice, how to reason, what
evidence to seek, when to change position, how to communicate
uncertainty, and the failure posture to avoid — is no longer restated
here: every operation's `task.contractTemplate`
(`core/coordination-protocols/architecture-advisory-panel-v1.yaml`) now
resolves to a real prompt template that carries this content directly
into the dispatched agent's own prompt (Unit I22), so a fresh agent
never needs this file to act well.

| Role | Operation(s) | Task packet |
|---|---|---|
| Lead Advisor | `interpret-request` | [`architecture-advisory-panel-v1-interpretation.md`](../../../core/prompt-templates/architecture-advisory-panel-v1-interpretation.md) |
| Lead Advisor | `explain-recommendation`, `revise-explanation` | [`architecture-advisory-panel-v1-explanation.md`](../../../core/prompt-templates/architecture-advisory-panel-v1-explanation.md) |
| Lead Advisor | `close-dialogue` | [`architecture-advisory-panel-v1-close-dialogue.md`](../../../core/prompt-templates/architecture-advisory-panel-v1-close-dialogue.md) |
| Context Investigator | `investigate-context` | [`architecture-advisory-panel-v1-scout-report.md`](../../../core/prompt-templates/architecture-advisory-panel-v1-scout-report.md) |
| System Shaper | `shape-system-proposal` | [`architecture-advisory-panel-v1-system-proposal.md`](../../../core/prompt-templates/architecture-advisory-panel-v1-system-proposal.md) |
| Alternative Shaper | `shape-alternative-proposal` | [`architecture-advisory-panel-v1-alternative-proposal.md`](../../../core/prompt-templates/architecture-advisory-panel-v1-alternative-proposal.md) |
| Constraint Advocate | `shape-constraint-proposal` (Phase 5) | [`architecture-advisory-panel-v1-constraint-proposal.md`](../../../core/prompt-templates/architecture-advisory-panel-v1-constraint-proposal.md) |
| Constraint Advocate | `assess-constraints` (Phase 6) | [`architecture-advisory-panel-v1-constraint-findings.md`](../../../core/prompt-templates/architecture-advisory-panel-v1-constraint-findings.md) |
| Architecture Critic | `critique-proposals` | [`architecture-advisory-panel-v1-critique.md`](../../../core/prompt-templates/architecture-advisory-panel-v1-critique.md) |
| Synthesizer | `synthesize-recommendation`, `revise-synthesis` | [`architecture-advisory-panel-v1-synthesis.md`](../../../core/prompt-templates/architecture-advisory-panel-v1-synthesis.md) |
| Independent Red-Team | `red-team-packet` | [`architecture-advisory-panel-v1-redteam.md`](../../../core/prompt-templates/architecture-advisory-panel-v1-redteam.md) |
| Specialist | `answer-specialist-question` | [`architecture-advisory-panel-v1-specialist-answer.md`](../../../core/prompt-templates/architecture-advisory-panel-v1-specialist-answer.md) |

Each template follows the bounded-variable convention
(`src/runner/dispatch/operation-prompt-templates.mjs`): `{role}`,
`{objective}`, `{contextRefs}`, `{expectedOutputs}`, `{constraints}`,
`{evidenceContract}` only — a template may refine cognitive instructions
and artifact shape, never graph legality. If a judgment call in a
template and the deep doctrine ever disagree, the deep doctrine wins —
the templates are a projection of it, not a replacement.

## Lead Advisor Discipline — Scout Before Ask, In Practice

Investigation always precedes any question reaching the person. Before a
question is sent, run every candidate gap through three tests, in order
— **the third one is the one a naive reading of this discipline misses,
and getting it wrong inverts the real practice:**

1. **Scouted.** The context investigator has already run and reported;
   the question survived that investigation (write down what was looked
   for and what was or wasn't found).
2. **User-exclusive.** Could any amount of repository reading answer it?
   If yes, it is unfinished scouting, not a question.
3. **Material *now*, not material in the abstract.** This is a real
   third axis, not a restatement of #2: a gap can be genuinely
   user-exclusive AND still not block Phase 5 — because the shapers can
   produce real, evidence-grounded candidates conditioned on an explicit
   default, and the actual answer is better reserved for Phase 9, where
   a concrete synthesis already exists for the person to react to. A
   question earns interruption **now** only if the panel's own Phase 5
   output would genuinely differ depending on the answer, today, before
   any candidate exists to react to.

**A gap that fails test 3 is never deleted — it is carried forward as an
explicit named default.** This is the discriminator a naive "if not
material, delete it" rule misses, and getting it wrong inverts what the
real sessions actually did: check
[P01.3's `decision-request.md`](../../../docs/architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.3/decision-request.md)
directly — three of its seven candidate gaps are marked
**user-exclusive in the source's own words** ("Yes — only the person can
say"), and every one of them is still answered "not asked now," because
each is carried forward as a named default into Phase 5-8 rather than
blocking there. The file closes with exactly this framing: "This is a
recorded decision, not a skipped step — this file exists so a successor
coordinator does not re-ask what was already reasoned through." P01.2
matches. **Both real sessions to date sent zero Decision Requests, and
neither one silently dropped a real gap to get there** — every surviving
gap is named, defaulted, and carried into a later phase (often ending up
as part of Phase 8's "what stays theirs").

One narrow exception: if proceeding requires inventing a fact about the
person's own obligations (a compliance boundary, a contractual
commitment) that cannot be defaulted safely, ask immediately and say why
waiting would have been worse.

## Debate And Synthesis Discipline — Also Not Aspirational

- **Shapers produce genuinely different candidates.** P01.2's three
  proposals genuinely diverged on ownership (two `stay-thin`, one
  primary-recommends deletion); P01.3's three independently reached the
  same option through three different mechanisms, which the panel
  reported honestly as convergence rather than manufacturing artificial
  disagreement.
- **Critics attack claims, not style, and concede when an attack
  fails.** P01.2's critique: 5 attacks, 1 conceded, 2 decision-changing.
  In P01.3, the **coordinator** independently re-verified two of the
  critique's attacks against the real repository before trusting them (a
  scheduler-deadlock claim and an alert-cap-severity misclassification,
  confirmed by reading real source) — this was the coordinator's own
  follow-up discipline, not the critic's own act: the critic's actual
  artifact only states what would settle each attack, per its own
  discipline of naming a settling observation rather than asserting one
  — see
  [P01.3's `critiques/architecture-critic.md`](../../../docs/architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.3/critiques/architecture-critic.md).
- **Synthesizer recommends one thing without flattening dissent.** Both
  sessions' `synthesis.md` preserve attributed, unresolved disagreement
  in the packet body, not a footnote — P01.2 kept its reversibility
  dispute live through to the final dialogue response, still unresolved.
- **Red-team attacks framing and advisory quality, not just technical
  correctness.** The role doctrine's own worked example (`redteam.md`)
  shows a red-team catching a driver dispositioning a technical claim
  without an advisor's evidence — an authority violation, not an
  architecture defect; task prose for this role must check
  `dispositions.md` against `runs/`, every session, not just the
  recommendation's logic.

## Decision Dialogue

Every human turn is classified, and the classification decides what may
happen next — never assumed from tone.

| Verb | What it looks like from the person | What it authorizes | Consumes a reopen cycle? |
|---|---|---|---|
| **clarify** | Wants something explained, disputes nothing | Answer from existing artifacts; no operation dispatch | No |
| **challenge** | Disputes a specific claim | Defend with existing evidence, or concede and route to `revise-synthesis`/`revise-explanation` if the concession changes the packet | Only if it actually changes something |
| **introduce-context** | Supplies a fact the panel didn't have | `revise-synthesis` incorporating the new fact (see Bounded Reopen Scope if it needs fresh shaping) | Yes |
| **request-alternative** | Wants an option the panel didn't produce | `revise-synthesis` evaluating it against the existing ledger, or a new cell if it needs a fresh independent shaper (Bounded Reopen Scope) | Yes |
| **request-composition** | Wants parts of two options combined | `revise-synthesis` with the composition as an explicit candidate — never the coordinator improvising the merge itself | Yes |
| **decide** | States a decision, or an intentional deferral with named triggers | Record verbatim in `human/<n>-person.md`; stop advising (or park with named triggers) | N/A — this ends the loop, it doesn't reopen it |

**Recording mechanism, tied to the hard door:** write
`human/<n>-person.md` first (verbatim, append-only, never edited), then
submit a `human-turn` request step citing that file as `artifactRef` —
the engine computes the revision hash from the file's real committed
bytes itself, never from a caller-supplied claim, and refuses
self-attribution or attributing the turn to a declared panel actor. Only
after that step succeeds do you draft `dialogue/<n>-impact.md`
(classification, what changes, what doesn't, what reopens and why
nothing smaller would do — see the reconciliation note immediately
below for who authors this and why), and only after you authorize based
on that impact assessment does any `revise-*`/`close-dialogue` operation
dispatch. `dialogue/<n>-response.md` states which authorization it was
produced under and what changed — every turn gets one, including a
clarification with no reopen at all.

**Reconciliation — `decision-request.md`, `dialogue/<n>-impact.md`, and
a clarify-turn's response are coordinator-authored bookkeeping, not
panel operation output.** The manual playbook has a dispatched,
isolated lead advisor author all three. The registered protocol's graph
has **no operation that carries any of them**: the lead advisor's only
four operations are `interpret-request`, `explain-recommendation`,
`revise-explanation`, `close-dialogue` — none of which exists at Phase 4
(too early — `phase-shaping` starts immediately after `phase-framing`,
with nothing in between), and `revise-explanation` is capped at 2
invocations total, which a `clarify` turn (explicitly "no reopen cycle
consumed") must never spend just to get a response drafted. **You (the
coordinator/driver) author these three directly**, explicitly labelled
as your own reading — the same class of artifact `dispositions.md`
already is, never presented as if a dispatched, isolated lead advisor
produced them. **This is not a BOUNDS #7 violation:** BOUNDS #7 forbids
fabricating what a panel *advisory role* would have produced (a
proposal, a critique, a synthesis) and presenting it as that role's
independent work; it does not forbid the driver recording its own
interpretation-and-authorization trail, which is the driver's job by
design (`dispositions.md` already works exactly this way). Where the
protocol *does* offer a genuine isolated lead-advisor dispatch —
`revise-explanation`, budget permitting — prefer it for a turn that
already needs a reopen; reserve the budget, don't spend it on
bookkeeping a `clarify` turn never needed reopened in the first place.
If a future protocol revision adds an operation for these, retire this
workaround; until then, name it here rather than leaving two
irreconcilable instructions for a fresh agent to trip over.

**This is a mechanical consequence of the registered graph, not a
judgment call** — so the file's own opening precedence rule ("if a
judgment call here and the deep doctrine ever disagree, the deep
doctrine wins") does not apply to it. The deep doctrine correctly
describes the manual playbook, where a dispatched lead advisor really
could author these; it is not wrong, it is describing a shell this
protocol's graph does not yet have an operation for. Do not resolve
this divergence by deferring to the doctrine's own attribution.

**Explain impact before reopening, always.** The impact assessment names
which conclusions are affected and which are not, and why nothing
smaller than the chosen reopen would do — a reopen with unbounded scope
("revisit the design") is exactly what this discipline exists to
prevent, and `revise-synthesis`/`revise-explanation` are hard-capped at
`activation.maxInvocations: 2` each regardless.

**When the reopen budget is exhausted.** If both `revise-synthesis` and
`revise-explanation` invocations are spent and the person raises
genuinely new material, the same "open a new cell" path from Bounded
Reopen Scope applies — never inline authorship, never "the panel would
probably say." Say so to the person plainly: "this session's bounded
reopen budget is spent; going further needs a new session."

**Out-of-panel consultation (e.g. `kongming`) — a real, named
convention, not an improvisation.** The person may, mid-dialogue, ask
for an independent, non-panel, strong-reasoning consultation on a
specific factual or directional question — this happened for real once
(P01.3 Turn 1: the person asked for `kongming`'s directional read rather
than answering the panel's own two open questions directly), and P02.1
explicitly assigned documenting the convention to this skill (B11: "flag
for Phase 03/04 consideration ... should have a documented convention
rather than rely on this cell's improvisation"). If it happens again:

1. This is a **separately-authorized** consultation, never a Phase 5/6/7
   panel dispatch — it is not one of the 9 roles and does not consume a
   `revise-*` reopen invocation.
2. **Attribute every claim to it by name**, never merge it into the
   panel's own voice as if a shaper or the synthesizer had produced it.
3. **Independently re-verify the one load-bearing factual claim** it
   contributes before recording it as trusted — real precedent: the
   coordinator grepped the actual source to confirm kongming's key claim
   before writing it into `dispositions.md`, rather than accepting it on
   the consultation's own authority.
4. Record the authorization and the attribution discipline in
   `dispositions.md`, same as any other driver act — this is what kept
   the boundary real in the one case it happened, held by prose
   convention, not a schema check.

## Driver Disposition — You Author This File

**`dispositions.md` does not exist until you write it — no operation
produces it, and nothing dispatches it.** Every finding, objection, and
open point the panel raises gets exactly one disposition, appended with
a rationale and an evidence reference. This is the artifact the resume
packet (below) and the red-team packet both already assume exists; this
section is what tells you, the driver, how to write it correctly.

Six dispositions:

- **`accepted`** — the finding is valid and it changes the packet or the
  process. Name what changes; an `accepted` with no named consequence is
  really `answered` or `deferred`, mislabelled.
- **`answered`** — valid as a question, already addressed by evidence in
  the ledger. Cite that evidence by path — "we already considered that"
  with no citation is a dismissal, not a disposition.
- **`mitigated`** — valid, cannot be eliminated, and the packet now
  carries both the mitigation (authored by an **advisor**, never by you)
  and the residual risk, stated plainly. A `mitigated` claiming zero
  residual risk is an `accepted` in disguise.
- **`deferred`** — valid, out of scope for this decision. Name where it
  belongs and its trigger to revisit. **This is the one disposition you
  may make entirely on your own authority** — scope is an authority
  question, not a technical one.
- **`unresolved`** — valid, unsettled: nobody has produced evidence that
  settles it, and neither side has conceded. It goes to the person as
  **visible dissent**, in the packet body, not a footnote. This is a
  legitimate, often-correct outcome — not a defect to be smoothed. (This
  is the exact term the Synthesizer's dissent-laundering guard, above,
  refers to: converting a real `unresolved` into a "consideration" so
  the packet reads tidier is forbidden.) Contrast with a claim that
  actually *was* settled — a shaper explicitly conceding (real
  precedent: P01.2's and P01.3's own conceded critique attacks), or an
  advisor's evidence resolving it — which is `accepted`,
  `invalidated-by-evidence`, or `answered` instead, depending on which
  side moved.
- **`invalidated-by-evidence`** — a specific advisor observation refutes
  it. Cite the observation, by path or run result, from an advisor who
  actually looked — never your own reasoning about the codebase.

**You must not disposition `invalidated-by-evidence` or `answered`
alone when the claim is about PROJECT_ROOT or the panel's own
artifacts.** If no advisor has shown you the fact, dispatch the role
that would hold the evidence (usually the context investigator) and
wait — deciding it yourself is opining inside an authority role, not
dispositioning, and it is invisible in the final packet unless a
red-team catches it. A finding about **your own conduct** — an
authority violation, an isolation breach, a fabricated turn — must never
be self-dispositioned as `answered`/`invalidated-by-evidence`; escalate
it to the person or an independent role. Self-clearing is never
legitimate here.

## Fresh-Session Resume

A fresh agent resumes from `EVIDENCE_DIR` plus one call to `fgos
workflow status <workflowRunId>` — never from chat history or
raw dispatch logs.

**The orientation packet, in reading order:**

1. `fgos workflow status <workflowRunId>`: status of each step, which units
   completed or failed, and active gate questions — this is the hard,
   replay-derived truth of where the workflow run actually is,
   independent of what any prose file claims.
2. `session.md` — the coordinator's own compact status board: case,
   phase, roster, one imperative next action. If this and (1) disagree,
   trust (1) and correct `session.md`.
3. `intake.md`, then the newest `human/<n>-person.md` — ground truth of
   what was actually asked and said, read before any panel artifact so
   the panel's own framing doesn't become mistaken for the question.
4. `interpretation.md` and `dispositions.md` — what the panel believes
   and what the driver has authorized.
5. Only the artifacts the next action actually needs — re-reading every
   proposal "to feel oriented" is how a resumed session drifts into
   restarting a completed phase.
6. Any actor with a prompt (`prompts/<role>.md`) but no matching run
   record (`runs/<ordinal>-<role>.json`) was interrupted mid-flight —
   re-dispatch under a new ordinal, never assume its silence meant
   agreement.

The complete artifact tree, its exact filenames, and why each one is
shaped the way it is are the
[artifact templates](../../../docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md)
document — this skill reuses those names unchanged; a coordinator must
never invent a new filename mid-session.

## Bounds (condensed — full text in the coordinator prompt's own BOUNDS section)

1. Work items, if referenced, are read-only context — never claimed,
   approved, merged, or mutated by this skill.
2. No git mutation inside PROJECT_ROOT, ever. The session's own evidence
   commits (in the repository hosting this skill) are a separate thing
   and must never resolve to a path inside PROJECT_ROOT.
3. No anonymization — every artifact names its role and its real
   executor/provider/model.
4. No vote tallying, no weighted scoring, no numeric consensus.
   Disagreement is argument and evidence, never a count.
5. No implementation-plan generation. Naming the first reversible step
   is advisory; a phased build plan is a different product.
6. No fabricated human input, ever — not a placeholder, not a
   clearly-labelled guess. Park and name exactly what interaction is
   needed instead.
7. If independent dispatch is unavailable for a role, record the gap —
   never perform that role inline and present it as panel output. One
   session writing every advisor's output is a failed session even when
   the prose reads well.

## Known Gaps

- **`tsk-1o4`** (P02.1 BL2) — **closed.** `claude-bwrap`, `agy-bwrap`,
  and `codex-bwrap` are registered in `.fgos/config.json` and dispatch
  for real through `fgos coordination run`. `codex-readonly` was part of
  this roster and is now retired for dispatch — it can never write its
  own result file. See the Executor Roster note above for the three
  caveats folded into the registration.
- **`tsk-31d`** — `agy -p` ignores the invoking OS cwd for relative
  paths; pass absolute paths in prompts targeting `agy-bwrap`.
- **`tsk-1ed`** — **closed by `tsk-5zim`; do not hand-write the schema
  into objectives any more.** `renderAssignmentPrompt`
  (`src/runner/dispatch/assignment.mjs`) now states the
  `agent-result.json` contract itself whenever a `runDir` is in scope: the
  legal `status` values, rendered from `ALLOWED_AGENT_CLAIM_STATUSES` (the
  same set `validateAgentResultClaim` enforces, so the prompt cannot drift
  from the validator), the required non-empty `summary`, and — for a
  read-only operation — that a `done` with no `agent-report.md` settles as
  `no-evidence`. Verified live in a real dispatched prompt. Restating the
  schema in the objective is redundant, not harmful; but a hand-written
  copy CAN drift from the validator, which is the reason this entry
  existed. Prefer the rendered contract.
- **`tsk-oed`** — `aggregateBounds` carries an undocumented third bound
  (`wallTimeMs`, default 1 hour) that can permanently block a session
  regardless of unused round/assignment budget; declare it explicitly
  for a long session.
- **`tsk-3yo`** — the mutation-detector cannot distinguish a real
  confinement breach from an unrelated concurrent editor of the same
  target repo; a `failed` assignment with an otherwise-correct
  `agentClaim` is worth a second look before assuming a real breach.
- **`tsk-44p`** — the request schema's charset check refuses any
  `human-turn:`/`contribution:`-prefixed ref in `authorize.grantedContextRefs`,
  `disposition.targetRef`, or `disposition.evidenceRefs`, for every
  protocol (not just this one). Workaround: an `authorize` step's
  free-text `reason` field is the only channel today to name which human
  turn licenses a dialogue reopen — never a real ref in those fields
  until this lands.
- **`tsk-3xk`** — **closed (I24a).** A `specialist-authorize` request-step
  type now exists for every raw coordination request door (`fgos
  coordination run --file`, `fgos coordination start --steps`, the
  headless adapter; `src/verbs/coordination/schema.mjs`), reaching
  `authorizeSpecialistSlot` — build it directly into a raw request, then
  dispatch
  `answer-specialist-question` through the normal `operation` step once
  authorized. This door is NOT reachable through
  `fgos-group-thinking`'s own gate — `runGroupThinkingRequest` explicitly
  refuses a `specialist-authorize` step (Group-Thinking Workflow
  bypass #4 stays refused). I24b landed the driver-authenticated
  typed-action/subverb door for this same capability (`fgos coordination
  specialist-authorize`, reaching the locked
  `authorizeSpecialistSlotLocked`/`recordSpecialistAuthorizationLocked`
  twins) — a session opened via the pack gate can still have a specialist
  authorized through that separate subverb; the gate refusal above only
  ever blocked the raw request-step path.
- **Doctrine-by-path fails across a dispatch boundary — a hard
  requirement, confirmed failing identically twice (P01.2, P01.3).** A
  dispatched executor's cwd is pinned to PROJECT_ROOT, a different
  repository — any prompt referencing this repo's own doctrine by a
  repo-relative path will report the file missing (correctly; it does
  not fabricate). Every prompt dispatched under this skill must embed
  the relevant doctrine section **verbatim**, never by path.
- **Doctrine-example name collision.** The role doctrine's own worked
  examples use real case names (`mdview`, `vnflow`). If a live case
  shares a doctrine example's name, embedding that example's text
  requires an explicit, loud warning that its content is fictional and
  must not be echoed — confirmed workable across 7 dispatches in P01.3,
  but check for this collision every time a doctrine excerpt is embedded,
  don't assume it won't recur.
- **Bounded reopen scope** (see above) — this protocol's dialogue-reopen
  graph is `revise-synthesis`/`revise-explanation`/`close-dialogue` only;
  it does not reopen Phase 5/6 the way the manual playbook could. This
  is V1's real, documented boundary, not an unhandled case.
- **No graph operation carries `decision-request.md`, `dialogue/<n>-impact.md`,
  or a clarify-turn response** — see the reconciliation note in Decision
  Dialogue for why the coordinator authors these directly as its own
  bookkeeping, and why that does not breach BOUNDS #7.
- **`agy`'s own result reporting is unreliable in two specific ways
  (P02.1 B12, B13)**, and this roster routes both the alternative shaper
  and the independent red-team through `agy-bwrap`: (B12) its structured
  result wrapper can be a useless one-line summary with real findings
  sitting only in the unstructured text response — for the red-team
  specifically, trusting the wrapper can manufacture exactly the
  ceremonial-`APPROVE`-with-nothing-checked appearance its own Avoid
  list warns against; (B13) its own internal telemetry can interleave
  with a captured streamed response. Always read the raw unstructured
  response directly; never treat an empty/one-line structured summary as
  evidence of no findings; if telemetry lines appear interleaved,
  reconstruct and verify byte-for-byte against the surrounding real
  content before trusting the capture.

## Out Of Scope For This Skill

Example families (clear start, unclear start, clarification/challenge,
material-context reopen, alternative/composite reopen, final
decision/defer), the heterogeneous-vs-homogeneous-roster worked pair,
and `docs/how-to/use-fgos-architecture-panel.md` are P04.2's scope, not
built here. This file states the mechanism and the doctrine a P04.2
example must demonstrate; it does not narrate any scenario end to end.
