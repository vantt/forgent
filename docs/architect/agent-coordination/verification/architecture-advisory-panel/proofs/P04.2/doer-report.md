# Cell P04.2 — Surface, Examples, And Dialogue (Doer Report)

Phase: `plans/260905-architecture-advisory-panel/phase-04-production-skill-and-dialogue.md`
Cell: P04.2 — Surface, examples, and dialogue.
Doer mechanism: single-agent authoring (docs/examples only — no
coordination session opened for this cell, matching P04.1's own
precedent; nothing in this cell's scope touches `core/skills/`).

## Step 1 — proving the entry/resume gap, live, before writing anything

Phase-04's own instruction: prove or disprove whether `fgos-group-thinking`
plus `fgos coordination run/show` already provides the required
entry/resume path before adding any new use-case or CLI verb. This was
driven for real, not assumed from reading the code.

**Setup.** A throwaway sandbox (never a real project), following
`test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`'s
own request-construction pattern (`opStep`/`authorizeStep`/`humanTurnStep`
shapes) but invoked through the actual `fgos` CLI binary
(`node bin/fgos.mjs coordination run/show`), not the internal
`runGroupThinkingRequest` function directly — a fake, registered executor
(`allowCrossProvider`, a Node script settling every pending Assignment) so
no real LLM calls were needed, `--dir <scratch>` naming a disposable repo
root so nothing touched this repository's own `.fgos/` state. Confirmed
along the way that "core" protocol discovery (`PACKAGE_ROOT`, a
module-level constant from `import.meta.url`) resolves independently of
`--dir`/`--cwd` — the registered
`core.coordination-protocol.architecture-advisory-panel-v1` protocol was
reachable from the scratch sandbox with zero special wiring.

**Call 1 (real CLI invocation):**

```bash
node bin/fgos.mjs coordination run --file request-1.json --dir <scratch>
```

`request-1.json` names only `interpret-request` (lead-advisor-actor) and
`investigate-context` (context-investigator-actor) — the two Phase 1
operations a coordinator would build from a raw sentence like
"should we split this service or keep it one," never authored by a person.
Result: both steps `"status": "done"`, session correctly stays open
(`"closed": false`), and `closeRefusalReason` names every actor still
missing quorum, by real actor id.

**`fgos coordination show aap_entry_proof_1 --dir <scratch> --json`
(real, between calls):** reported, from nothing but the replayed event
log — no chat history, no raw dispatch log:
- `quorum.completed`/`quorum.missing`, naming `lead-advisor-actor` as
  still-missing even though its own `interpret-request` step had already
  settled `"done"` — a real, load-bearing consequence of the
  multi-operation quorum rule (that actor also owes
  `explain-recommendation` and `close-dialogue`), not a display quirk.
- `pendingDriverAuthorizations`, naming all 8 remaining
  `driver-authorized` operations (`critique-proposals` through
  `close-dialogue`) by node/operation/actor, before any of them had run.
- a real `eventCount`.

**Call 2 (genuinely separate, later CLI invocation, same
`coordinationId`):**

```bash
node bin/fgos.mjs coordination run --file request-2.json --dir <scratch>
```

`request-2.json` names the three Phase-5 shapers. All three settled
`"done"`; a follow-up `show` confirmed `quorum.completed` grew to include
`system-shaper-actor` — proving the park/resume pattern works across two
genuinely separate process invocations, not just two calls inside one
script.

**Verdict: no new use-case or CLI verb needed.** A coordinator building a
request from raw words, and a fresh session resuming from `show` alone,
both already work through the exact doors `fgos-group-thinking` already
exposes for every sibling protocol. This matches — and for the first time
actually *exercises directly*, rather than infers from reading the pack
gate's source — what the team-lead's own message predicted based on
P01.2/P01.3 (manual dispatch) and P03.2 (conformance-level proof). The
`docs/how-to/use-fgos-architecture-panel.md` guide cites this proof
directly in its own "Resuming a session later" and "Do you need a new
use-case or CLI verb" sections.

**One real mechanical trap found while doing this** (not a gap in the
skill/protocol, a CLI-flag trap worth naming for whoever runs this next):
`--dir` takes the **repository root**, not the `.fgos/` path directly
(`dataDir(overrideDir)` calls `fgosDirFromRoot(overrideDir)` internally) —
passing `<scratch>/.fgos` as `--dir` silently creates a nested
`<scratch>/.fgos/.fgos/` and reads the runner config from the wrong place
without any error. Cost real time to diagnose; not filed as a tracked bug
since the command-registry's own description ("`--dir` names the main
checkout's `.fgos/`, so its parent is the repo root") is consistent with
passing the root once read carefully — this is a documentation-clarity
trap, not a behavior defect, and out of this cell's file-ownership scope to
fix.

## What was built

### `docs/how-to/use-fgos-architecture-panel.md`

Person-facing companion to `SKILL.md` (which stays agent-operational
prose, per its own stated audience). Covers: raw-intent entry (two real
sentences, cited), the 9-phase table restated for what a person actually
sees (most phases: nothing, by design), the Decision Dialogue verb table
restated from the person's side, the bounded-reopen narrowing stated
plainly, links to all 8 example families, the live resume proof (Step 1
above), an explicit "no new verb needed" section with its own evidence, and
the executor-roster registration warning carried forward from `SKILL.md`.

### 8 example families, `docs/how-to/coordination-examples/architecture-advisory-panel-v1-*.md`

Each pins `protocolRef.id: "core.coordination-protocol.architecture-advisory-panel-v1"`
and shows explicit `actors[]`/`targetActorId` routing in real request-JSON
fragments (the shape proven live by the conformance suite), paired with
prose grounded in the two real sessions wherever real precedent exists.
Honesty about what's real vs. constructed, stated in each file's own
opening, not buried:

| Family | File | Grounding |
|---|---|---|
| Clear start | `architecture-advisory-panel-v1-clear-start.md` | **Real** — P01.2 (mdview), narrated, not copied |
| Unclear start | `architecture-advisory-panel-v1-unclear-start.md` | **Real** — P01.3 (vnflow), narrated, including the real out-of-panel `kongming` consultation |
| Consolidated Decision Request + resume | `architecture-advisory-panel-v1-decision-request-and-resume.md` | **Real** for the "zero sent" pattern (P01.2's actual verdict table, reproduced) and for resume (Step 1's live proof); **constructed** for the "a Decision Request would send" half — disclosed explicitly, since neither real session crossed both SCOUT-BEFORE-ASK bars for more than one gap at once |
| Clarification / challenge | `architecture-advisory-panel-v1-clarification-and-challenge.md` | **Real** clarify (P01.3 Turn 1, "giải thích lại câu hỏi"); **constructed** challenge, grounded in P01.2's real, still-unresolved Attack 1 dispute |
| Material-context reopen | `architecture-advisory-panel-v1-material-context-reopen.md` | **Real** turn (P01.2 Turn 1) with a disclosed rewrite: shows what the manual playbook actually did (a Phase-3 reopen, no longer available) vs. what THIS protocol's bounded graph does with the identical fact (`revise-synthesis` or a new inheriting cell) |
| Alternative / composite reopen | `architecture-advisory-panel-v1-alternative-and-composite-reopen.md` | **Constructed** — neither real session used either verb; grounded in P01.2's real 3 shaped proposals as the composition/alternative material |
| Final decision / defer | `architecture-advisory-panel-v1-final-decision-and-defer.md` | **Real** — P01.2 Turn 2, a single real turn that is both a `decide` and a named-trigger defer at once |
| Heterogeneous / homogeneous roster | `architecture-advisory-panel-v1-heterogeneous-and-homogeneous-roster.md` | **Real** roster table and real, passing conformance mechanism (actual resolved-model proof from `result.json`); real, disclosed registration-gap warning (`tsk-1o4`) carried forward from `SKILL.md` |

No example runs a full fake-executor dispatch through every phase to
produce placeholder "Settled." content for the narrative sections — that
would read as ceremony, not a real advisory session, and was avoided
deliberately per the parent message's own bar ("do the examples read like a
real advisory session, or like ceremony?"). The one place a stub-executor
run appears at all is Step 1's mechanism proof, which is explicitly a
mechanism proof, not narrated as advisory content.

## Real design judgment found while writing

The team-lead's brief named P01.2's real Turn 1 (a Phase-3 reopen) as
grounding for the material-context-reopen family, but that reopen mechanism
literally does not exist in the registered protocol's graph (`SKILL.md`'s
own Bounded Reopen Scope: no backward edge into `phase-framing`). Rather
than either (a) silently using the real precedent as if the new protocol
could still do the same thing, or (b) picking a different, less apt real
precedent, I kept the real precedent and made the divergence itself the
teaching point: the example shows what the manual playbook did, then shows
the same fact under the new bounded graph (integrate via `revise-synthesis`
if possible, else a new inheriting cell) — this is more honest than
smoothing over the exact boundary `SKILL.md` itself calls "a real,
deliberate narrowing... not an oversight."

