# Step 4 vocabulary normalization

Ten rows distinguish component, package, bounded context, authority boundary,
responsibility ring, candidate/current/historical authority, producer/consumer,
and proposal/settled decision. Each row names one meaning owner, allowed aliases,
prohibited conflations and candidate citations.

A43 is explicit in V-05: responsibility rings are descriptive responsibility
groupings. They never imply a class, entity, schema type, mandatory module or
runtime object. The direct candidate citation is
`docs/platform/agent-coordination/vocabulary/concept-relationships.md:95-110`.

## Candidate corrections

Three previously reviewed candidate defects were corrected and logged before
the edits in `post-review-edits.md`:

1. TRUTH-15: runner vocabulary self-citations now point to the current lines.
2. TRUTH-26: the R3 execution-record link label now names its real archive path;
   its already-working destination did not change.
3. TRUTH-27: the two CLI citations now point to the current facts.

X-DEFECT-01..05 are accounting/rationale observations rather than candidate
source defects, so they remain deferred to Phase 9 under L10-37. No vocabulary
system, checker, history snapshot or mass-replacement was touched.

## Proof list and stop result

- targeted term searches and owning-source citations are recorded per row;
- three changed anchors and their exact before/after corrections are logged;
- checks A/B/C/G/H/I and protected boundaries are recorded in
  `step-04-checks.json`;
- the combined request assigns this part to an independent vocabulary reviewer.

No Step 4 stop condition fired: no incompatible owner meanings were found, no
history was erased, and no checker/vocabulary-system edit was necessary.
