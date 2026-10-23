"""Read-only receipt projection; redirect stdout to receipt.json. python3 -B."""
import hashlib
import json
import pathlib
import subprocess

root = pathlib.Path(__file__).resolve().parents[5]
report = pathlib.Path(__file__).resolve().parent
prefix = 'plans/260925-documentation-authority-unification/'
shard_path = prefix + 'ledger/decisions/s14-resync-b.json'
load = lambda p: json.loads(p.read_text())
shard = load(root / shard_path)
scan = load(report / 'legacy-drift.json')
verification = load(report / 'verification.json')
baseline = load(report / 'baseline-resolution.json')
diff = subprocess.run(['git', 'diff', '--check'], cwd=root, text=True, capture_output=True, check=True)
tracked = subprocess.check_output(['git', 'diff', '--name-only'], cwd=root, text=True).splitlines()
assert set(tracked) == {d['path'] for d in shard['changedDocuments']}
untracked = subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard'], cwd=root, text=True).splitlines()
for name in untracked:
    assert name == shard_path or name.startswith(prefix + 'reports/phase-09/resync-b/'), name
hash_file = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
artifacts = [{'path': str(p.relative_to(root)), 'sha256': hash_file(p)} for p in sorted(report.iterdir()) if p.is_file() and p.name != 'receipt.json']
artifacts.append({'path': shard_path, 'sha256': hash_file(root / shard_path)})
print(json.dumps({
    'version': 1, 'status': 'authoring-complete-independent-review-pending',
    'head': scan['head'], 'baselineHead': baseline['baselineHead'], 'baselineSourceBytesUnchanged': baseline['sourceDigestsUnchanged'],
    'authorityCutover': False, 'gateAcceptance': False, 'approvalCarry': False,
    'needsWrites': [], 'changedDocuments': shard['changedDocuments'],
    'sourceBindings': len(shard['unitCarries']), 'bindingRefresh': len(shard['bindingRefresh']),
    'alreadySupersededHistoricalRowsResolved': len(shard['alreadySupersededHistoricalBindings']),
    'baselineMissingUnits': baseline['baselineMissing'], 'baselineResolutionCounts': baseline['resolutionCounts'],
    'dispositions': verification['dispositions'], 'literalHistoryWitnessFilesUnchanged': verification['historyFilesUnchanged'],
    'files': [{'sourcePath': r['sourcePath'], 'sourceSha256': r['sourceSha256'], 'missingCurrent': r['counts']['missingCurrent'], 'missingChanged': r['counts']['missingChangedSinceInventory']} for r in scan['records']],
    'scannerCounts': scan['counts'], 'tests': load(report / 'test-results.json'),
    'independentHashCheck': load(report / 'independent-hash-check.json'),
    'metadataFindings': verification['metadata']['findings'], 'newMetadataFindings': [],
    'whitespace': {'command': 'git diff --check', 'exit': diff.returncode, 'stdout': diff.stdout, 'stderr': diff.stderr},
    'scope': {'trackedChangesMatchDeclaredDocuments': True, 'newFilesConfinedToShardAndReceiptDirectory': True, 'repositoryGitWrites': False, 'productionCodeEdits': False},
    'notRun': ['fgOS CLI/capability query (forbidden)', 'broad Node/Rust suites (forbidden)', 'native rebuild/Rust freshness checks', 'authority or gate acceptance'],
    'knownOutOfScopeIssue': 'Pre-existing duplicate docs/reading-map.md switchboard route; reported, not required to complete this conservation assignment and not changed.',
    'evidence': artifacts
}, ensure_ascii=False, indent=2))
