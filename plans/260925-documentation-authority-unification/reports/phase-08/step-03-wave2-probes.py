#!/usr/bin/env python3
"""L12-36 omission mutations against complete real records and parser controls."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy
P=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('c',P/'step-03-check.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
PIN='ae141550c2e022310de7a0efea757580c0b2479f'
def main():
 m.SETS=tuple(f'{i:03}' for i in range(1,42));rs=m.records();c=m.Checker(PIN);by={r['file']:r for r in rs};cases=[]
 mapfile='docs/platform/proposals/component-authority-boundary-map.md';legacy='docs/platform/agent-coordination/history/retired-engine/legacy/README.md'
 for file,n,token in [(mapfile,636,'vocabulary/'),(mapfile,678,'architecture/'),(mapfile,687,'contracts/'),(mapfile,705,'architecture/{system-context,protocol-model,runtime-model}.md'),(mapfile,706,'contracts/assignment-run-runresult.md'),(legacy,246,'[Agent Coordination Foundation Vision](vision.md)'),(legacy,249,'[Intent Preservation Ledger](intent-preservation-ledger.md)'),('docs/platform/agent-coordination/history/retired-engine/files/architecture/README.md',None,None)]:
  original=by[file]
  edge=next(e for e in original['edges'] if (n is None and e['edgeId'].startswith('author-L12-36-')) or (e['sourceSpans'][0]['line']==n and e['matchedExpression']==token))
  assert not c.check_record(original,apply=False),file
  for mode in ['joint-omission','contextual-exclusion']:
   r=copy.deepcopy(original);key=edge['edgeId'];r['edges']=[e for e in r['edges'] if e['edgeId']!=key];cov=r['checks']['coverage'];cov['authorAddedEdgeIds'].remove(key)
   if mode=='joint-omission':cov['legacyScan']['candidates']=[item for item in cov['legacyScan']['candidates'] if item.get('edgeId')!=key]
   else:
    item=next(item for item in cov['legacyScan']['candidates'] if item.get('edgeId')==key);item.pop('edgeId');item['excludedReason']='Candidate-native or proposed-context escape'
   checks={f['check'] for f in c.check_record(r,apply=False)};assert 'author-added-search-coverage' in checks,(key,mode,checks)
   cases.append({'file':file,'line':edge['sourceSpans'][0]['line'],'expression':edge['matchedExpression'],'mutation':mode,'expectedCheck':'author-added-search-coverage','observedChecks':sorted(checks),'rejected':True})
 # No candidate-root fallback from a proposed nested directory to a real sibling.
 body=m.blob(PIN,mapfile).decode()
 assert m.candidate_targets(mapfile,body,{'line':673,'text':'README.md'})==['docs/architect/agent-coordination/boundaries/README.md']
 assert 'docs/architect/agent-coordination/architecture/system-context.md' in m.candidate_targets(mapfile,body,{'line':705,'text':'architecture/{system-context,protocol-model,runtime-model}.md'})
 assert not m.carriage_declaration('# Current\ntext\n',2)
 # Section boundaries reset stated parents; an explicit fenced root supersedes
 # the inherited parent and indentation scopes directory children.
 text='# Example\nThe tree `docs/architect/agent-coordination/`:\n```txt\ncontracts/\n  coordination-session.md\n```\n## Other\n`contracts/`\n'
 contexts=m.stated_contexts(text)
 assert contexts[5]['leaf']['path']=='docs/architect/agent-coordination/contracts/coordination-session.md'
 assert not contexts[8]['parents']
 text='```txt\ndocs/architect/agent-coordination/\n  contracts/\n    coordination-session.md\n  boundaries/\n    README.md\n```\n'
 assert m.stated_contexts(text)[6]['leaf']['path']=='docs/architect/agent-coordination/boundaries/README.md'
 return {'pin':PIN,'negativeProbes':len(cases),'allRejected':True,'probes':cases,'positiveControls':['actual proposed boundaries parent, not sibling fallback','three brace-expanded cells resolve from stated parent','new section resets stated parent','indented fence directory scopes its own child','explicit fenced root supersedes inherited parent','non-carriage source remains live'],'limits':'Semantic source roles and independent sample acceptance remain reviewer/Lead responsibilities; no consumer edit.'}
if __name__=='__main__':print(json.dumps(main(),ensure_ascii=False,indent=2))
