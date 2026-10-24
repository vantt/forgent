#!/usr/bin/env python3
"""Publish bounded G9 dispositions and byte-bound source evidence.

This is a conservative author policy, NOT independent semantic acceptance:
exact passages retain only their recorded decision; changed preserve/reject
operations retain it only when their exact, explicitly non-document operand
survives in the current passage. Other changes are owned parks, not approvals.
Prepared edits use the current-byte recomposition proof, never a stale hunk.
"""
import argparse
import collections
import functools
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sp = importlib.util.spec_from_file_location('g9_sweep', HERE / 'sweep.py')
sweep = importlib.util.module_from_spec(sp)
sp.loader.exec_module(sweep)
OWNER = 'Documentation source-binding reviewer / Lead (G9)'


def dump(name, data):
    (HERE / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def fingerprint(value):
    return sweep.sha(json.dumps(value, sort_keys=True, ensure_ascii=False))


@functools.lru_cache(None)
def deletion(path, pin):
    cp = subprocess.run(['git', '--no-optional-locks', 'log', '-1', '--diff-filter=D',
                         '--format=%H %s', pin, '--', path], cwd=sweep.ROOT, capture_output=True)
    return {'command': ['git', 'log', '-1', '--diff-filter=D', '--format=%H %s', pin, '--', path],
            'exit': cp.returncode, 'stdout': cp.stdout.decode().strip()}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--pin', default='HEAD')
    args = ap.parse_args()
    pin = sweep.git('rev-parse', args.pin + '^{commit}').decode().strip()
    source, memberships = sweep.records_at(pin)
    originals, _ = sweep.scope()
    recomposed = {s['path']: s for s in sweep.load(HERE / 'recomposed.json')['specs']}
    evidence, judgments, contexts = {}, [], []
    tree = sweep.git('rev-parse', pin + '^{tree}').decode().strip()
    for row in source:
        rec = originals[row['id']]['record']
        items = {}
        for key in ['edges', 'references', 'dynamicTraces', 'authorAddedReferences']:
            for item in rec.get(key, []):
                ident = item.get('id') or item.get('referenceId') or item.get('edgeId')
                items[str(ident)] = item
        primary = [p for p in row['passages'] if p['path'] == row['path']]
        changed = [p for p in primary if p['classification'] in ('changed', 'absent')]
        missing = [p for p in changed if p['classification'] == 'absent']
        # A byte-equal primary passage cannot certify a changed dependency
        # that brought the row into the overlap/source-render cohort.
        dependency_changes = [p for p in row['passages']
                              if p['passageId'] in ('explicit-overlap-dependency', 'canonical-source-dependency')
                              and p['classification'] in ('changed', 'absent')]
        unresolved = list(dependency_changes)
        retained = []
        for p in changed:
            ident = str(p['passageId']).split('/caller')[0]
            item = items.get(ident, {})
            operand = p.get('operand')
            current = p.get('currentText')
            non_document = item.get('nonDocumentUse') or item.get('priorR19Rejection', {}).get('nonDocumentUse')
            role = item.get('role', '')
            # Existing source categories are reused. No changed fixture or
            # missing operation is declared accepted by a text-only comparison.
            if (p['classification'] == 'changed' and operand and current and operand in current and
                    non_document and item.get('disposition') == 'preserve' and
                    (item.get('admission') == 'REJECT' or role.startswith('non-document'))):
                retained.append({'passageId': p['passageId'], 'nonDocumentUse': non_document,
                                 'operand': operand, 'currentStartLine': p['startLine'],
                                 'currentEndLine': p['endLine'], 'currentSha256': p['currentSha256']})
            else:
                unresolved.append(p)
        prepared = bool(rec.get('diff'))
        spec = recomposed.get(row['path'])
        j = {k: row[k] for k in ['id', 'recordFile', 'recordLine', 'recordSha256', 'memberships',
                                 'path', 'classification', 'currentFileSha256']}
        j.update(evidenceSha256=sweep.evidence_digest(row['passages']), retainedNonDocumentOperands=retained)
        if dependency_changes:
            j['unresolvedDependencies'] = [{'path': p['currentPath'], 'passageId': p['passageId'],
                                            'currentSha256': p['currentSha256']}
                                           for p in dependency_changes]
        if not changed and not dependency_changes:
            j.update(disposition='still-valid-as-recorded',
                     reason='Every bound primary consumer passage is byte-equal at the current locator (including moved passages). Retain only its existing operand/retirement decision; protected co-cuts remain explicitly witnessed at current hashes. This does not assert whole-file parity, no new consumers, or final-pin acceptance.')
        elif not unresolved:
            j.update(disposition='still-valid-as-recorded',
                     reason='Changed surrounding context still contains every exact operative expression listed in retainedNonDocumentOperands. Each was already explicitly rejected as a non-document use; preserve that bounded classification, not a runtime-behaviour or fixture approval. Unchanged/moved primary passages retain their original decision.')
        elif prepared and spec and not missing and changed:
            j.update(disposition='needs-recomposition', patchSpecId=spec['id'],
                     patchRef='recomposed.json#' + spec['id'],
                     reason='The authored consumer patch must be rebound to this current whole-file preimage; the G9 body and its historical predecessor chain are prepared and fuzz=0 replayed forward/rollback byte-exact. Current non-document operands are retained only where separately listed; semantic/parity acceptance still belongs to independent review.')
            if dependency_changes:
                j['reason'] += (' Changed dependencies remain unresolved and must be reviewed with the prepared body: ' +
                                ', '.join(p['currentPath'] for p in dependency_changes) +
                                '. This is pending recomposition/review, not a still-valid judgment.')
        else:
            slots = list(dict.fromkeys(str(p['passageId']) for p in unresolved))
            locations = list(dict.fromkeys((p['startLine'], p['endLine']) for p in unresolved if p['startLine']))
            j.update(disposition='owned-park', owner=OWNER,
                     reason=('The bound source file/passage disappeared; the old decision is not transferable to a replacement mechanism.' if missing else
                             'The primary passage or prepared body does not establish independence from the changed explicit overlap/canonical source dependency. The legacy reading map, when present, remains an old-path park, never validity evidence.' if dependency_changes else
                             'Changed source/caller context is not justified by an exact surviving non-document operand or an authored current-byte consumer patch. Do not promote the old preserve/reject/park premise to acceptance.'),
                     unresolvedPassageIds=slots,
                     nextAction=('Resolve ' + row['recordFile'] + ':' + str(row['recordLine']) +
                                 ' against ' + row['path'] + ' at current ranges ' + str(locations) +
                                 '. Inspect slots ' + ', '.join(slots) +
                                 '; bind each remaining operand to its current operation/root and source owner, or explicitly retire it with the removal proof. Keep this row parked until that bounded source decision and, if needed, its exact successor patch are independently reviewed before F. Do not run the historical patch.'))
            if dependency_changes:
                j['nextAction'] += (' Review changed dependencies: ' + '; '.join(
                    p['currentPath'] + ':' + str(p['startLine']) + '-' + str(p['endLine']) +
                    ' (' + p['passageId'] + ')' for p in dependency_changes) +
                    '; prove each change irrelevant to the recorded decision or rebind/retire it explicitly.')
            if row['currentFileSha256'] is None:
                j['absenceEvidence'] = {'treeObjectId': tree,
                                        'pathListingSha256': sweep.sha(sweep.git('ls-tree', pin, '--', row['path'])),
                                        'lastDeletion': deletion(row['path'], pin)}
                # Known Identity rename is only a candidate until exact source
                # evidence exists at this pin; no path is invented or followed.
                if row['path'].startswith('packages/session-identity/'):
                    candidate = row['path'].replace('packages/session-identity/', 'packages/identity/', 1)
                    data = sweep.blob(pin, candidate)
                    if data is not None:
                        j['currentSuccessorCandidate'] = {'path': candidate, 'startLine': 1,
                                                          'endLine': len(data.splitlines()), 'sha256': sweep.sha(data),
                                                          'status': 'real current source; semantic binding not assumed'}
                        j['nextAction'] += ' Compare the actual Identity successor ' + candidate + ', without reviving the deleted Session Identity package.'
        witnesses = []
        for p in row['passages']:
            # Share repeated co-cut/duplicate-operation text once. Locators and
            # complete content digests stay on every record's evidence join.
            body = {k: v for k, v in p.items() if k not in ['passageId', 'recordedDisposition']}
            key = fingerprint(body)
            evidence[key] = body
            witnesses.append({'passageId': p['passageId'], 'path': p['path'], 'currentPath': p['currentPath'],
                              'classification': p['classification'], 'startLine': p['startLine'],
                              'endLine': p['endLine'], 'currentSha256': p['currentSha256'],
                              'currentFileSha256': p['currentFileSha256'], 'boundSha256': p['boundSha256'],
                              'evidenceRef': 'passages.json#' + key})
        j['evidence'] = witnesses
        judgments.append(j)
        contexts.append({k: v for k, v in row.items() if k != 'passages'} | {
            'evidenceRef': 'judgments.json#' + row['id'], 'evidenceSha256': j['evidenceSha256']})
    dump('passages.json', {'sourceCommit': pin, 'passages': evidence,
                          'largePassagePolicy': 'Text over 8000 characters is not duplicated; use bound/currentReadCommand plus exact line interval and full SHA-256. No digest is computed from a truncated excerpt.'})
    dump('source-context.json', {'sourceCommit': pin, 'memberships': memberships, 'records': contexts,
                                'classificationCounts': dict(collections.Counter(r['classification'] for r in source))})
    dump('judgments.json', {'sourceCommit': pin, 'independentAcceptance': False,
                            'scope': '574 physical records, 684 cohort memberships. These author dispositions include owned parks, not gate closure. Only current evidence validates this pin; source deltas reopen the matching row.',
                            'counts': dict(collections.Counter(r['disposition'] for r in judgments)), 'rows': judgments})
    dump('source-read-commands.json', sweep.COMMANDS)
    print(json.dumps({'records': len(judgments), 'distinctEvidenceBodies': len(evidence),
                      'counts': dict(collections.Counter(r['disposition'] for r in judgments))}, indent=2))


if __name__ == '__main__':
    main()
