---
framework: diataxis
mode: explanation
---
# Why `cleanup-loop` has no iteration cap, unlike `discover-loop`

`/fgOS:cleanup-loop` scans `status:cleanup` work items and runs `fgos
cleanup <id>` on the ones actually TTL-ready, closing them to `done` or
reporting blocks, until the pool is empty or a stop condition trips. It
mirrors `discover-next`/`discover-loop`'s shape (bare per-id CLI verb +
a new pool-picker), not `merge-loop` (which already had a CLI-level
ranked next).

## Why a naive loop doesn't work

```js
// cleanup-pool.mjs (tsk-dvc) — picks the next single item for a
// cleanup-loop iteration to run `fgos cleanup` on. PURE: no fs, no
// `.fgos/` read, same discipline as discover-pool.mjs/frontier.mjs/
// impact.mjs. Exists specifically so cleanup-loop never calls `fgos
// cleanup <id>` on an item whose TTL hasn't elapsed yet — `assess
// CleanupReadiness` (cleanup-harness.mjs) treats "TTL not elapsed" as a
// failing check exactly like any other, and `bin/fgos.mjs`'s `case
// 'cleanup'` parks ANY failing check straight to `cleanup -> blocked`
// (docs/history/fgos-cleanup-loop/CONTEXT.md D1, "Why a naive loop
// doesn't work").
```

`assess CleanupReadiness` treats "TTL not elapsed" as a failing check,
just like any other failing check — and `bin/fgos.mjs`'s `cleanup` case
parks *any* failing check straight to `cleanup -> blocked`. A loop that
blindly called `fgos cleanup <id>` on every `status:cleanup` item —
without pre-filtering by TTL — would generate wasteful blocked/recovery
churn on every item whose TTL simply hadn't elapsed yet. `cleanup-pool.mjs`
exists specifically to close that gap by pre-filtering with the
already-existing `checkCleanupTTLElapsed` (`cleanup-harness.mjs`) before
`fgos cleanup <id>` is ever invoked.

## The picker: FIFO, TTL-gated

```js
export function pickNextCleanupItem(view, rawEvents, { ttlDays, now } = {}) {
  const work = view?.work ?? {};
  const candidates = [];
  for (const id of Object.keys(work)) {
    const item = work[id];
    if (!isCandidate(item)) continue;
    const ttl = checkCleanupTTLElapsed(rawEvents, id, { ttlDays, now });
    if (!ttl.ok) continue;
    const entered = latestCleanupEntry(rawEvents, id);
    candidates.push({ id, enteredAt: new Date(entered.ts).getTime() });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.enteredAt - b.enteredAt);
  return { id: candidates[0].id };
}
```

D1's ordering: FIFO by the item's own `retrospective -> cleanup` entry
timestamp, oldest first — no priority/tier weighting, since cleanup is
housekeeping, not merge-readiness. Only items whose TTL check already
passes ever become candidates.

## Why no iteration cap — the key divergence from `discover-loop`/`retro-loop`

```
D3: cleanup-loop has no fixed iteration cap -- runs until pool empty,
lock-timeout, or (per D2) a scoped item block, mirroring merge-loop's
no-cap shape since each iteration is a deterministic mechanical check,
not an LLM judgment call.
```

`discover-loop` (cap 15) and `retro-loop` (cap 15, this session's own
skill) both bound their iteration count because their per-item step
calls a real LLM judge (`judgeDiscovery`/`judgeDecompose`, or
`fgos-coding-compounding`'s synthesis) — real, variable cost per call that
needs bounding. `cleanup-loop`'s own per-item step (`fgos cleanup <id>`)
is a **deterministic mechanical check** — TTL, content, and merge
verification, no model call anywhere in the path. There's no variable
LLM cost to bound, so no cap is needed — the same reasoning `merge-loop`
already established for its own uncapped shape.

## Why a per-item block never stops the whole loop

```
D2: cleanup-loop treats a post-invocation harness block
(content-missing or merge-no-longer-resolves) as scoped to that one
item -- skip and continue to the next candidate, never stop the whole
loop.
```

Even though the picker pre-filters by TTL, the harness can still block
an item for other reasons *after* invocation (content-missing, or the
merge no longer cleanly resolving). That's scoped to the one item —
skip it and continue, never treat it as a systemic problem the way a
`lock-timeout` genuinely is.

## Why this stayed a single, unsplit item

`judgeDecompose` returned pass-through:

> Một đơn vị nhỏ, gắn kết: 1 module picker mới (src/state/cleanup-pool.mjs,
> tái dùng checkCleanupTTLElapsed đã có sẵn) + test của nó + 2 skill file
> mỏng (cleanup-next, cleanup-loop) chỉ bọc verb `fgos cleanup <id>` đã
> tồn tại. Không đụng CLI/FSM, không có contract mới, đã có cặp
> discover-next/discover-loop làm khuôn mẫu sao chép 1:1.

A small, cohesive unit reusing an existing verb and mirroring an
existing pair's shape 1:1 — splitting would only have created a
sequential dependency chain on the same surface, no real parallelism
gained.
