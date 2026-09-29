# shape-alternative-proposal (real, asgn_i27_driver_op_008)

## Dispatched objective (verbatim)

Propose ONE alternative architecture: leave `deriveOperationCapability` exactly as the H4 fix left it (bindingSource === 'capability.prefer' only), and instead close the gap procedurally -- extend the existing `operation-capability-resolves` doctor check (Unit I21) to FAIL whenever any registered capability declares no `.prefer`, forcing every future capability author to make an explicit confinement choice at config-authoring time rather than relying on a kernel-level structural guarantee. Read /home/vantt/projects/forgentX/src/verbs/coordination/binding.mjs first (absolute path). Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}.

## Real agent-result.json

```json
{
  "contract": {
    "id": "agent-result-claim",
    "version": 2
  },
  "status": "done",
  "summary": "Alternative: close H4 in doctor instead of the kernel. Leave binding.mjs as it is (the gate is bindOperations line 268, not deriveOperationCapability) and extend operation-capability-resolves. Key finding: the existing check skips every derived capability (registrations.mjs:2040-2041, `if (!capability) continue`). architecture-advisory-panel-v1 declares no policy.capability and derives the generic 'review' slot (yaml:188-191), so the protocol where H4 actually happened is invisible to the check, which passes with '6 declared'. Also, config 'review' declares confinement.mode required but has no .prefer (config.json:59-69). Candidate: (1) evaluate derived capabilities through the exported deriveOperationCapability; (2) require .prefer or an explicit 'unbound' acknowledgment only for capabilities a CoordinationProtocol operation can reach. The literal 'any registered capability' rule was dropped because it would wrongly fail pane-labeling. (3) Cross-check a declared required confinement against the confinement of each .prefer candidate invocation; (4) the owner picks a confined .prefer for 'review'. No change to the dispatch path, about 40-60 lines plus tests. No-build cost: every panel actor stays unbound and the red-team's distinctProviderFrom stays inert, with nothing reporting it. The load-bearing prior (P1: line 268 is a complete gate) is falsified if execution-time re-resolution skips the capability.prefer filter (F1). In that case kernel hardening wins.",
  "evidenceRefs": [
    "src/verbs/coordination/binding.mjs:89-109",
    "src/verbs/coordination/binding.mjs:268",
    "src/setup/registrations.mjs:2019-2086",
    ".fgos/config.json:22-154",
    "core/coordination-protocols/architecture-advisory-panel-v1.yaml:183-191",
    "core/coordination-protocols/architecture-advisory-panel-v1.yaml:409-420"
  ]
}
```

## Real agent-report.md (verbatim)

# Alternative Proposal — close H4 procedurally, not structurally

Role: alternative-shaper · Assignment: asgn_i27_driver_op_008 · Mode: read-only

## Correcting one detail in the framing

The H4 gate is **not** inside `deriveOperationCapability`. That function only returns a
capability *name* (`binding.mjs:89-109`). The confinement gate is in `bindOperations` at
`binding.mjs:268` (`!resolved.configured || resolved.bindingSource !== 'capability.prefer'`
→ unbound). The proposal leaves both functions as they are. Nothing on the kernel dispatch
path changes.

## Evidence (read, not assumed)

1. `.fgos/config.json:59-69`: the `review` capability has **no `.prefer`**, yet it declares
   `confinement: {mode: required, policy: host-write-denied}`. The author wrote down the
   confinement intent but never tied it to an executor. That gap is H4.
2. `.fgos/config.json:727-729`: an executor declares `for: ["review", "code:review"]`. This is
   the `capability.for` path H4 used to rebind panel actors onto an unconfined invocation.
3. `architecture-advisory-panel-v1.yaml:188-191`: "No operation here declares
   `policy.capability`". Every operation *derives* `review` through the generic fallback
   (`binding.mjs:108`).
4. `registrations.mjs:2040-2041`: `const capability = op.policy?.capability; if (!capability) continue;`.
   **The existing `operation-capability-resolves` check skips every derived capability.** It
   passes today with "6 declared" (all from `standalone-master-coordination-loop.yaml`). The one
   protocol where H4 actually happened is invisible to the check that should cover it.
