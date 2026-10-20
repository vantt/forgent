# Review a38 - Step 4 wave 2 part 02 (set step04-001)

Pin dc24ce645. Mandatory targeted re-review (records changed in the L12-60 sweep). Each source read whole (218, 73, 50, 66 lines); every render context diffed against its source; every slot span checked against the text at its stated line in the source or render context.

| File | Slots | Verdict |
| --- | ---: | --- |
| domains/coding/skills/fgos-coding-implement/SKILL.md | 6 | ok |
| domains/coding/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md | 8 | ok |
| domains/coding/skills/fgos-coding-implement/references/worker-contract-and-orient.md | 4 | ok |
| domains/coding/skills/fgos-coding-knowledge/SKILL.md | 3 | ok |

## Per-file findings

1. fgos-coding-implement/SKILL.md (stratum: unpatched, empty diff). Only two docs paths in the source: L71 `docs/history/<feature>/CONTEXT.md` (skills-101) and L143 `docs/history/<id>/iron-law-evidence.md` (skills-102). Both preserve under L12-10 (sibling CONTEXT and evidence conventions of external-project topology) and match the L12-60(3) rule; no retiring-tree path is named. Render joins skills-027/028 (.agents), skills-160/161 (plugins) resolve at render L72/L144 (the generated header at L12 shifts lines by one) and carry sourceDisposition preserve with the render-join label. The .claude wrapper carries no docs path and no join. No missed reference; no behavior change.
2. verify-commit-and-iron-law.md (empty diff). L65 iron-law-evidence preserve (skills-103) plus joins skills-029/162 and skills-050 (the .claude copy). L19-20 wrapped `docs/how-to/preserve-shell-escapes-when-transcribing-a-verify-command.md` is a live "read X" pointer to a path absent at the pin; the file was migrated (b1c43ca78) and the successor `docs/knowledge/how-to-preserve-shell-escapes-when-transcribing-a-verify-com/preserve-shell-escapes-when-transcribing-a-verify-command.md` exists at the pin. The author-added parked slot (edgeId null, source lines 19-20) states a dead link plus a non-executable successor note, with joins class4-l-000055 (.agents), class4-l-002057 (plugins) and a supplemental .claude join. Park (not patch) matches L12-60 sweep rule 2 and ruling 4. Wrapped spans line-correspond in all renders.
3. worker-contract-and-orient.md (empty diff). L6 `docs/history/<feature>/` directory pointer (skills-104) preserves under L12-10; joins skills-030/051/163 correct. No other path.
4. fgos-coding-knowledge/SKILL.md (empty diff). L44 `docs/architect/knowledge-registry-redesign.md §7.4` (skills-105) parks as a Phase 9 carry. The path exists at the pin in the retiring docs/architect tree; the only candidate holder, docs/platform/proposals/knowledge-registry-redesign.md, is a non-canonical conservation carrier, and Step 3 batch 063 parks the equivalent "complete design spec" pointer the same way, so the park is consistent and no patch target exists. Joins skills-031/164 correct (.agents/plugins; .claude is a thin wrapper). L12 and L17 `docs/<purposeSlug>/<role>.md` are registry placeholders, not edges.

## OUTCOME defects

None.

## Record-text notes (not rework)

- skills-105 reason, blockedReason and dependency start with the doubled prefix "A51, L12-30/31/32/58/60: A51, L12-30/31/32/58/60:".
- skills-105 wording "§7.4 or §8" is the shared template (bin/fgos.mjs cites §8); this passage cites only §7.4.

## Lead-judgment questions

None.

## Counts

step04-001 (this part): 4 files reviewed, 0 outcome rework, 21 slots reviewed. Unpatched stratum: 4 reviewed / 0 rework. Patched stratum: 0 files here.

Status: DONE
