# W11 import 3 resume: unblock the re-sync (Doer brief)

Status: Lead brief under L12-137 and L13-6. This turn resumes `w10-import3-brief.md`. Read that brief, `import3/receipt.md` and `import3/receipt.json` first. The Lead answers the two blockers as follows.

1. **`docs/reading-map.md` is now writable.** It is the surviving detailed navigation holder. Bring its section 5 up to date with main's imported source:
   - 9 confinement probes, 10 with blind;
   - the `machine-private-hidden` mask on `~/.fgos/private`;
   - the native config verbs, migration and repairs that are now complete, with Node and gateway deferred to Slice C.

   Keep the L11-25 banner and the existing knowledge fixes. Change only what the import changed. Add the bindings or carry rows under the declared recipe.
2. **Scanner and prepared shards.** `ledger/decisions/w9-component-carriage-body-overlays.json` has `appliedToDocs: false`. Its rows target a history file that exists only after the prepared relocation is applied at the final pin, so before that the old rows they supersede are the effective ones.
   - Change `late-areas/scan-legacy-drift.mjs` so it does not resolve a shard marked `appliedToDocs: false` against the live tree. It must not drop the shard silently: report it as `preparedPendingApply` with a row count, and keep the superseded rows effective.
   - Prove two things in a scratch copy: the scan still fails with ENOENT when a shard that has no such flag points at a missing file, and the scan resolves the overlays when the prepared composition is applied (the composition replay already builds that tree).
   - Make no other change to the scanner's logic.
3. Then finish the original tasks 2–4 of `w10-import3-brief.md`:
   - carry the 24 unproven units (confinement 18, navigation 2, seat binding 4) or prove that each one is already carried;
   - rerun the scan until it reports zero missing;
   - refresh the three ratchet exception digests in the existing `mainMergeAccounting` format, naming 571a996f5 as the input;
   - `node scripts/check-legacy-docs-ratchet.mjs` must exit 0;
   - `rebind/rebind.py --check` must exit 0;
   - `phase-08/audit-report.py` must show audit-ownership exit 0 and no failing rows.

   For the evidence relocation `--before` check, do not load a native addon. If the check needs one, record the check as not run and say why. The last attempt staged a checkout addon under ignored `.fgos/runtime/git-addon/`; the Lead accepted that side effect, but it must not happen again.
4. Update `import3/receipt.md` and `import3/receipt.json`.

Writable (exact):
- docs/platform/**
- docs/reading-map.md
- plans/260925-documentation-authority-unification/ledger/decisions/**
- plans/260925-documentation-authority-unification/phase-09-atomic-platform-authority-cutover.md
- scripts/check-legacy-docs-ratchet.exceptions.json
- plans/260925-documentation-authority-unification/reports/phase-09/import3/**
- plans/260925-documentation-authority-unification/reports/phase-09/late-areas/legacy-drift.json
- plans/260925-documentation-authority-unification/reports/phase-09/late-areas/scan-legacy-drift.mjs

The other rules of `w10-import3-brief.md` still apply. Scratch `/tmp/fgos-work/w11-import3/` only.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
