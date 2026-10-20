import pathlib,json,importlib.util,subprocess,hashlib
P=pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-08');ROOT=pathlib.Path.cwd()
sp=importlib.util.spec_from_file_location('a',P/'step-05-admission-rules.py');a=importlib.util.module_from_spec(sp);sp.loader.exec_module(a)
files=sorted((P/'step-05-records').glob('*.jsonl'));sets={p:[json.loads(l) for l in p.read_text().splitlines()] for p in files};rs=[r for v in sets.values() for r in v];lookup={a.idof(e):(r,e) for r in rs for e in a.allitems(r)}
for n,p in [(7708,'argv[toIdx + 1]'),(7709,'argv[sourceIdx + 1]')]:
 r,e=lookup['dynamic-'+f'{n:06}'];c=e['currentPassage'];line=c['text'].splitlines()[e['currentLine']-c['startLine']];col=line.index(p)+1;e.update(admission='ADMIT',disposition='preserve',nonDocumentUse=None,pathOperand=p,rejectedAsUnrelatedReason=None,reason='L12-74 R7 real carryForwardIdentityRegistry source/toSource path input is re-read at the commit; preserve frozen-gate convention. Own operand '+repr(e['originalTuple'][4])+'.');e['pathOperandWitness']={'text':p,'line':e['currentLine'],'columnStart':col,'columnEndExclusive':col+len(p),'why':'Exact source file input consumed by the gate read, not finding metadata.'}
for n in [7847,7848,7850,7851]:
 r,e=lookup['dynamic-'+f'{n:06}'];p='SHIPPED_SURFACE_DIRS';c=e['currentPassage'];ls=c['text'].splitlines();i=e['currentLine']-c['startLine'];col=ls[i].index(p)+1;e.update(admission='ADMIT',disposition='preserve',nonDocumentUse=None,pathOperand=p,rejectedAsUnrelatedReason=None,reason='L12-74 R16 fixed SHIPPED_SURFACE_DIRS default; same admission across L454/455/608/612/615. Own operand '+repr(e['originalTuple'][4])+'.');e['pathOperandWitness']={'text':p,'line':e['currentLine'],'columnStart':col,'columnEndExclusive':col+len(p),'why':'Fixed shipped document/source default, even when overridable.'}
for n in [9168,9169,9170]:
 r,e=lookup['dynamic-'+f'{n:06}'];e.update(nonDocumentUse='plans-report-artifact',role='plans-report-artifact',reason='L12-74 R11 HISTORICAL_PLAN_HASHES supplies plans/** relPath rows only; own operand '+repr(e['originalTuple'][4])+'.')
for n in [15055,15058]:
 r,e=lookup['dynamic-'+f'{n:06}'];p='packagedRelPath';c=e['currentPassage'];i=e['currentLine']-c['startLine'];line=c['text'].splitlines()[i];col=line.index(p)+1;e['pathOperand']=p;e['pathOperandWitness']={'text':p,'line':e['currentLine'],'columnStart':col,'columnEndExclusive':col+len(p),'why':'packagedRelPath is the fixed skills/<name>/SKILL.md packaged document convention; preserve.'}
for n in [161,182]:
 r,e=lookup['reference-'+f'{n:06}'];b=r['file']+': '+('The gateway token reader promises missing global config/token refuses startup and never self-provisions; distribution row 5b exists only in source-detail carriage, so the conserved startup refusal contract needs a live holder before rewriting this citation.' if n==161 else 'The module auth overview promises only fgos setup creates the machine global config with gateway.token; distribution row 5b remains in source-detail carriage and the live doctor reversal/gloss does not conserve that exact exclusive-writer claim. Carry or reconcile the auth overview claim before retargeting it.');e.update(blockedReason=b,dependency=b,reason='L12-74: '+b)
for r in rs:
 for e in a.allitems(r):
  if e['admission']=='ADMIT':
   e['proofCommand']=e.get('proofCommand') or 'missing';e.setdefault('proofScope','Records-only source evidence; same-input cutover/runtime proof remains missing in the owning receipt.')
   if not e.get('parityObligation'):e['parityObligation']={'current':e.get('pathOperand') or e.get('matchedExpression'),'candidate':e.get('proposedReplacement') or e.get('pathOperand') or e.get('matchedExpression'),'comparison':'Retain exact document convention or source-only pointer correction; Phase 9 owns same-input comparison of affected output, status/category and path sets.','blocker':e.get('blockedReason')}
  if e['disposition']=='patch' and 'originalTuple' not in e:e['aliasWriteCheck']={'isWriter':False,'destinationIsAlias':False,'evidence':'Source navigation comment/message correction only, no file write destination adopts an alias.'}
  if a.idof(e)=='reference-000277':e['role']='usage-placeholder';e['nonDocumentUse']='caller-data-formatting';e['reason']+=' Own pinned passage '+repr(e['passage'])+'.'
 r['parked']=[a.idof(e) for e in a.allitems(r) if e['disposition']=='parked']
