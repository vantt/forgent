# Phase 7 decomposition research

Read-only research for Lead's Phase 7 unit decomposition. No files written except this report.

## 1. Action/status contract versioning (item 1)

Partially done, not a greenfield gap. `src/runner/coordination/actions-projector.mjs:20`
already declares `ACTIONS_CONTRACT_VERSION = 'coordination-actions.v1'`, stamped into
every action-view output (`~L497,521`). Session manifests separately carry a mature
`schemaVersion` (1/2/3, `store.mjs` `SUPPORTED_SCHEMA_VERSIONS`). `scripts/measure-
coordination-baseline.mjs` independently invented its own `CONTRACT_VERSION =
'coordination-baseline.v1'` (same pattern, different owner) — a real precedent to
follow. What's NOT versioned: the broader CLI `status`/`show` JSON envelope itself
has no top-level version marker separate from the actions array. Concrete work:
extend the existing versioning pattern to the rest of the status/CLI output surface,
not invent a new scheme from scratch.

## 2. `run --file` / legacy replay (item 2)

Fully live today, not deprecated. `bin/fgos.mjs:3189` still requires `--file` for
`coordination run`; replay logic is spread across core runner files (`session-engine.mjs`,
`run-result.mjs`, `legality-facts.mjs`, `action-precondition.mjs`, `dag-declaration.mjs`,
etc.) — this is load-bearing infrastructure, not a legacy corner. Read as a CONSTRAINT
on the rest of Phase 7 (especially the 4a rename), not standalone new work: whatever
4a/4d do must not break this path.

## 3. Doc/spec scope overlap with I29 (item 3)

