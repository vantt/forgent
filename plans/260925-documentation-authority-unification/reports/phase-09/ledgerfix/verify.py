"""Read-only final-recipe replay against HEAD + its current working tree.
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/ledgerfix/verify.py
Historical Git reads authenticate preimages only, never substitute for current targets.
"""
import copy
import difflib
import json
import subprocess
from bindings import *


def check_current(row, cat):
    assert all(k in row for k in KEYS), 'missing hash inputs'
    if row.get('successorGroup') and row.get('targetAnchor') is None:
        group = row['successorGroup']
        assert group['memberCount'] == len(group['members'])
        assert row['successorGroupMemberDigests'] == sorted(m['unitDigest'] for m in group['members'])
        for member in group['members']:
            b = {'targetOwner': member['path'], 'targetAnchor': member['anchor'],
                 'targetUnitDigest': member['unitDigest']}
            u = unit_for(b, cat)
            assert u['ancestry'] == member['ancestry'] and u['text'] == member['text']
        return None
    unit = unit_for(row, cat)
    # There is deliberately no parents-only fallback.
    assert row['targetAncestry'] == unit['ancestry'], 'self-inclusive ancestry required'
    if row.get('placement'):
        us = cat[row['targetOwner']]['units']; i = us.index(unit)
        fields = ['anchor', 'unitKind', 'title', 'textDigest', 'startLine', 'endLine', 'ancestry']
        witness = lambda u: {k: u.get(k) for k in fields}
        p = row['placement']
        assert p['selected'] == witness(unit), 'selected placement differs'
        assert p['previous'] == (witness(us[i-1]) if i else None), 'previous neighbour differs'
        assert p['next'] == (witness(us[i+1]) if i+1 < len(us) else None), 'next neighbour differs'
        assert p['content'] == unit['text'], 'full placement content differs'
    return unit


def check_residual(e, row, cat):
    assert e['primaryTarget'] == {k: row.get(k) for k in KEYS}, 'stale residual target'
    unit = unit_for(row, cat)
    us = cat[row['targetOwner']]['units']; i = us.index(unit)
    expected = {'path': row['targetOwner'], 'fileSha256': cat[row['targetOwner']]['fileSha256'],
                'selected': unit, 'previous': us[i-1] if i else None, 'next': us[i+1] if i+1 < len(us) else None}
    assert e['placement'] == expected, 'full residual placement differs'
    sl, tl = e['sourceWitness']['text'].splitlines(), unit['text'].splitlines()
    opcodes = [list(x) for x in difflib.SequenceMatcher(None, sl, tl, autojunk=False).get_opcodes()]
    changed = [{'sourceLineInUnit': j+1, 'text': sl[j]} for tag,a,b,c,d in opcodes
               if tag in ['delete','replace'] for j in range(a,b) if sl[j].strip()]
    assert e['opcodes'] == opcodes
    assert e['changedSourceLines'] == changed, 'omitted source line'
    assert e['residualText'] == '\n'.join(x['text'] for x in changed)
    assert e['residualSha256'] == sha(e['residualText'])
    assert not e['A34Accepted'] and e['reviewStatus'] == 'pending'
    assert e['outOfScopeProposalOnly'] is False


