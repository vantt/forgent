# review-a38-step-05-rr4-p34 (s4-src-p34, pin aa8d3437)

Method: loaded the payload, read every item and window, and read the pinned files for the instruction-registry (L90-135, 340-490, 560-735) and instruction-composition (L36-130, 505-550) passages. No diffs in this part (all four files have `diff: null`), so no source-diff checks apply.

## Per file

### src/setup/instruction-composition.mjs: ok
- 42 items reviewed (dynamic-013831 to 013872), all REJECT / preserve.
- Every `nonDocumentUse` is true:
  - Conflict and diagnostic message templates format ids, authorities and scopes.
  - `join`, `addEdge` and `ids.join` calls are text or label joins.
  - `scope: u.scope` is a field echo.
  - `serializeEffectiveInstructionSet` serializes JSON text.
  - `EFFECTIVE_INSTRUCTIONS_DIR = '.fgos/instructions/effective'` and `effectiveSetRelativePath` (013861, 013833) build a `.fgos` state path for a JSON effective set. This is not a document path (R5, same as the L12-71 p01 ruling).
- No filesystem operation exists in the module. No same-passage disagreement.
- OUTCOME defects: none.

### src/setup/lock-record-checks.mjs: ok
- 8 items reviewed (dynamic-014036 to 014043), all REJECT / preserve.
- The paths printed or built are `.fgos` hot-lock record paths (`hotPaths(fgosDir, resource)`, `fgosDirOf`). The other items are `fgos lock fence` label joins and warning-string formatting.
- No document path is constructed or read.
- OUTCOME defects: none.

### src/setup/model-pool-checks.mjs: ok
- 30 items reviewed (dynamic-014044 to 014073), all REJECT / preserve.
- Every item is a message template, a `join` of labels, or a pass-through of a config root (`cwd`).
- 014046 prints the literal `~/.fgos/config.json` (L188). That is a config file, not a documentation path, so reject is right.
- The only filesystem operation in the module (L78-79) probes `.claude/skills` and `.agents/skills`, not documentation. It has no census item.
- OUTCOME defects: none.

### src/setup/instruction-registry.mjs: rework (one park, Lead judgment; no other defect)
- 112 items reviewed:
  - 3 literals: 003798, 003799, 003800.
  - 109 dynamic tuples: 013930 to 014035. They are 70 REJECT/preserve, 37 ADMIT/preserve and 2 ADMIT/parked.
- Confirmed correct:
  - **L361 pair (003798 and 013969).** The `UNKNOWN_DECISION` message prints the fixed literal `docs/decisions/index.md`, a retained generated index that exists at the pin. Both admit and preserve, with `literalOwner` set. No `successorNote` is needed because the target is live.
  - **L450 and L583 comments (003799, 003800, 013982).** The manifest reader is separate (L458, items 013983-013985). Comments reject with preserve, and the target is retained.
  - **JSDoc option lines (013989-013992).** Reject is correct; no path is built there.
  - **`filePath: ...` finding fields (013935 etc., 013980, 013987).** Reject.
  - **State-dir pass-through (014008, 014018, 014028).** Reject, true use is the state directory handed to `listWork`.
  - **`fgosDir = path.join(projectRoot, '.fgos')` default (014032, 014033).** Reject, state path. It is a separate operation from L99.
  - **Admitted discovery operands.** `core/instructions`, `components/<n>/instructions`, `domains/<n>/instructions`, the `docs/architecture-manifest.json` default and the `existsSync` and `realpathSync` probes each name a pathOperand that reads or probes a document path. Same-line items share one admission and one disposition (L412, L418, L458, L598, L599, L600, L649, L655, L687, L693).

#### OUTCOME defect candidates
- **014034 and 014035 (L99), park. Needs Lead decision, leaning rework.**
  - Rule: R4 (a park must name a real, file-specific blocker) and R7 (consistency with the L361 preserve of the same file).
  - What is wrong: both are parked with `blockedSeams: ["generators"]`. Their blockedReason is "requires bounded decision source rows and final composed instruction manifest/scan set at cutover". The "instruction manifest/scan set" half is irrelevant to a decision-index read.
  - Why it reads as boilerplate:
    - The remaining text is the "needs a supplied export / parity" form that R4 rules out.
    - No Phase 9 patch is planned for L99.
  - Why the park is not clearly wrong:
    - The path is retained, and the sibling message at L361 (003798, 013969) preserves it.
    - The code compares the file bytes with `buildDecisionIndexMarkdown(listWork(fgosDir).decisions)`, so a state-derived comparison is a real read.
    - L12-72 item 6 parks doc-registry readers on the same "same-export parity" ground. That is the precedent for keeping the park.
  - Correction (pick one):
    1. Preserve both, joined to 003798/013969, if the Lead holds that the retained fixed path decides it.
    2. Keep the park but rewrite blockedReason to the real dependency: the L99 read must equal the decision-index generator's output, so it stays parked until the generator export parity exists, citing the generator owner. Drop the "instruction manifest/scan set" words.

#### Record-text notes (no outcome change)
- `pathOperand` strings are truncated source fragments, not an operand: 013971 `"dir) {"`, 014004 `"projectRoot)"`, 014014 `"projectRoot)"`, 014024 `"projectRoot)"`. A reader cannot see what the operand yields. Name the real operand (the scan root and the instruction dir).
- `nonDocumentUse` labels are loose:
  - Composition 013861 and model-pool 014046 use `state-event-store`. The targets are an effective-set JSON path and `~/.fgos/config.json`. `config-or-metadata` would fit better.
  - Roles such as `scalar/thread` (014043, 014046, 014050) are meaningless labels for message templates and joins.
- Literals 003799 and 003800 are recorded as REJECT even though the packet summary says 0 rejected literals. The outcome (preserve) is right. Confirm the count with the author.

## Lead-judgment questions
1. 014034/014035: choose option 1 or 2 above.
2. 013978 (`path.relative(realContainmentRoot, realEntryPath)`, L428) and 014010/014011 (path.join for the `filePath:` finding value, L649) are admitted. R5 would class them as a root-relative containment guard and a finding data field, so reject. All siblings preserve, so there is no disposition effect. Re-label or leave as is.
3. 013972/013973 (`realpathSync`/`resolve` of `containmentRoot`, L410/L412) are admitted as probes of the scan root. This is defensible under R6, since the root is a document directory, but R5 treats root-only operands as rejects. The outcome is preserve either way.

## Counts
- Items reviewed: 42 + 8 + 30 + 112 = 192.
  - 3 literals (1 ADMIT, 2 REJECT).
  - 189 dynamic tuples: 42 + 8 + 30 + 109.
- Admission checks: 0 wrong admit/reject that changes an outcome.
- Parks: 2, both dynamic items at L99, with blockedReason concern as above.
- OUTCOME defects: 0 definite, 1 for Lead decision (014034/014035). No diffs to verify.
- Record-text notes: 3.

Status: DONE_WITH_CONCERNS
Summary: 192 items across four source files reviewed. Three files are ok. In instruction-registry only the L99 park (014034, 014035) is questioned: its blockedReason is partly boilerplate and the retained path preserves at L361, so the Lead must pick preserve or a rewritten blocker.
