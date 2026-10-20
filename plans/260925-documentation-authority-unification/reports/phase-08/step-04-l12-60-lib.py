"""Pinned whole-file scan and qualified census joins for the L12-60 audit."""
import sys
sys.dont_write_bytecode=True
import re,json,pathlib,subprocess,difflib,functools
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3];PIN='dc24ce64527fbffd23e1643f35a7ddf808fd7b45'
@functools.lru_cache(None)
def blob(pin,f):return subprocess.check_output(['git','show',pin+':'+f],cwd=ROOT).decode()
@functools.lru_cache(None)
def linesmap(old,new,f):
 a=blob(old,f).splitlines();b=blob(new,f).splitlines();out={}
 for i,j,n in difflib.SequenceMatcher(None,a,b,autojunk=False).get_matching_blocks():
  for k in range(n):out[i+k+1]=j+k+1
 return out

def relocate(old,new,f,ss):
 if old==new:return ss
 a=blob(old,f).splitlines();b=blob(new,f).splitlines();mp=linesmap(old,new,f);out=[]
 for s in ss:
  n=s['line'];line=mp.get(n)
  if line is None:
   hits=[i for i,l in enumerate(b,1) if l==a[n-1]]
   assert len(hits)==1,(f,n,'full line relocation ambiguous',hits);line=hits[0]
  assert b[line-1][s['columnStart']-1:s['columnEndExclusive']-1]==s['text'],(f,n,s)
  out.append({**s,'line':line})
 return out

@functools.lru_cache(None)
def inventories():
 pop=json.loads((P/'step-04-population.json').read_text());out=[]
 for name,pin in pop['inputPins'].items():
  for e in json.loads((P/name).read_text())['entries']:
   f=e.get('consumerPath',e.get('path'));eid=e.get('edgeId',e.get('id'))
   spans=e.get('physicalSpans')
   if not spans:
    if e.get('line'):
     text=e.get('matchedExpression','');line=e['line'];ls=blob(pin['commit'],f).splitlines();col=ls[line-1].find(text)+1
     spans=[{'line':line,'columnStart':col,'columnEndExclusive':col+len(text),'text':text}]
    else:
     spans=[]
     for occ in e.get('occurrences',[]):
      line=occ['line'];texts=occ.get('matchedExpressions',[]);texts=[texts] if isinstance(texts,str) else texts
      for text in texts:
       for m in re.finditer(re.escape(text),blob(pin['commit'],f).splitlines()[line-1]):spans.append({'line':line,'columnStart':m.start()+1,'columnEndExclusive':m.end()+1,'text':m[0]})
   out.append({'inventory':name,'inputCommit':pin['commit'],'entry':e,'file':f,'edgeId':eid,'spans':spans})
 return out

def prose_file(f):return (f.endswith('.md') and (f in ['AGENTS.md','CLAUDE.md'] or f.startswith(('core/','domains/','.agents/','.claude/','plugins/')))) or (f.endswith('.txt') and '/prompt-templates/' in f)
def history(f):return f.startswith(('archive/','plans/','docs/history/')) or f=='CHANGELOG.md'
def fence_at(body,n):
 fence=None
 for i,l in enumerate(body.splitlines(),1):
  m=re.match(r'^\s*(`{3,}|~{3,})',l)
  if m:fence=None if fence and m[1][0]==fence[0] else m[1]
  if i==n:return bool(fence) or bool(m)
 return False

def docs_paths(body):
 ls=body.splitlines();out=[]
 for n,l in enumerate(ls,1):
  for m in re.finditer(r'(?<![\w/])docs/[^\s`\x22\x27()\[\]{},;]+',l):
   text=m[0].rstrip('.,:');ss=[{'line':n,'columnStart':m.start()+1,'columnEndExclusive':m.start()+1+len(text),'text':text}]
   if text.endswith(('/','-')) and n<len(ls):
    nxt=re.match(r'^\s*(?://!?|\*|#|>)?\s*([A-Za-z0-9_<][A-Za-z0-9_./<>-]*\.(?:md|json|yaml)|[A-Za-z0-9_.-]+/[^\s`\x22\x27()]+)',ls[n])
    if nxt:
     t=nxt[1].rstrip('.,:');ss.append({'line':n+1,'columnStart':nxt.start(1)+1,'columnEndExclusive':nxt.start(1)+1+len(t),'text':t})
   out.append({'path':''.join(x['text'] for x in ss).split('#')[0],'spans':ss})
 return out

def covers(es,f,ss):
 return any(e['consumerFile']==f and all(any(s['line']==t['line'] and t['columnStart']<=s['columnStart'] and s['columnEndExclusive']<=t['columnEndExclusive'] for t in e['sourceSpans']) for s in ss) for e in es)
