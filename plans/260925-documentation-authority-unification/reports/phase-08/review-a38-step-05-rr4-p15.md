# Review p15 (Step 5 seam 4, round 4)

Payload: s4-src-p15.json, pin 95301cb9. 3 files, 68 items (46 + 10 + 12). No diffs, no parks.

## scripts/export-command-selectors.mjs: ok (46 items)
All 46 dynamic tuples are REJECT/preserve. The pinned file has no docs, .md, plans/ or spec string anywhere.
- Constants and defaults (007467-70, 7490-91, 7494-95, 7502-08, 7510-12): these only build the packages/host-runtime/contracts/*.json route-annotation paths, take argv paths, or are CLI plumbing. None is a document path. Rejecting them as scalar-pass-through is correct.
- Error and summary text (the caller-data-formatting group): the strings interpolate selectors, routesPath and counts that come from caller data. There is no fixed document root, so R6 makes them formatting and they reject correctly.
- 007478 (owner_path 'src/cli/command-registry.mjs', compatibility_tests test/... paths): these are metadata values written into the routes JSON. They are source and test paths, not documents. Reject is correct.
- 007492/93 (the .tmp sibling of routesPath): a non-document temp path next to the output JSON. Reject is correct.

OUTCOME defects: none.

## scripts/fgos-session-start-hook.mjs: ok (10 items)
- 007513-16 reject on root plumbing and the .fgos storage and logs directories. 007514, 007515 and 007518 use state-event-store, which is acceptable for fgosDir/logsDir state paths.
- 007517, 007519-21 print storage, logs, skill root and shell-profile paths. These are runtime directories, not document paths. No fixed document literal exists, so reject is correct.
- 007522 is profileFiles.join, a text join. Reject is correct.

OUTCOME defects: none.

## scripts/fgos-shell-integration.sh: ok (12 items)
- reference-003557 (L25, docs/history/global-project-config-awareness/CONTEXT.md): ADMIT/preserve is correct. The target is docs/history, not docs/specs or docs/architect. It exists at the pin and is a comment citing a design decision, with no patch target.
- reference-003558 (L13-14, docs/history/install-setup-external-project-reliability/CONTEXT.md): ADMIT/preserve is correct. The two lines are the same passage and share one outcome, and the real file exists at the pin.
- dynamic-007523-32 reject on git-common-dir probes, dirname of the root, $PWD walk-up, local declarations, has_dir flags and the .fgos/installation readlink. These are binary and installation resolution, not documents. The .fgos path is installation state. The rejects are correct.
- The ~/.fgos/config.json cache read in the pinned file has no tuple. It is a state file and not a document, so nothing is missing.

OUTCOME defects: none.

## Record-text notes (not outcome defects)
1. reference-003558: matchedExpression and resolverWitness.expression are the line-wrapped fragment "docs/history/install-setup-". The witness therefore says existsAtPin=false. The full path docs/history/install-setup-external-project-reliability/CONTEXT.md exists at the pin. The text should carry the joined path, existsAtPin=true. The outcome is unchanged.
2. dynamic-007493 has a role (non-document-infrastructure) that differs from its sibling 007492 (non-document-formatting) on the same line. Both reject and share one outcome, so this is cosmetic. Their nonDocumentUse is caller-data-formatting, but the real use is a temp-file path. A label like temp-sibling-path would be more accurate.
3. dynamic-007514, 007515 and 007518 are labelled state-event-store for fgosDir and logsDir (the .fgos storage and logs directories, not an event store). The reject holds. The label is loose.

## Lead-judgment questions
None.

## Counts
Files 3; items 68 (reject 66, admit 2); outcome defects 0; record-text notes 3; diffs 0; parks 0.

Status: DONE
Summary: All 68 items in p15 have correct admissions and dispositions with no outcome defects. There are three minor record-text notes, mainly the line-wrapped path fragment in reference-003558.
