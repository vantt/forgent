# shape-constraint-proposal (real, asgn_i27_driver_op_009)

## Dispatched objective (verbatim)

Rank the risk of each option on the table (kernel structural hardening in binding.mjs vs. a stricter doctor check vs. doing nothing further since H4 is already fixed for the one capability that hit it) against: how much new kernel surface each touches, whether either option could break an already-passing red-team test the way I21's own M3 attempt did, and whether Unit I21's own "no shipped protocol uses `required` yet" note means this exposure is latent-but-real or purely theoretical today. Read /home/vantt/projects/forgentX/src/verbs/coordination/binding.mjs first (absolute path). Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}.

## Real agent-result.json

```json
{
  "contract": {
    "id": "agent-result-claim",
    "version": 2
  },
  "status": "done",
  "summary": "Read binding.mjs from the unit/I27 worktree copy; reading the main-checkout path was denied. Premise correction: the H4 fix at line 268 (bindingSource !== 'capability.prefer' -> unbound) is structural for every capability, not just 'review', so the H4 class is closed in the binding path. The residual gap is different and is latent-but-real: strength:'required' provider diversity fails open. Unknown-family candidates count as diverse (line 148), and forward-referenced roles or override actors with unknown family are silently skipped (lines 128-131, 202). The binding then records diversity.satisfied:true without throwing. Zero blast radius today only because no shipped protocol declares 'required'. The first adopter writes false evidence that append-only state cannot correct after the fact, which is the one irreversible element. Risk ranking, riskiest first: (1) broad kernel hardening that re-touches line 268 or changes unknown-family semantics for every strength (M3-style regression risk to verified H1/H4 fixes); (2) do nothing (silent fail-open on first adoption); (3) doctor check (no kernel risk, but detect-only and does not close the gap); (4) scoped hardening gated on strength==='required' (~15 lines in two private helpers, output byte-identical for all shipped protocols, reuses the existing binding.diversity-unsatisfiable category and allowDiversityUnsatisfiable flag, 3 tests, fully reversible). Recommend option 4, landed before or together with the first 'required' adopter; a doctor warning for capabilities with no .prefer is an optional follow-on. Not verified (no grant): M3 diff details, buildCandidateInventory unknown-family frequency, existing 'required' test fixtures.",
  "evidenceRefs": [
    "src/verbs/coordination/binding.mjs:268",
    "src/verbs/coordination/binding.mjs:128-131",
    "src/verbs/coordination/binding.mjs:145-151",
    "src/verbs/coordination/binding.mjs:200-202",
    "src/verbs/coordination/binding.mjs:289-294",
    ".fgos/assignments/asgn_i27_driver_op_009/runs/01/agent-report.md"
  ]
}
```

## Real agent-report.md (verbatim)

# Constraint Advocate — binding.mjs hardening options (asgn_i27_driver_op_009)

## Source read (disclosure)
- Requested path `/home/vantt/projects/forgentX/src/verbs/coordination/binding.mjs` (main checkout): **read permission denied** in this session.
- I read the same file from this worktree instead (branch `unit/I27`): `.claude/worktrees/coordination-skill-harness-i27-panel-depth-experiment/src/verbs/coordination/binding.mjs` (334 lines). If main has moved ahead of `unit/I27`, the line numbers below may not match.
- I opened no other files. The grant was `(none)`, so everything I say about M3, assignment-runner's readOnlyRedirects, `buildCandidateInventory` and the test suite is inference and not verified.

## Correcting a premise first
The option "doing nothing further since H4 is already fixed **for the one capability that hit it**" undersells what the fix does. Line 268 is:

```js
if (!resolved.configured || resolved.bindingSource !== 'capability.prefer') { ...unbound... }
```

This check is structural and doesn't depend on which capability is being resolved. It refuses both the `executor-id` branch (H1) and the `capability.for` branch (H4) for **every** capability that goes through `bindOperations`, not just `review`. So the H4 class is closed in the binding path. Whatever risk is left is a **different** gap, covered below.

## Residual exposure (the one that matters)
**`strength: "required"` provider diversity fails open. The binding writes `satisfied: true` when it shouldn't.**
- `pickDiverseCandidate`, line 148: `family === undefined || !excludedFamilies.has(family)` treats a candidate with an **unknown** provider family as diverse.
- `resolveDistinctProviderFromExclusions`, lines 128-131: a named role that isn't bound yet (forward reference), or that is bound with an unknown family, is **silently skipped**. The excluded set shrinks, which can reach `size === 0` → `diversitySatisfied: true` (line 145).
- Override path, line 202: a Lead-override actor whose executor has no known family is never recorded in `boundProviderFamilyByActorId`. Any later `required` check against that role then passes without checking anything.
- The result: the frozen binding records `diversity: {strength:'required', satisfied:true}` and nothing throws. The code comment (lines 115-119) says "nothing claims to have checked it", but the output record *does* claim that.

