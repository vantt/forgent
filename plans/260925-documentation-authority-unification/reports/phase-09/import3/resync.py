"""Render complete generated ledger shards from authenticated input bytes.
--write applies; --check validates the saved outputs without rewriting them.
Reuses import3 dual frozen extractors, ledgerfix's hash recipe and rebind.locate.
No product code, native addon, fgOS CLI or Git write.
"""
import argparse
import collections
import copy
import difflib
import json
from pathlib import Path
import runpy
import subprocess
import sys
import tempfile
sys.dont_write_bytecode = True
P = Path('plans/260925-documentation-authority-unification')
O = P/'reports/phase-09/import3'
S = Path('/tmp/fgos-work')
sys.path.insert(0, str(P/'reports/phase-09/ledgerfix'))
from bindings import documents, rows, supersessions, effective, at, payload, digest, sha, KEYS
locate = runpy.run_path(str(P/'reports/phase-09/rebind/rebind.py'))['locate']
PATHS = ['docs/reading-map.md', 'docs/platform/agent-confinement/spec.md',
 'docs/platform/agent-confinement/history/rollout-and-settled-facts.md',
 'docs/platform/agent-confinement/decisions/confinement-authority-decisions.md',
 'docs/platform/seat-binding/spec.md']
SOURCE = [r['sourcePath'] for r in json.loads((O/'source-triage.json').read_text())['records']]
SHARD = str(P/'ledger/decisions/s18-import3-resync.json')

def git(*args):
    return subprocess.check_output(['git', *args], stderr=subprocess.PIPE).decode()

def dump(path, data):
    Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')

def extract(pin):
    request = dict(paths=PATHS+SOURCE, virtual=[dict(path='before-'+str(i)+'.md',
        content=git('show',pin+':'+p)) for i,p in enumerate(PATHS)])
    return json.loads(subprocess.check_output(['node',str(O/'extract-units.mjs')],input=json.dumps(request).encode()))

def witness(units, unit):
    i=units.index(unit)
    return dict(selected=unit,previous=units[i-1] if i else None,next=units[i+1] if i+1<len(units) else None)

def placement(units, unit):
    fields=['anchor','unitKind','title','textDigest','startLine','endLine','ancestry']
    w=lambda u:{k:u.get(k) for k in fields} if u else None
    i=units.index(unit)
    return dict(selected=w(unit),previous=w(units[i-1]) if i else None,next=w(units[i+1]) if i+1<len(units) else None,content=unit['text'])

def target(owner,u):
    return dict(targetOwner=owner,targetAnchor=u['anchor'],targetUnitDigest=u['textDigest'],targetAncestry=u['ancestry'])

def expand_report(report):
    pool=report.pop('textCatalog',{})
    for key,text in pool.items():assert sha(text)==key,'corrupt text witness'
    def expand(v):
        if isinstance(v,dict):
            if set(v)=={'textRefSha256'}:return pool[v['textRefSha256']]
            return {k:expand(x) for k,x in v.items()}
        if isinstance(v,list):return [expand(x) for x in v]
        return v
    return expand(report)

def compact_report(report):
    pool={}
    def compact(v):
        if isinstance(v,str) and len(v)>250:
            key=sha(v);pool[key]=v;return dict(textRefSha256=key)
        if isinstance(v,dict):return {k:compact(x) for k,x in v.items()}
        if isinstance(v,list):return [compact(x) for x in v]
        return v
    result=compact(report);result['textCatalog']=pool;return result

