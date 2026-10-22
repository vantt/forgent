#!/usr/bin/env python3
"""Read-only final-pin checks; reuse the committed census lexer, never live state.

Only this plan's proof JSON and explicit /tmp/fgos-work logs are written. Some
common-light tests perform git init/add/commit in fixtures: the records-turn
no-Git-write boundary forbids those complete files, so they are NOT run or
filtered. Their proof remains an explicit Lead obligation.
"""
import sys
sys.dont_write_bytecode = True
import collections
import hashlib
import importlib.util
import json
import pathlib
import re
import subprocess

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
PIN = sys.argv[1]
SCRATCH = pathlib.Path(sys.argv[2]).resolve()
if not re.fullmatch('[0-9a-f]{40}', PIN) or not str(SCRATCH).startswith('/tmp/fgos-work/'):
    raise SystemExit('explicit source pin and /tmp/fgos-work scratch required')
SCRATCH.mkdir(parents=True, exist_ok=True)

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args]).decode().strip()

if git('rev-parse', 'HEAD') != PIN:
    raise SystemExit('HEAD moved')

def module(name):
    spec = importlib.util.spec_from_file_location(name, HERE / (name + '.py'))
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj

protected = ['AGENTS.md', 'CLAUDE.md', 'README.md', 'docs/README.md', 'docs/reading-map.md', 'docs/specs/reading-map.md', 'docs/transitional-switchboard.md', 'plans/260925-documentation-authority-unification/transitional-switchboard.json', 'docs/platform-foundations.md']
protected_proofs = []
for rel in protected:
    expected = subprocess.check_output(['git', '-C', str(ROOT), 'show', PIN + ':' + rel])
    actual = (ROOT / rel).read_bytes()
    protected_proofs.append({'path': rel, 'atPin': sha(expected), 'current': sha(actual), 'unchanged': expected == actual})
if not all(r['unchanged'] for r in protected_proofs):
    raise SystemExit('protected file changed')

written = sorted(set(git('diff', '--name-only', 'HEAD').splitlines() + git('ls-files', '--others', '--exclude-standard').splitlines()))
allowed_roots = ['plans/260925-documentation-authority-unification/' + s for s in ['reports/phase-08/', 'ledger/decisions/', 'pilot/decisions/']]
allowed_exact = ['plans/260925-documentation-authority-unification/reports/phase-06/' + s for s in ['step10-round5-reproduction.json', 'step10-sync4d-reproduction.json']]
if any(p not in allowed_exact and not any(p.startswith(root) for root in allowed_roots) for p in written):
    raise SystemExit('out-of-scope working-tree write')
declared_writes = sorted(set(written) | {str(HERE.relative_to(ROOT) / name) for name in ['step-07-final-determinism.json', 'step-07-final-pair-accounting.json', 'owner-answers.md', 'progress.md']} | set(allowed_exact))
main_pin = git('rev-parse', 'main')
all_drift = git('diff', '--name-only', PIN + '...main').splitlines()
identity_drift = git('diff', '--name-only', PIN + '...main', '--', 'docs', 'AGENTS.md', 'CLAUDE.md', 'plans/260925-documentation-authority-unification/transitional-switchboard.json').splitlines()
exact_overlap = sorted(set(all_drift) & set(declared_writes))

