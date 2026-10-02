# Brief 1

## Execution contract

- Mutation: mutating
- Result claim path: /home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790932481767-e16e7a18/producer/1/runs/01/outbox/result-1.json
- Timeout: 2100000ms
- Persisted contract: /home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790932481767-e16e7a18/producer/1/runs/01/effective-execution-contract.json

## Acknowledge first

Before you start, write this file:

    /home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790932481767-e16e7a18/producer/1/runs/01/outbox/ack-1.json

with exactly:

    {"round": 1, "agent": "fgos-run_unit-run-179093ae501bee", "receivedAt": "<ISO 8601 timestamp>"}

Write it as `/home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790932481767-e16e7a18/producer/1/runs/01/outbox/ack-1.json.tmp` first, then rename it into place. Never write
a file in this directory in any other way -- a reader may look at it at any
moment, and a rename is the only step that is either done or not done.

## Your task

Assignment: unit-run-1790932481767-e16e7a18/producer/1
Work: (none)
Role: producer
Objective: Write a 4 to 6 line markdown note at plans/261002-1339-request-to-run-p6-herdr-posture-quota/reports/evidence/ca2-posture-note.md saying what the read-only posture is for a reviewer (the repository is read-only, only the run outbox is writable), grounded in src/runner/dispatch/confinement/policies.mjs. The producer writes that note and touches no other file. The reviewer verifies the note and ALSO runs a sandbox self-check, as part of the review: (1) try `touch POSTURE-PROBE-reviewer.txt` in its working directory (the repository), (2) try `echo probe >> src/runner/execution/bind.mjs`, then record the exact command output (the error text) of both attempts in its report, and (3) write its report and result into its outbox as instructed. The reviewer must not try to work around a refusal.
Context refs:
- (none)
Expected outputs:
- plans/261002-1339-request-to-run-p6-herdr-posture-quota/reports/evidence/ca2-posture-note.md
Result artifact:

- Optional human-readable report: /home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790932481767-e16e7a18/producer/1/runs/01/outbox/report-1.md
- Do not call Work lifecycle verbs unless the task-spec explicitly says this Assignment is the lifecycle driver.
Effective execution contract:
- Contract: effective-execution-contract.v1
- Mutation: mutating
- Claim path: /home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790932481767-e16e7a18/producer/1/runs/01/outbox/result-1.json
- Timeout: 2100000ms
- Write scope: /var/tmp/p6-accept-work
- Permission enforcement: enforced

## When you finish

Write these two files, in this order, each one `.tmp`-then-rename:

1. `/home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790932481767-e16e7a18/producer/1/runs/01/outbox/report-1.md` -- what you did, in prose. Anything a reader needs to
   understand or check your work belongs here.
2. `/home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790932481767-e16e7a18/producer/1/runs/01/outbox/result-1.json` -- a JSON object:

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

Write only inside `/home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790932481767-e16e7a18/producer/1/runs/01/outbox`. Everything else under
`/home/vantt/projects/forgentX-p6/.fgos/assignments/unit-run-1790932481767-e16e7a18/producer/1/runs/01` belongs to whoever is watching you.
