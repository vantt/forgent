#!/usr/bin/env python3
import sys
sys.dont_write_bytecode=True
import importlib.util,pathlib,json,collections
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('a',P/'step-04-wave1-author.py');a=importlib.util.module_from_spec(s);s.loader.exec_module(a)
q=a.q;m=q.m
TARGETS={
 'class6-l-000085':('docs/knowledge/why-fgos-add-now-caps-a-work-item-s-id-at-30-characters/long-work-item-ids-max-length-guard.md',22,'The exact pre-existing add/submit gap is explained under Why add had this gap and submit did not. The comment separately states the later generator change; it does not claim the target already documents the new default.'),
 'class6-l-000230':('docs/knowledge/why-judgediscovery-judgedecompose-run-a-second-independent-j/judge-verdict-second-pass-semantic-check.md',42,'The Why disagreement parks passage explicitly says never silently overrides one judgment with another. The comment states explicit logged override separately; the target also carries the later force discussion.'),
 'class6-l-000247':('docs/knowledge/avoid-a-vacuous-pass-from-node-test-test-name-pattern/avoid-vacuous-pass-with-node-test-test-name-pattern.md',36,'The trap section explicitly states default reporter does not emit TAP-prefixed pass/fail summaries. This is exactly the mechanical wrong-reporter check rationale in the comment, with no new behavior.')}
changes=[]
for path in sorted((P/'step-04-records').glob('*.jsonl')):
 rs=[json.loads(l) for l in path.read_text().splitlines()]
 for r in rs:
  body=m.blob(q.PIN,r['file']).decode()
  for e in r['edges']:
   if not e['renderOnly'] and e['edgeId'] in TARGETS:
    target,line,why=TARGETS[e['edgeId']];a.patch(r,e,body,target,line,why);changes.append({'file':r['file'],'edgeId':e['edgeId'],'slotKey':e['slotKey'],'old':'preserve','new':'patch','target':target,'ruling':'L12-37(2) live renamed-alias navigation'})
   if not e['renderOnly'] and e['disposition']=='parked':
    e['searchWitness']=a.witness(e,body,e['blockedReason'])
  groups=collections.defaultdict(list)
  for e in r['edges']:
   if not e['renderOnly']:groups[m.unit_id(body,e['sourceSpans'])].append(e)
  for unit,es in groups.items():
   if len({e['disposition'] for e in es})>1:
    for e in es:e['unitDispositionReason']=e['edgeId']+' '+e['slotKey']+' '+e['matchedExpression']+' Distinct claim: '+e['reason']
  edits=[]
  for e in r['edges']:
   if e['disposition']=='patch' and not e['renderOnly']:edits.extend(m.replacement_changes(body,e['sourceSpans'],r['checks']['relativeResolution'][e['slotKey']]['replacement']))
  after=body
  for x,y,t in reversed(sorted(set(edits))):after=after[:x]+t+after[y:]
  r['diff']=m.make_diff(r['file'],body,after)
  for e in r['edges']:
   if e['disposition']!='patch' or e['renderOnly']:continue
   n=e['sourceSpans'][0]['line'];e['diffHunk']=next(h.splitlines()[0] for h in m.hunks(r['diff']) if (lambda a,c:a<=n<a+c)(*map(int,a.re.match(r'@@ -(\d+)(?:,(\d+))?',h).groups(default='1'))))
 path.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
q.save('step-04-wave1-ruling-corrections.json',{'sourceEditsApplied':False,'corrections':changes,'checkerRule':'L12-54(2) candidate law body is live; other carriage remains rejected','unitClarifications':'Per-edge source-bound distinct claims for mixed computed units; no disposition override','searchWitnesses':'Replayed after lawful target-carriage distinction'})