**Latent-but-real or theoretical?** It is latent-but-real. The fail-open code is shipped and reachable. The only thing keeping the blast radius at zero today is I21's note that no shipped protocol declares `required`. It turns live, silently, the first time any protocol (for example an independent-red-team variant) adopts `required`. No config change or deploy is needed, and no test trips. One thing I could not check without the grant: how often `buildCandidateInventory` actually returns `providerFamily === undefined`. That only affects how likely the unknown-family branch is. The forward-reference and override skips are unconditional.

**Irreversible element:** the binding itself is pure (no I/O, no persisted state). But a session composed while the fail-open is live writes `diversity.satisfied:true` into its roster/evidence. Under L1/L3 (append-only truth) that false claim cannot be corrected after the fact; it can only be superseded. That makes the first `required` adoption the deadline. Before it, this is a free fix. After it, there are false records on disk.

## Option risk ranking (riskiest first)

| Rank | Option | New kernel surface | Chance of breaking a passing red-team test (M3-style) | Reversible? | Closes residual? |
|---|---|---|---|---|---|
| 1 (riskiest) | **Broad** kernel hardening: re-touch the line-268 branch logic, or change unknown-family semantics for all strengths | Resolution branch plus candidate picking, used by every protocol | **Medium-high.** This is the code H1 and H4 were fixed in over two red-team rounds; changing it changes bindings for shipped protocols, the same pattern as I21's M3 regression | Yes (pure function, revert) | Partly, and at the cost of re-opening verified fixes |
| 2 | **Do nothing** | 0 | 0 today | n/a | **No.** It fails silently on the first `required` adopter and writes evidence that can't be corrected |
| 3 | **Stricter doctor check** (for example, "a capability used by a registered protocol has no `.prefer`, so all its actors fall to unbound", or "an executor has no provider family") | 0 kernel; `src/setup/checks.mjs` only | ~0 (outside the kernel) | Yes | **No.** It detects but doesn't prevent, it depends on someone running `doctor`, and it doesn't touch the `required` fail-open at runtime |
| 4 (least risky **and** closes the gap) | **Scoped** kernel hardening, gated on `strength === 'required'` | ~15 lines in two private helpers (`pickDiverseCandidate`, `resolveDistinctProviderFromExclusions`); line 268 not touched | **Low.** Output is byte-identical for every binding without `required`, which is every shipped protocol today. It can only break a test fixture that already uses `required` together with an unknown family or a forward reference. Grep the test suite for that before landing | Yes | **Yes** |

Why "do nothing" ranks as riskier than the doctor check even though both leave the gap open: do-nothing leaves no signal at all. The doctor check at least surfaces the related silent-unbinding degradation. Neither is a real mitigation for the ranked concern.

## Cheapest mitigation that holds up (an afternoon of work)
In `binding.mjs`, change behavior **only when `dpf.strength === 'required'`**:
1. `pickDiverseCandidate`: treat a candidate with `family === undefined` as **not** diverse. Pass the strength in, or apply the rule at the call site.
2. `resolveDistinctProviderFromExclusions`: when a named role is unbound yet, or bound with an unknown family, return an `unverifiable` flag. At line 289, treat `unverifiable` the same as `!diversitySatisfied`: throw `binding.diversity-unsatisfiable` unless the role is in `allowDiversityUnsatisfiable`. This keeps the existing, already-tested override path.
3. Add three tests: `required` with an unknown family, with a forward reference, and with an override actor of unknown family. Each should throw, and each should pass when the allow flag is set.

This reuses the existing error category and override flag, so there's no new contract. Line 268 and the H1/H4 branch logic stay untouched. Revert is one commit.

Optional follow-on, not a replacement: a doctor warning when a protocol's derived capability has no `.prefer`. That makes H4's safe-but-silent "unbound" outcome visible to whoever runs `fgos doctor`.

## Ownership
`binding.mjs` belongs to the coordination kernel (Unit I21 lineage). From what I was allowed to read, I can't tell who is named owner after I21 closes. If nobody owns it, the scoped fix should land together with the first protocol that adopts `required`, as a hard prerequisite, rather than being left as a backlog note.

## Unresolved questions
- What exactly did I21's M3 attempt change? The "broad hardening = M3 pattern" call above is inferred from the H1/H4 comment history, not from the M3 diff.
- How often does `providerFamily` come back undefined in `buildCandidateInventory` on the real config?
- Does any existing test fixture use `strength: required`? This decides whether the scoped fix is truly zero-break.
- Main vs `unit/I27` drift on `binding.mjs`: I couldn't read main.
