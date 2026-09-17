---
name: fgos-code-panel
user-invocable: false
description: >-
  Get a single code change implemented or drive a plan-driven coding track with
  independent review + red-team through the real `fgos coordination` CLI doors.
  Self-contained: dispatches through the same hardened CoordinationSession engine
  and `standalone-master-coordination-loop` protocol `fgos-plan-loop` uses (real
  mutation-gating, real quorum close), with its own coding-flavored doer/reviewer/
  red-team persona roster. Two modes: direct-single-cell (default, concrete code
  changes without a plan target) and planned-multi-cell (when a plan/phase file or
  track is the execution target, delegating multi-cell orchestration to
  `fgos-plan-loop` by reference). Examples: "implement this fix and get it
  reviewed+red-teamed", "run a code panel on this change", "run plans/260915-foo/plan.md",
  "resume track plans/260915-foo/plan.md". Do not use for advisory coding decisions;
  those route through fgos-panel without mutation.
---

# fgos-code-panel

Despite the short name, this is a mutating implementation workflow. A request
for a "coding panel" does not select it unless the person explicitly asks to
implement/change/fix code. Advisory coding design and architecture choices
start at `core/skills/fgos-panel/SKILL.md`, which routes without granting
mutation authority.

Dispatches through the exact same CoordinationSession engine
(`src/runner/coordination/session-engine.mjs`), request schema
(`src/verbs/coordination/schema.mjs`), and
`core/coordination-protocols/standalone-master-coordination-loop.yaml`
FlowDefinition that `fgos-plan-loop` uses -- not a copy, the same code
path. This is a real, necessary dependency, not a documentation
convenience: that engine is what already earned its hardening (real
mutation-gating against a forged-stamp attack and a ticket-reuse attack,
real quorum-close, real resumability from a persisted event log alone) --
forking it would mean re-earning all of that from zero for no reason.
Everything else below is this skill's own: its own Non-Goals in its own
words, its own actor roster, its own worked request examples. Nothing
here requires opening `fgos-plan-loop` to understand or use.

## Non-Goals

- **No fgOS Work items, ever.** Never `fgos pick/cook/submit`, claims, or
  a fgos-runner loop to drive a code-panel cell. Enforced at the schema
  boundary independently of this skill's own discipline: any field
  carrying Work-lifecycle authority (`approve`, `merge`, `claim`,
  `workStatus`, `missionId`) is rejected before it reaches the session
  engine (`WORK_LIFECYCLE_KEYS`/`assertNoWorkLifecycleKeys`,
  `schema.mjs:46-50,98-114`). This skill never reads or writes an item's
  `stage` and never claims anything through the pull door -- deliberately
  NOT a member of the `fgos-coding-*` stage-routed family
  (`fgos-coding-discovering/planning/validating/...`) even though both
  live in this same repo.
- **No git merge authority inside the session.** A `produce-candidate`/
  `revise-candidate` step may commit its own work on the cell's own
  worktree branch (the default executor already permits `git add`/`git
  commit` there) -- but only the Lead merges that branch into the target
  branch, by hand, outside any coordination request, **after** the cell
  closes (section 4): the target branch must never receive this cell's
  code before the close gate actually passed.
- **No design-doc ceremony.** `objective` names the exact file(s)/
  behavior to change directly, in plain text -- not a pointer to a
  separate design document. A change big enough to need its own design
  discussion before implementation should be shaped into a plan first.
- **No second orchestration implementation.** This skill never executes
  multi-cell track orchestration logic (auditing track-level preconditions,
  looping across multiple cells with `chain.mjs`, or sequencing cell
  transitions). When a request has a plan/phase path as its execution target,
  this skill selects planned-multi-cell mode, hands off to `fgos-plan-loop`
  by reference with the target and coding test-policy overlay, and stops.
  All multi-cell progression belongs exclusively to `fgos-plan-loop`.

## Two execution modes: direct-single-cell vs planned-multi-cell

`fgos-code-panel` serves as the front facade door for implementation work
requiring independent review and red-team (while `fgos-plan-loop` remains
directly invocable for track coordination per R4), operating in one of two modes:

1. **direct-single-cell** (R1, default): For concrete, single-change coding
   requests without a plan execution target. Retains the existing single-cell
   workflow (sections 0 through 4 below) byte-behavior-identical to today:
   direct CoordinationSession CLI doors, coding personas, mutation gating,
   and quorum close.
2. **planned-multi-cell** (R2): When a plan or phase path IS the execution
   target (bare plan or phase path, or an explicit imperative run/resume/execute instruction
   directed AT the plan/track). Hands off track execution to `fgos-plan-loop`
   by reference, applying the coding test-policy overlay, and stops.

### Mode-selection rules

- **Imperative instruction required (M1):** Planned mode strictly requires an
  imperative, unconditional instruction directed AT the plan or track. Questions
  (e.g. *"should I run plans/X/plan.md now?"*, *"should we run plans/X/plan.md"*),
  conditionals (e.g. *"if we finish early, run plans/X/plan.md"*), or past-tense
  descriptions (e.g. *"I ran plans/X/plan.md yesterday"*) directed at running the
  plan do NOT trigger planned mode. Genuinely unresolved or ambiguous intent must
  be refused or prompted for clarification, never silently guessed. Ordinary direct
  requests containing past-tense narration or conditional implementation logic
  stay `direct-single-cell`.
- **Passing citation stays direct:** A request merely citing a plan path in
  passing (e.g. *"fix the bug described in plans/X/plan.md"*) without an
  execution-target verb directed at the plan stays `direct-single-cell`.
- **Plan file as edit target stays direct (A1):** Citing a plan file as the edit
  target (e.g. *"fix the typo in plans/X/plan.md"*) stays `direct-single-cell`.
- **Verb directed at another object stays direct (A2):** Requests where the
  verb's object is something else (e.g. *"run the focused tests listed in
  plans/X/phase-01.md against src/x.mjs"* or *"resume my work on src/auth.mjs,
  context in plans/X/plan.md"*) stay `direct-single-cell`. Planned mode requires
  the verb to be directed AT the plan/phase artifact itself.
- **Negation honored (CE2):** Negation must be accounted for before matching any
  verb. A request like *"don't run plans/X/plan.md yet, just fix src/foo.mjs"*
  stays `direct-single-cell` with target `src/foo.mjs`. If negation on a plan or
  track is detected without an affirmative alternative target, it is refused for
  clarification, never defaulting to a fabricated target.
