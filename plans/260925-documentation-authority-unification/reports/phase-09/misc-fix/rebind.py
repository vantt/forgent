#!/usr/bin/env python3
"""Scoped overlays, using the existing frozen dual extractors and binding recipe.
Author once; --check replays authoring bytes, then accounts for live rebindings.
"""
import sys
sys.dont_write_bytecode = True
import argparse, copy, json, pathlib, runpy, subprocess, tempfile
P = pathlib.Path('plans/260925-documentation-authority-unification')
O = P/'reports/phase-09/misc-fix'
SHARD = P/'ledger/decisions/s17-misc-review-fixes.json'
sys.path.insert(0, str(P/'reports/phase-09/ledgerfix'))
from bindings import documents, rows, supersessions, effective, at, digest, payload, sha, KEYS, head
PATHS = ['docs/platform/packaging-distribution/spec.md', 'docs/reading-map.md']
SCRATCH = pathlib.Path('/tmp/fgos-work')
FIELDS = ['anchor','unitKind','title','textDigest','startLine','endLine','ancestry']


def source(commit, path):
    return subprocess.check_output(['git', 'show', commit+':'+str(path)], text=True)


def author_commit():
    return subprocess.check_output(['git', 'log', '-1', '--format=%H', '--',
                                    str(O/'binding-refresh.json')], text=True).strip()


def pinned_request(request, commit):
    return dict(request, paths=[], virtual=request.get('virtual', []) +
                [dict(path=f, content=source(commit, f)) for f in request.get('paths', [])])


def extract(request, commit=None):
    if commit:
        request = pinned_request(request, commit)
    # Only scratch plumbing changes; both embedded extractors stay byte-frozen.
    adapter = (P/'reports/phase-09/g0fix/extract-units.mjs').read_text()
    SCRATCH.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='misc-extract-', dir=SCRATCH) as name:
        scratch = pathlib.Path(name)
        adapter = adapter.replace('/tmp/fgos-work/w3-ledger-fix-brief/extractors', str(scratch/'extractors'))
        script = scratch/'extract-units.mjs'; script.write_text(adapter)
        data = json.loads(subprocess.check_output(['node',str(script)], input=json.dumps(request).encode()))
    for entry in data['catalog'].values():
        for u in entry['units']:
            if u['unitKind']=='heading': u['ancestry'].append(u['title'])
    return data


def placement(us, u):
    i=us.index(u)
    w=lambda v:{k:v.get(k) for k in FIELDS} if v else None
    return dict(selected=w(u),previous=w(us[i-1]) if i else None,
                next=w(us[i+1]) if i+1<len(us) else None,content=u['text'])


def preimages(pin):
    # These records authenticated the original overlay inputs. Current direct
    # rows may be rebound; that must not rewrite the historical preimage proof.
    paths = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', pin, '--',
        str(P/'ledger/decisions'), str(P/'pilot/decisions')], text=True).splitlines()
    return {f: json.loads(subprocess.check_output(['git', 'show', pin+':'+f], text=True))
            for f in paths if pathlib.PurePosixPath(f).suffix == '.json'}


