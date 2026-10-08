# Corpus policy blocker

Status: blocked; not an independent review verdict.
Author session: undefined
Observed candidate pin: 0a41d793e60631aa9073c73a941f641548862b6c
Decision-data pin: 576f9efea72de92d4191eb295afd9b2349bbb99a

Two pending corpus rules cannot be accepted as written. T3 expands their reviewed rules into both claim decisions and file decisions. Its file overlay overwrites the existing generated projection disposition. The frozen vocabulary rejects all three resulting file decisions:

| Path | Corpus | Required file role | Corpus file disposition |
|---|---|---|---|
| docs/decisions/index.md | history-evidence | generated / regenerate-from-source, explicitly required by N1 | retain-as-evidence |
| docs/doc-registry.md | user-knowledge | generated / regenerate-from-source | reclassify-out-of-platform-scope |
| docs/enduser-docs-index.json | user-knowledge | generated / regenerate-from-source | reclassify-out-of-platform-scope |

The Node diagnostic in corpus-policy-blocker.json calls the existing validateAgainstVocabulary on exactly the file values that the authored rules would produce. Exit 1; three file-class-not-allowed-for-disposition findings. No reviewStatus, reviewer identity, review report or committed approval is invented. This is not a claim that active D fails: active D has zero fatal findings because both rules are still pending.

Sources: scripts/check-doc-inventory-gates.mjs lines 731–787 (corpus expansion), 878–891 (file overlay), 310–345 (vocabulary validation); frozen vocabulary retain-as-evidence and reclassify-out-of-platform-scope allowedFileClasses; phase contract N1 keep. These are generated projections, not misclassified maintained-authority documents. Re-pinning them to historical file classes would hide the error and violate the existing projection role.

## Owner decision required

Recommended: narrowly authorize T3 to retain regenerate-from-source for generated file items, while the independently committed corpus rule still covers and expands every corpus claim row. Keep the whole-corpus membership check, mandatory authorship, independence, committed-report requirements, allowedFileClasses validation and N1 unchanged. Tests first. No change is made now under A5/A8.

Alternative: withdraw the two affected corpus rules and replace their expansion with per-row independent review plus compatible file decisions; no tool change. No effort or outcome for that alternative is proven.

The pending rules remain proposals, never approvals. The consumer-project rule has no generated file member and is not implicated. No baseline addition is requested. Stop before making an unauthorized gate or vocabulary semantic change (stop conditions 1/2).

## Remaining proof

Independent content approval, actual accepted corpus expansion, scoped strict E, reduced promotion rehearsal and fresh readers remain UNPROVEN. reverse-agent-coordination.json additionally records 184 unnamed candidate units; its human classification proposals do not waive the frozen reverse check.
