---
name: fgos-architecture-panel
user-invocable: false
description: >-
  Help one real person make one real software-architecture decision, by
  running a 9-role advisory panel (lead advisor, context investigator,
  system/alternative shapers, constraint advocate, architecture critic,
  synthesizer, independent red-team, on-demand specialist) through the
  real, registered `core.coordination-protocol.architecture-advisory-
  panel-v1` protocol -- hard visibility windows, driver-authorized
  reveals, bounded dialogue reopen, replay -- instead of a single agent
  opining. Takes raw, ambiguous intent directly; never requires a person
  to write a problem brief or name a protocol. Use when someone wants a
  second opinion on an architecture direction, wants competing designs
  argued honestly before committing, or wants to keep talking to a
  recommendation after it lands. Examples: "should we split this service
  or keep it one", "get me a real panel opinion on this pipeline
  redesign, not just your take", "I disagree with the recommendation,
  here's why", "what would change your mind about that Postgres call".
---

# fgos-architecture-panel

Dispatches through the real, registered
[`core.coordination-protocol.architecture-advisory-panel-v1`](../../../core/coordination-protocols/architecture-advisory-panel-v1.yaml)
FlowDefinition (the same `CoordinationSession` engine, request schema, and
`fgos-group-thinking` pack gate every sibling group-thinking protocol
uses — not a copy, the same code path, confirmed live: 757/757 focused
coordination tests, 13 conformance cases naming premature reveal, hidden
dissent, unauthorized specialist, over-cap reopen, human-authority
impersonation, and heterogeneous actor/tier provenance — see
[P03.2](../../../docs/architect/agent-coordination/verification/architecture-advisory-panel/P03.2.md)).
That protocol declares legality and collaboration posture only: who may
act when, what stays hidden until a window opens, what needs driver
authorization, what is bounded and how many times. It does **not** know
what a good architecture recommendation looks like, what a premature
question looks like, or what a shaper producing a designated-loser
alternative looks like — that intelligence is this file, condensed from
the real doctrine proven across two live manual sessions
([P01.2](../../../docs/architect/agent-coordination/verification/architecture-advisory-panel/P01.2.md),
[P01.3](../../../docs/architect/agent-coordination/verification/architecture-advisory-panel/P01.3.md))
before this protocol existed to carry it.

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

## Never Reimplements The Kernel

This skill's task prose invokes the registered protocol through the
existing doors only:

- **Dispatch/resume:** `fgos-group-thinking`'s own gate
  (`runGroupThinkingRequest`,
  [`core/skills/fgos-group-thinking/SKILL.md`](../fgos-group-thinking/SKILL.md))
  with `protocolId: "core.coordination-protocol.architecture-advisory-panel-v1"`
  — this protocol is a registered member of the group-thinking Protocol
  Pack (`core/protocol-packs/group-thinking.json`, P03.2). Read that
  skill's own steps 1-5 for the exact request shape, the `actors[]`
  per-role override shape, and why the gate cannot be bypassed; this
  file does not restate them. **Before naming any executor in an
  `actors[]` override, read the WARNING at the top of Executor Roster,
  below** — the three proven-safe pairs are not yet registered for this
  door, and naming one anyway does not fail loudly.
- **Replay/status:** `fgos coordination show <coordinationId> --json`,
  unmodified.
- **Human-turn recording:** the `human-turn` request-step type
  (`recordHumanTurn`, Phase 03.1) — session-level, protocol-agnostic
  infrastructure, not a graph node in this protocol's own FlowDefinition.
- **Specialist authorization:** `authorizeSpecialistSlot` called
  directly (see Known Gaps — no `specialist-authorize` request-step type
  exists yet, `tsk-3xk`).

