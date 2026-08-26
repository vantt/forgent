# Context — tsk-1hq: settleClaim CAS refuses legitimate same-writer revision drift

## Feature boundary

tsk-1hq reported `settleClaim`'s `preClaimRevision` CAS check
(`src/state/store.mjs:1101-1105`) refusing a claimed item's own return
after a legitimate mid-lifecycle `fgos edit` call from the same writer
that holds the claim — treated as a concurrent conflict when it was not.
Discovery (`RESEARCH.md` round 1) confirmed the repro and found the gap
was broader than `fgos edit` alone: `moveStage` (every `fgos discover`/
`fgos plan` stage move) has the identical gap, since it also mutates
`work[id]` without touching the claim record, and `preClaimRevision` is
written exactly once, at claim-acquire time, and never refreshed by any
mutating door.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| — | Fresh live repro on tsk-1ef (2026-08-26): claimed at discovery (per /fgOS:cook's own documented early-claim pattern), fgos edit --kind/--docs-ref/--footprint/--action all touched work.tsk-1ef between claim and return; fgos return then refused twice identically -- exit 3, durable revision changed from 63ad2bb5a69d6966 to 64d29e8b1ba9edf8. Confirms the mismatch between tsk-40m's settleClaim design and cook's own claim-before-discovery pattern is real and reproducible, not tied to a specific caller. Real implementation already committed (fgw/tsk-1ef 530e5db0), left stuck at status doing per user decision -- no state surgery applied this time. |
| D1 | no code change -- tsk-1hq is a verified duplicate of tsk-1ht (merged, commit d6a2169c, revisionDriftIsSelfCaused), covers this item's exact reproduction; follow tsk-2uh's precedent and point verify at the existing regression suite |

## Scout evidence

- `src/state/store.mjs:1101-1105` (`settleClaim`) — the CAS throw.
- `src/state/store.mjs:362-469` (`editWork`) — confirmed no claim touch.
- `src/state/store.mjs:1382-1404` (`moveStage`) — confirmed no claim
  touch either; `src/state/replay.mjs:406-428` confirms a stage move
  mutates the same `work[id]` object the CAS hashes.
- `src/runner/claim-port.mjs:317` — the one and only place
  `preClaimRevision` is written (claim-acquire time).
- `docs/architect/doing-coordination-redesign.md:663-666` (§11.2) — names
  "an explicit reconcile path" as the intended answer, leaves the
  mechanism unspecified.
- `tsk-1ht` (title: "settleClaim's revision-CAS check has no reconcile
  path, refuses return for any claimed item edited…") — the same bug,
  already fixed. Its branch (`fgw/tsk-1ht`) added
  `revisionDriftIsSelfCaused` to `src/state/store.mjs` (commit
  `f6e7c63d`, landed on `main` as `d6a2169c` after rebase, merged via
  `5f818ee6 Merge branch 'fgw/tsk-1ht'`): reconciles a `preClaimRevision`
  mismatch only when every event on the item since the claim's
  `acquiredAt` carries `payload.writer.id === claim.writerId`; any
  different or missing writer still refuses. Test coverage:
  `test/state/runtime-coordination.test.mjs:549,586,618,649`.
- `tsk-2uh` (title: "Bug: settleClaim's CAS check…", reproduced
  independently on `tsk-5jl`) — a third, independent report of the same
  bug. Already closed `delivered`: its own discovery/planning
  (`docs/history/tsk-2uh-settleclaim-cas-already-fixed/`) found
  `tsk-1ht`'s fix already present on its branch, made no code change, and
  returned with `verify: FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test
  test/state/runtime-coordination.test.mjs` green (25/25).
- **Live confirmation on tsk-1hq itself (2026-08-26T11:01Z, this
  session):** with `tsk-1ht`'s fix now merged to `main`, this session's
  own `fgos ask tsk-1hq ...` call (parking the item for the exploring
  question below) hit a real `preClaimRevision` drift from this same
  session's own earlier discovery-stage writes (a priority edit + a
  stage move) and reconciled cleanly instead of refusing:
  `fgos: settleClaim reconciled a same-writer revision drift for
  "tsk-1hq" (writer "8a096294-4214-44bf-9a26-3c4e9141d829") --
  preClaimRevision "81ac30ca1f70e396" -> "623987dba85e86c1"`. This is a
  direct, first-hand proof the merged fix resolves this item's own exact
  reproduction shape, not just `tsk-1ht`'s/`tsk-2uh`'s.
- Impact-analysis capability posture: `full` (gitnexus registered,
  `status: present`) — not leaned on for this item since no code changes.

## Pinned terms

- "same-writer revision drift" — a `preClaimRevision` mismatch at
  `settleClaim` time caused entirely by events stamped with the SAME
  `writer.id` as the active claim's own `writerId`, as opposed to a
  genuinely concurrent conflict from a different writer.

## Canonical references

- `docs/history/tsk-1ht-settle-claim-revision-reconcile/` (the real fix)
- `docs/history/tsk-2uh-settleclaim-cas-already-fixed/` (the prior
  verified-duplicate precedent this item follows)
- `docs/architect/doing-coordination-redesign.md` §11.2

## Outstanding questions

None