def check():
    report=expand_report(json.loads((O/'binding-refresh.json').read_text()));data=extract(report['sourceHEAD']);cat=data['catalog']
    assert report['extractors']==data['extractors']
    docs=documents();links=supersessions(docs);n=0
    for f,d in docs.items():
        if d.get('appliedToDocs') is False:continue
        for ptr,row in rows(d):
            if row.get('targetOwner') not in PATHS or not row.get('targetAnchor'):continue
            if effective(f,ptr,row,docs,links)[:2]!=(f,ptr):continue
            units=cat[row['targetOwner']]['units']
            matches=[u for u in units if u['anchor']==row['targetAnchor'] and u['textDigest']==row['targetUnitDigest']]
            assert len(matches)==1,(f,ptr,payload(row))
            assert row['targetAncestry']==matches[0]['ancestry']
            if 'bindingSha256' in row:assert row['bindingSha256']==digest(row),(f,ptr,'hash')
            if 'placement' in row:assert row['placement']==placement(units,matches[0]),(f,ptr,'placement')
            n+=1
    shard=docs[SHARD]
    assert len(shard['sourceBindings'])==24
    for row in shard['sourceBindings']:
        u=next(u for u in cat[row['sourcePath']]['units'] if u['anchor']==row['sourceAnchor'] and u['textDigest']==row['sourceUnitDigest'])
        assert u['text']==row['sourceContent']
        assert row['bindingSha256']==digest(row)
    for group in ('changes','directOriginMaterializations'):
        for change in report[group]:
            assert at(docs[change['shard']],change['pointer'])==change['after']
    for change in report['overlayPredecessorIdentityRefreshes']:
        assert at(docs[change['shard']],change['pointer'])==change['after']
    for output in report['outputs']:assert sha(Path(output['path']).read_bytes())==output['afterSha256']
    before=git('show',report['sourceHEAD']+':docs/reading-map.md');after=Path(PATHS[0]).read_text()
    assert before.split('## 3. Transitional Note',1)[1].split('## 4. Related Files',1)[0]==after.split('## 3. Transitional Note',1)[1].split('## 4. Related Files',1)[0]
    assert before.count('fgos-coding-knowledge')==after.count('fgos-coding-knowledge')
    assert all(a==b or (a.startswith('- `docs/specs/confinement-authority.md`') or a.startswith('- `docs/platform/config/spec.md`')) for a,b in zip(before.splitlines(),after.splitlines()))
    assert len(before.splitlines())==len(after.splitlines())
    print(json.dumps(dict(status='pass',effectiveBindings=n,sourceBindings=24,refreshedRows=len(report['changes']),shards=len(report['outputs']),independentReview='pending')))