5. `.fgos/config.json:31-33`: `pane-labeling` also has no `.prefer`. It is legitimate: it is a
   tool capability, and no coordination operation reaches it. A literal "fail on ANY registered
   capability without .prefer" rule would break `fgos doctor` on a correct entry.
6. `capability-serves-valid` (I19) already enforces the shape of capability config at doctor
   time, and it already requires the `review` slot to exist. So there is precedent in this repo
   for making capability authoring a doctor-gated contract.

## Priors (each grounded in something observed)

- **P1: the kernel already has the invariant. What is missing is visibility.** After round 2,
  a capability without `.prefer` fails *safe* at `binding.mjs:268`: the actor stays unbound and
  `minTier`/`readOnlyRedirects` still apply. The remaining harm is silent degradation, not a live
  exploit. Silent degradation is a diagnostics problem, and this repo sends diagnostics through
  `fgos doctor` (AGENTS.md install/setup/doctor gate).
- **P2: H4 was a config-authoring gap that a code path exposed.** Evidence 1 shows the author
  already knew `review` needed confinement. A check at authoring time would have flagged
  "confinement required, no executor chosen" before any dispatch ran.
- **P3: another kernel layer would duplicate the gate at `binding.mjs:268`.** It would add
  another place where the "what counts as resolution" rule can drift. The round-3 fix already
  had to copy that rule into the doctor check by hand (`registrations.mjs:2053-2066`).

**The prior doing the most work is P1:** that `binding.mjs:268` is a complete gate. It depends
on `resolveExecutorAndOverrides` having exactly three branches, and on `bindOperations` being
the only consumer that turns a capability into an executor pin. **What would undermine it:**
(a) a fourth resolution branch added to `dispatch/resolve.mjs`; (b) a second consumer, such as
execution-time re-resolution in `assignment-runner`/`resolveAssignmentDispatchPolicy`, that
resolves a capability without the `capability.prefer` filter; or (c) the doctor check never
being run, since doctor is advisory and not on the dispatch path. If (a) or (b) turns out to be
true, this alternative loses to kernel hardening, and I would say so.

## The candidate

Extend `checkOperationCapabilitiesResolve` (`registrations.mjs:2019`). No dispatch-path change.

1. **Cover derived capabilities.** For each operation with no `policy.capability`, call the
   exported `deriveOperationCapability(op, facts, runnerConfig)` from `binding.mjs`. This reuses
   the resolver's own rule instead of a copy. Check the result exactly as a declared value is
   checked. `facts.domain`/`primaryCapability` are caller context. The check should evaluate
   the generic fallback, plus `<domain>:review` for every registered domain-review capability.
   A `work-product` op with no facade primary is reported as "unbound by construction" and does
   not fail.
2. **Scope the "must declare .prefer" rule to reachable capabilities**, not all registered ones.
   Reachable means declared by, or derived for, some discoverable CoordinationProtocol
   operation. `pane-labeling` stays valid. `review` fails today, which is the intended result.
3. **Require an explicit choice.** A reachable capability passes only if it has `.prefer`, or an
   explicit acknowledgment such as `"unbound": true` (name open) meaning "I intend these actors
   to fall through to readOnlyRedirects." That keeps the pre-I21 behavior as a *declared* state
   instead of an accidental one.
4. **Cross-check confinement.** If a reachable capability declares `confinement.mode: required`,
   every `.prefer` candidate must be an invocation that meets it (for example `*-bwrap`). The
   `executor-confinement` check already reads the same confinement rules. This is exactly the
   H4 shape: confinement declared, then bound to an unconfined invocation.
5. **Config follow-through.** Give `review` a confined `.prefer` (for example
   `claude/claude-cli-bwrap`, the same as `advise`, or `openai/codex-cli-bwrap`, the same as
   `code:review`), or mark it `unbound: true` explicitly. This is the owner's product choice.

Size: about 40–60 lines in `registrations.mjs`, 3–4 new cases in `test/setup/checks.test.mjs`,
one config edit, and one CHANGELOG line.