No authority, visibility, aggregation, bounds-checking, or replay logic
is described or implied here beyond what those doors already enforce.
Never describe a coordination outcome to the person until it has
actually come back through one of these doors — this skill has no
"the panel would probably say" fallback (BOUNDS #7, below).

## Entry Flow: The Nine Phases, Mapped Onto The Real Graph

The full judgment content for each phase is the coordinator prompt's own
nine-phase section; what follows is the mapping onto
`architecture-advisory-panel-v1`'s real nodes, so a fresh agent knows
which request to build at each point. `activation` and gating below are
exactly as declared in the FlowDefinition — the engine re-derives every
window fresh from the event log on every call, so no request shape can
skip a gate.

| Phase | Node | Operation(s) | Actor | Activation | Gated by |
|---|---|---|---|---|---|
| 1 Intake and Framing | — (coordinator only) | none — freeze `intake.md`, resolve roster | you | — | — |
| 1 (dispatch) / 2 Understand The Person / 3 Understand The Problem | `phase-framing` | `interpret-request`, `investigate-context` | lead-advisor, context-investigator | `required` | session open |
| 4 Ask Reluctantly | — (coordinator only — see Decision Dialogue's reconciliation note) | none — `decision-request.md`, sent or explicitly not sent | you | — | — |
| 5 Diverge Honestly | `phase-shaping` | `shape-system-proposal`, `shape-alternative-proposal`, `shape-constraint-proposal` | 3 shapers | `required` | `framing-shaping-open` (open from session start — a vacuous window that exists only so these `proposal`-typed contributions have somewhere legal to record) |
| 6 Debate Claims | `phase-critique` | `critique-proposals`, `assess-constraints`, (`answer-specialist-question` if authorized) | critic, constraint-advocate, specialist | `driver-authorized` | `post-shaping-open` — opens ONLY once all three Phase-5 bindings have a linked result; a partial trio never opens it (this is the real "premature reveal" refusal, mechanically enforced, not prose) |
| 7 Converge Without Flattening | `phase-synthesis` | `synthesize-recommendation` | synthesizer | `driver-authorized` | `post-critique-open` — opens only once BOTH `critique-proposals` AND `assess-constraints` are linked; transitively unreachable until every Phase-5/6 branch settles |
| (red-team) | `phase-redteam` | `red-team-packet` | red-team | `driver-authorized` | `post-synthesis-open` |
| 8 Explain For Ownership | `phase-explanation` | `explain-recommendation` | lead-advisor | `driver-authorized` | `post-redteam-open` |
| 9 Stay In Dialogue | `phase-dialogue-reopen` | `revise-synthesis` (≤2), `revise-explanation` (≤2), `close-dialogue` | synthesizer, lead-advisor, lead-advisor | `driver-authorized` | `revise-*` ungated (available once the graph reaches this node); `close-dialogue` gated by `post-explanation-open` |

Every `driver-authorized` operation needs an `authorize` step (your own
authorization, with a free-text `reason` — see `tsk-44p` in Known Gaps
for why that reason can't yet be a real `human-turn:`/`contribution:`
ref) immediately followed by the matching `operation` step, in the same
or a later resumed request against the same `coordinationId`.

**Bounded reopen scope — a real, deliberate narrowing from the manual
playbook, not an oversight.** The manual playbook's Phase 9 can reopen
Phase 3, 5, 6, or 7 with a fresh dispatch. This protocol's graph has
**no backward edge** — `phase-dialogue-reopen` offers exactly
`revise-synthesis`/`revise-explanation`/`close-dialogue`, nothing that
re-dispatches a shaper or the critic. Concretely, when a human turn
would (per the manual doctrine) reopen Phase 5 or 6:

- The synthesizer's `revise-synthesis` run is the mechanism: it
  incorporates the human turn's new fact, requested alternative, or
  requested composition into a revised Decision Packet **using the
  existing ledger plus what the turn itself supplies as fact** — it does
  not fabricate a fresh independent shaper's output to fill the gap.
- If the synthesizer's own revised output states that the new material
  genuinely requires a fresh independent shaper or critic pass (not
  something integratable from existing evidence), record that
  explicitly in `dialogue/<n>-response.md` and open a **new cell** (a
  new `coordinationId`, fresh `phase-framing` entry, reusing this
  session's `intake.md`/`scout-report.md` as inherited context) for that
  follow-on work — never invent the fresh shaper's voice inside
  `revise-synthesis` itself.

Say this plainly to the person in the response: "a full re-run of [X]
would need a new session; here is what the panel can tell you today
without one." This is not a workaround to hide — it is the accurate
picture of what V1 bounds.

## Executor Roster, With Cognitive Rationale

> **WARNING — verify before dispatching, every session, not just once.**
> None of `claude-bwrap`, `agy-bwrap`, or `codex-readonly` is registered
> in this repository's live dispatch config today. Confirmed live:
> `node src/runner/dispatch.mjs decide claude-bwrap --has-live-task-access`
> (and the other two) all return `{"mechanism":"out-of-process",
> "configured":false}`. `resolveExecutorConfig`'s own fallback
> (`src/runner/dispatch/resolve.mjs:399`: `const executor = byExecutor ??
> (cfg && cfg.executor)`) means naming an unregistered executor does
> **not refuse** — it silently substitutes the **global default
> executor**, which in this repository's own `.fgos/config.json` today is
> `claude -p {prompt} --model {model} --permission-mode acceptEdits
> --allowedTools Bash(git add:*),Bash(git commit:*),...` — a mutating,
> git-write-enabled invocation, the exact shape P00.1 spent its whole
> cell falsifying and excluding (`claude-reviewer`). Forwarding this
> roster through `fgos coordination run`/`fgos-group-thinking`'s gate
> as-is today would run all 9 advisory roles on one unconfined,
> git-write-capable provider, silently, with no error anywhere.
>
> **Do not assume this roster is dispatchable through `fgos coordination
> run` until `tsk-1o4` (P02.1 BL2 — register the 3 proven pairs in
> `.fgos/config.json`) lands.** That is real infra work with its own
> blast-radius review and is out of this skill-prose cell's own scope to
> do. Until then, use the manual, direct-process-invocation mechanism
> P01.2 and P01.3 actually used successfully instead: invoke `bwrap`/
> `codex` directly as a subprocess (never through the executor-name
> resolution above), using the proven mount recipe in the next paragraph.
> Re-run the `decide` check above before every session — this is a
> config-registration gap, not a permanent one, and the workaround
> becomes unnecessary the moment it closes.

Every role below is bound to one of the proven-safe allowlist pairs
([P00.1](../../../docs/architect/agent-coordination/verification/architecture-advisory-panel/P00.1.md)):
`codex-readonly` (provider-native `-s read-only`), `claude-bwrap` and
`agy-bwrap` (OS `bwrap --ro-bind / /` mount, `--chdir` to the real
checkout). Do not use any other executor for an advisory role — no other
pair has a live-proven confinement envelope for this project's read-only
advisory work.

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
| lead-advisor | `claude-bwrap` | critical | `opus` | `person-facing-advisory-lead` | Intent interpretation and the human-facing explanation both need the strongest calibration available, plus a stable single voice across intake -> explain -> every dialogue turn; this role never sees a sibling's private notes, so provider diversity buys it nothing |
| context-investigator | `codex-readonly` | standard/analytical | `gpt-5.5` (tier is immaterial on this executor — every tier derives the same model; say so, don't imply a tier choice that did nothing) | `disconfirmation-seeking-scout` | Provider-native read-only sandbox is the cheapest, safest way to run broad evidence retrieval against PROJECT_ROOT; this role's authority comes from having looked, not from reasoning depth |
| system-shaper | `claude-bwrap` | analytical | `sonnet` | `direct-response-architect` | Provider family A — deep, direct-response architecture synthesis under the evidence as framed |
| alternative-shaper | `agy-bwrap` | analytical | `gemini-3.1-pro-low` | `different-priors-designer` | Provider family B, deliberately distinct from the system shaper — this is where the doctrine says diversity earns the most, because the alternative shaper's whole value is *different priors*, and a different model family is a real hedge against both shapers reaching for the same solution class |
| constraint-advocate | `codex-readonly` | analytical | `gpt-5.5` | `production-reality-advocate` | Third family when three are available; operations/security/migration reasoning is well-served by a careful, read-heavy pass, and this role runs twice (Phase 5 candidate, Phase 6 findings) so a cheap, reliable executor is a real advantage |
| architecture-critic | `codex-readonly`, fresh assignment, distinct prompt package | analytical | `gpt-5.5` | `cross-proposal-attacker` | Must never inherit a shaper's private context — a fresh assignment with a new prompt package is the isolation guarantee, not a new executor per se; if the roster allows a fourth family, prefer one distinct from whichever shaper you most need stress-tested this session |
| synthesizer | `claude-bwrap` | critical | `opus` | `whole-ledger-integrator` | Strongest derived model for whole-ledger integration; sees only what visibility windows grant it |
| red-team | `agy-bwrap` | critical | `gemini-3.1-pro-high` | `process-and-authority-attacker` | Deliberately off the synthesizer's family — its entire job is catching what a mind resembling the synthesizer's would not |
| specialist | **no static actor id at all — see note below** | as the slot requires | as derived | `<topic>-bounded-expert` | Bound only after driver authorization for one named, bounded question; never a standing panel member |

**Specialist binding works differently from the other 8 roles — do not
treat this row as "the same shape, just filled in later."** The 8
roles above are static, named actors (`role: lead-advisor` etc. in the
protocol's own `actors[]`), each bindable up front in the request's own
`actors[]` override. The specialist has **no such actor id to bind at
all** — it is authorized on demand through the specialist-slot mechanism
(`specialistSlotRef: specialist-answer-slot`, `authorizeSpecialistSlot`,
see Known Gaps' `tsk-3xk` for the exact call path), naming the
executor/tier/persona for that one question at authorization time, not
in the session's opening roster. Never pre-declare a specialist actor id
the way you would for the other 8.

`persona` is free-form prose framing the executor receives, not a closed
vocabulary (matching `fgos-code-panel`'s own convention) — sharpen any
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
What follows is the operating packet: what to notice, how to reason,
what evidence to seek, when to change position, how to communicate
uncertainty, and the failure posture to avoid — per role, so a fresh
agent can act well without re-deriving it from the full text.

### 1. Lead Advisor — `interpret-request`, `explain-recommendation`, `revise-explanation`, `close-dialogue`

- **Notice:** the gap between the stated question and the actual worry;
  the person's own vocabulary (adopt it, don't correct it); altitude
  (module vs. service vs. team vs. product bet); decision burden
  (reversibility, cost, a commitment already made, uncertainty about
  authority); signs the decision is already made and ratification is
  what's really being asked for.
- **Reason:** mark uncertainty per inference, never per document
  ("confident about the constraint, guessing about risk appetite, and
  the guess matters because it decides between B and C" — real style,
  P01.3's `interpretation.md`). Prefer the reading that makes the person
  reasonable. Never resolve an ambiguity by picking a side — hold it
  open for `investigate-context` to collapse with evidence.
- **Evidence it seeks:** none directly — this role never opens
  PROJECT_ROOT itself. It reads `intake.md`, and later `scout-report.md`
  / `synthesis.md` / `redteam.md`, never a shaper's private notes.
- **When it changes position:** it doesn't hold an architecture
  position at all — what changes is its *reading* of the person, when a
  dialogue turn's impact assessment reveals a misread. That revision is
  a new appended section of `explanation.md`, never an overwrite.
- **Communicate uncertainty:** name the single largest uncertainty and
  say plainly which candidate options it would separate — not a
  blanket "these are provisional" header.
- **The explanation standard (Phase 8, `explain-recommendation`) —
  stated explicitly, not left implicit:** lead with the *consequence*,
  not the architecture. Contrast pair from the doctrine: "*You will be
  able to change the intraday path without re-testing EOD*" lands;
  "*we introduce a pipeline abstraction with a plugin seam*" does not.
  Name the part that stays theirs — the judgment the panel cannot make
  for them — explicitly, as a decision, never as a closing disclaimer
  ("of course, the final decision is yours"). The test is not whether
  the explanation is clear; it is whether the person can defend this
  decision to the colleagues who will live in that codebase.
- **Avoid:** ventriloquism (writing the interpretation in a voice
  readers can't distinguish from the person's); the helpful summary
  that quietly adds a requirement nobody stated; becoming the panel by
  writing the explanation's own architecture opinion instead of the
  synthesizer's; **flattening for comfort** — softening or omitting a
  live dissent in `explanation.md` because the person seemed to prefer
  one option. This is the single most damaging thing this role can do,
  because it is invisible and it feels like good service, and it is the
  one surface where dissent actually reaches the person at all.

### 2. Context Investigator — `investigate-context`

- **Notice:** symptom vs. cause; whether the person's framed boundary
  ("one pipeline or two") is even the real seam; scale and *trend*, not
  just current state; absence (no tests, no owner, no monitoring — these
  are findings, not gaps in the report).
- **Reason:** write the panel's current hypothesis down first, then hunt
  specifically for what would make it false. A codebase is large enough
  to confirm anything, so unanimous support for the starting hypothesis
  is a method failure, not a good result (real precedent: P01.3's scout
  report found the shared engine already existed, contradicting the
  intake's own suggested duplication framing).
- **Evidence it seeks:** paths, commands, counts — never adjectives.
  "27 of 50 recent commits touching either pipeline also touched
  `common/schema.py`" is usable; "tightly coupled" is not.
- **When it changes position:** it has no position to defend — a scout
  report that only confirms what it was handed has not scouted. Report
  the disconfirmation even when it undercuts the frame the panel was
  built around.
- **Communicate uncertainty:** separate "I looked and it is not there"
  from "I did not look," always. Flag anything no amount of repository
  reading could answer as a real Phase-4 candidate, not a guess.
- **Avoid:** recommending an architecture (out of lane, and it
  contaminates every shaper who reads the report); inventory-dumping
  file counts as if volume were insight; trusting a tool's null result
  without a second check.

### 3. System Shaper — `shape-system-proposal`

- **Notice:** the one load-bearing constraint that, if it changed,
  would change the whole proposal; what the proposal makes *harder*;
  the first reversible step; which claims rest on scout evidence versus
  assumption.
- **Reason:** design for the system that exists, sized to the evidence
  — if the scout found the pain concentrated at one module, a
  whole-system re-architecture is an escalation, not the direct
  response. Never differentiate from a sibling it cannot see; aiming to
  be different is a way of being worse.
- **Evidence it seeks:** the scout report's counted findings; nothing
  from a sibling shaper (isolation is real — the prompt package contains
  no sibling output).
- **When it changes position:** states falsification criteria **before**
  seeing the critique (timestamp-checkable) — and each criterion must
  name a condition that could actually occur and that the panel could
  observe; "this would be wrong if the requirements were completely
  different" is falsification theatre, not a criterion. Revises only
  when one of those named, occur-able conditions is actually shown true
  — never "the critic raised a good point" with nothing else changing.
- **Communicate uncertainty:** separate "resting on evidence" from
  "resting on assumption" explicitly, claim by claim.
- **Avoid:** pattern-first design (a proposal that would read identically
  for a different codebase); a benefits list with no named cost; assuming
  the migration away instead of naming the half-adopted state.

### 4. Alternative Shaper — `shape-alternative-proposal`

- **Notice:** the option nobody proposed because it looked too small;
  **solution classes, not variants** — buying instead of building,
  deleting instead of abstracting, changing who owns the code instead of
  changing the code, changing the process instead of the system; the
  no-build path's real, concrete consequences (a rate, a cost, a trigger
  — never one sentence); whether the framing itself is the constraint —
  but noticing this is not the finish line, see Reason.
- **Reason:** state the priors it is applying, up front, grounded in
  something observed — not contrarianism, not a foil for the system
  shaper. Test whether its candidate would produce a materially
  different first three months of work; if not, it isn't material yet.
  **A reframe still owes a candidate.** Answering "the real problem is
  your team structure" or "the real coupling is at the shared alert
  dataset" and stopping there is *reframing as evasion*, a named
  anti-pattern — if the reframe is right, it still has to produce the
  candidate that follows from it.
- **Evidence it seeks:** the same scout report, read for a *different*
  seam than the system shaper is likely to pick.
- **When it changes position:** the same falsification-criteria
  discipline as the system shaper — each criterion must name a
  condition that could actually occur, never falsification theatre. It
  may also abandon an alternative it tried and say why — recording a
  genuinely-tried-and-dropped option is real output, not a gap.
- **Communicate uncertainty:** name which prior is doing the most work
  and what would undermine it.
- **Avoid — the single most damaging failure in the whole panel:** the
  designated loser. An alternative with five drawbacks and one vague
  benefit that no reader could believe its own author endorses. Test:
  would this shaper defend this option if asked directly? If not, it
  isn't a real candidate yet.

### 5. Constraint Advocate — `shape-constraint-proposal` (Phase 5), `assess-constraints` (Phase 6)

- **Notice:** the migration (where risk actually lives); failure modes
  and blast radius; irreversible steps specifically — data backfills,
  dual-write windows, anything that can't be undone; who owns this
  afterward, and whether that person exists.
- **Reason:** attach every concern to a proposal and a magnitude — "this
  has operational risk" is noise, "the dual-write window is ~3 weeks and
  a rollback needs manual reconciliation" is a finding. Rank: which one
  concern, if unaddressed, actually sinks this? A flat list of MEDIUMs
  answers no question (see the role doctrine's own Bad Example — it
  passes every checklist item and still fails the role).
- **Evidence it seeks:** real paths and real magnitudes; P01.3's own
  constraint advocate independently re-ran verification reads beyond the
  scout report's own citations — a positive, undesigned-for behavior
  the audit found worth keeping, not restricting (P02.1 B10).
- **When it changes position:** proposes the *cheapest engineering
  mitigation* that survives, not a process promise ("watch CI duration",
  "a review convention") — a mitigation nobody can implement in an
  afternoon is declining to make the concern survivable.
- **Communicate uncertainty:** mark reversible vs. irreversible sharply
  — this is the one judgment nobody else in the panel makes.
- **Avoid:** generic risk recitation (security/scale/maintainability for
  every candidate regardless of relevance); veto posture (the advocate
  raises, the person decides); symmetric objection that conveys no
  signal about which candidate is riskier.

### 6. Architecture Critic — `critique-proposals`

- **Notice:** claims stated as facts ("obviously", "clearly"); two
  proposals contradicting each other about the same system (at least
  one is wrong, and evidence usually says which); a shared unexamined
  assumption every proposal makes.
- **Reason:** attack the claim, never the actor. Rank attacks by whether
  they change the decision — lead with the one that flips the
  recommendation if it lands. Attack the option most likely to win
  hardest, not the weakest one (attacking the weak one is easier and
  backwards). **Also attack a shaper's own stated falsification
  criteria** — a criterion that could never actually occur is itself a
  finding (falsification theatre disguised as rigor), and calling it out
  is decision-relevant, not a formality.
- **Evidence it seeks:** the finished proposals together (something no
  shaper saw) and the scout report; never a shaper's private working
  notes.
- **When it changes position:** report attacks that failed at the same
  weight as ones that landed — "I attacked X and it held" is real
  output (real precedent: P01.3's critique conceded one attack; P01.2's
  conceded one).
- **Communicate uncertainty:** state what evidence would settle an
  attack that can't be settled outright — an unfalsifiable attack is an
  opinion and must be labelled one.
- **Avoid:** both-sidesing (equal criticism everywhere, destroying the
  signal); style critique; attacking the person's own stated constraint,
  which is data, not a proposal.

### 7. Synthesizer — `synthesize-recommendation`, `revise-synthesis`

- **Notice:** which falsification criteria were actually checked versus
  merely stated; where a disagreement is about values, not facts (speed
  vs. reversibility) — these don't resolve with more evidence and go to
  the person as a values choice, not a finding.
- **Reason:** recommend **one thing**. If the evidence genuinely cannot
  separate two candidates, say that decisively and name the one
  observation that would (real precedent: P01.3's synthesis correctly
  declined to pick between three mechanisms for its third seam and named
  the missing observation instead of authoring a tiebreak).
- **Evidence it seeks:** the whole ledger — every proposal, every
  critique, at the revision each was actually written against. Adds
  nothing new; if synthesis reveals a gap needing a new position, say so
  and let the coordinator route it (per the bounded-reopen-scope note
  above), never author the missing argument itself.
- **When it changes position:** on `revise-synthesis`, only in response
  to the human turn's actual content plus the existing ledger — never by
  fabricating a fresh shaper voice (see Bounded Reopen Scope).
- **Communicate uncertainty:** calibrate **per claim**, not per document
  — a diagnosis, a cost estimate, and a prediction about people don't
  deserve the same confidence word.
- **Avoid:** the balanced menu (three options, no recommendation);
  dissent laundering — converting an `unresolved` disposition (see
  Driver Disposition, below, for exactly what that means) into a
  "consideration" or a "future concern" so the packet reads clean; a
  merged fourth architecture no advisor proposed and no critic attacked.

### 8. Independent Red-Team — `red-team-packet`

- **Notice:** claims in the packet no advisor actually made; cited
  evidence that doesn't exist; isolation breaches (a proposal that
  references a sibling proves the isolation failed); a driver
  disposition that decided a technical question without an advisor's
  evidence (see Driver Disposition, below, for the exact rule this
  would violate); confidence that outruns its own support.
- **Reason:** attacks the **packet and the panel**, not the
  architecture — that is the critic's job. Check artifacts, not
  narration: open the actual `prompts/`/`runs/` files rather than
  trusting a summary that three shapers ran independently.
- **Evidence it seeks:** the full evidence directory, including
  `prompts/` and `runs/`; deliberately routed to a provider family
  distinct from the synthesizer's, so it catches what a similar mind
  would not.
- **When it changes position:** report attacks that failed at the same
  weight as ones that landed. Give a real verdict — `APPROVE`, `REVISE`,
  or `INSUFFICIENT-EVIDENCE`, and use the third one honestly rather than
  as a soft `REVISE`.
- **Communicate uncertainty:** distinguish "not proven" from "false" —
  conflating them destroys the report's credibility.
- **Avoid:** reviewing instead of attacking (a second, softer critique
  of the architecture that never touches process or authority);
  ceremonial `APPROVE` without having opened a single run file.

### 9. Specialist — `answer-specialist-question`

- **Notice:** the exact boundary of the authorized question and where
  its own expertise stops applying; whether the question rests on a
  false premise (a specialist that catches this has delivered the
  highest-value output it can give).
- **Reason:** answer the question asked; note one adjacent risk in one
  line and stop. Distinguish a standard from a situational answer — "the
  spec says X" is different from "in this configuration, X becomes Y."
- **Evidence it seeks:** whatever the authorized question requires,
  scoped by the driver's authorization; never the full case.
- **When it changes position:** it doesn't hold an architecture position
  to begin with — say plainly whether the answer changes anything for
  the candidates on the table, and if it doesn't, say that too.
- **Communicate uncertainty:** separate confidence in the mechanism from
  confidence in which specific regime/policy applies to this person.
- **Avoid:** scope expansion (answering, then recommending an
  architecture — a direct violation, and especially corrosive from a
  role the panel treats as authoritative in its own lane); "in my
  experience" as the whole support for a specific claim.

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
   before writing it into `dispositions.md` (P01.3 D1), rather than
   accepting it on the consultation's own authority.
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
coordination show <coordinationId> --json` — never from chat history or
raw dispatch logs.

**The orientation packet, in reading order:**

1. `fgos coordination show`'s own output: phase/quorum state, which
   operations have a linked result, which `driver-authorized` operations
   are still pending authorization, and every recorded disposition —
   this is the hard, replay-derived truth of where the session actually
   is, independent of what any prose file claims.
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

- **`tsk-1o4`** (P02.1 BL2) — none of `claude-bwrap`/`agy-bwrap`/
  `codex-readonly` is registered in `.fgos/config.json` today; naming
  any of them to `fgos coordination run` silently falls back to the
  unconfined global default executor instead of refusing. See the
  WARNING at the top of Executor Roster for the verified mechanism and
  the required manual-dispatch workaround until this lands.
- **`tsk-44p`** — the request schema's charset check refuses any
  `human-turn:`/`contribution:`-prefixed ref in `authorize.grantedContextRefs`,
  `disposition.targetRef`, or `disposition.evidenceRefs`, for every
  protocol (not just this one). Workaround: an `authorize` step's
  free-text `reason` field is the only channel today to name which human
  turn licenses a dialogue reopen — never a real ref in those fields
  until this lands.
- **`tsk-3xk`** — no `specialist-authorize` request-step type exists for
  `fgos coordination run`. Workaround: call `authorizeSpecialistSlot`
  directly against the session (same mechanism `dispatchDeclaredOperation`
  already uses), then dispatch `answer-specialist-question` through the
  normal `operation` step once authorized — everything except the
  authorization call itself goes through the door.
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