I29's own report names one explicit follow-up it left out of scope: `docs/platform/
packaging-distribution/contracts/skill-package-distribution.md`'s intent-mapping table
has no `/fgos:code-change` row — a command-registry-level change, flagged as a Phase 7
candidate by I29 itself. Otherwise I29 already swept the wide majority of live
inbound references (fgos-panel routing, both trigger-surface copies, master-coordinator
and runtime-recovery-design docs, reading-map, the how-to doc, CHANGELOG) — item 3's
remaining scope for Phase 7 is narrower than the phase text implies at first read;
mostly the command-registry gap plus whatever this research below turns up (the
canonical/legacy `flow-definition.md` drift, see item 5b below).

## 4. Config/doctor registration (item 4)

**Already done**, not a gap — but in a different file than the phase text implies.
`src/setup/checks.mjs` has zero hits for any of these terms; the real doctor-check
registry is `src/setup/registrations.mjs`. There:
- `serves` + the "review" slot: `capability-serves-valid` check (`~L2001-2006`,
  explicitly cites I19).
- `policy.capability` resolution + provider-family diversity reporting:
  `operation-capability-resolves` check (`~L2009-2084`, explicitly cites Unit I21).
- `config-not-stale`: registered at `~L1033`.

Item 4's own "confirm coverage" framing already has its answer: yes, covered. The
real remaining work here is near-zero (maybe: correct the phase text's own file
reference from `checks.mjs` to `registrations.mjs` before anyone goes looking in the
wrong place, and confirm `distinctProviderFrom` itself — as distinct from
`policy.capability` resolution — has no separate doctor check, though it does have
real schema validation and conformance tests, see item 5b).

## 5. FlowDefinition contract doc — PolicyPatch section (item 4b)

**Real, confirmed drift, genuine work needed.** `docs/architect/agent-coordination/
contracts/flow-definition.md` (legacy copy) DOES document `distinctProviderFrom` in
its PolicyPatch section (`~L580,607`, citing Unit I21 by name). The CANONICAL copy,
`docs/platform/agent-coordination/contracts/flow-definition.md`, has NO
`distinctProviderFrom` content anywhere — confirmed via direct grep, zero hits. The
canonical doc is missing real, already-shipped contract content the legacy copy has.
This is exactly item 4b's ask, genuinely undone, and worth flagging loudly since a
"canonical vs. legacy" doc-drift bug of this exact shape already bit this track once
before (I27's original draft targeted the wrong trigger-surface file).

`distinctProviderFrom` itself is real and shipped: schema-validated
(`src/runner/definitions/schema.mjs:134-147,323-331`), consumed at binding time
(`src/verbs/coordination/binding.mjs:54-124`), and has dedicated conformance tests
(`test/verbs/coordination-binding.test.mjs:192,209`).

## 6. Read-only binding source consolidation (item 4c)

**Premise likely needs re-verification before drafting this unit.** Both mechanisms
are live in the current config and code, but they don't look like true duplicates —
`placementPolicy.readOnlyRedirects` is binding.mjs's own explicitly-named "safety net"
for UNBOUND actors (`binding.mjs:20,224,263,266` — three separate comments call it
exactly that), consumed in 4 real source files including `placement-policy.mjs`,
`config.mjs`, `assignment-runner.mjs`. `capabilities.code:review.prefer` is an
ordinary named-capability config entry, resolved through the normal capability-prefer
path used everywhere else — a different mechanism (capability-keyed prefer binding),
not a second implementation of the same operation-id-keyed redirect concept. Whoever
picks up 4c should re-read both mechanisms' actual call sites fresh rather than trust
the phase text's "these two compete, pick one" framing at face value — it may be
correct, or it may be describing two orthogonal things that both need to stay.

## 7. Capability-declaration compat-window closure (item 4d)

**Real, confirmed, substantial gap — genuine Phase 7 work.** At the ENGINE level,
`src/report/capability-plan-lint.mjs` still hardcodes `capability.undeclared` at
`severity: 'warn'` (never `'hard'`) in both emission sites (`~L136,324-325`), and `ok`
is computed as `!findings.some(f => f.severity === 'hard')` (`~L314,329`) — so a
missing capability declaration can never fail `plan-lint` at the engine level today.
This is the exact same defect I28's own review found and had to work around at the
SKILL-prose level (fgos-code-change's Step 0 now special-cases this warn code itself).
Item 4d wants the fix at the ENGINE level instead, which would make every consumer's
prose-level workaround unnecessary. Real, well-scoped unit.

The `docs/how-to/author-a-plan-loop-track.md` "Execution Inputs: Roster" removal
instruction is **stale** — that exact heading doesn't exist in the current file. The
doc already has a "Roster" bullet (`~L45-51`) with UPDATED wording reflecting I21's
config-binding-by-default behavior ("each declared step now binds a default executor
from its own operation's `policy.capability`; record a roster string here only [as
override]") — this already reads like item 4d's own intended end-state, likely from
an earlier unit's edit. Whoever picks this up should read the doc fresh, not assume
the phase text's literal heading/removal instruction is still accurate.

## 8. Protocol rename + stub removal (item 4a)

**Large blast radius, and one confirmed factual error in the phase text.**
`standalone-master-coordination-loop` has 29 real references across
`core/coordination-protocols/`, `core/protocol-packs/group-thinking.json`,
`src/verbs/coordination/show.mjs` and `launch-master-loop.mjs`, 22 test files
(including one literally named after the id,
`test/runner/flow-definition-standalone-master-coordination-loop.test.mjs`), and —
critically — the BRAND NEW `domains/coding/skills/fgos-code-change/SKILL.md` (built
in I28, merged this same track) names it as the FlowDefinition its own lifecycle
lowers into. An additive-alias approach (register the new id alongside the old,
update `fgos-code-change` to reference the new id going forward, leave old
sessions/tests targeting the old id functional) looks safer than a hard rename given
this blast radius — worth a dedicated unit with its own decomposition review, not a
quick sub-item of a bigger unit.

**Confirmed factual error**: item 4a's text lists `fgos-group-thinking` as one of "the
deprecated ... stubs" to remove when the compat window closes. It is NOT a stub —
`core/skills/fgos-group-thinking/SKILL.md` is 1,609 words of live, full operational
content (the core-facing protocol-pack selection gate). This exact question was
already investigated and LOCKED by Unit I26: "the locked decision REVERSED it (do not
stub) rather than executing the superseded plan text" (see I26's own unit report).
Item 4a's wording predates that reversal and was never updated. Whoever drafts the
Phase 7 unit covering this must correct the phase text itself before dispatching —
only `fgos-plan-loop` and `fgos-code-panel` (both genuinely stubbed by I29) belong in
this removal list.

## 9. Drift tests (item 5) — coverage per sub-bullet

Already covered by earlier units (confirm, don't rebuild):
- "generated skill projections are byte-identical to canonical sources" — covered
  (`test/install-packaging.test.mjs`, `coordination-schema.test.mjs`, others; also
  directly confirmed in I26/I28/I29's own reports).
- "facades restate no rule owned by the driver-discipline fragment" —
  `test/skills/coordination-phase4-driver-discipline.test.mjs` (confirmed directly
  during I28's own review pass this track).
- "runtime skills ... none triggers on keyword matching of implement/code" —
  `test/runner/capability-match.test.mjs`, `test/setup/checks.test.mjs`,
  `test/setup/capability-catalog-doctrine.test.mjs`.
- "every registered capability declares a valid `serves` set ... every protocol
  operation's `policy.capability` resolves" — same doctor checks as item 4 above
  (`registrations.mjs`).
- "no portable FlowDefinition carries an executor pin through policy.capability/
  distinctProviderFrom" — likely covered by `assertNoPortableExecutorPin`
  (`session-engine.mjs`, referenced in `flow-definition.md`'s PolicyPatch section)
  plus the binding conformance tests; not independently re-verified this pass, worth
  a direct check before assuming done.

No direct hit found under obvious terms (genuinely new work, OR exists under
different vocabulary — worth a closer targeted search before assuming a gap):
- "documented commands equal command registry".
- "runtime skills contain no raw request JSON" (I28's own SKILL.md explicitly touts
  "semantic doors only, no raw request JSON" as a design property, but no dedicated
  drift TEST enforcing this repo-wide was found).
- "stale auto-close language is absent from current sources" (a similar-sounding
  check exists per I26's own report — "stale implicit close language remains absent"
  — worth checking if that's the same test under different wording before assuming
  a gap).
- "every referenced contract template resolves".

## 10. Full suite / replay corpus / before-after report (items 6, 7)

Replay mechanism (`src/runner/coordination/replay.mjs`) exists and is exercised by
`scripts/measure-coordination-baseline.mjs` + `test/runner/coordination-baseline-
measurement.test.mjs` — this script is the closest existing thing to a "before/after
performance and quality" tool, already versioned (`CONTRACT_VERSION =
'coordination-baseline.v1'`) and already retargeted by I29 to measure the two current
canonical skills (`fgos-architecture-panel`, `fgos-code-change`).

**No stored historical "before" baseline result found anywhere in `plans/` or
`docs/`** — searched both trees directly, nothing. If item 7's before/after comparison
is meant to span this whole track (pre-Phase-4 vs. post-Phase-7), the "before" number
was never captured and may need to be reconstructed by running the baseline script
against a pre-Phase-4 git ref in a scratch worktree, not assumed to exist already.

## Recommended rough unit split (Lead's call, not final)

Roughly 6 units, by real independent blast radius found above:

1. **Contract versioning + status envelope** (items 1, partial 4b-doc-sync) — extend
   the existing `contractVersion` pattern to the CLI status/show envelope; fix the
   canonical `flow-definition.md`'s missing `distinctProviderFrom` PolicyPatch
   section (real, confirmed drift). Low external dependency, can go first.
2. **Capability-declaration engine-level hard-refusal** (item 4d, engine half only) —
   promote `capability.undeclared` to `severity: 'hard'` in
   `capability-plan-lint.mjs`; re-verify (don't blindly remove) the
   `author-a-plan-loop-track.md` Roster section since the phase text's instruction
   is stale. Should land BEFORE any unit touches skill-level plan-lint callers again,
   since it changes engine behavior every skill relies on.
3. **Read-only binding source investigation + decision** (item 4c) — starts with
   re-verifying whether the two mechanisms actually compete before assuming a
   migration is needed; may resolve to "no action, document why" rather than a
   config migration.
4. **Protocol rename + stub-list correction** (item 4a) — highest blast radius (29
   refs, including the just-built fgos-code-change), warrants its own decomposition
   review given this track's repeated experience that high-blast-radius renames hide
   real complexity. Must correct the `fgos-group-thinking` stub-list error before
   dispatch. Additive-alias approach recommended over a hard rename.
5. **Drift test suite** (item 5) — audit each of the 9 sub-bullets for real
   existing coverage first (this research made a start; needs finishing, especially
   the "no hit found" ones), then write only the genuinely missing tests.
6. **Doc/CHANGELOG sweep + baseline report** (items 3, 6, 7) — the remaining
   command-registry gap I29 already named, plus running the baseline script fresh
   (and reconstructing a "before" number from an early git ref) for the before/after
   report. Naturally last, depends on 1-5 having landed so the "after" number
   reflects the finished phase.

Config/doctor registration (item 4) needs no dedicated unit — already done, just
confirm in whichever unit's own verification touches it.

## Unresolved questions (for Lead, not guessed here)

- Should unit 1's status-envelope versioning be a new top-level `contractVersion`
  field mirroring `ACTIONS_CONTRACT_VERSION`, or something narrower? Not decided here.
- Is the "before" baseline for item 7 meant to span the whole track (pre-Phase-4) or
  just Phase 6/7's own delta? Changes how far back to reconstruct from.
- Item 5's "no hit found" sub-bullets need one more targeted pass before committing to
  "these are gaps" — I did not exhaustively search under every plausible synonym.
