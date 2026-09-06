# P03.1 Red Team — Recheck After Doer Fix Round 1

**Date:** 2026-09-06
**Branch:** `group-thinking-plan-loop`
**Fix commits rechecked:** `2a601d5c` (fix), `db65f2a3` (test), `c48d0de7` (docs)
**Method:** every original attack script re-executed live against the fixed tree (same scripts, unmodified), plus a new battery aimed at the fix itself. No verdict below is inferred from the diff.

**Verdict: both original BYPASSED findings are closed. One of the three UNEXPECTED findings is closed, one is closed only against the exact vector the doc claims, and one was intentionally left unchanged — correctly, as I verified independently. One new bypass found.**

---

## Original Finding 1 (MEDIUM) — replay missing the driver-authored-ref refusal → **BLOCKED (fixed)**

Re-ran `attack1-self-attribution.mjs` unmodified. All three shapes that previously sailed through replay now throw:

```
[A1d_replay_asgn]          REPLAY REFUSED -> CoordinationError/validation: ... attributes the turn to
                           "asgn_abc", which is shaped like a driver-authored ref ... -- a driver-authored
                           ref cannot occupy the human-decision slot
[A1d2_replay_contribution] REPLAY REFUSED -> ... "contribution:x" ...
[A1d3_replay_humanturn]    REPLAY REFUSED -> ... "human-turn:x" ...
```

The second path into the same defect — the in-process `appendEvent` bypass, which needed no filesystem tampering — is closed with it. Re-ran `attack6-7-bypass-doors.mjs`:

```
[A7j2 appendEvent, attributedTo.id = "asgn_driverartifact"]  ACCEPTED (write, as before -- appendEvent does no schema validation)
[A7j2-replay accepts it?]  REFUSED -> CoordinationError/validation: ... shaped like a driver-authored ref ...
[A7j2-show renders it?]    REFUSED -> (same error; show can no longer render the forged turn)
```

`show` now refuses rather than rendering the forged record as a legitimate person-attributed turn. The doc contradiction is also resolved: `c48d0de7` corrects T1's Mechanism column to say "all-FOUR `attributedTo` refusals ... each re-checked independently at replay" and extends T8's enumeration to match. Doc and code now agree, and both agree with observed behavior.

## Original Finding 2 (LOW) — `respondsToRefs` ownership not re-checked at replay → **BLOCKED (fixed)**

Re-ran `attack2-disposition-refs.mjs` unmodified. Previously `ACCEPTED -> ["human-turn:never_recorded"]`; now:

```
[A2k replay: turn.respondsToRefs dangling] REFUSED -> CoordinationError/out-of-order-ref:
  ... "human-turn-recorded" event "turn_1" cites respondsToRefs entry "human-turn:never_recorded",
  naming human turn "never_recorded", which has no "human-turn-recorded" event before it in this session's log
```

The asymmetry I flagged is gone: a human turn's own `respondsToRefs` now gets the same out-of-order-ref / dangling-ref / bare-id-near-miss treatment at replay that a disposition's `human-turn:` targetRef already had. Every other assertion in that script re-ran identically to the original round (write-door refusals, `out-of-order-ref` for the disposition case, legit prefixed ref still accepted).

## Original Finding 3 (LOW) — `artifactRef` escape → **PARTIALLY BLOCKED; symlink vector STILL BYPASSED (new evidence below)**

The two vectors I originally reported are closed. Re-ran `attack5-7-cli-door.mjs` unmodified:

```
[A7g1 artifactRef = "../../../../etc/hostname"] REFUSED -> StoreError/validation: ... resolves to
  "/etc/hostname", outside the working directory "/tmp/fgos-coord-run-driver-LSFdA6" -- a human-turn
  artifact must live inside the workspace the session was opened against
[A7g2 artifactRef = "/etc/hostname"]            REFUSED -> (same containment error)
```

But the third case in that same original attack — the symlink — still passes, and I extended it into a genuine bypass of the new check. See New Attack N1.

## Original Finding 4 (LOW) — case-sensitive self-attribution → **UNCHANGED; disposition verified correct**

Re-ran the attack; behavior is unchanged as the Doer stated:

```
[A7i attributedTo.id = WRITER_ID upper-cased] ACCEPTED -> {"type":"person","id":"MASTER-COORDINATOR-1"}
```

**I verified the Doer's grep claim independently rather than taking it.** Across both coordination directories:

