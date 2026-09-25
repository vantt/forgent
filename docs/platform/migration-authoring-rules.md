# Migration Authoring Rules (One-Owner Discipline)

```txt
Document type: Governance guide
Audience: Human author, maintainer, implementer, agent
Purpose: Define strict authoring rules during documentation authority unification to prevent drift and dual ownership
Design status: Accepted (Phase 01)
Implementation: Implemented (Phase 01)
Provenance: Derived from docs/platform/intent-preservation-ledger.md and plans/260925-documentation-authority-unification/plan.md §3, §7
Writer type: Human + agent coauthor
Canonical for: Migration-time documentation authoring rules
Use this when: Authoring or editing any documentation during the active unification migration
Do not use this for: Normal post-cutover documentation workflow
Last reviewed: 2026-09-25
Related:
- `docs/transitional-switchboard.md`
- `docs/doc-governance.md`
- `plans/260925-documentation-authority-unification/plan.md`
```

During the active documentation authority unification migration, writers (both humans and agents)
must adhere strictly to the one-owner authoring discipline. Violating these rules increases debt
and blocks the atomic cutover gate.

## 1. Core Principles

1. **One Claim, One Canonical Owner:**
   Every normative, descriptive, behavioral, architectural, or decisional claim has exactly one
   physical owner. You must look up the declared current owner in
   [docs/transitional-switchboard.md](../transitional-switchboard.md).
2. **Never Dual-Author Prose:**
   Never write the same substantive design, specification, or contract claim in both a legacy document
   (`docs/specs/**`, `docs/architect/**`) and a candidate target document (`docs/platform/**`).
   Dual authoring forks authority and confuses subsequent readers and agents.
3. **Update the Current Owner Once:**
   If the switchboard routes an area to a legacy document (such as `docs/specs/work-state.md` or
   `docs/specs/runner.md`), apply your changes ONLY to that document. Do not preemptively mirror
   the text into an unpromoted target folder under `docs/platform/`.
4. **Record Candidate Impact in Migration Tracking:**
   When an active legacy document is modified, note the impact for pending candidate transformation
   in the migration ledger or phase notes.

## 2. Legacy Roots Ratchet and Exceptions

The legacy platform roots (`docs/specs` and `docs/architect`) are frozen against unreviewed growth:

1. **No New Files Under Legacy Roots:**
   Creating any new maintained file under `docs/specs` or `docs/architect` is rejected by the
   ratchet (`scripts/check-legacy-docs-ratchet.mjs`). New maintained platform documentation belongs
   under `docs/platform/**`.
2. **Unaccounted Edits Are Refused:**
   Modifying any existing baselined file under `docs/specs` or `docs/architect` without an entry
   in `scripts/check-legacy-docs-ratchet.exceptions.json` fails the ratchet.
3. **Reviewed Exception Criteria:**
   An exception is permitted only for:
   - Verified stale standing route corrections (such as updating invalid references in reading maps).
   - Urgent defect fixes in legacy specs where no promoted portal yet exists.
   - Mechanical link fixes verified to prevent broken references.
4. **Exception Ledger Format:**
   Each exception in `scripts/check-legacy-docs-ratchet.exceptions.json` must record:
   - `path`: relative POSIX path.
   - `kind`: `allowed-edit` or `allowed-new-file`.
   - `rationale`: non-empty explanation of the necessity of the change.
   - `approvedBy`: authorization reference (e.g. human approval or phase assignment ID).
   - `owner`: named owner or role responsible for the exception lifecycle.
   - `expectedDigest`: expected SHA-256 hex digest of the file after the change.
   - `reviewedAt`: date of review in `YYYY-MM-DD` format.
   - Lifecycle controls (at least one required):
     - `expiry`: ISO date (`YYYY-MM-DD`) after which the exception is rejected as expired.
     - `revisitTrigger`: concrete milestone or event triggering review (e.g. Phase 08 cutover).

## 3. Authoring New Platform Documentation

When authoring new platform documentation under `docs/platform/<area>/`:
1. Check whether the area portal is `promoted`, `candidate`, or uncreated in the switchboard.
2. If the area is `candidate`, ensure the new document clearly declares its candidate status in
   the metadata header (`Design status: Proposed` or `Candidate`).
3. Follow the placement map in `docs/doc-governance.md` §2.
4. Follow the metadata discipline in `docs/doc-governance.md` §5.

## 4. Related Files

| Relationship | File |
|---|---|
| authority switchboard | [docs/transitional-switchboard.md](../transitional-switchboard.md) |
| documentation governance | [docs/doc-governance.md](../doc-governance.md) |
| ratchet script | [scripts/check-legacy-docs-ratchet.mjs](../../scripts/check-legacy-docs-ratchet.mjs) |
| checked-in baseline | [scripts/check-legacy-docs-ratchet.baseline.json](../../scripts/check-legacy-docs-ratchet.baseline.json) |
| exceptions ledger | [scripts/check-legacy-docs-ratchet.exceptions.json](../../scripts/check-legacy-docs-ratchet.exceptions.json) |