def main():
    evaluated_head = head()
    docs = documents(); links = supersessions(docs)
    actual = {(f,p): r for f,d in docs.items() for p,r in rows(d)}
    migration = load(R / 'recipe-migration.json')
    records = {(r['file'],r['pointer']): r for r in migration['rows']}
    assert records.keys() == actual.keys(), 'migration omits or invents a ledger row'
    gate = load(GATE)
    assert gate['bindingHashEncoding'] == migration['bindingHashEncoding']
    assert gate['bindingHashEncoding']['headingAncestry'].startswith('Self-inclusive:')
    paths = {r['targetOwner'] for r in actual.values() if 'bindingSha256' in r}
    paths.update(m['path'] for r in actual.values() for m in r.get('successorGroup', {}).get('members', []))
    residual_path = P / 'reports/phase-09/g0fix/partial-carry-residuals.json'
    residuals = load(residual_path)['rows']
    virtual = []
    for i,e in enumerate(residuals):
        w = e['sourceWitness']
        virtual.append({'path': 'residual-source-' + str(i) + '.md',
                        'content': subprocess.check_output(['git','show',w['commit'] + ':' + w['path']]).decode()})
    historical_sources = load(P / 'reports/phase-09/g0fix/source-proof.json')['rows']
    for i,e in enumerate(historical_sources):
        virtual.append({'path': 'historical-source-'+str(i)+'.md',
                        'content': subprocess.check_output(['git','show',e['commit']+':'+e['path']]).decode()})
    request = {'paths': sorted(paths), 'virtual': virtual, 'bindingRows': [r for r in actual.values()]}
    extracted = json.loads(subprocess.check_output(['node', str(P / 'reports/phase-09/g0fix/extract-units.mjs')], input=json.dumps(request).encode()))
    assert extracted['extractors'] == load(P / 'reports/phase-09/g0fix/extractor-proof.json')['extractors']
    assert extracted['bindingDigests'] == [digest(r) for r in actual.values()], 'independent Node/Python recipes disagree'
    cat = extracted['catalog']
    for i,e in enumerate(historical_sources):
        c = cat['historical-source-'+str(i)+'.md']; assert c['fileSha256']==e['fileSha256']
        us=c['units']; matches=[u for u in us if u==e['selected']]; assert len(matches)==1
        at_unit=us.index(matches[0])
        assert e['previous']==(us[at_unit-1] if at_unit else None)
        assert e['next']==(us[at_unit+1] if at_unit+1<len(us) else None)
    for entry in cat.values():
        for u in entry['units']:
            if u['unitKind'] == 'heading':
                u['ancestry'] += [u['title']]
    stored = current = historical = group_rows = placements = 0
    for key,row in actual.items():
        m = records[key]
        assert payload(row) == m['input'] and digest(row) == m['newBindingSha256']
        assert ('bindingSha256' in row) == m['hashStored']
        if 'bindingSha256' not in row:
            continue  # Recomputed above; this legacy row never asserted a stored binding hash.
        assert row['bindingSha256'] == digest(row), ('hash mismatch', key)
        stored += 1
        ef,ep,er = effective(*key,row,docs,links)
        if (ef,ep) != key:
            historical += 1
            continue  # Explicit overlay, never an old-pin fallback for a live row.
        check_current(row, cat)
        current += 1
        group_rows += bool(row.get('successorGroup'))
        placements += bool(row.get('placement'))
    # Exact old-to-new provenance and immutable source identities/snapshots.
    source_pin = migration['sourceHead']
    before = {}
    for file,pointer in actual:
        if file not in before:
            before[file] = json.loads(subprocess.check_output(['git','show',source_pin + ':' + file]))
        old = at(before[file],pointer); row = actual[(file,pointer)]; m = records[(file,pointer)]
        old_input = {k: old.get(k) for k in KEYS}
        old_digest = sha(json.dumps(old_input,sort_keys=True,ensure_ascii=False,separators=(',',':'))+'\n')
        assert m['oldInput'] == old_input
        assert m['oldBindingSha256'] == old.get('bindingSha256',old_digest)
        if 'bindingSha256' in old:
            if file.endswith('/s12-late-areas.json') and pointer.startswith('/nativeIdentityGaps/'):
                assert 'targetUnitDigest' not in old and 'targetAncestry' not in old
                ref = row['bindingInputSource']; predecessor = at(before[file], ref['pointer'])
                assert identity(file,ref['pointer'],predecessor) == (file,ref['pointer'],ref['predecessorAnchor'],ref['predecessorDigest'])
                assert all(predecessor.get(k) == old.get(k) for k in ['sourcePath','sourceAnchor','sourceUnitDigest'])
                old_full_input = {k: predecessor.get(k) for k in KEYS}
                assert old['bindingSha256'] == sha(json.dumps(old_full_input,sort_keys=True,ensure_ascii=False,separators=(',',':'))+'\n')
                ef,ep,er = effective(file,ref['pointer'],predecessor,docs,links)
                assert (ef,ep) == (ref['resolvedFile'],ref['resolvedPointer'])
                assert payload(row) == payload(er), 'native gap must resolve by content identity, not ordinal'
            else:
                assert old['bindingSha256'] == old_digest, 'author preimage recipe differs'
        for k in ['claimId','sourcePath','sourceAnchor','sourceUnitDigest','sourceAncestry','sourceContent']:
            assert old.get(k) == row.get(k), ('source identity changed', file,pointer,k)
        for k in SNAPSHOTS:
            assert old.get(k) == row.get(k), ('historical snapshot rewritten',file,pointer,k)
        assert m['rowChanged'] == (old != row)
        if old != row:
            assert row['reviewStatus'] == 'pending'
            assert not any(k in row for k in ['reviewedBy','reviewedAt','reviewBindingSha256','reviewVerdict'])
    gate_keys = set()
    for e in gate['changedBindings']:
        key = (e['file'], '/' + '/'.join(e['keys'])); assert key not in gate_keys; gate_keys.add(key)
        row = actual[key]
        assert e['id'] == row['claimId']
        assert identity(*key,e) == identity(*key,row), 'gate joins shard/index/anchor/digest'
        assert payload(e) == payload(row) and e['bindingSha256'] == digest(row)
        assert e['reviewStatus'] == 'pending'
        check_current(row,cat)
    assert len(gate_keys) == 257
    old_gate = json.loads(subprocess.check_output(['git','show',source_pin + ':' + str(GATE)]))
    assert {k:v for k,v in gate.items() if k not in ['changedBindings','bindingHashEncoding']} == {k:v for k,v in old_gate.items() if k not in ['changedBindings','bindingHashEncoding']}
    raw = GATE.read_text(); compact = lambda v: json.dumps(v,ensure_ascii=False,separators=(',',':'))
    for field in ['changedBindings','bindingHashEncoding']:
        needle = '"'+field+'":'+compact(gate[field]); assert raw.count(needle) == 1
        raw = raw.replace(needle,'"'+field+'":'+compact(old_gate[field]),1)
    assert raw.encode() == subprocess.check_output(['git','show',source_pin + ':' + str(GATE)]), 'unapproved gate bytes changed'
    residual_sha = sha(residual_path.read_bytes())
    for i,e in enumerate(residuals):
        key = (e['file'], '/' + '/'.join(e['keys'])); row = actual[key]
        source_units = cat['residual-source-'+str(i)+'.md']['units']
        source = [u for u in source_units if u['anchor']==e['sourceWitness'].get('anchor', e['sourceWitness']['unit']['anchor']) and u['textDigest']==e['sourceUnitDigest']]
        assert len(source)==1 and source[0]['text']==e['sourceWitness']['text'], 'historical source not authenticated'
        check_residual(e,row,cat)
        ref = row['residualRef']; assert ref['row'] == i and ref['fileSha256'] == residual_sha
        assert ref['residualSha256']==e['residualSha256'] and ref['targetUnitDigest']==row['targetUnitDigest']
        assert residual_sha in row['remainder'] and row['targetUnitDigest'] in row['remainder']
    sweep = load(P / 'reports/phase-09/g0fix/partial-carry-sweep.json')['rows']
    assert len(sweep)==27
    residual_keys={(e['file'],'/'+'/'.join(e['keys'])) for e in residuals}
    for e in sweep:
        pointer='/'+'/'.join(e['keys']); row=actual[(e['file'],pointer)]
        baseline=json.loads(subprocess.check_output(['git','show',e['step0Commit']+':'+e['file']]))
        assert payload(at(baseline,pointer))==e['step0Binding']
        if 'existingRemainder' in e:
            assert payload(row)==e['step0Binding'] and row['remainder']==e['existingRemainder']
        else:
            assert (e['file'],pointer) in residual_keys
    # Owning negative probes replace the old parents-or-self and author-pin checks.
    negative = []
    def rejects(label, fn):
        try: fn()
        except AssertionError: negative.append(label)
        else: raise AssertionError('negative probe accepted: '+label)
    def assert_same(a,b): assert a==b
    first=next(iter(actual.values()))
    rejects('legacy spaced JSON without LF recipe',lambda:assert_same(sha(json.dumps(payload(first),sort_keys=True,ensure_ascii=False)),digest(first)))
    parent = copy.deepcopy(next(r for r in actual.values() if r.get('claimId')=='claim_4ff3a12817bb891341b26283460beea0'))
    parent['targetAncestry'].pop(); parent['bindingSha256']=digest(parent)
    rejects('parents-only heading ancestry even with a recomputed hash',lambda:check_current(parent,cat))
    sample = copy.deepcopy(next(r for r in actual.values() if r.get('successorGroup')))
    old_hash = digest(sample); sample['successorGroup']['members'][0]['unitDigest']='0'*64
    rejects('changed group member digest changes binding hash',lambda:assert_same(digest(sample),old_hash))
    rejects('changed group member content is rejected',lambda:check_current(sample,cat))
    sample = copy.deepcopy(next(r for r in actual.values() if r.get('successorGroup')))
    sample['successorGroup']['members'].pop()
    rejects('removed duplicate group member changes hash',lambda:assert_same(digest(sample),old_hash))
    stale=copy.deepcopy(next(r for r in actual.values() if r.get('placement'))); stale['targetUnitDigest']='0'*64
    rejects('stale live digest',lambda:check_current(stale,cat))
    neighbour=copy.deepcopy(next(r for r in actual.values() if r.get('placement') and r['placement']['next']))
    neighbour['placement']['next']=None
    rejects('wrong immediate neighbour',lambda:check_current(neighbour,cat))
    bad=copy.deepcopy(residuals[0]);bad['changedSourceLines'].pop()
    row=actual[(bad['file'],'/'+'/'.join(bad['keys']))]
    rejects('omitted residual source line',lambda:check_residual(bad,row,cat))
    bad=copy.deepcopy(residuals[14]);bad['primaryTarget']['targetUnitDigest']='0'*64
    row=actual[(bad['file'],'/'+'/'.join(bad['keys']))]
    rejects('stale pilot residual target',lambda:check_residual(bad,row,cat))
    altered=copy.deepcopy(docs)
    for d in altered.values():
        for _,r in rows(d):
            if r.get('supersedesBinding'):r['supersedesBinding']['bindingSha256']='recipe-change-does-not-break-identity'
    assert supersessions(altered)==links
    assert head()==evaluated_head, 'HEAD moved during replay'
    print(json.dumps({'status':'pass','evaluatedHead':evaluated_head,
                      'evaluation':'current working-tree bytes at HEAD, not authoring pin targets',
                      'ledgerRowsRecomputed':len(actual),'storedBindingHashesVerified':stored,
                      'currentStoredBindingsVerified':current,'historicalBindingsResolvedByExplicitOverlay':historical,
                      'changedBindingsVerified':len(gate_keys),'groupRowsContentBound':group_rows,
                      'fullPlacementWitnessesVerified':placements,'nativeIdentityGapInputsVerified':9,
                      'residualsVerified':len(residuals),'partialCarriesSwept':len(sweep),
                      'authenticatedHistoricalSources':len(historical_sources),'dualExtractorAgreement':True,
                      'independentNodePythonHashes':True,'hashMismatches':0,'currentTargetMismatches':0,
                      'negativeProbesRejected':negative,'hashIndependentOverlayJoin':True,
                      'independentReview':'pending; no gate acceptance'},ensure_ascii=False,indent=2))


if __name__=='__main__':
    main()