# Per-file frozen identity witness, shared by its gate path operations.
for r in rs:
 f=r['file']
 if f.startswith('scripts/check-doc-') or f.startswith('scripts/verify-phase-0') or f in ['scripts/propose-doc-decisions.mjs','scripts/generate-doc-inventory.mjs','scripts/doc-alias-resolver.mjs','scripts/doc-binding-repair.mjs','scripts/generate-shipped-path-inventory.mjs']:
  r['frozenGateIdentityWitness']={'inputCommit':r['authorInputCommit'],'sourceSha256':r['sourceSha256'],'rule':'L12-74 R13 frozen-gate identity; Phase 9 owns the final gate cut. Frozen-B classifier prefixes have separately recorded obligations.'}
# Independent retained-root operands omitted by the original census patterns.
for file,n,expr,occurrence in [('src/cli/command-registry.mjs',1415,'README.md',0),('src/setup/registrations.mjs',3518,'README.md',1)]:
 r=next(r for r in rs if r['file']==file);text=a.source_at(r['authorInputCommit'],file);ls=text.splitlines();line=ls[n-1];matches=list(__import__('re').finditer(__import__('re').escape(expr),line));col=matches[occurrence].start()+1
 if any(any(sp['line']==n and sp['columnStart']==col and sp['text']==expr for sp in e.get('sourceSpans',[])) for e in a.allitems(r) if 'originalTuple' not in e):continue
 e=__import__('copy').deepcopy(next(e for e in r['authorAddedReferences'] if e.get('disposition')=='preserve'))
 e.update(id='author-s4-fix2-'+hashlib.sha256((file+':'+str(n)+':'+str(col)+':'+expr).encode()).hexdigest()[:16],matchedExpression=expr,sourceSpans=[{'line':n,'columnStart':col,'columnEndExclusive':col+len(expr),'text':expr}],passageSpan={'startLine':n-3,'endLine':n+3},passage='\n'.join(ls[n-4:n+3]),reason='L12-74 R3/R16: this independent README.md token emits the fixed retained root-document convention.',resolverWitness={'rule':'Retained README.md root convention, independently pinned token.','inputCommit':r['authorInputCommit']},target=None,anchor=None,proposedReplacement=None,diffHunk=None)
 e.pop('physicalPriorJoins',None);r['authorAddedReferences'].append(e)
for r in rs:
 for e in r.get('authorAddedReferences',[]):
  if e['id'].startswith('author-s4-fix2'):
   e['parityObligation']={'current':e['matchedExpression'],'candidate':e.get('proposedReplacement') or e['matchedExpression'],'comparison':'Exact own document convention or source-only pointer; no runtime/cutover execution is claimed.','blocker':e.get('blockedReason')}
# Align the inherited source witness as well as sourceOwner to the occurrence.
by={r['file']:r for r in rs}
for r in rs:
 if not r.get('generated') or not r.get('sourceRenderProvenance',{}).get('sourceFile'):continue
 for e in r['references']:
  loc=e.get('sourceOwner')
  if not loc:continue
  sr=by[loc['file']];owner=a.owner(loc,by);candidate=None
  if loc['kind']=='inheritedSourceSlots':candidate=sr['inheritedSourceSlots'][loc['index']]
  else:
   for x in sr.get('inheritedSourceSlots',[]):
    if any(sp['line']==op['line'] and (sp['text'] in op['text'] or op['text'] in sp['text']) for sp in x['edge'].get('sourceSpans',[]) for op in owner.get('sourceSpans',[])):
     candidate=x;break
  if candidate and e.get('resolverWitness',{}).get('sourceRecord'):
   w=e['resolverWitness'];w['sourceSlotKey']=candidate['edge'].get('slotKey');w['sourceExpression']=candidate['edge']['matchedExpression'];w['sourceDisposition']=candidate['edge']['disposition'];w['sourceRecord'].update(recordFile=candidate['recordFile'],recordLine=candidate['recordLine'],recordSha256=candidate['recordSha256'])
for p,v in sets.items():p.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in v))
# Static tracked output metadata predates the already-accounted main merge.
p=P/'step-05-seam4-output-provenance.json';o=json.loads(p.read_text());changes=[];pin=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
for e in o['currentTrackedOutputSet']:
 b=(ROOT/e['path']).read_bytes();h=hashlib.sha256(b).hexdigest()
 if h!=e['sha256']:
  committed=subprocess.check_output(['git','show',pin+':'+e['path']]);assert b==committed
  changes.append({'path':e['path'],'fromSha256':e['sha256'],'toSha256':h,'commit':pin,'reason':'L12-73 already-accounted main merge refreshed fgos-run generated skill and canonical source outside authored Step 5 consumer population.'});e.update(sha256=h,bytes=len(b),provenance=pin+':'+e['path'])
 if e.get('sourceSha256'):
  b=(ROOT/e['source']).read_bytes();e['sourceSha256']=hashlib.sha256(b).hexdigest()
p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n');(P/'step-05-seam4-fix2-static-output-refresh.json').write_text(json.dumps({'notGeneratedThisTurn':True,'changes':changes or (json.loads((P/'step-05-seam4-fix2-static-output-refresh.json').read_text())['changes'] if (P/'step-05-seam4-fix2-static-output-refresh.json').exists() else [])},ensure_ascii=False,indent=2)+'\n')
