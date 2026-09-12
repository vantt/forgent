# P06 - Writable Takeover Profile

**Status:** DISABLED BY DEFAULT  
**Owner:** workspace authority and material evaluator  
**Depends on:** S2 reconciliation and S4 evaluator contracts

## Goal

Provide a separately enabled profile for replacing a failed writer in the same
workspace without losing inherited edits. This is not required for read-only or
isolated recovery.

## Grant Contract

```text
WorkspaceGrant {
  grantId, workspaceIdentity, previousWriter, replacementWriter,
  predecessorRunId, replacementRunId, mergeBase, generation,
  quiescenceEvidence, issuedBy, issuedAt, expiresAt
}
```

The required port is `WorkspaceGrantIssuerPort`. Its first admissible adapter
is a configured operator authority that authenticates the current caller,
pins the predecessor/replacement Runs and writes a single-use signed/digested
grant through the workspace-authority write door. No such adapter exists yet,
so the profile remains disabled. There is no implicit owner and no grant is
inferred from a filesystem lock, Herdr pane or worker assertion.

## Admission Checks

1. Workspace identity matches the predecessor Run.
2. Previous writer is quiescent or proven dead.
3. Replacement writer identity matches the grant.
4. Generation is current and not already consumed.
5. Merge base and material lineage are readable.

Failure of any check returns `workspace-authority-unavailable`,
`workspace-busy`, or `grant-invalid` and parks.

## Material Evaluation

The evaluator compares cumulative material from the common merge base through
all inherited Run artifacts plus the replacement delta. It must not subtract
`dirtyBefore` from the replacement delta. Unknown files, unresolved conflicts
or missing lineage park rather than being silently discarded.

## Acceptance

Prove workspace collision refusal, quiescence race, grant single-use,
inherited-edit preservation (X05), unknown writer park, generation fencing and
isolated/read-only behavior remaining unchanged. Do not enable this profile
until B02 and B03 evidence is complete.
