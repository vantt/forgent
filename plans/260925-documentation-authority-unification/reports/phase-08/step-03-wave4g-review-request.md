# Step 3 wave 4g — new-batch independent review request

Fixed author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Patch RECORDS only; no consumer edit. Read owner-answers A51, L12-21..L12-44, the complete progress authoring digest and step-03-authoring-request.md schema. **Reviewers never run checker/probes.** Reviewers started/accepted 0/0.

ONE request for NEW batches **077–078 only**: 50 whole-file records / 132 edges. Selected **9 whole files / 31 edges / 2 parts**, including the open-Lead supplement. Index and manifest bind exact source/diff/record bytes. Batches **079–082 remain unauthored** at the whole-file source/target authoring budget boundary after 078; no partial next batch. Records ≤076, their independent reviews, and every earlier request remain unchanged.

Read each complete pinned consumer, its actual targets, every edge/proof field, diff, supplemental candidates and exclusions. Hashes/checker receipts bind evidence but never accept semantics. L12-44 merge differences remain Step 4 rebind obligations; do not substitute HEAD bytes for this pin.

## Specific semantic checks

- Batch-077 04723 parks: source says statusAtAsk resumes doing; the pinned candidate G4/answer uses durableStatusAtAsk and clamps doing to todo. Check the entire adjacent behavior/locator claim, not only path identity.
- 04728 parks: the cited manual-only line-43 workaround is no longer what the pinned renamed guide line 43 says. 04759/04763 park because their still-open 0026 placement gloss contradicts the holder completed section.
- **Open Lead question, batch-077 only: 04741–04744.** These file identities appear in the explicitly completed tsk-2tk Post-merge prose sync section: 04741 is numbered item 4; 04742–04744 are the immediately following completed-update sentence. L12-26(5)/L12-42(3) preserve past-event spelling; the unchanged alias predicate recognizes explicit history/captured regions but not this unfenced completed-action list. The five-part Lead question is `step-03-wave4g-lead-ruling-gaps.json`. They are non-executable lead-ruling parks, carrying exact aliases and source/witness evidence. No checker change or new rule is proposed/applied here. Independently judge their actual passage role and preserve dissent for Lead; batch-077 cannot close until zero lead-ruling edges.
- Added distribution.md basenames in 077 resolve to the distribution spec explicitly named at source line 7 and preserve the obsolete-rule audit. The added 0000-index.md reference records the completed rename/annotation history. In 078 the quoted work-state.md/RUL19 reference preserves captured history with a work-state successor note.
- Check 04714 precise launcher/rootTask vocabulary scope, 04745 consuming-project Ship Faster scope, 04707 Real-world proof and 04710 Watch out for field comparison. Check 04765 as a truthful citation to a stale guide, not an endorsement of its obsolete mechanics.
- Related pointers use exact alias holders; 04811 retains the D7 section locator. 04824 keeps the performed compound docPath command literal: its alias holder equals the consumer, so it must never turn into a self pointer.

## Set and stratum accounting

| Set | Patched population / seeded | Mandatory | Patched selected | Unpatched eligible / selected | Distinct A51 files |
|---|---:|---:|---:|---:|---:|
| batch-077 | 9/2 | 0 | 2 | 11/2 | 4 |
| batch-078 | 13/2 | 0 | 2 | 8/2 | 4 |

The manifest freezes exact NUL seeds/ranks, source/diff/record hashes and threshold witnesses (≥65,536 bytes OR ≥40 inventory edges). Patched population includes every nonempty Phase 9 diff. Unpatched eligible population = empty diff and ≥1 edge, excluding already selected files. Each stratum separately has reviewed denominator 0 and rework pending; ≤3% per set/stratum passes, >3% expands to EVERY file of THAT set, including unpatched/zero-edge records. Never pool, reseed, replace samples or self-accept. The open-Lead supplement is labelled separately and cannot disguise a stratum denominator.

## Python per-field extractor

Set consumer and batch from the assigned table. Run once per file, reading every printed field; stream long passages/lists as bounded slices. Each page is ≤300,000 bytes (use UTF-8 bytes for byte-sized pages), never a complete serialized record.

