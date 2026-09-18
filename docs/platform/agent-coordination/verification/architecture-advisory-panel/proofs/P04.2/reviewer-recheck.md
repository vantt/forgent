# P04.2 Reviewer recheck — fix round 1

Reviewer: independent (`p04-2-reviewer`), 2026-09-06. Rechecked against
commits `a5112f76` (fixes) + `32ef2dd6` (report/evidence). Verified from
source, live execution, and re-run tests — not from the Doer's report.

**Verdict: 8/10 fixed, 0/10 not fixed, 2/10 partial (both partials
explicitly disclosed by the Doer, neither silently dropped).** The new
`actors[]` persistence finding is real and correctly characterized — I
confirmed it independently from `run.mjs`'s actual resolution logic. Two
new low/medium issues surfaced during this recheck (RC1, RC2).

---

## R1 — empty `grantedContextRefs` — **FIXED (live-verified)**

All four named files now name real refs; `grep -n grantedContextRefs`
across the family returns zero `[]` occurrences in any JSON fragment:

| File | Granted refs |
|---|---|
| material-context-reopen.md:107 | synthesize-recommendation, critique-proposals, assess-constraints |
| alternative-and-composite-reopen.md:91 | shape-alternative-proposal, shape-constraint-proposal, synthesize-recommendation |
| clarification-and-challenge.md:138 | synthesize-recommendation, critique-proposals |
| final-decision-and-defer.md:95 | explain-recommendation |

**I re-ran my original falsification and it no longer reproduces.** Same
method as the first round: copy the conformance full-chain test, substitute
the *published* fragment's granted refs, print the resulting Assignment's
grant.

```
RECHECK revise contextGrant.refs = ["asgn_aap_driver_op_008","asgn_aap_driver_op_006","asgn_aap_driver_op_007"]
RECHECK   synthId=asgn_aap_driver_op_008 critiqueId=asgn_aap_driver_op_006 assessId=asgn_aap_driver_op_007
→ pass 1 | fail 0
```

The grant is non-empty and names exactly the three assignments the
surrounding prose claims the synthesizer re-weighs. First round produced
`{"refs":[]}` on the same code path; it does not now.

