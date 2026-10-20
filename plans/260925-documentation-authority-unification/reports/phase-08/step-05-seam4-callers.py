"""Enclosing function ownership from balanced source blocks, excluding strings/comments/regex."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,re,collections
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def mask(text):
 out=list(text);n=len(text);i=0;last=''
 def blank(a,b):
  for j in range(a,b):
   if out[j]!='\n':out[j]=' '
 while i<n:
  if text.startswith('//',i):
   end=text.find('\n',i);end=n if end<0 else end;blank(i,end);i=end;continue
  if text.startswith('/*',i):
   end=text.find('*/',i+2);end=n if end<0 else end+2;blank(i,end);i=end;continue
  ch=text[i]
  if ch in "'\"`":
   q=ch;j=i+1
   while j<n:
    if text[j]=='\\':j+=2;continue
    if text[j]==q:j+=1;break
    j+=1
   blank(i,j);i=j;last='v';continue
  if ch=='/' and (not last or last in '=(:,[!&|?{;' or re.search(r'\b(?:return|case)\s*$',text[:i])):
   j=i+1;bracket=False
   while j<n:
    if text[j]=='\\':j+=2;continue
    if text[j]=='[':bracket=True
    elif text[j]==']':bracket=False
    elif text[j]=='/' and not bracket:
     j+=1
     while j<n and text[j].isalpha():j+=1
     break
    if text[j]=='\n':break
    j+=1
   blank(i,j);i=j;last='v';continue
  if not ch.isspace():last=ch
  i+=1
 return ''.join(out)
def functions(text):
 masked=mask(text);found=[]
 for m in re.finditer(r'\b(?:async\s+)?function\s+(\w+)\s*\(',masked):
  p=masked.index('(',m.start());depth=1;j=p+1
  while j<len(masked) and depth:
   if masked[j]=='(':depth+=1
   elif masked[j]==')':depth-=1
   j+=1
  while j<len(masked) and masked[j].isspace():j+=1
  if j>=len(masked) or masked[j]!='{':continue
  start=j;depth=1;j+=1
  while j<len(masked) and depth:
   if masked[j]=='{':depth+=1
   elif masked[j]=='}':depth-=1
   j+=1
  line=text.count('\n',0,m.start())+1;end=text.count('\n',0,j)+1
  found.append({'line':line,'endLine':end,'declaration':text.splitlines()[line-1].strip(),'function':m[1]})
 return found
changes=[]
for path in sorted((P/'step-05-records').glob('generators-*.jsonl')):
 rs=list(map(json.loads,path.read_text().splitlines()))
 for r in rs:
  f=r['file']
  if not f.endswith(('.mjs','.js')) or not r['wholeFileRead']:continue
  text=(ROOT/f).read_text();fs=functions(text);ls=text.splitlines()
  for d in r['dynamicTraces']:
   if d['currentLine'] is None:continue
   n=d['currentLine'];candidates=[fn for fn in fs if fn['line']<=n<=fn['endLine']];own=min(candidates,key=lambda x:x['endLine']-x['line']) if candidates else {'line':1,'endLine':len(ls),'declaration':'module data / top-level entry','function':None}
   call={'line':own['line'],'declaration':own['declaration']}
   old=d['caller']
   if old!=call:changes.append({'file':f,'id':d['id'],'old':old,'new':call})
   d['caller']=call;d['enclosingFunctionEvidence']={'startLine':own['line'],'endLine':own['endLine'],'symbol':own['function'],'method':'Balanced function declaration block with strings/comments/regex masked; nested helper wins; no nearest-ended-function attribution.'}
   d['reason']=d['reason'].replace(old['declaration'],call['declaration'])
   for inp in d['inputs']:
    if isinstance(inp,dict) and 'callerPassage' in inp:
     a=max(1,call['line']-2);b=min(len(ls),call['line']+5);inp['callerPassage']={'startLine':a,'endLine':b,'text':'\n'.join(ls[a-1:b])}
   if 'operationChain' in d:d['operationChain']['caller']=call
 path.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
(P/'step-05-seam4-caller-sweep.json').write_text(json.dumps({'changedCallers':len(changes),'changes':changes},ensure_ascii=False,indent=2)+'\n');print('caller corrections',len(changes))
