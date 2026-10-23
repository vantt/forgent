# w3-d7-resync review: D7 commit d9bedf229

Scope: brief `w2-d7-brief.md` and receipt `reports/phase-09/resync-b/`. Shard `ledger/decisions/s14-resync-b.json`. Everything here was recomputed independently in `/tmp/fgos-work/w3-d7-resync/` and checked against the committed bytes.

Verdicts: **21 APPROVE / 3 REWORK**. Every item was checked; no sampling was needed.

## Verified
- **Scanner rerun.** The owning scanner was rerun at d9bedf229 with only its plumbing changed and output written to /tmp. Result: 33 files, 0 missing units, 0 missing changed units. The records match the receipt's scan apart from `head`. Baseline at 6d275ad81: 594 missing units.
- **Retired-engine history.** All 84 files under `docs/platform/agent-coordination/history/` are byte-identical to the parent commit and to 6d275ad81.
- **Bindings.** All 1646 binding hashes recompute with the declared 4-key recipe and self-inclusive ancestry. Every target anchor and digest exists at HEAD. All 577 source rows match 6d275ad81.
- **Containment.**
  - 367 literal-history rows: 362 strict, 5 differ only by rebased links.
  - 169 equivalent rows: 139 strict, 30 differ only by link targets.
  - 1049 of 1050 "full content preserved" refresh rows are byte-equal.
  - All 71 historical supersession rows resolve.
  - No prior-shard row on the 12 changed documents is left stale.
- **Judgment rows.** All 41 judgment unitCarries and all 19 judgment refresh rows were checked against code and git: credentialStore, sweepAttempts, the attempt-owned home, the 4170 port, the 19 OpenAPI paths and PATCH route, friction ping/migrate, CTR010/CTR011, V-013, f9c98501c and 15c7e720c.
- **One holder per text.** No added text is duplicated in another live document. The §13.1 recipe now lives only in the spec, and the history page keeps a link to it.
- **Headers and links.** The seat-binding and workflow headers are tidy, with the legacy YAML moved verbatim into a provenance fence. knowledge-registry.md has one `Document type`. All 192 links in the changed documents resolve.

## REWORK
1. **`/unitCarries/125, /132, /247`: wrong kind and reason.** These rows are labelled "post-retirement edit, not carried", but the Migration-status banners date from 9818f25a8 (2026-09-19), before retirement 2180b4e72 (2026-10-02). coordination-session.md and flow-definition.md have no commits at all after 2180b4e72. Identical banners on files with a live successor are classified `candidate-metadata-adaptation` (rows 36, 66, 89, 319). Leaving them uncarried is correct; the stated reason is not.
2. **`component-boundary.md`: 8 `../specs/` links remain.** Lines 69, 70, 72 (runner), 73, 74 (herdr-web-dashboard), 75 (confinement-authority), 81 (observe) and 281 (reading-map). Live successors exist for herdr, confinement, observe and the reading map; the runner links wait on D1b. The brief named only the workflow and enduser links, and those are fixed, so this fails only the stricter scope criterion. The Seat Binding and Workflow rows are correct.
3. **`/bindingRefresh/475` (low): mislabelled.** It says "Full unit content preserved", but its links changed from `../specs/workflow.md` to `workflow/spec.md`. Row 577, with the same kind of change, is labelled as changed.

## Notes
- `docs/reading-map.md:125` cites a plan report path in live prose; the archive move will relocate it.
- `platform-foundations.md:416` is a verbatim carry that still cites the old path `docs/platform-foundations.md` §L7.
- I could not find a separate D7 launch note authorizing the seat-binding, workflow and knowledge-registry edits, which fall outside the brief's writable list. The edits match the checks the Lead asked for.
