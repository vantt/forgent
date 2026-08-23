# Research — dead attribution headers (tsk-5m1)

## Round 1 — 2026-08-14

**Asked:** which of the finding's two suggested directions is the smaller,
honest fix — implement `X-Fgos-Writer-Id`/`X-Fgos-Writer-Role` end-to-end
(new CLI `--writer-id`/`--writer-role` flags), or delete the dead
parameters from the contract?

**Checked:**
- `grep -n "WriterId\|WriterRole" docs/contracts/fgos-gateway-api-v1.yaml`
  — 14 references across 8 write operations, plus the two parameter
  definitions themselves (`:586`, `:597`).
- `src/runner/session-identity.mjs:1-40` (`resolveWriterIdentity`'s own
  header comment) — the SAME identity value the contract calls "writer.id"
  is not a free-standing attribution field; it is STR65's main-checkout
  lock identity (D6/D9/D15/D16), derived mechanically from an agent-session
  env var confirmed against a registry, or (bare human terminal) a
  small-fixed-hop ancestor-pid walk. Its own header comment explains at
  length WHY it is deliberately never caller-supplied: a caller-suppliable
  identity would let two distinct concurrent writers collide onto one
  string, "reopening the exact collision STR65 built [the] lock to close."
- Confirmed this is the SAME value that lands in a work item's own
  `writer: {id, source}` field (seen live on `tsk-4uh`'s own JSON earlier
  in this session: `"writer": {"id": "...", "source": "env"}`) — i.e.
  "implement it end-to-end" would mean accepting an HTTP header as a
  caller-supplied override of the exact identity STR65's lock depends on
  for collision avoidance, not merely a cosmetic attribution string.
- No existing `--writer-id`/`--writer-role` flag or override path exists
  anywhere in `bin/fgos.mjs` today — this would be new surface, not a
  wiring gap.
- Contract's own validation (`docs/history/fgos-interface-daemon/
  plan.md:75`, `tsk-7l9`'s parent verify): structural only (`openapi`/
  `paths`/`info` present, no deep schema lint) — removing two parameter
  components and their `$ref`s is a safe, mechanically checkable edit.

**Found:** "implement it end-to-end" is NOT the smaller option — it would
mean reopening STR65's deliberately-locked, caller-cannot-supply identity
design (a real trust-model change with real collision-avoidance
consequences) just to satisfy a comparatively low-value cosmetic
attribution promise. That is out of proportion for a medium-low
"attribution nicety" finding and belongs to its own separately-scoped
design work if ever wanted, not bundled into this fix. Deleting the dead
parameters is reversible (D5: pick the reversible option, no need to ask)
— a future item can reintroduce real writer attribution with its own
proper design once someone actually needs it, without this fix having
pre-committed to a specific (and here, wrong-shaped) implementation.

**Still open:** none.
