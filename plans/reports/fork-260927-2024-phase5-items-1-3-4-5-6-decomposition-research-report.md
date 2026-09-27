# Phase 5 items 1, 3, 4, 5, 6 — decomposition research

Research only, no plan.md/code written. All paths relative to repo root.

## Item 1 — Move per-role packets out of the runtime skill into operation templates

**Current state, precisely bounded (bigger finding than the phase text implies):**
The FlowDefinition `core/coordination-protocols/architecture-advisory-panel-v1.yaml`
already declares `task.contractTemplate` for **every** operation (13 references,
lines 314-451 — Phase 3/I04 wiring is done):
`architecture-advisory-panel-v1-{interpretation, scout-report,
system-proposal, alternative-proposal, constraint-proposal, critique,
constraint-findings, specialist-answer, synthesis (x2), redteam,
explanation (x2), close-dialogue}`.

Only **one** of these 12 unique ids has a real file:
`core/prompt-templates/architecture-advisory-panel-v1-scout-report.md`
(confirmed exists; the other 11 confirmed missing by direct file check).
The resolver therefore falls back to Phase 3's "explicit legacy objective
path during migration" for every operation except `investigate-context`
today. Meanwhile the actual per-role judgment content (what to notice, how
to reason, what evidence to seek, when to change position, how to
communicate uncertainty, what to avoid) lives as ~250 lines of prose in
`core/skills/fgos-architecture-panel/SKILL.md`'s "Per-Role Task Packets"
section (lines 324-594, one `###` subsection per role, 1-9).