def generate(pin, commit=None):
    virtual=[dict(path='before-'+str(i)+'.md', content=subprocess.check_output(['git','show',pin+':'+f]).decode()) for i,f in enumerate(PATHS)]
    # Keep the extractor's one-request call contract for the owning rebind
    # preflight, which supplies that port itself. Pin docs via virtual bytes.
    request = dict(paths=PATHS, virtual=virtual)
    if commit:
        request = pinned_request(request, commit)
    data=extract(request); cat=data['catalog']
    docs=preimages(pin); docs.pop(str(SHARD),None); links=supersessions(docs)
    overlays=[]; changes=[]; checked=0
    for f,d in docs.items():
        for ptr,r in rows(d):
            if r.get('targetOwner') not in PATHS or not r.get('targetAnchor'): continue
            if effective(f,ptr,r,docs,links)[:2]!=(f,ptr): continue
            file=r['targetOwner']; before=cat['before-'+str(PATHS.index(file))+'.md']['units']; after=cat[file]['units']
            old=[u for u in before if u['anchor']==r['targetAnchor'] and u['textDigest']==r['targetUnitDigest']]
            assert len(old)==1, ('stale preimage',f,ptr)
            old=old[0]; assert old['ancestry']==r['targetAncestry']
            if 'bindingSha256' in r: assert r['bindingSha256']==digest(r)
            if r.get('placement'): assert r['placement']==placement(before,old)
            new=[u for u in after if u['anchor']==old['anchor'] and u['ancestry']==old['ancestry']]
            assert len(new)==1; new=new[0]; checked+=1
            updated={k:r.get(k) for k in KEYS}; updated['targetUnitDigest']=new['textDigest']
            loc=placement(after,new) if r.get('placement') else None
            if updated==payload(r) and (not loc or loc==r['placement']): continue
            # Existing immutable identities are reused, never minted or renamed.
            overlay={k:copy.deepcopy(r[k]) for k in ['claimId','sourcePath','sourceAnchor','sourceUnitDigest','sourceAncestry','sourceContent','unitKind','disposition'] if k in r}
            overlay.update(updated,bindingSha256=digest(updated),reviewStatus='pending',
                           supersedesBinding=dict(shard=f,pointer=ptr,targetAnchor=r['targetAnchor'],targetUnitDigest=r['targetUnitDigest'],bindingSha256=r.get('bindingSha256')),
                           rebindReason='Scoped truth/navigation correction; complete preimage and current unit/neighbour witnesses in reports/phase-09/misc-fix/binding-refresh.json. Independent review pending; no approval inherited.')
            if loc: overlay['placement']=loc
            if file==PATHS[0] and old['anchor']=='unheaded-block-90':
                overlay['disposition']=dict(kind='adapted-or-retired-legacy-clause',reason='Restore reconcile-scan pane-id reporting clause; current enumeration is 141 checks (136 literal plus 5 loop-registered Git ids) and 32 fixes, not the historical 143-check adjudication.')
            changes.append(dict(shard=f,pointer=ptr,overlayPointer='/bindingRefresh/'+str(len(overlays)),
                                oldBinding=payload(r),newBinding=updated,
                                before=placement(before,old),after=placement(after,new),contentChanged=old['textDigest']!=new['textDigest']))
            overlays.append(overlay)
    record=dict(sourceHead=pin,extractors=data['extractors'],effectiveBindingsChecked=checked,
                changedRows=len(changes),contentChangedRows=sum(c['contentChanged'] for c in changes),
                outputs=[dict(path=f,beforeSha256=sha(virtual[i]['content']),afterSha256=cat[f]['fileSha256']) for i,f in enumerate(PATHS)],
                changes=changes,independentReview='pending',noReadinessClaim=True,
                gateRegisterCustody='Final-pin Lead turn re-joins changedBindings; this writable list excludes the frozen gate register.')
    shard=dict(sourceHead=pin,bindingHashEncoding='Existing compact sorted UTF-8 JSON + LF four-key recipe; self-inclusive heading ancestry.',
               bindingRefresh=overlays,independentReview='pending',noAuthorityTransition=True)
    return shard,record


def later_preimages(commit):
    """Committed full-row transitions; snapshots and binding-only records cannot
    authorize edits to a misc row's identity, content or disposition.
    """
    reports = P/'reports/phase-09'
    paths = set(reports.rglob('binding-refresh.json'))
    paths.update(f for folder in reports.iterdir() if folder.is_dir() and
                 (folder.name.startswith('import') or folder.name == 'rebind')
                 for f in folder.rglob('*.json'))
    found = []
    # Reuse import3's hash-checked content-addressed witness expander.
    expand = runpy.run_path(str(reports/'import3/resync.py'))['expand_report']
    for path in sorted(paths):
        written = subprocess.check_output(['git', 'log', '-1', '--format=%H', '--',
                                           str(path)], text=True).strip()
        if not written or written == commit:
            continue
        if subprocess.run(['git', 'merge-base', '--is-ancestor', commit, written],
                          check=False).returncode:
            continue
        raw = json.loads(path.read_text())
        # Compact references are not changed prose.
        doc = expand(copy.deepcopy(raw))
        if doc.get('status') == 'blocked':
            continue
        for key in ('changes', 'rebindings', 'refresh', 'rows', 'records'):
            for row in doc.get(key, []):
                if not isinstance(row, dict) or row.get('applied') is False:
                    continue
                file, ptr = row.get('shard', row.get('file')), row.get('pointer')
                if file != str(SHARD):
                    continue
                old, new = row.get('before', {}), row.get('after', {})
                if not ptr or not all(k in old and k in new for k in KEYS):
                    continue
                assert raw == json.loads(source(written, path)), ('unaccounted misc-fix overlays: uncommitted record', str(path))
                found.append(dict(shard=file, pointer=ptr, before=old, after=new,
                                  record=str(path), commit=written))
    return found


