# Phase 4: changelog fragments assembled at release

## Inputs

- `plan.md`: Outcome, "Fragment name", "Fragment body", "Where assembly runs", acceptance criterion 4.
- `scripts/prepare-release.mjs`: `updateChangelogText` (`:156-180`), `prepareRelease` (`:203-245`), the usage text
  (`:291`).
- `test/scripts/prepare-release.test.mjs`.
- `CHANGELOG.md` head (Keep a Changelog, flat `- Added:` / `- Fixed:` bullets under `## [Unreleased]`).

## Files this phase may write

- `scripts/prepare-release.mjs`
- `test/scripts/prepare-release.test.mjs`
- `changelog.d/README.md` (new)

## Steps

1. `changelog.d/README.md`: the name scheme `<yymmdd-hhmm>-<slug>.md`, the body rule (Keep a Changelog bullets
   starting `- Added:`, `- Changed:`, `- Deprecated:`, `- Removed:`, `- Fixed:`, `- Security:`), and that the
   release step assembles and deletes them. This file is never assembled.
2. `prepare-release.mjs`: read every `changelog.d/*.md` except `README.md`, in file-name order. A fragment that is
   empty or whose first non-blank line is not such a bullet refuses the release, naming the file.
   `updateChangelogText(text, tag, date, fragments)` puts the current Unreleased body first, then the fragment
   bodies, under `## [<tag>] - <date>`; it refuses only when both are empty. `prepareRelease` adds a deletion of
   each fragment to the same update set, so `--dry-run` deletes nothing. Usage text names `changelog.d/`.
3. Tests, in the owning file, one test owning the assembly ("the release section holds the Unreleased lines then
   each changelog fragment in name order, and the fragments are deleted"): two fragments plus a README plus an
   existing Unreleased line; a second case that `--dry-run` leaves every fragment; a third that fragments alone
   (empty Unreleased) release. A malformed fragment refuses by name. Existing tests keep passing.

## Verify

`node scripts/run-tests.mjs test/scripts/prepare-release.test.mjs` passes.

## Rollback

`git revert` the phase commit. Any fragment already written by later changes is moved back as a bullet under
`## [Unreleased]` in the same revert.
