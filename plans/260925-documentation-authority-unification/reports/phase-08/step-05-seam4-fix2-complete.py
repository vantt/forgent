"""Finish L12-74 joins, root sweep and source-only proposed patch accounting."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,re,copy,importlib.util,collections,difflib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def mod(n):
 sp=importlib.util.spec_from_file_location(n,P/(n+'.py'));m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
m=mod('step-05-check');s4=mod('step-05-seam4-check');a=m.admission;sha=m.sha
paths=sorted((P/'step-05-records').glob('*.jsonl'));sets={p:[json.loads(l) for l in p.read_text().splitlines()] for p in paths};rs=[r for v in sets.values() for r in v];by={r['file']:r for r in rs};lookup={a.idof(e):(r,e) for r in rs for e in a.allitems(r)}
def save(n,x):(P/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def setad(id,ad,p=None,cat='guard'):
 r,e=lookup[id];e.update(admission=ad,disposition='preserve',blockedReason=None,stateExportDependency=None,blockedSeams=[],reason='L12-74 verified own operation '+repr(e['originalTuple'][4])+': '+('document path operation.' if ad=='ADMIT' else cat+'; no document operand.'))
 if ad=='REJECT':e.update(nonDocumentUse=cat,pathOperand=None,role=cat,rejectedAsUnrelatedReason=e['reason']);e.pop('pathOperandWitness',None)
 else:
  p=p or e.get('pathOperand') or e['originalTuple'][4];c=e['currentPassage'];ls=c['text'].splitlines();i=next(i for i,l in enumerate(ls) if p.split('\n')[0] in l);col=ls[i].index(p.split('\n')[0])+1;assert p in c['text'];e.update(pathOperand=p,nonDocumentUse=None,rejectedAsUnrelatedReason=None);e['pathOperandWitness']={'text':p,'line':c['startLine']+i,'columnStart':col,'columnEndExclusive':col+len(p.split('\n')[0]),'why':'Exact document path operand; fixed-root or real reader convention.'}
 if e.get('parityObligation'):e['parityObligation']['blocker']=None

# Whole-expression decisions; independent arguments remain independently classified.
for n in [7551,7783,7784,7785,7786,7793,7794,7795,7835,7839,7840]:setad('dynamic-'+f'{n:06}','REJECT',cat='accumulator' if n in [7835,7839,7840] else 'guard' if n<7793 else 'finding-path-field')
for n,p in [(7708,'argv[toIdx + 1]'),(7709,'argv[sourceIdx + 1]')]:setad('dynamic-'+f'{n:06}','ADMIT',p=p)
# Relative()+join('/') is one construction; the guard on that result remains a guard.
setad('dynamic-015212','ADMIT',p='rel')
for n in [7835,7839,7840]:lookup['dynamic-'+f'{n:06}'][1]['rootSetWitness']='SHIPPED_SURFACE_DIRS is the fixed docs/core/domains/plugins source surface at L454/455/608/612/615; this item only accumulates/sorts/serializes found path values.'
# Keep separate path tokens in the same emitted literal separate (R7).
r,e=lookup['dynamic-014307'];e['operationWitness']={k:v for k,v in e['pathOperandWitness'].items() if k in ['line','columnStart','columnEndExclusive']}
# Genuine fixed-root message operands, not their whole prose strings.
for n,p in [(7342,'OWNER_ROOT'),(7664,'INVENTORY_MANIFEST_PATH'),(13905,'computed.destinationRelativePath'),(13908,'computed.destinationRelativePath'),(14318,'manifestPathFor(root)'),(14334,'indexPathFor(root)'),(14335,'indexPathFor(root)'),(14336,'indexPathFor(root)'),(14337,'indexPathFor(root)'),(14329,'manifestRelPath'),(14330,'manifestRelPath'),(14342,'result.path'),(14343,'result.path'),(14344,'result.path')]:
 r,e=lookup['dynamic-'+f'{n:06}']
 if p in e['currentPassage']['text']:setad(e['id'],'ADMIT',p=p)
# R11 sweep: pinned path-constant/import closure, not neighbouring plans mentions.
rootchanges=[]
for r in rs:
 for e in a.allitems(r):
  if not a.plans_only(r,e):continue
  old=[e['admission'],e['disposition'],e.get('nonDocumentUse')]
  if 'originalTuple' in e:setad(e['id'],'REJECT',cat='plans-report-artifact')
  else:e.update(admission='REJECT',disposition='preserve',nonDocumentUse='plans-report-artifact',blockedReason=None,dependency=None,blockedCategory=None,dependencyCategory=None,timing='none',reason='L12-74 R11: plans report/ledger artifact is outside the document census.')
  rootchanges.append({'file':r['file'],'id':a.idof(e),'from':old,'to':[e['admission'],e['disposition'],e.get('nonDocumentUse')],'rootEvidence':sorted(a.expression_roots(r['authorInputCommit'],r['file'],(e.get('originalTuple') or [None]*5)[4] or e.get('matchedExpression','')))})

# R2 exact occurrence joins, aligned by source bytes including generated headers.
ownerchanges=[]
for r in rs:
 sf=r.get('sourceRenderProvenance',{}).get('sourceFile')
 if not r.get('generated') or not sf or sf not in by:continue
 sr=by[sf];src=m.pinned(sr['authorInputCommit'],sf).splitlines();gen=m.pinned(r['authorInputCommit'],r['file']).splitlines();mapping={j+i+1:k+i+1 for k,j,n in difflib.SequenceMatcher(None,src,gen,autojunk=False).get_matching_blocks() for i in range(n)}
 for e in r['references']:
  n=e['sourceSpans'][0]['line'] if e['sourceSpans'] else None;sn=mapping.get(n);expr=e['matchedExpression'];candidates=[]
  for o in sr['references']+sr.get('authorAddedReferences',[]):
   if o.get('matchedExpression')==expr and any(s['line']==sn for s in o.get('sourceSpans',[])):candidates.append((o,{'kind':'step5','file':sf,'id':a.idof(o)}))
  for i,x in enumerate(sr.get('inheritedSourceSlots',[])):
   o=x['edge']
   if any(s['line']==sn and (expr in s['text'] or s['text'] in expr) for s in o.get('sourceSpans',[])):candidates.append((o,{'kind':'inheritedSourceSlots','file':sf,'index':i}))
  if candidates:
   existing=a.owner(e['sourceOwner'],by)
   if any(s['line']==sn for s in existing.get('sourceSpans',[])):
    o,loc=existing,e['sourceOwner']
   else:o,loc=candidates[0]
   if loc!=e.get('sourceOwner'):ownerchanges.append({'file':r['file'],'id':a.idof(e),'from':e.get('sourceOwner'),'to':loc,'generatedLine':n,'sourceLine':sn})
   e.update(sourceOwner=loc,sourceOwnerDisposition=o['disposition'])
  else:o=a.owner(e['sourceOwner'],by)
  e['sourceOwnerDisposition']=o['disposition'];e['disposition']='parked' if o['disposition']=='parked' else 'render-join';e['reason']='L12-74 R2 exact source occurrence '+sf+':'+str(sn)+'; generated bytes follow their canonical owner.'
  if e['disposition']=='parked':
   purpose=('Inline tier choice must retain the Native-First reasoning/no-extra-judge rationale; resolve the missing numbered doctrine citation to its bounded governing passage.' if 'executor-dispatch-fallback' in sf and sn and sn<280 else 'The dispatch reference list needs the governing Native-First rules governing decide, rather than a missing numbered citation; establish that exact navigation target.' if 'executor-dispatch-fallback' in sf else 'Clarifying must leave scope/architecture reasoning inline under doctrine rule two; resolve the missing retired citation to the conserved rule passage.' if 'clarifying' in sf else 'Knowledge synthesis needs the conserved registry source-capture attestation contract from section 7.4 before replacing its retired architecture pointer.')
   b=r['file']+' follows parked source '+sf+': '+purpose;e.update(blockedReason=b,dependency=b,blockedCategory='source-owner',dependencyCategory='source-owner')
 for d in r['dynamicTraces']:
  o=a.owner(d['sourceOwner'],by);d['sourceOwnerDisposition']=o['disposition'];d['admission']=o['admission'];d['disposition']='parked' if o['disposition']=='parked' else 'render-join' if o['admission']=='ADMIT' else 'preserve'
# Frozen classifier blockers name concrete field decisions, not just the quoted prefix.
r=by['scripts/generate-shipped-path-inventory.mjs']
for e in a.allitems(r):
 if e['disposition']!='parked':continue
 n=e.get('currentLine') or e['sourceSpans'][0]['line'];ls=m.pinned(r['authorInputCommit'],r['file']).splitlines();line=ls[n-1]
 if 'startsWith' not in line:
  # Lists and dated prose carry gate identity, not a prefix classifier edit.
  e.update(disposition='preserve',blockedReason=None,dependency=None,blockedCategory=None,dependencyCategory=None,timing='none',reason='L12-74 R13 frozen-gate identity; this is a list/provenance carrier, not a retired-root classifier prefix.',resolverWitness={'rule':'Frozen-B identity; tree retires at Phase 9; no source mutation now.'});continue
 context='\n'.join(ls[max(0,n-5):n+7]);intent=('contractScope taxonomy must stop treating retired area trees as repository source contracts' if n<250 else 'referenceKind and sourceRole classification must handle the retired architecture carrier independently of missing-file examples' if n<430 and 'architect' in line else 'referenceKind and sourceRole classification must stop treating the retired specification prefix as a live spec carrier' if n<430 else 'shipped audit note must distinguish retired sources from live rewrite targets')
 b=r['file']+': Classifier prefixes for retired trees must change in the same Phase 9 cut; frozen-B lifts only at Phase 9. '+intent+'.';e.update(blockedReason=b,dependency=b)
# Refresh all cached park lists after final outcomes.
for r in rs:r['parked']=[a.idof(e) for e in a.allitems(r) if e['disposition']=='parked']
for p,records in sets.items():p.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in records))
save('step-05-seam4-fix2-root-sweep.json',{'rule':'R11 pinned declaration/import root closure','operations':rootchanges})
save('step-05-seam4-fix2-owner-joins.json',{'rule':'R2 occurrence alignment, not text-first owner selection','changes':ownerchanges})
print(json.dumps({'plansOperations':len(rootchanges),'ownerRepoints':len(ownerchanges)}))
