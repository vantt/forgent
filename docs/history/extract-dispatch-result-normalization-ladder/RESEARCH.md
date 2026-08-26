# Research — tsk-2tr: Extract dispatch result normalization ladder

## Round 1 (2026-08-26, discovery stage)

**Asked:** Locate and characterize the current result-normalization logic
inside `executeExecutorCli` (`src/runner/dispatch/cli.mjs`) — exact
implementation, whether "reported/legacy-signal/inferred" terminology
already exists in the codebase, and whether the item's own verify commands
currently pass on main.

**Checked:**

- `rg -n "function executeExecutorCli" src/runner/dispatch/cli.mjs` →
  `src/runner/dispatch/cli.mjs:330`.
- Read `src/runner/dispatch/cli.mjs:496-532` (the result-assembly block
  inside `executeExecutorCli`'s try block, right after `adapterFn(...)`
  resolves).
- `rg -n "sentinel|outcome" src/runner/dispatch/transport.mjs` for the
  herdr-spawn adapter's own sentinel handling.
- `rg -n "reported|legacy-signal|inferred|unsignaled|outcome" test/runner/dispatch.test.mjs`
  for existing terminology and test coverage.
- Read `test/runner/dispatch.test.mjs:3368-3470` (the four tests directly
  covering this ladder).
- Ran `node --test test/runner/dispatch.test.mjs test/runner/herdr-spawn-adapter.test.mjs`
  as a baseline.

**Found:**

1. **Exact current implementation** (`src/runner/dispatch/cli.mjs:500-529`):

   ```js
   const headBefore = captureHeadSha(cwd);
   const dirtyBefore = checkoutDirtyPaths(root, cwd);
   const result = await adapterFn({ command, args, env, liveOutput, interactiveMode }, { cwd, timeoutMs, idleTimeoutMs, maxBuffer, onChunk, workId: executorId, tier, model });
   const headAfter = captureHeadSha(cwd);
   const dirtyAfter = checkoutDirtyPaths(root, cwd);
   let lostUncommittedPaths;
   if (headBefore === headAfter && dirtyBefore.length > 0) { /* lost-uncommitted-paths detection, unrelated to the signal ladder */ }
   const stdoutStr = result && typeof result.stdout === 'string' ? result.stdout : '';
   const cleanStdout = stdoutStr.replace(/`+[\s\S]*?`+/g, '');
   const hasSignal = cleanStdout.includes('[DONE]') || cleanStdout.includes('[BLOCKED]');
   const isDone = cleanStdout.includes('[DONE]');
   const base = {
     mechanism,
     ...result,
     ...(hasSignal ? {} : { outcome: 'unsignaled', headBefore, headAfter }),
     ...(isDone && headAfter ? { verifiedSha: headAfter } : {}),
     ...(lostUncommittedPaths ? { lostUncommittedPaths } : {}),
     provider,
     command,
   };
   return resolvedByPurpose ? { ...base, executorId } : base;
   ```

   - **Backtick/quoted false-positive guard**: `cleanStdout` strips every
     backtick-fenced run (`` /`+[\s\S]*?`+/g ``, any fence width, inline or
     block) from `stdoutStr` *before* the `[DONE]`/`[BLOCKED]` substring
     scan — so a worker's own prose mentioning `` `[DONE]` `` never
     false-positives. Confirmed by
     `test/runner/dispatch.test.mjs:3439-3470` ("...appears only inside
     backtick-quoted text" and a companion case with both a quoted mention
     AND a real trailing `[DONE]`, which still signals).
   - **"unsignaled" fallback**: fires only when neither `[DONE]` nor
     `[BLOCKED]` survives the backtick strip. Carries `headBefore`/
     `headAfter` (captured via `captureHeadSha(cwd)` immediately before/
     after the adapter call) so a caller can infer completion from a real
     commit even with no explicit signal. Confirmed by
     `test/runner/dispatch.test.mjs:3368-3383`.
   - **`verifiedSha`**: only attached when `isDone && headAfter` — i.e. a
     real `[DONE]` token AND a resolvable HEAD sha (git repo). `[BLOCKED]`
     never gets a `verifiedSha`. Confirmed by
     `test/runner/dispatch.test.mjs:3414-3437`.
   - **Herdr sentinel vs. worker signal**: the herdr-spawn adapter's own
     runner-owned completion sentinel (`__fgos_herdr_exit_<ts>_<rand>`,
     `src/runner/dispatch/transport.mjs:760,1044`) is a lexically distinct
     token format from `[DONE]`/`[BLOCKED]`, consumed and stripped inside
     `transport.mjs` (search truncated at `sentinelIdx`,
     `transport.mjs:854-855`) *before* `result.stdout` ever reaches
     `executeExecutorCli`. The two never collide by construction — the
     ladder in `cli.mjs` only ever sees the worker's own prompt-completion
     tokens, not the transport-level exit sentinel.

2. **"reported/legacy-signal/inferred" terminology**: not present
   anywhere in the codebase (`rg` across `test/runner/dispatch.test.mjs`
   found only `outcome`/`unsignaled`, no such labels). This is the item's
   own descriptive framing for the ladder that already exists structurally
   in the code above, not pre-existing vocabulary to preserve byte-for-byte:
   - "reported" ≈ the adapter's own resolved `result` (spread first via
     `...result` — process exit/stdout/stderr, already known once the
     adapter promise resolves).
   - "legacy-signal" ≈ the `[DONE]`/`[BLOCKED]` stdout-token scan
     (`hasSignal`/`isDone`).
   - "inferred" ≈ the `outcome: 'unsignaled'` + `headBefore`/`headAfter`
     git-diff fallback when no token survives.
   Per the item's own acceptance criteria, this extraction keeps the
   *behavior* of this three-tier structure intact and does not invent a
   new `confidence` field, since nothing downstream reads one yet.

3. **Verify baseline**: `node --test test/runner/dispatch.test.mjs test/runner/herdr-spawn-adapter.test.mjs`
   → **356 pass / 0 fail / 0 skipped** (28.85s). Both files are green on
   the current `fgw/tsk-2tr` branch head before any change, confirming the
   extraction has real, already-passing test coverage to refactor under
   (the four tests at `dispatch.test.mjs:3368-3470` name the exact
   contract the extracted helper must preserve).

**Still open:** none — the goal (where the ladder lives, what shape it has,
whether it's safely test-covered) is fully answered by direct evidence
above.
