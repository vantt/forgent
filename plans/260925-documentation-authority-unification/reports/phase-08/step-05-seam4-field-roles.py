"""Resolve serialized field roles from each occurrence, never every equal string in the output."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,re,collections
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
roles={'sourceCaptureIds':'capture/provenance-key','sourceCaptureId':'capture/provenance-key','aliases':'generated-alias-lookup-key','purposeTitle':'generated-purposeTitle','currentPath':'generated-currentPath/docPath','docPath':'generated-currentPath/docPath'}
changes=[];counts=collections.Counter()
for path in [P/'step-05-records/generators-doc-registry.jsonl',P/'step-05-records/generators-enduser-index.jsonl']:
 rs=list(map(json.loads,path.read_text().splitlines()))
 for r in rs:
  f=r['file']
  if f not in ['docs/doc-registry.json','docs/doc-registry.md','docs/enduser-docs-index.json']:continue
  ls=(ROOT/f).read_text().splitlines();fields={};active=None
  for n,line in enumerate(ls,1):
   if f.endswith('.json'):
    arr=re.match(r'\s*"(aliases|sourceCaptureIds)"\s*:\s*\[',line)
    if arr:active=arr[1]
    direct=re.match(r'\s*"(purposeTitle|currentPath|docPath|sourceCaptureId)"\s*:',line)
    fields[n]=direct[1] if direct else active
    if re.match(r'\s*\]',line):active=None
   else:fields[n]='purposeTitle' if line.startswith('### ') else 'aliases' if '- Aliases:' in line else 'currentPath'
  for e in r['references']:
   if not e['sourceSpans']:continue
   field=fields[e['sourceSpans'][0]['line']]
   if not field:continue
   old=e['role'];e['projectionFieldAtSpan']=field;e['role']=roles[field]
   # Equal strings in aliases and capture keys have different identities.
   e['projectionSourceKeys']=[k for k in e.get('projectionSourceKeys',[]) if k['field']==field]
   counts[f+':'+field]+=1
   if e['role']!=old:changes.append({'file':f,'id':e['referenceId'],'from':old,'to':e['role'],'fieldAtPhysicalSpan':field})
 path.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
(P/'step-05-seam4-field-role-sweep.json').write_text(json.dumps({'changedRoles':len(changes),'counts':dict(counts),'changes':changes,'rule':'Use the enclosing serialized field at the exact occurrence; equal alias and sourceCaptureIds strings do not share a role.'},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'changedRoles':len(changes),'counts':dict(counts)}))
