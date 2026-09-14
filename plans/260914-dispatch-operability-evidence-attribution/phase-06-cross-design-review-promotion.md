# D06 - Cross-Design Review And Promotion

**Capability:** advise

**Depends on:** D05

## Purpose

Obtain an independent architecture verdict, reconcile findings, and promote only
accepted design into canonical documentation.

## Read First

All accepted D00-D05 artifacts, `architecture-decision-lock.md`, traceability,
the source incidents, canonical specs named by the promotion manifest, and the
registered architecture-advisory panel contract.

## File Lease

- May edit: `architecture-decision-lock.md`, `requirements-traceability.md`
- May add/edit: `reviews/d06-*.md`, `promotion-manifest.md`, `implementation-handoff.md`
- After `READY` only: canonical markdown paths listed in the manifest
- Must not edit: all source/config/test paths and unlisted documentation

## Work

1. Build a packet of claims, decisions, evidence, contracts, traceability,
   unknowns, and negative capabilities.
2. Run the real registered architecture advisory panel; preserve session ID,
   replay/trace, role outputs, recommendation, dissent, and confidence.
3. Run this cell's independent Reviewer and Red-Team over the integrated design.
4. Disposition each finding as accepted, evidence-rejected, deferred with owner
   and trigger, or human-decision-required. Accepted findings reopen their owner
   artifact and require both rechecks.
5. Issue exactly `READY` or `NOT READY`.
6. On `READY`, make a fact-to-target promotion manifest, re-read current targets,
   promote without overwriting concurrent work, and write a future implementation
   handoff.

## Mandatory Questions

- Is there a second terminal/mutation authority?
- Is inspection structurally read-only and host-portable?
- Are identity, ambiguity, corruption, compatibility, concurrency complete?
- Can each liveness source prove only what its coverage declares?
- Is a negative capability reachable through an unnamed path?
- Does proof traverse the selected adapter and persistence path?
- Does this serve downstream projects/workflows rather than dogfood only?
- Does evidence require a new component, or is Dispatch still the owner?

## Required Shape

- Review packet with stable claim IDs and contrary evidence.
- Architecture-panel session/replay reference plus role outputs and dissent.
- Standalone Reviewer and Red-Team reports.
- Finding ledger with severity, evidence, disposition, owner, and recheck status.
- Exact `READY` or `NOT READY` verdict with reasons.
- On `READY`, promotion manifest and future implementation handoff.

## Promotion Rules

The manifest names exact target/section, decision IDs, content class, and
collision check. At minimum evaluate `docs/specs/runner.md`, canonical
Assignment/Run contracts, host operation catalog, operator/CLI docs, and
`docs/specs/reading-map.md`. Label behavior as planned, never shipped. Do not
touch `CHANGELOG.md` before implementation changes user-visible behavior.

## Adversarial Checks

- Review hides contrary evidence; preference reopens a locked decision.
- HIGH is deferred without owner/trigger; `READY` has broken traceability.
- Canonical docs claim implementation; promotion overwrites concurrent edits.

## Acceptance

Panel and standalone review evidence are durable; every finding is disposed and
no HIGH remains; decision lock records row status; traceability is complete;
promotion is conflict-aware; handoff states designed/not implemented/deferred/
unknown; verdict is exactly `READY` or `NOT READY`.

## Verification

```sh
git diff --check
git diff --name-only HEAD | awk '$0 !~ /^(plans\/260914-dispatch-operability-evidence-attribution\/|docs\/.*\.md$)/ { bad=1; print } END { exit bad }'
rg 'READY|NOT READY' plans/260914-dispatch-operability-evidence-attribution/reviews plans/260914-dispatch-operability-evidence-attribution/architecture-decision-lock.md
```

## Handoff

On `READY`, close this track and create a new implementation track from
`implementation-handoff.md`. Never append implementation cells here.
