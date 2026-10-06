# Alias Table and Resolver Contract

## 1. Purpose

Before the old physical documentation authority is removed, immutable
historical references (decision ids, event refs, commit messages, archived
plans) that name an old path must still resolve to the document that owns the
claim today. The alias table preserves that lookup lineage. It does not copy
content: an alias points at one canonical owner under `docs/platform/`.

- Table: [alias-table.json](alias-table.json), shape in [alias-table.schema.json](alias-table.schema.json).
- Resolver and validator: `scripts/doc-alias-resolver.mjs`.
- The table starts empty. Entries are written at transformation time, one per
  real move, merge, split, redirect or retirement.

## 2. Entry fields

| Field | Meaning |
|---|---|
| `aliasId` | Stable id, lowercase kebab-case, never reused. |
| `fromPath` | Repo-relative posix path of the old location, optionally `path#anchor`. |
| `toOwner` | `docs/platform/...` path of the current owner; `null` only for `retired-with-evidence`. |
| `toAnchor` | Heading anchor inside `toOwner`, or `null` for the whole document. |
| `kind` | `moved`, `merged`, `split`, `redirected` or `retired-with-evidence`. |
| `evidenceRef` | Commit sha or evidence path; required for `retired-with-evidence`, otherwise `null`. |
| `immutableRefs` | Historical references relying on the alias; may be empty. |
| `recordedAt` | ISO date (`YYYY-MM-DD`). |

All fields are plain strings, arrays and nulls so the table can be imported
into a multi-profile registry without translation.

## 3. Resolution rules

- A reference is `path` or `path#anchor`. Matching is exact; there is no globbing.
- A reference with an anchor matches an alias with the same `path#anchor` first, then an alias on the bare `path`.
- A bare-path reference never matches an alias recorded for a specific anchor.
- A hit returns `{resolved: true, toOwner, toAnchor, kind, via}` where `via` is the `aliasId`. A retirement returns `toOwner: null` and carries its `evidenceRef`.
- A miss returns `{resolved: false}`.

## 4. Validation rules

The validator reports a finding for: schema violations, duplicate `fromPath`,
duplicate `aliasId`, a `toOwner` outside `docs/platform/` (except for
retirements), a `toAnchor` without a `toOwner`, a retirement without
`evidenceRef`, and any alias whose `toOwner` is itself an alias `fromPath`
(a chain; a loop is reported as a cycle). Chains are rejected so one lookup
always lands on a current owner. With a repo root the owner file must exist;
with a constitution it must match a document-kind placement.

## 5. Not in scope

- Rewriting links in documents, redirect serving, or generating the table from git history.
- Glob or prefix aliases, and content duplication at the old path.
- Multi-profile registry storage, trust metadata and contribution events.

## 6. Import into the future registry

Each entry maps one-to-one onto a registry lineage record: `aliasId` is the
record id, `fromPath` the superseded locator, `toOwner` + `toAnchor` the
current owner locator, `kind` the lineage relation, `evidenceRef` the evidence
link and `immutableRefs` the reverse-reference list. The importer adds a
profile id; no field is renamed or reshaped.
