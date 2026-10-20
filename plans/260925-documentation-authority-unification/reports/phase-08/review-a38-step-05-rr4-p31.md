# Review a38 step-05 rr4 p31

Items reviewed: 161 across 6 source files. No diffs in this part. 1 park.

## Per file

### src/report/capability-plan-lint.mjs — REWORK (48 items)

OUTCOME defects:

- D1 reference-003690 (L17, docs/how-to/author-a-plan-loop-track.md): disposition is `parked`, and it must be `preserve`.
  - Rule: R4. The blocker "requires final composed candidate document input set... caller artifacts do not pin that candidate set" is boilerplate, not a blocker for this passage.
  - Evidence: this is a hand-written comment pointer to a target that exists at the pin. `shipped-path-conventions-inventory.md:97` lists it as an `exists` / `shipped-surface-contract` end-user-docs convention in consumer projects. It is not under docs/specs or docs/architect.
  - Correction: preserve with a retained/shipped-convention witness (existsAtPin true, `resolverWitness` filled, `parityObligation` candidate = current, blocker null). Sibling 003691 and context-render 003692 do the same for docs/history. Only if Lead decides the how-to relocates in Phase 9 would this be a patch, and then it needs a live target.
- D2 same-statement admission split, L647-649 (one ternary, `planDir = ... textOrPath ...`):
  - 009733 and 009734 are ADMIT, while 009735 (L648 `? textOrPath`) and 009736 (L649 `fs.existsSync(textOrPath) ? path.dirname(textOrPath)`) are REJECT.
  - Rule: R7. One passage must have one admission across literal and dynamic items.
  - 009736 also builds the plan directory from the caller path via dirname and probes it with existsSync, so it is a document-path operation.
  - Correction: make 009735 and 009736 ADMIT/preserve with `pathOperand` textOrPath / `path.dirname(textOrPath)`.
- D3 009715 (L283, `resolvedPath = contentOrPath`, immediately read by `fs.readFileSync(resolvedPath)` at L284): REJECT scalar-pass-through.
  - Rule: R6. This is the read operand of a plan/phase document, in the same if/else chain whose L280 sibling 009714 (`resolvePhaseFile`) is ADMIT.
  - Correction: ADMIT/preserve with `pathOperand` resolvedPath (= caller's file path).
- D4 009737 (L657) and 009738 (L664): REJECT "guard".
  - Rule: R6/R7. Both contain `fs.existsSync(textOrPath)` on the caller's document path, and the L664 statement leads straight into the admitted `path.join(textOrPath,'plan.md')` (009739). The L647 existsSync probe is ADMIT.
  - Correction: ADMIT/preserve, or state why a probe in an `if` guard differs from the same probe in L647.
  - Lower confidence than D2/D3. All outcomes here are preserve, so only the admission flag changes.

Checked and OK:

- 003691 ADMIT/preserve. The docs/history pattern witness is honestly labelled a pattern.
- 009714, 009739, 009750 are valid ADMIT/preserve with real `pathOperand`.
- Rejects correct: 009730/009731 (`path: resolvedPath` finding field, R5); all caller-data messages (L71, L75, L81, L306-L883 family); `lines.join`, `join(',')`, `rest.join('|')`, `cycle.join`; globToRegex and pathsOverlap scalars.

### src/report/context-render.mjs — ok (4 items)

- 003692 ADMIT/preserve navigation. docs/history exists at the pin and is retained. This is consistent with the docs/history preserve in 003691.
- 3 dynamic template/join rejects (caller-data-formatting) are true: they render table rows from decision text.

### src/setup/agent-cli-trust.mjs — ok (21 items, all REJECT/preserve)

- All operands are codex config.toml and agy settings paths, project-root variants, labels, or diagnostic messages printing caller-data config paths. None is a document path.
- `.git` probe (013469), root-only (013471), and scalar pass-throughs are correct under R5/R6.

### src/setup/agent-hooks.mjs — ok (48 items, all REJECT/preserve)

- All operands are hook config files (.claude/settings.json, .codex/hooks.json, .agents/hooks.json, omp/pi extension files) or the `.fgos/installation/bin/fgos` shim. None is a document path.
- Messages print fixed provider-config literals, not documents. Rejects hold.

### src/setup/agy-permissions.mjs — ok (34 items)

- 34 REJECT/preserve. Operands are agy settings.json (`~/.gemini/antigravity-cli/settings.json`), sub-HOME paths, and executor config walks. None is a document path.
- 003793 (L3, docs/history/agy-permission-capability-allowlist/): REJECT/preserve "comment". The outcome (preserve) is right; the target exists at the pin and docs/history is retained. See Lead question Q1.

### src/setup/ansi.mjs — ok (6 items)

- 6 REJECT/preserve caller-data-formatting. These are pure ANSI string helpers.

## Record-text notes

- agent-hooks: `nonDocumentUse: state-event-store` is the wrong label for the shim path `.fgos/installation/bin/fgos` (013497 L41, 013498 L414, 013519 L8). Better: config-or-metadata or a shim/installation label. The REJECT stands.
- agent-hooks 013506 and 013508 reasons say "provider hook settings and scripts" for root-only `path.resolve` and `realpathSync`. Correct class, boilerplate wording.
- capability-plan-lint: admit reasons say "fixed sandbox document or plan reader/gate convention", but the operands are caller-supplied plan paths. Wording is imprecise only.
- 009748 (L78 `^phase-0*N...\.md$`) is rejected as caller-data-formatting. It is a filename-selection regex inside the admitted resolvePhaseFile. It does not itself yield a path, so reject is acceptable. Note it as part of that read operation if Lead prefers.

## Lead-judgment questions

- Q1: 003793 is REJECT/comment while the equivalent comment pointer 003692 (docs/history, also a header citation) is ADMIT/navigation. Both preserve. Should literal comment pointers to retained docs/history be uniformly ADMIT/navigation?
- Q2: agy-permissions L121 emits "RESEARCH.md Round 4" in a user-visible doctor message. It is a bare name inside docs/history/agy-permission-capability-allowlist/, not a census path, and no item covers it. Record only, or add a source slot if it moves?

## Counts

- Files: 6. ok: 5. rework: 1.
- Outcome defects: 4 (D1 park; D2, D3, D4 admission).
- Items by admission:
  - ADMIT: 8 (003690, 003691, 003692, 009714, 009733, 009734, 009739, 009750).
  - REJECT: 153.
- Parks: 1 (003690).
- Patches: 0.
- Diffs: 0.
- Retired decision citations without successorNote: none.

Status: DONE_WITH_CONCERNS
