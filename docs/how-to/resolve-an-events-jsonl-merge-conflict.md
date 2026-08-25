---
type: how-to
title: How to resolve a git merge conflict on `.fgos/events.jsonl` without breaking seq contiguity
tags: []
timestamp: 2026-07-30T00:00:00.000Z
source_capture_ids: [tsk-n4i-2]
---
# How to resolve a git merge conflict on `.fgos/events.jsonl` without breaking seq contiguity

**Superseded (`tsk-3tp`, on top of `tsk-3ve`):** `.fgos/events.jsonl` is
now a frozen baseline — new events land in per-writer shard files under
`.fgos/events/<writer-id>-<openTs>.jsonl` (content-hash `h` identity, not
cross-writer `seq`), and dirty shards are swept into merge/approve commits
rather than hand-merged. `scripts/check-events-seq-contiguity.mjs` (and
the sibling `scripts/events-jsonl-contiguity.mjs`) referenced throughout
this doc were deleted; neither is wired into `npm test` or `fgos doctor`
any more. The scenario this doc describes — two branches independently
appending to the *same* `.fgos/events.jsonl` and needing manual `seq`
renumbering after a conflict — no longer arises for that file. See
`docs/explanation/events-jsonl-lost-update-race-under-concurrent-session-
writes.md` and `docs/history/tsk-3tp-worker-write-events-tang-b/` for the
current mechanism. Everything below is kept as historical record of the
procedure and the corruption it fixed at the time.

Use this when `git merge`/`git rebase` reports a conflict inside
`.fgos/events.jsonl`, or when `npm test` fails on
`check-events-seq-contiguity`'s own test (`test/scripts/check-events-seq-contiguity.test.mjs`)
or a `fgos merge`/migrate script refuses with `"seq gap at line N"`.
(Historical — these entry points no longer exist; see the superseded
note above.)

## Why hand-resolving this file is dangerous

`.fgos/events.jsonl` is an append-only log where every line's `seq` field
must be unique, gapless, and strictly increasing. A normal text-merge
conflict marker resolution — picking "ours", "theirs", or splicing both
sides in timestamp order — never re-numbers `seq`, so it silently produces
duplicate or out-of-order values. This already happened once on the live
shared store: two different ad hoc resolutions, in the same session, each
handled the conflict a different way:

> `fix: resolve events.jsonl merge conflict - keep both sides sorted by timestamp`
> `fix: merge tsk-3oa events (keep theirs, rebuild)`
> — real commit messages, both landing corrupted `seq` values, quoted in
> `docs/history/live-events-seq-corruption/CONTEXT.md`'s D1 evidence

The corruption sat undetected for days until a migrate script's own
contiguity guard happened to trip over it. `check-events-seq-contiguity.mjs`
(this item, tsk-n4i-2) exists specifically to catch this immediately next
time, via `npm test` — but catching it fast still means you need to know how
to actually fix it.

## Steps

1. **Never resolve `.fgos/events.jsonl`'s conflict markers by hand,
   line by line.** Whichever side you keep, or however you interleave the
   two, the resulting `seq` values will not be contiguous.

2. **Pick one side's ordering as the base**, then take the union of every
   line from both sides (deduplicated by exact non-`seq` content, if the
   same logical event landed on both branches), sorted by `ts` — this is a
   reasonable ordering heuristic when nothing better is available. It does
   not need to be re-verified — the next step re-numbers `seq` from scratch
   over the merged result regardless of what ordering you started from.

