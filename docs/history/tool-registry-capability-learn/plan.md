# tool-registry-capability-learn — plan

Item: `tsk-2br`. Decisions: `CONTEXT.md` D1 (deep-dive as-is is the
deliverable), D2 (porting-log score bump in scope).

## Mode

**tiny** — 0 mode-gate flags apply (no auth, authorization, data model,
audit/security, external system, public contract, cross-platform, existing
covered behavior, weak-proof area, or multi-domain concern; this is a docs
commit). D1/D2's work is already committed on `fgw/tsk-2br`
(`6a2ab99`): the deep-dive, the consult report, the porting-log score bump,
and `CONTEXT.md` itself.

## Approach

No alternatives were live here — D1 fixed the deliverable to the
already-drafted deep-dive, so the only remaining step is closing the loop:
give the item a real verify command and hand off. No split: this is one
honest piece of work, and its three sibling items (`tsk-1dj`, `tsk-1e4`,
`tsk-4ad`) already exist separately for the actual porting/prose/
registration work CONTEXT.md scoped out.

## Verify

```
test -f docs/distillery/deep-dives/tool-registry.md && \
test -f docs/history/tool-registry-capability-learn/CONTEXT.md && \
grep -q "R3 E2 F2" docs/distillery/porting-log.md
```

Proves: the deep-dive exists, its CONTEXT.md exists, and the porting-log
score bump (D2) landed.
