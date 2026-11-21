# Phase 2: Addon bytes on a digest mismatch, PE section named

## Inputs
- plan.md Facts; backlog row p-omvbh4a7xm in docs/backlog.md (failing and passing run ids).
- .github/workflows/release-assets.yml, jobs `build`, `independent-addon` and `compare-addon`.

## Files it may write
.github/workflows/release-assets.yml

## Steps
1. In `build` (staged addon at `dist/tree/<manifest nativeAddon.path>`) and in `independent-addon`
   (`target/release/fgos_node_addon.dll` on Windows), upload the addon file as an artifact for the windows-msvc
   target, with short retention (for example 3 days) and names under the existing `${{ inputs.artifact-prefix }}`.
   Keep the existing digest artifacts and names as they are, and keep the compare job's download pattern matching
   only what it needs.
2. In `compare-addon`, keep `cmp` blocking. When it fails for a triple, upload that triple's two addon files together
   as one artifact named for the mismatch (longer retention, for example 14 days), then fail. The job is never made
   non-blocking and never retried until green.
3. The lead dispatches `release-assets-check` on the branch several times (it is intermittent) until one run shows a
   mismatch. Then, outside the repository (in `.fgos/runtime/tmp/` or a temp directory), diff the two PE files
   section by section, for example with Python `pefile` or `objdump -h` plus `cmp -l`. Name the differing section(s)
   and byte ranges and what they hold (timestamp, debug directory or PDB GUID, `.rdata` contents, section order and
   so on), and say where they come from as far as the bytes show.

## Verify
- `actionlint` if available, or a YAML parse of the workflow.
- A dispatched run where the digests match is green and the addon artifacts exist. A mismatch run uploads the pair
  and fails. The summary names the section, with the run id.