```python
import json, pathlib
root = pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-08')
batch = 'COPY BATCH NUMBER'
consumer = 'COPY EXACT ASSIGNED PATH'
record = next(json.loads(line) for line in (root/'step-03-records'/f'batch-{batch}.jsonl').read_text().splitlines() if json.loads(line)['file'] == consumer)
def emit(label, value):
    data = json.dumps(value, ensure_ascii=False, indent=2).encode()
    for start in range(0, len(data), 300000):
        print(label, 'byte page', start, data[start:start+300000].decode('utf-8', errors='backslashreplace'))
for key in ('file','inventoryInputCommit','authorInputCommit','inventoryFileDigest','digest','inventoryEdgeIds','reviewSet','authoringRules','retiresWithTree','edgeIds','reason','diff'):
    emit(key, record.get(key))
for edge in record.get('edges', []):
    for key, value in edge.items(): emit(edge["edgeId"]+" "+key, value)
for section in ('coverage','anchors','relativeResolution','labelForm'):
    for key, value in record.get('checks', {}).get(section, {}).items():
        if key == 'legacyScan':
            for k, v in value.items():
                if k != 'candidates': emit(section+' '+key+' '+k, v)
            for i, candidate in enumerate(value['candidates']): emit('scan candidate '+str(i), candidate)
        else: emit(section+' '+key, value)
```

Read source chunks with `git show <pin>:<consumer> | sed -n '1,120p'`, then 121–240 and so on through EOF. Large artifacts are streamed with one whole-file verdict: see per-part readingPages in the index. Each ordinary part has ≤6 files, ≤150 edges and ≤400,000 source-plus-record bytes. An indivisible larger file is isolated, its edges read in ≤100-edge pages; no artificial file split or duplicate sample membership.




## Assigned parts

### Part 01 → `review-a38-step-03-wave4g-p01.md`

6 files / 20 edges / 117031 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-077 | `docs/knowledge/why-fgos-add-items-landed-permanently-at-stage-executing-wit/why-fgos-add-defaulted-new-items-to-stage-executing-with-no-way-back.md` | unpatched-seeded | 2 |
| batch-077 | `docs/knowledge/why-fgos-checks-repo-invariants-at-return-and-merge-instead/why-fgos-checks-repo-invariants-at-return-and-merge-instead-of-the-full-test-suite.md` | patched-seeded | 3 |
| batch-077 | `docs/knowledge/why-fgos-coding-planning-s-mode-gate-moved-to-fgos-routing-a/why-fgos-planning-moved-mode-gate-to-fgos-routing.md` | patched-seeded | 3 |
| batch-077 | `docs/knowledge/why-fgos-coding-planning-writes-docsref-immediately-after-cr/why-fgos-coding-planning-writes-docsref-when-it-self-creates-a-feature-dir.md` | unpatched-seeded | 7 |
| batch-078 | `docs/knowledge/why-fgos-install-moved-from-always-pulling-main-head-to-a-ta/why-fgos-install-is-pinned-to-a-semver-tag-instead-of-main-head.md` | patched-seeded | 2 |
| batch-078 | `docs/knowledge/why-fgos-main-checkout-lock-could-report-ambiguous-with-no-r/main-checkout-lock-toctou-race.md` | patched-seeded | 3 |

### Part 02 → `review-a38-step-03-wave4g-p02.md`

3 files / 11 edges / 80526 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-078 | `docs/knowledge/why-fgos-merge-loop-tsk-1sm-recurses-into-loop-not-ck-loop/why-merge-loop-recurses-into-loop-not-ck-loop.md` | unpatched-seeded | 1 |
| batch-078 | `docs/knowledge/why-fgos-retro-loop-restores-the-compound-verb-instead-of-in/fgos-retro-loop-and-the-restored-compound-verb.md` | unpatched-seeded | 2 |
| batch-077 | `docs/knowledge/why-fgos-coding-planning-and-fgos-coding-validating-merged-t/why-planning-and-validating-collapsed-into-one-co-adjustment-gate.md` | open-lead-ruling | 8 |

## Required handback

Read complete pinned consumers in consecutive ≤120-line pages through EOF. Extract each JSON field with Python above; never dump an entire JSONL record. Page fields >300,000 UTF-8 bytes; maintain one whole-file verdict/diff. Ordinary parts ≤6 files / ≤150 edges / ≤400,000 source-plus-record bytes. Read exact target passages and full targets where the record claims whole-artifact correspondence. Write only the assigned unique report, with source/diff/record hashes, per-file verdicts, edge counts and evidence. Separate semantic rework, record-text notes and Lead questions/dissent. Report denominators/numerators per set AND stratum including overlaps. **Never run checker/probes**, repair records, dispatch or accept this request. Lead owns independent review, preview and actual runner-commit accounting. GAP-01/02/03, workflow/RUL10 carry, Step 5 parity and Phase 9 remain separate gates; no Step 3 acceptance or phase close. Exact report namespaces come from this brief; fgOS CLI is forbidden to this author.
