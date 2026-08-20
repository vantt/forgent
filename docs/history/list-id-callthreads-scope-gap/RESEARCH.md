# RESEARCH — tsk-5dnt: `fgos list --id` leaks `callThreads` across every item

## 2026-08-20 — round 1 (discovery stage, judge-ambiguity)

**Asked:** Confirm whether the `callThreads` leak in `fgos list --id
<id> --json`'s `singleView` object (`bin/fgos.mjs`, case `'list'` `--id`
branch) is still present at current HEAD, and whether the proposed
one-line fix (add `callThreads: scopedById(rawView.callThreads)` to
`singleView`, mirroring the seven sections already scoped there) is
valid, safe, and complete.

**Checked:**

- `bin/fgos.mjs:2229-2263` (the `--id` branch of the `list` case) — read
  directly. `scopedById` (line 2245) is applied to `discovery`, `gates`,
  `settlements`, `outcomes`, `frictions`, `learnings`, `decisionsById`
  (lines 2250-2256) when building `singleView` at line 2246. `callThreads`
  does not appear anywhere in this function — `rg -n "callThreads"
  bin/fgos.mjs` returns zero hits in the whole file, confirming it is
  never scoped, never even referenced, in `bin/fgos.mjs`. Since
  `singleView` spreads `...rawView` first (line 2247) and only the listed
  keys get overridden, `callThreads` passes through unfiltered — the full
  backlog's call-summary threads ride along on every single-item request.
- `src/state/replay.mjs:478-530` — `callThreads` is built as
  `view.callThreads[id] = [...(view.callThreads[id] ?? []), ...]` in two
  places (the open-call and close-call fold branches). Confirmed id-keyed
  dict shape: `{ [workItemId]: CallThreadEntry[] }`, structurally
  identical to `discovery`/`gates`/etc. (also plain id→data dicts folded
  by `replay.mjs`). The existing `scopedById = (section) =>
  (section?.[id] !== undefined ? { [id]: section[id] } : {})` at
  `bin/fgos.mjs:2245` already handles exactly this shape correctly for
  the other seven sections — no new helper or shape adaptation needed for
  `callThreads`.
- `src/state/store.mjs:800-1059` — three call sites read
  `callThreads?.[id]` (`openCallStack(before.callThreads?.[id])` etc.),
  confirming production code already treats `callThreads` as id-keyed,
  consistent with the `replay.mjs` write shape above.
- `bin/fgos.mjs:2365-2382` (the `show` verb) — read directly. `show`
  builds its own de-keyed response shape (`work` IS the item object
  directly, `discovery` IS the item's own array directly, etc.) and never
  includes `callThreads` in its output at all. Confirmed `show` is a
  structurally different, already-correct code path — not a viable
  substitute target for this fix without a wider rewrite of every
  `view.discovery[id]`-style access pattern the coding-domain skills
  already use.
- Consumer search: `grep -rn "callThreads" .agents/skills domains` (repo
  root) returns zero hits — no skill file reads `callThreads` back out of
  a `fgos list --id` JSON response. The only real readers
  (`store.mjs`'s three call sites above) already operate on the raw
  in-process view, not on `list`'s JSON output, so scoping `callThreads`
  in `singleView` changes zero consumer behavior — it only removes dead
  weight from the wire response.
- Prior related fix: `docs/history/list-id-scope-view-sections/CONTEXT.md`
  (item tsk-2u9, status done) locked the same scoping pattern for the
  other seven id-keyed sections, with the same shape verification
  approach (D2). `callThreads` did not exist as a view section at the
  time D2 was decided — it was introduced later by the multi-role team
  harness work (tsk-2t9c) referenced in `fgos-coding-discovering/SKILL.md`
  step 3 — so it was never in scope for tsk-2u9's own fix and is a
  genuine gap, not a regression of that fix.

**Found:**

1. Bug confirmed live at current HEAD: `callThreads` is absent from
   `singleView`'s override list (`bin/fgos.mjs:2246-2257`), so it leaks
   the entire backlog's call-summary threads on every single-item `list
   --id` request.
2. `callThreads` is id-keyed (`{ [id]: CallThreadEntry[] }`), the same
   shape as the seven already-scoped sections — the existing
   `scopedById` helper applies to it with no adaptation.
3. `show` is a separate, already-correctly-scoped path with a
   structurally different response shape — not a substitute fix target.
4. Zero consumers read `callThreads` back from a `list --id` response
   today — the fix is a pure size reduction with no behavior change for
   any known caller.

**Still open:** none — all four claims verified directly against current
repo state, no contradictions found.

**Verify (for the fix, once implemented):** a repro against this repo's
own live `.fgos/` store —

```bash
node bin/fgos.mjs list --id <some-id-with-open-call-threads> --json --dir . \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{
      const j=JSON.parse(d);
      const ids=Object.keys(j.data.callThreads||{});
      if (ids.length>1 || (ids.length===1 && ids[0]!=="<some-id-with-open-call-threads>")) {
        console.error("LEAK: callThreads contains other ids:", ids);
        process.exit(1);
      }
      console.log("OK: callThreads scoped to", ids);
    })'
```

Before the fix this prints every item's call-thread ids; after the fix it
prints at most the requested id's own key (or an empty object when the
item has no open/closed call threads recorded). A unit test in
`test/` covering `bin/fgos.mjs`'s `list --id` handler, asserting
`callThreads` is either `{}` or `{ [id]: [...] }`, is the more durable
form of this same check.
