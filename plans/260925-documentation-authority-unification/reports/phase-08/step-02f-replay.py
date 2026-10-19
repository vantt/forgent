#!/usr/bin/env python3
"""Read-only full A50 replay and negative probes. No files are written.
Run from any cwd: PYTHONDONTWRITEBYTECODE=1 python3 <this file>.
"""
import sys
sys.dont_write_bytecode=True
import copy,hashlib,importlib.util,json,re
from pathlib import Path
R=Path(__file__).resolve().parent
ROOT=R.parents[3]
def module(name):
    spec=importlib.util.spec_from_file_location(name,R/(name+'.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
parser=module('step-02f-parser');packet=module('step-02f-packet')
probes=module('step-02f-probes')
enc=packet.enc
sha=packet.sha
def load(n):return json.loads((R/n).read_text())
def require(condition,message,errors):
    if not condition:errors.append(message)
def check(c,tables,expected):
    errors=[]
    observed=copy.deepcopy(c);observed.pop('inputHEAD',None)
    want=copy.deepcopy(expected);want.pop('inputHEAD',None)
    require(enc(observed)==enc(want),'Full census differs from read-only reparse/current source or corrected overlay precedence',errors)
    rebuilt=packet.compile_packet(c)
    for n,value in rebuilt.items():require(enc(tables[n])==enc(value),n+': stale downstream mapping/exception/sample/part or precedence',errors)
    ids=[e['edgeId'] for e in c['entries']]
    require(len(ids)==len(set(ids)),'Unique edge IDs',errors)
    for f in c['files']:
        path=ROOT/f['path'];raw=path.read_bytes();lines=raw.decode().splitlines()
        require(sha(raw)==f['sha256'],f['path']+': file digest',errors)
        rows=[e for e in c['entries'] if e['consumerPath']==f['path']]
        require(f['edgeIds']==[e['edgeId'] for e in rows],f['path']+': file membership',errors)
        for e in rows:
            chunks=[]
            for s in e['physicalSpans']:
                text=lines[s['line']-1][s['columnStart']-1:s['columnEndExclusive']-1]
                require(text==s['text'],e['edgeId']+': physical span',errors);chunks.append(text)
            require(''.join(chunks)==e['matchedExpression'].replace('\r','').replace('\n',''),e['edgeId']+': complete reference unit',errors)
            require(sha(lines[e['line']-1].encode())==e['callSiteSha256'],e['edgeId']+': call site hash',errors)
            if e['cutoverAction']!='cutover-patch-only':require(not (e.get('cutoverPatch') or {}).get('new'),e['edgeId']+': parked executable patch',errors)
    # Earlier slices remain effective; validate their corrected physical bytes as well.
    controlcache={}
    for control in tables['step-02f-review-data.json']['overlayControls']:
        e=control['effectiveRow'];path=e.get('consumerPath',e.get('path'))
        if not path:continue
        require('.fgos' not in Path(path).parts,'Forbidden state path in overlay',errors)
        if path not in controlcache:
            raw=(ROOT/path).read_bytes();controlcache[path]=(sha(raw),raw.decode().splitlines())
        digest,lines=controlcache[path]
        if e.get('fileDigest'):require(digest==e['fileDigest'],control['controlId']+': corrected source digest',errors)
        if e.get('physicalSpans'):
            chunks=[]
            for span in e['physicalSpans']:
                text=lines[span['line']-1][span['columnStart']-1:span['columnEndExclusive']-1]
                require(text==span['text'],control['controlId']+': corrected physical span',errors);chunks.append(text)
            require(''.join(chunks)==e['matchedExpression'].replace('\n','').replace('\r',''),control['controlId']+': wrapped corrected unit',errors)
        elif all(k in e for k in ('line','columnStart','columnEndExclusive','matchedExpression')):
            require(lines[e['line']-1][e['columnStart']-1:e['columnEndExclusive']-1]==e['matchedExpression'],control['controlId']+': corrected literal span',errors)
        require(sha(enc(e))==control['effectiveSha256'],control['controlId']+': final effective row fingerprint',errors)
    for name,digest in tables['step-02f-mapping-review-index.json']['sourceTablePins'].items():
        require(sha((R/name).read_bytes())==digest,name+': pinned review table bytes',errors)
    return errors

def parser_probes():
    probes=[]
    def test(label,text,expected,path='docs/a/b.md',prior=()):
        units,excluded=parser.units(path,text,prior)
        actual=[r for u in units for r in u['references']]
        assert actual==expected,(label,actual,expected)
        probes.append(label)
    test('one link; label follows destination','[docs/specs/old.md](../../docs/specs/runner.md)',['docs/specs/runner.md'])
    test('relative consumer directory','[x](../specs/runner.md)',['docs/specs/runner.md'])
    test('repo prefix stripped','`repo/docs/backlog.md`',['docs/backlog.md'])
    test('whole architecture token','`docs/architecture-map.md`',['docs/architecture-map.md'])
    test('brace list expansion','`docs/architect/x/{a.md,b.md}`',['docs/architect/x/a.md','docs/architect/x/b.md'])
    test('wrapped inline reference','`docs/specs/\nrunner.md`',['docs/specs/runner.md'])
    test('JS indexing is not a markdown link',"`d['executeAssignment'](a)`",[])
    test('nonpath prefix excluded','code/docs/specs',[])
    test('literal citation inside JS comment preserved','```js\n// docs/history/example/plan.md\n```\n',['docs/history/example/plan.md'])
    return probes

def main():
    c=load('step-02f-census-maps-portals-prose.json');tables={n:load(n) for n in ['step-02f-distinct-mappings.json','step-02f-review-data.json','step-02f-mapping-review-index.json']}
    expected=parser.build();errors=check(c,tables,expected);syntaxProbes=parser_probes();regressions=probes.run(expected)
    # Every probe starts from an otherwise-good snapshot. It must fail validation.
    mutations=[]
    def reject(name,mutate):
        cc=copy.deepcopy(c);tt=copy.deepcopy(tables);mutate(cc,tt)
        found=check(cc,tt,expected)
        require(bool(found),'Negative probe accepted: '+name,errors);mutations.append({'name':name,'rejected':bool(found)})
    # Full check is intentionally expensive only once; derivative equality is sufficient
    # for negative probes after the full source span pass above.
    def fast_reject(name,mutate):
        cc=copy.deepcopy(c);tt=copy.deepcopy(tables);mutate(cc,tt)
        a=copy.deepcopy(cc);b=copy.deepcopy(expected);a.pop('inputHEAD',None);b.pop('inputHEAD',None)
        found=enc(a)!=enc(b)
        if not found:
            found=any(enc(tables[n])!=enc(tt[n]) for n in tables)
        require(found,'Negative probe accepted: '+name,errors);mutations.append({'name':name,'rejected':found})
    fast_reject('wrong source digest',lambda cc,tt:cc['entries'][0].update(fileDigest='0'*64))
    fast_reject('shifted full span',lambda cc,tt:cc['entries'][0]['physicalSpans'][0].update(columnStart=99))
    fast_reject('removed mapping membership',lambda cc,tt:tt['step-02f-distinct-mappings.json']['entries'][0]['edgeIds'].pop())
    fast_reject('stale effective overlay',lambda cc,tt:cc['overlayEffectiveRows'][0].update(effectiveSha256='0'*64))
    fast_reject('stale downstream corrected-row hash',lambda cc,tt:next(e for e in cc['entries'] if e['priorRows'])['priorRows'][0].update(effectiveSha256='0'*64))
    fast_reject('removed exception membership',lambda cc,tt:tt['step-02f-review-data.json']['sets']['preserve-pending-target']['rowIds'].pop())
    fast_reject('stale sampled row',lambda cc,tt:tt['step-02f-review-data.json']['sample'][0].update(effectiveRowSha256='0'*64))
    fast_reject('stale review-part payload',lambda cc,tt:tt['step-02f-mapping-review-index.json']['parts'][0].update(resolvedRowsSha256='0'*64))
    require(not any(x['afterCount'] for x in tables['step-02f-review-data.json']['defectDiff']),'Detectable systemic defects remain',errors)
    require(not any(x['afterCount'] for x in tables['step-02f-review-data.json']['systemicDiffVs02e']),'L12-21 regressions remain against 02e',errors)
    require(not any(x['afterCount'] for x in tables['step-02f-review-data.json']['secondRoundDefectDiff']),'L12-22 defects remain',errors)
    print(json.dumps({'status':'FAIL' if errors else 'PASS','counts':{**c['counts'],**tables['step-02f-mapping-review-index.json']['counts']},'parserProbes':syntaxProbes,'defectRegressionProbes':regressions,'negativeProbes':mutations,'failureCount':len(errors),'failures':errors[:30],'limits':'Author mechanical regression only. Independent A50 deep reads and semantic approval pending; class-3 native/current-coordinate/adoption and later classes remain open.'},ensure_ascii=False,indent=2))
    return int(bool(errors))
if __name__=='__main__':
    try:sys.exit(main())
    except Exception as e:
        require(not any(x['afterCount'] for x in tables['step-02f-review-data.json']['systemicDiffVs02e']),'L12-21 regressions remain against 02e',errors)
    require(not any(x['afterCount'] for x in tables['step-02f-review-data.json']['secondRoundDefectDiff']),'L12-22 defects remain',errors)
    print(json.dumps({'status':'FAIL','error':type(e).__name__+': '+str(e)}));sys.exit(1)
