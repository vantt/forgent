# Review a38 Step 5 seam 4 rr4 p10

Part p10 has one file, `scripts/check-doc-constitution.mjs`, pin 95301cb9, 788 lines. It is a hand-written plan gate script, so R9 applies. It has no diff, no rollbackDiff, no coCutPaths and no parks.

Items reviewed: 146 (4 literal references, 142 dynamic tuples). 28 are admitted and 118 are rejected. All 146 have disposition preserve. I read the pinned source directly and checked every tuple line against it.

## File verdict

`scripts/check-doc-constitution.mjs`: **rework (narrow)**. One outcome defect, one cluster of the same kind for Lead to judge, and a few record-text notes.

## Mechanical checks (all pass)

- Every admitted tuple's `pathOperand` appears verbatim on its source line.
- Every rejected tuple has a `nonDocumentUse` from the closed R5 categories.
- Every tuple's `operationChain.input` is present on its line.
- The four literal references (002482, 002483, 002484, 002485) and their same-line dynamic tuples agree.
  - 002483/006599 (L221) and 002484/006602 (L264) are both admit/preserve.
  - 002482/006642 (L383) is admit/preserve.
  - 002485 (L382) is admit/preserve.
- The paired constant definitions agree: 006608/006609 (L30), 006616/006617 (L31) and 006622/006623 (L32) are all admit/preserve. 006605 and 006630 are admit/preserve.
- Gate constants and plans/ inputs preserve as exact frozen-gate identity (R9). `docs/doc-governance.md` is a retained docs-root file, not under docs/specs or docs/architect, so preserve is sound.
- No park is recorded, so the boilerplate-blocker rule does not apply.
- No retired decision citation is present, so the successorNote rule does not apply.
- The rejected scalar and accumulator items are true R5 cases:
  - `repoRoot = process.cwd()` (006603) and `option('--repo-root', '.')` (006684);
  - `join(',')`, `join('')` and `join('/')` (006584, 006585, 006592, 006593);
  - the regex builders 006591, 006594 and 006595, which build matchers from caller pattern data and read no path;
  - the accumulators 006600, 006606, 006678, 006683, 006689 and 006693;
  - the finding path fields 006601, 006681 and 006706, which carry caller data only.
- The caller-data formatting messages (about 100 tuples, such as `${kind.id}` and `${label}`) print no fixed document root. Reject is correct.

## OUTCOME defects

**D1. dynamic-006694, source line 712. Rule R6 and R7. Reject should be ADMIT, with the same preserve disposition.**

The line is `console.error(\`check-doc-constitution error loading inventory: ${err.message}. ... regenerate with: ${regenerateCommand({ inventoryPath, identityRegistryPath: path.resolve(cwd, IDENTITY_REGISTRY_PATH), cwd })}\`)`.

- The same passage constructs a document path from the fixed constant `IDENTITY_REGISTRY_PATH`. That constant resolves to `plans/.../reports/identity-registry.json`.
- `inventoryPath` defaults to the fixed `DEFAULT_INVENTORY_PATH`.
- Both go into a user-visible regenerate command. The output changes if either root moves.
- The record rejects it as `caller-data-formatting`, which is not true for this line.
- Correction: admit with `pathOperand` = `path.resolve(cwd, IDENTITY_REGISTRY_PATH)`. Disposition stays preserve (R9). Update the reason and the operationChain to name that operation.

## Lead-judgment questions

**Q1. dynamic-006688 (L680) and dynamic-006692 (L693).**

- 006688: `throw new Error(\`File not found: ${inventoryPath}\`)`, directly after `fs.existsSync(inventoryPath)`.
- 006692: `registry-gap decisions require ${registryPath}`.
- Both messages print a path from `option(name, FIXED_DEFAULT)`. The printed path is the fixed document root unless the caller overrides it.
- R6 says a message is formatting only when its path comes "only from caller data, with no fixed document root". Here a fixed default exists, so admit/preserve looks more consistent with D1 and with the p09 fixed DEFAULT_* message precedent.
- Counter-argument: the operand is a bare variable whose document-path admissions are already owned by 006686 (L678) and 006691 (L691).
- My recommendation is admit/preserve for both. The disposition is unchanged either way.

**Q2. dynamic-006653 (L414).**

- It admits `fs.existsSync(path.resolve(repoRoot, by.path))`. In the pinned constitution, every `by.path` is a gate script (`scripts/check-doc-*.mjs`, `scripts/check-legacy-docs-ratchet.mjs`), not a document.
- Admission is defensible as a plan-gate path operation (R9), and the outcome is preserve either way.
- It sits beside 006652 on the same line (R, caller-only message). This follows the side-by-side-independent-operations rule, so I accept it.
- Lead may prefer a reject labelled non-document script probe, for consistency with the R5 wording. I do not call it a defect.

## Record-text notes

- 006607 (L299) and 006610 (L300) have `operationChain.input` values `forbiddenPaths || [])` and `legacyRoots || [])`. These are cut-off fragments, not whole sub-expressions. The full operand is `(constitution?.placementRules || []).flatMap((r) => r.forbiddenPaths || [])` (and `legacyRoots`). 006611 already names the full expression for L300.
- 006639 (L365) is rejected as `caller-data-formatting`, but its template prints the fixed name "doc-governance.md" (`candidate field "${field}" is not in the doc-governance.md required baseline`).
  - It prints no directory path, so it is not census-shaped. Preserve is unaffected.
  - The reason text should say the fixed-name mention is a bare file name with no census-shaped path.
  - L370 carries the same bare name as a non-template string and is not itemed.
- Items 006683 (L650) and 006684 (L652) are in the same function and are correctly separated. 006683's reason should say that it resolves both document option defaults and the repo root.
- Four literals plus 142 tuples sit in a file that also has unitemed document operations. These are the `docs/platform/` guard at L518 and the `git ls-files ... 'docs/platform'` at L639. `docs/platform` is outside the legacy-root census per the earlier ruling, so there is no defect.
- `loadJson(filePath)` at L635 is a parameter pass-through. Its callers' operands (L30–32, L678, L691) are all admitted, so there is no defect.

## Counts

- Items: 146 (4 literals, 142 tuples).
- Admit: 28. Reject: 118.
- Outcome defects: 1 (006694).
- Lead-judgment questions: 2 (006688/006692, and 006653).
- Record-text notes: 4.
- Unseen siblings: none; the part is the whole file.
