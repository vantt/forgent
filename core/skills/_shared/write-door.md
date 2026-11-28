# Shared fragment: write-door

The procedure for adding one claim to maintained documentation. It is domain-free: a skill that has a claim to write
follows these steps instead of choosing a place by hand. The rules behind the steps live in
`docs/platform/documentation/subcomponents/write-door/spec.md` (6.1, 6.4, 7) and
`docs/platform/documentation/subcomponents/document-identity/spec.md` (8.1). The worked examples are in
`docs/platform/documentation/operations/how-a-document-is-written.md`.

Untrusted input: drafted text and item text go through files under `.fgos/runtime/tmp/`, never raw into a shell line.
Pass the file, or `"$(cat <file>)"` where a verb takes only a value.

## Steps (once per claim)

1. **State the claim and draft the paragraph.** Translate the draft into the corpus's language (English here) before
   locate; this is required. A draft in another language ranks a right unit in the top 3 for 0% of queries, and a draft
   with no names gets no help from the literal scan. Put every name the claim touches (verb, flag, path, symbol, rule
   id) in backticks. Write the draft to `.fgos/runtime/tmp/<id>-draft.md`.
2. **Locate.**
   ```bash
   fgos doc locate --draft-file .fgos/runtime/tmp/<id>-draft.md --json
   ```
   Optionally add `--area <value>` and `--question <value>`, and `--exact <string>` for a name or phrase the draft does
   not backtick. If `state` is not ready or `partial` is true, run `fgos doc index status --wait <s>` once and locate
   again. If it is still partial, continue: `mentions` is complete either way. Say so in the record.
3. **Read, then decide.** Read one to three candidates around their `section`, **and every mention marked
   `missedBySearch`**. Decide `grow`, `ask`, `create` or `no-place`. Never decide from rank alone, and never from
   mentions alone: a name in a section does not make that section the carrier.
4. **Handle every mention.** Each mention gets one handling:
   - `updated`: edit the section so it agrees with the claim;
   - `unaffected`: it names the term but states nothing the claim changes;
   - `too-common`: with a note. Use it when `truncated` is true and a longer `--exact` string does not narrow it.

   Do not run `rg` over the corpus instead: locate's scan is the corpus scan.
5. **grow, a user knowledge unit.** Under its `## Evidence` section (create it at the end if absent) add one line:
   ```md
   - YYYY-MM-DD <id>: <what this item showed, one line>
   ```
   Change the claim's statement only if the item changed it. Commit that path by pathspec (never a blanket add), then
   attest:
   ```bash
   fgos knowledge attest --doc-path <path> --capture-id <id> --locate-file .fgos/runtime/tmp/<id>-locate.json
   ```
   Build the locate file from the locate answer. Give `why_not` for each candidate read and not grown, and every
   mention with its handling; the verb refuses a mention without one:
   ```json
   { "query": "<terms searched>",
     "candidates": [{ "path": "docs/...", "section": ["<heading>"], "why_not": "<why it does not carry the claim>" }],
     "mentions": [{ "path": "docs/...", "section": ["<heading>"], "missedBySearch": false, "handling": "unaffected" }] }
   ```
6. **grow, a composite document (spec, contract, guide).** Edit the section only when the claim changes what it states,
   then run `node scripts/doc-health.mjs`. Otherwise the claim is already carried: record a non-engine decision that
   names `path#heading` and why nothing is added.
7. **ask.** Two candidates fit. Use the decision question of the communication standard (`owner-communication.md#decision-question`); resume at grow or create
   with the answer.
8. **create or no-place.** No candidate carries the claim, or no area fits. Write the request to
   `.fgos/runtime/tmp/<id>-request.txt` (first line `Admission request: <claim>`, then a line linking the item). Write
   the claim sentence to `.fgos/runtime/tmp/<id>-claim.txt` and the drafted paragraph to
   `.fgos/runtime/tmp/<id>-material.md`, through files, never raw on a shell line. Keep the request id `fgos submit`
   returns for `--request`, then:
   ```bash
   fgos submit "$(cat .fgos/runtime/tmp/<id>-request.txt)"
   fgos knowledge handoff --capture-id <id> --request <requestId> --decision create \
     --claim "$(cat .fgos/runtime/tmp/<id>-claim.txt)" \
     --material-file .fgos/runtime/tmp/<id>-material.md \
     --locate-file .fgos/runtime/tmp/<id>-locate.json
   ```
   Use `--decision no-place` when no area fits. The locate file carries the mentions' handling, as for grow. Never
   `fgos topic register`, `fgos doc reserve` or `fgos doc register` unless a person asked for that slot; a missed
   lookup is never permission to create.
9. **Report** the claim, the decision, the mentions updated, and the record written.

## What this door cannot catch

Locate finds; it does not judge. Neither the ranked candidates nor the literal scan catch a prose claim with no names
written in another language, or a carrier outside the registry. See `docs/platform/documentation/subcomponents/document-identity/spec.md`
section 12.1 "Known limits of finding" for the list and what would close each; it is not restated here.