- **Non-execution / inspection verbs stay direct (CE4):** A plan or phase path
  with an inspection verb (e.g. *"review plans/X/plan.md"*, *"explain
  plans/X/plan.md"*, *"summarize plans/X/plan.md"*) and no run/resume/execute
  verb directed at the plan stays `direct-single-cell`. When an explicit
  run/resume/execute verb is directed at a plan, it takes precedence over
  secondary inspection phrases (e.g. *"run plans/X/plan.md and read docs/notes.md first"*
  triggers `planned-multi-cell`).
- **Explicit run/resume/execute at plan (planned mode):** Requests where the
  plan or phase path is the execution target (e.g. bare path
  `"plans/260915-foo/plan.md"` or `"plans/260915-foo/phase-02-foo.md"` (including with
  `./plans/` prefix), *"run this implementation plan: plans/260915-foo/plan.md"*,
  *"run plans/260915-foo/plan.md"*, *"resume track plans/260915-foo/plan.md"*) trigger
  `planned-multi-cell`.
- **Track referenced by name without path (CE1):** A track referenced by name
  with an explicit run/resume/open verb (e.g. *"resume the dispatch-operability-implementation
  track"*, *"open the next cell for code-panel-multicell-facade"*) triggers
  `planned-multi-cell`. Resolves to `plans/<name>/plan.md` or by scanning
  `plans/*/plan.md` for a unique exact match against the file's own
  `Track:`/`Execution track:` header, or by matching a live registered coordination
  session with cells (`fgos coordination chain <name>`). Substring or partial
  matches (e.g. 'facade', 'policy') and bare track names with no unique resolvable
  plan or live session are refused for clarification rather than guessed.
- **Plans outside plans/ (CE5):** An explicit run/resume/execute instruction
  naming any `plan.md` or `phase-NN-*.md`-shaped file outside `plans/` (e.g.
  *"run this plan: docs/platform/packaging-distribution/code-panel-rollout-plan.md"*)
  triggers `planned-multi-cell`. Only bare unqualified paths require the `plans/`
  prefix.
- **Phase path target interaction with chain (CE3):** When a request names a
  specific phase path as execution target (e.g. *"run phase-03 of plans/X"*),
  derive the track and verify against chain's next unmerged cell; refuse (never
  silently override or drop) if the named phase mismatches what chain would open
  next.
- **Direct requests with commands stay direct:** Requests combining code edits
  with run commands (e.g. *"fix the flaky retry in src/runner/retry.mjs and run npm test"*,
  *"add null-check in src/auth.mjs and run the linter"*) are direct code changes,
  stay `direct-single-cell`, and inside an active cell are accepted as cell-internal work.

### Recursive-dispatch guard (R2)

If `fgos-code-panel` is invoked from within an active plan-loop cell dispatch
(detected via `coordinationId` or `workRef` matching plan-loop cell shape
`<track>--<cell-id>` such as `<track>--cell-01` or `<track>--i05`,
`options.inPlanLoop: true`, or active worktree branch), `fgos-code-panel`
MUST NOT re-enter `planned-multi-cell` mode or open a nested track. It routes
to `direct-single-cell` mode for cell-internal implementation, or refuses
recursion if asked to open an inner track. (Note: `FGOS_COORDINATION_ID` is a
documented invariant; currently no runtime producer in the repo sets this
environment variable).

## Planned-multi-cell mode: delegation to fgos-plan-loop

When `planned-multi-cell` mode is selected:
1. Materialize the 3-tier coding test-policy overlay (`FOCUSED_TESTS`,
   `AFFECTED_TESTS`, `FULL_TEST`, `FULL_TRIGGERS`) as data attached to each
   coding cell's own dispatch objective. `fgos-code-panel` composes this overlay
   from phase text + repo evidence (GitNexus impact when available,
   touched-contract detection, existing test ownership) BEFORE handing the
   request to `fgos-plan-loop`; `fgos-plan-loop` receives only the
   already-composed objective/evidence text, never a new schema field.
2. Delegate track execution to `fgos-plan-loop` by reference, passing the target
   `planPath` (or resolved track) and coding test-policy overlay.
3. **STOP.** `fgos-code-panel` does NOT execute multi-cell loop orchestration
   (no auditing of track preconditions, no chain iteration loop, no
   cell-transition sequencing, no multi-cell step procedures). All multi-cell
   progression belongs exclusively to `fgos-plan-loop`.

### Fresh-session resume contract

Planned-mode resume must be reconstructable from durable state alone. A new
session with no chat history may use the user's request, the resolved plan path,
the plan's cell-status table, `.fgos/coordination/sessions/**`, and Git evidence
only. It must not rely on a previous assistant's narration.

Before handing off to `fgos-plan-loop`, classify the durable state as one of:

- **active cell** -- an existing coordination session for the current/next cell
  is active or has an authorized fix/recheck round. Delegate a resume of that
  same cell. Do not open a new cell.
- **terminal cell not integrated** -- the cell's coordination session is
  completed/closed but the plan row or Git merge evidence does not yet show the
  cell integrated into the track. Delegate close/integration follow-through for
  that cell, not the following phase.
- **merged cell with stale session evidence** -- Git/plan evidence says the cell
  landed, but the session log is stale or not terminal. Delegate reconciliation
  through `fgos-plan-loop`/coordination recovery; never hand-edit JSONL/state to
  make the row look closed.
- **no open cell** -- only then select the lowest unmerged phase as the next
  cell.
- **completed track** -- all phase rows are merged/closed; report complete and
  do not open a new session.

Legacy plans remain valid. If a plan or phase file has no explicit test-policy
metadata, compose the coding overlay from the phase's `## Verification` block,
repo evidence, and the mechanical `FULL_TRIGGERS` above. Missing metadata is not
a migration gate.

## Verify the doer's real outcome yourself

`src/verbs/coordination/run.mjs` forwards a step's own `mutation: "mutating"`
into `dispatchDeclaredOperation` (landed in commit `da078125`, the
`tsk-371` fix), so a `produce-candidate`/`revise-candidate` step whose
commit lands is graded on its real result -- the old "correct commit still
comes back `status: "failed"`" behaviour is gone. What stays true: the
RunResult is the worker's own claim. After a produce/revise step reports,
check `git log`/`git diff` in the cell's own worktree for the expected
commit and run this cell's own declared `FOCUSED_TESTS` (see "Proof tiers"
below) there before you record any disposition -- never a bare "the real
test command", which a doer/fixer reads as license to default to the full
suite out of caution.

