# investigate-context (real, asgn_i27_driver_op_006)

## Dispatched objective (verbatim)

Read /home/vantt/projects/forgentX/src/verbs/coordination/binding.mjs end to end (absolute path), find and report: (1) the exact H4 fix (restricting accepted resolutions to bindingSource === 'capability.prefer'), with file:line evidence; (2) every OTHER capability currently registered in /home/vantt/projects/forgentX/.fgos/config.json's runner.capabilities that also declares no `.prefer` (a `review`-shaped gap, same class as H4) -- report each by name with a one-line description of what it would fall through to if dispatched today; (3) whether deriveOperationCapability has any mechanism today distinguishing a confinement-sensitive capability from a non-sensitive one, or whether the H4 fix applies uniformly regardless of sensitivity. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}.

## Real agent-result.json

```json
{
  "contract": {
    "id": "agent-result-claim",
    "version": 2
  },
  "status": "done",
  "summary": "H4 fix = binding.mjs:268 `if (!resolved.configured || resolved.bindingSource !== 'capability.prefer')`, rejecting resolve.mjs's branch-1 (literal executor-id) and branch-3 (`for:` orphan-fallback) resolutions, forcing them to bindingSource:'unbound' instead of silently binding to an unconfined executor. Two capabilities in .fgos/config.json runner.capabilities have no `.prefer`: `review` (the capability H4 itself names; confinement.mode:'required'; xai's for:[...,'review'] would supply the unconfined fallback pre-fix) and `pane-labeling` (no confinement declared at all; herdr's for:['pane-labeling'] would supply its fallback) -- same mechanical gap, not yet named by H4's own comment, and not confirmed actually reachable via policy.capability in any shipped protocol (follow-up). deriveOperationCapability and the H4 gate both never read capabilities[name].confinement -- the fix is a blanket bindingSource check applied uniformly regardless of whether the capability is confinement-sensitive or not.",
  "evidenceRefs": [
    "src/verbs/coordination/binding.mjs:268",
    "src/verbs/coordination/binding.mjs:238-267",
    "src/verbs/coordination/binding.mjs:89-109",
    ".fgos/config.json:59-69",
    ".fgos/config.json:31-33",
    ".fgos/config.json:727-730",
    ".fgos/config.json:349-363"
  ]
}
```

## Real agent-report.md (verbatim)

# Context Scout Report — binding.mjs H4 fix + capability.prefer gap sweep

## Hypothesis (stated before hunting)
H4 fixed one instance (capability "review") of a class of bug: any capability
lacking `.prefer` silently falls through to an unconfined executor via that
executor's own `for:` array. If the fix is general (keyed on `bindingSource`,
not on the capability name), other `.prefer`-less capabilities in the real
config should show the identical exposure today. Hunted for: (a) is the fix
actually general, (b) which other capabilities lack `.prefer`, (c) whether
confinement-sensitivity gates anything. Found: fix is general and blind to
sensitivity — this is disconfirming for a narrower reading of H4 as "fixed
capability review specifically," and confirming for "fixed the class."

## 1. Exact H4 fix — file:line evidence

`src/verbs/coordination/binding.mjs:268`
```js
if (!resolved.configured || resolved.bindingSource !== 'capability.prefer') {
```
Everything from `bindOperations` (line 169) up to this check derives a
capability name (`deriveOperationCapability`, line 89) and resolves it via
`resolveExecutorAndOverrides` (dispatch/resolve.mjs, called at line 231).
That resolver has 3 branches (documented inline, binding.mjs:238-267):
1. literal `cfg.executors[capabilityName]` id match → `bindingSource: 'executor-id'`
2. `cfg.capabilities[name].prefer` → `bindingSource: 'capability.prefer'` (the ONLY branch Decision 1.2 names as valid)
3. an executor's own `for: [...]` array happening to include the capability name → `bindingSource: 'capability.for'`

Pre-H4, branches 1 and 3 were accepted as valid resolutions. The regression
named in the comment (binding.mjs:255-263): on the committed config, generic
`"review"` capability (no `.prefer`) silently rebound EVERY actor of
`architecture-advisory-panel-v1` onto `xai`'s unconfined default invocation
(`xai.for` includes `"review"`, config.json:727-730) — a live confinement
regression vs. pre-I21 behavior where such actors were left unbound and fell
through to `readOnlyRedirects` instead.

