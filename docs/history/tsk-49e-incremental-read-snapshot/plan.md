# Plan: incremental-read snapshot (byte-offset seek + last-line fingerprint)

Item: `tsk-49e`. Mode: **high-risk** (per its own `risk: heavy` and D2's
correctness stakes) — full design below, no split (the split already
happened at the parent, `tsk-5nj`; this is one of its two pieces).

## Approach

Per CONTEXT.md D2-correction/D5, three files change:

**1. `src/state/events.mjs`** — add two internal helpers (exported for
test access), sharing the existing line-parse-and-throw core `readEvents`
already has (extracted, not duplicated):

```js
function parseEventLines(raw, logPath, lineOffsetForErrors) { ... } // shared core, readEvents refactored to call it with lineOffsetForErrors=0

export function readLastLineBefore(logPath, atByte, windowBytes = 8192) {
  // fs.openSync + fs.readSync a bounded window [max(0,atByte-windowBytes), atByte)
  // -- returns the raw text of the LAST complete line in that window (the
  // line ending exactly at atByte), or null if the window is empty/invalid.
}

export function readEventsFromByte(logPath, fromByte) {
  // fs.openSync + fs.fstatSync + fs.readSync bytes [fromByte, EOF) --
  // parses via the SAME parseEventLines core, same corrupt-log throw.
}
```

**2. `src/state/replay.mjs`** — `foldEvents` gains an optional seed view
(parent D2's own idea, unchanged); `rebuildView` tries the snapshot fast
path first:

```js
export function foldEvents(events, seedView) {
  const view = seedView ? { ...seedView } : { work: {}, decisions: [] };
  // NOTE: seedView's own nested objects (view.work, view.decisions, any
  // future top-level key applyEvent might add) must be shallow-copied
  // too, not just the top-level spread -- applyEvent mutates view.work[id]
  // and view.decisions.push(...) in place; sharing the seed's own nested
  // references would corrupt the PERSISTED snapshot's own in-memory copy
  // if the same parsed `persisted` object is ever reused across calls.
  // Concretely: { ...seedView, work: { ...seedView.work }, decisions: [...seedView.decisions] }.
  for (const event of events) applyEvent(view, event);
  return view;
}

export function rebuildView(logPath) {
  const fast = tryIncrementalRebuild(logPath);
  if (fast) return fast;
  return foldEvents(readEvents(logPath));
}

function tryIncrementalRebuild(logPath) {
  const viewPath = path.join(path.dirname(logPath), 'state.json');
  let persisted;
  try {
    persisted = JSON.parse(fs.readFileSync(viewPath, 'utf8'));
  } catch { return null; }
  const snap = persisted.snapshot;
  if (!snap || typeof snap.size !== 'number' || typeof snap.mtimeMs !== 'number' || typeof snap.lastLine !== 'string') return null;

  let stat;
  try { stat = fs.statSync(logPath); } catch { return null; }

  const { revision, snapshot, ...savedView } = persisted;

  if (stat.mtimeMs === snap.mtimeMs && stat.size === snap.size) return savedView; // zero-read shortcut

  if (stat.size <= snap.size) return null; // shrank, or same-size-different-mtime rewrite -- unsafe

  const stillThere = readLastLineBefore(logPath, snap.size) === snap.lastLine;
  if (!stillThere) return null;

  const newEvents = readEventsFromByte(logPath, snap.size);
  return foldEvents(newEvents, savedView);
}
```

**3. `src/state/store.mjs`** — `refreshView` captures the snapshot
metadata (already under the lock, per `tsk-4mx`); `writeView` persists it:

```js
function refreshView(dir) {
  const { logPath, viewPath } = paths(dir);
  const view = rebuildView(logPath); // may itself take the fast path -- fine, still correct
  const stat = fs.statSync(logPath); // cheap; safe under the held lock, no concurrent append possible
  const lastLine = readLastLineBefore(logPath, stat.size);
  writeView(viewPath, view, { size: stat.size, mtimeMs: stat.mtimeMs, lastLine });
  return view;
}

function writeView(viewPath, view, snapshot) {
  ... // unchanged tsk-4mx atomic-write shape
  const persisted = { ...view, revision: viewRevision(view), snapshot };
  ...
}
```

Impact-analysis posture: **degraded** (GitNexus present, index stale per
this session's own PostToolUse hook). Real risk is genuinely elevated
(per D5, `risk: heavy`) — mitigated by exhaustive cases below rather than
a lower posture claim.

## Cases

- **Boundary**: empty log (no `state.json` yet, or `state.json` exists
  with no prior events) — falls straight to the existing full-read path,
  byte-identical to today.
- **Existing behavior unchanged (determinism)**: a fresh `foldEvents(readEvents(logPath))`
  must be `assert.deepEqual` to `rebuildView(logPath)`'s result via EVERY
  path (zero-read exact-match, incremental, and fallback) — this is the
  single most important regression guard, since `state.json`'s own
  round-trip through `JSON.stringify`/`JSON.parse` can silently drop an
  explicit `undefined` value a fresh fold might carry; tested directly.
- **Zero-read fast path**: two consecutive `rebuildView` calls with no
  mutation in between — the second call must read zero bytes of
  `events.jsonl` (spy on `fs.readSync`/`fs.readFileSync` call count
  against the log path, mirroring `tsk-3jh`'s own spy-based proof
  technique).
- **Incremental path**: append N new events after a snapshot exists —
  `rebuildView` must fold correctly (deep-equal to a fresh full read) and
  must NOT re-read the old prefix (spy-verified: `readEventsFromByte` is
  called, `readEvents`/`fs.readFileSync` on the full path is not).
- **Safety against `repairTruncatedLastLine`**: build a log, snapshot it,
  append a corrupt trailing line, repair it — `rebuildView` afterward
  must still produce a view deep-equal to a fresh full read (whether via
  the incremental path, since the prefix is genuinely untouched by a
  tail-only repair, or via fallback — either is correct, the test asserts
  correctness of the RESULT, not which path was taken).
- **Safety against `fixEventsJsonlContiguity --fix`**: build a log with a
  real seq gap/duplicate (the shape `--fix` targets), snapshot it BEFORE
  fixing, run `fixEventsJsonlContiguity`, then `rebuildView` — must fall
  back (fingerprint mismatch) and produce a view deep-equal to a fresh
  full read of the now-fixed log.
- **Safety against a reordering rewrite (git `merge=union` stand-in)**:
  since a real git merge cannot be driven from a unit test, simulate it
  directly — snapshot a log, then rewrite the file wholesale via
  `fs.writeFileSync` with reordered lines (mirroring what "tends to leave
  the added lines in random order" produces) — `rebuildView` must fall
  back and produce a view deep-equal to a fresh full read of the reordered
  log.
- **Concurrent access**: `refreshView` still runs entirely under
  `withEventsLock` (unchanged from `tsk-4mx`) — the existing `tsk-1q5`
  regression test (`concurrent editWork calls on DIFFERENT ids never lose
  a write to state.json`) must still pass unchanged, proving the new
  snapshot metadata capture doesn't reopen that race.
- **Partial failure**: a `state.json` with a `snapshot` field but
  missing/malformed sub-fields (`size`/`mtimeMs`/`lastLine` absent or
  wrong type) must fall back to a full read, never throw.

## Outstanding questions

None
