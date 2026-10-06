# Reviewer report — ca1-docs-note.md

## Scope

Reviewed `plans/261002-1339-request-to-run-p6-herdr-posture-quota/reports/evidence/ca1-docs-note.md`
against the "Transport (G7)" block of `src/runner/execution/bind.mjs` (lines 253-272).
Role: reviewer (read-only). No repository files were edited.

## Method

Read the doc note and the source file in full. Traced every claim in the note to a
specific line range in the G7 block. Verified string literals, variable names, branch
precedence, and the reported-output path against the source.

## Findings per claim

1. **Source citation (line 3)** — PASS. The block is labeled `// 4. Transport (G7):`
   at line 253 and closes at line 272. Step number 4 is correct.

2. **Default cli (line 5)** — PASS. Lines 256-258 set `invocation = chosenCandidate.invocation`,
   `transport = 'cli'`, `transportSource = 'default-cli'`. All three literals match.

3. **herdr three-condition gate (line 6)** — PASS. Line 264:
   `else if (herdrInvocation && session.herdrPresent === true && !chosenCandidate.isInlineFallback)`.
   All three conditions named in the note are present and correctly conjoined. The note
   correctly references `findHerdrInvocation` (defined lines 45-52), which requires
   `via === 'cli'`, `adapter === 'herdr-spawn'`, and a non-empty string `id`.

4. **canApplyPosture gate + success path (line 7)** — PASS. Line 265 calls
   `canApplyPosture({ executor: executorId, invocation: herdrInvocation.id }, posture, ...)`;
   lines 267-268 set `transportSource = 'herdr-invocation-present'` and
   `invocation = herdrInvocation.id` (replaces the original). Matches exactly.

5. **Posture-failure cli fallback (line 8)** — PASS. Line 270 sets
   `transportSource = 'cli:herdr-invocation-cannot-apply-posture'`; `transport` is not
   reassigned in the else branch, so it retains the default `'cli'`. Correct.

6. **Override-pinned invocation wins (line 9)** — PASS. Line 260
   `if (chosenCandidate.override?.invocation)` is the first branch, so it takes
   precedence over the herdr `else if`. Line 261 sets
   `transportSource = 'override-pinned-invocation'`; `invocation` is not reassigned in
   this branch (stays as the candidate's pinned value from line 256); line 263 sets
   `transport = 'herdr'` only when `pinned?.adapter === 'herdr-spawn'`.
   Minor observation (not a failure): the note says "human-pinned", echoing the source
   comment at line 255 ("An invocation a human pinned by override stays as pinned"). The
   code checks `chosenCandidate.override?.invocation` without testing `origin === 'human-cli'`
   here (that origin check exists only in the independence filter, line 198). The note
   faithfully reflects the G7 block's own comment, so it stays grounded.

7. **Decision reported via transport + transportSource (line 10)** — PASS. The return
   object exposes `transport` (line 383) and `provenance.transport.source = transportSource`
   (line 367). The cli-fallback reason is visible via the `transportSource` string
   (e.g. `'cli:herdr-invocation-cannot-apply-posture'`, `'default-cli'`).
   Minor observation (not a failure): `transportSource` is nested in
   `provenance.transport.source`, not a top-level field. The note says "reported via"
   which is accurate without claiming top-level placement.

## Line count

The note is 10 lines total (8 non-blank). Within the 8-12 line requirement.

## Verdict

PASS. Every claim in `ca1-docs-note.md` is grounded in the Transport (G7) block of
`src/runner/execution/bind.mjs`, correctly cites that file, and matches the source's
literals, branch structure, and reporting path. No claim failed verification.
