import json,glob,subprocess,os,sys
WT='/home/vantt/projects/forgentX-s8-review'
RD=WT+'/plans/260925-documentation-authority-unification/reports/phase-08/step-05-records/'
OUT=sys.argv[1]
def _cap(o):
    if isinstance(o,str): return o if len(o)<=2000 else o[:2000]+f' …[truncated {len(o)} chars]'
    if isinstance(o,list): return [_cap(x) for x in o]
    if isinstance(o,dict): return {k:_cap(v) for k,v in o.items()}
    return o
src_cache={}
MECH=set()
import collections
ST=collections.Counter()
for _l in open(RD+'../step-05-seam5-bulk-triage.jsonl'):
    _r=json.loads(_l)
    for _t in _r['tuples']:
        ST[_t['status']]+=1
        if _t['status']!='judgment-required': MECH.add(_t['id'])
print('triage statuses',dict(ST))
def show(commit,path):
    k=(commit,path)
    if k not in src_cache:
        src_cache[k]=subprocess.run(['git','-C',WT,'show',f'{commit}:{path}'],capture_output=True).stdout.decode('utf-8','replace').split('\n')
    return src_cache[k]
def lines_of(x):
    ls=[]
    for sp in (x.get('sourceSpans') or []):
        for key in ('line','startLine'):
            if isinstance(sp,dict) and key in sp: ls.append(sp[key])
        if isinstance(sp,dict) and 'endLine' in sp: ls.append(sp['endLine'])
    if x.get('currentLine'): ls.append(x['currentLine'])
    ps=x.get('passageSpan') or {}
    for key in ('startLine','line','endLine'):
        if key in ps: ls.append(ps[key])
    return ls
KEEP_REF=['referenceId','admission','edgeId','matchedExpression','sourceSpans','passageSpan','role','disposition','reason','target','anchor','resolverWitness','timing','diffHunk','blockedCategory','blockedReason','dependency','proposedReplacement','receiptId','proofCommand','proofScope','parityObligation','physicalPriorJoins','pathOperand','nonDocumentUse','successorNote']
KEEP_DYN=['id','admission','disposition','caller','currentLine','currentPassage','role','targetSetOrConstruction','operationChain','stateExportDependency','rejectedAsUnrelatedReason','blockedReason','blockedSeams','reason','receiptId','proofCommand','proofScope','parityObligation','pathOperand','nonDocumentUse']
src_items=[];gen_items=[];nolines=0
_D=json.load(open(RD+'../step-05-seam5-review-list.json')); _f=lambda L: set(x if isinstance(x,str) else x['file'] for x in L); FILT=_f(_D['addedThisTurn'])|_f(_D['changedThisTurn']['dispositionChanged'])
for f in sorted(glob.glob(RD+'*.jsonl')):
    for l in open(f):
        r=json.loads(l); pin=r['authorInputCommit']
        if r['file'] not in FILT: continue
        if r.get('generated'):
            gen_items.append({'file':r['file'],'pin':pin,'sourceRenderProvenance':r.get('sourceRenderProvenance'),'refCounts':{},'headLines':'\n'.join(show(pin,r['file'])[:12]),
              'dispositions':sorted({(x['admission'],x['disposition']) for x in r['references']+r['dynamicTraces']}),
              'nRefs':len(r['references']),'nDyn':len(r['dynamicTraces']),'blockedReasons':sorted({x.get('blockedReason') or '' for x in r['references']+r['dynamicTraces']})[:5]})
            continue
        src=show(pin,r['file']); want=[]
        items=[]
        for x in r['references']:
            items.append({k:x.get(k) for k in KEEP_REF})
            want+= lines_of(x) or []
        for x in r['dynamicTraces']:
            if x.get('id') in MECH: continue
            if x.get('admission')=='REJECT' and 'docs' not in json.dumps(x.get('currentPassage'))+str(x.get('pathOperand')): continue
            items.append({k:x.get(k) for k in KEEP_DYN})
            want+= lines_of(x) or []
        rng=[]
        for n in sorted(set(int(v) for v in want if isinstance(v,int) or str(v).isdigit())):
            a,b=max(1,n-40),min(len(src),n+40)
            if rng and a<=rng[-1][1]+1: rng[-1][1]=max(rng[-1][1],b)
            else: rng.append([a,b])
        wins=[{'from':a,'to':b,'text':'\n'.join(f'{i}: '+(src[i-1] if len(src[i-1])<=600 else src[i-1][:600]+f' …[line truncated, {len(src[i-1])} chars]') for i in range(a,b+1))} for a,b in rng]
        src_items.append(_cap({'file':r['file'],'pin':pin,'subBatch':r.get('subBatch'),'diff':r.get('diff'),'rollbackDiff':r.get('rollbackDiff'),'coCutPaths':r.get('coCutPaths'),'parked':r.get('parked'),'authorAddedReferences':r.get('authorAddedReferences'),'items':items,'windows':wins}))
# split src into parts <= 380KB
parts=[];cur=[];size=0
for it in src_items:
    s=len(json.dumps(it,ensure_ascii=False).encode())
    if cur and size+s>380000: parts.append(cur);cur=[];size=0
    cur.append(it);size+=s
if cur: parts.append(cur)
for i,p in enumerate(parts,1):
    json.dump(p,open(f'{OUT}/s4-src-p{i:02d}.json','w'),ensure_ascii=False)
json.dump(gen_items,open(f'{OUT}/s4-gen.json','w'),ensure_ascii=False)
big=[ (it['file'],len(json.dumps(it).encode())) for it in src_items if len(json.dumps(it).encode())>380000]
print('src files',len(src_items),'parts',len(parts),'gen files',len(gen_items),'gen bytes',os.path.getsize(f'{OUT}/s4-gen.json'))
print('oversize single files',big[:10])
for i,p in enumerate(parts,1): print(i,len(p),os.path.getsize(f'{OUT}/s4-src-p{i:02d}.json'))