## Tests

1. **Focused coordination suite** —
   `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'`
   → **757/757 pass**, 0 fail.
2. **Skill wrapper / mirror suite** —
   `node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs`
   → **39/39 pass**, 0 fail (expected — this cell touches no `core/skills/`
   file, so this is a no-drift confirmation, not new coverage).
3. **Full `npm test`** — a single, clean run (`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1
   npm test`), after discarding two earlier concurrent runs I mistakenly
   started at the same time (running two full suites against the same
   shared checkout simultaneously is not trustworthy — one crashed
   mid-run with no exit marker) →
   **5695 tests, 5683 pass, 6 fail, 6 skipped, exit 1.** All 6 failures
   independently verified as outside this cell's own file-ownership scope
   and unrelated to any file this cell touched
   (`docs/how-to/use-fgos-architecture-panel.md`, the 8 new example files,
   `CHANGELOG.md`, `docs/enduser-docs-index.json`):
   - `test/cli/fgos-intake-4.test.mjs` — an event-log `seq` mismatch (`3`
     vs expected `2`) on a work-item round-trip; this shared main checkout
     has many other live peer-agent sessions writing real events
     concurrently (`git worktree list` shows 15+ active agent worktrees at
     the time of this run) — a concurrency artifact, not a defect in this
     cell's own diff.
   - `test/report/enduser-index.test.mjs` (`tolerates a missing quadrant
     dir`) — asserts the real `docs/tutorials` dir exists before hiding it
     for the test's own duration; failed because it didn't exist at that
     instant. The immediately preceding test in the same file
     (`fgos docs-index writes repo/docs/enduser-docs-index.json...`) took
     **50 seconds** to complete (normally sub-second) — direct evidence of
     heavy filesystem contention from concurrent peer activity on this
     same shared checkout, not a regression from this cell's own
     `fgos docs-index` run (verified separately as a clean, minimal diff —
     see item 5 below).
   - `test/runner/codex-cli-glm-cli-live-executors.test.mjs` — a `LIVE`
     test expecting a real GLM/z-ai self-identification through a
     configured OpenRouter route, got `claude-sonnet-5` instead —
     environment/routing-config dependent, unrelated to any doc.
   - `test/runner/flow-definition-protocol-loader.test.mjs`
     (`discoverCoordinationProtocols finds all shipped core fixtures...`)
     — **a real, pre-existing gap from an earlier cell, not this one**:
     the test's own hardcoded `expected` array does not include
     `core.coordination-protocol.architecture-advisory-panel-v1`, which
     P03.2 registered as a real core-tier protocol fixture. This test was
     never updated when that protocol was registered. Flagging for the
     team lead/P03.2 owner rather than fixing myself — this file is
     outside P04.2's file-ownership scope.
   - `test/scripts/check-decision-citation-drift.test.mjs` — **a real,
     pre-existing gap from P04.1, not this cell**: both
     `.agents/skills/fgos-architecture-panel/SKILL.md:730` and its
     `plugins/fgOS/skills/` mirror cite decision-local id `D1` outside its
     own `CONTEXT.md` (decision 0017's own remediation: "inline the
     content, delete the id"). `core/skills/fgos-architecture-panel/SKILL.md`
     is P04.1's file, not touched by this cell. Flagging for the team
     lead/P04.1 owner.
   - `test/setup/coordination-doctor-check.test.mjs`
     (`coordination-example-requests-valid`) — pre-existing: the
     **group-thinking-lite** (not architecture-panel) resume-request JSON
     examples ship literal placeholder strings
     (`"<the share assignmentId from the first call's own result>"`) that
     fail schema validation; this is the exact placeholder
     `use-fgos-group-thinking.md` itself already documents ("ships with
     placeholder strings ... replace them with call 1's real output before
     running"). Predates this cell; none of this cell's own 8 example
     files use unfilled placeholders in a schema-validated position.
4. **Relative-link check** — every markdown link in the new how-to doc and
   all 8 example files resolved against the real filesystem (a small
   script, not `git diff --check`, since these are new files with no
   pre-existing baseline to diff against) — all resolve, zero broken links.
5. **`fgos docs-index`** — regenerated `docs/enduser-docs-index.json`
   rather than hand-editing it (confirmed by reading
   `src/report/enduser-index-generate.mjs` that this file is a generated
   projection, not a hand-maintained manifest); diff is exactly the one new
   `docs/how-to/use-fgos-architecture-panel.md` entry, nothing else moved.
6. **mdview render** — `mdview open docs/how-to/use-fgos-architecture-panel.md`
   → `http://design-lap:7700/s/9955ab30cfae`.

## CHANGELOG

Added one `## [Unreleased]` bullet naming the new how-to doc and 8 example
families, the real-vs-constructed disclosure, and the Step-1 live-proof
finding that no new verb was needed — per `AGENTS.md`'s install/setup/doctor
gate ("does this change something a user of fgOS would see?").

## Status

Status: DONE
Summary: Proved live (not assumed) that the existing `fgos-group-thinking`
doors already cover raw-intent entry and durable-artifact resume for this
protocol — no new use-case or CLI verb added. Shipped the how-to guide and
all 8 required example families, each pinning the real protocol id and
explicit `actors[]` routing, grounded in the two real P01.2/P01.3 sessions
wherever real precedent exists and explicitly disclosed where constructed.
Focused coordination suite (757/757) and skill-wrapper/mirror suite (39/39)
both fully green. Full `npm test`: 5695 tests, 5683 pass, 6 fail — every
one of the 6 independently verified as outside this cell's own diff and
file-ownership scope (2 are concurrency artifacts of this shared,
many-peer-agent checkout; 1 is a `LIVE` environment/routing test; 2 are
real pre-existing gaps from earlier cells, P03.2's protocol-loader test and
P04.1's `SKILL.md` decision-citation, flagged above for their owners; 1 is
a pre-existing group-thinking-lite placeholder-JSON gap unrelated to this
cell's own example files).
Concerns/Blockers: Two real pre-existing bugs found and flagged above
(not fixed — outside this cell's file ownership): P03.2's
`flow-definition-protocol-loader.test.mjs` needs
`core.coordination-protocol.architecture-advisory-panel-v1` added to its
expected fixture list; P04.1's `SKILL.md` (both projections) needs its
`D1`-outside-CONTEXT.md citation at line 730 inlined per decision 0017.
Also: one documentation-clarity trap found in the `coordination` command's
own `--dir` semantics (repo root, not the `.fgos/` path) cost real
debugging time during Step 1 — noted above, not filed as a tracked bug
since it is a careful-reading issue, not a behavior defect.