**What changes:** author the 11 missing template files, one per operation,
following the existing `scout-report` template's exact shape/placeholder
convention (`{role}`, `{objective}`, `{contextRefs}`, `{expectedOutputs}`,
`{constraints}`, `{evidenceContract}` — see Phase 3's own template-registry
guardrails: "may refine cognitive instructions and artifact shape; cannot
alter graph legality"). Each new template absorbs its role's packet content
from SKILL.md's Per-Role Task Packets section (map: interpretation ->
Lead Advisor/interpret-request; system-proposal -> System Shaper;
alternative-proposal -> Alternative Shaper; constraint-proposal ->
Constraint Advocate (Phase 5 half); critique -> Architecture Critic;
constraint-findings -> Constraint Advocate (Phase 6 half,
`assess-constraints`); specialist-answer -> Specialist; synthesis ->
Synthesizer (also reused for `revise-synthesis`); redteam -> Independent
Red-Team; explanation -> Lead Advisor (also reused for
`revise-explanation`); close-dialogue -> Lead Advisor's close step).

**Files:** Create the 11 `core/prompt-templates/architecture-advisory-panel-v1-*.md`
files. Modify `core/skills/fgos-architecture-panel/SKILL.md` (+ `.claude/skills`,
`.agents/skills`, `plugins/fgOS/skills` mirrors via `npm run build:skills`) to
remove the packet prose once templates carry it, replaced by a short pointer
(matching how Phase 3's I04 unit did this for plan-loop/panel operations
generally). Do NOT touch the FlowDefinition YAML — its `contractTemplate`
refs are already correct.

**Verification:** `test/runner/operation-prompt-templates.test.mjs` (existing,
Phase 3/I04's own suite — extend with a case per new template resolving and
rendering with bounded variables only); `test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`
(existing conformance suite, must stay green — confirms nothing about
legality changed); word-budget/projection checks if SKILL.md shrinks
materially (same pattern as I15/I16's word-count verification).

**Design-record constraint (I couldn't find one specific to this item beyond
the general Phase 3 template guardrails already in plan.md's own Phase 3
section — "Template text cannot grant authority... cannot alter graph
legality").** No item-1-specific decision in the design record's §6-§13
sections. Not ambiguous, just under-specified in the design record (Phase 3's
own text already governs it).

## Item 3 — Replace internal `node -e` pack invocation with a public semantic CLI surface

**Current state, exact:** `core/skills/fgos-group-thinking/SKILL.md` (the
skill `fgos-architecture-panel` explicitly delegates dispatch/resume to,
per its own "Never Reimplements The Kernel" section) instructs the
dispatching agent to author raw inline scripts in THREE places:
- Step 1 (line ~61): `node -e "import('./src/verbs/coordination/group-thinking-pack.mjs').then(({ loadProtocolPack }) => {...})"` — list registered pack members.
- Step 2 (line ~80): `node -e "import('./src/runner/definitions/protocol-loader.mjs').then(({ loadCoordinationProtocol }) => {...})" -- "<id>"` — read a protocol's declared shape.
- Step 4 (line ~129-131): `node -e "import('./src/verbs/coordination/group-thinking-pack.mjs').then(async ({ runGroupThinkingRequest }) => {...})"` — the actual launch/resume dispatch, going through `runGroupThinkingRequest`'s pack-membership gate (NOT the same as plain `fgos coordination run`, which has no pack-membership check at all).

Step 3 (compose a request) and Step 5 (replay) already use real public
doors (`fgos coordination run --file`'s request shape, `fgos coordination
show --json`) — those are NOT part of this item.

**What changes:** add a real CLI verb (or verbs) that wraps
`loadProtocolPack`/`loadCoordinationProtocol`/`runGroupThinkingRequest`
so no dispatching agent (human or LLM) ever authors an inline Node script
to use this gate. Concretely, something like `fgos group-thinking list`
(wraps step 1), `fgos group-thinking show-protocol <id>` (wraps step 2,
or reuse `fgos coordination show`'s definition-inspection path if one
already exists — check before inventing), and `fgos group-thinking run
--protocol <id> --file <path>` / `--resume <coordinationId>` (wraps step
4's actual gate). This is a genuinely new CLI surface (`bin/fgos.mjs`,
`src/cli/command-registry.mjs`), not a thin pass-through — size it
accordingly (closer to I20's `capability match` verb in scope than I16's
prose-only amendment).

**Files:** `bin/fgos.mjs`, `src/cli/command-registry.mjs`,
`src/verbs/coordination/group-thinking-pack.mjs` (read, likely unchanged —
the new verb(s) call its existing exports, per the "never reimplement the
kernel" principle already governing this file), `core/skills/fgos-group-thinking/SKILL.md`
(+ mirrors) to replace its three `node -e` blocks with the new CLI
invocations, `docs/architecture-manifest.json`, `test/test-ownership.mjs`.
Create: a new CLI test file (pattern-match I18/I20's `test/cli/*.test.mjs`).

**Verification:** existing `test/verbs/coordination-group-thinking*.test.mjs`
suites (confirm exact filenames before writing the unit — several exist,
e.g. referenced in plan.md's own I04 verification line:
`test/runner/coordination-group-thinking-rfc-review-lite.test.mjs`,
`test/verbs/coordination-group-thinking-pack.test.mjs`); new CLI tests for
the new verb(s); `node --test test/cli/`.

**Ambiguity to flag, not resolve:** the design record never discusses this
item at all (§6-§13 are entirely about the capability-matching/binding
work). There's no settled decision on the new verb's exact name/shape —
whoever writes this unit's phase file is making a genuinely new naming
call, same class of decision I17-I21's own phase files each had a
design-record citation for. Recommend a brief design note or at minimum an
explicit "Decisions" section in this unit's own phase file before
implementation, not a silent pick.

## Item 4 — Add a real public specialist-authorization composer; eliminate the direct engine escape hatch

**Current state, exact:** `core/skills/fgos-architecture-panel/SKILL.md`'s
own "Never Reimplements The Kernel" section states this outright:
"**Specialist authorization:** `authorizeSpecialistSlot` called directly
(see Known Gaps — no `specialist-authorize` request-step type exists yet,
`tsk-3xk`)." Confirmed: `authorizeSpecialistSlot` is exported from
`src/runner/coordination/session-engine.mjs:1586` and has NO
composer/request-step wrapper anywhere in `src/verbs/coordination/` (the
only non-test caller found is a one-off historical script,
`plans/260911-2305-runtime-recovery/architecture-panel/requests/authorize-and-dispatch-specialist.mjs`
— not live runtime code). Every OTHER kernel action in this codebase
(operation, authorize-and-dispatch, disposition, contribution, human-turn,
close) has a real composer in `src/verbs/coordination/composers.mjs` and a
request-step type validated in `src/verbs/coordination/schema.mjs`. This
one doesn't.

**What changes:** add a `specialist-authorize` request-step type (schema.mjs
validation, following the exact pattern of the existing step types — check
`ACTOR_ALLOWED_KEYS`/`authorize`/`human-turn` step shapes as the template),
a composer function in composers.mjs that calls
`authorizeSpecialistSlot` the same way every other composer calls its own
session-engine function (never bypassing `run.mjs`'s request-dispatch
path), and wire it into `run.mjs`'s request-kind switch. Update
`fgos-architecture-panel/SKILL.md`'s "Never Reimplements The Kernel"
section to name the new door instead of "called directly", and retire
`tsk-3xk` from Known Gaps.

**Files:** `src/verbs/coordination/schema.mjs`, `src/verbs/coordination/composers.mjs`,
`src/verbs/coordination/run.mjs` (the request-kind dispatch switch — NOT
touching `session-engine.mjs`'s `authorizeSpecialistSlot` itself, which
stays the actual authority function every door already funnels through),
`core/skills/fgos-architecture-panel/SKILL.md` (+ mirrors).

**Verification:** `test/runner/coordination-specialist-binding.test.mjs`
(existing, GitNexus confirms it already calls `authorizeSpecialistSlot`
directly in its own test setup — will need updating/extending to exercise
the new request-step path instead of/alongside the direct call);
`test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`.

**Design-record citation:** none specific — this is purely a "close the one
remaining engine escape hatch" item, consistent with the general
"Never Reimplements The Kernel" principle the skill file itself already
states as a hard rule, not a new design decision. Low ambiguity.

## Item 5 — Make human-turn and bounded-reopen actions appear in the typed action view

**Current state — this item is LARGELY ALREADY DONE; the real remaining gap
is narrower than the phase text implies, and directly coupled to item 4:**

Read `src/runner/coordination/actions-projector.mjs`'s
`projectCoordinationActions` in full (519 lines). It already emits:
- `record-human-turn` (kind 5, lines 439-446) — unconditionally available
  for any active session, matching `validateHumanTurnStep`'s schema
  exactly. **Human-turn actions already appear in the typed action view.**
- `dispatch-operation`/`fan-out` (kind 1, lines ~160-286) and
  `authorize-and-dispatch` (kind 2, line ~296) — both iterate ALL of a
  protocol's declared graph operations generically (via
  `definition?.spec?.graph?.nodes`), with no special-casing by operation
  name. Since `revise-synthesis`/`revise-explanation`/`close-dialogue`
  (the "bounded reopen" operations) are just ordinary declared operations
  in `architecture-advisory-panel-v1.yaml`'s `phase-dialogue-reopen` node,
  **they almost certainly already appear as ordinary `authorize-and-dispatch`
  actions once their governing window opens** — this needs direct
  confirmation via a live/test probe (I did not run one; time-boxed this
  research), but nothing in the code specially excludes them.

**What's actually missing:** a `specialist`-kind action (Phase 1's own
required Cases list, from plan.md's Phase 1 section, names "specialist
slot available/unauthorized/exhausted" as a case the typed action view
must distinguish) — there is no `specialist`/`authorize-specialist` kind
anywhere in `actions-projector.mjs` today. This is because there's no
public specialist-authorize door yet (item 4). **Recommend folding item 5
into item 4's own unit** rather than a separate one: implementing item 4's
composer naturally requires deciding what the action view should show for
"a specialist slot exists in this protocol and is/isn't authorized yet",
and doing that as two separate units risks one being built against a
projector shape the other changes.

**If the reopen-actions-already-appear assumption above turns out wrong**
when someone actually probes it, that reopens item 5 as a real, separate
gap — flag this as the one thing this research could not fully close out
without running code, unlike everything else in this report.

## Item 6 — Keep architecture judgment/turn classification/disposition authority in Lead/role packets, not the action projector

**Recommendation, not a finding:** treat as an INVARIANT/test-requirement
on whichever unit touches `actions-projector.mjs` (item 4/5's unit), not a
standalone unit. Concretely: item 4/5's unit should add a regression test
asserting the projector's `specialist`-kind action (and anything else it
emits) carries only mechanical legality data (is a slot authorizable, is
it authorized, is it exhausted) — never a judgment field like "should this
specialist be authorized" or "what should the driver disposition this
finding as". This matches the file's own existing character: every action
kind already emitted (`dispatch-operation`, `authorize-and-dispatch`,
`link-contribution`, `record-human-turn`, `close`) is purely mechanical
legality, consistent with Phase 1's own locked contract ("describes legal
choices but never chooses one"). No code changes of its own; it's a
confirm-and-test item, cheapest folded into item 4/5's own unit's
verification section rather than given its own capability/depends-on/Files
block.

## Summary table for unit-block drafting

| Item | Size | Depends on | Real new files | Risk |
|---|---|---|---|---|
| 1 | Medium (11 template files + SKILL.md trim) | none (I04 already wired) | 11 new `.md`, SKILL.md edit | Low — content migration, no new mechanism |
| 3 | Medium-large (new CLI verb(s)) | none | new CLI verb, new test file | Medium — genuinely new surface, naming undecided |
| 4 | Small-medium (one new request-step + composer) | none | none (extends existing files) | Low-medium — kernel-adjacent (schema.mjs/run.mjs) like I21 |
| 5 | Small, mostly verification | item 4 (recommend same unit) | none | Low, once folded into item 4 |
| 6 | Not a unit — a test/invariant inside item 4/5's unit | item 4/5 | none | N/A |

## Unresolved questions

1. Item 5's "bounded-reopen actions already appear generically" claim is
   read from code structure, not confirmed by running a live probe against
   a real `phase-dialogue-reopen` session — worth a 5-minute check before
   locking the unit's scope down to "specialist-kind action only".
2. Item 3's new CLI verb naming/shape has no design-record precedent —
   needs an explicit decision recorded somewhere before implementation,
   the same way I17-I21 each had one.
3. Items 7 and 8 (deliberately excluded from this research) still need
   their own pass once I20's `capability match` and I17's fragment are
   confirmed ready to consume — not covered here.
