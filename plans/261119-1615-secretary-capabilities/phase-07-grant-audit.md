# Phase 7: Live grant audit from Miu's sandbox

## Gate
Phases 1-6 landed, released, and Miu rotated onto that release.

## Requirements
1. After phases 1-6 are released and Miu rotated (ask the supervisor), run from her real sandbox (or a throwaway
   secretary head): `fgos identity mint backlog`, `fgos questions list|show|answer`, `fgos session write --base`,
   `fgos session write --add-rows`, `fgos session start shaper --name <n>`; record exit codes and outputs.
2. Write the full verb list of the secretary grant (socket verbs and local verbs) in the fgos-secretary skill and in
   docs/platform/agent-confinement/spec.md, from `head-grants.mjs`, not by hand-copy drift (cite the source).
3. Any gap found is fixed in head-grants.mjs or filed as a backlog row.
