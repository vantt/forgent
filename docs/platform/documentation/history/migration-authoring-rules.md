# Migration Authoring Rules (One-Owner Discipline)

```txt
Document type: History
Audience: Human author, maintainer, implementer, agent
Purpose: Keep one maintained owner per documentation claim and preserve source evidence separately
Design status: Archived
Implementation: Historical migration procedure retained as evidence
Provenance: `docs/platform/intent-preservation-ledger.md` at `947dc310396071a4d530216d5c06d05993d63bf5`
Writer type: Human + agent coauthor
Canonical for: Historical source metadata; no current runtime authority
Use this when: Reading how the documentation migration preserved evidence
Do not use this for: Normal post-cutover documentation workflow; use docs/platform/governance.md sections 5 and 8
Last reviewed: 2026-09-25
Related:
- `docs/platform/documentation/history/switchboard.md`
- `docs/platform/governance.md`
- `plans/260925-documentation-authority-unification/plan.md`
```

Writers follow one-owner authoring discipline (governance sections 5 and 8) after cutover.
The migration procedure below is preserved as dated evidence, not as a live authoring workflow.

## 1. Core Principles

1. **One Claim, One Canonical Owner:**
   Every normative, descriptive, behavioral, architectural, or decisional claim has exactly one
   physical owner. The document's scope metadata declares that ownership;
   the former switchboard records migration evidence, not a second ownership delegation.
2. **Never Dual-Author Prose:**
   Maintain prose only in its declared current owner. Retired trees retain source evidence,
   not a second maintained copy.
3. **Update the Current Owner Once:**
   Apply each change once to the declared owner and point readers there.
   Preserve prior records separately rather than updating them as parallel authority.
4. **Preserve Source Evidence:**
   Keep dated source records separate from the single current owner; do not revive retired prose.

## 2. Historical Legacy Roots Ratchet and Exceptions

Historical source: this procedure and its script/baseline/exception paths below
record the retired migration-time ratchet. They are not post-cutover commands
or live inputs. After cutover, author the exact current owner once; a retirement is a
deletion, and `scripts/doc-health.mjs` fails on any link left dangling.

The legacy platform roots (`docs/specs` and `docs/architect`) are frozen against unreviewed growth:

1. **No New Maintained Files Under Legacy Roots:**
   Creating any new maintained prose file (`maintained-authority` or `retained-source`) under `docs/specs`
   or the former architect tree was rejected by the retired ratchet (current rules: `docs/platform/governance.md`). New maintained
   platform documentation belongs under `docs/platform/**`. Non-authority payloads (such as non-Markdown test
   evidence payloads under `docs/architect` or explicitly enumerated generated projections) are exempt from
   this restriction.
2. **Unaccounted Edits to Maintained Prose Are Refused:**
   Modifying any existing baselined maintained prose file (`maintained-authority` or `retained-source`) under
   `docs/specs` or `docs/architect` without an entry in `scripts/check-legacy-docs-ratchet.exceptions.json` fails
   the ratchet. Edits to policy-aware non-authority payloads (`generated` projections and non-prose `history-evidence`
   payloads under `docs/architect`) do not require exceptions, whereas maintained documentation remains strictly
   frozen and requires an approved exception.
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
   - `reviewedAt`: date of review as a valid ISO calendar date in `YYYY-MM-DD` format.
   - Lifecycle controls (at least one required):
     - `expiry`: valid ISO calendar date (`YYYY-MM-DD`) on or after which the exception is rejected as expired (`checkDate >= expiry`).
     - `revisitTrigger`: concrete milestone or event triggering review (e.g. the approved cutover).

## 3. Authoring New Platform Documentation

When authoring new platform documentation under `docs/platform/<area>/`:
1. Check whether the area portal is `promoted`, `candidate`, or uncreated in the switchboard.
2. If the area is `candidate`, ensure the new document clearly declares its proposal status in
   the metadata header (`Design status: Proposed` or `Candidate`).
3. Follow the placement map in `docs/platform/governance.md#2-placement-map` §2.
4. Follow the metadata discipline in `docs/platform/governance.md` §5.

## 4. Related Files

| Relationship | File |
|---|---|
| authority switchboard | [docs/platform/documentation/history/switchboard.md](switchboard.md) |
| documentation governance | [docs/platform/governance.md](../../governance.md) |
| historical retired ratchet script | Historical source: `scripts/check-legacy-docs-ratchet.mjs` at `c4e71152c506d0996b396e803353475f171dbfc4` |
| historical retired baseline | Historical source: `scripts/check-legacy-docs-ratchet.baseline.json` at `2b2ee26d1394add8beb0e81fcaa00260cab5b3c9` |
| historical retired exceptions ledger | Historical source: `scripts/check-legacy-docs-ratchet.exceptions.json` at `494828ca63483cd37a9f714bbaf4d685f91ce3ef` |
