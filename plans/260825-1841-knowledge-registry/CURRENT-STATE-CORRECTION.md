# End-user Knowledge Registry — Current-State Correction

```txt
Document type: Correction note beside historical implementation plan
Historical source preserved: plans/260825-1841-knowledge-registry/plan.md and phase-*.md
Snapshot checked: 2026-09-25 at ac19f6d1e868c53b2bc59a2c9642ee0e37e7eb08
Authority effect: Corrects current interpretation; does not rewrite historical evidence
```

## 1. Why This Note Exists

The plan and phase files in this directory are historical implementation
artifacts. Their original status statements, anticipated layout, and acceptance
language describe what was planned at authoring time; they are not a current
status projection and must not be silently rewritten to match later events.

Use this note to distinguish the code landing, enforcement change, corpus
migration, and current drift.

## 2. Verified Timeline

| Event | Verified repository evidence |
|---|---|
| Registry code foundation landed | `5c948d2a49da9fc184513bba5585a9a381ee5edb`, 2026-08-25 20:41:34 +07:00, `feat(knowledge): implement extensible multi-audience artifact-producer registry (tsk-28x)`; `git merge-base --is-ancestor 5c948d2a4 HEAD` succeeds at the snapshot. |
| Enforcement flag flipped | `6cce97ab3e80126c9778afd265fab1b4adfd7457`, 2026-08-27 11:46:41 +07:00, `chore(.fgos): enable docRegistry.enforce (tsk-1uj)`. This occurred after the code landing but before the 332 migration commits below. |
| Corpus migration applied | 332 commits with subject prefix `docs(tsk-5mh): migrate`, from `7dc95a26c14ca00ace052de93a91f53f4ae18071` at 2026-08-27 15:29:02 +07:00 through the final migration commits at 15:30:34 +07:00. |
| Registry projections regenerated after apply | `1c6aa7a40d36722e8b7627893e68bf4f5dd85a81`, 2026-08-27 15:31:00 +07:00. |
| Migration branch later merged | `817c1e0809875197aeae4d9b40c283e942c3ae63`, 2026-09-04 00:48:16 +07:00, `Merge branch 'fgw/tsk-5mh'`. |

Therefore `5c948d2a4` proves the code foundation, not completion of corpus
migration or enforcement. “Later” must be qualified against the code landing;
enforcement preceded the migration commit series on 2026-08-27.

## 3. Verified Current State And Drift

At the snapshot:

- `.fgos/config.json` declares `docRegistry.enforce: true`.
- `fgos knowledge status --json` reports 479 active topics and 479 documents:
  147 active, 332 provisional, 0 reserved, superseded, or retired.
- The migrated 332-document population remains provisional in the aggregate
  status; the historical plan's intended folding/promotion outcome must not be
  inferred from file presence.
- Legacy user-facing Markdown still exists outside `docs/knowledge/**`: 137
  files under `docs/explanation/`, 20 under `docs/how-to/`, 6 under
  `docs/reference/`, and 0 under `docs/tutorials/`.
- Current projections are named `docs/doc-registry.md` and
  `docs/doc-registry.json`.
- `fgos doctor --json` reports registry checks and enforcement as wired, but the
  full doctor run is not green. Existing registry-related failures include one
  missing `currentPath` and four unresolvable outcome source captures.
- The implemented registry is still the narrower end-user/Diataxis foundation;
  it is not evidence that the proposed multi-profile platform Knowledge and
  Documentation Engine or Agent Context Engine exists.

These are current observations, not amendments to the historical plan's claims.
Future drift must be measured from live registry/events/projections rather than
written back into the old phase files.

## 4. Current Interpretation

- Historical implementation record: this directory.
- Current end-user registry behavior: live state/code, generated registry
  projections, and the end-user documentation specs.
- Full-horizon documentation architecture:
  `docs/platform/proposals/documentation-system-unification.md`.
- Proposed near-term platform-authority program:
  `plans/260925-documentation-authority-unification/plan.md`.

The directory name and historical files remain unchanged. This correction note
adds interpretation without renaming, deleting, promoting, or rewriting them.
