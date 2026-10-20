#!/usr/bin/env python3
"""L12-37 positive controls and rejected mutations on real whole-file records."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy
from unittest.mock import patch as mock_patch
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('w',P/'step-03-wave3-check.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w)
m=w.m;PIN=w.PIN

def main():
 m.SETS=w.EARLIER;rs=m.records();c=m.Checker(PIN);cases=[];delta=json.loads((P/'step-03-wave2-r2-changes.json').read_text());hits={h['edgeId'] for h in delta['renamedAliasPreserveHits']}
 for change in delta['changes']:
  if change['edgeId'] not in hits:continue
  r=copy.deepcopy(next(r for r in rs if r['file']==change['file']));edge=next(e for e in r['edges'] if e['edgeId']==change['edgeId']);edge.clear();edge.update(copy.deepcopy(change['before']))
  # L12-38(4) makes the real 08367/08368 history preserve valid. Keep
  # their original alias mutation as a negative control in a source fixture
  # with the actual verbatim-history declaration removed; no checker waiver.
  if change['edgeId'] in ('maps-j-08367','maps-j-08368'):
   actual=m.blob(PIN,r['file']).decode();live=actual.replace('Các ADR dưới đây được di dời nguyên văn','These entries are current navigation')
   assert actual!=live
   real=m.blob
   with mock_patch.object(m,'blob',side_effect=lambda pin,path:live.encode() if path==r['file'] else real(pin,path)):
    failures=c.check_record(r,apply=False)
  elif change['edgeId']=='maps-j-04835':
   # L12-40 makes the real D5 blockquote captured evidence. Retain this
   # alias-negative mutation on live prose with identical token columns;
   # strip only quote prefixes, never disable the captured-evidence check.
   actual=m.blob(PIN,r['file']).decode();lines=actual.splitlines(keepends=True)
   live=''.join('  '+line[2:] if line.startswith('> ') else line for line in lines)
   assert actual!=live and not m.captured_evidence_at(live,edge['sourceSpans'][0]['line'])
   real=m.blob
   with mock_patch.object(m,'blob',side_effect=lambda pin,path:live.encode() if path==r['file'] else real(pin,path)):
    failures=c.check_record(r,apply=False)
  else:failures=c.check_record(r,apply=False)
  names=sorted({f['check'] for f in failures});assert 'renamed-alias-preserve' in names,(change['edgeId'],names)
  cases.append({'edgeId':change['edgeId'],'mutation':'restore original renamed-target preserve including quoted QA case','expected':'renamed-alias-preserve','observed':names,'rejected':True})
 file='docs/explanation/skill-prose-cleanup-design.md';r=next(r for r in rs if r['file']==file);body=m.blob(PIN,file).decode();e=next(e for e in r['edges'] if e['edgeId']=='maps-j-03951');replacement=r['checks']['relativeResolution'][e['edgeId']]['replacement'];edits=m.replacement_changes(body,e['sourceSpans'],replacement);assert ''.join(x[2].lstrip() if i else x[2] for i,x in enumerate(edits))==replacement and len(edits)==2
 assert edits[1][2].startswith('   '), 'wrapped list indentation lost'
 bad=copy.deepcopy(r);next(x for x in bad['edges'] if x['edgeId']==e['edgeId'])['sourceSpans'].pop();names=sorted({f['check'] for f in c.check_record(bad,apply=False)});assert 'passage-correspondence' in names;cases.append({'edgeId':e['edgeId'],'mutation':'drop wrapped continuation span','expected':'passage-correspondence','observed':names,'rejected':True})
 bad=copy.deepcopy(r);next(x for x in bad['edges'] if x['edgeId']==e['edgeId'])['sourceSpans'].append(copy.deepcopy(e['sourceSpans'][-1]));names=sorted({f['check'] for f in c.check_record(bad,apply=False)});assert 'complete-unit' in names;cases.append({'edgeId':e['edgeId'],'mutation':'duplicate a wrapped continuation span','expected':'complete-unit','observed':names,'rejected':True})
 file='docs/knowledge/how-to-wire-an-existing-skill-s-inline-reasoning-step-throug/wire-a-skills-classify-step-through-an-agent-executor-executor.md';r=next(r for r in rs if r['file']==file);body=m.blob(PIN,file).decode();e=next(e for e in r['edges'] if e['edgeId']=='maps-j-04520');assert m.related_header(body,e['sourceSpans'][0]['line'])
 # Renamed alias detection is independent of author prose and unit metadata.
 for mutation in ['reason','unit']:
  bad=copy.deepcopy(r);edge=next(e for e in bad['edges'] if e['edgeId']=='maps-j-04520');edge.update(disposition='preserve',timing='none',diffHunk=None,target=None,anchor=None)
  if mutation=='reason':edge['reason']='L12-37: historical quotation, preserve';
  else:edge['unitId']='invented-history-unit'
  names=sorted({f['check'] for f in c.check_record(bad,apply=False)});assert 'renamed-alias-preserve' in names;cases.append({'edgeId':'maps-j-04520','mutation':mutation+' cannot waive renamed alias','expected':'renamed-alias-preserve','observed':names,'rejected':True})
 # A complete normalized path with a line suffix still resolves its alias.
 bad=copy.deepcopy(r);edge=copy.deepcopy(next(x for x in bad['edges'] if x['edgeId']=='maps-j-04520'));edge.update(edgeId='probe-alias-line',disposition='preserve',timing='none',target=None,anchor=None,diffHunk=None,authorAddedEdge={'normalizedReference':'repo/docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md:111'})
 assert c.renamed_alias_holders(bad,edge)
 cases.append({'edgeId':'probe-alias-line','mutation':'repo-prefixed path:line cannot evade alias lookup','expected':'renamed-alias-preserve','rejected':True})
 assert m.related_header('# Live\n## Related\n- docs/specs/runner.md\n',3)
 assert not m.related_header('# History\n## Literal Snapshot\n### Related\n- docs/specs/runner.md\n',4)
 # History-file and carriage exemptions remain source-derived; do not rely on a reason label.
 base=copy.deepcopy(r);edge=copy.deepcopy(e);edge.update(disposition='preserve',timing='none',diffHunk=None,target=None,anchor=None)
 assert not c.renamed_alias_holders(base,e) # current patch is positive control
 absent=copy.deepcopy(edge);absent['authorAddedEdge']={'normalizedReference':'docs/how-to/not-a-real-alias-example.md'};absent['edgeId']='probe-no-alias';assert not c.renamed_alias_holders(base,absent)
 history=next(r for r in rs if '/history/' in r['file'] and not r.get('retiresWithTree'));he=copy.deepcopy(absent);he['authorAddedEdge']['normalizedReference']='docs/how-to/write-verify-for-a-skill-prose-change.md';he['sourceSpans']=history['edges'][0]['sourceSpans'];assert not c.renamed_alias_holders(history,he)
 carrier=next(r for r in rs if not r.get('retiresWithTree') and any(m.carriage_declaration(m.blob(PIN,r['file']).decode(),x['sourceSpans'][0]['line']) for x in r['edges']));ce=next(x for x in carrier['edges'] if m.carriage_declaration(m.blob(PIN,carrier['file']).decode(),x['sourceSpans'][0]['line']));ce=copy.deepcopy(ce);ce['edgeId']='probe-carriage-alias';ce['authorAddedEdge']={'normalizedReference':'docs/how-to/write-verify-for-a-skill-prose-change.md'};assert not c.renamed_alias_holders(carrier,ce)
 # Real Markdown target uses the repository GitHub slug, with significant doubled hyphens.
 rr=next(json.loads(l) for l in (P/'step-03-records/batch-068.jsonl').read_text().splitlines() if json.loads(l)['file']=='docs/how-to/coordination-examples/architecture-advisory-panel-v1-clarification-and-challenge.md')
 assert not c.check_record(rr,apply=False)
 bad=copy.deepcopy(rr);edge=next(e for e in bad['edges'] if e['edgeId']=='maps-j-03996');h=next(h for h in m.heading_sections(PIN,edge['target']) if h['githubSlug']==edge['anchor']);assert h['githubSlug']!=h['anchor'];edge['anchor']=h['anchor']
 names=sorted({f['check'] for f in c.check_record(bad,apply=False)});assert 'anchor-from-evidence' in names
 cases.append({'edgeId':'maps-j-03996','mutation':'extractor slug substituted for Markdown GitHub slug','expected':'anchor-from-evidence','observed':names,'rejected':True})
 return {'pin':PIN,'negativeProbes':len(cases),'allRejected':True,'probes':cases,'positiveControls':['current alias patches accepted','missing path without registered alias not rejected by this rule','history file alias spelling exempt','actual declared carriage alias spelling exempt','wrapped replacement conserves every destination character and both source spans','body Related recognized independent of front-matter header'],'historyFixtureAdaptation':'04835 captured D5 quote is tested as live prose with identical token columns under L12-40; 08367/08368 real historical preserves are valid under L12-38(4); inherited alias-negative mutations still run on a source fixture without the actual history declaration. No checker predicate disabled.','limits':'Independent target/description semantic review remains pending.'}
if __name__=='__main__':print(json.dumps(main(),ensure_ascii=False,indent=2))
