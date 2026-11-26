# Changelog Fragments

Each change in this repository records its changelog entry as an independent fragment file in this directory instead of editing `CHANGELOG.md` directly under `## [Unreleased]`. This avoids merge conflicts at land when parallel branches modify the changelog.

## File Naming

Fragment filenames follow the scheme:
```
<yymmdd-hhmm>-<slug>.md
```
- `<yymmdd-hhmm>`: minute timestamp from the change's own clock (e.g., `261126-2324`). The timestamp sorts fragments in chronological order.
- `<slug>`: short description in kebab-case (e.g., `changelog-fragments-and-skill-surface-regeneration`).

## Fragment Body

Each fragment must contain one or more Keep a Changelog bullets, exactly as they appear in `CHANGELOG.md`.

The first non-blank line of each fragment must begin with one of the standard Keep a Changelog bullet prefixes:
- `- Added:`
- `- Changed:`
- `- Deprecated:`
- `- Removed:`
- `- Fixed:`
- `- Security:`

Example:
```markdown
- Added: a change records its changelog entry as one file under `changelog.d/`; the release step assembles the fragments into the new version section and deletes them, and the land door regenerates the generated skill surfaces when two branches conflict on them.
```

## Release Assembly

During release preparation (`npm run release:prepare`, `scripts/prepare-release.mjs`):
1. Every `*.md` file in `changelog.d/` (except `README.md`) is read in file-name order.
2. The fragment contents are assembled into the new release section in `CHANGELOG.md` directly following any existing entries under `## [Unreleased]`.
3. The fragment files are deleted in the same release commit.
4. When `--dry-run` is passed, no files are modified and no fragments are deleted.

This file (`README.md`) is documentation only; it is never assembled into `CHANGELOG.md` and is never deleted by the release step.
