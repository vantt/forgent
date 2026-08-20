# plan.md — postland-drift-consumer (tsk-1el)

Mode: **standard** — 3 flags applied per `fgos-routing`'s Mode gate: public
contracts (a new `fgos doctor` check is user-facing CLI surface), existing
covered behavior (`src/setup/registrations.mjs`/`checks.mjs` and
`fgos-coding-driving`'s skill-mirror test both already have real test
coverage this item's diff runs against), weak proof around the area
(impact-analysis posture below is degraded). No hard-gate flag (auth, data
loss, audit/security, external provider, removing a validation) applies, so
not `high-risk`; not a `spike` — every decision needed to build this is
already locked in `CONTEXT.md`.

`impact-analysis: degraded` — `fgos tool query --capability impact-analysis
--status present` returns `gitnexus`/`present`, but sibling item `tsk-1lg`
(open) already reports the index 434 commits behind. Every claim below is
grounded by direct `grep`/`Read`, not graph queries.

`fgos graph --json`: tsk-1el is not on `criticalPath` (`depth: 10`, path
does not include it) and carries no `deps` — an isolated, unblocked leaf.
No cross-item ordering signal applies; the ordering below is internal to
this one item only.

## Approach

**Chosen path** (honors D3/D5/D6/D7/D8, `CONTEXT.md`): add one new,
recompute-on-read module under `src/state/`, wire it into two independent
pull surfaces (a `fgos doctor` check, a `fgos-coding-driving` Orient-time
print), and close the `docs/specs/runner.md` gap (D9). No merge-time
persistence, no touch to `src/runner/` or `bin/fgos.mjs` (D5's Iron-Law-
avoidance rationale).

**Alternatives rejected** (already settled in CONTEXT.md, cited here for
traceability): persist-at-merge-time snapshot (D3 — rejected, second
state-consistency surface); write into `.fgos/sessions.json` (D4 —
rejected, SRP violation); `fgos-fanout` `SendMessage` as primary mechanism
(D4 — rejected, topology-limited); build a `stale` consumer (D2 —
rejected, already covered by D3's inbound-gate catchup).

**Files touched, in build order**:

1. `src/state/postland-drift.mjs` (new) — the compute layer.
   - Reuses `classifyPostLandDrift`/`openLeavesSharingTarget`
     (`src/state/graph-harness.mjs:422-469`) unchanged for item-selection
     (D7) and the shared-path classification shape.
   - New function, mirroring `src/state/drift-status.mjs`'s own shape
     (`requireTrunk`, a local `git(repoRoot, args)` shim, no caching):
     for each item `openLeavesSharingTarget` returns, computes the leaf's
     own changed-file set (`git diff --name-only <mergeBase>...<leafHead>`)
     intersected with the target's changed-file set since that same
     merge-base (`git diff --name-only <mergeBase>...<targetHead>`) — one
     diff per side, cumulative since fork (D6), never per-commit.
   - Gates the result to sessions with `listSessions` (`src/runner/
     session.mjs:485`) non-empty for that item id — `notify` only (D2);
     an item with no live session is silently excluded, not returned as a
     `stale` entry (no `stale` bucket exists in this module at all).
   - Target branch gone by check time (`branchExists`-style guard, same
     shape `drift-status.mjs` already uses) → skip that item silently,
     never throw (D8).
2. `test/state/postland-drift.test.mjs` (new) — real git-repo fixture
   (mirrors `test/state/drift-status.test.mjs`'s own fixture setup):
   - no overlap ⇒ nothing returned (mirrors D4's original "biên" case).
   - overlap + live session ⇒ returned, `shared` files listed.
   - overlap + no live session ⇒ nothing returned (proves the `stale`
     exclusion, D2, is real, not just asserted in prose).
   - two intervening lands before the check ever runs ⇒ still returns the
     UNION of both, not just the most recent one (proves D6's cumulative
     semantics — the actual defect risk this decision exists to close).
   - target branch deleted mid-flight ⇒ skipped, no throw (D8).
3. `src/setup/registrations.mjs` — register a new `fgos doctor` check
   (`registerCheck({ id: 'leaf-notify-drift', description, check })`,
   same shape as the existing `root-drift` check at `:1037-1041`), calling
   the new module.
4. `test/setup/checks.test.mjs` — extend with the new check's
   `passed`/`message` shape (mirrors this file's existing `root-drift`
   coverage).
5. `.agents/skills/fgos-coding-driving/references/loop-mechanics.md`
   (canonical source) — add one line to Step 1 ("Read state fresh"): after
   resolving the item's position, also check the new module's output for
   this item id and print any pending drift finding, plain text, no state
   change, no park. Purely additive to an existing read this loop already
   performs every iteration — no new infrastructure.
6. `.claude/skills/fgos-coding-driving/references/loop-mechanics.md` and
   `plugins/fgOS/skills/fgos-coding-driving/references/loop-mechanics.md`
   — copied byte-identical from (5), same mirror discipline the existing
   skill-mirror test already enforces (`references/*.md` across all three
   trees must match; `SKILL.md` itself does not — `.claude/skills/*/
   SKILL.md` is a generated thin wrapper, unaffected here since this
   change touches only `references/`).
7. `docs/specs/runner.md` — new subsection near "Đồng bộ lại một việc đỗ
   (catch-up)" (`:88`) describing D4/`postLand` (already shipped by
   tsk-2ypd) and this item's new `notify` consumer (closes the gap
   confirmed empty by `grep -n "postLand|tsk-2ypd" docs/specs/runner.md`,
   D9).

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| Cumulative diff computation (D6) correctness | medium | `test/state/postland-drift.test.mjs`'s two-intervening-lands case above — a real git fixture, not a mocked diff |
| `notify`-only gating (no `stale` leakage, D2) | medium | same test file's "overlap + no live session ⇒ nothing returned" case |
| Doctor check registration shape | low | matches `root-drift`'s existing, already-tested shape (`registrations.mjs:1037-1041`) verbatim |
| Driving-loop Orient line | low-medium | skill-prose change — `npm test` already runs the existing byte-identical mirror check across the three `references/loop-mechanics.md` copies; no runtime behavior assertion is possible for prose (per `docs/how-to/write-verify-for-a-skill-prose-change.md`) beyond that + a grep proving the new line exists |
| `docs/specs/runner.md` update | low | pure documentation, no code path depends on its content |

## Split

No split. One coherent piece: the compute module has no independent value
without at least one consumer, and both consumers (doctor check,
driving-loop line) are a few lines each once the compute module exists.
Splitting would add coordination overhead (sibling work items each waiting
on the same shared new file) for zero real parallelism benefit — item
proceeds as itself.

## Verify

```
npm test && grep -q "postLand\|postland-drift" docs/specs/runner.md && diff -q .agents/skills/fgos-coding-driving/references/loop-mechanics.md .claude/skills/fgos-coding-driving/references/loop-mechanics.md && diff -q .agents/skills/fgos-coding-driving/references/loop-mechanics.md plugins/fgOS/skills/fgos-coding-driving/references/loop-mechanics.md
```

## Outstanding questions

None