```
$ grep -rn "toLowerCase\|toUpperCase\|localeCompare\|normalize(" src/runner/coordination/   → (zero hits)
$ grep -rn "toLowerCase\|toUpperCase\|localeCompare"            src/verbs/coordination/     → (zero hits)
$ grep -rn "/[a-zA-Z^$][^/]*/i[^a-z]" src/runner/coordination/ src/verbs/coordination/      → (zero hits)
```

Zero case-normalizing constructs, and zero case-insensitive regex flags. I also read the module's central identity comparison — `assertDriverIdentity` (`store.mjs:888-895`) is a bare `!==` against `manifest.provenanceRoot.writerId`, and panel-actor matching is `Set.has`. So exact-string identity comparison genuinely is this module's universal convention, and normalizing case in this one door would have made it the sole inconsistent comparison in the module.

**I agree with the Doer's call.** Not a bug; "documented as intentional, characterization test added" is the right disposition. It also adds no attacker capability — T6 already permits a driver to invent any person handle it likes, so a confusable variant grants nothing new.

---

## New Attack N1 (MEDIUM) — a symlink inside the workspace defeats the new containment check

The new guard (`run.mjs`) is **lexical**: it calls `path.relative(ctx.cwd, path.resolve(ctx.cwd, step.artifactRef))` and rejects a result starting with `..`. It never resolves symlinks, while the `fs.readFileSync` two lines later follows them. So a symlink whose *path* is inside the workspace and whose *target* is outside passes the check and gets hashed anyway.

```
$ fs.symlinkSync('/etc/hostname', tempDir + '/human/1-person.md')
[N1a artifactRef="human/1-person.md" -> symlink to /etc/hostname]
  ACCEPTED -> {"appended":true,"artifactRef":"human/1-person.md","revisionIsEtcHostname":true}

$ fs.symlinkSync('/etc', tempDir + '/human/outside')            # symlinked DIRECTORY
[N1b artifactRef="human/outside/hostname"]
  ACCEPTED -> {"appended":true,"artifactRef":"human/outside/hostname",
               "revision":"sha256:4ec33d745fe9c91f895556fbfb47d18ffc07a949d16e40bc1b351989252041e8"}
```

`revisionIsEtcHostname: true` is the assertion that matters: the recorded provenance stamp is a hash of `/etc/hostname`, a file the repo does not contain, while `artifactRef` reads as an ordinary in-workspace path.

**Fair scoping of the claim.** The contract text added in `c48d0de7` says the check closes "a `../` traversal or absolute-path escape" — and it does exactly that; as *written* the claim is true. What is not achieved is the **rationale stated in the same sentence**: "closing a ... escape a hand-authored request could otherwise use to pin a hash against a file the repo itself never contains, which no later reader holding only the repo could ever re-verify." N1 reaches precisely that outcome by another route. Read-only, same-privilege, no escalation — severity is provenance quality, same as the original Finding 3.