3. **Renumber `seq` from line 1 through EOF**, preserving every other field
   byte-for-byte. Every appended event has `seq` as the object's first key
   (`{"seq":N,"ts":...}`, per `appendEvent`, `src/state/events.mjs`), so a
   targeted prefix replace is enough — this avoids any risk of
   `JSON.stringify` reordering keys or reformatting numbers on lines that
   don't need it:

   ```js
   const lines = mergedRaw.split("\n").filter(Boolean);
   const out = lines.map((line, i) => {
     const seq = i + 1;
     const m = line.match(/^\{"seq":\d+,/);
     if (!m) throw new Error(`line ${i + 1} does not start with {"seq":N, -- refusing`);
     return `{"seq":${seq},` + line.slice(m[0].length);
   });
   fs.writeFileSync(mergedPath, out.join("\n") + "\n");
   ```

4. **Verify before committing anything:**

   ```
   node scripts/check-events-seq-contiguity.mjs --log <merged-file>
   ```

   A non-zero exit means the renumber logic above has a bug — do not
   proceed until this passes clean.

5. **Never commit the merged `.fgos/events.jsonl` on a worker's own
   `fgw/<id>` branch.** Per ADR0020 (one-door-write), a worker branch must
   never carry a `.fgos/` change at all — see
   `docs/how-to/fix-fgos-write-rejected-merge-block.md` for the full
   reasoning and what happens if you do anyway (`fgos merge` rejects it
   outright, `fgos-write-rejected`). The corrected, contiguous file has to
   be applied directly to the main checkout as a direct operator action —
   for example, wrapped in `withEventsLock` (`src/state/events.mjs`) so a
   concurrent `appendEvent` can't interleave with the rewrite:

   ```js
   import { withEventsLock } from "./src/state/events.mjs";
   withEventsLock(logPath, () => {
     // read the CURRENT live file fresh here (it may have grown since
     // step 3), re-run the renumber, write atomically (temp file + rename)
   });
   ```

## Example: the real repair this procedure is based on

This is exactly how the live shared store's own historical corruption
(lines 273-311, 2 duplicate-seq rows + 5 non-contiguous jumps) was repaired
in practice:

> "Renumber seq from line 273 onward in place (lines 1-272 byte-untouched,
> no other field changed on any renumbered line), under ADR-0019's
> pre-release exemption."
> — real locked decision D4, `docs/history/live-events-seq-corruption/CONTEXT.md`

That repair changed 1270+ lines' `seq` values while leaving every other
byte on those lines untouched, confirmed by a direct diff check before
applying:

> `non-seq-field mismatches: 0`
> — real verification output, this item's own parent (`tsk-n4i-1`) execution

## Related

- `docs/how-to/fix-fgos-write-rejected-merge-block.md` — what to do if you
  already committed a `.fgos/` change onto a worker branch by mistake.
- `scripts/check-events-seq-contiguity.mjs` — the fast-fail check this
  procedure's step 4 ran, formerly also wired into `npm test`; deleted by
  `tsk-3tp` (see the superseded note at the top of this doc).
- `docs/history/live-events-seq-corruption/` — the full investigation and
  plan behind both this doc and the (now-deleted) check script.
- `docs/history/tsk-3tp-worker-write-events-tang-b/` — the current
  mechanism that replaced the one this doc describes.

## Document history (compound-learn capture linkage)

This doc's path (`docs/how-to/resolve-an-events-jsonl-merge-conflict.md`)
is linked to a real compound-learn capture, gathered via `fgos doc-sources
docs/how-to/resolve-an-events-jsonl-merge-conflict.md`:

> ```json
> {
>   "id": "tsk-n4i-2",
>   "predicted": {"tier":"heavy","deps":1,"priorVisits":0,"role":"session","branchHeadAtTake":"936a6a40443b6aa6ca1f1c216898180390e25f4a"},
>   "actual": {"outcome":"awaiting-approval","passed":true,"attempts":1,"errorClass":null,"aheadCount":1},
>   "docType": "how-to",
>   "docPath": "docs/how-to/resolve-an-events-jsonl-merge-conflict.md"
> }
> ```
> — real `work.outcome` capture, id `tsk-n4i-2`

That capture's own work item is the task that wrote this document and its
paired check script, as the second half of the same fix:

> "Add fast-fail seq-contiguity check + resolution how-to for events.jsonl (tsk-n4i piece B)"
> — real work item title, id `tsk-n4i-2`

This item's own execution landed clean on the first attempt (`"attempts":1,
"errorClass":null`) — the lesson this doc's Steps section captures (renumber
via a targeted `seq` prefix replace, never a manual conflict-marker
resolution) was already proven once, directly, while fixing `tsk-n4i-1`'s
own historical corruption; this item packaged that proof into a reusable
script and procedure rather than rediscovering it.

If a later item hits this same class of conflict, the export skill
accumulates its capture here too, additively, without losing this section
or anything above it.
