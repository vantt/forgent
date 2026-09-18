# P10-KERNEL-FIX — Red-Team Recheck of Fix Round 2

Status: REQUEST CHANGES | Reviewer: adversarial Red-Team recheck 2 (independent) | Date: 2026-09-04

Target: `§10 Fix Round 2`'s claim that all seven findings accepted in `§9` are
resolved.
Worktree: `/home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9`
(uncommitted diff to `src/runner/coordination/session-engine.mjs` +
`test/verbs/coordination-aggregation-surface.test.mjs`, on top of Fix Round 1's
own six-file diff).

## Verdict

**REQUEST CHANGES.** One HIGH, three MEDIUM, one LOW. No new code defect — the
Round 2 *code* is correct everywhere I could break it. The HIGH is that the code
is **unprotected**, and two MEDIUMs are load-bearing factual errors in the
accepted-Gap text the Coordinator's own disposition rests on.

Fix Round 2 is the strongest round of the three. Everything I attacked in the
kernel logic held: N4's new exactly-one-actor `Set` rule is correct across seven
shapes including the three the Fixer never tested, NEW-HIGH-B's fixture fix is
genuinely falsifiable (independently reproduced from scratch, not trusted), the
new close refusal has exactly one production caller and it has a
`CoordinationError`-aware catch, the new throws cannot leak a session lock, and
the regression numbers reproduce to the test.

But:

- **the two HIGH fixes this round exists for (N1, N2/NEW-HIGH-A) have ZERO test
  coverage** — I reverted the entire Round 2 resolution block to its exact Fix
  Round 1 shape, re-introducing both accepted HIGH bugs, and the coordination
  suite stayed byte-identically green. That is the same defect class as
  NEW-HIGH-B, which is the finding this very round was dispatched to fix;
- **`§5`'s N3 Gap states a scope that is false** — I proved by probe that it
  applies to *every* declared-protocol session, not only those declaring
  `completion.aggregation`, which is how it was accepted as narrow;
- **N1's new refusal is unreachable through `run.mjs`**, the only production
  caller — a consequence of the same N3 code path, and not disclosed in §10.

Details, with recorded output, below.

## Method

Every line labelled BASELINE / MUTATED / PROBE is recorded stdout from a real
run, never reasoning.

- Built a throwaway mutation-testing tree at
  `.claude/worktrees/_rt2scratch` (git-ignored; **deleted after use** —
  the real worktree's `session-engine.mjs` verified byte-identical by
  `md5sum` before and after, `7aaccdd306b12959bd211a8fce66bcec`, and was
  never edited).
  It was placed *inside* the repo, not `/tmp`, so Node's upward `node_modules`
  lookup resolves `yaml` — this removes the 27 environmental failures the
  previous recheck round had to work around.
- Five deliberate mutations (M1–M5), each run against the real test suite.
- Three probes written from scratch, not adapted from the Fixer's:
  `probe-n1-e2e.mjs` (production-door reachability),
  `probe-drift-show.mjs` (real `show` verb under drift),
  `probe-n4-actor-set.mjs` (seven graph shapes against the new `Set` rule,
  reached by temporarily exporting `actorGatingOperationIds` in the scratch
  copy only).
- Re-ran both regression tiers myself and verified each reported failure by
  direct inspection rather than accepting its label.

---

## R2-HIGH-A — Fix Round 2's two HIGH fixes (N1 and N2/NEW-HIGH-A) ship with zero regression tests. Reverting them leaves the suite green.

**Where:** `session-engine.mjs:3292-3319` (the unified resolution/drift block).