def check_live(shard, commit, docs=None):
    docs = documents() if docs is None else docs
    assert {ptr for ptr, _ in rows(docs[str(SHARD)])} == {ptr for ptr, _ in rows(shard)}, 'unaccounted misc-fix overlay row set'
    links = supersessions(docs)
    recorded = later_preimages(commit)
    # Current recipe on AUTHORING docs preserves the intentional 136/5 prose
    # correction without treating today's doc edits as a new authoring baseline.
    pin = json.loads(source(commit, O/'binding-refresh.json'))['sourceHead']
    corrected, _ = generate(pin, commit)
    evidence = []
    for ptr, row in rows(shard):
        file = str(SHARD)
        expected = copy.deepcopy(row)
        if 'disposition' in at(corrected, ptr):
            expected['disposition'] = copy.deepcopy(at(corrected, ptr)['disposition'])
        used = []
        transitions = [r for r in recorded if (r['shard'], r['pointer']) == (file, ptr)]
        while True:
            matches = [r for r in transitions if r['before'] == expected]
            assert len(matches) <= 1, ('ambiguous misc-fix rebind', ptr)
            if not matches:
                break
            change = matches[0]
            assert change['after'] != expected, ('unchanged snapshot is not a rebind', ptr)
            expected = copy.deepcopy(change['after'])
            transitions.remove(change)
            used.append(dict(record=change['record'], commit=change['commit']))
        live = at(docs[file], ptr)
        ef, ep, current = effective(file, ptr, live, docs, links)
        assert (ef, ep) == (file, ptr), ('unaccounted misc-fix overlays', ptr, ef, ep)
        assert current.get('bindingSha256') == digest(current), ('misc-fix live binding hash', ptr)
        # No committed exact-claim/binding approval exists for these pending
        # overlays. A rebind is not a review and cannot carry approval forward.
        assert current.get('reviewStatus') == 'pending', ('misc-fix live review requires committed exact-claim/binding approval', ptr)
        assert current == expected, ('unaccounted misc-fix overlays: live row differs', ptr,
                                     sorted(k for k in current.keys() | expected.keys()
                                            if (k in current) != (k in expected) or current.get(k) != expected.get(k)))
        evidence.append(dict(pointer=ptr, laterRebinds=used, reviewStatus='pending'))
    return evidence


def check(pin, docs=None):
    commit = author_commit()
    # Replay the recipe as authored too: later disposition prose corrections
    # must not rewrite the original proof. Only its input/scratch plumbing changes.
    recipe = {'__name__': 'misc_authoring_replay'}
    exec(compile(source(commit, O/'rebind.py'), str(O/'rebind.py')+'@'+commit, 'exec'), recipe)
    recipe['documents'] = lambda: preimages(pin)
    recipe['preimages'] = preimages
    recipe['extract'] = lambda request: extract(pinned_request(request, commit))
    shard,record=recipe['generate'](pin)
    assert json.loads(source(commit, SHARD))==shard
    assert json.loads(source(commit, O/'binding-refresh.json'))==record
    authored=preimages(commit)
    links=supersessions(authored);before=preimages(pin)
    for c in record['changes']:
        old=at(before[c['shard']],c['pointer'])
        f,ptr,r=effective(c['shard'],c['pointer'],old,authored,links)
        assert (f,ptr)==(str(SHARD),c['overlayPointer'])
        assert payload(r)==c['newBinding'] and r['bindingSha256']==digest(r)
        assert r['reviewStatus']=='pending'
    check_live(shard, commit, docs)
    return record


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');args=ap.parse_args()
    pin=json.loads(source(author_commit(), O/'binding-refresh.json'))['sourceHead'] if args.check else head()
    if args.check:
        record=check(pin)
    else:
        assert not SHARD.exists() and not (O/'binding-refresh.json').exists(), 'one-shot authoring; use --check'
        shard,record=generate(pin)
        for f,value in [(SHARD,shard),(O/'binding-refresh.json',record)]:
            f.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:record[k] for k in ['sourceHead','effectiveBindingsChecked','changedRows','contentChangedRows']},sort_keys=True))


if __name__=='__main__': main()
