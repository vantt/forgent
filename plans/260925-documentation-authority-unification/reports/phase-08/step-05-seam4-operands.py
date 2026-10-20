"""Bind exact own subexpressions and reconcile every shared operation, records only."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,re,copy,importlib.util,collections
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def module(n):
 sp=importlib.util.spec_from_file_location(n,P/(n+'.py'));m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
m=module('step-05-check');rules=module('step-05-admission-rules')
files=sorted((P/'step-05-records').glob('*.jsonl'));sets={f:[json.loads(l) for l in f.read_text().splitlines()] for f in files};rs=[r for a in sets.values() for r in a];by={r['file']:r for r in rs}
def idof(e):return e.get('referenceId',e.get('id'))
def source(r):return m.pinned(r['authorInputCommit'],r['file']) if r.get('wholeFileRead',True) else ''
def clear(d):
 d.update(blockedReason=None,stateExportDependency=None,blockedSeams=[])
 if d.get('parityObligation'):d['parityObligation']['blocker']=None

def balanced(s,start):
 # Return one exact call expression, including nested strings/templates.
 op=s.find('(',start)
 if op<0:return s[start:]
 depth=0;quote=None;escape=False
 for i in range(op,len(s)):
  c=s[i]
  if escape:escape=False;continue
  if c=='\\':escape=True;continue
  if quote:
   if c==quote:quote=None
   continue
  if c in ['"',"'",'`']:quote=c;continue
  if c=='(':depth+=1
  if c==')':
   depth-=1
   if depth==0:return s[start:i+1]
 return s[start:].rstrip(';')
# Per tuple: take own exact expression. Prefix assignments in frozen census
# are locators only; expand to the complete RHS call in the current source.
for r in rs:
 src=source(r);ls=src.splitlines()
 for d in r['dynamicTraces']:
  if r.get('generated') and not r.get('sourceRenderProvenance',{}).get('sourceFile'):
   d.update(admission='REJECT',disposition='preserve',role='generated-data-text',nonDocumentUse='generated-data-text',pathOperand=None,rejectedAsUnrelatedReason='L12-72 R5: scanner tuple is committed generated table/data text, not an executable path operation.',reason='L12-72: generated data text '+repr(d['originalTuple'][4])+'; literal payload references retain their source-data owners.');clear(d)
  n=d.get('currentLine');x=d['originalTuple'][4];c=d['currentPassage']
  if not n:
   # Non-document release output relocation: rebind real own input at current pin.
   choices=[i for i,l in enumerate(ls,1) if (x in l or x.split(' = ')[0]+' =' in l)]
   if choices:n=choices[0];d['currentLine']=n;a=max(1,n-3);b=min(len(ls),n+3);d['currentPassage']={'startLine':a,'endLine':b,'text':'\n'.join(ls[a-1:b])};c=d['currentPassage']
  if not n or not ls:
   d['operationWitness']=None;continue
  l=ls[n-1];pos=l.find(x)
  if pos>=0:expr=x
  else:
   seed=x.split(' = ')[0].split(':')[0].strip('` ');pos=l.find(seed)
   if pos<0:pos=max(0,min(len(l)-1,d['originalTuple'][1]-1))
   expr=l[pos:].strip().rstrip(';')
  if d['admission']=='ADMIT':
   # Drop a declaration LHS; the RHS is the actual path-yielding expression.
   if re.match(r'^[\w.]+\s*=\s*',expr):
    off=re.match(r'^[\w.]+\s*=\s*',expr).end();pos+=off;expr=expr[off:]
   elif re.match(r'^\w+\s*:\s*',expr):
    off=re.match(r'^\w+\s*:\s*',expr).end();pos+=off;expr=expr[off:]
   # Extend truncated function-call census fragments through the closing paren.
   if '(' in expr and expr.count('(')>expr.count(')'):
    expr=balanced(l,pos)
   # Exact multiline RHS is acceptable and stays inside currentPassage.
   if not expr or expr not in c['text']:
    call=re.search(r'(?:path\.(?:posix\.)?(?:join|resolve|relative|dirname)|\w+\.join|fs\.(?:existsSync|readFileSync)|\w*PathFor)\(',l)
    if call:pos=call.start();expr=balanced(l,pos)
    else:expr=l[pos:].rstrip(';')
   d['pathOperand']=expr;d.pop('nonDocumentUse',None)
  else:d['pathOperand']=None
  d['operationWitness']={'line':n,'columnStart':pos+1,'columnEndExclusive':pos+1+len(expr.split('\n')[0]),'text':expr,'method':'Exact own source expression; context-window overlap is not operation identity.'}
  if d['admission']=='ADMIT':d.setdefault('operationChain',{})['input']=expr;d['operationChain']['operation']=l.strip()
# Join all transitive overlapping operation intervals. Prefer a real document
# operand over a nested formatting false negative; scalar operations stay reject.
joinhits=[]
for r in rs:
 items=rules.allitems(r);parent={idof(e):idof(e) for e in items};lookup={idof(e):e for e in items}
 def root(k):
  while parent[k]!=k:k=parent[k]
  return k
 for a,b in rules.pairs(r):parent[root(idof(b))]=root(idof(a))
 groups=collections.defaultdict(list)
 for e in items:groups[root(idof(e))].append(e)
 for group in groups.values():
  if len(group)<2:continue
  states={(e['admission'],rules.effective(e)) for e in group}
  if len(states)==1:continue
  admitted=[e for e in group if e['admission']=='ADMIT']
  # Physical document literals and positive path operations own admission.
  chosen=next((e for e in admitted if e.get('disposition')=='patch'),None) or next((e for e in admitted if 'originalTuple' not in e),None) or (admitted[0] if admitted else group[0])
  for e in group:
   wanted=(chosen['admission'],rules.effective(chosen))
   if (e['admission'],rules.effective(e))==wanted:continue
   # A source/render owner wins on a generated record; rendered refs stay render-join.
   old=(e['admission'],e['disposition']);e['admission']=wanted[0]
   e['disposition']='render-join' if r.get('generated') and 'originalTuple' not in e and wanted[1]!='parked' else wanted[1]
   if 'originalTuple' in e:
    if wanted[0]=='ADMIT':
     e.pop('nonDocumentUse',None);e['pathOperand']=e['operationWitness']['text'];e['role']='document-path-operation';e['rejectedAsUnrelatedReason']=None
    else:e['pathOperand']=None;e['nonDocumentUse']=chosen.get('nonDocumentUse','scalar-pass-through');e['rejectedAsUnrelatedReason']='L12-72 R7: same actual operation as '+str(idof(chosen))+'.'
   if wanted[1]!='parked':clear(e)
   else:
    e['blockedReason']=chosen['blockedReason']
    if 'originalTuple' in e:e['stateExportDependency']=chosen.get('stateExportDependency') or chosen.get('dependency');e['blockedSeams']=['generators']
   if wanted[1]=='patch' and 'originalTuple' not in e:
    for k in ['target','anchor','proposedReplacement','diffHunk','timing']:e[k]=chosen.get(k)
   e['reason']='L12-72 R7: exact own operation overlaps '+str(idof(chosen))+'; follows its document outcome. Own operand '+repr(e.get('matchedExpression') or e['originalTuple'][4])+'.'
   joinhits.append({'file':r['file'],'id':idof(e),'owner':idof(chosen),'from':old,'to':[e['admission'],e['disposition']]})
# Generated script tuples follow corrected source operation, including newly
# admitted nested operands. Every copy has an independently pinned witness.
for r in rs:
 src=r.get('sourceRenderProvenance',{}).get('sourceFile')
 if not r.get('generated') or src not in by:continue
 for d in r['dynamicTraces']:
  if not d.get('sourceOwner'):continue
  o=rules.owner(d['sourceOwner'],by)
  for k in ['admission','disposition','role','nonDocumentUse','reason','rejectedAsUnrelatedReason','stateExportDependency','blockedReason','blockedSeams']:
   if k in o:d[k]=copy.deepcopy(o[k])
   else:d.pop(k,None)
  d['sourceOwnerDisposition']=o['disposition'];d['pathOperand']=d['operationWitness']['text'] if o['admission']=='ADMIT' else None
  if d['disposition']=='parked':d['blockedReason']=r['file']+' source owner '+src+':'+o['id']+' parked: '+o['blockedReason'];d['stateExportDependency']=d['blockedReason']
for r in rs:
 r['parked']=[idof(e) for e in rules.allitems(r) if e['disposition']=='parked']
for f,a in sets.items():f.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in a))
(P/'step-05-seam4-passage-corrections.json').write_text(json.dumps({'changes':joinhits,'count':len(joinhits)},ensure_ascii=False,indent=2)+'\n')
out=rules.check(rs);(P/'step-05-seam4-admission-check-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print('join changes',len(joinhits),'rules failures',out['failureCount']);print(json.dumps(out['failures'][:35],ensure_ascii=False,indent=2))
