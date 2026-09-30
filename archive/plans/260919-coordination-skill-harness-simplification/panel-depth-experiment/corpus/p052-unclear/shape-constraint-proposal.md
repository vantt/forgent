# shape-constraint-proposal (real, asgn_coordinator_driver_op_034)

## Dispatched objective (verbatim)

Propose the architecture that best respects real operational constraints (must work for coding agents herdr-gateway has not yet encountered, no-UI-control per /home/vantt/projects/herdr-gateway/docs/specs/terminal-detail.md R24, the fail-closed asymmetry per R25, maintenance burden of per-agent grammars vs. reactive heuristic patches) for the universal-heuristic-vs-per-agent-grammar question. Use absolute paths for everything you read. Also write a short human-readable agent-report.md alongside it. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Constraint-advocate recommends keeping the universal-heuristic architecture (content/behavior-based, not agent-identity-based) as sole production path for the layout-vs-continuous-text and scrollback-availability decisions, patched reactively per counter-example rather than via a maintained per-agent grammar.",
  "role": "constraint-advocate",
  "question": "universal-heuristic-vs-per-agent-grammar",
  "recommendation": "universal-heuristic",
  "sources_read": [
    "/home/vantt/projects/herdr-gateway/docs/specs/terminal-detail.md",
    "/home/vantt/projects/herdr-gateway/docs/specs/herdr-port.md"
  ],
  "key_evidence": [
    "terminal-detail.md R12/R24/R25: block treatment and history-availability decisions are made from content/behavior alone, never from which agent is running, never configurable, and fail closed toward the non-destructive branch on uncertainty.",
    "herdr-port.md R18: agent identity and host-reported status are explicitly declared unreliable signals to branch on, since an agent's own screen-takeover behavior can change between versions while its name stays the same.",
    "Both docs' Open Gaps: the scroll-key fallback is verified against only one coding agent; generalization to 'agents not yet encountered' is unconfirmed and explicitly flagged as an open risk, not yet addressed by any per-agent table."
  ],
  "constraints_applied": [
    "must-generalize-to-unencountered-agents: disqualifies any table keyed by known agent identity",
    "no-UI-control (R24): favors a single code path with no per-case switch over a hidden per-agent branch table",
    "fail-closed asymmetry (R25): only the universal heuristic inherits R25's bounded, one-directional failure mode; a stale grammar entry has no equivalent safety rail",
    "maintenance burden: grammar cost is O(agents x versions) and grows unboundedly with silent staleness; heuristic cost is O(1), patched reactively per confirmed counter-example"
  ],
  "recommended_pattern": "When a real agent breaks a heuristic assumption, widen the heuristic to discover the needed property per-pane at runtime (e.g., 'does this pane respond to key K'), rather than branching on agent name — preserves R12/R18 while still getting differentiated behavior.",
  "risks_acknowledged": [
    "Universal heuristic's real miss rate is unmeasured against a corpus (both docs' Open Gaps).",
    "Scroll-key fallback verified against only one agent so far; an agent that doesn't react gets no older history, with no further fallback designed."
  ],
  "open_questions": [
    "Should a per-pane discovered scroll-key response be cached only for the pane's lifetime, or persisted anywhere?",
    "What real-world signal should trigger a reactive-patch review, given no corpus/miss-rate measurement exists yet?"
  ]
}
```

## Real agent-report.md (verbatim)

# Constraint-Advocate Report — universal-heuristic vs per-agent-grammar

Assignment: asgn_coordinator_driver_op_034 · Role: constraint-advocate

## Where this question already lives in the codebase

herdr-gateway has already answered close variants of this question twice, in
`docs/specs/terminal-detail.md` and `docs/specs/herdr-port.md`:

- **R18** (herdr-port.md): whether a pane holds extra scrollback history is
  "discovered by actually reading it, never assumed from the pane's agent
  name or any status field the host reports — an agent's own choice of
  whether to take over the screen can change between its versions while its
  name stays the same."
- **R12** (terminal-detail.md): same principle, restated for the same
  decision.
- **R21-R27 / R24 / R25** (terminal-detail.md): whether a text block is
  laid-out-and-must-move-sideways vs continuous-and-may-reflow is judged
  from the block's own shape (content), never configurable (R24), and
  fails closed toward the non-destructive branch when uncertain (R25).
- **Open Gaps** in both docs explicitly flag the live edge: the
  display-scroll/key-replay fallback has only been verified against *one*
  coding agent; whether it generalizes to "agents not yet encountered" is
  unconfirmed, and no per-agent fallback table exists today.

So the codebase's standing architecture is already "universal heuristic,"
not "per-agent grammar." The live question is whether that holds under the
next round of pressure — new CLI agents that behave differently — or
whether it should be reinforced with per-agent special-casing.

## Constraint-by-constraint analysis

**1. Must work for coding agents herdr-gateway has not yet encountered.**
This alone is close to disqualifying for a per-agent grammar. A grammar is
a table keyed by known agents; it has no entry for an agent invented next
month. A universal heuristic, keyed to observable content/behavior shape
rather than identity, applies to an unknown agent on day one, with no
gateway release required. This is the constraint the current R18/R12
language already optimizes for, in so many words.

**2. No-UI-control (R24).** A per-agent grammar is, functionally, a hidden
per-agent switch — the operator just doesn't get to see or flip it. That
satisfies the letter of R24 but works against its spirit: R24 exists so the
screen alone decides, without a per-case escape hatch anyone has to reason
about. A universal heuristic is a single code path with no branch table to
audit, which is the cleaner fit for "nothing to discover or configure."

**3. Fail-closed asymmetry (R25).** R25 already defines the two failure
directions and ranks them: guessing R22 when the truth is R23 is invisible
and safe; guessing R23 when the truth is R22 destroys an alignment the
reader can't recover. This asymmetry is what makes an *imperfect* universal
heuristic viable at all — the cost of a miss is bounded and one-directional
by construction. A per-agent grammar doesn't inherit this property for
free: a stale or wrong table entry can silently point the wrong way with no
equivalent safety rail, and nothing forces its failure mode to stay
one-directional as entries accumulate.

**4. Maintenance burden: per-agent grammar vs reactive heuristic patches.**
A grammar's cost is `O(agents × versions)`, and it grows forever — R18
notes explicitly that "an agent's own choice of whether to take over the
screen can change between its versions while its name stays the same," so
entries go stale silently, with no signal that they did. A universal
heuristic's cost is `O(1)`: one classifier, patched reactively only when a
concrete counter-example is found live (the pattern both docs already use:
"Answered by: a live check the next time this is found not to hold"). That
reactive-patch model is cheap specifically because it improves one shared
rule instead of adding one more table row per agent.

There's also a harder blocker underneath constraint 4: a per-agent grammar
requires *reliable agent identification* at the point of decision, and R18
already states the host's own identity/status signals are "not reliable
enough on its own to branch on." Building a grammar on top of an input the
spec has already declared untrustworthy doesn't just cost more to maintain
— it can't be made correct even with unlimited maintenance effort, since
the same agent name can denote behaviorally different versions.

## Recommendation

Keep the universal-heuristic architecture as the primary and only
production path, and route all future fixes through it as **general**
patches, not per-agent branches. Concretely:

- Decisions stay keyed to *observed content or behavior* (block shape;
  whether a scroll-key replay reveals anything), never to agent name or
  host-reported status — preserves R12/R18 as written.
- When a real agent is found that breaks an assumption (e.g., doesn't react
  to the assumed scroll key), the fix should widen what the heuristic
  checks — for example, making "does this pane's program respond to key K"
  a property *discovered per pane at runtime* and cached for that pane's
  session, rather than an `if agent_name == X` branch. This gets the
  differentiated behavior a grammar wants without reintroducing
  identity-based branching or an unencountered-agent blind spot.
- Any degraded case (agent doesn't respond to the fallback key) should fail
  closed to "no older history available," matching R25's asymmetry, rather
  than guessing a program-specific key sequence with no runtime evidence it
  applies.
- Do not build a proactive per-agent table "just in case" for agents not
  yet seen misbehaving — that inverts the reactive-patch economics into the
  same unbounded maintenance liability a grammar carries, for coverage that
  can't be verified until the agent actually exists.

## Trade-off acknowledged, not hidden

The universal heuristic is admittedly unproven at scale: both docs note
"real miss rates have not been measured against a corpus," and the
scroll-key fallback is verified against exactly one agent today. This is
an accepted, documented gap, not a defect — and it's the correct posture
given the constraints above: better to ship a generalizing heuristic with a
known, bounded, one-directional failure mode than a grammar that looks more
"precise" per known agent but cannot cover the next one and degrades
silently as existing entries go stale.

## Unresolved questions

- Should "per-pane discovered scroll-key response" be cached only for the
  pane's lifetime, or persisted anywhere? (Spec is silent; caching across
  pane recreation would reintroduce an identity-like assumption.)
- What real-world signal should trigger a "reactive patch" review cadence,
  given no corpus/miss-rate measurement exists yet (both docs' Open Gaps)?
