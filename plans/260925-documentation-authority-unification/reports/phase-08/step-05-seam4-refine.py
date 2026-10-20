"""Own-operand sweep, persisted source-key witnesses and complete lexical custody."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,re,hashlib,collections,subprocess
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
sha=lambda b:hashlib.sha256(b.encode() if isinstance(b,str) else b).hexdigest()
def save(n,d):(P/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
rs=[r for f in sorted((P/'step-05-records').glob('generators-*.jsonl')) for r in map(json.loads,f.read_text().splitlines())];changes=[]
for r in rs:
 for d in r['dynamicTraces']:
  x=d['originalTuple'][4];reason=None
  if d['admission']=='ADMIT' and (re.match(r'^(?:scope|scoped)\s*=',x) or re.match(r'^(?:contractScope|scopedRoutes)\s*[:|]',x) or 'hasGlobA' in x or 'hasGlobB' in x or x.startswith('DOMAIN_SCOPED_SHAPE =') or x.startswith('PATH_LINE =')):
   reason='Scalar scope/filter/regex metadata or row accumulator, not a document location construction: '+repr(x)
  if reason:
   changes.append({'file':r['file'],'id':d['id'],'from':[d['admission'],d['disposition']],'to':['REJECT','preserve'],'reason':reason})
   d.update(admission='REJECT',disposition='preserve',role='scalar-metadata/guard',reason='L12-71: '+reason,rejectedAsUnrelatedReason=reason,blockedReason=None,stateExportDependency=None,blockedSeams=[],targetSetOrConstruction=None)
  if r['file']=='src/report/knowledge-resolver.mjs':
   reason='L12-71: pure registry currentPath/alias identity lookup '+repr(x)+'. resolveDocPath uses folded view docs/topics, filters live lifecycle/active topic, then aliases and guarded supersession/lineage. This comparison consumes document identity; no filesystem write or alias destination.'
   changes.append({'file':r['file'],'id':d['id'],'from':[d['admission'],d['disposition']],'to':['ADMIT','parked'],'reason':reason})
   block='Bounded topics/docs lineage/currentPath/alias export needed for exact same-input resolution outcomes; no state read here.'
   d.update(admission='ADMIT',disposition='parked',role='document-identity-lookup',reason=reason,rejectedAsUnrelatedReason=None,blockedReason=block,stateExportDependency=block,blockedSeams=['generators'],targetSetOrConstruction='view.docs currentPath / aliases -> live doc(s), supersededBy/lineage fallback, or null')
# Serialized outputs are data; trace key locations in the committed projection, never infer source-state validity.
registry=json.loads((ROOT/'docs/doc-registry.json').read_text());index=json.loads((ROOT/'docs/enduser-docs-index.json').read_text())
sourcekeys=[]
def walk(v,p=''):
 if isinstance(v,dict):
  for k,x in v.items():yield from walk(x,p+'/'+str(k))
 elif isinstance(v,list):
  for i,x in enumerate(v):yield from walk(x,p+'/'+str(i))
 elif isinstance(v,str):yield p,v
values=list(walk(registry));iv=list(walk(index))
for r in rs:
 if r['file'] not in ['docs/doc-registry.json','docs/doc-registry.md','docs/enduser-docs-index.json']:continue
 for e in r['references']:
  expr=e['matchedExpression'];hits=[{'projectionFile':'docs/enduser-docs-index.json' if r['file'].endswith('enduser-docs-index.json') else 'docs/doc-registry.json','jsonPointer':k,'valueSha256':sha(v),'field':k.split('/')[-2] if k.split('/')[-1].isdigit() else k.split('/')[-1]} for k,v in (iv if r['file'].endswith('enduser-docs-index.json') else values) if expr in v]
  e['projectionSourceKeys']=hits
  fields={h['field'] for h in hits}
  if 'sourceCaptureIds' in fields:e['role']='capture/provenance-key'
  elif 'purposeTitle' in fields:e['role']='generated-purposeTitle'
  elif 'aliases' in fields:e['role']='generated-alias-lookup-key'
  elif 'currentPath' in fields or 'docPath' in fields:e['role']='generated-currentPath/docPath'
  e['sourceDataCorrection']='Authorized folded-source export needed; current projection is a locator for source keys, never permission to edit generated output.'
# Every whole-file lexical match must have explicit frozen, prior-slot or added-edge custody.
pattern=r'docs/(?:history|specs|architect|contracts|how-to|explanation|reference|tutorials|decisions)(?![\w-])(?:/[^\s\x22\x27`<>),;]*)?'
lex=[]
for r in rs:
 r['authorAddedReferences']=[]
 if not r['wholeFileRead']:continue
 f=r['file'];ls=(ROOT/f).read_text().splitlines()
 for n,line in enumerate(ls,1):
  for hit in re.finditer(pattern,line):
   refs=[e['referenceId'] for e in r['references'] if any(s['line']==n and s['columnStart']<=hit.end() and s['columnEndExclusive']>hit.start()+1 for s in e['sourceSpans'])]
   slots=[e['edge'].get('slotKey',e['edge']['edgeId']) for e in r['inheritedSourceSlots'] if any(s['line']==n and (s['text'] in hit[0] or hit[0] in s['text']) for s in e['edge'].get('sourceSpans',[]))]
   added=None
   if not refs and not slots:
    identity='author-s4-'+sha(f+'\0'+str(n)+'\0'+str(hit.start())+'\0'+hit[0])[:16]
    retire=bool(re.match(r'docs/(?:specs|architect)(?:/|$)',hit[0]))
    comment=f.endswith(('.mjs','.js','.ts')) and line.lstrip().startswith(('//','/*','*'))
    d='preserve' if comment or not retire or f=='scripts/generate-shipped-path-inventory.mjs' else 'parked'
    block='Post-census/supplemental retiring-root occurrence needs exact source-slot/holder composition at Step7; no invented patch.' if d=='parked' else None
    e={'id':identity,'file':f,'inputCommit':r['authorInputCommit'],'sourceSha256':r['sourceSha256'],'sourceSpans':[{'line':n,'columnStart':hit.start()+1,'columnEndExclusive':hit.end()+1,'text':hit[0]}],'matchedExpression':hit[0],'passage':line,'admission':'ADMIT','disposition':d,'role':'post-census-comment-provenance' if comment else 'post-census-source-occurrence','reason':'L12-71: exact whole-file lexical addition. '+('Comment provenance, not an operative root.' if comment else 'Existing source/default token, no generic root change.'),'blockedReason':block,'dependency':block,'blockedCategory':'step5-parity' if block else None,'dependencyCategory':'step5-parity' if block else None,'timing':'phase9' if block else 'none','target':None,'diffHunk':None,'resolverWitness':{'rule':'Comment provenance; exists at pin; tree retires at Phase9' if retire and comment else 'Literal fixed classifier identity (L12-14)' if f=='scripts/generate-shipped-path-inventory.mjs' else 'Explicit whole-file scope; no parity pass claimed'},'proofCommand':'missing','receiptId':r['receiptIds'][0]}
    r['authorAddedReferences'].append(e);added=identity
   lex.append({'file':f,'line':n,'columnStart':hit.start()+1,'token':hit[0],'referenceIds':refs,'priorSlotKeys':slots,'authorAddedId':added})
 r['parked']=[e['referenceId'] for e in r['references'] if e['disposition']=='parked']+[d['id'] for d in r['dynamicTraces'] if d['disposition']=='parked']+[e['id'] for e in r['authorAddedReferences'] if e['disposition']=='parked']
for fam in ['decision-index','doc-registry','enduser-index','instructions','skills-and-support']:(P/'step-05-records'/('generators-'+fam+'.jsonl')).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs if r['subBatch']==fam))
save('step-05-seam4-own-operand-sweep.json',{'changes':changes,'count':len(changes),'wholeFileLexicalCoverage':lex,'lexicalHits':len(lex),'authorAddedReferences':sum(len(r['authorAddedReferences']) for r in rs)})
# Complete tracked copy surfaces, including non-Markdown distill scripts.
out=json.loads((P/'step-05-seam4-output-provenance.json').read_text());seen={x['path'] for x in out['currentTrackedOutputSet']}
for r in rs:
 p=r['sourceRenderProvenance'];source=p['sourceFile']
 if source and r['file'] not in seen:
  out['currentTrackedOutputSet'].append({'path':r['file'],'sha256':r['sourceSha256'],'bytes':r['wholeFileReadEvidence']['bytes'],'mode':r['sourceMode'],'provenance':r['authorInputCommit']+':'+r['file'],'source':source,'sourceSha256':p['sourceSha256'],'generator':'scripts/build-skill-wrappers.mjs','provenanceStatus':'Byte-equal copy or generated assembly header; no regeneration run'})
out['currentTrackedOutputSet'].sort(key=lambda x:x['path']);save('step-05-seam4-output-provenance.json',out)
parsed={'registrySha256':sha((ROOT/'docs/doc-registry.json').read_bytes()),'enduserIndexSha256':sha((ROOT/'docs/enduser-docs-index.json').read_bytes()),'docIds':sorted(d['docId'] for d in registry['docs']),'currentPaths':sorted(d['currentPath'] for d in registry['docs']),'aliases':sorted({a for d in registry['docs'] for a in d.get('aliases',[])}),'sourceCaptureIds':sorted({a for d in registry['docs'] for a in d.get('sourceCaptureIds',[])}),'purposeTitles':[{'topicId':t['topicId'],'purposeTitle':t.get('purposeTitle')} for t in registry['topics']],'enduserPathCaptureSet':[{'docPath':d['docPath'],'sourceCaptureId':d.get('sourceCaptureId')} for d in index],'authoritative_for':None,'limit':'Tracked projection sets, not source export verification. authoritative_for is carried by document frontmatter and requires same-input on-disk source proof.'}
save('step-05-seam4-parsed-current-sets.json',parsed)
print(json.dumps({'operandCorrections':len(changes),'lexicalHits':len(lex),'authorAdded':sum(len(r['authorAddedReferences']) for r in rs),'outputs':len(out['currentTrackedOutputSet'])}))