This is the decisive result of this recheck. I replaced the entire Round 2
resolution block with Fix Round 1's exact shape — resolution failure degrades on
BOTH doors (N1's bug), drift throws only at close and a drifted READ classifies
against the drifted definition (N2/NEW-HIGH-A's bug) — and ran the coordination
regression:

```
BASELINE (unmutated Fix Round 2 code, md5 7aaccdd3...)
  node --test 'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' \
              'test/runner/flow-definition*.test.mjs' 'test/cli/coordination.test.mjs'
  ℹ tests 724   ℹ pass 723   ℹ fail 1
  ✖ src/runner/coordination/** imports no Work lifecycle, ... module   (worktree-path false-fail)

MUTATED M5 (resolution block reverted to Fix Round 1 shape -- BOTH HIGH bugs restored)
  ℹ tests 724   ℹ pass 723   ℹ fail 1
  ✖ src/runner/coordination/** imports no Work lifecycle, ... module   (the same false-fail)
```

**Zero delta.** Both accepted HIGH bugs can be silently reintroduced by any
future edit and nothing in this repository will notice.

Confirmed independently by search — no test asserts either new behavior:

```
$ grep -rn "could not be resolved\|unresolvable definition" test/
(no matches)                       <- N1's refusal: not asserted anywhere

$ grep -rn "drifted definition" test/
test/runner/coordination-aggregation.test.mjs:993          (validateSessionAggregation, pre-existing)
test/runner/coordination-deliberation-ledger.test.mjs:1050 (pre-existing)
test/verbs/coordination-aggregation-surface.test.mjs:539   (Fix Round 1's HIGH-2 CLOSE refusal)
```

The one drift test that exists (`:539`) asserts the *close* refusal Fix Round 1
already shipped. It says nothing about the read, which is why it stays green
under M5.

`§10.6`'s regression evidence is real but answers a different question: "did
this change break anything" — not "is this change protected." `§10.1`'s own
evidence is `fixround2-probe.mjs`, a throwaway file in the Fixer's session
scratchpad: not in the repository, not runnable by anyone else, gone the moment
that session ended. The net test count for the whole round is **+1**, and that
one test is the NEW-HIGH-B/N4 split — nothing for N1 or N2.

This is exactly the standard `§9` applied to NEW-HIGH-B ("the new regression
test cannot actually fail"), and this round's answer to it was to make that one
fixture falsifiable while adding its own two HIGH fixes with no test at all. It
is also `AGENTS.md`'s own definition-of-done question 5 ("new or changed
behavior gets a matching test").

**Fix** — two tests in `coordination-aggregation-surface.test.mjs`, both of
which my probes already prove are straightforward to write:

1. **N1**: a declared-protocol session with one required operation pending; drop
   an unrelated malformed sibling file into `.fgos/coordination-protocols/`;
   assert `closeSessionByQuorum` throws `CoordinationError` matching
   `/could not be resolved -- refusing to close against an unresolvable definition/`.
   (Must call the engine directly — see R2-MEDIUM-C for why the `run` verb
   cannot reach it.)
2. **N2/NEW-HIGH-A**: the drift fixture at `:539`'s shape, but asserting the
   READ — `evaluateSessionQuorum`/`show` reports the genuinely-completed actor as
   `completed`, not `missing`, after the bound protocol's version is bumped in
   place.

Then confirm each fails under M5.

---

## R2-MEDIUM-B — `§5`'s N3 Gap states a scope that is factually false, and the false scope is what made it acceptable

**Where:** `P10-KERNEL-FIX.md §5`, the N3 bullet; `src/verbs/coordination/run.mjs:231-243`.

The Gap text says the uncaught `FlowDefinitionError` fires:

> "...whenever the bound protocol declares `completion.aggregation`."

It does not. `aggregationCloseParams` resolves the protocol **before** it checks
whether an aggregation is declared:

```js
function aggregationCloseParams(coordinationId, engineOpts) {
  const { manifest, aggregations } = resumeSession(coordinationId, engineOpts);
  if (!manifest.definitionRef) return {};
  const definition = loadCoordinationProtocol(...);                                   // 236 -- UNCONDITIONAL
  if (definition.metadata.version !== manifest.definitionRef.version) throw ...;      // 237
  if (definition?.spec?.profile?.completion?.aggregation === undefined) return {};    // 243 -- too late
```

Proved live (`probe-n1-e2e.mjs`). The probe protocol declares
`completion: { mode: 'synthesize' }` and **no `aggregation` key at all**:

```
PROBE 2c -- PRODUCTION door (runCoordinationUseCase, i.e. `fgos coordination run`)
  THREW OUT OF runCoordinationUseCase -> [FlowDefinitionError/parse]
     flow-definition: cannot parse ".../.fgos/coordination-protocols/zz-broken.json":
     Unterminated string in JSON at position 53 (line 1 column 54)
  manifest.status= active
```

`FlowDefinitionError extends Error` (`src/runner/definitions/schema.mjs:160`),
not `CoordinationError`, so `run.mjs:529`'s `err instanceof CoordinationError`
guard is false and line 532 rethrows it out of the verb.

**Why this matters rather than being a wording nit.** `§9` accepted N3 as a Gap
on the basis that it was narrow and pre-existing. Its real scope is *every*
declared-protocol session — including all three group-thinking-lite protocols
this entire cell exists to fix, none of which declare an aggregation. One
unrelated half-written file anywhere in `.fgos/coordination-protocols/` hard-
crashes `fgos coordination run` for every coordination session in the project.
That is a different decision than the one the disposition was offered.

The behavior is genuinely pre-existing and outside `session-engine.mjs` — I am
not asking for it to be fixed here. I am asking for the Gap text to state its
real scope, because the accept-as-Gap judgment was made against a wrong one.

---

## R2-MEDIUM-C — N1's new close refusal is unreachable through the only production caller, and `§10` does not say so

**Where:** `session-engine.mjs:3303-3307` vs `run.mjs:526`.

`closeSessionByQuorum` has exactly one production call site
(`grep -rn closeSessionByQuorum src core bin` — everything else is prose in
comments and `SKILL.md`). At that site, `aggregationCloseParams(...)` is
evaluated as the argument, so on the exact N1 scenario it throws first
(R2-MEDIUM-B) and the engine is never entered. Same probe, all three doors on
one identical session:

```
STEP 1 -- clean registry; "synthesize" deliberately NOT dispatched
  closed= false
  closeRefusalReason= closeSessionByQuorum: session "coord_rt2_n1" is missing required actor(s)
                      [coordinator-actor] and declares no partialPolicy ...
  quorum.missing= [ 'coordinator-actor' ]

STEP 2 -- drop ONE unrelated malformed sibling into the registry
  2a. ENGINE door (direct closeSessionByQuorum)
      REFUSED -> [CoordinationError/validation] classifySessionQuorum: session "coord_rt2_n1" was
      opened against definition "...@1.0.0", but the definition could not be resolv...   <- N1 works HERE
  2b. READ door (direct evaluateSessionQuorum)
      OK  missing= []  completed= [ 'coordinator-actor', 'researcher-a' ]
  2c. PRODUCTION door (runCoordinationUseCase)
      THREW OUT OF runCoordinationUseCase -> [FlowDefinitionError/parse]                 <- never reaches 2a
  manifest.status= active
```

N1's engine-boundary hardening is correct and worth keeping — a direct engine
caller now fails closed instead of silently completing, and that is real
defence in depth. But `§10.1`'s evidence is engine-level only, and neither
`§10.1` nor `§10`'s Summary says so; the Summary reads as a user-facing fix
("N1's malformed-sibling close now refuses with a correctly-attributed reason
instead of silently closing"). Through the door a user actually reaches, the
before/after behavior is unchanged: a hard `FlowDefinitionError` crash, both
before and after this round.

**Fix:** one sentence in `§10.1` scoping the N1 claim to the engine door, and a
cross-reference to the N3 Gap for what the verb layer still does. No code change
requested.

---

## R2-MEDIUM-D — `§5`'s version-drift Gap bullet is stale: it still describes Fix Round 1, and points the reader at the section `§10.1` corrects as false

**Where:** `P10-KERNEL-FIX.md §5`, lines 380-391.

The bullet reads:

> "`evaluateSessionQuorum`'s own plain read (and `show.mjs`'s use of it)
> deliberately does NOT enforce this — it stays exactly as permissive under
> drift as it was before this fix ... **See §7** for the full rationale and
> live-reproduced evidence."

Round 2 changed the read path (`definition = drifted ? null : resolved`) — the
bullet describes a posture that no longer exists as written, and its only
cross-reference is `§7.2`, which `§10.1` states outright was **false** and
which this round corrected. A reader who lands on `§5` — the section whose whole
job is to be the durable list of residuals — gets the superseded story plus a
pointer to a retracted one. This is the citation-drift class this track has
flagged before.

Also missing from `§5`: the read-path degrade's own residual (R2-LOW-E below).
`§5` gained three new bullets this round (N3, NEW-LOW-D, the 2+-actor shape) and
none of them covers what `show` now reports under drift or resolution failure.

**Fix:** rewrite the bullet to describe the Round 2 symmetric posture and point
at `§10.1`; add R2-LOW-E as its own bullet.

---

## R2-LOW-E — the read-path degrade replaced NEW-HIGH-A's false `missing` with a false `completed`, silently, on the same command

Live-reproduced through the real `show` verb (`probe-drift-show.mjs`).
Ground truth: `coordinator-actor` is bound to `review` and `synthesize`, both
required; `synthesize` was **never dispatched**.

```
--- show BEFORE drift (clean registry) ---
  definitionRef = {"id":"test.coordination-protocol.aggregation-surface","version":"1.0.0"}
  quorum.completed = [ 'researcher-a' ]
  quorum.missing   = [ 'coordinator-actor' ]          <- correct
  drift field present? []

--- show AFTER the author edits the bound protocol in place and bumps to 1.0.1 ---
  definitionRef = {"id":"...","version":"1.0.0"}   (on-disk protocol is now 1.0.1)
  quorum.completed = [ 'coordinator-actor', 'researcher-a' ]
  quorum.missing   = []                              <- FALSE: "synthesize" was never performed
  drift field present? []
--- close under drift (engine door) ---
  REFUSED -> [CoordinationError/validation] ... refusing to close against a drifted definition
```

The same flip happens on a plain resolution failure, with no drift at all —
probe 2b above reports `completed = [coordinator-actor, researcher-a]` after one
unrelated malformed file is dropped in the registry.

**I am not asking to reverse this.** It is the pre-fix answer, the previous
red-team recommended exactly this degrade, `§9` chose it deliberately over the
alternative (an explicit drift field in `show`'s output), and the close door
still refuses, so no state can be corrupted by it. I checked the blast radius
rather than assuming: `grep -rn '\.quorum\b|quorum\.missing|quorum\.completed'
src core/skills bin` finds **no** production consumer of the quorum payload
beyond `show`/`run` rendering — nothing branches on it.

What I am flagging is two narrower things:

1. `§10.1`'s word for this is "**honest**." For a multi-binding actor it is not
   honest, it is loose in the other direction — the read silently switches
   semantics (strict when clean, loose when drifted) on the same command against
   the same session, with nothing in the payload saying which rule produced the
   answer. `definitionRef` even keeps reporting the stale `1.0.0`.
2. It is named in no Gap. The previous round's second option — an explicit drift
   indicator in `show`'s output — remains the cheap way to make the answer
   non-silent, and is worth recording as the follow-up rather than losing.

---

## What I attacked and found clean

Reported plainly instead of inflated into low-severity findings.

**N4/NEW-MEDIUM-C's `Set` rule is correct across every shape, including the
three the Fixer never tested.** Direct probe of `actorGatingOperationIds`
(`probe-n4-actor-set.mjs`), `synthesize` = `outputOperationRef`:

```
S1  one actor binds "synthesize"              a1 gating = ["review"]                    <- excused, correct
S2  two actors bind it                        a1 = ["review","synthesize"]  a2 = ["synthesize"]
S3  THREE actors bind it                      a1,a2,a3 all keep "synthesize"            <- none excused
S4  ONE actor binds it at TWO graph nodes     a1 gating = ["review"]                    <- Set dedupes, still excused
S5  a1 + a binding with NO `actor` field      a1 gating = ["review"]                    <- actor-less ref not counted
S6  "synthesize" bound to NOBODY              a1 gating = ["review"]
S7  actorId === undefined                     gating = []                               <- no undefined===undefined trap
```

S4 is the specific trap the recheck brief asked about: the same actor bound at
two nodes deduplicates to `size === 1` and stays excused — it cannot make a
legitimately-single-actor case look multi-actor, and S3 confirms 3+ actors
behave like 2. `boundActorIds` is built from a fresh scan per call, so there is
no cross-call state to poison.

**NEW-HIGH-B's fixture fix is genuinely falsifiable — verified independently,
from scratch, not trusted.** Three mutations, all caught:

```
M1  revert the actor-aware exclusion to operation-id-only (the pre-Fix-Round-1 bug)
    ✖ ...N4/NEW-MEDIUM-C (b) + NEW-HIGH-B...
      AssertionError: actual: []                          expected: ['analyst-actor','coordinator-actor']
    ℹ tests 14  pass 13  fail 1

M2  revert N4 to Fix Round 1's graph-order "first binding wins" heuristic
    ✖ ...N4/NEW-MEDIUM-C (b) + NEW-HIGH-B...
      AssertionError: actual: ['analyst-actor']            expected: ['analyst-actor','coordinator-actor']
    ℹ tests 14  pass 13  fail 1

M4  make the exclusion never apply (boundActorIds.size === 99)
    ✖ ...N4/NEW-MEDIUM-C (a)...  + 3 pre-existing aggregation tests
    ℹ tests 14  pass 10  fail 4
```

M1 and M2 discriminate the two separate mechanisms independently, and M4 shows
test (a) protects the single-actor no-regression case. The fixture change is
real.

**The new close refusal has exactly one production caller, and it is guarded.**
`closeSessionByQuorum` and `classifySessionQuorum` each have one non-comment
call site outside the engine; `run.mjs:525-534` wraps it in a
`CoordinationError`-aware catch. No verb, MCP surface, headless adapter, or
group-thinking pack path calls either with `enforceDefinitionVersion` set. No
read call site (`show.mjs:176`, `run.mjs:522`, `run.mjs:535`) can set it — all
three pass the same `engineOpts` shape (`{cwd, repoRoot, packageRoot,
runnerConfig, timeoutMs}`), and the close site's `{ ...opts,
enforceDefinitionVersion: true }` spread puts the literal last, so a caller
cannot turn it off either.

**Degrading to `definition = null` loses nothing else.** `definition` is read in
exactly two places in `classifySessionQuorum` — `actorGatingOperationIds` and
`resolveBindingOutcome` — and the returned frozen object's shape is identical on
both branches. No caller loses a field.

**No session-lock leak from the new throws.** They fire inside
`withSessionLock` → `withEventsLock`, whose body is
`try { return fn(); } finally { lock.release(); }` (`src/state/events.mjs:404-411`).
A refused close cannot strand `events.lock`.

**`manifest.definitionRef.version` is always present**, so the
`drifted` comparison cannot be poisoned by an older session manifest:
`openDeclaredProtocolSession` refuses to record a `definitionRef` without a
version (`session-engine.mjs:2076`, "a session's definitionRef requires a
stable, versioned reference").

**No weakened assertions, no disabled tests.** Zero `assert` lines removed from
either file this round touched; zero `.skip`/`.only`/`.todo` introduced anywhere
in the diff. The removed assertions in the three group-thinking-lite files are
Fix Round 1's, and the ones the previous recheck flagged are re-added in the
stronger cross-call scenario — verified by grep, e.g. `"the FIRST authorize step
really granted a new authorization"` reappears at
`coordination-group-thinking-rfc-review-lite-pack-conformance.test.mjs:409`,
reworded to name the separate call.

**Both regression tiers reproduce exactly, and I verified each failure rather
than accepting its label.**

```
Combined focused regression (§10.6's own command)
  ℹ tests 761   ℹ pass 760   ℹ fail 1
  ✖ src/runner/coordination/** imports no Work lifecycle, merge, worktree, ... module
    -> every reported violation resolves through a path containing the literal substring
       "worktree" (e.g. .../step-09-mvp6-to-mvp9/src/runner/dispatch/config.mjs
       "matches forbidden \"worktree\"").  Environmental, as documented.

Full-repo sweep
  ℹ tests 5558   ℹ pass 5550   ℹ fail 1   ℹ skipped 7
  ✖ ask/answer round-trip on a genuinely legacy durable-doing item ... (seq: 3 vs seq: 2)
    -> test/cli/fgos-intake-4.test.mjs, the standing baseline this whole track reproduces.
       Work-intake lifecycle; nothing under src/runner/coordination/**.
```

Both match `§10.6` to the test. `coordination-store.test.mjs`'s known
load-induced flake did not reproduce on either of my runs.

---

## Recommended actions, in order

1. **R2-HIGH-A** — add the two named regression tests (N1's unresolvable-close
   refusal at the engine door; N2's honest drifted read), then confirm each
   fails under the M5 revert. This is the blocking item.
2. **R2-MEDIUM-B** — correct `§5`'s N3 bullet: the uncaught `FlowDefinitionError`
   fires for **every** declared-protocol session, not only aggregation-declaring
   ones, because `run.mjs:236` loads before the `:243` check. Re-confirm the
   accept-as-Gap decision against the real scope.
3. **R2-MEDIUM-C** — scope `§10.1`/`§10 Summary`'s N1 claim to the engine door
   and cross-reference N3 for the verb layer.
4. **R2-MEDIUM-D** — rewrite `§5`'s stale drift bullet to describe the Round 2
   posture and cite `§10.1` instead of the retracted `§7.2`.
5. **R2-LOW-E** — add the read-degrade residual (silent false `completed` under
   drift or resolution failure, no drift indicator in `show`) to `§5` Gaps, and
   soften `§10.1`'s "honest."

Items 2–5 are documentation-only. Item 1 is code (test) work.

## Unresolved questions for the Coordinator

1. Does R2-MEDIUM-B's corrected scope change the accept-as-Gap decision on N3?
   Wrapping `aggregationCloseParams`'s own load in the same
   `FlowDefinitionError → CoordinationError` translation `run.mjs`'s catch
   already expects is a small, contained change in one verb file — but it is
   outside this cell's stated kernel-file boundary, so it is your call, not
   this round's.
2. Is the `show`-side drift indicator (R2-LOW-E) wanted as a follow-up cell, or
   is the silent degrade the settled end state?
