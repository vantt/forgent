"""Pin path-yielding operands separately from their enclosing boolean/message operation."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,re
P=pathlib.Path(__file__).resolve().parent
def call(s,pos):
 start=pos;op=s.find('(',pos);depth=0;quote=None;esc=False
 for i in range(op,len(s)):
  c=s[i]
  if esc:esc=False;continue
  if c=='\\':esc=True;continue
  if quote:
   if c==quote:quote=None
   continue
  if c in ['"',"'",'`']:quote=c;continue
  if c=='(':depth+=1
  if c==')':
   depth-=1
   if depth==0:return s[start:i+1]
 return s[start:]
for f in (P/'step-05-records').glob('*.jsonl'):
 rs=[json.loads(l) for l in f.read_text().splitlines()]
 for r in rs:
  for d in r['dynamicTraces']:
   if d['admission']=='REJECT':d.pop('pathOperandWitness',None);continue
   w=d['operationWitness'];n=w['line'];c=d['currentPassage'];line=c['text'].splitlines()[n-c['startLine']];x=d['originalTuple'][4];operand=d['pathOperand'];why='Exact document construction or document input operand.'
   if 'currentPath ===' in x or 'oldPathTraceable' in x or 'isOwnPath =' in x or x.startswith('currentPath ||'):
    h=re.search(r'\b(?:\w+\.)?(?:currentPath|oldPath)\b',line)
    if h:operand=h[0];why='Document path value compared by the enclosing identity probe; the boolean result is not a path.'
   if 'fs.readdirSync(' in operand:
    h=re.search(r'fs\.readdirSync\(\s*(\w+)',operand)
    if h:operand=h[1];why='Document directory passed to the enumerator; its returned entry list is not a path.'
   if x.startswith('`') and re.search(r'\s',x) and '${' in x:
    h=re.search(r'docs/[A-Za-z0-9_./<>-]+',x)
    if h:operand=h[0].rstrip('.');why='Exact fixed document path segment emitted in the message.'
    else:
     h=re.search(r'path\.relative\(',x)
     if h:operand=call(x,h.start());why='Exact relative document path expression interpolated into the message.'
     else:
      h=re.search(r'\$\{(HOW_TO_DOC|REFS_DIR|indexPath|file|manifestPath|docPath|targetPath)\}',x)
      if h:operand=h[1];why='Document path/root value interpolated into the enclosing message; reason records its fixed-root provenance.'
   if d['id']=='dynamic-001827':operand='"CLAUDE.md"';why='Exact root instruction-document member of the source root list.'
   if d['id']=='dynamic-009791':operand="'decisions'";why='Exact relative document-directory alias under docs/ used by the owning scan.'
   if 'exceptionPaths = new Set' in x:operand='e.path';why='Document path member read from the constitution exception list.'
   if 'legacyRoots = ' in x and 'flatMap' in x:operand='r.legacyRoots';why='Document-root list read by the owning membership probe.'
   if d['id']=='dynamic-009791':
    n=next(c['startLine']+i for i,l in enumerate(c['text'].splitlines()) if operand in l);line=c['text'].splitlines()[n-c['startLine']]
   assert operand in line,(r['file'],d['id'],operand,line)
   pos=line.find(operand,w['columnStart']-1)
   if pos<0:pos=line.find(operand)
   d['pathOperand']=operand;d['pathOperandWitness']={'line':n,'columnStart':pos+1,'columnEndExclusive':pos+len(operand)+1,'text':operand,'why':why}
 f.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