## First three months: materially different from kernel hardening?

Yes.
- **Kernel path:** changes `binding.mjs`/`resolve.mjs`, retests dispatch precedence, and
  risks regressing the `--executor` override and roster-layering fixes from rounds 2–3.
- **This path:** changes nothing on the dispatch path. Work is doctor, config, and tests. The
  first visible effect is that `fgos doctor` goes red on the real config today and names
  `review`. After the config choice, the panel's `distinctProviderFrom` (yaml:418-420)
  **starts doing something for the first time**. Today it is inert, because every panel actor
  is unbound and no provider family is ever recorded for the synthesizer
  (`binding.mjs:200-202, 300-301`).

## No-build consequences (concrete)

If nothing is built beyond round 2:
- **Rate:** 100% of `architecture-advisory-panel-v1` actors (and, by the same derivation, most
  likely the `-standard-v1` variant from df2b68d20) dispatch unbound on every run. They run on
  the runner's global default, with `readOnlyRedirects` as the only confinement.
- **Cost:** the declared provider diversity for red-team vs synthesizer never runs. The
  red-team can share a provider family with the synthesizer, which weakens the independence the
  panel exists to provide. Nothing reports this: doctor passes, and bindings say "unbound" only
  in a per-actor explanation string that no caller surfaces.
- **Trigger for recurrence:** the next capability someone adds with a `confinement` block and
  no `.prefer` (the `review` pattern) goes through the same silent path. So does the next
  protocol that relies on derivation instead of declaration, which yaml:188-191 describes as
  normal authoring.

## Falsification criteria (each one could actually happen)

- **F1:** a trace of `resolveAssignmentDispatchPolicy`/`assignment-runner` shows it re-resolves
  a capability name at execution time **without** the `capability.prefer` filter. Then an
  unbound actor can still get an unconfined pin at runtime, doctor-time gating is not enough,
  and kernel hardening wins.
- **F2:** in real usage, operators do not run `fgos doctor` before panel runs (for example,
  panels launched from a project whose setup never runs doctor). Then an advisory-only check
  has no enforcement point. The fix would be to run this one check as a preflight inside
  `fgos coordination start`, which is still procedural but no longer optional.
- **F3:** the config owner decides the pre-I21 "unbound → readOnlyRedirects" behavior is the
  *desired* steady state for `review`. Then step 3's explicit acknowledgment is the whole
  deliverable, and step 4 matters only for future capabilities.
- **F4:** the config schema validator rejects unknown capability fields, so `unbound: true`
  cannot be added without a schema change. That widens scope to `dispatch/config.mjs`. It does
  not kill the idea, but it removes the "no kernel-adjacent change" claim.

## Tried and dropped

- **Literal objective ("FAIL on any registered capability lacking .prefer"):** dropped.
  Evidence 5 shows it fails on `pane-labeling`, a correct tool capability, and it still misses
  the real hole (evidence 4: derived capabilities are skipped). Reachable-scope is the version
  I would defend.
- **Deleting the `capability.for` branch from `resolveExecutorAndOverrides`:** considered
  (the "delete instead of abstract" option). Dropped because `decide --for` uses that branch
  for orphan-executor purpose routing (`binding.mjs:251-256`). Deleting it breaks a separate
  contract.

## Would I defend it if asked directly?

Yes, as the cheaper and lower-regression first move, provided F1 is checked first (about 30
minutes of reading). If F1 holds (runtime re-resolution skips the filter), I would switch my
recommendation to kernel hardening. If F1 does not hold, this closes the actual observed failure
mode (an unenforced declared confinement plus a check blind to derived capabilities) with no
dispatch-path risk.

## Unresolved questions

- Does execution-time re-resolution apply the `capability.prefer` filter? (F1, not verified in
  this read-only pass.)
- Does the capability config schema allow an `unbound` acknowledgment field? (F4)
- Which confined executor should `review` prefer? This is the owner's product choice.
- Does the `architecture-advisory-panel-standard-v1` variant also rely only on derivation?
  Likely, not verified.