## Proof tiers: focused / affected / full

Applies the same worker-side discipline
`domains/coding/instructions/verification-discipline.md` states in general
("a coding worker runs the verification its unit declares... the full test
suite belongs to declared gates... never every implement or fix round") to
a single code-panel cell specifically, split into three tiers instead of
plan-loop's two, because most code-panel changes are small enough that even
"targeted" was ambiguous -- **this is the actual performance fix**: most
cells never need more than the first tier, and the full suite never
re-runs against a `(tree, environment)` state it already certified --
usually once per cell, never once per round.

- **focused** -- the direct test(s) for the exact module/symbol/behavior
  changed. Doer and fixer run this by default, every round (R2: doer/fixer run
  focused first always).
- **affected** -- tests covering the consumers/processes in the diff's
  blast radius. Use the impact-analysis capability when this project has
  one registered and present (`fgos tool query --capability impact-analysis
  --status present`; this repo has GitNexus `impact({target, direction:
  "upstream"})` registered and present as of this track -- run it, don't
  assume) to name the real callers/processes; fall back to the Lead's own
  `git grep`/call-graph reading when no such capability is registered or
  present. Escalate to this tier when the diff's blast radius is not
  obviously contained to the changed file(s) -- a real judgment call, made
  once, before dispatching `open.json`. Affected scope escalation is a Lead/prose
  judgment call based on GitNexus impact + touched contracts, not automatic.
  **Who runs it:** this is not a separate dispatched step -- when the Lead
  escalates to this tier, the SAME doer/fixer round's objective names
  `AFFECTED_TESTS` instead of `FOCUSED_TESTS` for that round; there is no
  round where nobody runs it.
- **full** -- the whole project test command. Runs **at most once per
  distinct (tree, environment) state per cell**, right before merge or when
  a declared FULL_TRIGGERS fires, never mechanically after every round (R5).

### Test-selection block -- declared once, before `open.json`

Write this into the Lead's own working notes (there is no dedicated
request-schema field for it, same as a plan-loop phase file's own
`## Verification` block) and **inline the actual command into every
produce/revise/recheck objective that needs it** -- a headless dispatch
only ever sees its own objective string, never the Lead's private notes,
so naming `FOCUSED_TESTS` without also writing the real command reaches
the worker as an undefined token, not an instruction:

```text
FOCUSED_TESTS: <exact command(s) exercising the changed module/symbol/behavior>
AFFECTED_TESTS: <exact command(s) covering the diff's blast radius, from
  impact-analysis when present, or "same as FOCUSED_TESTS" when the Lead
  judges blast radius contained>
FULL_TEST: <the project's whole test command>
FULL_TRIGGERS (mechanical -- diff-path facts, fire regardless of what was
  declared): dispatch/self-host hooks; session/replay/schema core; shared
  invariants; migrations; test-harness foundations; package manifest/
  install/release-boundary scripts (the exact categories
  `docs/how-to/author-a-plan-loop-track.md`'s Mechanical-gate rule names,
  so the two stay in lockstep); blast radius HIGH/CRITICAL per
  impact-analysis when present.
DECISION: focused: <cmd>; affected: <cmd | same-as-focused>; full: <deferred-to-final-gate | triggered (<category>) | required (<reason>)>
```

A reviewer/red-team finding that the declared tier misses a changed
contract is **not** a `FULL_TRIGGERS` entry -- unlike the diff-path facts
above, it is a judgment call the Lead dispositions like any other finding
(accept and re-dispatch at the named tier, or reject with an evidence-
backed rationale; see "Reviewer/red-team judge proof sufficiency" below).
Reviewer and red-team evaluate the test-selection block **together with
the patch** -- a selection that obviously misses the changed contract is
itself such a finding, not something they route around by quietly running
something wider on their own.

### Explicit test decision required for every cell (R6)

A model that silently omits deciding is itself a bug: every coding cell must
record an explicit test decision attached to its dispatch objective and close
rationale, including an explicit declaration when full-suite testing is deferred:

- `focused`: `<exact command>`
- `affected`: `<exact command>` or `"same-as-focused (<contained blast radius rationale>)"`
- `full`: `"deferred-to-final-gate (<rationale>)"` | `"triggered (<category>) (<command>)"` | `"required (<reason>)"`
- `full_triggers`: evaluated categories or `"none"`

Silent omission of any of these determinations is prohibited; a dispatch or
disposition without an explicit decision record is invalid.

### Full suite: never twice for the same (tree, environment) state, never mechanically per round

The target is not a KPI of "≤1 full run" to hit for its own sake -- that
framing tempts a Lead to skip a rerun a real production-tree change
actually needs, just to keep the count low. The real rule: never re-run
`FULL_TEST` against a `(tree, environment)` state it already certified;
always re-run it when either one changed. For most single, small code-panel
changes that resolves to once, near merge -- but "once" is the common
case, not the contract.

- Doer runs `FOCUSED_TESTS`. A fix round runs `FOCUSED_TESTS` again for the
  changed region plus a regression test for the specific finding being
  fixed -- never the full focused set re-run mechanically past what that
  round's diff actually touched.
- `reviewer-recheck`/`red-team-recheck` **read the fixer's own evidence
  (commit, real test output) by default; they do not re-run the same
  command.** Only re-run when the evidence itself is in doubt, or a
  genuinely new attack needs falsifying with fresh output of its own.
- The Lead runs `FULL_TEST` for the pre-merge `(tree, environment)` state
  right before merge -- not after every round. `FULL_TRIGGERS` firing
  early (mechanically, regardless of what was declared) is the one thing
  that moves it earlier. Skipping it entirely is legal only when nothing
  in `FULL_TRIGGERS` fired and `AFFECTED_TESTS` convincingly covers the
  blast radius -- a real policy choice the Lead states in the close
  rationale, not a silent default. The post-merge check (section 4) may
  add a second, genuinely distinct `(tree, environment)` state that also
  needs it -- that is not a violation of "never twice for the same state,"
  because it is not the same state.
- `FULL_TEST` already ran clean at some commit X: a later fix that touches
  only docs/metadata (no production tree or test-harness change) does not
  need it re-run. A fix that touches the production tree or test harness
  after X does.

### Proof reuse by tree identity, not raw commit SHA

A `--no-ff` merge with no conflicts always produces a merge commit distinct
from the cell tip, even when nothing else changed -- comparing raw commit
SHA for "did anything change" produces wasted, wrong re-runs. Reuse a proof
result instead of re-running under this key:

```text
proof key = (command, git rev-parse <ref>^{tree}, environment fingerprint)
environment fingerprint (minimum) = runtime/toolchain version(s)
  + lockfile hash + any built prerequisite this command depends on
  (e.g. a compiled binary's own version/build identity)
```

Compute it with something as simple as this repo's own shape (adjust the
toolchain/lockfile/prerequisite lines to what the target project actually
has):

```sh
node --version; sha256sum package-lock.json; <toolchain> --version   # e.g. cargo --version if the command exercises compiled output
```

Record the resulting string (or its hash) alongside the proof key -- two
runs with an identical tree but no recorded fingerprint for either one
cannot be compared, so this is not optional when claiming reuse.

If the merge commit's tree hash equals the cell tip's tree hash **and** the
environment fingerprint is unchanged, the cell-tip proof certifies the
merge commit directly -- record both shas and the shared tree hash, never
re-run "to be sure." A tree-hash match under a *different* fingerprint
(toolchain upgraded, lockfile changed, a prerequisite got rebuilt) does not
qualify -- re-run for real; there is no shortcut for actual environment
drift.

### Reviewer/red-team inspect proof by default, judge proof sufficiency (R3)

Reviewer and red-team default to INSPECTING existing proof: they read the
recorded command, Git tree hash, and environment fingerprint from the
preceding worker's result. They do NOT re-run the same command unless:
1. Proof is stale (the Git tree hash or environment fingerprint has changed,
   or an intervening patch invalidated the proof's scope);
2. Proof is insufficient (the declared command does not actually exercise
   the contract this diff changes);
3. A specific counterexample or attack finding is discovered that requires
   fresh test output to demonstrate/falsify.

If the declared tier's command does not actually exercise a contract this
diff changes, that is a finding (HIGH on a public or shared contract)
naming the missing coverage or the tier that should have run -- they
cannot run or request a wider tier themselves; the Lead decides on the
finding (accept and re-dispatch at the named tier, or reject with an
evidence-backed rationale).

### Record it, so the policy's own effect is measurable

**The record is the sequence of ordinary, tracked commits and their own
messages -- not a new file, not a `git note`, and not the coordination
session's own directory.** Three were tried and rejected: a `docs/`-tree
directory keyed by "code-panel" (as if it were one track) would conflate
every unrelated one-off change ever run through this skill into a single
shared, ever-growing directory -- exactly the "no `index.md`, no track
directory" line this skill's own closing sentence already rejects (bottom
of this file). The coordination session's own directory
(`.fgos/coordination/sessions/code-panel--<change-slug>/`) is `.gitignore`d
(`.gitignore:25`) -- local, ephemeral, agent-execution state, not a
repository record; a routine `git clean -fdX` deletes it with zero trace
left in the repo. A `git note` looked committed (it lives in the object
store) but is not durable at the project level: `refs/notes/*` sits
outside the default commit graph, does not push/fetch by default, and a
fresh clone never sees it without extra configuration this repo does not
carry.

An ordinary commit has none of those problems: default commit graph,
pushed/fetched like any other commit, visible in plain `git log`, no
schema/engine change, no push/fetch policy to register. `close.json`'s
rationale records the cell's own pre-merge proof (tier/command/duration/
executed-or-reused for each test run); the post-merge verification
commit (section 4) records the merge's own outcome. Between the two,
every fact this section used to ask a `git note` to carry is covered by
a real commit somewhere in the cell's own history.

To compare "full-suite runs per change" or wall time across many real
cells, `git log --all --grep "post-merge verification"` finds every
code-panel cell's own record -- no separate report generator, docs
directory, or push/fetch policy needed; add a real generator only once a
second real consumer of that aggregate needs it (ADR-007 §4).

**Known limits (not enforced by the engine).** Two distinct gaps, both
Lead discipline in prose:
- Everything in this section and "Proof tiers" above: the coordination
  session's request schema has no field for a proof tier, `FULL_TRIGGERS`,
  or an environment fingerprint, and `disposition`/`rationale` accepts any
  non-empty string regardless of what it claims. A Lead who does not
  actually run `FULL_TEST`, or who mislabels a real regression as
  `environmental-precondition`, is not caught by anything the engine
  checks.
- The post-merge verification gate (section 4) specifically: it is a
  plain git operation the Lead performs by hand, same as the merge itself
  -- nothing stops a Lead from running `git worktree remove`/`git branch
  -d` immediately after the merge without ever running the check or
  making the record commit. The immediate-before-cleanup re-assertion in
  section 4 catches a `HEAD` that moved during the check window; it does
  not catch a Lead who skips the check outright.

Building a validator/schema for either is deliberately deferred
(ADR-007 §4: a second real consumer needed first) -- this note exists so
both limits are stated, not silently assumed away.

## Default actor roster

