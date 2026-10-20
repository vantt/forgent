#!/usr/bin/env python3
import sys
sys.dont_write_bytecode=True
import importlib.util,pathlib,json,re,collections
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('q',P/'step-04-check.py');q=importlib.util.module_from_spec(s);s.loader.exec_module(q)
m=q.m
for path in sorted((P/'step-04-records').glob('*.jsonl')):
 rs=[json.loads(l) for l in path.read_text().splitlines()]
 for r in rs:
  for e in r['edges']:
   if e['renderOnly'] or e['disposition']!='patch':continue
   proof=r['checks']['anchors'][e['slotKey']];n=proof['targetEvidenceLine']
   if e['anchor']:
    proof.update(targetLines=[n],targetLineText=[m.blob(q.PIN,e['target']).decode().splitlines()[n-1]])
   else:proof.update(targetLines=[],targetLineText=[],wholeFileJustification=proof.get('wholeFileReason',e['reason']))
  if r['file']=='AGENTS.md':
   ls=m.blob(q.PIN,r['file']).decode().splitlines();a=next(i for i,l in enumerate(ls,1) if '<!-- fgos:instruction-projection:start -->' in l);z=next(i for i,l in enumerate(ls,1) if '<!-- fgos:instruction-projection:end -->' in l)
   r['rootInstructionBoundary']={'unmanagedRanges':[{'startLine':1,'endLine':a-1}]+([{'startLine':z+1,'endLine':len(ls)}] if z<len(ls) else []),'managedRanges':[{'startLine':a,'endLine':z,'registrySources':[{'line':i,'text':l} for i,l in enumerate(ls,1) if a<=i<=z and l.startswith('- source: ')]}],'managedDisposition':'Join canonical core/instructions source records; no root projection hunk','claudeImport':'@AGENTS.md stays literal in CLAUDE.md'}
 path.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
# L12-58(2) explicit zero-edge coverage, not invented census/record ids.
zero=[]
for gap in q.read('step-04-population-gaps.json')['uncoveredFilesWithoutNarrowHits']:
 f=gap['file'];b=m.blob(q.PIN,f);body=b.decode();hits=[{'line':i,'text':l} for i,l in enumerate(body.splitlines(),1) if re.search(r'docs/(?:specs|architect)(?:/|\b)|docs/(?:platform-foundations|distribution-vision|reading-map|architecture-map|routing-handoff-contract)\.md',l)]
 assert not hits
 zero.append({'file':f,'inputCommit':q.PIN,'digest':m.sha(b),'bytes':len(b),'lines':len(body.splitlines()),'legacyReferenceHits':hits,'disposition':'zero-edge coverage; L12-58(2); no census id invented','custody':'Step 5' if f.endswith(('.json','.yaml')) else 'Step 4 zero-edge source'})
q.save('step-04-wave1-zero-edge-coverage.json',zero)
