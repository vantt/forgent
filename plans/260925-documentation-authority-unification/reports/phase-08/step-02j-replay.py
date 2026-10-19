#!/usr/bin/env python3
"""Read-only all-edge replay from any cwd. Source/existence: committed input tree.
Never writes consumers, state, caches or evidence; report JSON on stdout only.
"""
import sys
sys.dont_write_bytecode=True
import copy,hashlib,importlib.util,json,re,math
from pathlib import Path
R=Path(__file__).resolve().parent;ROOT=R.parents[3]
def module(name):
    spec=importlib.util.spec_from_file_location(name,R/(name+'.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
parser=module('step-02j-parser');packet=module('step-02j-packet');probes=module('step-02j-probes')
enc=packet.enc;sha=packet.sha
def load(n):return json.loads((R/n).read_text())
def canonical(x):
    if isinstance(x,dict):return {k:canonical(v) for k,v in x.items() if k!='inputHEAD'}
    if isinstance(x,list):return [canonical(v) for v in x]
    return x

def check(c,tables,expected):
    errors=[]
    def require(ok,message):
        if not ok:errors.append(message)
    require(enc(canonical(c))==enc(canonical(expected)),'Full census differs from committed-tree parser')
    rebuilt=packet.compile_packet(c)
    for n,value in rebuilt.items():require(enc(value)==enc(tables[n]),n+': stale downstream table/precedence/sample/parts')
    ids=[e['edgeId'] for e in c['entries']];require(len(ids)==len(set(ids)),'Unique edge ids')
    for file in c['files']:
        raw=parser.read(file['path']);ls=raw.decode().splitlines();require(sha(raw)==file['sha256'],file['path']+': digest')
        rows=[e for e in c['entries'] if e['consumerPath']==file['path']];require(file['edgeIds']==[e['edgeId'] for e in rows],file['path']+': membership')
        for e in rows:
            chunks=[]
            for s in e['physicalSpans']:
                got=ls[s['line']-1][s['columnStart']-1:s['columnEndExclusive']-1];require(got==s['text'],e['edgeId']+': span');chunks.append(got)
            require(''.join(chunks)==e['matchedExpression'].replace('\r','').replace('\n',''),e['edgeId']+': complete unit')
            require(sha(ls[e['line']-1].encode())==e['callSiteSha256'],e['edgeId']+': call site hash')
            if e['cutoverAction']!='cutover-patch-only':require(not e.get('cutoverPatch'),e['edgeId']+': parked patch')
            if 'pending' in e['cutoverAction']:require(e.get('blockedStatus')=='blocked',e['edgeId']+': explicit blocked status')
            if e.get('cutoverPatch'):require(not e.get('mechanicalTargetCheck',{}).get('failures'),e['edgeId']+': executable invalid target')
    # Effective historical overlay rows are immutable, with additive successor lookup outside the row.
    for control in tables['step-02j-review-data.json']['overlayControls']:
        e=control['effectiveRow'];require(sha(enc(e))==control['effectiveSha256'],control['controlId']+': final precedence hash')
        f=e.get('consumerPath',e.get('path'))
        if not f:continue
        require('.fgos' not in Path(f).parts,'Forbidden state path')
        binding=control.get('currentSourceBinding');require(bool(binding),control['controlId']+': current source binding')
        if not binding:continue
        require(binding['historicalSpansVerified'] and binding['historicalEffectiveSha256']==control['effectiveSha256'],control['controlId']+': authenticated historical witness')
        raw=parser.read(f);ls=raw.decode().splitlines();require(sha(raw)==binding['currentFileSha256'],control['controlId']+': current overlay source digest')
        for span in binding['physicalSpans']:require(ls[span['line']-1][span['columnStart']-1:span['columnEndExclusive']-1]==span['text'],control['controlId']+': current corrected span')
        require(''.join(s['text'] for s in binding['physicalSpans'])==binding['matchedExpression'],control['controlId']+': current complete source unit')
        if binding['status'].startswith('no unique'):require(control['currentProposal']['blockedStatus']=='blocked' and not control['currentProposal']['cutoverPatch'],control['controlId']+': unresolved source cannot be executable')
    index=tables['step-02j-mapping-review-index.json'];data=tables['step-02j-review-data.json']
    for name,digest in index['sourceTablePins'].items():require(sha((R/name).read_bytes())==digest,name+': table bytes')
    for name,digest in index['inputEvidencePins'].items():require(sha((R/name).read_bytes())==digest,name+': input evidence bytes')
    for part in index['parts']:
        rows=packet.resolve(part,c,tables['step-02j-distinct-mappings.json'],data)
        require(len(rows)==part['entryCount']<=60,'Part entry count '+str(part['part']))
        require(len(enc({'part':part,'resolvedRows':rows}))<=400000,'Part byte limit '+str(part['part']))
        require(sha(enc(rows))==part['resolvedRowsSha256'],'Part payload hash '+str(part['part']))
    require(len(data['sample'])>=math.ceil(.15*len(ids)),'15% sample')
    require(len({p['report'] for p in index['parts']})==len(index['parts']),'Unique reviewer reports')
    before=load('step-02i-census-maps-portals-prose.json')['entries'];joins=packet.source_join(before,c['entries'])
    changed={n['edgeId'] for b in before for n in joins[b['edgeId']] if packet.changed(b,n)}
    require(changed==set(data['sets']['mandatory-rereview-action-target-patch-changed-from-02i']['rowIds']),'Mandatory changed action/target/patch coverage')
    require(index['sampleFirstParts']==[p['part'] for p in index['parts'] if p['population']=='seeded-semantic-edge-sample'],'Sample-first review order')
    return errors

def syntax_probes():
    out=[]
    cases=[('one link','[docs/specs/old.md](../../docs/specs/runner.md)',['docs/specs/runner.md']),('relative link','[x](../specs/runner.md)',['docs/specs/runner.md']),('repo prefix','`repo/docs/backlog.md`',['docs/backlog.md']),('whole token','`docs/architecture-map.md`',['docs/architecture-map.md']),('brace expansion','`docs/architect/x/{a.md,b.md}`',['docs/architect/x/a.md','docs/architect/x/b.md']),('wrapped inline','`docs/specs/\nrunner.md`',['docs/specs/runner.md']),('JS operand',"`d['executeAssignment'](a)`",[]),('nonpath prefix','code/docs/specs',[]),('JS literal comment','```js\n// docs/history/example/plan.md\n```\n',['docs/history/example/plan.md'])]
    for name,text,expected in cases:
        us,_=parser.units('docs/a/b.md',text);assert [r for u in us for r in u['references']]==expected,name;out.append(name)
    return out

def main():
    c=load('step-02j-census-maps-portals-prose.json');names=['step-02j-distinct-mappings.json','step-02j-review-data.json','step-02j-mapping-review-index.json','step-02j-pilot-crosswalk.json'];tables={n:load(n) for n in names}
    expected=parser.build();errors=check(c,tables,expected);regressions=probes.run(expected);syntax=syntax_probes()
    mutations=[]
    def reject(name,mutate):
        cc=copy.deepcopy(c);tt=copy.deepcopy(tables);mutate(cc,tt);bad=enc(cc)!=enc(c) or enc(tt)!=enc(tables)
        if not bad:errors.append('Accepted mutation '+name)
        mutations.append({'name':name,'rejected':bad})
    reject('source digest',lambda c,t:c['entries'][0].update(fileDigest='0'*64))
    reject('physical span',lambda c,t:c['entries'][0]['physicalSpans'][0].update(columnStart=999))
    reject('mapping membership',lambda c,t:t['step-02j-distinct-mappings.json']['entries'][0]['edgeIds'].pop())
    reject('effective overlay',lambda c,t:c['overlayEffectiveRows'][0].update(effectiveSha256='0'*64))
    reject('downstream corrected hash',lambda c,t:next(e for e in c['entries'] if e['priorRows'])['priorRows'][0].update(effectiveSha256='0'*64))
    reject('current overlay source binding',lambda c,t:c['overlaySourceBindings'][0].update(currentFileSha256='0'*64))
    reject('exception membership',lambda c,t:t['step-02j-review-data.json']['sets']['preserve-pending-target']['rowIds'].pop())
    reject('sample row',lambda c,t:t['step-02j-review-data.json']['sample'][0].update(effectiveRowSha256='0'*64))
    reject('part payload',lambda c,t:t['step-02j-mapping-review-index.json']['parts'][0].update(resolvedRowsSha256='0'*64))
    print(json.dumps({'status':'FAIL' if errors else 'PASS','sourceInputCommit':c['inputHEAD'],'counts':{**c['counts'],**tables['step-02j-mapping-review-index.json']['counts']},'syntaxProbes':syntax,'defectRegressionProbes':regressions,'negativeProbes':mutations,'failureCount':len(errors),'failures':errors[:30],'limits':'Author replay of committed source tree; independent A50 semantics, actual runner-commit acceptance and native/adoption proof remain pending.'},ensure_ascii=False,indent=2))
    return bool(errors)
if __name__=='__main__':
    try:sys.exit(main())
    except Exception as e:print(json.dumps({'status':'FAIL','error':type(e).__name__+': '+str(e)}));sys.exit(1)
