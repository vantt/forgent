# terminal-control placement policy (measured-split)

## Done
- `policy/mod.rs`: registry `policy_by_name(Option<&str>)` (None -> `DEFAULT_POLICY` = `measured-split`), `POLICY_NAMES`, `PolicyError::Unknown{name}` with a message naming the known policies. Existing types kept.
- `policy/measured_split.rs`: pure `MeasuredSplit`. Per group pane x {right, down}: smaller child = `floor(size/2)`; candidate counts only if both children reach min cols and rows; score = smaller/min along the split axis, compared as exact fractions (no floats). Preference: higher score, then right before down (direction beats anchor order, per contract), then earlier anchor in `groupPanes`. Anchors whose tab holds >= `maxPanesPerTab` panes (all owners, from tab geometry) are skipped; no candidate -> `newTab`. Empty group -> `newTab`. Ratio always 0.5. `roleHint` and labels never read.
- 14 fixtures in `contracts/policy-fixtures/` (`.gitkeep` removed): empty group, 1-6 panes on 352x69, 110x80 portrait, 244x71, 51x18 below min, full tab, other key's pane largest, full tab falls to roomy tab, two tie-break cases, exact-minimum boundary (+ roleHint ignored).
- `tests/policy_fixtures.rs`: every fixture; placement JSON shape; registry; property over 2000 generated geometries (both children >= min, anchorKey exists in groupPanes, anchor tab not full); property filling 300 random tabs until `newTab` (no pane ever below min, never over max); comparison: fixed 0.3 down-split on 352x69 after 6 workers gives heights 20,14,10,7,5,13 (under 20 rows), measured-split fills the same tab to 8 panes, all >= 80x20.

## Contract notes
- `Placement::Split.anchor_key` now carries `#[serde(rename = "anchorKey")]`. `rename_all` on the enum renames variants only, so the field serialized as `anchor_key`, not the contract's `anchorKey`. Fixture round-trip needed it.
- `PlaceRequest` has field `label` while the contract says `display`; left as the shared type has it (unread by the policy). Fixtures use `label`.
- Contract text "69 -> 35+34" vs `floor` formula order: only the smaller child (34) matters for scoring; test simulation gives the odd cell to the first child.

## Verification
- `cargo test -p fgos-terminal-control`: green (6 passed, 3 suites).
- `cargo clippy -p fgos-terminal-control --all-targets -- -D warnings`: clean.
- `cargo fmt -p fgos-terminal-control -- --check`: clean.
- Deviation: `/home/vantt/projects/forgentX/target` is read-only in this sandbox and the `CARGO_TARGET_DIR=` prefix form was refused, so cargo ran with `--target-dir /tmp/fgos-work/tc-p04-target`. Same code, different build dir.
- The phase file `plans/261016-1306-.../phase-04-placement-policy.md` is not in this worktree and the main checkout copy was unreadable; work followed the assignment text and the contract.

## Unresolved
- Phase file checklist not cross-checked against the assignment text (file unreadable).

Status: DONE_WITH_CONCERNS
Summary: measured-split policy, registry, 14 fixtures and tests land; test, clippy and fmt are green.
Concerns/Blockers: built in a /tmp target dir (shared target read-only); phase file unreadable.
Context refs:
- (none)
Expected outputs:
- (none)