Executor/invocation/tier/effort mapping already decided for this product
line (doer/fixer -> `gemini` executor's `agy-cli-mucdong` invocation,
reviewer -> `gemini`'s SAME `agy-cli-mucdong` invocation but at `flagship`
tier, red-team -> `xai` executor's `pi-cli-vantt` invocation), personas
tuned for reading/writing/attacking real code.

**2026-09-17 executor-provider-naming:** executors are named by provider,
not by CLI binary -- `agy` (executor id) is now `gemini`, `pi-grok` is now
`xai`, and `codex`+`pi` (2 different bins that both happen to reach OpenAI)
merged into one `openai` executor (invocation id already carries the bin:
`codex-cli-bypass-fgovn` runs the `codex` binary, `pi-cli-tetnu` runs the
`pi` binary, both inside the same `openai` executor entry). No `rigorOverrides`
survived the merge -- `pi`'s old `{light/standard/heavy -> nano}` default
was never a deliberate cost policy, just a historical D4 proof-test
default, so it was dropped rather than silently overwriting `codex`'s own
(different) tier behavior; see `docs/specs/runner.md` for the fuller
reasoning on why merging two bins under one executor risks exactly that
kind of silent overwrite when their `rigorOverrides`/`for` actually differ
(they didn't here, so merging was safe).

**Reviewer model (unchanged since the 2026-09-17 model swap that preceded
this renaming pass):** resolves to `gemini-3.1-pro-low`
(`modelPolicies.gemini.flagship`) -- picked over `gemini-3.1-pro-high`
because it is already the tier's live default, no config change needed.
No `--effort` flag: agy's own catalog bakes effort into the model name
itself (`gemini-3.1-pro-low`/`-high`, no `-medium` variant exists for the
`pro` family, only for `flash`) and REFUSES `--model gemini-3.1-pro-low
--effort medium` outright as a conflicting pair -- confirmed by a real
failed invocation, not assumed. Known gap: `claude`'s (former reviewer
executor) `cli-readonly` invocation enforced read-only-ish behavior with a
narrow `--allowedTools` allowlist (git diff/log/show/status + test
commands only) as a belt-and-suspenders layer; `agy` has no equivalent
per-invocation tool allowlist flag, so reviewer's read-only posture now
rests solely on the structural backstop every declared-protocol dispatch
already gets regardless of executor (`runExecutorAttempt` unconditionally
passes `isReadOnlyMode: true`, session-engine.mjs) -- one fewer
independent layer than before, not zero enforcement.

**Red-team model:** resolves to `grok-4.6` (`modelPolicies.xai.flagship`,
confirmed real via `pi --list-models`). `--provider` is omitted from the
`pi-cli-vantt` invocation's args -- confirmed via a real invocation that
`pi` correctly infers the provider from its single-provider
`~/.pi/accounts/grok-vantt` account dir, no flag needed. The `xai`
executor now has its own `herdr` invocation (`pi-herdr-vantt`, the `pi`
binary), so the herdr-spawn roster variant below keeps red-team on `xai`
too, same as every other roster variant -- see the herdr-spawn section
below for how this superseded the old `openai`/`codex-herdr-fgovn`
fallback.

Both role swaps kept the previous primary as the new `fallbackExecutors`
entry (reviewer: `claude`; red-team: `openai`), so equivalent-tier
fallback still covers the account/provider that used to be primary.

Model-tier vocabulary (`model-tier-vocabulary-and-coordination-fallback`,
2026-09-17): tiers are `nano/mini/standard/advanced/flagship/frontier`
(cross-provider equivalence, `plans/260916-account-rotator/design.md`'s
"Tier vocabulary"), not the old 5-value `lightweight/standard/creative/
analytical/critical` vocab this section used before. Each role below also
declares `fallbackExecutors`: an executor at the SAME modelTier on a
different provider, so a real quota/auth refusal on the primary
(Provider Capacity Rotator, account-rotator track) actually substitutes
instead of dead-ending the round. `fallbackExecutors` is `string[]` of
executor ids only -- it does not pin a specific invocation on the
fallback (same limit `opPolicy.fallbackExecutors` already has; the
fallback resolves through Gate B2's own default-invocation rule for
whichever executor it lands on).

`executor-id-consolidation` (2026-09-17) and `executor-provider-naming`
(same day, later pass) retired every former separate/bin-named executor
id -- `agy-cli`/`agy-herdr`/`claude-reviewer`/`claude-reviewer-herdr`/
`codex-cli`/`codex-herdr`/`agy`/`codex`/`pi`/`pi-grok`/`codex-pi` are all
gone. What used to be a distinct executor id per role, then a distinct
bin-named executor, is now one `invocation` on a shared
provider-named executor (`claude`/`openai`/`gemini`/`xai`). `invocation`
(`actors[].invocation`, alongside `executor`) names which one -- there is
no bare/default invocation left to omit it in favor of any more, every
role below names its invocation explicitly:

```json
"actors": [
  { "id": "doer", "executor": "gemini", "invocation": "agy-cli-mucdong", "tier": "standard", "persona": "focused-code-implementer", "fallbackExecutors": ["glm"] },
  { "id": "reviewer", "executor": "gemini", "invocation": "agy-cli-mucdong", "tier": "flagship", "persona": "code-quality-reviewer", "fallbackExecutors": ["claude"] },
  { "id": "red-team", "executor": "xai", "invocation": "pi-cli-vantt", "tier": "flagship", "persona": "edge-case-and-security-attacker", "fallbackExecutors": ["openai"] }
]
```

Fix-round roster:

```json
"actors": [
  { "id": "fixer", "executor": "gemini", "invocation": "agy-cli-mucdong", "tier": "standard", "persona": "surgical-fixer", "fallbackExecutors": ["glm"] },
  { "id": "reviewer", "executor": "gemini", "invocation": "agy-cli-mucdong", "tier": "flagship", "persona": "code-quality-rechecker", "fallbackExecutors": ["claude"] },
  { "id": "red-team", "executor": "xai", "invocation": "pi-cli-vantt", "tier": "flagship", "persona": "relentless-code-attacker", "fallbackExecutors": ["openai"] }
]
```

Visible-pane variant (herdr-spawn), proven live 2026-09-10 through this
exact door (session `herdr-smoke--cell-01`: doer commit + result, reviewer
diff/test/sha256 report, red-team `xxd` check -- all three settled):

```json
"actors": [
  { "id": "doer", "executor": "gemini", "invocation": "agy-herdr-mucdong", "tier": "standard", "persona": "focused-code-implementer", "fallbackExecutors": ["glm"] },
  { "id": "reviewer", "executor": "gemini", "invocation": "agy-herdr-mucdong", "tier": "flagship", "persona": "code-quality-reviewer", "fallbackExecutors": ["claude"] },
  { "id": "red-team", "executor": "xai", "invocation": "pi-herdr-vantt", "tier": "flagship", "persona": "edge-case-and-security-attacker", "fallbackExecutors": ["openai"] }
]
```

`red-team`'s herdr-spawn invocation now runs on `xai`'s own
`pi-herdr-vantt` (the `pi` binary, `--kind pi` -- confirmed supported by
this machine's real `herdr agent start --help` possible-values list, and
proven live via a real self-identification round-trip resolving
`provider":"xai","model":"grok-4.3"`), closing what used to be a known gap
(`xai` previously had no herdr-spawn invocation at all, so this roster fell
back to `openai`'s `codex-herdr-fgovn` here instead). `reviewer`'s
herdr-spawn invocation follows the same swap as the headless roster:
`gemini`'s `agy-herdr-mucdong` at `flagship` tier, same
`gemini-3.1-pro-low` resolution as `agy-cli-mucdong`.

Same protocol, same request shape, same `--cwd` rule; each role runs in its
own herdr pane in the `fgos-worker` session, so a person can watch it and a
failed round leaves its pane open with the reason on screen. Two things the
herdr transport does that cli-spawn does not: herdr types the bare agent word
from `--kind` (an executor's `command` path is not what gets typed), and the
pane is the operator's own interactive shell, so shell aliases apply --
`xai`'s `pi-herdr-vantt` invocation (red-team's herdr-variant executor,
see the executor-provider-naming note above) relies on that.
Model resolution is unchanged: `actors[].model` has no channel for
declared-protocol requests, so tier x the executor's `rigorOverrides`
decides the model.

`persona` is free-form prose the executor receives as framing, not a
closed vocabulary (`schema.mjs:133` `ACTOR_ALLOWED_KEYS`) -- sharpen any
of these for a specific change (a security-sensitive diff wants an even
sharper red-team persona), but keep the roster shape and the
executor/invocation/tier mapping unless there is a real reason to diverge.

## 0. Private branch and worktree — always, before anything else

A code-panel change never runs in the main checkout and never on the base
branch. Open its own worktree on its own branch first, as a plain git
operation, following
the shared private-cell-worktree fragment. In this source tree it lives at
`core/skills/_shared/private-cell-worktree.md`; projected skill surfaces carry
their own sibling `_shared/private-cell-worktree.md` copy next to the skill root
with `<prefix>` = `code-panel`:

```sh
main=$(git rev-parse --show-toplevel)
base=$(git -C "$main" rev-parse --abbrev-ref HEAD)
wt="$main/../code-panel-<change-slug>"
git -C "$main" worktree add "$wt" -b code-panel--<change-slug> "$base"   # reuse the branch without -b if it already exists
[ -f "$wt/package-lock.json" ] && npm ci --prefix "$wt" --silent
```

Then verify, and re-verify before every later `run` on this cell:

```sh
[ "$(git -C "$wt" rev-parse --show-toplevel)" != "$main" ]
[ "$(git -C "$wt" rev-parse --abbrev-ref HEAD)" = "code-panel--<change-slug>" ]
```

Why the ceremony: the engine already refuses `mutation: "mutating"` when
`--cwd` is the main checkout, but a refusal is the good outcome — the bad one
is a worker whose transport started it in the wrong directory (a herdr pane
is the operator's own shell; a headless spawn has ignored its cwd before) and
which then commits somewhere else. That is why the doer's objective below
carries its own branch guard and why the Lead reads `git log` in `$wt`, not
the worker's summary.

## 1. Open the cell

`open.json`:

```json
{
  "kind": "declared-protocol",
  "objective": "Implement <the real code change, named directly> and get it independently reviewed + red-teamed.",
  "writerId": "<lead-identity>",
  "coordinationId": "code-panel--<change-slug>",
  "protocolRef": { "id": "core.coordination-protocol.standalone-master-coordination-loop" },
  "actors": [
    { "id": "doer", "executor": "gemini", "invocation": "agy-cli-mucdong", "tier": "standard", "persona": "focused-code-implementer", "fallbackExecutors": ["openai"] },
    { "id": "reviewer", "executor": "gemini", "invocation": "agy-cli-mucdong", "tier": "flagship", "persona": "code-quality-reviewer", "fallbackExecutors": ["claude"] },
    { "id": "red-team", "executor": "xai", "invocation": "pi-cli-vantt", "tier": "flagship", "persona": "edge-case-and-security-attacker", "fallbackExecutors": ["openai"] }
  ],
  "steps": [
    {
      "type": "operation",
      "as": "produce",
      "operationId": "produce-candidate",
      "targetActorId": "doer",
      "taskKey": "produce-candidate-doer",
      "objective": "First run `git rev-parse --abbrev-ref HEAD` and stop immediately if it is not `code-panel--<change-slug>`. Then implement <exact file(s)/behavior>. Land a real commit on this worktree's own branch; run FOCUSED_TESTS (<name the exact command here, from the Test-selection block>) and confirm it passes before reporting done. Do not run the full suite unless this objective names it explicitly.",
      "expectedOutputs": ["a real git commit on this worktree's branch", "agent-result.json (status, summary, FOCUSED_TESTS's real outcome)"],
      "mutation": "mutating"
    },
    {
      "type": "operation",
      "as": "review",
      "operationId": "review-candidate",
      "targetActorId": "reviewer",
      "taskKey": "review-candidate-reviewer",
      "objective": "Independently review the real commit for correctness, test coverage, and dead code -- read the diff directly, never trust the doer's own summary alone. Also judge proof sufficiency: does FOCUSED_TESTS (<name it>) actually exercise the changed contract, or does this diff's blast radius need AFFECTED_TESTS / FULL_TEST instead? If the declared tier is insufficient, report it as a finding naming the gap -- you cannot run or request a wider tier yourself.",
      "expectedOutputs": ["agent-result.json (status, summary, findings by severity)"],
      "contextRefs": ["$ref:produce"]
    },
    {
      "type": "operation",
      "as": "redTeam",
      "operationId": "red-team-candidate",
      "targetActorId": "red-team",
      "taskKey": "red-team-candidate-red-team",
      "objective": "Attempt to break the real commit through named attacks: edge cases, boundary values, and any invariant the objective implies but never states as an explicit test. Also judge proof sufficiency the same way the reviewer does: if FOCUSED_TESTS misses a contract this diff changes, report it as a finding naming the gap -- you cannot run or request a wider tier yourself.",
      "expectedOutputs": ["agent-result.json (status, summary, findings by severity)"],
      "contextRefs": ["$ref:produce"]
    }
  ]
}
```

Dispatch, pointed at the worktree opened in section 0 (explicit path, never
the shell's cwd):

```sh
fgos coordination run --cwd "$wt" --file open.json
```

`--cwd` is required for `mutation: "mutating"` to be legal on `produce`
-- `produce-candidate` is the one operation this protocol declares
`result.kind: work-product` for
(`standalone-master-coordination-loop.yaml`'s own `operations[]`); the
engine refuses `"mutating"` whenever `cwd` resolves to the main checkout
(full four-condition Mutation Rule:
`docs/architect/agent-coordination/contracts/coordination-session.md`,
"Mutation Rule" section).

## 2. Read results, disposition findings

```sh
fgos coordination show code-panel--<change-slug> --json
```

Verify the doer's real outcome yourself first (section above), then
record each accept/reject/deferred decision as a `disposition` step:

```json
{
  "type": "disposition",
  "as": "dispositionReviewHigh1",
  "targetRef": "<real assignment id from the show/run result above, e.g. asgn_...>",
  "disposition": "accepted",
  "rationale": "Reviewer HIGH-1 (missing test for X) accepted; routed to fix-1.json.",
  "evidenceRefs": []
}
```

## 3. Fix round (`fix-1.json`), only if a finding was accepted

Every position past the required first pass
(`revise-candidate`/`reviewer-recheck`/`red-team-recheck`) is
`activation.mode: driver-authorized` -- pair an `authorize` + `operation`
step per position, all resuming the same `coordinationId`:

```json
{
  "kind": "declared-protocol",
  "objective": "Fix round 1: apply the accepted findings and get an independent recheck.",
  "writerId": "<lead-identity>",
  "coordinationId": "code-panel--<change-slug>",
  "protocolRef": { "id": "core.coordination-protocol.standalone-master-coordination-loop" },
  "actors": [
    { "id": "fixer", "executor": "gemini", "invocation": "agy-cli-mucdong", "tier": "standard", "persona": "surgical-fixer", "fallbackExecutors": ["openai"] },
    { "id": "reviewer", "executor": "gemini", "invocation": "agy-cli-mucdong", "tier": "flagship", "persona": "code-quality-rechecker", "fallbackExecutors": ["claude"] },
    { "id": "red-team", "executor": "xai", "invocation": "pi-cli-vantt", "tier": "flagship", "persona": "relentless-code-attacker", "fallbackExecutors": ["openai"] }
  ],
  "steps": [
    { "type": "authorize", "as": "authRevise", "operationId": "revise-candidate", "targetActorId": "fixer", "authorizationId": "auth_codepanel_<change-slug>_fix1_revise", "invocationKey": "code-panel:<change-slug>:fix1:revise:1", "reason": "Reviewer HIGH-1 accepted; apply the fix." },
    { "type": "operation", "as": "revise", "operationId": "revise-candidate", "targetActorId": "fixer", "taskKey": "revise-candidate-fixer", "objective": "First run `git rev-parse --abbrev-ref HEAD` and stop immediately if it is not `code-panel--<change-slug>`. Then apply the accepted findings. Land a real commit; re-run FOCUSED_TESTS (<name the exact command here>) for the changed region plus a regression test for the specific finding being fixed -- do not mechanically re-run more than that.", "expectedOutputs": ["a real git commit", "agent-result.json (status, summary, the real test outcome)"], "mutation": "mutating" },
    { "type": "authorize", "as": "authReviewRecheck", "operationId": "reviewer-recheck", "targetActorId": "reviewer", "authorizationId": "auth_codepanel_<change-slug>_fix1_reviewer_recheck", "invocationKey": "code-panel:<change-slug>:fix1:reviewer-recheck:1", "reason": "Revision landed; recheck against the original finding.", "grantedContextRefs": ["$ref:revise"] },
    { "type": "operation", "as": "reviewRecheck", "operationId": "reviewer-recheck", "targetActorId": "reviewer", "taskKey": "reviewer-recheck-reviewer", "objective": "Recheck the revised commit against the accepted findings. Read the fixer's own commit and real test output as evidence first -- do not re-run the same command unless that evidence is itself in doubt.", "expectedOutputs": ["agent-result.json (status, summary)"], "contextRefs": ["$ref:revise"] },
    { "type": "authorize", "as": "authRedTeamRecheck", "operationId": "red-team-recheck", "targetActorId": "red-team", "authorizationId": "auth_codepanel_<change-slug>_fix1_red_team_recheck", "invocationKey": "code-panel:<change-slug>:fix1:red-team-recheck:1", "reason": "Revision landed; re-attempt the same class of attack.", "grantedContextRefs": ["$ref:revise"] },
    { "type": "operation", "as": "redTeamRecheck", "operationId": "red-team-recheck", "targetActorId": "red-team", "taskKey": "red-team-recheck-red-team", "objective": "Re-attempt any attack that previously succeeded against the revised commit -- this needs fresh output of its own, unlike the reviewer's recheck above. Do not re-run FOCUSED_TESTS wholesale; falsify the specific prior attack.", "expectedOutputs": ["agent-result.json (status, summary)"], "contextRefs": ["$ref:revise"] }
  ]
}
```

Dispatch (still pointed at the worktree -- `revise-candidate` is the one
recheck-round operation declaring `result.kind: work-product`):

```sh
fgos coordination run --cwd "$wt" --file fix-1.json
```

Repeat with `fix-2.json`, ... (new `authorizationId`/`invocationKey`
values each time) if a recheck itself surfaces a new accepted finding.

## 4. Close, then merge, then verify

**A first-pass finding is discharged only by disposition + a satisfied
recheck, never by disposition alone.** `review-candidate`/
`red-team-candidate` reporting `findings` fails that gating slot in
`closeSessionByQuorum`'s quorum check; `reviewer-recheck`/
`red-team-recheck` each declare `rechecks: review-candidate` /
`rechecks: red-team-candidate` (`standalone-master-coordination-loop.yaml`)
so a LATER, satisfied recheck of the same actor can discharge that slot --
but only once you have recorded a `driver-disposition-recorded` event
against the specific failed assignment (any `disposition` step targeting
it, any value -- the disposition's own text is never parsed). A `rejected`
finding still needs its own recheck: the independent confirmation, not the
disposition, is what actually closes the gap. Do not attempt `close.json`
by skipping the recheck round once a finding is accepted -- it will refuse
with `missing required actor(s)` until a real, satisfied recheck
Assignment exists for the failed slot.

**Close before merge, not after.** The target branch must never receive
this cell's code before the close gate actually passed -- merging on an
unclosed or failed session is not a supported door. `close.json` certifies
`testedSha` (the cell's own worktree tip) only; the merge and its
post-merge verification are separate, later, plain-git steps performed
*after* a successful close, recorded outside the coordination session
entirely (the session is already closed by then -- no field/door writes a
new disposition into a closed session, the engine refuses it,
`store.mjs`). This is the same close-then-merge order `fgos-plan-loop`
already uses for its own cells; code-panel had briefly swapped the order
so the close rationale could narrate the merge in the same breath, but
that traded away the actual safety property (target branch never sees
unclosed code) for a documentation convenience -- not a good trade,
reverted here.

Close only once the required first pass and every fix round this change
needed have dispatched cleanly, and either `FULL_TEST` has run for the
cell's own worktree-tip `(tree, environment)` state or the rationale
states why `AFFECTED_TESTS` already covered the blast radius without it:

```json
{
  "kind": "declared-protocol",
  "objective": "Close: independent review + red-team both clean, tests run for this cell's own state.",
  "writerId": "<lead-identity>",
  "coordinationId": "code-panel--<change-slug>",
  "protocolRef": { "id": "core.coordination-protocol.standalone-master-coordination-loop" },
  "actors": [
    { "id": "doer", "executor": "gemini", "invocation": "agy-cli-mucdong", "tier": "standard", "persona": "focused-code-implementer", "fallbackExecutors": ["openai"] },
    { "id": "reviewer", "executor": "gemini", "invocation": "agy-cli-mucdong", "tier": "flagship", "persona": "code-quality-reviewer", "fallbackExecutors": ["claude"] },
    { "id": "red-team", "executor": "xai", "invocation": "pi-cli-vantt", "tier": "flagship", "persona": "edge-case-and-security-attacker", "fallbackExecutors": ["openai"] }
  ],
  "steps": [
    {
      "type": "disposition",
      "as": "closeCell",
      "targetRef": "<real assignment id of the final, accepted revise/recheck dispatch>",
      "disposition": "cell-closed",
      "rationale": "Reviewer + Red-Team recheck both clean; FULL_TEST <ran for state <testedSha> | skipped -- AFFECTED_TESTS covered <blast radius>, no FULL_TRIGGERS fired>; commit <testedSha> is the cell's own final, verified state. Tests run this cell: <tier: command -> executed|reused-from-<sha>, duration, outcome> for each. Merge and post-merge verification happen after this close, as separate tracked commits (see below) -- not yet part of this session.",
      "evidenceRefs": ["<real assignment id of reviewRecheck>", "<real assignment id of redTeamRecheck>"]
    }
  ]
}
```

```sh
fgos coordination run --cwd "$wt" --file close.json
```

Only after `close.json` succeeds:

```sh
testedSha=$(git -C "$wt" rev-parse code-panel--<change-slug>)
git -C "$main" merge --no-ff code-panel--<change-slug>
mainMergedSha=$(git -C "$main" rev-parse HEAD)
mainMergedTree=$(git -C "$main" rev-parse HEAD^{tree})
testedTree=$(git -C "$wt" rev-parse code-panel--<change-slug>^{tree})
baseBeforeMerge=$(git -C "$main" merge-base HEAD^1 HEAD^2 2>/dev/null || git -C "$main" rev-parse HEAD^1)
```

`testedSha`, `mainMergedSha`, and (below) `postMergeVerifiedSha` name
three DIFFERENT commits -- a stranger reading this cell's history later
must be able to tell which one to trust for what; never collapse them
into one field even when two happen to be identical.

**Post-merge verification -- required before cleanup.** The first-pass/
fix-round proof only ever ran in the cell's own worktree; `mainMergedSha`
is a DIFFERENT tree whenever `$base` moved during the cell's lifetime (a
clean, conflict-free merge still unions in every commit `$base` gained
while the cell was open) or the merge itself needed conflict resolution.
Never assume the merge commit inherits that proof -- check:

- `mainMergedTree` equals `testedTree` **and** the environment fingerprint
  (above) is unchanged: the cell's own proof already certifies the merge
  commit -- no re-run needed.
- Otherwise: run `AFFECTED_TESTS` against `$main` at `mainMergedSha` at
  minimum; escalate to `FULL_TEST` if a `FULL_TRIGGERS` category fired.
  Check the trigger against the actual merged diff, not just the cell's
  own diff -- `$base`'s own new commits can trigger it too:
  `git -C "$main" diff "$baseBeforeMerge" "$mainMergedSha" -- .` (this is
  the diff a clean merge produced end to end; a conflict-resolution merge
  should instead be read directly, since no single two-way diff
  represents a three-way resolution). Escalate on the blast radius too
  when it otherwise requires it.
- If this re-run finds a REAL problem: the session is already closed, so
  fixing it does not reopen this cell -- always open a **new** code-panel
  cell for the fix (a normal follow-up change, its own worktree/branch/
  session), naming `mainMergedSha` as the "what broke" context in its own
  `open.json` objective. This cell's own record (below) documents the
  problem and points at the new cell's id -- it is never blocked on that
  new cell's own fix actually landing, since the new cell has its own
  independent close/merge/post-merge-verify lifecycle on its own timeline.

**Record the result as an ordinary tracked commit -- not a `git note`.**
`refs/notes/*` are not in the default commit graph, do not push/fetch by
default, and a fresh clone will not see them without extra configuration
this repo does not carry (`git notes list` on this repo returns nothing
today, confirming no note from this skill's own earlier version was ever
actually durable). An ordinary commit has none of that: default commit
graph, pushed/fetched like any other commit, visible in plain `git log`.

```sh
git -C "$main" commit --allow-empty -m "$(cat <<MSG
chore(code-panel--<change-slug>): post-merge verification

testedSha: $testedSha
mainMergedSha: $mainMergedSha
Result: <treeIdentical: true, matches testedSha | AFFECTED_TESTS/FULL_TEST re-run: <result> | REAL PROBLEM found, follow-up cell: <new cell id>>
MSG
)"
postMergeVerifiedSha=$(git -C "$main" rev-parse HEAD)
```

This commit is always `--allow-empty` -- it records this cell's own
check outcome, never a code change. Even the "REAL PROBLEM found" case
records here (with the follow-up cell's id as the pointer), because the
fix itself lands through that OTHER cell's own separate close/merge/
post-merge-verify cycle, not this one -- this cell's `postMergeVerifiedSha`
only needs to prove the check ran and was recorded, not that any problem
it found is already fixed. To find every code-panel cell's post-merge
record later, `git log --all --grep "post-merge verification"` -- no
separate report generator, docs directory, or push/fetch policy
registration needed; add a real generator only once a second real
consumer of that aggregate needs it (ADR-007 §4).

Only once `postMergeVerifiedSha` exists, and only if `$main`'s `HEAD` has
not moved since (another writer could have advanced it in the meantime --
re-assert immediately before cleanup, not just at check time):

```sh
[ "$(git -C "$main" rev-parse HEAD)" = "$postMergeVerifiedSha" ] || {
  echo "refuse: HEAD moved since post-merge verification -- re-verify before cleanup" >&2
  exit 1
}
git -C "$main" worktree remove "$wt"
git -C "$main" branch -d code-panel--<change-slug>
```

(Comparing the commit SHA, not just its tree -- an intervening empty or
metadata-only commit changes `HEAD` while leaving the tree unchanged, and
would slip past a tree-only check.)

(`worktree remove` and `branch -d` from the main checkout, never from
inside `$wt`.)

No `index.md`, no track directory, no cross-cell sequencing -- one
change, one cell, done.
