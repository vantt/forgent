#!/usr/bin/env python3
"""Publish this records-only attempt honestly; report first and v2 result last."""
import collections
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
OUTBOX = Path('/home/vantt/projects/forgentX/.fgos/assignments/unit-run-1792757491674-9a8c53d5/producer/1/runs/01/outbox')
SUBJECT = 'docs: compose migration records and disclose unresolved replay gaps'
assert len(SUBJECT) <= 100

def read(name): return json.loads((HERE / name).read_text())
def digest(data): return hashlib.sha256(data).hexdigest()
def atomic(path, text):
    temp = path.with_name(path.name + '.tmp')
    with temp.open('w') as f:
        f.write(text)
        f.flush()
        os.fsync(f.fileno())
    os.replace(temp, path)

actions = read('actions.json')
patches = read('patch-specs.json')['patches']
renders = read('skill-regeneration.json')
all_outputs = read('generator-all-output-deltas.json')['deltas']
joins = read('member-joins.json')
post = read('post-move-replay.json')
scan = read('scan-replay.json')
commands = read('commands.json')
first_commands = read('commands-first-replay.json')
order = json.loads((HERE.parent.parent / 'phase-08/step-07-patch-order.json').read_text())
assert len(actions['actions']) == 101
assert {a['id'] for a in actions['actions']} == set(order['parkedSpecIds'])
assert collections.Counter(r['familyNumber'] for r in joins['rows']) == {8: 48, 13: 16, 17: 8}
assert all(r['source']['passageStillExact'] for r in joins['rows'])

# Verify same-file hashes against actual named predecessor records.
by_id = {p['id']: p for p in patches}
approved = {p['patchSpecId']: p for p in json.loads((HERE.parent.parent / 'phase-08/step-07-composed-patches.json').read_text())['patches']}
edges = []
for patch in patches:
    predecessor = patch.get('predecessor')
    if not predecessor: continue
    owner = by_id.get(predecessor['patchSpecId']) or approved[predecessor['patchSpecId']]
    assert patch['beforeSha256'] == predecessor['expectedAfterSha256'] == owner['expectedAfterSha256']
    edges.append({'specId': patch['id'], 'predecessor': predecessor['patchSpecId'], 'sha256': patch['beforeSha256'], 'valid': True})
atomic(HERE / 'chain-verification.json', json.dumps({'edges': edges, 'allImmediateEdgesValid': True, 'historicalApprovalTransfers': False, 'note': 'Recomposed current-byte predecessors require G9 delta review; historical approval does not transfer.'}, indent=2) + '\n')

# No staging/commits/index refresh. These are read-only checks, not Git writes.
audit_commands = []
for argv in [['git', '--no-optional-locks', 'rev-parse', 'HEAD'], ['git', '--no-optional-locks', 'diff', '--name-only'], ['git', '--no-optional-locks', 'diff', '--cached', '--name-only'], ['git', '--no-optional-locks', 'status', '--porcelain']]:
    result = subprocess.run(argv, cwd=ROOT, text=True, capture_output=True)
    audit_commands.append({'argv': argv, 'cwd': str(ROOT), 'exit': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr})
    assert result.returncode == 0
assert not audit_commands[1]['stdout'] and not audit_commands[2]['stdout']
assert audit_commands[0]['stdout'].strip() == joins['sourceCommit']
assert all(line[3:].rstrip('/') == str(HERE.relative_to(ROOT)) for line in audit_commands[3]['stdout'].splitlines())

counts = {
    'familyMemberJoins': {'8': 48, '13': 16, '17': 8},
    'exactCurrentPassageJoins': len(joins['rows']),
    'parkActions': len(actions['actions']),
    'parkActionKinds': dict(collections.Counter(a['kind'] for a in actions['actions'])),
    'unfinishedParkEntries': len(actions['unresolved']),
    'patchSpecs': len(patches),
    'changedPatchSpecsRoundtripped': sum(bool(p['diff']) for p in patches),
    'noByteChangePatchSpecs': sum(not p['diff'] for p in patches),
    'canonicalSkillInputs': len(renders['canonicalInputs']),
    'parkedRenderSpecs': len(renders['patches']),
    'changedParkedRenders': sum(bool(p['diff']) for p in renders['patches']),
    'allGeneratedOutputChanges': len(all_outputs),
    'generatedChangesOutsideParkedSet': sum(not p['parked'] for p in all_outputs),
    'sameFileImmediateEdgesVerified': len(edges),
    'physicalScratchMoves': len(post['physicalMoves']),
    'predecessorsDeferredForSourceDrift': len(post['predecessors']),
    'finalRecordedCommands': len(commands),
    'firstReplayRecordedCommands': len(first_commands),
}
blocker = ('The full brief is not complete: 15 park entries remain without accepted complete composition '
           '(12 whole-row units still need authoring; 3 need exact live-holder/carriage decisions), '
           'four area scopes lack live holders, current-byte predecessor drift needs G9 review, '
           'and the citation/dead-vocabulary owning guards are red. GAP-05 placement is only a proposal. '
           'The prohibited Git-fixture side effect is disclosed in constraint-incident.json.')
