# Brief 1

## Execution contract

- Mutation: read-only
- Result claim path: /home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790934553748-4d3a3007/producer/1/runs/01/outbox/result-1.json
- Timeout: 2100000ms
- Persisted contract: /home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790934553748-4d3a3007/producer/1/runs/01/effective-execution-contract.json

## Acknowledge first

Before you start, write this file:

    /home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790934553748-4d3a3007/producer/1/runs/01/outbox/ack-1.json

with exactly:

    {"round": 1, "agent": "fgos-run_unit-run-1790932ebd4631", "receivedAt": "<ISO 8601 timestamp>"}

Write it as `/home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790934553748-4d3a3007/producer/1/runs/01/outbox/ack-1.json.tmp` first, then rename it into place. Never write
a file in this directory in any other way -- a reader may look at it at any
moment, and a rename is the only step that is either done or not done.

## Your task

Assignment: unit-run-1790934553748-4d3a3007/producer/1
Work: (none)
Role: producer
Objective: Read src/runner/execution/bind.mjs lines 250-270 and say in your report, in one sentence, which two values the transport variable can take. Do not modify any file.
Context refs:
- (none)
Expected outputs:
- (none)
Result artifact:

- Also write a human-readable report to /home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790934553748-4d3a3007/producer/1/runs/01/outbox/report-1.md -- REQUIRED for this read-only operation: a "done" status with no report artifact is treated as unevidenced (no-evidence), not accepted as done.
- Do not call Work lifecycle verbs unless the task-spec explicitly says this Assignment is the lifecycle driver.
Effective execution contract:
- Contract: effective-execution-contract.v1
- Mutation: read-only
- Claim path: /home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790934553748-4d3a3007/producer/1/runs/01/outbox/result-1.json
- Timeout: 2100000ms
- Write scope: (none - read-only)
- Permission enforcement: enforced

## When you finish

Write these two files, in this order, each one `.tmp`-then-rename:

1. `/home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790934553748-4d3a3007/producer/1/runs/01/outbox/report-1.md` -- what you did, in prose. Anything a reader needs to
   understand or check your work belongs here.
2. `/home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790934553748-4d3a3007/producer/1/runs/01/outbox/result-1.json` -- a JSON object:

       {"contract":{"id":"agent-result-claim","version":2},
        "status": "done" | "blocked" | "failed" | "no-evidence",
        "summary": "<one or two sentences>", "evidenceRefs": []}

   Claim requirements:
- "contract" may be omitted only for legacy claim input; for v2 use {"id":"agent-result-claim","version":2}
- "status" must be exactly one of: done | blocked | failed | no-evidence
- "summary" must be a required non-empty string
- "blocker" must be a non-empty string when status is "blocked"
- "error" must be a non-empty string or object when status is "failed"
- "evidenceRefs" must be an array of non-empty strings if provided
- Nothing in this claim is proof; evidenceRefs remain untrusted until independently validated

   "settled" is not a valid status here -- that word names the run reaching
   its end, not whether the work succeeded; a worker that writes "settled"
   in this file fails schema validation and the round is scored failed.

The second file is what ends this round, so write it last and only once the
first one is on disk. Nothing you write is treated as proof on its own; it is
your account of the work, and it is read alongside the repository itself.

Write only inside `/home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790934553748-4d3a3007/producer/1/runs/01/outbox`. Everything else under
`/home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790934553748-4d3a3007/producer/1/runs/01` belongs to whoever is watching you.