**Suggested fix (Coordinator's call):** compare `fs.realpathSync(resolvedArtifactPath)` against `fs.realpathSync(ctx.cwd)` instead of the lexical paths, or `fs.lstatSync(...).isSymbolicLink()` and refuse. Alternatively, narrow the doc's rationale sentence to match what the lexical check actually guarantees.

## New Attack N2 — encoding tricks against the containment check: **all BLOCKED**

Every encoding variant I tried is refused, and the fix is not over-restrictive (the control case still records):

```
[N2a URL-encoded "%2e%2e/%2e%2e/etc/hostname"]   REFUSED (does not resolve to a real file -- not decoded, treated as a literal name)
[N2b "human/./../../../../etc/hostname"]          REFUSED (containment: resolves to /etc/hostname)
[N2c "..\..\etc\hostname"]                        REFUSED (containment)
[N2d null byte in path]                           REFUSED (does not resolve to a real file)
[N2e "//etc/hostname"]                            REFUSED (containment)
[N2f "human/../../../../../../etc/hostname"]      REFUSED (containment)
[N2g "human/../../etc/hostname/."]                REFUSED (containment)
[N2h "human/nested/2-person.md"  (CONTROL)]       ACCEPTED -> revision=sha256:5640017617049...
```

Minor cosmetic note, not a finding: N2c's message reports the path as "outside the working directory" when the resolved path is lexically inside it (a filename literally beginning with `..`). It fails closed, which is the right direction; the message is just imprecise for that edge.

## New Attack N3 — the new `assertHumanTurnIdShape` guard is write-door-only: **residual, within the disclosed T8 boundary**

The new guard works at the write door for every shape:

```
[N3a write turnId="../../other-session"] REFUSED -> ... must not contain a path separator or ".."...
[N3b write turnId="human-turn:nested"]   REFUSED     [N3c write turnId="a/b"]  REFUSED
[N3c2 write turnId="contribution:x"]     REFUSED     [N3c3 write turnId="a..b"] REFUSED
```

It is not mirrored at replay, so a forged log carries a path-shaped `turnId` through and a *live* disposition can then cite it:

```
[N3d REPLAY forged path-shaped turnId]  ACCEPTED -> ["../../other-session"]
[N3e SHOW forged turn]                  ACCEPTED -> ["../../other-session"]
[N3f disposition citing "human-turn:../../other-session"]  ACCEPTED (write door)
[N3g SHOW ownership flag]               ACCEPTED -> [["human-turn:../../other-session", true]]
```

That last line is the interesting one: `show` reports `targetRefOwnedBySession: true` for a ref whose text claims cross-session reach, because `assertDispositionRefOwnedBySession`'s `human-turn:` branch returns early and skips the generic cross-session segment scan — exactly the mechanism the Doer's own code comment cites as the guard's reason for existing.

**Why I am NOT calling this a false claim.** The revised T8 row enumerates what replay re-validates — driver identity, self-attribution, panel-actor, ref-shape, ordinal contiguity, duplicate turnId/externalRef, and `respondsToRefs` ownership — and does **not** list turnId shape. The contract also explicitly scopes the guard to "a direct store API caller." So the doc is honest here; this is a residual inside the already-disclosed T8 "careful forgery is narrowed, not closed" boundary, and it manipulates only a ref string (no filesystem access occurs at replay). Worth one line in the T8 row if the Coordinator wants completeness; not a blocker.

---

## Everything else re-verified unchanged

Re-ran the full original battery. T2 immutability, T3 externalRef uniqueness, T4 ordinal contiguity, T5 ref ownership, T7 post-terminal neutralization, the kind-closed event log (`human-turn-verified` still refused at replay), and the `__proto__` cases all behaved exactly as in the first round. T6 remains open by design and still accepted through the real request door (`[A5] ACCEPTED`), which is the correct outcome — a refusal there would have made the doc's "cannot be closed in-process" the false statement. The no-worker-path trace re-ran clean: `recordContributionLink` with `type:'human-turn'` still refused against the closed contribution-type enum, and a worker-only session still produces only `session-opened` / `actor-bound`.

## Baseline (item 6)

Ran the Doer's exact focused-suite invocation myself, unpiped, real exit code captured:

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
    'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' \
    'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'
NODE_EXIT=0
ℹ tests 742   ℹ pass 742   ℹ fail 0
```

742/742 confirmed independently. Note that N1 and N3 are not covered by it — both are outside what the new tests assert.

## Cleanup

All attack scripts and temp sessions live under the session scratchpad and OS temp dirs; `rt-*`/`rtfix-*` session dirs removed. Nothing committed. The only repo file this recheck adds is this report.

## Unresolved questions for the Coordinator

1. N1 (symlink): switch the containment check to `realpath`, or narrow the contract's rationale sentence to match the lexical guarantee? The fix is two lines; the doc edit is one sentence. Either resolves the gap between claim and behavior.
2. N3: add one clause to the T8 row noting `turnId` shape is write-door-only, for completeness? Optional.
3. N2c's imprecise message for a filename literally starting with `..` — cosmetic, ignore unless it bothers you.

```
Status: DONE
Summary: Both original BYPASSED findings (replay's missing driver-authored-ref refusal, and respondsToRefs ownership) are genuinely closed at replay and in `show`, verified by re-running the original attack scripts unmodified; the artifactRef fix closes traversal and absolute paths but a symlink inside the workspace still pins a hash to a file outside it.
Recheck verdict: 4 of 5 original findings now blocked (2 BYPASSED closed, 1 UNEXPECTED closed, 1 UNEXPECTED correctly left unchanged after I independently verified the zero-case-normalization grep claim), 1 partially blocked; 1 new bypass found (symlink defeats the new lexical containment check) plus 1 disclosed-boundary residual (turnId shape guard not mirrored at replay); 742/742 focused suite confirmed independently.
```
