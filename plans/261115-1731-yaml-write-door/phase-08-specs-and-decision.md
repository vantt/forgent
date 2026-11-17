# Phase 08: specs and the decision record

Start after: plan approval (may start beside 01); lands after 07 (and so after 02-06) on the integration branch, so the
names and the phase reports of 01-07 it cites exist. Writes in parallel with 01-07. Rules: [phase-lead-rules.md](phase-lead-rules.md). Facts: F2, F4. Worktree `ywd-p08`, report slug
`ywd-p08-specs`. Effort: 1.5h.

## Context

L5 question 6: the settled decision goes into the owning holder. The YAML door's decisions live in
`docs/platform/packaging-distribution/spec.md` "Lịch sử quyết định" (RUL108 and the 2026-11-14 frontmatter entry, which
rejected a writer "in this change" and put it on the idea list); `docs/platform/yaml-document/spec.md` carries the
component contract and one pointer line per decision (its section 15 entry of 2026-11-14 is the pattern). Resolve the
holder through `docs/platform/governance.md#decision-scope-to-holder-table` before writing; if it names a different
holder, use it and say so in the report.

## Requirements

1. `docs/platform/yaml-document/spec.md`:
   - header "Implementation" line: the Node door writes too (`writeFrontmatter`, addon `yaml.emit`).
   - section 1: "what are the exact bytes after this one change" gains "or of a new document".
   - section 2 table, right column "The frontmatter cut ...": the frontmatter cut and write (`readFrontmatter`,
     `writeFrontmatter` in `src/util/yaml.mjs`).
   - section 5: one row `emit(value)` = "the bytes of a new document holding `value` (a `set` of the whole value on an
     empty document): rendering depends only on the value; the re-parse check applies"; one sentence under the table that
     an empty path on an empty document writes the whole value; one sentence that this is a bounded shape-A render of new
     content with the renderers `set` already uses for new subtrees, not a shape-B re-render of an existing document.
   - section 6 (or 5, guarantee 3): a string holding a character of the hidden set is never written plain; double quotes
     escape it as `\uXXXX` (value unchanged).
   - section 10: one bullet: the `yaml` namespace exposes `parse` and `emit`; `yaml` marker 2 is the first with `emit`;
     `writeFrontmatter(meta, body, file)` is the one writer of YAML text in Node and reads back through `readFrontmatter`;
     there is no general `stringifyYaml` (no caller; the crate's `emit` is general); the Node-side rule ids
     `frontmatter-not-a-mapping`, `frontmatter-not-json`, `frontmatter-not-round-trip`; a `yaml` marker below 2 makes the
     whole native door unavailable to the payload (one conjunction in `combinedAbiMatches`).
   - section 15: a pointer entry "2026-11-15: the door writes." naming the holder entry.
2. `docs/platform/packaging-distribution/spec.md` "Lịch sử quyết định", new entry at the top of the section, same form as the
   2026-11-14 entry: what was there (five hand writers, list from phase-00 F3), decision (one writer: crate `emit`, addon
   `yaml.emit`, Node `writeFrontmatter`; frontmatter-only Node surface), the standalone `distill.mjs` writer kept on its own
   path (`oneDoor: standalone`), rejected options (a parse-back check beside each hand writer: quoting stays hand-written;
   a second printer in the crate: shape B, against the 2026-10-22 shape A decision; a general Node `stringifyYaml`: no
   caller), evidence (phase reports of 01-07, golden fixture count), guard (the doors row "write a YAML frontmatter fence"
   from 09) and its stated limit (fence literals only, scanned roots and extensions only).
   Supersedes nothing; it closes the 2026-11-14 entry's "Rejected: a YAML writer in this change" (say so; do not edit that entry).
3. `docs/platform/component-boundary.md:90` (YAML Document row): replace the stale "`frontmatter.mjs` and `distill.mjs` stay
   on their own paths" with "reads and writes a frontmatter block through `src/util/yaml.mjs`; the shipped `distill.mjs` and
   `instruction-audit.mjs` stay on their own paths".
4. Run `node scripts/check-decision-citation-drift.mjs` and `node scripts/doc-health.mjs`; fix only what this phase caused.

## Files

- Modify: `docs/platform/yaml-document/spec.md`, `docs/platform/packaging-distribution/spec.md`, `docs/platform/component-boundary.md`
  (no census change: Markdown is not judged; if the hook says otherwise, regenerate).
- Create/Delete: none. Tests retired: none.
- Net size: about +25 doc lines.

## Acceptance

- `test/scripts/doc-health.test.mjs` and `test/scripts/check-decision-citation-drift.test.mjs` green; every symbol the text
  names exists on the integration head (`rg -n "writeFrontmatter|js_name = \"emit\"|pub fn emit" src packages`).

## Risks / rollback

- Collision with S4 phase 12 on `docs/platform/packaging-distribution/spec.md` (M x L): S4 edits section 2 and its own
  history entry; this phase adds one history entry. Rebase at land; never hand-merge whole sections. Revert the commit.