commands = []
for label, argv in [
    ('diff-check', ['git', 'diff', '--check']),
    ('ratchet', ['env', '-u', 'CLAUDE_CODE_SESSION_ID', 'node', 'scripts/check-legacy-docs-ratchet.mjs']),
    ('doc-link-pass', ['env', '-u', 'CLAUDE_CODE_SESSION_ID', 'node', '--test', 'test/scripts/doc-link-pass.test.mjs']),
    ('evidence-before', ['env', '-u', 'CLAUDE_CODE_SESSION_ID', 'node', 'scripts/check-evidence-relocation.mjs', '--manifest', str(HERE.relative_to(ROOT) / 'step-06-evidence-relocation-manifest.json'), '--before', '--json']),
]:
    result = subprocess.run(argv, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    (SCRATCH / (label + '.log')).write_bytes(result.stdout)
    commands.append({'label': label, 'argv': argv, 'exit': result.returncode, 'outputSha256': sha(result.stdout), 'outputBytes': len(result.stdout), 'scratchLog': str(SCRATCH / (label + '.log'))})

# Existing parser fixes all byte/existence reads to the explicit committed tree;
# its read() rejects .fgos/.bee, and surface() excludes secrets and env files.
sys.argv = [str(HERE / 'step-02l-inventory.py'), '--input-commit', PIN]
inventory = module('step-02l-inventory')
fresh = inventory.build()
new_literals, new_dynamic = [], []
counts = {}
for klass, data in fresh.items():
    old = json.loads((HERE / f'step-02l-census-class{klass}.json').read_text())
    old_literals = {(r['consumerPath'], r['matchedExpression'], r['legacyTarget']) for r in old['entries']}
    old_dynamic = {(r['consumerPath'], site[4]) for r in old['dynamicConstructions'] for site in r['callSites']}
    for row in data['entries']:
        if (row['consumerPath'], row['matchedExpression'], row['legacyTarget']) not in old_literals:
            new_literals.append([klass, row['consumerPath'], row['physicalSpans'][0]['line'], sha(row['matchedExpression'].encode()), row['legacyTarget'], row['roleHint']])
    for row in data['dynamicConstructions']:
        for site in row['callSites']:
            if site[6] and (row['consumerPath'], site[4]) not in old_dynamic:
                new_dynamic.append([klass, row['consumerPath'], site[0], sha(site[4].encode()), site[5], site[7]])
    counts[str(klass)] = {'before': old['counts'], 'atPin': data['counts']}

# Repeat every literal spelling and dynamic seam in the committed lexer grammar.
# For maintained prose/instruction roots, reuse its exact units() parser too;
# immutable historical payloads/plans are deliberately not current-authority prose.
prose_counts = collections.Counter()
spelling_counts = collections.Counter()
for data in fresh.values():
    for row in data['entries']:
        spelling_counts[row['legacyTarget']] += 1
for rel, meta in sorted(inventory.p.TREE.items()):
    if meta['kind'] != 'blob' or not rel.endswith('.md') or rel.startswith(('plans/', 'archive/', 'docs/history/')):
        continue
    if set(rel.split('/')) & inventory.FORBIDDEN or re.search(r'(?:^|/)(?:secrets?[^/]*|[^/]*\.env)(?:$|\.)', rel, re.I):
        continue
    if '/verification/' in rel:
        continue
    if not (rel.startswith(('docs/', 'core/', 'domains/', '.agents/', '.claude/', 'plugins/')) or rel in {'AGENTS.md', 'CLAUDE.md', 'README.md'}):
        continue
    try:
        text = inventory.p.read(rel).decode()
    except UnicodeDecodeError:
        continue
    units, excluded = inventory.p.units(rel, text)
    prose_counts['filesScanned'] += 1
    for unit in units + excluded:
        for ref in unit['references']:
            if inventory.p.relevant(ref):
                prose_counts['legacyEdges'] += 1
                spelling_counts[ref] += 1

report = {
    'sourceCommit': PIN, 'mainRefAtCheck': main_pin, 'latestImportedMain': '9c7edde30',
    'mainDrift': {'tier1IdentityPaths': identity_drift, 'tier2ExactWriteSet': declared_writes, 'tier2Overlap': exact_overlap, 'fullMainDeltaCount': len(all_drift)},
    'protectedFiles': protected_proofs, 'commands': commands,
    'unrunRequiredChecks': [
        {'files': ['test/scripts/check-doc-candidate-status.test.mjs', 'test/scripts/check-doc-constitution.test.mjs'], 'reason': 'Complete files call Git init/add/commit in fixtures. Strict never-a-git-write boundary applies; no filtered run, checker weakening or green claim.', 'owner': 'Lead in separately authorized proof environment'},
        {'files': ['test/scripts/doc-rationale-reproduction.test.mjs', 'test/scripts/check-legacy-docs-ratchet.test.mjs', 'test/scripts/check-decision-citation-drift.test.mjs'], 'reason': 'Step 0 committed-byte acceptance is after the future runner accounting commit; final pair-accounting receipt separately records the author-time audits and scoped test exits.', 'owner': 'Lead after runner commit'},
    ],
    'censusRescan': {'method': 'Unchanged step-02l-inventory.py build() at the final Git pin plus the unchanged units() grammar over maintained prose/instructions; old census files remain frozen. Deltas are lexical inventory, not semantic unowned-consumer verdicts; current record coverage must be joined independently before cutover.', 'counts': counts, 'prose': dict(prose_counts), 'distinctLegacySpellings': len(spelling_counts), 'spellingCountsSha256': sha(json.dumps(sorted(spelling_counts.items()), ensure_ascii=False).encode()), 'newLiteralSchema': ['class', 'path', 'line', 'matchedExpressionSha256', 'legacyTarget', 'roleHint'], 'newLiteralSites': new_literals, 'newDocumentationDynamicSchema': ['class', 'path', 'line', 'expressionSha256', 'constructionKind', 'roleHint'], 'newDocumentationDynamicSites': new_dynamic, 'blocker': 'Final semantic join of every introduced literal and documentation-cued dynamic site to current per-file records; current-source rebinding/composition is not inferred from old census IDs.', 'owner': 'Documentation integration owner / independent census reviewer'},
    'postCutoverNotRun': ['literal SC1 repository-wide no-current-legacy-authority proof', 'evidence --after', 'full npm/cargo suites', 'integrated lock/ref lease proof', 'source/render generation and consumer/owning-test replay'],
}
(HERE / 'step-07-final-verification.json').write_text(json.dumps(report, ensure_ascii=False, separators=(',', ':'), sort_keys=True) + '\n')
print(json.dumps({'commands': [(r['label'], r['exit']) for r in commands], 'identityDrift': len(identity_drift), 'exactOverlap': len(exact_overlap), 'newLiteralSites': len(new_literals), 'newDocumentationDynamicSites': len(new_dynamic)}))
