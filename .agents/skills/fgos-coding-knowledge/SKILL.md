---
name: fgos-coding-knowledge
user-invocable: false
description: >-
  Synthesize retrospective knowledge into registry-backed end-user documents.
  Use once a claimed item's status reads `retrospective` — driven by the retrospective loop
  (/fgOS:retro-next).
---

# fgos-coding-knowledge

Runs while a work item sits at status `retrospective`. This skill turns the item's outcome/friction capture into a registry-backed knowledge document in `docs/<purposeSlug>/<role>.md`.

## Hard rules

- Do not write prose directly to disk without reserving/checking registry first.
- Do not create a document outside `docs/<purposeSlug>/<role>.md` matching the registry `currentPath`.
- Write and commit first, tag and attest second.
- Do not automatically promote documents to `active` state — promotion MUST be done explicitly via `fgos doc promote`.
- Do not auto-open new topics quietly. Topic creation MUST go through `fgos topic register`.
- Do not splice item titles/descriptions raw into shell commands.

## Flow

1. **Resolve topic + role.** Ask registry for `(topicId, role, docId)` based on the capture's topic.
   - **Re-attest branch (tsk-555):** if an ACTIVE doc for this `(topicId, role)` already
     covers the capture and no new doc is needed, skip steps 2-3 entirely — go straight
     to step 4, attesting the EXISTING `currentPath`. Never close a re-attest judgment
     with only a closing report (`fgos report`/driver stop reason) and no `fgos knowledge
     attest` call — a report alone is `kind:'engine'` bookkeeping, indistinguishable from
     an item that was never retrospected at all, and the item parks at `cleanup ->
     blocked` forever (`checkRetrospectiveContent`, src/state/cleanup-harness.mjs) even
     though the judgment was real.
2. **Reserve doc slot if new.** Run:
   ```bash
   fgos doc reserve <topicId> <role> <currentPath>
   ```
3. **Write & commit file.** Write document at `currentPath` and commit to git HEAD:
   ```bash
   git add <currentPath>
   git commit -m "docs(<id>): retrospective synthesis"
   ```
4. **Attest document.** Links this item's own capture to the doc slot
   (docs/architect/knowledge-registry-redesign.md §7.4) — REQUIRED for both a
   freshly-written doc and a re-attest of an existing one. Run:
   ```bash
   fgos knowledge attest --doc-path <currentPath> --capture-id <id>
   ```
5. **Mark rendered.** Update lifecycle from `reserved` to `provisional`:
   ```bash
   fgos doc mark-rendered --topic-id <topicId> --role <role>
   ```
6. **Promote when ready.** Run explicit promotion:
   ```bash
   fgos doc promote <topicId> <role>
   ```
7. **Move item to cleanup.** Move item to cleanup:
   ```bash
   fgos move <id> --to cleanup
   ```

## Red flags

- Inventing a file path instead of asking registry.
- Automatic promotion to active instead of using explicit `fgos doc promote`.
- Writing file without reserving first.
