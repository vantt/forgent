"""Negative mutations of compiler, render, frozen gate and parity contracts."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,copy,importlib.util
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('s67probes',P/'step-05-seam67-check.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
rs=m.load();rc=m.read('step-05-seam67-parity-receipts.json')['receipts'];listing=m.read('step-05-seam67-review-list.json');base=m.check(rs,rc,listing);assert not base['failures'],base['failures'];out=[]
def probe(name,edit):
 a=copy.deepcopy(rs);b=copy.deepcopy(rc);c=copy.deepcopy(listing);edit(a,b,c);r=m.check(a,b,c);out.append({'name':name,'rejected':r['failureCount']>0,'caught':r['failures'][:3]})
def rec(a,f):return next(r for r in a if r['file']==f)
def item(a,f,id):return next(e for e in m.items(rec(a,f)) if m.ident(e)==id)
probe('census tuple cannot disappear',lambda a,b,c:rec(a,'.claude/skills/ui-spec/tools/config.mjs')['dynamicTraces'].pop())
probe('original inventory origins cannot be replaced',lambda a,b,c:item(a,'.claude/skills/ui-spec/tools/config.mjs','dynamic-000346').update(inventoryOrigins=[]))
probe('consumer source hash is checked at its own pin',lambda a,b,c:rec(a,'.claude/skills/ui-spec/tools/config.mjs').update(sourceSha256='0'*64))
probe('operation witness cannot bind another occurrence',lambda a,b,c:item(a,'.claude/skills/ui-spec/tools/config.mjs','dynamic-000346')['operationWitness'].update(line=15))
probe('generated HTML cannot carry authored diff',lambda a,b,c:rec(a,'docs/ui-spec/generated/wireframe-v2.html').update(diff='hand edit'))
probe('preserved source cannot create own generated park',lambda a,b,c:item(a,'.agents/skills/_shared/citation-format.md','reference-000006').update(disposition='parked',blockedReason='independent generated park',dependency='invented'))
probe('parked canonical source cannot yield render-join',lambda a,b,c:item(a,'.agents/skills/_shared/citation-format.md','reference-000012').update(disposition='render-join'))
probe('source owner locator must exist',lambda a,b,c:item(a,'.agents/skills/_shared/citation-format.md','reference-000012')['sourceOwner'].update(id='missing-slot'))
probe('frozen baseline hash cannot change',lambda a,b,c:rec(a,'scripts/check-decision-citation-drift.baseline.json')['protectedPins'].update({'scripts/check-decision-citation-drift.baseline.json':'0'*64}))
probe('missing candidate coverage cannot claim pass',lambda a,b,c:b[1]['proofs'][-1].update(status='pass',exit=0))
probe('unexecuted compiler output sets cannot be invented',lambda a,b,c:b[0]['comparison'].update(candidateOutputSet=[{'path':'fabricated'}]))
probe('current input source pin must match exact hash',lambda a,b,c:b[0]['currentInputs'][0].update(sha256='0'*64))
probe('review must include all authored files',lambda a,b,c:c['addedThisTurn'].pop())
probe('supplemental source slots cannot vanish from review',lambda a,b,c:c['canonicalRecords'][0].update(admittedIds=[]))
# New R27 category is tightly bound to an actual outside-docs source and assertion.
a=m.module('r27admissionprobe','step-05-admission-rules.py');record=next(json.loads(l) for l in (P/'step-05-records/tests-judgment-batch7.jsonl').open() if json.loads(l)['file']=='test/runner/fanout-batch-runner-commit.test.mjs');changed=copy.deepcopy(record);e=next(e for e in changed['dynamicTraces'] if e['id']=='dynamic-027077');e['realReadPath']='docs/specs/runner.md';r=a.check([changed]);out.append({'name':'R27 non-census read cannot conceal a docs target','rejected':any(x['rule']=='r27-noncensus-document-read' for x in r['failures']),'caught':r['failures'][:3]})
task0=m.module('s67task0probe','step-05-seam67-task0-rules.py')
def exact_probe(name,fn):
 try:fn();rejected=False
 except (AssertionError,KeyError,StopIteration):rejected=True
 out.append({'name':name,'rejected':rejected})
spec=next(s for s in m.read('step-05-seam5-batch2-cutover-specs.json')['patches'] if s['file']=='test/docs/decisions-corpus-retired.test.mjs')
x=copy.deepcopy(spec);x['r22Replay'].pop('logSha256');exact_probe('R22 patch file cannot omit its replay log hash',lambda:task0.replay(x))
y=copy.deepcopy(spec);y['r22Replay']['sides'][1]['exit']=1;exact_probe('R22 candidate failure cannot claim replay pass',lambda:task0.replay(y))
z=next(json.loads(l) for l in (P/'step-05-records/tests-judgment-batch6.jsonl').open() if json.loads(l)['file']=='test/scripts/check-doc-candidate-status.test.mjs');z=copy.deepcopy(z);z['authorAddedReferences']=[e for e in z['authorAddedReferences'] if e['referenceId']!='author-s67-governance-baseline-163'];exact_probe('R28 transitive reader cannot disappear behind a readFile stub',lambda:task0.governance(z))
probe('module operation cannot borrow a function that already ended',lambda a,b,c:item(a,'.claude/skills/ui-spec/tools/config.mjs','dynamic-000358').update(caller={'line':32,'declaration':'function loadConfig() {','kind':'function'}))
probe('multiline test declaration cannot lose its title and callback header',lambda a,b,c:rec(a,'test/scripts/check-decision-citation-drift.test.mjs')['owningProofs'][0].update(declaration='test('))
result={'baselineFailures':base['failureCount'],'passed':sum(x['rejected'] for x in out),'total':len(out),'probes':out,'failures':[x for x in out if not x['rejected']]};(P/'step-05-seam67-probes-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result));sys.exit(bool(result['failures']))