The prose fix is also stronger than my recommendation — material-context-reopen.md:74-82
now states the failure mode explicitly ("An empty grant is schema-legal and
dispatches without error, but it hands the synthesizer none of the
proposals, none of the critique, and not even its own prior synthesis")
rather than just correcting the JSON silently.

## R2 — protocol id + per-actor routing — **FIXED (re-counted)**

Re-grepped all 8 files myself. Was 3/8 id, 1/8 `actors[]`, **0/8 both**.
Now:

```
alternative-and-composite-reopen.md      id=1 actors=1
clarification-and-challenge.md           id=2 actors=1
clear-start.md                           id=1 actors=1 (8 role bindings)
decision-request-and-resume.md           id=1 actors=1 (8 role bindings)
final-decision-and-defer.md              id=2 actors=1
heterogeneous-and-homogeneous-roster.md  id=2 actors=2 (16 role bindings)
material-context-reopen.md               id=3 actors=2
unclear-start.md                         id=1 actors=1 (8 role bindings)
```

**8 of 8 now show both.** Opening requests carry the full 8-role roster;
reopen/close fragments carry the single role they actually dispatch, which
is correct and honest rather than padded. `CHANGELOG.md:15`'s claim ("each
pinning the real protocol id and showing explicit per-actor `actors[]`
routing without pinning it in the FlowDefinition") is now **true as
written** — no changelog edit was needed, which is the right resolution of
the fork I flagged.

## R3 — unconfined `claude` in the homogeneous roster — **FIXED**

All 8 homogeneous bindings are now `claude-bwrap`, tier-differentiated
(`critical` for lead-advisor/synthesizer/red-team, `analytical` for the
rest) — heterogeneous-and-homogeneous-roster.md:109-118.

**Confinement re-confirmed at source, not assumed.** P00.1's corrected
Phase-01 allowlist (P00.1.md:226-231) admits exactly `codex-readonly`,
`claude-bwrap`, `agy-bwrap`, and excludes `claude-reviewer`/`agy-plan`
(falsified), `codex-bwrap` (non-runnable), `codex-cli`/`agy-cli`/`agy-sandbox`
(mutation evidence). `claude-bwrap` "survived corrected test (real `--chdir
<checkout>`, no `--tmpfs /tmp` masking the target): in-tree/absolute/`.git`/shell
writes all EROFS-blocked" (P00.1.md:159-161).

The warning at lines 126-144 is real and specific: it names the bare
`claude`/`agy`/`codex-cli` shapes, quotes the live `.fgos/config.json`
resolution (`--permission-mode acceptEdits --allowedTools Bash(git add:*),
Bash(git commit:*)`), states why it is worse than the `tsk-1o4` fallback
("it would actually run"), and cites the BOUNDS #2 violation.

It also answers my own unresolved question rather than dodging it: "If no
confined single-provider pair exists on a host at all, homogeneous fallback
is not currently safe to run — say so to the person rather than substituting
an unconfined name to make the roster 'work.'" That is the correct call.

## R4 — "reproduced in full" — **FIXED**

decision-request-and-resume.md:17 now reads "**condensed from the source**"
with the link retained.

## R5 — constructed challenge misattributed a declined recommendation — **FIXED, and better than I asked**

The turn was re-grounded, and the file now names the exact failure mode I
flagged before showing the corrected turn: "A challenge that accuses the
panel of recommending the declined work would be attacking a position
nobody holds."

I verified all three new source citations byte-for-byte:

| Citation | Source | Verdict |
|---|---|---|
| critic: "notoriously complex state-machine engineering... deeply entrench the multi-process architecture" | `P01.2/critiques/architecture-critic.md:23` | exact, elision marked |
| "Step 4: Do not build robust cold-start coordination yet" | `P01.2/explanation.md:18` | exact, line number correct |
| "partially concessive, not resolving. Step 4 declines exactly the state-machine work Attack 1 names as entrenching..." | `P01.2/synthesis.md:83` | exact, line number correct |

The corrected turn now attacks what was actually recommended (three
deterministic bug fixes + CI), which is the sharper challenge.

## R6 — ceremonial Decision Request — **FIXED**

The literal `[named default]` placeholders are gone, replaced with real,
reasoned defaults: "we'll assume a 1-year retention window for #1 (the
conservative default for trade-signal logs — cheap to shorten later,
expensive to have discarded data you needed), and treat the existing 7-day
window as compliant for every instrument class for #2 (matching your own
standing decision already in force)."

The two questions are now case-grounded in real vnflow artifacts, and I
verified the anchors are real: `alert_dispatch_intraday.py` appears 3× and
`2026-06-22` 2× in `P01.3/scout-report.md`; the 7-day EOD-context lookback
is real and documented in `P01.3/explanation.md:26` and three shaper/critic
prompts. The constructed layer is explicitly labelled ("a hypothetical
layered on top of the real vnflow case (P01.3), not a copy of a real send
and not a real scout finding").

Minor sourcing note, not a finding: the paragraph frames the twist as
something `scout-report.md` "had additionally surfaced", while the 7-day
figure it references actually lives in `explanation.md`/the prompts, not in
`scout-report.md`. The fact is real; only its nearest link is imprecise.

## R7 — no `.json` fixture — **PARTIAL (disclosed)**

`docs/how-to/coordination-examples/architecture-advisory-panel-v1-request.json`
now ships, with the full 8-role confined roster, `aggregateBounds`, and the
protocol id. I ran the doctor check myself:

```
node --test test/setup/coordination-doctor-check.test.mjs
✔ registered and visible to fgos doctor
✖ passes against this repo's own real, published example requests + protocols
✔ fails on a missing examples directory
✔ fails when an example violates the R2 schema boundary
✔ fails when an example references a protocolRef.id that does not resolve
```

The one failure names **only** the two pre-existing group-thinking resume
fixtures (`<the share assignmentId...>` charset). The new AAP fixture
validates cleanly and introduces no new failure.

The reopen-fixture half was **not** shipped, and the Doer says so
explicitly in its own report ("R7's 'ideally a `-reopen-request.json`' half
— not shipped"). I accept the reasoning: a reopen fixture must carry real
assignment ids, and placeholder ids are exactly what makes the two sibling
resume fixtures fail the charset check today. The reopen shape is instead
covered by committed live-proof evidence. **Partial by design, disclosed,
not a silent drop.**

## R8 — silently corrected typo — **FIXED**

final-decision-and-defer.md:16 now reads `tuy nhiên deskop [sic] là 1 mode`,
matching `P01.2/human/2-person.md` exactly.

## R9 — reopen-budget table header — **FIXED**

use-fgos-architecture-panel.md:145 now reads `| Costs a reopen invocation? |`.

## R10 — uncommitted live-proof artifact — **PARTIAL (disclosed)**

`proofs/P04.2/fix-round-1-live-proof/` now ships 7 real files
(`request-1-open.json` through `request-6-close.json`, plus
`show-final.json`) and the guide links them at line 84. That is richer
evidence than I asked for — a full 12-operation, 6-invocation session that
reaches `close-dialogue` and completes.

The specific `aap_entry_proof_1` session cited at line 200 still has no
committed artifact of its own. Its claims are nonetheless **true** — I
independently reproduced the `quorum.missing`-by-actor-id and the nine
`pendingDriverAuthorizations` in my first round. The guide has also since
been corrected to note that `answer-specialist-question` is the ninth entry
and correctly carries no `actorId`, which matches what my own run returned.
Partial and disclosed.

---

## The new `actors[]` persistence finding — **INDEPENDENTLY CONFIRMED, from source**

I did not take this on the Doer's word. Verified in three places:

1. `src/verbs/coordination/run.mjs:436` — per-step resolution is
   `findActor(request.actors, step.targetActorId)`, reading **the current
   request only**. There is no manifest lookup anywhere in the actor
   resolution path.
2. `src/verbs/coordination/schema.mjs:144` — `validateActorsShape(undefined)`
   returns `[]`, so a request omitting `actors[]` yields an empty array,
   `findActor` returns `undefined`, and `actorPolicyFields`
   (run.mjs:92-101) falls back to `globalExecutor`/`globalTier` — i.e. the
   CLI flags, or the global default executor when those are absent. No
   error, no warning.
3. The contrast is real: `aggregateBounds` **is** persisted, read back as
   `manifest.aggregateBounds.maxAssignments/maxConcurrency/maxRounds`
   (`src/runner/coordination/session-engine.mjs:544-546`).

So "declare `aggregateBounds` once at open; repeat `actors[]` on every
call" is exactly right. The how-to section (lines 194-210) states this
accurately, names the silent-un-confinement consequence, and ties it to the
Executor Roster warning. I confirmed every reopen/close fragment in all 8
files now repeats the relevant `actors[]` entry.

## Disposition-table completeness

The Doer's report enumerates **R1 through R10 individually**, numbered
1-10, each with an explicit disposition — plus separate explicit notes on
R7's unshipped half and R10's partial satisfaction. No finding of mine was
merged, summarized away, or silently dropped. This is a genuine improvement
over P04.1's own handling.

## Test runs (all re-run by me)

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' \
  'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'
→ tests 757 | pass 757 | fail 0

node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs
→ tests 39 | pass 39 | fail 0

npm test
→ tests 5695 | pass 5686 | fail 3 | skipped 6
```

**Byte-identical to my first-round run: same 3 failures, 0 new.** All three
remain a strict subset of plan.md's recorded 4-item baseline:

1. `test/cli/fgos-intake-4.test.mjs:318` — legacy durable-doing ask/answer
2. `test/report/enduser-index.test.mjs:187` — missing `docs/tutorials`
3. `test/setup/coordination-doctor-check.test.mjs:42` — placeholder charset
   in the two **pre-existing** group-thinking resume fixtures

Critically, shipping the new `.json` fixture did **not** add a fourth
failure — I checked the assertion message, and it names only the two
sibling fixtures.

---

## New findings from this recheck

### RC1 (medium, hard-correctness) — the one new-session example still omits `aggregateBounds`

`architecture-advisory-panel-v1-material-context-reopen.md:137-158` opens a
genuinely **new** session (`"coordinationId": "aap_mdview_example--followup-1"`,
a fresh `phase-framing` entry) and declares no `aggregateBounds`.

Every other opening request in the family was corrected — `aap_mdview_example`
(clear-start:38), `aap_vnflow_example` (unclear-start:36),
`aap_heterogeneous_example` (:22), `aap_homogeneous_example` (:106) all
carry `{maxRounds: 20, maxAssignments: 30}`. This one does not, so it
inherits the platform default `maxRounds: 10` — precisely the condition
RT-P04.2-08 established as blocking, because it makes the documented
Decision Dialogue flow (and `close-dialogue`, the only route to
lead-advisor quorum) unreachable.

The fragment as shown dispatches only one operation, so it will not trip
the cap immediately — but the file frames it as a full follow-on advisory
cell that continues from there, and the how-to's own rule is "declare once
at open." A reader who copies this block gets a session that silently caps
at 10 rounds.

**Recommendation:** add `"aggregateBounds": { "maxRounds": 20, "maxAssignments": 30 }`
to the `--followup-1` request, same as every other opening request.

### RC2 (low, hard-correctness) — placeholder prose names different operations than the JSON

`architecture-advisory-panel-v1-material-context-reopen.md:83-86` tells the
reader the three placeholders "stand for this session's own real
`interpret-request`/`shape-*`/`critique-proposals`/`assess-constraints`
assignmentIds". The JSON at line 107 actually names
`synthesize-recommendation`, `critique-proposals`, `assess-constraints`.

`interpret-request` and `shape-*` appear in the prose but not the JSON;
`synthesize-recommendation` appears in the JSON but not the prose. A reader
following the prose substitutes the wrong three ids — and since an
incorrect-but-valid grant fails silently (the whole point of R1), this
would not surface as an error.

**Recommendation:** align the prose to the JSON (synthesis + critique +
constraint-findings), or widen the JSON to match the prose. Either is fine;
they must agree.

---

## Unresolved questions

None blocking. RC1 is a one-line fix; RC2 is a wording alignment. Neither
changes any verdict above, and neither reopens a finding I previously
closed.

```
Status: DONE
Summary: Rechecked all 10 of my original findings against source and live execution — 8 fully fixed (R1 re-falsified live and no longer reproduces; R3's confinement re-confirmed against P00.1's corrected allowlist), 2 partial and both explicitly disclosed by the Doer rather than silently dropped. The new actors[]-persistence finding is real and correctly characterized, confirmed independently from run.mjs/schema.mjs/session-engine.mjs. Tests re-run: 757/757 focused, 39/39 wrappers, npm test byte-identical to baseline with 0 new failures. Two new minor issues found (RC1 medium, RC2 low).
Recheck verdict: 8/10 fixed, 0/10 not fixed, 2/10 partial
```
