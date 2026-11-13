---
name: fgos-coding-knowledge
user-invocable: false
description: >-
  Turn a retrospective item into claims: add each claim as evidence to the
  knowledge unit that already carries it, or hand it to an admission request.
  Use once a claimed item's status reads `retrospective` — driven by the
  retrospective loop (/fgOS:retro-next).
---

# fgos-coding-knowledge

Runs while a work item sits at status `retrospective`. The item's story already lives in the work item and the event log; this skill never writes a document per item. It states what the item showed as claims, and grows the unit that carries each claim with one line of evidence (write door 6.4, `docs/platform/documentation/subcomponents/write-door/spec.md`). The procedure is `docs/platform/documentation/operations/how-a-document-is-written.md`, sections 4, 6 and 11.

## Hard rules

- Grow is the default. Never `fgos topic register` or `fgos doc reserve` unless a person asked for that slot; a missed lookup is never permission to create.
- No verdict from a score or a hit count: read the candidates and decide.
- Write and commit first, attest second.
- No automatic promotion; promotion is a person's `fgos doc promote`.
- Never splice item titles, descriptions or drafted text raw into shell. Write them to files under `.fgos/runtime/tmp/` and pass files, or `"$(cat <file>)"` where a verb takes only a value.
- A closing report (`fgos report`, `kind:'engine'`) is not retrospective evidence; the cleanup gate refuses it.

## Flow (per item)

1. **State the claims.** One to three, one sentence each: a fact, rule, failure mode, decision or procedure. If the item showed nothing reusable, say so in one sentence and record that judgement as a decision:
   ```bash
   fgos decision --id <id> --relation none \
     --text "$(cat .fgos/runtime/tmp/<id>-decision.txt)" \
     --rationale "$(cat .fgos/runtime/tmp/<id>-rationale.txt)"
   ```
   then go to step 4.
2. **Locate each claim.** Draft the paragraph the claim would add, in English (translate first if needed). Search with `rg -l -i` on two or three distinctive terms of the draft:
   ```bash
   rg -l -i '<term>' docs/knowledge docs/explanation docs/how-to docs/doc-registry.md
   ```
   Read the best three to five candidates, the document around the hit, not only the matched line. (`fgos doc locate` replaces this search when it lands.)
3. **Decide per claim** — `grow`, `ask`, `create` or `no-place`:
   - **grow** — a unit carries the claim. Under its `## Evidence` section (create it at the end if absent) add one line, with the decision or incident id when there is one:
     ```md
     - YYYY-MM-DD <id>: <what this item showed, one line>
     ```
     Change the claim's statement only if the item changed it. Commit that one path by pathspec (never a blanket add), then attest the unit's registry `currentPath`:
     ```bash
     fgos knowledge attest --doc-path <currentPath> --capture-id <id>
     ```
   - **ask** — two candidates fit. Ask with the decision-question template (`../_shared/decision-question.md`); resume at grow or create with the answer.
   - **create** or **no-place** — no candidate carries the claim, or no area fits. Request admission and record the handoff:
     1. Write the request text to `.fgos/runtime/tmp/<id>-request.txt`: first line `Admission request: <claim>`, then a line linking the retrospective item `<id>`.
        ```bash
        fgos submit "$(cat .fgos/runtime/tmp/<id>-request.txt)"
        ```
        Keep the returned request id.
     2. Write the drafted paragraph to `.fgos/runtime/tmp/<id>-material.md` and the locate result to `.fgos/runtime/tmp/<id>-locate.json`, one `why_not` sentence per candidate read:
        ```json
        { "query": "<terms searched>", "candidates": [{ "path": "docs/...", "section": ["<heading>"], "why_not": "<why it does not carry the claim>" }] }
        ```
     3. Record the handoff (the claim also from a file):
        ```bash
        fgos knowledge handoff --capture-id <id> --request <requestId> \
          --claim "$(cat .fgos/runtime/tmp/<id>-claim.txt)" \
          --material-file .fgos/runtime/tmp/<id>-material.md \
          --locate-file .fgos/runtime/tmp/<id>-locate.json
        ```
4. **Move the item to cleanup** once every claim was grown and attested or handed off:
   ```bash
   fgos move <id> --to cleanup
   ```

## Red flags

- Opening a topic or reserving a slot because no unit was found.
- Writing the item's story into a unit instead of one evidence line.
- Rewriting a unit's claim the item did not change.
- Attesting before the evidence line is committed.