summary = SUBJECT + '. Indexed 48/16/8 members and 101 parks, composed 38 patch specs, regenerated skills in scratch; blocked, not gate closure.'
claim = {'contract': {'id': 'agent-result-claim', 'version': 2}, 'status': 'blocked', 'summary': summary, 'blocker': blocker, 'needsWrites': [], 'evidenceRefs': [str(HERE / name) for name in ['receipt.md', 'receipt.json', 'patch-specs.json', 'member-joins.json', 'actions.json', 'skill-regeneration.json', 'generator-all-output-deltas.json', 'post-move-replay.json', 'scan-replay.json', 'gap05-placement-proposal.json', 'constraint-incident.json']]}
validator = "import fs from 'node:fs'; import {validateAgentResultClaimContract as validate} from './src/runner/dispatch/agent-result-claim-contract.mjs'; const result=validate(JSON.parse(fs.readFileSync(0,'utf8'))); console.log(JSON.stringify(result)); if(!result.valid) process.exitCode=1;"
validation = subprocess.run(['node', '--input-type=module', '-e', validator], input=json.dumps(claim), cwd=ROOT, text=True, capture_output=True)
assert validation.returncode == 0, validation.stderr + validation.stdout

receipt = {
    'status': 'blocked', 'briefComplete': False, 'gateClosed': False,
    'sourceCommit': joins['sourceCommit'], 'createdAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'summary': summary, 'counts': counts,
    'touchedIds': {'families': [8, 13, 17], 'gates': ['G1', 'G7'], 'memberIds': sorted({r['memberId'] for r in joins['rows']}), 'parkedSpecIds': sorted(a['id'] for a in actions['actions']), 'rowIds': sorted({r for a in actions['actions'] for r in a['rowIds']} | {r['rowId'] for r in joins['rows']}), 'newPatchSpecIds': sorted(p['id'] for p in patches), 'rebindRequired': ['claim_15308eb4'], 'placementProposalMember': 'dynamic-023895', 'placementProposalRow': 'r28621'},
    'commands': {'reproduce': ['python3 -B plans/260925-documentation-authority-unification/reports/phase-09/composition/compose.py'], 'finalReplay': 'commands.json', 'firstReplayIncludingConstraintIncident': 'commands-first-replay.json', 'readOnlyFinalAudit': audit_commands, 'claimValidation': {'argv': ['node', '--input-type=module', '-e', validator], 'exit': validation.returncode, 'stdout': validation.stdout, 'stderr': validation.stderr}, 'note': 'These logs retain pipeline argv/cwd/exits/stdout/stderr. Exploratory read/grep tool calls and earlier iterative composer runs are not represented as independent proof.'},
    'proof': {'skillBuildExit': renders['exit'], 'singleTests': post['tests'], 'citationTest': {'pass': 31, 'fail': 1, 'skipped': 0, 'newNestedReaderCase': 'pass', 'realRepoBaselineCase': 'fail: 126 new findings; baseline unchanged'}, 'deadVocabularyTest': {'pass': 8, 'fail': 2, 'skipped': 0, 'details': '18 P5 occurrences in successor/history specs; 9 retired gateway/plugin names in live component-boundary carriage'}, 'formatOnlyScan': scan['citation'], 'enduserProjection': scan['enduser'], 'nearDuplicate': scan['nearDuplicate'], 'shippedClassifier': scan['shippedClassifier'], 'strictCoverageLimitation': 'Format-only finding multiset is an additive superset, but its old set has zero findings. That does not certify the whole guard or final-pin coverage. Whole-file guards remain red. No rebaseline, filter loosening, test skipping, or source application.'},
    'blocker': blocker, 'unfinishedEntries': actions['unresolved'],
    'constraintIncident': 'constraint-incident.json',
    'scope': {'repositoryWritesOnly': str(HERE.relative_to(ROOT)) + '/**', 'sourceApplied': False, 'worktreeGitAddCommit': False, 'gitFixtureWritesOccurred': True, 'liveStateOrSecretsRead': False, 'activationOnlyRead': '/home/vantt/projects/forgentX/.fgos/installation/activation.json', 'fullSuiteRun': False, 'fgosCliRun': False, 'leadRecordsEdited': False, 'pairAccountingEdited': False, 'needsWrites': [], 'outboxException': str(OUTBOX)},
    'integrity': {p.name: {'sha256': digest(p.read_bytes()), 'bytes': p.stat().st_size} for p in sorted(HERE.iterdir()) if p.is_file() and p.name not in ['receipt.md', 'receipt.json'] and not p.name.endswith('.tmp')},
}
atomic(HERE / 'receipt.json', json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
md = f'''# Composition receipt — blocked, not complete

{SUBJECT}

## Read first

- `member-joins.json`: 48/16/8 exact current-passage joins (not independent acceptance).
- `actions.json`: all 101 parks accounted for; **15 unfinished**. Twelve whole-row units still need authored complete diffs, and three require exact live-holder/carriage decisions. Merely indexing a park is not composition.
- `patch-specs.json`: 38 specs; 37 changed-byte fuzz=0 forward/inverse roundtrips and one explicit no-byte-change result. Immediate hash chains are checked in `chain-verification.json`; recomposed historical predecessors still require G9 delta review.
- `area-holder-table.json`: aliases/free-text scope semantics retained. Missing live holders: enduser-docs-authoring, enduser-docs-index, seat-binding, workflow. Repo narrative placement is proposed, not established; root binding laws remain root authority.
- `gap05-placement-proposal.json`: move both complete source-carriage sections into literal history; Lead placement approval required. No guard exemption or historical renaming.

## Authored/replayed

Both review reworks, verbatim credential-store §13.1 carriage, recursive citation reader + owning nested fixture, canonical citation convention, scope table/consumer records, exact current hunk reconstruction and nine conditional whole-status-unit packets are composed. Credential carriage still needs Lead/G9 rebind of `claim_15308eb4`.

Scratch `npm run build:skills`: **exit 0**, 12 canonical inputs, 69 parked renders (24 changed, 45 unchanged). All 33 generated-output changes are captured, including nine outside the parked render set. Generated diffs are evidence only, never a hand-application path.

Scratch post-move replay: 1,039 physical moves, 19 unrelated approved predecessors deferred for source drift. This is **not final-pin parity**.

| Proof | Result |
|---|---|
| Citation owning file | exit 1; 31 pass / 1 fail; nested reader case passes, real-repo baseline case finds 126 new findings |
| Dead-vocabulary owning file | exit 1; 8 pass / 2 fail; 18 successor/history P5 occurrences plus nine live carriage names |
| Format-only additive read set | 17→68 files, 0→124 findings; no retained-source omission; unchanged baseline; not whole-guard closure |
| Bounded exported end-user index | 492→490; lifecycle and rollup content-carriage gaps remain; no live store read |
| Production near-duplicate check | current and scratch post-move pass; registry wiring test is not falsely called an owning behavior proof |
| Pure shipped classifier | seven before/after cases identical; full-file proof unavailable under no-Git-write rule |

## Constraint incident — do not omit

The first inventory whole-file test created temporary committed Git fixtures through its existing fixture helper. This **violated “never a git write”**. Source-worktree Git was not staged or committed. Details and original failing log are retained in `constraint-incident.json`, `commands-first-replay.json`, and `generate-shipped-path-inventory.test.log`. That complete test was removed from subsequent replay; this receipt does not conceal the violation or count its result as a pass.

## Scope and handoff

Only composition records were written in the repository. No product/source application, Lead record edit, pair accounting, fgos CLI, live state/secrets, full test suite, or baseline rewrite. Activation metadata was read only for the required host path. Final tracked worktree and staged diffs are empty; only this composition directory is untracked.

Commands/exits, touched member/row/spec ids, artifact digests, precise unfinished entries and limitations are in `receipt.json`, `commands.json`, and `commands-first-replay.json`. No additional repository write permission is requested: `needsWrites=[]`. Lead/D1 acceptance and remaining independent authoring/review are still necessary. **No G1/G7/G9 gate is claimed closed.**
'''
atomic(HERE / 'receipt.md', md)
report = f'''{SUBJECT}

Anh xem hồ sơ tại `{HERE / 'receipt.md'}`.

Em đã nối đủ 48/16/8 thành viên và lập danh mục 101 park; soạn 38 patch spec, hai rework, carriage §13.1 và tái sinh skill trong scratch.

**Blocked, chưa hoàn tất brief:** còn 15 park chưa có composition đầy đủ, thiếu các holder đã duyệt và hai owning guard còn đỏ. Không áp source, không sửa baseline, không đóng gate.

Em đã chạy nhầm một inventory test có tạo committed Git fixture trong scratch, vi phạm lệnh cấm Git write; ghi rõ ở `constraint-incident.json`. Worktree không bị add/commit. `needsWrites=[]`.

Bằng chứng: receipt.json, member-joins.json, patch-specs.json, actions.json, skill-regeneration.json, generator-all-output-deltas.json, post-move-replay.json, scan-replay.json, gap05-placement-proposal.json và constraint-incident.json trong cùng thư mục.
'''
assert OUTBOX.is_dir(), 'Expected existing assignment outbox; no arbitrary directory creation'
# Required publication order: report first, claim last, each atomically replaced.
atomic(OUTBOX / 'report-1.md', report)
atomic(OUTBOX / 'result-1.json', json.dumps(claim, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'published': ['report-1.md', 'result-1.json'], 'status': 'blocked', 'counts': counts}, ensure_ascii=False))