def author(write):
    pin=git('rev-parse','HEAD').strip();data=extract(pin);cat=data['catalog'];docs=documents()
    # Always regenerate from the recorded repository input, not our own prior output.
    docs={f:json.loads(git('show',pin+':'+f)) for f in docs if f!=SHARD}
    links=supersessions(docs)
    proposed=copy.deepcopy(docs);changes=[];historical=[];preimages=[]
    for f,d in docs.items():
        if d.get('appliedToDocs') is False:continue
        for ptr,row in rows(d):
            if row.get('targetOwner') not in PATHS or not row.get('targetAnchor'):continue
            if effective(f,ptr,row,docs,links)[:2]!=(f,ptr):
                historical.append(dict(shard=f,pointer=ptr));continue
            owner=row['targetOwner'];oldus=cat['before-'+str(PATHS.index(owner))+'.md']['units'];newus=cat[owner]['units']
            old=[u for u in oldus if u['anchor']==row['targetAnchor'] and u['textDigest']==row['targetUnitDigest']]
            assert len(old)==1,(f,ptr,'preimage')
            assert row['targetAncestry']==old[0]['ancestry'],(f,ptr,'preimage ancestry')
            if 'bindingSha256' in row:assert row['bindingSha256']==digest(row),(f,ptr,'preimage hash')
            new,method=locate(oldus,old[0],newus,row.get('sourceUnitDigest'))
            updated=target(owner,new);out=at(proposed[f],ptr);before=copy.deepcopy(out)
            out.update(updated)
            if 'bindingSha256' in row:out['bindingSha256']=digest(out)
            if 'placement' in row:out['placement']=placement(newus,new)
            preimages.append(dict(shard=f,pointer=ptr,before=payload(row),preimage=witness(oldus,old[0])))
            if before!=out:
                out['reviewStatus']='pending'
                out['reviewNote']='W11 import3: current-byte rebind; independent review required, no prior approval carried.'
                for k in list(out):
                    if k.startswith('review') and k not in ('reviewStatus','reviewNote'):del out[k]
                changes.append(dict(shard=f,pointer=ptr,before=before,after=copy.deepcopy(out),method=method,
                    preimage=witness(oldus,old[0]),current=witness(newus,new)))
    # The frozen ownership checker reads direct claims, not only terminal overlays.
    # Materialize only stale direct origins from their authenticated terminal rows,
    # and refresh the overlay's explicit predecessor identity so the chain survives.
    materialized=[];predecessorRefresh=[]
    for f,d in docs.items():
        for ptr,row in rows(d):
            if ptr.split('/')[1] not in ('claims','registryGaps'):continue
            if row.get('targetOwner') not in PATHS or not row.get('targetAnchor'):continue
            ef,ep,terminal=effective(f,ptr,row,docs,links)
            if (ef,ep)==(f,ptr):continue
            if any(u['anchor']==row['targetAnchor'] and u['textDigest']==row['targetUnitDigest'] for u in cat[row['targetOwner']]['units']):continue
            assert 'supersedesBinding' not in row
            current=at(proposed[ef],ep);out=at(proposed[f],ptr);before=copy.deepcopy(out)
            out.update(payload(current),bindingSha256=digest(current),reviewStatus='pending',
                reviewNote='W11 import3: materialized the existing terminal overlay for the frozen direct-claim ownership reader; original row and overlay identity preserved in binding-refresh.json.')
            for k in list(out):
                if k.startswith('review') and k not in ('reviewStatus','reviewNote'):del out[k]
            materialized.append(dict(shard=f,pointer=ptr,before=before,after=copy.deepcopy(out),terminal=dict(shard=ef,pointer=ep)))
            for sf,sd in proposed.items():
                for sp,sr in rows(sd):
                    old=sr.get('supersedesBinding')
                    if not old or old.get('shard')!=f:continue
                    op=old.get('pointer') or '/'+old['collection']+'/'+str(old['index'])
                    if op!=ptr or old.get('targetUnitDigest')!=row['targetUnitDigest'] or old.get('targetAnchor')!=row['targetAnchor']:continue
                    snapshot=copy.deepcopy(old)
                    old.update(payload(current),bindingSha256=digest(current))
                    predecessorRefresh.append(dict(shard=sf,pointer=sp+'/supersedesBinding',before=snapshot,after=copy.deepcopy(old)))
    # Existing chains must still select exactly the same terminal row locations.
    newlinks=supersessions(proposed)
    for entry in materialized:
        f,ptr=entry['shard'],entry['pointer'];expected=entry['terminal']
        assert effective(f,ptr,at(proposed[f],ptr),proposed,newlinks)[:2]==(expected['shard'],expected['pointer'])
    triage=json.loads((O/'source-triage.json').read_text());bindings=[]
    for record in triage['records']:
        source=record['sourcePath']
        for missing in record['missingCarriage']:
            unit=next(u for u in cat[source]['units'] if u['anchor']==missing['sourceAnchor'] and u['textDigest']==missing['sourceUnitDigest'])
            exact=[(p,u) for p in PATHS for u in cat[p]['units'] if u['textDigest']==unit['textDigest']]
            if exact:
                assert len(exact)==1,(source,unit['anchor'],'multiple holders');owner,u=exact[0];reason='Complete source unit carried verbatim into the existing holder.'
            else:owner=''
            if not exact:
                if source.endswith('confinement-authority.md'):
                    history=unit['anchor'].startswith('13-') or unit['anchor']=='unheaded-block-141'
                    owner=PATHS[2] if history else PATHS[1]
                    if unit['unitKind']=='heading':
                        matches=[v for v in cat[owner]['units'] if v['unitKind']=='heading' and v['title']==unit['title']]
                    else:
                        starts='1. **`herdr-spawn` convergence:**' if history else '> **Trạng thái:** IMPLEMENTED.'
                        matches=[v for v in cat[owner]['units'] if v['text'].startswith(starts)]
                    reason='Retain the existing truth corrections: live migration/invocation names and CTR011 instead of reviving stale source assertions; carry the new probe/private-root clauses.'
                elif source.endswith('reading-map.md'):
                    owner=PATHS[0]
                    matches=[v for v in cat[owner]['units'] if v['title']=='5. Detailed Product And Source Map'] if unit['unitKind']=='heading' else [v for v in cat[owner]['units'] if v['text'].startswith('- `docs/platform-foundations.md`')]
                    reason='Single detailed-map holder; retain L11-25 banner, knowledge routes and labelled truth/link corrections. Only the two imported entries change.'
                else:
                    owner=PATHS[4]
                    matches=[v for v in cat[owner]['units'] if v['unitKind']=='heading' and v['title']==unit['title']] if unit['unitKind']=='heading' else [v for v in cat[owner]['units'] if v['text'].startswith('- **Trạng thái:** **Implemented (owner duyệt')]
                    reason='Full imported decision retained; only existing source-relative links rebased to candidate holders.'
                assert len(matches)==1,(source,unit['anchor'],len(matches));u=matches[0]
            row=dict(sourcePath=source,sourceAnchor=unit['anchor'],sourceUnitDigest=unit['textDigest'],sourceAncestry=unit['ancestry'],sourceContent=unit['text'],sourceLocation=dict(startLine=unit['startLine'],endLine=unit['endLine']),**target(owner,u))
            row.update(bindingSha256=digest(row),placement=placement(cat[owner]['units'],u),disposition=dict(kind='exact-unit-digest' if exact else 'explicit-adapted-binding',reason=reason),reviewStatus='pending')
            if not exact:
                sl=unit['text'].splitlines();tl=u['text'].splitlines();ops=[list(v) for v in difflib.SequenceMatcher(None,sl,tl,autojunk=False).get_opcodes()]
                residual=[dict(sourceLineInUnit=i+1,text=sl[i]) for tag,a,b,c,d in ops if tag in ('replace','delete') for i in range(a,b) if sl[i].strip()]
                row['adaptationWitness']=dict(opcodes=ops,changedSourceLines=residual,residualText='\n'.join(x['text'] for x in residual),reason=reason,independentReview='pending; not a semantic approval')
            bindings.append(row)
    shard=dict(version=1,authority='L12-137 / L13-6 / w11-import3-resume-brief; author only',sourcePin=pin,
        bindingHashEncoding=json.loads((P/'ledger/decisions/s16-import2-resync.json').read_text())['bindingHashEncoding'],sourceBindings=bindings)
    for change in changes:change['after']=copy.deepcopy(at(proposed[change['shard']],change['pointer']))
    outputs=[]
    for f,v in proposed.items():
        if v==docs[f]:continue
        assert f.startswith(str(P/'ledger/decisions/')),'needsWrites '+f
        text=json.dumps(v,ensure_ascii=False,indent=2)+'\n';outputs.append(dict(path=f,beforeSha256=sha(Path(f).read_bytes()),afterSha256=sha(text)))
        if write:Path(f).write_text(text)
    if write:dump(SHARD,shard)
    report=dict(sourceHEAD=pin,extractors=data['extractors'],candidatePaths=PATHS,preimages=preimages,changes=changes,outputs=outputs,historicalOverlayPredecessorsAtInput=historical,historicalOverlayPredecessorsNotRewritten=[h for h in historical if not any(h['shard']==m['shard'] and h['pointer']==m['pointer'] for m in materialized)],
        sourceBindings=24,exactSourceBindings=sum(b['disposition']['kind']=='exact-unit-digest' for b in bindings),directOriginMaterializations=materialized,overlayPredecessorIdentityRefreshes=predecessorRefresh,independentReview='pending')
    dump(O/'binding-refresh.json' if write else S/'proposed-refresh.json',compact_report(report))
    if not write:dump(S/'proposed-source-bindings.json',shard)
    print(json.dumps(dict(refreshedRows=len(changes),outputs=len(outputs),historical=len(historical),sourceBindings=24,exact=report['exactSourceBindings'],applied=write)))

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');ap.add_argument('--check',action='store_true');args=ap.parse_args()
    S.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='import3-resync-', dir=S) as name:
        S = Path(name)
        if args.check:check()
        else:author(args.write)
