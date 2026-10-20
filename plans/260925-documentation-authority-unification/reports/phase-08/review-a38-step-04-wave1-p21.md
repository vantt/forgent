# Review A38 - Step 4 wave 1 part 21 (L12-58 Step 5 source witnesses)

Two mandatory ownership witnesses, 4 join rows, no Step 4 record or diff. Both digests match the pin (close.sh 0ddfcc36dfad..., rename.sh f5dc67dab59851...). Both files read whole.

## plugins/fgOS/skills/terminal-close/close.sh - verdict: ok
Source owner = the file itself (`UNRESOLVED-RENDER-SOURCE:` marker is a lookup placeholder, header absent, `renderOnly:true` join only). Custody "Executable source; Step 5 only; no Step 4 diff and no generated status inferred". Joins: skills-191 (line 4, `docs/history/fgos-terminal-close-autoclose/CONTEXT.md D2`) - path exists, historical provenance. Bucket step5. No Step 4 record row in step04-008 (its terminal-close entry is only SKILL.md, preserve, no diff). Correct per L12-58(3).
Missed references: none (only one `docs/` token in the file).

## plugins/fgOS/skills/terminal/rename.sh - verdict: ok
Same custody. Joins: skills-195 (line 4, `docs/history/fgos-terminal-pane-rename/CONTEXT.md`), skills-196 (line 22, `docs/history/orchestrator-worker-slots/DISCUSSION.md`), skills-197 (line 89, `docs/history/fgos-terminal-pane-rename/CONTEXT.md`). Line numbers match the pinned source (grep -n: 4, 22, 89). All three paths exist at the pin. All three are historical provenance, bucket step5, no diff. Correct.
Missed references: none. Other path-like tokens (`src/state/tool-registry.mjs`, `bin/fgos.mjs`, `src/util/session-identity.mjs`, `.fgos/installation/bin/fgos`) are live code paths, not legacy doc roots. The sibling headerless files `pane-owned.sh` and `terminal-port.sh` have no `docs/` tokens (not in this part).

Confirmation of the assignment point: both executable shell sources are recorded as Step 5 behavior with `custody` "Step 5 only; no Step 4 diff", and neither carries a patch or a render diff in Step 4.

Record-text note: the `sourceOwner` field holds the `UNRESOLVED-RENDER-SOURCE:` prefixed string on the join rows while the item-level `sourceOwner` is the plain path; harmless, but the prefix reads as "unresolved" even though L12-58(3) resolves it to the file itself.
Lead-judgment questions: none.
Counts: L12-58 Step 5 witnesses reviewed 2, rework 0.

Status: DONE