The fix: line 268's condition rejects both branch 1 and branch 3, pushing the
actor to `bindingSource: 'unbound'` (lines 269-281) whenever the ONLY match
came from a literal executor id or an orphan `for:` fallback — never from a
genuine `capabilities.<name>.prefer` entry. Unbound actors fall through to
`minTier`/`readOnlyRedirects` as the safety net (module header, lines 20-25),
not to whatever tool/agent happens to declare that string in `for:`.

## 2. Other capabilities in `.fgos/config.json` `runner.capabilities` with no `.prefer`

All 11 registered capabilities checked (`impact-analysis`, `pane-labeling`,
`advise`, `execute`, `review`, `fgos-coding-implement`, `code:implement`,
`code:review`, `code:test`, `code:debug`, `code:refactor`). Two lack
`.prefer`:

- **`review`** (config.json:59-69) — this IS the capability H4's own comment
  names. No `.prefer` key. Declares `confinement: {mode: "required", policy:
  "host-write-denied"}`. `xai` executor's `for` array includes `"review"`
  (config.json:727-730) → pre-fix this resolved via `capability.for` onto
  xai's default (unconfined) invocation, violating its own declared
  `confinement.mode: "required"`. Post-fix: falls through to `unbound`,
  `minTier`/`readOnlyRedirects` become the safety net instead.

- **`pane-labeling`** (config.json:31-33) — description only, no `.prefer`,
  no `confinement` block declared at all (not flagged security-sensitive by
  its own config entry). `herdr` executor's `for` array includes
  `"pane-labeling"` (config.json:349-363) → if ever dispatched through
  `bindOperations`/`deriveOperationCapability` with `policy.capability:
  "pane-labeling"`, it would resolve via `capability.for` onto `herdr` pre-fix,
  and fall through to `unbound` post-fix — same mechanical exposure as
  `review`, just without an explicit confinement declaration to violate.
  Caveat (absence, not confirmed): I found no evidence in `binding.mjs` or the
  read files that any real `CoordinationProtocol` operation actually declares
  `policy.capability: "pane-labeling"` today — `/fgOS:terminal`'s pane-label
  writing looks like a separate direct capability-query path, not routed
  through this binder. I did not check every skill file to rule this out; flag
  as a follow-up if that matters (`grep -r "pane-labeling" --include=*.yaml`
  across `core/coordination-protocols/`).

No other capability lacks `.prefer` — the other 9 all declare either a string
or an array-of-objects `.prefer`.

## 3. Does `deriveOperationCapability`/the H4 gate distinguish sensitivity?

No mechanism found. Two separate checks, both blind to confinement:

- `deriveOperationCapability` (binding.mjs:89-109) derives the capability
  NAME only from `operation.policy.capability`, `result.kind`,
  `facts.primaryCapability`, and `facts.domain` — it never reads
  `runnerConfig.capabilities[name].confinement` at any point.
- The H4 gate itself (binding.mjs:268) checks only `resolved.configured` and
  `resolved.bindingSource !== 'capability.prefer'` — no reference to
  `confinement` anywhere in that condition or its surrounding block.

So the fix applies uniformly regardless of whether the capability declares
`confinement.mode: "required"` (like `review`, `advise`, `code:review`,
`code:debug`) or declares no confinement at all (like `pane-labeling`,
`execute`, `code:test`, `code:refactor`, `code:implement`,
`fgos-coding-implement`). A confinement-sensitive capability with no
`.prefer` gets exactly the same "fall through to unbound" treatment as a
non-sensitive one with no `.prefer` — the fix is a blanket "only
`capability.prefer` counts as a real resolution" rule, not a
sensitivity-scoped one. This is disconfirming for any framing that treats H4
as "fixed the review-specific bug"; it's a general rule that happens to have
fixed one live instance.

## Unresolved / follow-up candidates
- Not verified whether any shipped protocol YAML actually declares
  `policy.capability: "pane-labeling"` — would need a repo-wide grep across
  `core/coordination-protocols/` to confirm real (not just theoretical)
  exposure.
- Did not check whether `resolveExecutorAndOverrides` (dispatch/resolve.mjs)
  itself has any confinement-awareness that `binding.mjs` merely doesn't
  consume — only `binding.mjs` was in scope per the assignment.
