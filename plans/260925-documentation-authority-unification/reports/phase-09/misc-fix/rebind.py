#!/usr/bin/env python3
"""Scoped overlays, using the existing frozen dual extractors and binding recipe.
Author once; --check replays current bytes and authenticated HEAD preimages.
"""
import sys
sys.dont_write_bytecode = True
import argparse, copy, json, pathlib, subprocess
P = pathlib.Path('plans/260925-documentation-authority-unification')
O = P/'reports/phase-09/misc-fix'
SHARD = P/'ledger/decisions/s17-misc-review-fixes.json'
sys.path.insert(0, str(P/'reports/phase-09/ledgerfix'))
from bindings import documents, rows, supersessions, effective, at, digest, payload, sha, KEYS, head
PATHS = ['docs/platform/packaging-distribution/spec.md', 'docs/reading-map.md']
SCRATCH = pathlib.Path('/tmp/fgos-work/w4-misc-fix-brief')
FIELDS = ['anchor','unitKind','title','textDigest','startLine','endLine','ancestry']


def extract(request):
    # Only scratch plumbing changes; both embedded extractors stay byte-frozen.
    source = (P/'reports/phase-09/g0fix/extract-units.mjs').read_text()
    adapter = source.replace('/tmp/fgos-work/w3-ledger-fix-brief/extractors', str(SCRATCH/'extractors'))
    SCRATCH.mkdir(parents=True, exist_ok=True)
    script = SCRATCH/'extract-units.mjs'; script.write_text(adapter)
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


def generate(pin):
    virtual=[dict(path='before-'+str(i)+'.md', content=subprocess.check_output(['git','show',pin+':'+f]).decode()) for i,f in enumerate(PATHS)]
    data=extract(dict(paths=PATHS,virtual=virtual)); cat=data['catalog']
    docs=documents(); docs.pop(str(SHARD),None); links=supersessions(docs)
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
                overlay['disposition']=dict(kind='adapted-or-retired-legacy-clause',reason='Restore reconcile-scan pane-id reporting clause; current enumeration is 141 checks (133 literal plus 8 loop-registered Git IDs) and 32 fixes, not the historical 143-check adjudication.')
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


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');args=ap.parse_args()
    pin=json.loads((O/'binding-refresh.json').read_text())['sourceHead'] if args.check else head()
    shard,record=generate(pin)
    if args.check:
        assert json.loads(SHARD.read_text())==shard
        assert json.loads((O/'binding-refresh.json').read_text())==record
        docs=documents();links=supersessions(docs)
        for c in record['changes']:
            old=at(docs[c['shard']],c['pointer'])
            f,ptr,r=effective(c['shard'],c['pointer'],old,docs,links)
            assert (f,ptr)==(str(SHARD),c['overlayPointer'])
            assert payload(r)==c['newBinding'] and r['bindingSha256']==digest(r)
            assert r['reviewStatus']=='pending'
    else:
        assert not SHARD.exists() and not (O/'binding-refresh.json').exists(), 'one-shot authoring; use --check'
        for f,value in [(SHARD,shard),(O/'binding-refresh.json',record)]:
            f.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:record[k] for k in ['sourceHead','effectiveBindingsChecked','changedRows','contentChangedRows']},sort_keys=True))


if __name__=='__main__': main()
