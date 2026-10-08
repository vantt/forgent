# Agent Coordination review request

Status: BLOCKED draft; not ready for P5. Do not approve or flip any row from this request yet.
Author session: undefined
Candidate pin: 0a41d793e60631aa9073c73a941f641548862b6c
Decision-data pin: 576f9efea72de92d4191eb295afd9b2349bbb99a

## Required before release

Owner decision for the two pending corpus-rule proposals that would overwrite the three generated file dispositions. Read corpus-policy-blocker.md/json and owner-queue.md. No gate or frozen rule is amended by this request. After that decision is implemented and proven, generate ordinary visible packs using propose-doc-decisions.mjs --pack for each of the three judgment shards and the log-duplicates shard, then release this request as ready-for-review. Pack generation, independent review, strict E and rehearsal remain UNPROVEN.

## Eventual independent review

Read the phase contract, owner amendments A1–A8, review-brief.md, vocabulary, constitution and shard schema. Review paths:

- ledger/decisions/s2-agent-coordination-{judgment-01,judgment-02,judgment-03,log-duplicates}.json: 1434 manual rows, 100% read and whole/partial/duplicate/archival checks.
- ledger/decisions/s2-agent-coordination-files.json: 70 file decisions.
- ledger/decisions/s2-agent-coordination-mirrors-*.json and s2-agent-coordination-exact-*.json: gate-reprove every entry; reviewer independently chooses 100 random script-proven rows and records population, draw and results.
- ledger/retired-unit-decisions.json: read the full old and new source-inventory candidate units and prove the recorded preservation replacements; any accepted disposition needs the independent committed report, reviewer/date and shown-text digest, never approval by the author.
- ledger/decisions/s2-corpus-*.json: read complete membership and exact policy, but the history/user-knowledge rules cannot be accepted as presently written. Consumer-project has no generated member.
- ledger/conflict-resolutions.json: 815 duplicate and 205 semantic receipts; named owners, current members, meaning and pending independent acceptance.
- reports/phase-06/identical-unit-exceptions.md/json: 334 context-based exception proposals, not blanket proof-snapshot permission.
- reports/phase-06/reverse-agent-coordination.md/json: 184 unnamed target units, full text and proposed classifications. Classification is not a gate waiver.
- batch-agent-coordination.md/json, post-review-edits.md, promoted-edits.md and the actual candidate diffs including the two authorized history snapshots.

Use ordinary committed reports review-2-<shard>.md from a different session. No per-batch seeded packs or reviewer red-team; checkpoint procedure after Steps 3/6 and closing is unchanged. Retain H1 mandatory authorship, author/reviewer independence, report ancestry/pins and shown-target digest binding. Hold/rework follows A2 with no approval identity/date. Do not treat script review as manual approval. The author resumes only after the independent review report is committed.

## Gates

Refresh the scratch projected registry and manifest exactly as recorded in batch-agent-coordination.json; the retained candidate-unit disposition is an unapproved data record, not a lost id. Run D twice with --previous-registry, once for each committed prior registry; both must pass. A/B/C/F/G/H/I use the frozen commands/amendments. Strict E belongs after independent review. No invocation waives corpus classification or the reverse check. Return any real defect without changing a baseline.
