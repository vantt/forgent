# Review a38 step-05 rr4 p35

## src/setup/project-launcher.mjs (pin aa8d3437)

Verdict: ok. Items reviewed: 12 (dynamic-014074 to dynamic-014085). All are REJECT / preserve. No diff, no parks.

I read the whole pinned file with grep for docs, .md, spec, readme and plans/. It has no documentation path, extension or directory anywhere. The file only does these things:
- PATH lookup (`firstOnPath`, `pathDirs`).
- Writing launcher script bodies. The shell and cmd bodies walk up to `.fgos/installation/bin/fgos`, which is an install path and not a document.
- A diagnostic echo that mentions `fgctl init`.

OUTCOME defects: none.

Per-item checks:
- 014074, 014075, 014082 to 014085: each takes a PATH value or builds a binary candidate path (`path.join(dir, name+ext)`, `path.join(dirname(fgctl), launcherFileName)`). The target is an executable and never a document. The `scalar-pass-through` and `guard` labels are true.
- 014076 to 014081: launcher script template text (`dir=$PWD`, the dirname loop, the cmd `%CD%` and parent loop, `join('\r\n')`). The text only searches for `.fgos/installation/bin/fgos` and does not read a document. The labels are true.

Same-passage consistency: overlapping windows (014078 and 014079, 014083 to 014085) all reject and preserve, so they agree.

Record-text notes (not outcome defects):
- The `rejectedAsUnrelatedReason` and `reason` strings for 014081, 014084 and 014079 quote truncated or mangled fragments, for example `PATHEXT || '.EXE` and `dir=%CD%"\'`. They are accurate in substance and only cosmetic.
- 014078 uses role `non-document-message` for a `rem` comment line in a batch script. It is really launcher body text, but the outcome is the same.
- 014075 `nonDocumentUse` is `scalar-pass-through`. It is really an executable-launcher destination path (`path.join` into the fgctl dir). The substance is still non-document, so only the label is loose.

Lead-judgment questions: none.

Counts: 12 reviewed, 12 reject, 0 admitted, 0 parks, 0 diffs, 0 outcome defects, 3 record-text notes.
