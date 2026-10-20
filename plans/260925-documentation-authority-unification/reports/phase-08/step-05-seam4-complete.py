"""Complete missing source ownership and remaining R5 classifications."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,importlib.util,hashlib,re,copy
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def mod(n):
 s=importlib.util.spec_from_file_location(n,P/(n+'.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
m=mod('step-05-check');rules=mod('step-05-admission-rules');sets={f:[json.loads(l) for l in f.read_text().splitlines()] for f in sorted((P/'step-05-records').glob('*.jsonl'))};rs=[r for a in sets.values() for r in a];by={r['file']:r for r in rs}
for r in rs:
 for d in r['dynamicTraces']:
  if d['admission']=='REJECT' and not d.get('nonDocumentUse'):d['nonDocumentUse']='config-or-metadata' if r['file'].endswith('.md') else 'scalar-pass-through'
  if d['id']=='dynamic-009758':
   d.update(admission='ADMIT',disposition='preserve',role='emitted-document-message',pathOperand=d['operationWitness']['text'],rejectedAsUnrelatedReason=None,reason='L12-72 R6: indexPath is fixed by indexPathFor(repoRoot) to docs/decisions/index.md; this user-visible refusal changes if that fixed path moves. No source-data parity needed to preserve the retained output path.');d.pop('nonDocumentUse',None)
  if d['admission']=='ADMIT' and ('temp_dir(' in d['originalTuple'][4] or 'PathBuf::from("/tmp")' in d['originalTuple'][4]):
   d.update(admission='REJECT',disposition='preserve',role='root-only',nonDocumentUse='root-only',pathOperand=None,rejectedAsUnrelatedReason='L12-72 R5: temporary fixture root only, not a document path.',reason='L12-72 R5: temporary fixture root only '+repr(d['originalTuple'][4])+'.')
for r in rs:
 src=r.get('sourceRenderProvenance',{}).get('sourceFile');sr=by.get(src)
 if not r.get('generated') or not sr:continue
 for d in r['dynamicTraces']:
  if not d.get('sourceOwner'):
   assert d['admission']=='REJECT'
   text=d['originalTuple'][4];lines=m.pinned(sr['authorInputCommit'],src).splitlines();hits=[(n,l.find(text)) for n,l in enumerate(lines,1) if text in l]
   if not hits:
    # Frozen prose tuple may include a scanner prefix; use exact physical rendered line with only generated-header offset removed.
    own=m.pinned(r['authorInputCommit'],r['file']).splitlines()[d['currentLine']-1];hits=[(n,0) for n,l in enumerate(lines,1) if l==own];text=own
   assert hits,(r['file'],d['id'])
   n,col=min(hits,key=lambda h:abs(h[0]-(d['currentLine']-1)));key='author-s4-reject-'+hashlib.sha256((src+str(n)+text).encode()).hexdigest()[:16]
   e=next((e for e in sr['authorAddedReferences'] if e['id']==key),None)
   if not e:
    e={'id':key,'admission':'REJECT','disposition':'preserve','matchedExpression':text,'sourceSpans':[{'line':n,'columnStart':col+1,'columnEndExclusive':col+len(text)+1,'text':text}],'passage':lines[n-1],'passageSpan':{'startLine':n,'endLine':n},'reason':'L12-72 R5: source prose/config scalar, no document operation; '+repr(text),'nonDocumentUse':d['nonDocumentUse'],'resolverWitness':{'inputCommit':sr['authorInputCommit'],'rule':'Own exact source prose/config operation, not a copied output owner.'},'blockedReason':None,'successorNote':None};sr['authorAddedReferences'].append(e)
   d['sourceOwner']={'kind':'step5','file':src,'id':key};d['sourceOwnerDisposition']='preserve'
 for e in r['references']:
  if e['disposition']=='parked':
   e['blockedReason']=r['file']+' follows parked source '+src+': '+str(e['sourceOwner'])+'; '+str(rules.owner(e['sourceOwner'],by).get('blockedReason'))
   e['dependency']=e['blockedReason']
for r in rs:r['parked']=[rules.idof(e) for e in rules.allitems(r) if e['disposition']=='parked']
for f,a in sets.items():f.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in a))
out=rules.check(rs);(P/'step-05-seam4-admission-check-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'count':out['failureCount'],'failures':out['failures'][:20]}))
